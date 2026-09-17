// Deterministic ids for CodeOutfitters capture artifacts and transcript entries.
//
// The uniqueness constraints they slot into (from 20260820000000_meetings_transcripts.sql):
//   meeting_artifacts:  unique (meeting_id, provider_artifact_id)
//   transcript_entries: unique (transcript_id, provider_entry_id)
//
// Because every id is a pure function of (sessionId, sequence), retrying a batch after a
// network failure produces the same ids and the ON CONFLICT path no-ops instead of
// duplicating rows; reconnecting the extension with the same sessionId re-finds the same
// artifact/transcript instead of forking it.
//
// Prefix "codeoutfitters-capture" is deliberately NOT "google-meet": acquisition source
// (browser capture) is distinct from the meeting provider (google_meet). The artifact's
// capture_source column records which acquisition path produced it.

export const CAPTURE_ID_PREFIX = "codeoutfitters-capture";

export function captureArtifactId(sessionId: string): string {
  return `${CAPTURE_ID_PREFIX}:${sessionId}`;
}

export function captureEntryId(sessionId: string, sequence: number): string {
  return `${CAPTURE_ID_PREFIX}:${sessionId}:${sequence}`;
}

export function isCaptureArtifactId(providerArtifactId: string): boolean {
  return providerArtifactId.startsWith(`${CAPTURE_ID_PREFIX}:`);
}

export function sessionIdFromArtifactId(providerArtifactId: string): string | null {
  if (!isCaptureArtifactId(providerArtifactId)) return null;
  return providerArtifactId.slice(CAPTURE_ID_PREFIX.length + 1);
}