// The meeting domain model. Mirrors supabase/migrations/20260820000000_meetings_transcripts.sql
// exactly — a field here with no column there (or vice versa) is a bug, not a style choice.
// Same split as lib/integrations/types.ts vs. provider.ts: nothing here ever holds a
// credential, so this module is safe to import from a client component.

// Mirrors the meeting_provider enum. zoom/microsoft_teams are storage-neutral: no
// adapter is registered for either (lib/meetings/registry.ts) and the link API accepts
// only google_meet, so a row can never carry one yet.
export type MeetingProviderId = "google_meet" | "zoom" | "microsoft_teams";

/** The providers a meeting can actually be created for today. */
export const IMPLEMENTED_MEETING_PROVIDERS = ["google_meet"] as const satisfies readonly MeetingProviderId[];

export type MeetingStatus =
  | "pending_sync"
  | "no_transcript"
  | "transcript_ready"
  | "not_found"
  | "insufficient_scope"
  | "revoked"
  | "provider_error";

export type MeetingArtifactType = "transcript" | "recording";

export type AIMeetingInsightType = "meeting_intelligence" | "presentation_intelligence";

export type Meeting = {
  id: string;
  workspaceId: string;
  leadId: string | null;
  provider: MeetingProviderId;
  /** Null for browser-captured meetings that do not use a provider credential. */
  connectionId: string | null;
  providerSpaceId: string;
  providerConferenceRecordId: string | null;
  title: string | null;
  scheduledStart: string | null;
  status: MeetingStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CaptureSource = "provider_transcript" | "browser_captions" | "browser_audio";

export type MeetingArtifact = {
  id: string;
  meetingId: string;
  workspaceId: string;
  artifactType: MeetingArtifactType;
  /** The acquisition source of this artifact — distinct from the meeting provider.
   *  'provider_transcript' is the default; browser capture artifacts are
   *  'browser_captions' (live caption capture) or 'browser_audio' (future audio mode). */
  captureSource: CaptureSource;
  providerArtifactId: string;
  state: string | null;
  docsUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Transcript = {
  id: string;
  meetingArtifactId: string;
  workspaceId: string;
  state: string | null;
  transcriptStart: string | null;
  transcriptEnd: string | null;
  fetchedAt: string;
  createdAt: string;
};

export type TranscriptEntry = {
  id: string;
  transcriptId: string;
  workspaceId: string;
  providerEntryId: string;
  /** Resolved participant display name. Null (never fabricated) when it could not be
   *  resolved from the provider's participant reference. */
  speakerLabel: string | null;
  sequence: number;
  startTime: string | null;
  endTime: string | null;
  languageCode: string | null;
  text: string;
  createdAt: string;
};

/** One field of a structured AI extraction: a value plus how sure the model is entitled
 *  to be, given only what is in the transcript. 'confirmed' means the transcript states
 *  it outright; 'inferred' means it follows from what was said but was not stated
 *  verbatim; 'unknown' means the transcript gives no basis for a value, and `value` must
 *  then be null — an 'unknown' field with a non-null value is a bug in the generator, not
 *  a valid state. */
export type EvidenceRef = {
  transcriptEntryId: string;
  /** ISO offset within the meeting, echoing the entry's own start_time. */
  timestamp: string | null;
  speakerLabel: string | null;
};

export type AIField<T> = {
  value: T | null;
  confidence: "confirmed" | "inferred" | "unknown";
  evidence: readonly EvidenceRef[];
};

export type AIMeetingInsight = {
  id: string;
  meetingId: string;
  workspaceId: string;
  transcriptId: string | null;
  insightType: AIMeetingInsightType;
  model: string;
  payload: unknown;
  generatedAt: string;
  createdAt: string;
};
