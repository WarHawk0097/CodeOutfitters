// POST meetings/capture/entries — ingests a batch of finalized caption entries for an
// active capture session. Idempotent: deterministic provider_entry_ids
// (codeoutfitters-capture:<sessionId>:<sequence>) make a retried batch a no-op under the
// unique(transcript_id, provider_entry_id) constraint. Sequence guard: no entry below or
// equal to the last accepted sequence may be accepted (a reconnect resumes from
// lastSequence). All ownership is re-derived from the bearer-authenticated session.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { resolveCaptureAuth } from "@/lib/supabase/capture-auth";
import { getServiceClient } from "@/lib/integrations/store";
import { CaptureError, ingestEntries } from "@/lib/meetings/capture/server";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Meetings are not available.";

const EntrySchema = z.object({
  sequence: z.number().int().nonnegative(),
  speakerLabel: z.string().max(120).nullable().optional(),
  text: z.string().min(1).max(20_000),
  capturedAt: z.string(),
  languageCode: z.string().max(20).nullable().optional(),
});

const BatchSchema = z.object({
  sessionId: z.string().uuid(),
  meetingId: z.string().uuid(),
  entries: z.array(EntrySchema).max(500),
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
  const parsed = BatchSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "invalid", "That request is not valid.", correlationId);

  try {
    const session = getServiceClient();
    const result = await ingestEntries(auth.workspaceId, parsed.data, { session });
    return jsonOk(result, correlationId);
  } catch (error) {
    if (error instanceof CaptureError) {
      return jsonError(statusFor(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
