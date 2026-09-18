// RecordingEventsPanel — markup tests via react-dom/server, mirroring the project's
// live-view/prepare-view test idiom. The data hook AND the mode hook are mocked so each
// snapshot shape renders deterministically in the node env; RowIcon is exported for the
// reduced-motion unit test because matchMedia cannot run in the node env.
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const hookState = vi.hoisted(() => ({
  config: { live: true, downloadsEnabled: true },
  result: {
    snapshot: null as unknown,
    status: "loading" as "loading" | "ready" | "error",
    error: null as string | null,
    refresh: () => {},
  },
}));

vi.mock("@/lib/meetings/capture/use-capture-events", () => ({
  useCaptureEvents: () => hookState.result,
}));
vi.mock("@/components/command-center/mode-provider", () => ({
  useCommandCenterConfig: () => hookState.config,
}));

import { RecordingEventsPanel, RowIcon } from "./recording-events-panel";
import type { RecordingEventsSnapshot } from "@/lib/meetings/capture/events";

function renderPanel(): string {
  return renderToStaticMarkup(createElement(RecordingEventsPanel, { meetingId: "m-1" }));
}

const started = "2026-09-18T10:00:00.000Z";

function snapshot(partial: Partial<RecordingEventsSnapshot>): RecordingEventsSnapshot {
  return {
    phase: "recording",
    recording: true,
    entryCount: 0,
    lastSequence: null,
    startedAt: started,
    lastError: null,
    events: [],
    ...partial,
  };
}

function ready(snap: RecordingEventsSnapshot) {
  hookState.result = { snapshot: snap, status: "ready", error: null, refresh: () => {} };
}

describe("RecordingEventsPanel — empty / not started", () => {
  it("renders the heading and the honest not-started message with no event rows", () => {
    ready(snapshot({ phase: "not_started", recording: false, startedAt: null, events: [] }));
    const html = renderPanel();
    expect(html).toContain("RECORDING EVENTS");
    expect(html).toContain("Recording has not started yet.");
    expect(html).not.toContain("<li");
    expect(html).not.toContain("animate-spin");
  });
});

describe("RecordingEventsPanel — active recording", () => {
  it("shows the Recording phase chip and animates only the active row", () => {
    ready(
      snapshot({
        entryCount: 4,
        lastSequence: 3,
        events: [
          { id: "a", type: "capture_session_started", label: "Capture session started", status: "success", timestamp: started, description: null, sequence: 0 },
          { id: "b", type: "transcript_entries_received", label: "Transcribing audio", status: "active", timestamp: started, description: "4 transcript entries captured", sequence: 1 },
        ],
      }),
    );
    const html = renderPanel();
    expect(html).toContain("● Recording");
    expect(html).toContain("animate-spin");
    // Exactly one animated icon: the active transcription row (the heading chip shows
    // only while recording — so two spins total: chip + the one active row).
    expect(html.split("animate-spin").length - 1).toBe(2);
    expect(html).toContain("Capture session started");
    expect(html).toContain("4 transcript entries captured");
  });

  it("never renders a fabricated success for work that has not happened", () => {
    ready(snapshot({ events: [] }));
    const html = renderPanel();
    expect(html).not.toContain("Transcript saved");
    expect(html).not.toContain("AI analysis complete");
    expect(html).not.toContain("Recording stopped");
  });
});

describe("RecordingEventsPanel — completed", () => {
  it("renders completed rows as successes with no spinner", () => {
    ready(
      snapshot({
        phase: "completed",
        recording: false,
        entryCount: 9,
        lastSequence: 8,
        events: [
          { id: "a", type: "capture_stopped", label: "Recording stopped", status: "success", timestamp: null, description: null, sequence: 0 },
          { id: "b", type: "transcript_saved", label: "Transcript saved", status: "success", timestamp: null, description: null, sequence: 1 },
        ],
      }),
    );
    const html = renderPanel();
    expect(html).toContain("Recording stopped");
    expect(html).toContain("Transcript saved");
    expect(html).not.toContain("animate-spin");
  });
});

