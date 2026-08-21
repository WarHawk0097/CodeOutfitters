// GET meetings/[id]/insights — the latest stored Meeting Intelligence and Next
// Presentation Intelligence for one meeting. POST — runs the extraction again against the
// transcript currently on file and stores a new row (older rows are superseded, never
// overwritten; see lib/meetings/ai/store.ts).
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { getMeeting } from "@/lib/meetings/store";
import { analyzeMeeting, getLatestInsights } from "@/lib/meetings/ai/store";
import { MeetingIntelligenceError } from "@/lib/meetings/ai/generate";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Meetings are not available.";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;
  const meeting = await getMeeting(context.workspaceId, id);
  if (!meeting) return jsonError(404, "not_found", "That meeting does not exist.", correlationId);

  return jsonOk({ insights: await getLatestInsights(context.workspaceId, id) }, correlationId);
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;
  // Existence and workspace ownership are proved under RLS before the service-role write
  // path is entered at all — same order as the sync route.
  const meeting = await getMeeting(context.workspaceId, id);
  if (!meeting) return jsonError(404, "not_found", "That meeting does not exist.", correlationId);

  try {
    const result = await analyzeMeeting(context.workspaceId, id, meeting.leadId);
    return jsonOk(
      { hasTranscript: result.hasTranscript, insights: await getLatestInsights(context.workspaceId, id) },
      correlationId,
    );
  } catch (error) {
    if (error instanceof MeetingIntelligenceError) {
      // 409 for "there is nothing to analyse" — the request was well formed, the state
      // was not. 502 for a provider that failed; the message never carries its response.
      return jsonError(
        error.kind === "no_transcript" ? 409 : 502,
        error.kind === "no_transcript" ? "conflict" : "provider_error",
        error.message,
        correlationId,
      );
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
