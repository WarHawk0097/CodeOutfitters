// Node-env unit tests for the M-D14/M-D15 meeting transcript route. No DOM: the pure pieces
// (findMeeting, hasReadyTranscript, filterTranscript, TranscriptContent) are exercised
// directly, TranscriptContent via react-dom/server so its canonical markup and honest demo
// posture can be asserted without jsdom. The route/auth fact lives in page.tsx and is
// asserted by reading the source.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSeedState } from "../../../../../lib/demo/seed";
import {
  SAMPLE_TRANSCRIPT,
  filterTranscript,
  findMeeting,
  hasReadyTranscript,
  TranscriptContent,
} from "./transcript-view";

const state = createSeedState();
// mtg-002 (Priyanka Rao, "Ready · 48 min") shows the M-D14 detail; mtg-001 (READY, "—")
// has no transcript and must show the honest unavailable state.
const READY_ID = "mtg-002";
const UNAVAILABLE_ID = "mtg-001";

function markup(id = READY_ID) {
  const meeting = findMeeting(state, id)!;
  return renderToStaticMarkup(createElement(TranscriptContent, { meeting }));
}

const here = fileURLToPath(new URL(".", import.meta.url));
const pageSource = readFileSync(`${here}page.tsx`, "utf8");

describe("meeting transcript route (M-D14/M-D15)", () => {
  // 1
  it("resolves a valid meeting id", () => {
    const meeting = findMeeting(state, READY_ID);
    expect(meeting).not.toBeNull();
    expect(meeting?.name).toBe("Priyanka Rao");
  });

  // 2
  it("returns null for an unknown meeting id (canonical not-found)", () => {
    expect(findMeeting(state, "mtg-does-not-exist")).toBeNull();
  });

  // 3
  it("renders the canonical M-D14 detail with the governance banner for a ready record", () => {
    const html = markup();
    expect(html).toContain("Transcript — detail");
    expect(html).toContain("RETENTION 12 MO · REDACTION AVAILABLE · DOWNLOAD: ADMIN ONLY");
  });

  // 4
  it("shows an honest transcript-unavailable state for a record with no transcript", () => {
    const html = markup(UNAVAILABLE_ID);
    expect(html).toContain("Transcript unavailable");
    expect(html).toContain("NOT RECORDING");
    expect(html).toContain("NOT TRANSCRIBING");
    // The unavailable state must not render the sample detail.
    expect(html).not.toContain("Transcript — detail");
  });

  // 5
  it("labels the demo transcript clearly as a sample, never a real recorded call", () => {
    const html = markup();
    expect(html).toContain("Sample transcript");
    expect(html.toLowerCase()).toContain("not generated from a real");
    expect(html.toUpperCase()).not.toContain("CONSENT RECORDED");
    expect(html.toUpperCase()).not.toContain("RECORDING COMPLETE");
    expect(html.toUpperCase()).not.toContain("TRANSCRIPT GENERATED");
    expect(html.toUpperCase()).not.toContain("AUDIO PROCESSED");
  });

  // 6
  it("renders timestamped, speaker-attributed entries with marker badges", () => {
    const html = markup();
    expect(html).toContain("00:14:22");
    expect(html).toContain("Priyanka Rao");
    expect(html).toContain("Marc Rivera");
    expect(html).toContain("REQUIREMENT");
    expect(html).toContain("OBJECTION");
  });

  // 7 — pure local search filters deterministically.
  it("filters the transcript by a case-insensitive text search", () => {
    const hits = filterTranscript(SAMPLE_TRANSCRIPT, "erp", "");
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toContain("ERP integration");
  });

  // 8 — no-results case.
  it("returns no entries when the search matches nothing", () => {
    expect(filterTranscript(SAMPLE_TRANSCRIPT, "zzzznotpresent", "")).toHaveLength(0);
  });

  // 9 — speaker filtering is deterministic.
  it("filters the transcript by speaker", () => {
    const marc = filterTranscript(SAMPLE_TRANSCRIPT, "", "Marc Rivera");
    expect(marc.length).toBeGreaterThan(0);
    expect(marc.every((e) => e.speaker === "Marc Rivera")).toBe(true);
  });

  // 10 — hasReadyTranscript gates the two states.
  it("treats only a ready-status record as having a transcript", () => {
    expect(hasReadyTranscript(findMeeting(state, READY_ID)!)).toBe(true);
    expect(hasReadyTranscript(findMeeting(state, UNAVAILABLE_ID)!)).toBe(false);
  });

  // 11
  it("keeps every provider-dependent action disabled with an accessible reason", () => {
    const html = markup();
    expect(html).toContain("Export transcript");
    expect(html).toContain("Download source audio");
    expect(html).toContain("Save redactions");
    expect(html).toContain("disabled");
    expect(html).toContain("aria-describedby");
    expect(html.toLowerCase()).toContain("no meeting provider is connected");
  });

  // 12
  it("exposes an accessible search field and speaker filter controls", () => {
    const html = markup();
    expect(html).toContain("Search transcript");
    expect(html).toContain('type="search"');
    expect(html).toContain("aria-pressed");
    expect(html).toContain("All speakers");
    // Timestamps are exposed as text for screen readers, not colour or position alone.
    expect(html).toContain("Timestamp");
  });

  // 13 — review linkage both ways.
  it("links back to the review screen (M-D15 review linkage)", () => {
    expect(markup()).toContain('href="/dashboard/meetings/mtg-002/review"');
  });

  // 14
  it("makes no Supabase or network claim in demo markup", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("fetch(");
  });

  // 15
  it("keeps rejected patterns off the screen — no fake audio, waveform, or progress", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("waveform");
    expect(html).not.toContain("<audio");
    expect(html).not.toContain("transcribing…");
    expect(html).not.toContain("processing complete");
    expect(html).not.toContain("grouped-bar");
    // No download link to a nonexistent file — the download control is a disabled button.
    expect(html).not.toContain('<a href="blob:');
    expect(html).not.toContain("download=");
  });

  // 16 — the route page preserves the Work Order F auth/authz boundary in live mode.
  it("gates the transcript page through resolveDashboardContext", () => {
    expect(pageSource).toContain("resolveDashboardContext");
    expect(pageSource).toContain("/dashboard/meetings/${meetingId}/transcript");
  });
});
