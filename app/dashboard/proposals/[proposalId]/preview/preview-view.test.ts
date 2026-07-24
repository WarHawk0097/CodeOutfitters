// Node-env unit tests for the P-D12/P-D15..P-D17 + PDF-01..15 proposal-preview route
// (SCREEN_PROPOSAL_PREVIEW). No DOM: the zoom/page helpers are pure and exercised directly, and the
// workspace / not-found views are rendered with react-dom/server so the canonical assembled document,
// the read-only send gate, and the honest demo posture can be asserted without jsdom. The route/auth
// fact lives in page.tsx and is asserted by reading the source.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CANONICAL_DEMO_PROPOSAL_ID,
  clampPage,
  PreviewNotFound,
  PreviewWorkspace,
  stepZoom,
  zoomLabel,
  zoomScale,
} from "./preview-view";
import { buildPreviewDocument } from "../../../../../lib/command-center/proposals/fixtures";
import { scheduleTotalPct } from "../../../../../lib/command-center/proposals/validation";
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

const OTHER: Proposal = { ...PRO_2034, id: "PRO-2019", client: "Northwind", leadName: "Sam Ok", service: "Integrations", value: 112000 };

function workspace(proposal: Proposal = PRO_2034, initialPageIndex = 0) {
  return renderToStaticMarkup(
    createElement(PreviewWorkspace, { proposal, document: buildPreviewDocument(proposal), initialPageIndex }),
  );
}

const here = fileURLToPath(new URL(".", import.meta.url));
const pageSource = readFileSync(`${here}page.tsx`, "utf8");
const viewSource = readFileSync(`${here}preview-view.tsx`, "utf8");

