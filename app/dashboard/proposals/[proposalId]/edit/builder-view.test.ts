// Node-env unit tests for the P-D03..P-D09 proposal-builder route (SCREEN_PROPOSAL_BUILDER).
// No DOM: the money/schedule/reorder helpers are pure and exercised directly, and the workspace /
// not-found views are rendered with react-dom/server so their canonical markup and honest demo
// posture can be asserted without jsdom. The route/auth fact lives in page.tsx and is asserted by
// reading the source.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BuilderNotFound,
  BuilderWorkspace,
  buildProposalDetail,
  CANONICAL_DEMO_PROPOSAL_ID,
  dollarsToCents,
  formatUsd,
  isScheduleBalanced,
  moveItem,
  parseAmountToCents,
  scheduleTotalPct,
  sumCents,
} from "./builder-view";
import type { Proposal } from "../../../../../lib/demo/types";

const PRO_2034: Proposal = {
  id: "PRO-2034",
  leadId: "lead-001",
  opportunityId: "opp-001",
  client: "Solterra Energy",
  leadName: "Priyanka Rao",
  service: "Custom Software",
  value: 86400,
  ownerId: "user-002",
  version: "v1",
  state: "DRAFT",
  lastEvent: "32m ago",
  source: "Meeting · Solution Canvas",
};

const OTHER: Proposal = { ...PRO_2034, id: "PRO-2019", client: "Northwind", service: "Integrations", value: 112000 };

function workspace(
  proposal: Proposal = PRO_2034,
  opts: { initialTab?: "Content" | "Design" | "Data" | "AI Assist" | "Validation"; initialSectionId?: string } = {},
) {
  return renderToStaticMarkup(
    createElement(BuilderWorkspace, { proposal, detail: buildProposalDetail(proposal), ...opts }),
  );
}

const here = fileURLToPath(new URL(".", import.meta.url));
const pageSource = readFileSync(`${here}page.tsx`, "utf8");
const viewSource = readFileSync(`${here}builder-view.tsx`, "utf8");