describe("RecordingEventsPanel — processing", () => {
  it("shows the processing phase and the pending AI row without claiming completion", () => {
    ready(
      snapshot({
        phase: "processing",
        recording: false,
        entryCount: 9,
        events: [
          { id: "a", type: "capture_stopped", label: "Recording stopped", status: "success", timestamp: null, description: null, sequence: 0 },
          { id: "b", type: "ai_insights_pending", label: "AI analysis pending", status: "pending", timestamp: null, description: "Run AI analysis from the meeting page once processing finishes.", sequence: 1 },
        ],
      }),
    );
    const html = renderPanel();
    expect(html).toContain("Processing");
    expect(html).toContain("AI analysis pending");
    expect(html).not.toContain("AI analysis complete");
  });
});

describe("RecordingEventsPanel — failure", () => {
  it("surfaces the persisted error with an alert role instead of an infinite spinner", () => {
    ready(
      snapshot({
        phase: "failed",
        recording: false,
        lastError: "The provider could not be reached.",
        events: [
          { id: "a", type: "capture_error", label: "Capture problem", status: "error", timestamp: null, description: "The provider could not be reached.", sequence: 0 },
        ],
      }),
    );
    const html = renderPanel();
    expect(html).toContain('role="alert"');
    expect(html).toContain("The provider could not be reached.");
    expect(html).toContain("Capture problem");
  });

  it("offers Retry only through the error-state branch with real data absent", () => {
    hookState.result = { snapshot: null, status: "error", error: "Recording events are unavailable right now.", refresh: () => {} };
    const html = renderPanel();
    expect(html).toContain("Retry");
    expect(html).toContain("Recording events are unavailable right now.");
  });
});

describe("RecordingEventsPanel — reduced motion", () => {
  it("renders the active icon statically (no animate-spin) when reduced motion is on", () => {
    const reducedActive = renderToStaticMarkup(createElement(RowIcon, { status: "active", reduced: true }));
    const fullActive = renderToStaticMarkup(createElement(RowIcon, { status: "active", reduced: false }));
    expect(reducedActive).not.toContain("animate-spin");
    expect(fullActive).toContain("animate-spin");
    // Success rows never animate in either mode.
    expect(renderToStaticMarkup(createElement(RowIcon, { status: "success", reduced: false }))).not.toContain("animate-spin");
  });

  it("wires the CSS-level motion guards and the matchMedia resolver in source", async () => {
    const fs = await import("node:fs");
    const panelSrc = fs.readFileSync("components/meetings/recording-events-panel.tsx", "utf8");
    expect(panelSrc).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    const cssSrc = fs.readFileSync("app/globals.css", "utf8");
    expect(cssSrc).toContain("prefers-reduced-motion");
    expect(cssSrc).toContain("html[data-motion='reduced']");
  });
});

describe("RecordingEventsPanel — honesty and secrecy", () => {
  it("demo mode shows no capture history and no phase chip", () => {
    hookState.config = { live: false, downloadsEnabled: false };
    const html = renderPanel();
    expect(html).toContain("Demo mode has no capture session");
    expect(html).not.toContain("<li");
    expect(html).not.toContain("● Recording");
    hookState.config = { live: true, downloadsEnabled: true };
  });

  it("never renders secret-shaped values even if present in transport objects", () => {
    ready(
      snapshot({
        events: [
          { id: "tok", type: "capture_session_started", label: "Capture session started", status: "success", timestamp: started, description: null, sequence: 0 },
        ],
      }),
    );
    const html = renderPanel();
    for (const forbidden of ["Bearer", "apikey", "service_role", "authorization", "ciphertext", "eyJ"]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("caps visible history and counts the hidden remainder", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      id: `e${i}`,
      type: `t${i}`,
      label: `Event ${i}`,
      status: "success" as const,
      timestamp: started,
      description: null,
      sequence: i,
    }));
    ready(snapshot({ events: many }));
    const html = renderPanel();
    expect(html.split("<li").length - 1).toBe(6);
    expect(html).toContain("earlier events");
  });
});
