// Node-env unit tests for the P-D02 create-proposal (source picker) route. No DOM: the pure
// pieces (PROPOSAL_SOURCES, DEFAULT_SOURCE, CreateContent) are exercised directly,
// CreateContent via react-dom/server so its canonical markup and honest demo posture can be
// asserted without jsdom. The route/auth fact lives in page.tsx and is asserted by reading
// the source.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CreateContent, DEFAULT_SOURCE, PROPOSAL_SOURCES } from "./create-view";

function markup() {
  return renderToStaticMarkup(createElement(CreateContent));
}

const here = fileURLToPath(new URL(".", import.meta.url));
const pageSource = readFileSync(`${here}page.tsx`, "utf8");

describe("create proposal route (P-D02 · SCREEN_PROPOSAL_CREATE)", () => {
  // 1
  it("renders the canonical header and fact-import subtitle", () => {
    const html = markup();
    expect(html).toContain("Create proposal");
    expect(html).toContain("Only confirmed requirements and approved Canvas content import as fact.");
  });

  // 2
  it("renders the four canonical proposal sources with verbatim descriptions", () => {
    expect(PROPOSAL_SOURCES).toHaveLength(4);
    const html = markup();
    for (const option of PROPOSAL_SOURCES) {
      expect(html).toContain(option.title);
      expect(html).toContain(option.description.replace(/&/g, "&amp;"));
    }
    expect(html).toContain("From meeting");
    expect(html).toContain("Blank / revision");
  });

  // 3
  it("defaults the selected source to From meeting", () => {
    expect(DEFAULT_SOURCE).toBe("meeting");
    const html = markup();
    // Exactly the meeting radio is checked by default.
    expect(html).toContain('checked="" value="meeting"');
    expect(html.match(/checked=""/g)).toHaveLength(1);
  });

  // 4
  it("uses accessible radio semantics for source selection (not colour-only)", () => {
    const html = markup();
    expect(html).toContain("<fieldset");
    expect(html).toContain("<legend");
    expect(html).toContain('type="radio"');
    // The selected option is announced textually, not by colour alone.
    expect(html).toContain("Selected");
  });

  // 5
  it("keeps Continue disabled with an accessible, honest reason", () => {
    const html = markup();
    expect(html).toContain("Continue");
    expect(html).toContain("disabled");
    expect(html).toContain("aria-describedby");
    expect(html.toLowerCase()).toContain("no provider is connected");
    expect(html.toLowerCase()).toContain("cannot be created or saved");
  });

  // 6 — back navigation to the proposals directory.
  it("links Cancel and back navigation to the proposals directory", () => {
    const html = markup();
    expect(html).toContain('href="/dashboard/proposals"');
    expect(html).toContain("Cancel");
  });

  // 7
  it("never claims a proposal was saved, sent, generated, or delivered", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("proposal sent");
    expect(html).not.toContain("proposal saved");
    expect(html).not.toContain("draft saved");
    expect(html).not.toContain("pdf ready");
    expect(html).not.toContain("email sent");
    expect(html).not.toContain("delivered");
  });

  // 8
  it("makes no Supabase or network claim in demo markup", () => {
    const html = markup().toLowerCase();
    expect(html).not.toContain("supabase");
    expect(html).not.toContain("fetch(");
  });

  // 9 — no dead links to the unbuilt builder / preview routes.
  it("does not dead-link to the unbuilt builder or preview routes", () => {
    const html = markup();
    expect(html).not.toContain("/edit");
    expect(html).not.toContain("/preview");
  });

  // 10 — the route page preserves the Work Order F auth/authz boundary in live mode.
  it("gates the create page through resolveDashboardContext", () => {
    expect(pageSource).toContain("resolveDashboardContext");
    expect(pageSource).toContain('"/dashboard/proposals/new"');
  });

  // 11
  it("keeps rejected patterns off the screen — no invented editor fields or fake widgets", () => {
    const html = markup().toLowerCase();
    // Line items / pricing / e-signature belong to SCREEN_PROPOSAL_BUILDER, not this screen.
    expect(html).not.toContain("line item");
    expect(html).not.toContain("e-signature");
    expect(html).not.toContain("signature pad");
    expect(html).not.toContain("grouped-bar");
    expect(html).not.toContain("rich-text");
  });

  // 12 — subtle demo identification, not a dominant warning banner.
  it("identifies the demo posture subtly without a dominant warning banner", () => {
    const html = markup();
    expect(html.toLowerCase()).toContain("demo mode");
    expect(html).not.toContain("⚠");
    expect(html.toUpperCase()).not.toContain("WARNING:");
  });
});
