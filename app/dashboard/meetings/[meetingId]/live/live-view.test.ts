// Node-env unit tests for the M-D03 live meeting workspace. No DOM: the pure pieces
// (findMeeting, LiveContent) are exercised directly, LiveContent via react-dom/server so
// its canonical markup and honest demo posture can be asserted without jsdom.
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSeedState } from "../../../../../lib/demo/seed";
import { findMeeting, LiveContent } from "./live-view";

const state = createSeedState();
const VALID_ID = "mtg-001";

function markup() {
  const meeting = findMeeting(state, VALID_ID)!;
  return renderToStaticMarkup(createElement(LiveContent, { meeting }));
}

describe("live meeting workspace (M-D03)", () => {
  it("resolves a valid demo meeting id", () => {
    const meeting = findMeeting(state, VALID_ID);
    expect(meeting).not.toBeNull();
    expect(meeting?.name).toBe("Alicia Fenwick");
  });

  it("returns null for an unknown meeting id (canonical not-found)", () => {
    expect(findMeeting(state, "mtg-does-not-exist")).toBeNull();
  });

  it("renders the canonical three-column live modules", () => {
    const html = markup();
    expect(html).toContain("CONTEXT");
    expect(html).toContain("AGENDA");
    expect(html).toContain("PINNED QUESTIONS");
    expect(html).toContain("Transcript");
    // The full copilot tab strip (M-D03 513).
    for (const tab of ["Discovery", "Canvas", "Pitch", "Objections", "Actions", "Proposal"]) {
      expect(html).toContain(tab);
    }
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
  });

  it("never claims an active recording, transcription, or captured consent in demo", () => {
    const html = markup().toUpperCase();
    // The canonical active-session markers must NOT appear — no provider is connected.
    expect(html).not.toContain("CONSENT RECORDED");
    expect(html).not.toContain("TRANSCRIBING · ");
    expect(html).not.toContain("REC ●");
    expect(html).not.toContain("IS SPEAKING");
    // Honest posture instead.
    expect(html).toContain("NOT RECORDING");
    expect(html).toContain("NOT TRANSCRIBING");
    expect(html).toContain("REQUIRES PROVIDER");
  });

  it("surfaces the meeting's real consent state rather than inferring it", () => {
    const html = markup();
    // mtg-001 is a READY meeting whose consent has not been captured.
    expect(html).toContain("Consent: Consent pending");
  });

  it("keeps recording/session controls disabled with an honest reason", () => {
    const html = markup();
    // Both session controls are disabled and point at the provider explanation.
    expect(html).toContain("Start recording");
    expect(html).toContain("End meeting");
    expect(html).toContain("disabled");
    expect(html).toContain("aria-describedby");
    expect(html.toLowerCase()).toContain("no meeting provider is connected");
  });

  it("keeps rejected chart/claim patterns off the screen", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("grouped-bar");
    expect(html).not.toContain("pipeline distribution");
    expect(html).not.toContain("live · 00:");
  });
});
