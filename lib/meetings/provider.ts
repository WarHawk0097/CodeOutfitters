import "server-only";
import type { MeetingProviderId } from "./types";

// The meeting-provider contract. Same role as lib/integrations/provider.ts and
// lib/ai/provider/types.ts: the seam that keeps a second provider (Zoom, Microsoft
// Teams) from rebuilding this instead of satisfying one interface. Adding a provider is
// one module + one registry.ts line, no caller change.
//
// Deliberately does NOT own credential lifecycle (refresh/revoke/disconnect) — that is
// already lib/integrations/provider.ts's job for whatever connection this meeting's
// credential comes from (google_meet reuses the existing "google_calendar" connection;
// see providers/google-meet.ts). A second refresh/disconnect path here would mean two
// places able to mutate the same integration_connections row, which is the exact
// duplication Master Goal Phase 2.5 already rejected once for Gmail. A caller that needs
// a fresh access token calls lib/integrations/store.ts's refreshConnection() first, then
// passes the resulting token in here — this interface only ever reads a meeting.
//
// Also deliberately does NOT assume conference creation is possible: google_meet's
// capabilities.conferenceCreation is false this phase (no meetings.space.created scope
// has been requested — see providers/google-meet.ts's header). A meeting is created by
// a user linking an existing Meet space to a Lead, not by this adapter creating one.

export type MeetingProviderCapabilities = {
  /** Can this adapter create a new meeting space, vs. only read one the user already
   *  has? False until the app requests a write scope for this provider. */
  conferenceCreation: boolean;
  /** Can this adapter fetch a structured transcript at all? */
  transcript: boolean;
  /** Can this adapter fetch a recording artifact reference? */
  recording: boolean;
};

/** A minimal, read-only view of a provider's conference — enough to update
 *  meetings.status and provider_conference_record_id, never more than that. */
export type ProviderConferenceRecord = {
  providerConferenceRecordId: string;
  startTime: string | null;
  endTime: string | null;
  /** The provider's own join link for this space, when it has one. */
  joinUrl: string | null;
};

export type ProviderArtifactRef = {
  artifactType: "transcript" | "recording";
  providerArtifactId: string;
  state: string | null;
  docsUrl: string | null;
};

export type ProviderTranscriptEntry = {
  providerEntryId: string;
  speakerLabel: string | null;
  sequence: number;
  startTime: string | null;
  endTime: string | null;
  languageCode: string | null;
  text: string;
};

/** Every failure this adapter can report, distinct enough that a caller can set an
 *  honest meetings.status from it rather than collapsing everything into "error". Mirrors
 *  the MeetingStatus failure values in lib/meetings/types.ts one-for-one. */
export type MeetingProviderErrorKind =
  | "not_found"
  | "insufficient_scope"
  | "revoked"
  | "provider_error";

export class MeetingProviderError extends Error {
  constructor(
    public readonly provider: MeetingProviderId,
    public readonly kind: MeetingProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "MeetingProviderError";
  }
}

/** Access token only — never a refresh token, which this interface has no use for (see
 *  header). Callers pass an already-valid token; refreshing it is not this layer's job. */
export type MeetingProviderCredentials = {
  accessToken: string;
};

export interface MeetingProviderAdapter {
  readonly id: MeetingProviderId;
  readonly capabilities: MeetingProviderCapabilities;

  /** Resolves a user-supplied provider space id to its current conference record, if the
   *  provider has one on file. Throws MeetingProviderError('not_found', ...) if the space
   *  has never met, or if the provider's retention window (Google Meet: ~30 days) has
   *  already expired — those two causes are indistinguishable from the API response and
   *  this method does not pretend otherwise. */
  getConferenceRecord(
    credentials: MeetingProviderCredentials,
    providerSpaceId: string,
  ): Promise<ProviderConferenceRecord>;

  /** Lists artifacts (transcripts, recordings) attached to a conference record. Returns
   *  an empty array — not an error — when the conference has no artifacts, which is the
   *  ordinary case for a meeting where transcription was never started. */
  listArtifacts(
    credentials: MeetingProviderCredentials,
    providerConferenceRecordId: string,
  ): Promise<readonly ProviderArtifactRef[]>;

  /** Fetches every entry of one transcript artifact, in provider order. Only called when
   *  capabilities.transcript is true and the artifact's state indicates it is ready. */
  getTranscriptEntries(
    credentials: MeetingProviderCredentials,
    providerArtifactId: string,
  ): Promise<readonly ProviderTranscriptEntry[]>;
}
