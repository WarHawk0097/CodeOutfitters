// Recording Events derivation — the honesty tests. Every claim the panel can make is
// checked here against the shape of the persisted input that backs it: an event must
// NOT appear without its underlying row, and a timer must never produce "recording".
import { describe, expect, it } from "vitest";
import {
  deriveRecordingEvents,
  RECORDING_PHASE_LABEL,
  type CaptureEventsInput,
} from "./events";

const base: CaptureEventsInput = {
  meetingStatus: "pending_sync",
  meetingLastError: null,
  artifactState: null,
  artifactCreatedAt: null,
  transcriptState: null,
  entryCount: 0,
  lastSequence: null,
  lastEntryAt: null,
  hasInsights: false,
};

const eventTypes = (input: CaptureEventsInput) => deriveRecordingEvents(input).events.map((e) => e.type);

describe("deriveRecordingEvents — not started", () => {
  it("reports not_started with zero events when no capture artifact exists", () => {
    const snapshot = deriveRecordingEvents(base);
    expect(snapshot.phase).toBe("not_started");
    expect(snapshot.recording).toBe(false);
    expect(snapshot.events).toEqual([]);
    expect(snapshot.startedAt).toBeNull();
  });

  it("never claims an entry or transcript without persisted rows", () => {
    const types = eventTypes(base);
    expect(types).not.toContain("transcript_entries_received");
    expect(types).not.toContain("transcript_entry_created");
    expect(types).not.toContain("transcript_saved");
    expect(types).not.toContain("capture_stopped");
    expect(types).not.toContain("ai_insights_generated");
  });
});

describe("deriveRecordingEvents — active recording", () => {
  const active: CaptureEventsInput = {
    ...base,
    artifactState: "capture_active",
    artifactCreatedAt: "2026-09-18T10:00:00.000Z",
    transcriptState: "capture_active",
    entryCount: 4,
    lastSequence: 3,
    lastEntryAt: "2026-09-18T10:02:11.000Z",
  };

  it("reports the recording phase only from the artifact state", () => {
    const snapshot = deriveRecordingEvents(active);
    expect(snapshot.phase).toBe("recording");
    expect(snapshot.recording).toBe(true);
    expect(RECORDING_PHASE_LABEL[snapshot.phase]).toBe("Recording");
  });

  it("shows the session-started event backed by artifact.created_at", () => {
    const snapshot = deriveRecordingEvents(active);
    const started = snapshot.events.find((e) => e.type === "capture_session_started");
    expect(started?.status).toBe("success");
    expect(started?.timestamp).toBe("2026-09-18T10:00:00.000Z");
  });

  it("marks transcription active (spinner) while entries stream, with real counts", () => {
    const snapshot = deriveRecordingEvents(active);
    const transcribing = snapshot.events.find((e) => e.type === "transcript_entries_received");
    expect(transcribing?.status).toBe("active");
    expect(transcribing?.description).toBe("4 transcript entries captured");
    expect(snapshot.entryCount).toBe(4);
    expect(snapshot.lastSequence).toBe(3);
  });

  it("shows processing-latest-audio only while the transcript row is active with entries", () => {
    const snapshot = deriveRecordingEvents(active);
    const processing = snapshot.events.find((e) => e.type === "transcript_processing");
    expect(processing?.status).toBe("active");
    // The same shape without entries must NOT claim processing work.
    const idle = deriveRecordingEvents({ ...active, entryCount: 0, lastSequence: null, lastEntryAt: null });
    expect(idle.events.map((e) => e.type)).not.toContain("transcript_processing");
  });

  it("never shows AI complete and never fabricates AI pending during live recording", () => {
    const types = eventTypes(active);
    expect(types).not.toContain("ai_insights_generated");
    expect(types).not.toContain("ai_insights_pending");
  });

  it("derives elapsed-time SOURCE from the artifact (startedAt), not a timer", () => {
    expect(deriveRecordingEvents(active).startedAt).toBe("2026-09-18T10:00:00.000Z");
  });
});

describe("deriveRecordingEvents — paused", () => {
  it("reports paused with a warning event and recording=false", () => {
    const snapshot = deriveRecordingEvents({
      ...base,
      artifactState: "capture_paused",
      artifactCreatedAt: "2026-09-18T10:00:00.000Z",
      transcriptState: "capture_active",
      entryCount: 2,
      lastSequence: 1,
      lastEntryAt: "2026-09-18T10:01:00.000Z",
    });
    expect(snapshot.phase).toBe("paused");
    expect(snapshot.recording).toBe(false);
    const paused = snapshot.events.find((e) => e.type === "capture_paused");
    expect(paused?.status).toBe("warning");
  });
});

