// Dashboard interaction-audit tests (23-32). Every visible control in the shell
// must be one of: a real navigation, a real local interaction, honestly disabled
// (with an announced reason), or hidden — never an enabled-looking no-op or a
// dead link. The shell's control surface lives in shell-nav.tsx; these tests lock
// the honest-disable posture in place.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { IMPLEMENTED_ROUTES } from "./shell-nav";

const here = fileURLToPath(new URL(".", import.meta.url));
const src = readFileSync(`${here}shell-nav.tsx`, "utf8");

describe("dashboard interaction audit (tests 23-32)", () => {
  // 23
  it("exactly the ten built routes are treated as implemented", () => {
    expect(IMPLEMENTED_ROUTES.size).toBe(10);
    expect(IMPLEMENTED_ROUTES.has("/dashboard")).toBe(true);
    expect(IMPLEMENTED_ROUTES.has("/dashboard/settings")).toBe(true);
  });

  // 24
  it("unbuilt routes stay disabled/hidden and are never stubbed to fake completion", () => {
    // Later-phase deep routes must NOT appear in the implemented set.
    expect(IMPLEMENTED_ROUTES.has("/dashboard/proposals/[proposalId]/activity")).toBe(false);
    expect(IMPLEMENTED_ROUTES.has("/proposal/[secureToken]")).toBe(false);
  });

  // 25
  it("gated nav rows render as disabled links, not 404-loading controls", () => {
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain("if (!IMPLEMENTED_ROUTES.has(href))");
  });

  // 26
  it("gated rows carry an announced, honest reason", () => {
    expect(src).toContain("Not available yet");
    expect(src).toContain("DEFERRED_REASON");
  });

  // 27
  it("the Columns action is a real disabled control, not an enabled no-op", () => {
    expect(src).toContain("Columns ▾");
    expect(src).toMatch(/role="button"[\s\S]*?aria-disabled="true"[\s\S]*?Columns/);
  });

  // 28
  it("in demo mode Export is inert with an honest data-service reason", () => {
    expect(src).toContain("Available when the production data service is connected.");
  });

  // 29
  it("in live mode Export is a real button gated on downloadsEnabled", () => {
    expect(src).toContain("downloadsEnabled ? (");
    expect(src).toContain("onClick={onExport}");
  });

  // 30
  it("the export result is announced through a polite live region", () => {
    expect(src).toContain('role="status"');
    expect(src).toContain("Preparing CSV export");
  });

  // 31
  it("no control in the shell is a dead link", () => {
    expect(src).not.toContain('href="#"');
    expect(src).not.toContain("href={'#'}");
  });

  // 32
  it("the export handler is guarded by a ref so rapid clicks cannot double-download", () => {
    expect(src).toContain("exportingRef");
    expect(src).toContain("if (!downloadsEnabled || exportingRef.current || !exportQuery) return");
  });
});