describe("proposal preview route (P-D12/P-D15..P-D17 · SCREEN_PROPOSAL_PREVIEW)", () => {
  // 1 — canonical header: id · client — proposal preview · version.
  it("renders the canonical preview header", () => {
    const html = workspace();
    expect(html).toContain("PRO-2034");
    expect(html).toContain("Solterra Energy — proposal preview");
    expect(html).toContain("v1");
    expect(html).toContain("Read-only");
  });

  // 2 — the assembled PDF's status badge (canonical demo state is Outdated).
  it("renders the PDF status badge", () => {
    expect(workspace()).toContain("PDF OUTDATED");
  });

  // 3 — the preview toolbar: page navigator, zoom group, print-layout toggle.
  it("renders the page navigator, zoom group, and print-layout toggle", () => {
    const html = workspace();
    expect(html).toContain('aria-label="Proposal pages"');
    expect(html).toContain('aria-label="Zoom"');
    expect(html).toContain("Fit width");
    expect(html).toContain("Fit page");
    expect(html).toContain("Print layout");
  });

  // 4 — the cover page renders by default, page-for-page with the PDF.
  it("renders the canonical cover page first", () => {
    const html = workspace();
    expect(html).toContain("PAGE 1 OF 15");
    expect(html).toContain("EXECUTIVE SOLUTION PROPOSAL");
    expect(html).toContain("Field-Service Order Automation for Solterra Energy");
  });

  // 5 — the workspace makes no Supabase or network claim (demo island).
  it("makes no Supabase or network claim in demo markup", () => {
    const html = workspace().toLowerCase();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("fetch(");
  });

  // 6 — shared, deterministic fixture: PRO-2034 is a 15-page, eight-spread document.
  it("builds the deterministic PRO-2034 assembled document", () => {
    const doc = buildPreviewDocument(PRO_2034);
    expect(doc.totalPageCount).toBe(15);
    expect(doc.pages).toHaveLength(8);
    expect(CANONICAL_DEMO_PROPOSAL_ID).toBe("PRO-2034");
  });

  // 7 — the investment page renders the total exactly, in a real pricing table.
  it("renders the $86,400 total on the investment page in a table", () => {
    const html = workspace(PRO_2034, 5);
    expect(html).toContain("$86,400");
    expect(html).toContain("Net 21");
    expect(html).toContain("<table");
    expect(html).toContain('scope="row"');
  });

  // 8 — the milestone schedule is canonical and totals 100%.
  it("renders the canonical milestone schedule totalling 100%", () => {
    const doc = buildPreviewDocument(PRO_2034);
    const milestones = doc.pages.flatMap((p) => p.blocks).flatMap((b) => (b.kind === "milestoneTable" ? b.milestones : []));
    expect(scheduleTotalPct(milestones)).toBe(100);
    const html = workspace(PRO_2034, 5);
    expect(html).toContain("Thirteen weeks, three phases.");
    expect(html).toContain("payment 40%");
  });

  // 9 — the canonical spread order is preserved in the page navigator.
  it("preserves the canonical spread order", () => {
    const labels = buildPreviewDocument(PRO_2034).pages.map((p) => p.navLabel);
    expect(labels).toEqual([
      "Cover",
      "01 · Executive summary",
      "02 · Current state & opportunity",
      "03–04 · Solution & workflow",
      "05–06 · Modules & scope",
      "07–08 · Delivery & investment",
      "09–11 · Assurance",
      "12–13 · Next steps & acceptance",
    ]);
  });

  // 10 — page navigation exposes current/total and disables prev at the first page.
  it("exposes page position and disables previous on the first page", () => {
    const html = workspace();
    expect(html).toContain('aria-label="Previous page"');
    expect(html).toContain('aria-label="Next page"');
    expect(html).toContain('aria-live="polite"');
    // First page: the Previous control is disabled.
    expect(html).toMatch(/Previous page"[^>]*disabled|disabled[^>]*aria-label="Previous page"/);
  });

  // 11 — zoom is a local, non-persistent view control; it exposes its current value.
  it("keeps zoom local and announces its current value", () => {
    expect(workspace()).toContain("Fit width");
    expect(viewSource).toContain("useState");
    expect(viewSource).toContain("stepZoom");
    // No persistence of the view state.
    expect(viewSource).not.toContain("localStorage");
    expect(viewSource).not.toContain("sessionStorage");
  });

  // 12 — the pure zoom/page helpers behave.
  it("computes zoom labels, steps, scale, and clamped page index", () => {
    expect(zoomLabel("fit-width")).toBe("Fit width");
    expect(zoomLabel(125)).toBe("125%");
    expect(stepZoom(100, 1)).toBe(125);
    expect(stepZoom(150, 1)).toBe(150);
    expect(stepZoom(75, -1)).toBe(75);
    expect(stepZoom("fit-page", 1)).toBe(125);
    expect(zoomScale(150)).toBe(1.5);
    expect(zoomScale("fit-width")).toBe(1);
    expect(clampPage(9, 8)).toBe(7);
    expect(clampPage(-2, 8)).toBe(0);
  });

  // 13 — Edit / Back-to-edit link the built builder route; no dead links.
  it("links back to the proposal builder", () => {
    const html = workspace();
    expect(html).toContain('href="/dashboard/proposals/PRO-2034/edit"');
    expect(html).toContain('href="/dashboard/proposals"');
  });

  // 14 — the preview shows the SAVED proposal, not unsaved builder edits.
  it("renders the saved proposal document and never claims unsaved edits carry over", () => {
    // It builds from the stored proposal record, not from any passed-in draft edits.
    expect(viewSource).toContain("buildPreviewDocument(proposal)");
    expect(viewSource).toContain("state.proposals.find");
    // No draft/edit payload is smuggled through the URL or storage.
    expect(viewSource).not.toContain("searchParams");
    expect(viewSource).not.toContain("localStorage");
  });

  // 15 — the read-only validation panel renders with the canonical count.
  it("renders the read-only validation panel", () => {
    const html = workspace();
    expect(html).toContain("VALIDATION · 2 TO RESOLVE");
    expect(html).toContain("uptime");
  });

  // 16 — the blocked send gate is stated in text, not colour alone.
  it("states the blocked send gate textually", () => {
    const html = workspace();
    expect(html).toContain("BLOCKED");
    expect(html.toLowerCase()).toContain("cannot be sent");
  });

  // 17 — Send is disabled and its reason is associated for screen readers.
  it("keeps Send disabled with an accessible, validation-linked reason", () => {
    const html = workspace();
    expect(html).toContain("Send");
    expect(html).toContain("aria-describedby");
    expect((html.match(/disabled/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  // 18 — Download PDF is disabled with an honest reason; no fake download.
  it("keeps Download PDF disabled with an honest reason", () => {
    const html = workspace();
    expect(html).toContain("Download PDF");
    expect(html.toLowerCase()).toContain("available in the live workspace");
    expect(html.toLowerCase()).not.toContain("download ready");
  });

  // 19 — Share secure link is disabled; no fabricated secure token or public URL.
  it("keeps Share secure link disabled and fabricates no secure URL", () => {
    const html = workspace();
    expect(html).toContain("Share secure link");
    expect(html).not.toContain('href="/proposal/');
    expect(html).not.toContain('href="/proposal"');
  });

  // 20 — never claims a send, generation, delivery, signature, or approval happened.
  it("never claims a send, generation, delivery, signature, or approval happened", () => {
    const html = workspace().toLowerCase();
    for (const banned of ["proposal sent", "email sent", "pdf generated", "download ready", "delivered", "e-signed", "signature captured", "approved by"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 21 — content is real, selectable DOM, never canvas-rendered text.
  it("renders real document DOM, not a canvas", () => {
    const html = workspace(PRO_2034, 1);
    expect(html).toContain("<h2");
    expect(html).not.toContain("<canvas");
  });

  // 22 — print layout is a screen toggle; it never invokes the browser print dialog.
  it("toggles a print layout without invoking the print dialog", () => {
    expect(viewSource).toContain("printLayout");
    expect(viewSource).not.toContain("window.print");
    expect(viewSource).not.toContain(".print()");
  });

  // 23 — unknown / invalid id renders an honest not-found, never a fabricated document.
  it("renders an honest not-found for an unknown proposal", () => {
    const html = renderToStaticMarkup(createElement(PreviewNotFound, { proposalId: "PRO-9999" }));
    expect(html).toContain("Proposal not found");
    expect(html).toContain("PRO-9999");
    expect(html).toContain('href="/dashboard/proposals"');
    expect(html.toLowerCase()).not.toContain("page 1 of 15");
  });

  // 24 — a non-canonical proposal previews honestly: one summary page, its own total, no fake 15 pages.
  it("previews a non-canonical proposal without fabricating a 15-page document", () => {
    const doc = buildPreviewDocument(OTHER);
    expect(doc.totalPageCount).toBe(1);
    expect(doc.pages).toHaveLength(1);
    expect(doc.blockedReason).toBeNull();
    const html = workspace(OTHER, 0);
    expect(html).toContain("$112,000");
    expect(html).toContain("PAGE 1 OF 1");
    expect(html).not.toContain("PAGE 1 OF 15");
  });

  // 25 — product-facing language, no engineering slang / rejected copy.
  it("uses product-facing language, not engineering slang", () => {
    const html = workspace().toLowerCase();
    for (const banned of ["mock", "endpoint", "not implemented", "backend", "api ", "todo", "lorem ipsum"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 26 — none of the rejected fake widgets (native PDF embed, signature pad, payment/CRM).
  it("renders none of the rejected fake widgets", () => {
    const html = workspace().toLowerCase();
    for (const banned of ["<embed", "<iframe", "signature pad", "e-signature", "payment link", "sync to crm"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 27 — the route page preserves the Work Order F auth/authz boundary in live mode.
  it("gates the preview page through resolveDashboardContext", () => {
    expect(pageSource).toContain("resolveDashboardContext");
    expect(pageSource).toContain("/dashboard/proposals/${proposalId}/preview");
  });

  // 28 — reads the demo store, never mints a random id; no dominant warning banner.
  it("reads the demo store, mints no id, and states the demo posture calmly", () => {
    expect(viewSource).toContain("useDemoQuery");
    expect(viewSource).not.toContain("Math.random");
    expect(viewSource).not.toContain("crypto.randomUUID");
    const html = workspace();
    expect(html).not.toContain("⚠");
    expect(html.toUpperCase()).not.toContain("WARNING:");
  });
});
