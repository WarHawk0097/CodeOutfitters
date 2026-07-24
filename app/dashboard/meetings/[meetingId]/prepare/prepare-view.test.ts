// Node-env unit tests for the M-D02 meeting-preparation route. No DOM: the pure
// pieces (findMeeting, PrepareContent) are exercised directly, PrepareContent via
// react-dom/server so its canonical markup can be asserted without jsdom.
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSeedState } from "../../../../../lib/demo/seed";
import { findMeeting, PrepareContent } from "./prepare-view";

const state = createSeedState();
const VALID_ID = "mtg-001";

function markup() {
  const meeting = findMeeting(state, VALID_ID)!;
  return renderToStaticMarkup(
    createElement(PrepareContent, {
      meeting,
      questions: ["Problem — probe listing workflow breakdowns"],
      draft: "",
      onDraftChange: () => {},
      onAddQuestion: () => {},
      onDismissQuestion: () => {},
    }),
  );
}

describe("meeting prepare route (M-D02)", () => {
  it("resolves a valid demo meeting id", () => {
    const meeting = findMeeting(state, VALID_ID);
    expect(meeting).not.toBeNull();
    expect(meeting?.name).toBe("Alicia Fenwick");
  });

  it("returns null for an unknown meeting id (canonical not-found)", () => {
    expect(findMeeting(state, "mtg-does-not-exist")).toBeNull();
  });

  it("renders the canonical preparation modules", () => {
    const html = markup();
    expect(html).toContain("Prepare — Alicia Fenwick");
    expect(html).toContain("Goal: discovery");
    expect(html).toContain("PINNED QUESTIONS");
    expect(html).toContain("READINESS");
    expect(html).toContain("LEAD CONTEXT");
    expect(html).toContain("Open live workspace");
  });

  it("reports honest provider readiness — REQUIRES PROVIDER, consent APPROVED", () => {
    const html = markup();
    expect(html).toContain("REQUIRES PROVIDER");
    expect(html).toContain("APPROVED");
  });

  it("does not activate recording or transcription on the preparation screen", () => {
    const html = markup().toUpperCase();
    // The live M-D03 active markers must never appear on M-D02.
    expect(html).not.toContain("TRANSCRIBING");
    expect(html).not.toContain("CONSENT RECORDED");
    expect(html).not.toContain("REC ●");
    // The transition into the live workspace is disabled — consent is required first.
    expect(markup()).toContain("disabled");
  });

  it("keeps rejected chart patterns off the screen", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("grouped-bar");
    expect(html).not.toContain("pipeline distribution");
  });
});
