// GET meetings/[id]/capture-events — the Recording Events panel's polling endpoint.
// Returns ONLY state this app's capture pipeline persisted (artifact/transcript/entries/
// insights), narrowed through lib/meetings/capture/events.ts so no secret, token, or
// internal payload can leak: the body is the safe derived snapshot, not raw rows.
// Session-cookie authenticated (the panel polls from the dashboard, which never holds a
// capture bearer); workspace ownership proved under RLS by getMeeting().
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { loadCaptureEvents } from "@/lib/meetings/capture/events-server";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Meetings are not available.";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;

  try {
    const data = await loadCaptureEvents(context.workspaceId, id);
    if (!data) return jsonError(404, "not_found", "That meeting does not exist.", correlationId);
    // The DERIVED snapshot (phase/recording/entryCount/lastSequence/startedAt/
    // lastError/events) — the exact shape useCaptureEvents consumes. Raw persisted
    // input (artifactState/meetingStatus/…) is never returned: it is the server's
    // derivation input, not the panel's contract.
    return jsonOk(data.snapshot, correlationId);
  } catch {
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
