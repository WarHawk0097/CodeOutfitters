import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Meeting } from "../types";
import { getMeeting, listArtifacts, listTranscriptEntries } from "../store";
import { createClient } from "@/lib/supabase/server";
import type { CaptureEventsInput } from "./events";

// Server-side reader for the Recording Events panel. Everything here runs through the
// session-bound authenticated client (RLS is the boundary) exactly like the meeting
// detail page — no service-role reads are needed because capture rows are
// workspace-readable, and the narrow inputs handed to deriveRecordingEvents() carry
// nothing secret by construction.

export type CaptureEventsData = {
  meeting: Pick<Meeting, "id" | "status" | "lastError">;
  events: CaptureEventsInput;
};

function statusOf(error: { code?: string; message: string } | null): void {
  // Mirrors store.ts's throwForPgError shape without duplicating its insert paths —
  // reads here are RLS-bound selects; a failure is a read failure, not a state write.
  if (error) throw new Error("capture-events-read-failed");
}

export async function loadCaptureEvents(
  workspaceId: string,
  meetingId: string,
): Promise<CaptureEventsData | null> {
  // Every read runs through the session-bound authenticated client (RLS is the
  // boundary), exactly like the meeting detail page's own reads.
  const session: SupabaseClient = await createClient();
  const meeting = await getMeeting(workspaceId, meetingId);
  if (!meeting) return null;

  const artifacts = await listArtifacts(workspaceId, meetingId);
  // The capture artifact of the MOST RECENT session: provider_artifact_id starts with
  // the capture prefix (lib/meetings/capture/id.ts). Provider-synced artifacts (a Meet
  // transcript resource name) never collide with it.
  const captureArtifact =
    [...artifacts]
      .filter((a) => a.artifactType === "transcript" && a.providerArtifactId.startsWith("codeoutfitters-capture:"))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;

  const transcript = captureArtifact
    ? await (async () => {
        const { data, error } = await session
          .from("transcripts")
          .select("id, state")
          .eq("workspace_id", workspaceId)
          .eq("meeting_artifact_id", captureArtifact.id)
          .maybeSingle();
        statusOf(error);
        return (data as { id: string; state: string | null } | null) ?? null;
      })()
    : null;

  const entries = transcript ? await listTranscriptEntries(workspaceId, transcript.id) : [];

  // Latest entry timestamp: the last row's created_at, ordered by sequence.
  const lastEntryAt = entries.length > 0 ? (entries[entries.length - 1]?.createdAt ?? null) : null;

  // An existence probe, not a row fetch: the panel only needs to know whether AI
  // analysis has actually run for this meeting (bounded select of one column).
  const { data: insightRows } = await session
    .from("ai_meeting_insights")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("meeting_id", meetingId)
    .limit(1);
  const hasInsights = (insightRows ?? []).length > 0;

  return {
    meeting: { id: meeting.id, status: meeting.status, lastError: meeting.lastError },
    events: {
      meetingStatus: meeting.status,
      meetingLastError: meeting.lastError,
      artifactState: captureArtifact?.state ?? null,
      artifactCreatedAt: captureArtifact?.createdAt ?? null,
      transcriptState: transcript?.state ?? null,
      entryCount: entries.length,
      lastSequence: entries.length > 0 ? (entries[entries.length - 1]?.sequence ?? null) : null,
      lastEntryAt,
      hasInsights,
    },
  };
}