describe("proposal builder route (P-D03..P-D09 · SCREEN_PROPOSAL_BUILDER)", () => {
  // 1 — route renders the canonical header: id · client — title.
  it("renders the canonical proposal header", () => {
    const html = workspace();
    expect(html).toContain("PRO-2034");
    expect(html).toContain("Solterra Energy");
    expect(html).toContain("Executive Solution Proposal");
  });

  // 2 — DRAFT / unreviewed badge from the P-D03 frame.
  it("renders the DRAFT · AI GENERATED · UNREVIEWED badge", () => {
    expect(workspace()).toContain("DRAFT v1 · AI GENERATED · UNREVIEWED");
  });

  // 3 — the three-column workspace: structure nav, canvas, tab strip.
  it("renders the structure navigator and the builder tab strip", () => {
    const html = workspace();
    expect(html).toContain("STRUCTURE");
    expect(html).toContain('aria-label="Proposal structure"');
    expect(html).toContain('role="tablist"');
    for (const tab of ["Content", "Design", "Data", "AI Assist", "Validation"]) expect(html).toContain(tab);
  });

  // 4 — the canonical section spine with REQ markers.
  it("renders canonical sections including the required ones", () => {
    const html = workspace();
    for (const name of ["Executive summary", "Proposed solution", "Scope &amp; deliverables", "Pricing", "Milestones &amp; payment schedule", "Terms &amp; validity"]) {
      expect(html).toContain(name);
    }
    expect(html).toContain("REQ");
  });

  // 5 — the workspace makes no Supabase or network claim (demo island).
  it("makes no Supabase or network claim in demo markup", () => {
    const html = workspace().toLowerCase();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("fetch(");
  });

  // 6 — deterministic canonical fixture: PRO-2034 pricing sums to the seed total.
  it("builds a deterministic PRO-2034 detail whose pricing sums to the total value", () => {
    const detail = buildProposalDetail(PRO_2034);
    expect(detail.pricing).toHaveLength(4);
    const total = detail.pricing.reduce((sum, line) => sum + line.cents, 0);
    expect(total).toBe(dollarsToCents(86400));
    expect(CANONICAL_DEMO_PROPOSAL_ID).toBe("PRO-2034");
  });

  // 7 — title edit is wired to local state (edited in the Content tab, never persisted).
  it("wires a local, editable section title and body", () => {
    expect(viewSource).toContain("Section title");
    expect(viewSource).toContain("Section content");
    expect(viewSource).toContain("setSectionName");
    expect(viewSource).toContain("setSectionBody");
  });

  // 8 — the Data tab exposes the imported facts (client, service, source, value).
  it("renders the imported client/source facts read-only", () => {
    const html = workspace(PRO_2034, { initialTab: "Data" });
    expect(html).toContain("Only confirmed requirements and approved Canvas content import as fact.");
    expect(html).toContain("Meeting · Solution Canvas");
  });

  // 9 — pricing line amounts are edited as strings and reorder/add/remove are wired.
  it("wires local line-amount edits and section add/remove/move", () => {
    expect(viewSource).toContain("setAmounts");
    expect(viewSource).toContain("onAdd");
    expect(viewSource).toContain("onRemove");
    expect(viewSource).toContain("onMove");
  });

  // 10 — money: cents conversion is exact.
  it("converts whole dollars to integer cents", () => {
    expect(dollarsToCents(86400)).toBe(8640000);
    expect(dollarsToCents(12000)).toBe(1200000);
  });

  // 11 — money: valid amounts parse to cents.
  it("parses valid amounts to integer cents", () => {
    expect(parseAmountToCents("48000")).toEqual({ ok: true, cents: 4800000 });
    expect(parseAmountToCents("48,000")).toEqual({ ok: true, cents: 4800000 });
    expect(parseAmountToCents("$12,000.50")).toEqual({ ok: true, cents: 1200050 });
    expect(parseAmountToCents("0")).toEqual({ ok: true, cents: 0 });
  });

  // 12 — money safety: NaN / Infinity / negative / empty / junk are rejected.
  it("rejects NaN, Infinity, negative, empty, and non-numeric amounts", () => {
    for (const bad of ["", "  ", "abc", "-1", "-0.5", "NaN", "Infinity", "1e5", "1.234", "12.3.4", "$"]) {
      expect(parseAmountToCents(bad)).toEqual({ ok: false });
    }
  });

  // 13 — subtotal sums only the valid lines; an invalid line never zeroes the total.
  it("sums only valid line amounts", () => {
    expect(sumCents(["12000", "48000", "16400", "10000"])).toBe(dollarsToCents(86400));
    expect(sumCents(["12000", "bad", "10000"])).toBe(dollarsToCents(22000));
    expect(sumCents([])).toBe(0);
  });

  // 14 — formatting: whole dollars render without cents; fractional render with cents.
  it("formats cents as USD", () => {
    expect(formatUsd(8640000)).toBe("$86,400");
    expect(formatUsd(1200050)).toBe("$12,000.50");
  });

  // 15 — milestone schedule totals exactly 100%.
  it("balances the PRO-2034 milestone schedule to 100%", () => {
    const detail = buildProposalDetail(PRO_2034);
    expect(scheduleTotalPct(detail.milestones)).toBe(100);
    expect(isScheduleBalanced(detail.milestones)).toBe(true);
    expect(isScheduleBalanced([{ paymentPct: 20 }, { paymentPct: 30 }])).toBe(false);
  });

  // 16 — immutable move-up / move-down; out-of-range is a no-op.
  it("reorders items immutably and clamps out-of-range moves", () => {
    const list = ["a", "b", "c"];
    expect(moveItem(list, 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(list, 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveItem(list, 0, -1)).toEqual(["a", "b", "c"]);
    expect(moveItem(list, 2, 1)).toEqual(["a", "b", "c"]);
    expect(list).toEqual(["a", "b", "c"]);
  });

  // 17 — canonical pricing breakdown rendered in the canvas, Net 21.
  it("renders the pricing subtotal with Net 21 terms", () => {
    const html = workspace(PRO_2034, { initialSectionId: "pricing" });
    expect(html).toContain("$86,400");
    expect(html).toContain("Net 21");
  });

  // 18 — tax and discounts are honest: not calculated here / require authorization.
  it("states honest tax and discount posture", () => {
    const html = workspace(PRO_2034, { initialSectionId: "pricing" }).toLowerCase();
    expect(html).toContain("tax is set per client locale");
    expect(html).toContain("discounts require authorization");
  });

  // 19 — validation list with the canonical count and BLOCKED banner.
  it("renders the validation list and the BLOCKED send-gate", () => {
    const html = workspace(PRO_2034, { initialTab: "Validation" });
    expect(html).toContain("VALIDATION · 2 TO RESOLVE");
    expect(html).toContain("BLOCKED");
    expect(html.toLowerCase()).toContain("cannot be sent");
    expect(html.toLowerCase()).toContain("uptime claim");
  });

  // 20 — Save / Request review / Preview are disabled with accessible, honest reasons.
  it("keeps Save, Request review, and Preview disabled with accessible reasons", () => {
    const html = workspace();
    for (const label of ["Save", "Request review", "Preview"]) expect(html).toContain(label);
    expect((html.match(/disabled/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(html.toLowerCase()).toContain("available in the live workspace");
    expect(html).toContain("aria-describedby");
  });

  // 21 — honest unsaved posture, never a fake autosave or save confirmation.
  it("states the honest unsaved posture", () => {
    const html = workspace().toLowerCase();
    expect(html).toContain("aren&#x27;t saved");
    expect(html).not.toContain("saved successfully");
    expect(html).not.toContain("autosav");
    expect(html).not.toContain("all changes saved");
  });

  // 22 — never claims a proposal was sent, generated, delivered, or turned into a PDF.
  it("never claims a send, generation, delivery, or PDF happened", () => {
    const html = workspace().toLowerCase();
    for (const banned of ["proposal sent", "email sent", "pdf ready", "pdf generated", "download ready", "delivered", "e-signed", "signature captured"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 23 — AI Assist actions are disabled and carry the canonical no-invention rule.
  it("keeps AI Assist actions disabled with the canonical no-invention rule", () => {
    const html = workspace(PRO_2034, { initialTab: "AI Assist" });
    for (const chip of ["Rewrite", "Shorten", "Make executive", "Clarify scope"]) expect(html).toContain(chip);
    expect(html).toContain("AI assistance may not invent pricing, timelines, case studies, or integrations.");
  });

  // 24 — no dead links to the unbuilt preview / activity routes.
  it("does not dead-link to the unbuilt preview or activity routes", () => {
    const html = workspace();
    expect(html).not.toContain("/preview");
    expect(html).not.toContain("/activity");
  });

  // 25 — back navigation to the proposals directory.
  it("links back to the proposals directory", () => {
    expect(workspace()).toContain('href="/dashboard/proposals"');
  });

  // 26 — unknown / invalid id renders an honest not-found, never a fabricated record or a 404 throw.
  it("renders an honest not-found for an unknown proposal", () => {
    const html = renderToStaticMarkup(createElement(BuilderNotFound, { proposalId: "PRO-9999" }));
    expect(html).toContain("Proposal not found");
    expect(html).toContain("PRO-9999");
    expect(html).toContain('href="/dashboard/proposals"');
    expect(html.toLowerCase()).not.toContain("created");
  });

  // 27 — section reorder uses accessible move up/down controls, not colour-only drag.
  it("exposes accessible move-up / move-down / remove controls", () => {
    const html = workspace();
    expect(html).toContain("Move Executive summary up");
    expect(html).toContain("Move Cover down");
    expect(html).toContain("aria-label=\"Remove");
  });

  // 28 — tabs use accessible tab semantics.
  it("uses accessible tab semantics", () => {
    const html = workspace();
    expect(html).toContain('role="tab"');
    expect(html).toContain("aria-selected");
  });

  // 29 — a non-canonical proposal renders honestly: single total line, no invented breakdown/milestones.
  it("renders a non-canonical proposal without inventing a breakdown or milestones", () => {
    const detail = buildProposalDetail(OTHER);
    expect(detail.pricing).toHaveLength(1);
    expect(detail.pricing[0].cents).toBe(dollarsToCents(112000));
    expect(detail.milestones).toHaveLength(0);
    expect(detail.sections.some((s) => s.kind === "milestones")).toBe(false);
    const html = workspace(OTHER, { initialSectionId: "pricing" });
    expect(html).toContain("$112,000");
    expect(html.toLowerCase()).toContain("total set per proposal");
  });

  // 30 — no engineering slang / rejected copy on the screen.
  it("uses product-facing language, not engineering slang", () => {
    const html = workspace().toLowerCase();
    for (const banned of ["mock", "endpoint", "not implemented", "backend", "api ", "todo", "lorem ipsum"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 31 — no rejected fake widgets (e-signature pad, payment link, CRM sync button).
  it("renders none of the rejected fake widgets", () => {
    const html = workspace().toLowerCase();
    for (const banned of ["signature pad", "e-signature", "payment link", "sync to crm", "grouped-bar", "rich-text editor"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 32 — the route page preserves the Work Order F auth/authz boundary in live mode.
  it("gates the builder page through resolveDashboardContext", () => {
    expect(pageSource).toContain("resolveDashboardContext");
    expect(pageSource).toContain("/dashboard/proposals/${proposalId}/edit");
  });

  // 33 — the shell reads the demo store; no random client-side id minting to fake creation.
  it("reads the demo store and never mints a random proposal id", () => {
    expect(viewSource).toContain("useDemoQuery");
    expect(viewSource).toContain("state.proposals.find");
    expect(viewSource).not.toContain("Math.random");
    expect(viewSource).not.toContain("crypto.randomUUID");
  });

  // 34 — discard-edits control exists (reset), no fake persistence.
  it("offers a local discard-edits reset", () => {
    expect(viewSource).toContain("Discard edits");
    expect(viewSource).toContain("const reset");
  });

  // 35 — pricing edit is invalid-safe: an invalid entry shows an error and is excluded, not coerced.
  it("marks an invalid amount and excludes it from the subtotal", () => {
    expect(sumCents(["12000", "-5", "10000"])).toBe(dollarsToCents(22000));
    expect(viewSource).toContain("are excluded from the subtotal");
    expect(viewSource).toContain("Enter a valid non-negative amount.");
  });

  // 36 — no dominant warning banner; demo posture is stated calmly.
  it("identifies the demo posture without a dominant warning banner", () => {
    const html = workspace();
    expect(html).not.toContain("⚠");
    expect(html.toUpperCase()).not.toContain("WARNING:");
  });
});
