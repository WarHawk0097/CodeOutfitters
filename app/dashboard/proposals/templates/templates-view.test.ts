// Node-env unit tests for the P-D02/P-D14 proposal-templates route (SCREEN_PROPOSAL_TEMPLATES).
// No DOM: the pure pieces (PROPOSAL_TEMPLATES, TEMPLATE_DEFINES/EXCLUDES, filterTemplates,
// TemplatesContent, TemplatePreviewBody) are exercised directly, the components via
// react-dom/server so their canonical markup and honest demo posture can be asserted without
// jsdom. The route/auth fact lives in page.tsx and is asserted by reading the source.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  filterTemplates,
  PROPOSAL_TEMPLATES,
  TemplatePreviewBody,
  TemplatesContent,
  TemplatesView,
  TEMPLATE_DEFINES,
  TEMPLATE_EXCLUDES,
} from "./templates-view";

function markup() {
  return renderToStaticMarkup(createElement(TemplatesContent));
}

function previewMarkup(index = 0) {
  return renderToStaticMarkup(
    createElement(TemplatePreviewBody, { template: PROPOSAL_TEMPLATES[index], reasonId: "r" }),
  );
}

const here = fileURLToPath(new URL(".", import.meta.url));
const pageSource = readFileSync(`${here}page.tsx`, "utf8");

describe("proposal templates route (P-D02/P-D14 · SCREEN_PROPOSAL_TEMPLATES)", () => {
  // 1 — the five canonical templates, verbatim from proposal-templates.json.
  it("renders exactly the five canonical templates by name", () => {
    expect(PROPOSAL_TEMPLATES).toHaveLength(5);
    const names = PROPOSAL_TEMPLATES.map((t) => t.name);
    expect(names).toEqual([
      "AI Automation",
      "Custom Software",
      "Web Application",
      "Workflow Integration",
      "Discovery and Strategy",
    ]);
    const html = markup();
    for (const name of names) expect(html).toContain(name);
  });

  // 2 — the canonical "define" and "forbidden" facts.
  it("exposes the canonical template defines and exclusions", () => {
    expect(TEMPLATE_DEFINES).toEqual(["Section order", "Default copy", "Required information", "Visual variants"]);
    expect(TEMPLATE_EXCLUDES).toEqual(["Hard-coded prices", "Hard-coded timelines"]);
    const html = previewMarkup();
    for (const item of TEMPLATE_DEFINES) expect(html).toContain(item);
    for (const item of TEMPLATE_EXCLUDES) expect(html).toContain(item);
  });

  // 3 — honest header posture: samples, not a stored library; prices/timelines per proposal.
  it("renders the header with an honest sample-and-no-pricing posture", () => {
    const html = markup();
    expect(html).toContain("Proposal templates");
    expect(html.toLowerCase()).toContain("sample starting points");
    expect(html.toLowerCase()).toContain("set per proposal");
  });

  // 4 — pure local search filters deterministically over name + description.
  it("filters templates case-insensitively by name and description", () => {
    expect(filterTemplates(PROPOSAL_TEMPLATES, "web")).toHaveLength(1);
    expect(filterTemplates(PROPOSAL_TEMPLATES, "WEB")[0].name).toBe("Web Application");
    expect(filterTemplates(PROPOSAL_TEMPLATES, "workflow")[0].name).toBe("Workflow Integration");
    expect(filterTemplates(PROPOSAL_TEMPLATES, "")).toHaveLength(5);
  });

  // 5 — no-match returns nothing (drives the canonical empty state).
  it("returns no templates when the search matches nothing", () => {
    expect(filterTemplates(PROPOSAL_TEMPLATES, "zzzznotpresent")).toHaveLength(0);
  });

  // 6 — accessible, keyboard-operable catalogue with a real search field.
  it("renders keyboard-operable template cards and an accessible search field", () => {
    const html = markup();
    expect(html).toContain('type="search"');
    expect(html).toContain('aria-label="Search templates by name"');
    // Each template is a button, not a colour-only tile.
    expect((html.match(/<button/g) || []).length).toBeGreaterThanOrEqual(5);
    expect(html).toContain("PREVIEW");
  });

  // 7 — "Use template" is disabled with an accessible, honest reason and never dead-links.
  it("keeps Use template disabled with an accessible reason and no dead link", () => {
    const html = previewMarkup();
    expect(html).toContain("live workspace");
    expect(html.toLowerCase()).toContain("nothing is created");
    // The builder route is unbuilt — the preview must not link to it.
    expect(html).not.toContain("/edit");
    expect(html).not.toContain("/preview");
  });

  // 8 — no invented, non-canonical template attributes.
  it("invents no non-canonical template attributes", () => {
    const html = (markup() + previewMarkup()).toLowerCase();
    for (const banned of ["usage count", "used ", "owner", "last updated", "category", "thumbnail", "pricing structure", "status"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 9 — no template carries a price or timeline (proposal-templates.json "forbidden").
  it("shows no hard-coded price or timeline on any template", () => {
    const html = markup() + previewMarkup(0) + previewMarkup(1) + previewMarkup(4);
    expect(html).not.toContain("$");
    expect(html).not.toMatch(/\b\d+\s*(days?|weeks?|months?)\b/i);
  });

  // 10 — no demo mutation controls exist (nothing to create/duplicate/delete/archive/publish/save).
  it("exposes no create, duplicate, delete, archive, publish, or save controls", () => {
    const html = markup().toLowerCase();
    for (const banned of ["new template", "create template", "duplicate", "delete", "archive", "publish", "save template"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 11 — back navigation to the proposals directory and the source picker.
  it("links back to the proposals directory and the proposal source picker", () => {
    const html = renderToStaticMarkup(createElement(TemplatesView));
    expect(html).toContain('href="/dashboard/proposals"');
    expect(html).toContain('href="/dashboard/proposals/new"');
  });

  // 12 — no Supabase or network claim in demo markup.
  it("makes no Supabase or network claim in demo markup", () => {
    const html = (markup() + previewMarkup()).toLowerCase();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("fetch(");
  });

  // 13 — product-facing language, never engineering slang.
  it("uses product-facing language, not engineering slang", () => {
    const html = (markup() + previewMarkup()).toLowerCase();
    for (const banned of ["mock", "endpoint", "not implemented", "backend", "api disconnected", "future route", "design preview"]) {
      expect(html).not.toContain(banned);
    }
  });

  // 14 — the route page preserves the Work Order F auth/authz boundary in live mode.
  it("gates the templates page through resolveDashboardContext", () => {
    expect(pageSource).toContain("resolveDashboardContext");
    expect(pageSource).toContain('"/dashboard/proposals/templates"');
  });
});
