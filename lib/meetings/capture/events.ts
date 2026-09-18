// Recording Events — derive user-facing capture lifecycle events from REAL persisted
// state. This module is the single source of truth for the Recording Events panel: it
// never invents an event, never fabricates a success, and never derives "recording"
// from a client-side timer. Every event below is backed by a column this app's own
// capture pipeline wrote (lib/meetings/capture/server.ts is the only writer of capture
// state), so showing it cannot claim work that did not happen.
//
// Event sources, in the preference order the Recording Events goal fixes:
//   1. meeting_artifacts.state  — capture_active / capture_paused / capture_complete
//   2. transcripts.state        — the transcript row's own lifecycle
//   3. transcript_entries       — count + max(sequence) + last created_at = "audio
//                                  received/processed" and "transcript entry created"
//   4. meetings.status/last_error — capture finalization outcome (transcript_ready /
//                                  no_transcript) and the honest failure text
//   5. ai_meeting_insights      — AI analysis actually generated (never "pending AI"
//                                  invented on the client: pending is the ABSENCE of a
//                                  row plus a complete transcript, labelled as such)
//
// Framework-free and server/client-neutral: the API route feeds it real rows, the
// panel renders its output verbatim, and tests exercise it in the node env.

import type { MeetingStatus } from "../types";

export type CaptureEventStatus = "success" | "active" | "pending" | "warning" | "error";

export type RecordingEvent = {
  /** Stable within one snapshot; ids are type keys, not secrets. */
  id: string;
  type: string;
  label: string;
  status: CaptureEventStatus;
  /** ISO timestamp when known from the persisted row; null never blocks rendering. */
  timestamp: string | null;
  description: string | null;
  /** Presentation order within the panel (top = newest). */
  sequence: number;
};

export type RecordingPhase =
  | "not_started"
  | "preparing"
  | "recording"
  | "paused"
  | "processing"
  | "completed"
  | "failed";

export type RecordingEventsSnapshot = {
  phase: RecordingPhase;
  /** True while the capture artifact is active and transcript entries keep arriving. */
  recording: boolean;
  /** Captured entry count — real, from transcript_entries. Never padded. */
  entryCount: number;
  /** Highest contiguous sequence the server accepted; null when nothing captured. */
  lastSequence: number | null;
  /** artifact.created_at of the capture session — the ONLY elapsed-time source. */
  startedAt: string | null;
  /** Real persisted error text (meetings.last_error as written by capture/sync), else null. */
  lastError: string | null;
  events: RecordingEvent[];
};

/** The slice of persisted state the panel needs. Mirrors lib/meetings/types.ts rows;
 *  a distinct narrow type keeps this module importable from client components. */
export type CaptureEventsInput = {
  meetingStatus: MeetingStatus | null;
  meetingLastError: string | null;
  /** The transcript artifact of THIS capture session (artifact_type = "transcript"). */
  artifactState: string | null;
  artifactCreatedAt: string | null;
  transcriptState: string | null;
  entryCount: number;
  lastSequence: number | null;
  lastEntryAt: string | null;
  /** True when at least one ai_meeting_insights row exists for this meeting. */
  hasInsights: boolean;
};

const CAPTURE_ACTIVE = "capture_active";
const CAPTURE_PAUSED = "capture_paused";
const CAPTURE_COMPLETE = "capture_complete";

