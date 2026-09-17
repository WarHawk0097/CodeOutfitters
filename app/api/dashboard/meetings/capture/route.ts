// POST meetings/capture — starts a CodeOutfitters Meeting Capture session.
//
// Authenticated by bearer token (the extension reads the app's httpOnly:false session
// cookie via chrome.cookies and sends it as Authorization: Bearer — the SameSite=Lax
// dashboard cookie is never sent on the cross-origin extension fetch). Workspace and user
// are derived from that token ONLY; a browser-supplied workspace_id/user_id is never
// accepted. Ownership of the linked meeting is proven through the authenticated client
// under RLS before any service-role write.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { resolveCaptureAuth } from "@/lib/supabase/capture-auth";
import { getServiceClient } from "@/lib/integrations/store";
import { CaptureError, startCapture } from "@/lib/meetings/capture/server";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Meetings are not available.";

const StartSchema = z.object({
  provider: z.literal("google_meet"),
  providerSpaceId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  leadId: z.string().uuid().optional(),
  resumeSessionId: z.string().uuid().optional(),
  acquisitionStrategy: z.enum(["browser_captions", "browser_audio"]),
});

function startValidationCode(error: z.ZodError): string {
  const paths = new Set(error.issues.map((issue) => String(issue.path[0] ?? "")));
  if (paths.has("provider")) return "CAPTURE_START_PROVIDER_INVALID";
  if (paths.has("acquisitionStrategy")) return "CAPTURE_START_STRATEGY_INVALID";
  if (paths.has("providerSpaceId")) return "CAPTURE_START_SPACE_REQUIRED";
  return "CAPTURE_START_VALIDATION_FAILED";
}

function statusFor(code: CaptureError["code"]): number {
  switch (code) {
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "invalid":
      return 422;
  }
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const auth = await resolveCaptureAuth(bearer);
  if (!auth) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const body = await request.json().catch(() => null);
  const parsed = StartSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, startValidationCode(parsed.error), "That request is not valid.", correlationId);

  try {
    const session = getServiceClient();
    const result = await startCapture(auth.workspaceId, auth.userId, parsed.data, { session });
    return jsonOk(result, correlationId);
  } catch (error) {
    if (error instanceof CaptureError) {
      return jsonError(statusFor(error.code), error.safeCode ?? error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
