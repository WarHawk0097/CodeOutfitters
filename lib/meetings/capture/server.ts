import "server-only";
import { randomUUID } from "node:crypto";
import { getServiceClient } from "@/lib/integrations/store";
import type { SupabaseClient } from "@supabase/supabase-js";
import { captureArtifactId, captureEntryId } from "./id";
import type { CaptureBatchRequest, CaptureBatchResponse, CaptureStartRequest, CaptureStartResponse, CaptureStatus, CaptureStopResponse } from "./types";

// Server-side capture orchestration. Mirrors the sync.ts discipline exactly: the
// signed capture credential proves identity at the route boundary, then the server-only
// service client performs strictly workspace-scoped reads/writes. The service key never
// leaves the server and is never issued to the extension.
//
// Idempotency is structural: artifact id = "codeoutfitters-capture:<sessionId>" satisfies
// unique(meeting_id, provider_artifact_id); entry id =
// "codeoutfitters-capture:<sessionId>:<sequence>" satisfies unique(transcript_id,
// provider_entry_id). A retried batch inserts nothing new; a reconnecting extension with
// the same sessionId re-finds the same rows; sequence <= last accepted is rejected.

export type CaptureStoreDeps = {
  session: SupabaseClient;
};

const MEETING_SELECT =
  "id, workspace_id, lead_id, provider, connection_id, provider_space_id, provider_conference_record_id, title, scheduled_start, status, last_synced_at, last_error, created_by, created_at, updated_at";

export class CaptureError extends Error {
  constructor(
    public readonly code: "unauthorized" | "forbidden" | "not_found" | "conflict" | "invalid",
    message: string,
    public readonly safeCode?: string,
  ) {
    super(message);
    this.name = "CaptureError";
  }
}