describe("deriveRecordingEvents — completed", () => {
  const completed: CaptureEventsInput = {
    ...base,
    meetingStatus: "transcript_ready",
    artifactState: "capture_complete",
    artifactCreatedAt: "2026-09-18T10:00:00.000Z",
    transcriptState: "capture_complete",
    entryCount: 9,
    lastSequence: 8,
    lastEntryAt: "2026-09-18T10:41:00.000Z",
  };

  it("reports completed only for a complete artifact", () => {
    expect(deriveRecordingEvents(completed).phase).toBe("completed");
    expect(deriveRecordingEvents(completed).recording).toBe(false);
  });

  it("marks transcript saved and capture stopped as successes", () => {
    const snapshot = deriveRecordingEvents(completed);
    expect(snapshot.events.find((e) => e.type === "transcript_saved")?.status).toBe("success");
    expect(snapshot.events.find((e) => e.type === "capture_stopped")?.status).toBe("success");
  });

  it("claims 'saved/synchronized' only when the meeting status proves finalization", () => {
    const snapshot = deriveRecordingEvents(completed);
    const saved = snapshot.events.find((e) => e.type === "capture_saved");
    expect(saved?.status).toBe("success");
    // Without transcript_ready the claim must be absent — the artifact completed but the
    // meeting finalize did not happen.
    const unproven = deriveRecordingEvents({ ...completed, meetingStatus: "pending_sync" });
    expect(unproven.events.map((e) => e.type)).not.toContain("capture_saved");
  });

  it("reports processing only while finalize is unconfirmed (artifact done, meeting not yet transcript_ready)", () => {
    const snapshot = deriveRecordingEvents({ ...completed, meetingStatus: "pending_sync" });
    expect(snapshot.phase).toBe("processing");
    // A finalized meeting with no insights is COMPLETED — AI analysis is user-triggered,
    // not background post-processing, so it is a pending row, never a live spinner.
    const finalized = deriveRecordingEvents(completed);
    expect(finalized.phase).toBe("completed");
    expect(finalized.events.find((e) => e.type === "ai_insights_pending")?.status).toBe("pending");
    expect(finalized.events.map((e) => e.type)).not.toContain("ai_insights_generated");
  });

  it("reports AI analysis complete only when an insights row exists", () => {
    const snapshot = deriveRecordingEvents({ ...completed, hasInsights: true });
    expect(snapshot.phase).toBe("completed");
    expect(snapshot.events.find((e) => e.type === "ai_insights_generated")?.status).toBe("success");
    expect(snapshot.events.map((e) => e.type)).not.toContain("ai_insights_pending");
  });

  it("flags no-capture finalization as a warning, not a success", () => {
    const snapshot = deriveRecordingEvents({ ...completed, entryCount: 0, lastSequence: null, lastEntryAt: null, meetingStatus: "no_transcript" });
    expect(snapshot.events.find((e) => e.type === "capture_saved")?.status).toBe("warning");
  });
});

describe("deriveRecordingEvents — failure", () => {
  it("surfaces the persisted last_error as an error event, never an infinite spinner", () => {
    const snapshot = deriveRecordingEvents({
      ...base,
      meetingStatus: "provider_error",
      meetingLastError: "The provider could not be reached.",
      artifactState: "capture_active",
      artifactCreatedAt: "2026-09-18T10:00:00.000Z",
      transcriptState: "capture_active",
    });
    expect(snapshot.phase).toBe("failed");
    expect(snapshot.lastError).toBe("The provider could not be reached.");
    const failure = snapshot.events.find((e) => e.type === "capture_error");
    expect(failure?.status).toBe("error");
  });

  it("reports failed for a revoked connection with an active artifact", () => {
    const snapshot = deriveRecordingEvents({
      ...base,
      meetingStatus: "revoked",
      artifactState: "capture_complete",
      artifactCreatedAt: "2026-09-18T10:00:00.000Z",
      transcriptState: "capture_complete",
      entryCount: 3,
      lastSequence: 2,
      lastEntryAt: "2026-09-18T10:05:00.000Z",
    });
    expect(snapshot.phase).toBe("failed");
  });

  it("keeps a recorded error out of the not_started phase (no artifact = no capture story)", () => {
    const snapshot = deriveRecordingEvents({
      ...base,
      meetingStatus: "provider_error",
      meetingLastError: "The provider could not be reached.",
    });
    expect(snapshot.phase).toBe("not_started");
    expect(snapshot.lastError).toBeNull();
  });
});

describe("deriveRecordingEvents — ordering and dedupe", () => {
  it("numbers events sequentially with newest first for panel order", () => {
    const snapshot = deriveRecordingEvents({
      ...base,
      meetingStatus: "transcript_ready",
      artifactState: "capture_complete",
      artifactCreatedAt: "2026-09-18T10:00:00.000Z",
      transcriptState: "capture_complete",
      entryCount: 2,
      lastSequence: 1,
      lastEntryAt: "2026-09-18T10:03:00.000Z",
      hasInsights: true,
    });
    const sequences = snapshot.events.map((e) => e.sequence);
    expect(sequences).toEqual(sequences.map((_, i) => i));
    expect(new Set(snapshot.events.map((e) => e.id)).size).toBe(snapshot.events.length);
  });

  it("emits at most one event per type (idempotent under re-render)", () => {
    const snapshot = deriveRecordingEvents({
      ...base,
      artifactState: "capture_active",
      artifactCreatedAt: "2026-09-18T10:00:00.000Z",
      transcriptState: "capture_active",
      entryCount: 5,
      lastSequence: 4,
      lastEntryAt: "2026-09-18T10:02:00.000Z",
    });
    const types = snapshot.events.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });
});