/** Derive the full snapshot. Pure: same input, same output, no clock reads. */
export function deriveRecordingEvents(input: CaptureEventsInput): RecordingEventsSnapshot {
  const {
    meetingStatus,
    meetingLastError,
    artifactState,
    artifactCreatedAt,
    transcriptState,
    entryCount,
    lastSequence,
    lastEntryAt,
    hasInsights,
  } = input;

  const active = artifactState === CAPTURE_ACTIVE;
  const paused = artifactState === CAPTURE_PAUSED;
  const complete = artifactState === CAPTURE_COMPLETE;
  const noArtifact = artifactState === null;

  // Failure is real persisted state, and it WINS over a live-looking spinner: a
  // revoked/provider_error meeting status must never render as a serene "Recording".
  // (meetings.last_error is a state code this app wrote — never a provider body — so
  // it is safe truth to surface; see the meeting detail page's same judgement.)
  const terminalFailure = meetingStatus === "provider_error" || meetingStatus === "revoked";
  const failed = !noArtifact && (terminalFailure || (Boolean(meetingLastError) && !active));

  // "Processing" is a REAL transient, not a vibe: stopCapture finalizes artifact →
  // transcript → meeting in sequence, so a poll between the artifact update and the
  // meeting update sees exactly artifact=complete + meeting=pending_sync. That is the
  // only verified "still finishing" state; AI analysis is user-triggered, never
  // background work, so it is shown as pending, never as an in-progress spinner.
  const finalizeUnconfirmed = meetingStatus === null || meetingStatus === "pending_sync";

  const phase: RecordingPhase = noArtifact
    ? "not_started"
    : failed
      ? "failed"
      : active
        ? "recording"
        : paused
          ? "paused"
          : complete && finalizeUnconfirmed
            ? "processing"
            : complete
              ? "completed"
              : "preparing";

  const events: RecordingEvent[] = [];
  let sequence = 0;
  const push = (event: Omit<RecordingEvent, "sequence">) => {
    events.push({ ...event, sequence: sequence++ });
  };

  // --- Session-level events -------------------------------------------------

  if (artifactCreatedAt) {
    push({
      id: "capture-session-started",
      type: "capture_session_started",
      label: "Capture session started",
      status: "success",
      timestamp: artifactCreatedAt,
      description: null,
    });
  }

  // --- Transcript entry events (the real "audio received/processed" evidence) ---

  if (entryCount > 0) {
    push({
      id: "transcript-entries-received",
      type: "transcript_entries_received",
      label: lastEntryAt ? "Transcribing audio" : "Transcript entries received",
      // The transcriber is only genuinely working while the phase is recording; a
      // failed session must not keep an active spinner on this row.
      status: phase === "recording" ? "active" : complete ? "success" : "warning",
      timestamp: lastEntryAt,
      description:
        entryCount === 1
          ? "1 transcript entry captured"
          : `${entryCount} transcript entries captured`,
    });
    push({
      id: "transcript-entry-created",
      type: "transcript_entry_created",
      label: `Transcript entry #${lastSequence ?? entryCount} created`,
      status: "success",
      timestamp: lastEntryAt,
      description: null,
    });
  }

  // --- Transcript lifecycle -------------------------------------------------

  if (transcriptState === CAPTURE_COMPLETE) {
    push({
      id: "transcript-saved",
      type: "transcript_saved",
      label: "Transcript saved",
      status: "success",
      timestamp: null,
      description: null,
    });
  } else if (transcriptState === CAPTURE_ACTIVE && entryCount > 0 && phase === "recording") {
    push({
      id: "transcript-processing",
      type: "transcript_processing",
      label: "Processing latest audio",
      status: "active",
      timestamp: lastEntryAt,
      description: null,
    });
  }

  // --- Pause / resume / stop ------------------------------------------------

  if (paused) {
    push({
      id: "capture-paused",
      type: "capture_paused",
      label: "Capture paused",
      status: "warning",
      timestamp: null,
      description: "Resume to continue this same capture session.",
    });
  }

  if (complete) {
    push({
      id: "capture-stopped",
      type: "capture_stopped",
      label: "Recording stopped",
      status: "success",
      timestamp: null,
      description: null,
    });
    // "Audio saved / synchronized" is only claimed when the meeting's own status
    // proves finalization happened (stopCapture writes transcript_ready/no_transcript).
    if (meetingStatus === "transcript_ready") {
      push({
        id: "capture-saved",
        type: "capture_saved",
        label: entryCount > 0 ? "Audio saved · transcript persisted" : "Capture finalized",
        status: "success",
        timestamp: null,
        description: null,
      });
    } else if (meetingStatus === "no_transcript") {
      push({
        id: "capture-saved",
        type: "capture_saved",
        label: "Capture finalized — no transcript captured",
        status: "warning",
        timestamp: null,
        description: "The session ended before any captions or audio were captured.",
      });
    }
  }

  // --- AI analysis ------------------------------------------------------------
  // Pending AI is only shown when there is something to analyse AND the capture is
  // terminal — never as a fabricated "in progress" while entries are still streaming.

  if (hasInsights) {
    push({
      id: "ai-insights-ready",
      type: "ai_insights_generated",
      label: "AI analysis complete",
      status: "success",
      timestamp: null,
      description: null,
    });
  } else if (phase === "processing" || phase === "completed") {
    push({
      id: "ai-insights-pending",
      type: "ai_insights_pending",
      label: "AI analysis pending",
      status: "pending",
      timestamp: null,
      description: "Run AI analysis from the meeting page once processing finishes.",
    });
  }

  // --- Failure (always visible, never an infinite spinner) -------------------

  if (failed) {
    push({
      id: "capture-error",
      type: "capture_error",
      label: "Capture problem",
      status: "error",
      timestamp: null,
      // meetings.last_error is a state code this app wrote (never a provider response
      // body — see the meeting detail page's own comment), so it is safe to show.
      description: meetingLastError ?? "The capture could not continue.",
    });
  }

  return {
    phase,
    recording: active && !paused,
    entryCount,
    lastSequence,
    startedAt: artifactCreatedAt,
    lastError: failed ? (meetingLastError ?? "The capture could not continue.") : null,
    events,
  };
}

/** The six phase labels the panel heading may show. One wording each, honest by
 *  construction: every label is derived from persisted state, never from a timer. */
export const RECORDING_PHASE_LABEL: Record<RecordingPhase, string> = {
  not_started: "Not started",
  preparing: "Preparing",
  recording: "Recording",
  paused: "Paused",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};