export async function startCapture(
  workspaceId: string,
  userId: string,
  input: CaptureStartRequest,
  deps: CaptureStoreDeps,
): Promise<CaptureStartResponse> {
  const session = deps.session;
  const service = getServiceClient();
  const captureSource = input.acquisitionStrategy ?? "browser_captions";

  // Normalize the Meet space id: accept the bare code OR a full meet.google.com URL.
  const providerSpaceId = parseProviderSpaceId(input.providerSpaceId);
  if (!providerSpaceId) throw new CaptureError("invalid", "That does not look like a Google Meet space id.", "CAPTURE_START_SPACE_REQUIRED");

  // Resuming: an existing capture artifact for this session wins, so a reconnect never
  // forks the transcript. The sessionId is client-generated but NOT owner-trusted — the
  // lookup below is scoped to (workspace, meeting) and a sessionId that does not match
  // an artifact the workspace owns is simply a new session.
  const resumeSessionId = input.resumeSessionId;
  if (resumeSessionId) {
    const resumed = await findResumable(workspaceId, resumeSessionId, session);
    if (resumed) {
      // Confirm the meeting still belongs to this workspace (RLS-scoped re-read).
      const { data: meeting } = await session
        .from("meetings")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("id", resumed.meetingId)
        .maybeSingle();
      if (meeting) {
        return {
          meetingId: resumed.meetingId,
          sessionId: resumeSessionId,
          artifactId: resumed.artifactId,
          transcriptId: resumed.transcriptId,
          resume: true,
          status: resumed.status,
        };
      }
    }
  }

  // Find-or-create the meeting. Look up by the canonical unique key first; if absent,
  // create. connection_id is nullable for capture meetings (no Google credential).
  const { data: existingMeeting } = await session
    .from("meetings")
    .select(MEETING_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("provider", "google_meet")
    .eq("provider_space_id", providerSpaceId)
    .maybeSingle();

  let meetingId: string;
  if (existingMeeting) {
    meetingId = existingMeeting.id;
    // Link the requested lead if the meeting has none yet and the caller asked for one.
    if (input.leadId && !existingMeeting.lead_id) {
      await session.from("meetings").update({ lead_id: input.leadId }).eq("id", meetingId);
    }
  } else {
    const sessionId = randomUUID();
    const artifactId = captureArtifactId(sessionId);
    const transcriptId = randomUUID();

    // 1. Meeting (session client, RLS enforces workspace + created_by).
    const { data: meeting, error: meetingError } = await session
      .from("meetings")
      .insert({
        workspace_id: workspaceId,
        lead_id: input.leadId ?? null,
        provider: "google_meet",
        connection_id: null,
        provider_space_id: providerSpaceId,
        title: input.title ?? null,
        created_by: userId,
      })
      .select(MEETING_SELECT)
      .single();
    if (meetingError) throw mapInsertError(meetingError);
    meetingId = meeting.id;

    // 2. Artifact (service-role — authenticated has no insert grant here).
    const { data: artifact, error: artifactError } = await service
      .from("meeting_artifacts")
      .insert({
        meeting_id: meetingId,
        workspace_id: workspaceId,
        artifact_type: "transcript",
        provider_artifact_id: artifactId,
        capture_source: captureSource,
        state: "capture_active",
      })
      .select("id")
      .single();
    if (artifactError || !artifact) throw mapPersistenceError("ARTIFACT", artifactError);

    // 3. Transcript row (service-role).
    const { error: transcriptError } = await service
      .from("transcripts")
      .insert({
        id: transcriptId,
        meeting_artifact_id: artifact.id,
        workspace_id: workspaceId,
        state: "capture_active",
        fetched_at: new Date().toISOString(),
      });
    if (transcriptError) throw mapPersistenceError("TRANSCRIPT", transcriptError);

    return {
      meetingId,
      sessionId,
      artifactId: artifact.id,
      transcriptId,
      resume: false,
      status: "capture_active",
    };
  }

  // Existing meeting, no resume session: start a NEW capture session for it.
  const sessionId = randomUUID();
  const artifactId = captureArtifactId(sessionId);
  const transcriptId = randomUUID();

  const { data: artifact, error: artifactError } = await service
    .from("meeting_artifacts")
    .insert({
      meeting_id: meetingId,
      workspace_id: workspaceId,
      artifact_type: "transcript",
      provider_artifact_id: artifactId,
      capture_source: captureSource,
      state: "capture_active",
    })
    .select("id")
    .single();
  if (artifactError || !artifact) throw mapPersistenceError("ARTIFACT", artifactError);

  const { error: transcriptError } = await service
    .from("transcripts")
    .insert({
      id: transcriptId,
      meeting_artifact_id: artifact.id,
      workspace_id: workspaceId,
      state: "capture_active",
      fetched_at: new Date().toISOString(),
    });
  if (transcriptError) throw mapPersistenceError("TRANSCRIPT", transcriptError);

  return {
    meetingId,
    sessionId,
    artifactId: artifact.id,
    transcriptId,
    resume: false,
    status: "capture_active",
  };
}

export async function ingestEntries(
  workspaceId: string,
  input: CaptureBatchRequest,
  deps: CaptureStoreDeps,
): Promise<CaptureBatchResponse> {
  const session = deps.session;
  const service = getServiceClient();

  // The session owns the artifact + transcript (RLS-scoped read through the session
  // client); the meeting must belong to the workspace too.
  const artifactId = captureArtifactId(input.sessionId);
  const { data: artifact } = await session
    .from("meeting_artifacts")
    .select("id, state")
    .eq("workspace_id", workspaceId)
    .eq("meeting_id", input.meetingId)
    .eq("provider_artifact_id", artifactId)
    .maybeSingle();
  if (!artifact) throw new CaptureError("not_found", "That capture session does not exist.");
  if (artifact.state === "capture_complete") throw new CaptureError("conflict", "That capture is already finished.");

  const { data: transcript } = await session
    .from("transcripts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("meeting_artifact_id", artifact.id)
    .maybeSingle();
  if (!transcript) throw new CaptureError("not_found", "That capture transcript does not exist.");

  if (input.entries.length === 0) {
    return { accepted: 0, lastSequence: await lastSequence(service, workspaceId, transcript.id) };
  }

  // Reject out-of-order sequences: every entry must be strictly above the current max.
  const currentMax = await lastSequence(service, workspaceId, transcript.id);
  const minIncoming = Math.min(...input.entries.map((entry) => entry.sequence));
  if (minIncoming <= currentMax) {
    // A pure retry of an already-accepted batch is a no-op, not an error: if every
    // incoming sequence is already persisted, return the current state.
    const allPersisted = (
      await Promise.all(
        input.entries.map(async (entry) => {
          const { data } = await service
            .from("transcript_entries")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("transcript_id", transcript.id)
            .eq("provider_entry_id", captureEntryId(input.sessionId, entry.sequence))
            .maybeSingle();
          return Boolean(data);
        }),
      )
    ).every(Boolean);
    if (allPersisted) return { accepted: 0, lastSequence: currentMax };
    throw new CaptureError("conflict", "Incoming sequences overlap an accepted batch.");
  }

  const rows = input.entries.map((entry) => ({
    transcript_id: transcript.id,
    workspace_id: workspaceId,
    provider_entry_id: captureEntryId(input.sessionId, entry.sequence),
    speaker_label: entry.speakerLabel ?? null,
    sequence: entry.sequence,
    start_time: entry.capturedAt,
    end_time: entry.capturedAt,
    language_code: entry.languageCode ?? null,
    text: entry.text,
  }));

  const { error } = await service.from("transcript_entries").insert(rows);
  if (error) {
    if (error.code === "23505") {
      // Unique violation on a batch boundary — treat as already-accepted (idempotent).
      return { accepted: 0, lastSequence: await lastSequence(service, workspaceId, transcript.id) };
    }
    throw new CaptureError("invalid", "The capture entries could not be stored.");
  }

  return { accepted: rows.length, lastSequence: await lastSequence(service, workspaceId, transcript.id) };
}

export async function stopCapture(
  workspaceId: string,
  sessionId: string,
  meetingId: string,
  deps: CaptureStoreDeps,
): Promise<CaptureStopResponse> {
  const session = deps.session;
  const service = getServiceClient();

  const artifactId = captureArtifactId(sessionId);
  const { data: artifact } = await session
    .from("meeting_artifacts")
    .select("id, state")
    .eq("workspace_id", workspaceId)
    .eq("meeting_id", meetingId)
    .eq("provider_artifact_id", artifactId)
    .maybeSingle();
  if (!artifact) throw new CaptureError("not_found", "That capture session does not exist.");

  const { data: transcript } = await session
    .from("transcripts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("meeting_artifact_id", artifact.id)
    .maybeSingle();
  if (!transcript) throw new CaptureError("not_found", "That capture transcript does not exist.");

  const entryCount = await lastSequence(service, workspaceId, transcript.id);

  const { error: artifactError } = await service
    .from("meeting_artifacts")
    .update({ state: "capture_complete" })
    .eq("workspace_id", workspaceId)
    .eq("id", artifact.id);
  if (artifactError) throw new CaptureError("invalid", "The capture could not be finalized.");

  const { error: transcriptError } = await service
    .from("transcripts")
    .update({ state: "capture_complete" })
    .eq("workspace_id", workspaceId)
    .eq("id", transcript.id);
  if (transcriptError) throw new CaptureError("invalid", "The capture could not be finalized.");

  // The meeting's own status reflects "a transcript exists" — sync-derived fields are
  // service-role writable (same as sync.ts's setStatus). A capture meeting is not
  // provider-synced, so transcript_ready is the honest terminal state.
  const { error: meetingError } = await service
    .from("meetings")
    .update({ status: entryCount > 0 ? "transcript_ready" : "no_transcript", last_synced_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", meetingId);
  if (meetingError) throw new CaptureError("invalid", "The capture could not be finalized.");

  return { meetingId, sessionId, status: "capture_complete", entryCount };
}

async function lastSequence(
  service: SupabaseClient,
  workspaceId: string,
  transcriptId: string,
): Promise<number> {
  const { data } = await service
    .from("transcript_entries")
    .select("sequence")
    .eq("workspace_id", workspaceId)
    .eq("transcript_id", transcriptId)
    .order("sequence", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { sequence: number } | null)?.sequence ?? 0;
}

async function findResumable(
  workspaceId: string,
  sessionId: string,
  session: SupabaseClient,
): Promise<{ meetingId: string; artifactId: string; transcriptId: string; status: CaptureStatus } | null> {
  const artifactId = captureArtifactId(sessionId);
  const { data: artifact } = await session
    .from("meeting_artifacts")
    .select("id, meeting_id, state, provider_artifact_id")
    .eq("workspace_id", workspaceId)
    .eq("provider_artifact_id", artifactId)
    .maybeSingle();
  if (!artifact) return null;

  const { data: transcript } = await session
    .from("transcripts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("meeting_artifact_id", artifact.id)
    .maybeSingle();
  if (!transcript) return null;

  return {
    meetingId: artifact.meeting_id,
    artifactId: artifact.id,
    transcriptId: transcript.id,
    status: artifact.state as CaptureStatus,
  };
}

function parseProviderSpaceId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Bare code: abc-defg-hij
  if (/^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/.test(trimmed)) return trimmed;
  // Full Meet URL.
  const match = trimmed.match(/meet\.google\.com\/([a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3})/i);
  return match ? match[1]! : null;
}

function mapInsertError(error: { code?: string; message: string }): CaptureError {
  if (error.code === "23505") return new CaptureError("conflict", "This space is already linked in this workspace.");
  if (error.code === "23502" || error.code === "42703" || error.code === "42P01" || error.code === "PGRST205") {
    return new CaptureError("invalid", "The meeting could not be created.", "CAPTURE_START_MEETING_SCHEMA_MISMATCH");
  }
  if (error.code === "23503") {
    return new CaptureError("invalid", "The meeting could not be created.", "CAPTURE_START_MEETING_WORKSPACE_INVALID");
  }
  if (error.code === "23514") {
    return new CaptureError("invalid", "The meeting could not be created.", "CAPTURE_START_MEETING_CONSTRAINT_FAILED");
  }
  return new CaptureError("invalid", "The meeting could not be created.", "CAPTURE_START_MEETING_INSERT_FAILED");
}

function mapPersistenceError(
  stage: "ARTIFACT" | "TRANSCRIPT",
  error: { code?: string; message?: string } | null,
): CaptureError {
  const prefix = `CAPTURE_START_${stage}`;
  const code = error?.code;
  if (code === "23505") return new CaptureError("conflict", "A capture for this meeting is already running.", `${prefix}_ALREADY_EXISTS`);
  if (code === "23502" || code === "42703" || code === "42P01" || code === "PGRST205") {
    return new CaptureError("invalid", "The capture could not be started.", `${prefix}_SCHEMA_MISMATCH`);
  }
  if (code === "23503") return new CaptureError("invalid", "The capture could not be started.", `${prefix}_WORKSPACE_INVALID`);
  if (code === "23514") return new CaptureError("invalid", "The capture could not be started.", `${prefix}_CONSTRAINT_FAILED`);
  return new CaptureError("invalid", "The capture could not be started.", `${prefix}_INSERT_FAILED`);
}
