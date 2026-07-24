// Node-env unit tests for the M-D12/M-D13 meeting review route. No DOM: the pure pieces
// (findMeeting, ReviewContent) are exercised directly, ReviewContent via react-dom/server
// so its canonical markup and honest demo posture can be asserted without jsdom. Two
// route/auth facts that live in sibling files are asserted by reading the source.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSeedState } from "../../../../../lib/demo/seed";
import { findMeeting, ReviewContent } from "./review-view";

const state = createSeedState();
// mtg-002 (Priyanka Rao) is the NEEDS REVIEW record with real review counts; mtg-001 is a
// READY record with no provider output — the two demo shapes the review screen must handle.
const REVIEW_ID = "mtg-002";
const EMPTY_ID = "mtg-001";

function markup(id = REVIEW_ID) {
  const meeting = findMeeting(state, id)!;
  return renderToStaticMarkup(createElement(ReviewContent, { meeting }));
}

const here = fileURLToPath(new URL(".", import.meta.url));
const viewSource = readFileSync(`${here}review-view.tsx`, "utf8");
const pageSource = readFileSync(`${here}page.tsx`, "utf8");

describe("meeting review route (M-D12/M-D13)", () => {
  // 1
  it("resolves a valid review meeting id", () => {
    const meeting = findMeeting(state, REVIEW_ID);
    expect(meeting).not.toBeNull();
    expect(meeting?.name).toBe("Priyanka Rao");
  });

  // 2
  it("returns null for an unknown meeting id (canonical not-found)", () => {
    expect(findMeeting(state, "mtg-does-not-exist")).toBeNull();
  });

  // 3
  it("renders the approved review shell — status header and tab strip", () => {
    const html = markup();
    expect(html).toContain("Review — Priyanka Rao · Solterra Energy");
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
  });

  // 4
  it("renders the canonical M-D12 summary and M-D13 CRM modules", () => {
    const html = markup();
    expect(html).toContain("EXECUTIVE SUMMARY");
    expect(html).toContain("KEY MOMENTS");
    expect(html).toContain("CRM RECOMMENDATIONS");
  });

  // 5
  it("opens on the Summary tab by default and shows the real review status", () => {
    const html = markup();
    expect(html).toContain('id="review-tab-Summary" aria-selected="true"');
    expect(html).toContain("NEEDS REVIEW");
  });

  // 6
  it("makes no Supabase or network claim in demo markup", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("fetch(");
  });

  // 7
  it("keeps every provider-dependent review action disabled with an accessible reason", () => {
    const html = markup();
    expect(html).toContain("Approve summary");
    expect(html).toContain("Create proposal");
    expect(html).toContain("Review and Apply Updates");
    expect(html).toContain("disabled");
    expect(html).toContain("aria-describedby");
    expect(html.toLowerCase()).toContain("no meeting provider is connected");
  });

  // 8
  it("never claims a real recording, transcription, analysis, or sync in demo", () => {
    const html = markup().toUpperCase();
    expect(html).not.toContain("CONSENT RECORDED");
    expect(html).not.toContain("RECORDING COMPLETE");
    expect(html).not.toContain("TRANSCRIBING");
    expect(html).not.toContain("REC ●");
    expect(html).not.toContain("SYNCED TO CRM");
    // The honest posture is stated instead.
    expect(html).toContain("RECORDED, TRANSCRIBED, ANALYSED, OR SYNCED");
  });

  // 9
  it("surfaces the meeting's real review counts verbatim rather than inventing content", () => {
    const html = markup();
    expect(html).toContain("14 requirements");
    expect(html).toContain("6 recommendations");
  });

  // 10
  it("honours the verbatim M-D13 apply guard", () => {
    expect(markup()).toContain("Nothing is applied to the CRM until you Review and Apply Updates.");
  });

  // 11
  it("does not navigate to the not-yet-built transcript route", () => {
    // The Transcript tab exists as a local switch, but nothing links to the separate
    // (unbuilt) /transcript route — it must never dead-link there.
    expect(markup()).not.toContain('href="/dashboard/meetings/mtg-002/transcript"');
    expect(markup()).toContain("review-tab-Transcript");
  });

  // 12
  it("shows honest provider empty states for a record with no provider output", () => {
    const html = markup(EMPTY_ID);
    // mtg-001 has ai/crm = "—": no summary prose is fabricated.
    expect(html).toContain("No summary yet");
    expect(html).not.toContain("<p class=\"mt-2 text-[12.5px] leading-[1.6] text-cc-t-table\">—</p>");
  });

  // 13
  it("gives the review tabs proper tab semantics for keyboard and screen readers", () => {
    const html = markup();
    for (const name of ["Summary", "Transcript", "Requirements", "Solution", "Actions", "AI Activity"]) {
      expect(html).toContain(`id="review-tab-${name}"`);
    }
    expect(html).toContain('role="tab"');
    expect(html).toContain("aria-controls=");
  });

  // 14
  it("keeps rejected chart/claim patterns off the screen", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("grouped-bar");
    expect(html).not.toContain("pipeline distribution");
    expect(html).not.toContain("consent recorded");
    expect(html).not.toContain("analyzing");
    expect(html).not.toContain("uploading");
  });

  // 15 — the route page preserves the Work Order F auth/authz boundary in live mode.
  it("gates the review page through resolveDashboardContext", () => {
    expect(pageSource).toContain("resolveDashboardContext");
    expect(pageSource).toContain("/dashboard/meetings/${meetingId}/review");
  });

  // 16 — back navigation returns to the meetings directory.
  it("wires back navigation to the meetings directory", () => {
    expect(viewSource).toContain('href="/dashboard/meetings"');
  });
});
