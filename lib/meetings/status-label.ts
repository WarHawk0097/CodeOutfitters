import type { MeetingStatus } from "./types";

// One wording for each sync state, shared by Lead 360 and the meeting detail screen.
//
// These stay distinct on purpose. "No transcript" and "permission required" have
// different causes and different fixes, and collapsing them into "unavailable" would
// send someone to re-grant a permission they already have — or leave them waiting for a
// transcript Meet was never asked to make. Each string names the actual next step where
// there is one.
export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  pending_sync: "Not synced yet",
  no_transcript: "No transcript — transcription was never started for this meeting",
  transcript_ready: "Transcript ready",
  not_found: "Not found at the provider — it may be outside the 30-day window",
  insufficient_scope: "Permission required — grant the Google Meet permission in Settings",
  revoked: "Access revoked — reconnect the Google account in Settings",
  provider_error: "The provider could not be reached",
};
