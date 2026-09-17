// CodeOutfitters Meeting Capture — domain types.
//
// Framework-free by design: these are imported by the browser extension (content
// script + popup), the Next.js ingestion routes, and the test suite, so nothing here
// may import "server-only", next, @supabase/*, or any browser API. The extension and
// server share one vocabulary for the wire format.

export type CaptureSource = "provider_transcript" | "browser_captions" | "browser_audio";

/** Lifecycle of one capture artifact. Mirrors meeting_artifacts.state as the durable
 *  record of a capture session (see the migration header — deliberately no separate
 *  capture-session table). */
export type CaptureStatus = "capture_active" | "capture_paused" | "capture_complete";

export const CAPTURE_STATUS: Record<CaptureStatus, string> = {
  capture_active: "Capture active",
  capture_paused: "Capture paused",
  capture_complete: "Capture complete",
};

/** One finalized caption statement the extension sends to the server. These are NOT raw
 *  caption DOM updates — they are the output of the incremental caption assembler, so
 *  every item is a complete utterance with a stable sequence number. */
export type CaptureEntry = {
  sequence: number;
  speakerLabel?: string | null;
  text: string;
  /** ISO timestamp of when the caption settled into its final form. */
  capturedAt: string;
  /** Optional, where Google exposes it. */
  languageCode?: string | null;
};

/** Wire format for POST /api/dashboard/meetings/capture/entries. */
export type CaptureBatchRequest = {
  /** Server-issued capture session id (never browser-trusted as an owner — the server
   *  re-derives the workspace and meeting from the authenticated session). */
  sessionId: string;
  meetingId: string;
  entries: CaptureEntry[];
};

export type CaptureBatchResponse = {
  accepted: number;
  /** Highest contiguous sequence now persisted for this session. A client can resume
   *  from here after a reconnect. */
  lastSequence: number;
};

/** Wire format for POST /api/dashboard/meetings/capture (start). */
export type CaptureStartRequest = {
  /** Canonical meeting host identifier for this route. */
  provider: "google_meet";
  /** The Meet space id parsed from the URL, e.g. "abc-defg-hij" (host is google_meet). */
  providerSpaceId: string;
  title?: string;
  /** Optional lead to link the meeting to before capture. */
  leadId?: string;
  /** Acquisition path selected by the extension. */
  acquisitionStrategy: Exclude<CaptureSource, "provider_transcript">;
  /** True when resuming an existing capture session the extension already owns. */
  resumeSessionId?: string;
};

export type CaptureStartResponse = {
  meetingId: string;
  sessionId: string;
  artifactId: string;
  transcriptId: string;
  resume: boolean;
  status: CaptureStatus;
};

/** Wire format for POST /api/dashboard/meetings/capture/stop. */
export type CaptureStopRequest = {
  sessionId: string;
  meetingId: string;
};

export type CaptureStopResponse = {
  meetingId: string;
  sessionId: string;
  status: CaptureStatus;
  entryCount: number;
};
