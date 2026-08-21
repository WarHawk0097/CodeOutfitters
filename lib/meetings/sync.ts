import "server-only";
import { decryptCredential } from "@/lib/integrations/crypto";
import { getServiceClient, refreshConnection } from "@/lib/integrations/store";
import type { ProviderCredentials } from "@/lib/integrations/provider";
import { getMeetingProviderAdapter } from "./registry";
import { MeetingProviderError } from "./provider";
import type { MeetingProviderErrorKind } from "./provider";
import type { MeetingStatus } from "./types";

// Service-role sync orchestration — the one place credential_ciphertext of the
// underlying google_calendar connection is read to reach Google on a meeting's
// behalf. Mirrors lib/integrations/store.ts's loadForServiceOp/refreshConnection
// pattern (that function isn't exported, so the same small select is restated here,
// same "belt and suspenders" workspace_id + id filter). Never called from a session
// request handler directly with user-supplied ids beyond workspaceId/meetingId — the
// caller (an API route) is responsible for that boundary.

const STATUS_FOR_ERROR_KIND: Record<MeetingProviderErrorKind, MeetingStatus> = {
  not_found: "not_found",
  insufficient_scope: "insufficient_scope",
  revoked: "revoked",
  provider_error: "provider_error",
};

type MeetingSyncRow = {
  id: string;
  workspace_id: string;
  provider: "google_meet";
  connection_id: string;
  provider_space_id: string;
};

async function loadCredentials(connectionId: string, workspaceId: string): Promise<ProviderCredentials | null> {
  const service = getServiceClient();
  const { data, error } = await service
    .from("integration_connections")
    .select("status, credential_ciphertext")
    .eq("workspace_id", workspaceId)
    .eq("id", connectionId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { status: string; credential_ciphertext: string | null };
  if (row.status === "disconnected" || !row.credential_ciphertext) return null;
  return JSON.parse(decryptCredential(row.credential_ciphertext)) as ProviderCredentials;
}

async function setStatus(meetingId: string, status: MeetingStatus, lastError: string | null): Promise<void> {
  const service = getServiceClient();
  await service
    .from("meetings")
    .update({ status, last_error: lastError, last_synced_at: new Date().toISOString() })
    .eq("id", meetingId);
}

/** Pulls the conference record, artifacts, and (for the first ready transcript)
 *  entries for one meeting, and writes an honest status — never "error" as a
 *  catch-all; always the specific MeetingStatus the failure actually was. */
export async function syncMeeting(workspaceId: string, meetingId: string): Promise<void> {
  const service = getServiceClient();
  const { data, error } = await service
    .from("meetings")
    .select("id, workspace_id, provider, connection_id, provider_space_id")
    .eq("workspace_id", workspaceId)
    .eq("id", meetingId)
    .maybeSingle();
  if (error || !data) return;
  const meeting = data as MeetingSyncRow;

  const adapter = await getMeetingProviderAdapter(meeting.provider);

  let credentials = await loadCredentials(meeting.connection_id, workspaceId);
  if (!credentials) {
    await setStatus(meeting.id, "revoked", "The connected Google account is disconnected.");
    return;
  }

  try {
    await runSync(adapter, meeting, credentials);
  } catch (err) {
    if (!(err instanceof MeetingProviderError) || err.kind !== "revoked") {
      await setStatus(meeting.id, statusFor(err), messageFor(err));
      return;
    }
    // Access token expired — refresh the underlying connection once and retry once.
    // Never loop: a second revoked error is reported, not retried again.
    try {
      await refreshConnection(workspaceId, meeting.connection_id);
    } catch {
      await setStatus(meeting.id, "revoked", "The connected Google account's credentials could not be refreshed.");
      return;
    }
    credentials = await loadCredentials(meeting.connection_id, workspaceId);
    if (!credentials) {
      await setStatus(meeting.id, "revoked", "The connected Google account is disconnected.");
      return;
    }
    try {
      await runSync(adapter, meeting, credentials);
    } catch (retryErr) {
      await setStatus(meeting.id, statusFor(retryErr), messageFor(retryErr));
    }
  }
}

function statusFor(err: unknown): MeetingStatus {
  return err instanceof MeetingProviderError ? STATUS_FOR_ERROR_KIND[err.kind] : "provider_error";
}

function messageFor(err: unknown): string {
  return err instanceof MeetingProviderError ? err.message : "The provider could not be reached.";
}

async function runSync(
  adapter: Awaited<ReturnType<typeof getMeetingProviderAdapter>>,
  meeting: MeetingSyncRow,
  credentials: ProviderCredentials,
): Promise<void> {
  const service = getServiceClient();
  const record = await adapter.getConferenceRecord({ accessToken: credentials.accessToken }, meeting.provider_space_id);

  await service
    .from("meetings")
    .update({ provider_conference_record_id: record.providerConferenceRecordId })
    .eq("id", meeting.id);

  const artifacts = await adapter.listArtifacts({ accessToken: credentials.accessToken }, record.providerConferenceRecordId);

  let anyTranscriptEntries = false;
  for (const artifact of artifacts) {
    const { data: artifactRow, error: artifactError } = await service
      .from("meeting_artifacts")
      .upsert(
        {
          meeting_id: meeting.id,
          workspace_id: meeting.workspace_id,
          artifact_type: artifact.artifactType,
          provider_artifact_id: artifact.providerArtifactId,
          state: artifact.state,
          docs_url: artifact.docsUrl,
        },
        { onConflict: "meeting_id,provider_artifact_id" },
      )
      .select("id")
      .single();
    if (artifactError || !artifactRow) continue;

    if (artifact.artifactType !== "transcript") continue;

    const entries = await adapter.getTranscriptEntries({ accessToken: credentials.accessToken }, artifact.providerArtifactId);

    const { data: transcriptRow, error: transcriptError } = await service
      .from("transcripts")
      .upsert(
        {
          meeting_artifact_id: (artifactRow as { id: string }).id,
          workspace_id: meeting.workspace_id,
          state: artifact.state,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "meeting_artifact_id" },
      )
      .select("id")
      .single();
    if (transcriptError || !transcriptRow) continue;
    const transcriptId = (transcriptRow as { id: string }).id;

    // Delete-then-reinsert: simpler and more robust to Google reordering/renumbering
    // entries between syncs than diffing would be — see lib/meetings/store.ts's header
    // reasoning for the same tradeoff.
    await service.from("transcript_entries").delete().eq("transcript_id", transcriptId);
    if (entries.length > 0) {
      anyTranscriptEntries = true;
      await service.from("transcript_entries").insert(
        entries.map((entry) => ({
          transcript_id: transcriptId,
          workspace_id: meeting.workspace_id,
          provider_entry_id: entry.providerEntryId,
          speaker_label: entry.speakerLabel,
          sequence: entry.sequence,
          start_time: entry.startTime,
          end_time: entry.endTime,
          language_code: entry.languageCode,
          text: entry.text,
        })),
      );
    }
  }

  await setStatus(meeting.id, anyTranscriptEntries ? "transcript_ready" : "no_transcript", null);
}
