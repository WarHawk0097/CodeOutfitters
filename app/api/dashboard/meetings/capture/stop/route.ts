// POST meetings/capture/stop — finalizes an active capture session. Idempotent: stopping
// an already-complete session returns its current state instead of erroring. Ownership is
// bearer-authenticated; the artifact/transcript/meeting are all re-verified workspace-
// scoped before the service-role finalize writes.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { resolveCaptureAuth } from "@/lib/supabase/capture-auth";
import { getServiceClient } from "@/lib/integrations/store";
import { CaptureError, stopCapture } from "@/lib/meetings/capture/server";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Meetings are not available.";

const StopSchema = z.object({
  sessionId: z.string().uuid(),
  meetingId: z.string().uuid(),
});

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
  const parsed = StopSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "invalid", "That request is not valid.", correlationId);

  try {
    const session = getServiceClient();
    const result = await stopCapture(auth.workspaceId, parsed.data.sessionId, parsed.data.meetingId, { session });
    return jsonOk(result, correlationId);
  } catch (error) {
    if (error instanceof CaptureError) {
      return jsonError(statusFor(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
