// POST meetings/capture/audio — transcribes one in-memory tab-audio chunk locally.
// The raw bytes are handed to the local faster-whisper worker and are never stored
// by the route. The resulting text enters the canonical transcript pipeline.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isDemoMode } from "@/lib/command-center/mode";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { resolveCaptureAuth } from "@/lib/supabase/capture-auth";
import { getServiceClient } from "@/lib/integrations/store";
import { CaptureError, ingestEntries } from "@/lib/meetings/capture/server";
import { transcribeAudioChunk } from "@/lib/meetings/capture/transcriber";

export const runtime = "nodejs";
const NOT_AVAILABLE = "Local transcription is unavailable.";
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function statusFor(code: CaptureError["code"]): number {
  switch (code) {
    case "unauthorized": return 401;
    case "forbidden": return 403;
    case "not_found": return 404;
    case "conflict": return 409;
    case "invalid": return 422;
  }
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const auth = await resolveCaptureAuth(bearer);
  if (!auth) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const form = await request.formData().catch(() => null);
  const sessionId = form?.get("sessionId");
  const meetingId = form?.get("meetingId");
  const sequence = Number(form?.get("sequence"));
  const mimeType = String(form?.get("mimeType") || "audio/webm");
  const audio = form?.get("audio");
  if (typeof sessionId !== "string" || typeof meetingId !== "string" || !z.string().uuid().safeParse(sessionId).success || !z.string().uuid().safeParse(meetingId).success || !Number.isInteger(sequence) || sequence < 0 || !(audio instanceof File)) {
    return jsonError(422, "invalid", "That audio request is not valid.", correlationId);
  }
  if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) return jsonError(422, "invalid", "That audio chunk is not valid.", correlationId);

  try {
    const text = await transcribeAudioChunk(await audio.arrayBuffer(), mimeType);
    if (!text) return jsonOk({ accepted: 0, entry: null }, correlationId);
    const result = await ingestEntries(auth.workspaceId, {
      sessionId,
      meetingId,
      entries: [{ sequence, speakerLabel: null, text, capturedAt: new Date().toISOString() }],
    }, { session: getServiceClient() });
    return jsonOk({ ...result, entry: { sequence, speakerLabel: null, text, capturedAt: new Date().toISOString() } }, correlationId);
  } catch (error) {
    if (error instanceof CaptureError) return jsonError(statusFor(error.code), error.code, error.message, correlationId);
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
