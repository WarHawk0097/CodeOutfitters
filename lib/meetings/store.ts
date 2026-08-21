import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Meeting, MeetingArtifact, MeetingProviderId, Transcript, TranscriptEntry } from "./types";

// The one place that reads or writes public.meetings/meeting_artifacts/transcripts/
// transcript_entries through the session-bound `authenticated` client. Mirrors
// lib/integrations/store.ts: every query is workspace-scoped in the SQL itself as
// defense in depth, RLS (20260820000000_meetings_transcripts.sql) is the boundary
// underneath. The service-role side of this domain (fetching from Google, writing
// sync-only columns) lives in sync.ts, not here — this file only ever acts as the
// session's own user, so it can only ever do what that user's grants allow.

export type MeetingErrorCode = "invalid" | "forbidden" | "not_found" | "conflict";

export class MeetingError extends Error {
  constructor(
    public readonly code: MeetingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MeetingError";
  }
}

const MEETING_COLUMNS =
  "id, workspace_id, lead_id, provider, connection_id, provider_space_id, provider_conference_record_id, title, scheduled_start, status, last_synced_at, last_error, created_by, created_at, updated_at";

type MeetingRow = {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  provider: MeetingProviderId;
  connection_id: string;
  provider_space_id: string;
  provider_conference_record_id: string | null;
  title: string | null;
  scheduled_start: string | null;
  status: Meeting["status"];
  last_synced_at: string | null;
  last_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

function toMeeting(row: MeetingRow): Meeting {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    provider: row.provider,
    connectionId: row.connection_id,
    providerSpaceId: row.provider_space_id,
    providerConferenceRecordId: row.provider_conference_record_id,
    title: row.title,
    scheduledStart: row.scheduled_start,
    status: row.status,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function throwForPgError(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new MeetingError("conflict", "This space is already linked in this workspace.");
  if (error.code === "42501") throw new MeetingError("forbidden", "You do not have permission to do that.");
  throw new MeetingError("invalid", "That meeting request could not be completed.");
}

export async function listMeetings(workspaceId: string, leadId?: string): Promise<Meeting[]> {
  const supabase = await createClient();
  let query = supabase.from("meetings").select(MEETING_COLUMNS).eq("workspace_id", workspaceId);
  if (leadId) query = query.eq("lead_id", leadId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throwForPgError(error);
  return (data ?? []).map((row) => toMeeting(row as MeetingRow));
}

export async function getMeeting(workspaceId: string, meetingId: string): Promise<Meeting | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("id", meetingId)
    .maybeSingle();
  if (error) throwForPgError(error);
  return data ? toMeeting(data as MeetingRow) : null;
}

/** Links an existing Google Meet space to this workspace (and optionally a Lead).
 *  Never creates a Meet space — see lib/meetings/provider.ts's header on
 *  capabilities.conferenceCreation. */
export async function linkMeeting(
  workspaceId: string,
  input: { provider: MeetingProviderId; connectionId: string; providerSpaceId: string; leadId?: string; title?: string },
): Promise<Meeting> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      workspace_id: workspaceId,
      lead_id: input.leadId ?? null,
      provider: input.provider,
      connection_id: input.connectionId,
      provider_space_id: input.providerSpaceId,
      title: input.title ?? null,
    })
    .select(MEETING_COLUMNS)
    .single();
  if (error) throwForPgError(error);
  return toMeeting(data as MeetingRow);
}

/** Only the two fields authenticated actually has an UPDATE grant on — see the
 *  migration's header. Every sync-derived field (status, last_error, ...) is written
 *  exclusively by sync.ts's service-role client. */
export async function updateMeeting(
  workspaceId: string,
  meetingId: string,
  patch: { title?: string | null; leadId?: string | null },
): Promise<Meeting> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.leadId !== undefined ? { lead_id: patch.leadId } : {}),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", meetingId)
    .select(MEETING_COLUMNS)
    .single();
  if (error) throwForPgError(error);
  if (!data) throw new MeetingError("not_found", "That meeting does not exist.");
  return toMeeting(data as MeetingRow);
}

type ArtifactRow = {
  id: string;
  meeting_id: string;
  workspace_id: string;
  artifact_type: MeetingArtifact["artifactType"];
  provider_artifact_id: string;
  state: string | null;
  docs_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function listArtifacts(workspaceId: string, meetingId: string): Promise<MeetingArtifact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_artifacts")
    .select("id, meeting_id, workspace_id, artifact_type, provider_artifact_id, state, docs_url, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });
  if (error) throwForPgError(error);
  return (data ?? []).map((row) => {
    const r = row as ArtifactRow;
    return {
      id: r.id,
      meetingId: r.meeting_id,
      workspaceId: r.workspace_id,
      artifactType: r.artifact_type,
      providerArtifactId: r.provider_artifact_id,
      state: r.state,
      docsUrl: r.docs_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

type TranscriptRow = {
  id: string;
  meeting_artifact_id: string;
  workspace_id: string;
  state: string | null;
  transcript_start: string | null;
  transcript_end: string | null;
  fetched_at: string;
  created_at: string;
};

export async function getTranscriptForArtifact(workspaceId: string, meetingArtifactId: string): Promise<Transcript | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transcripts")
    .select("id, meeting_artifact_id, workspace_id, state, transcript_start, transcript_end, fetched_at, created_at")
    .eq("workspace_id", workspaceId)
    .eq("meeting_artifact_id", meetingArtifactId)
    .maybeSingle();
  if (error) throwForPgError(error);
  if (!data) return null;
  const r = data as TranscriptRow;
  return {
    id: r.id,
    meetingArtifactId: r.meeting_artifact_id,
    workspaceId: r.workspace_id,
    state: r.state,
    transcriptStart: r.transcript_start,
    transcriptEnd: r.transcript_end,
    fetchedAt: r.fetched_at,
    createdAt: r.created_at,
  };
}

type EntryRow = {
  id: string;
  transcript_id: string;
  workspace_id: string;
  provider_entry_id: string;
  speaker_label: string | null;
  sequence: number;
  start_time: string | null;
  end_time: string | null;
  language_code: string | null;
  text: string;
  created_at: string;
};

export async function listTranscriptEntries(workspaceId: string, transcriptId: string): Promise<TranscriptEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transcript_entries")
    .select(
      "id, transcript_id, workspace_id, provider_entry_id, speaker_label, sequence, start_time, end_time, language_code, text, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("transcript_id", transcriptId)
    .order("sequence", { ascending: true });
  if (error) throwForPgError(error);
  return (data ?? []).map((row) => {
    const r = row as EntryRow;
    return {
      id: r.id,
      transcriptId: r.transcript_id,
      workspaceId: r.workspace_id,
      providerEntryId: r.provider_entry_id,
      speakerLabel: r.speaker_label,
      sequence: r.sequence,
      startTime: r.start_time,
      endTime: r.end_time,
      languageCode: r.language_code,
      text: r.text,
      createdAt: r.created_at,
    };
  });
}
