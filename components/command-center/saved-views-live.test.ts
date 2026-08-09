// Live Saved View bar — source-surface tests (Part 9 / Part 13). Same idiom as
// saved-views.test.ts: this is a client component, so these assert on the properties that
// would be a lie if they regressed rather than on a render tree.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("components/command-center/saved-views-live.tsx");

describe("live saved view bar (saved-views-live.tsx)", () => {
  it("renders loading, error and populated states — never demo content for any of them", () => {
    expect(src).toContain('load.status === "loading"');
    expect(src).toContain("Loading saved views…");
    expect(src).toContain('load.status === "error"');
    expect(src).toContain("{load.message}");
    // An empty workspace is a `ready` load with an empty serverViews array, not a distinct
    // "empty" branch — the selector already renders "No saved view" for zero rows, so there is
    // nothing separate to fake.
    expect(src).toContain("serverViews: SavedView[]");
  });

  it("has no fallback to a fixture or the demo store anywhere in this file", () => {
    expect(src).not.toMatch(/lib\/demo/);
    // The header comment says "never to localStorage" — that is the claim under test, not a
    // usage. Assert there is no actual read/write call.
    expect(src).not.toMatch(/localStorage\.(setItem|getItem|removeItem)/);
    // The only source of view rows beyond the built-ins is the API response.
    expect(src).toContain("...builtins, ...load.serverViews");
  });

  it("talks to the API and nowhere else — every mutation is a fetch to app/api/dashboard/saved-views", () => {
    expect(src).toContain('fetch(`/api/dashboard/saved-views?scope=${encodeURIComponent(scope)}`');
    expect(src).toContain('method: "POST"');
    expect(src).toContain("`/api/dashboard/saved-views/${id}`");
    expect(src.match(/method: "PATCH"/g)?.length).toBe(2);
    expect(src).toContain('method: "DELETE"');
  });

  it("surfaces a failed load or a failed mutation as a real error, never a silent no-op", () => {
    expect(src).toContain('return { status: "error", message: body?.error?.message ?? "Saved Views could not be loaded." }');
    expect(src).toContain("if (!result.ok) return setActionError(result.message)");
    expect(src).toContain('role="alert"');
  });

  it("re-fetches from the server after every mutation instead of guessing the new state locally", () => {
    // Every write path calls refresh() rather than splicing a locally-constructed row into
    // state — the server's row (defaults, RLS-applied visibility) is the only source of truth.
    expect(src.match(/await refresh\(\);/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("gates rename/delete/rename-shared behind canEditSavedView, not a client-side role guess", () => {
    expect(src).toContain("const editable = selected !== null && canEditSavedView(selected, viewer)");
    expect(src).toContain('{ id: "rename", label: "Rename", disabled: !editable }');
    expect(src).toContain('{ id: "delete", label: "Delete", disabled: !editable }');
    // Shared-view creation is offered but disabled with a reason when the caller cannot, rather
    // than hidden — same honesty rule as the demo bar's Shared radio.
    expect(src).toContain("const sharedAllowed = canCreateSharedView(viewer)");
    expect(src).toContain("disabled={!sharedAllowed}");
    expect(src).toContain("SHARED_REQUIRES_ADMIN_REASON");
  });

  it("scopes the default-view toggle to the caller's own personal views only", () => {
    expect(src).toContain("const canDefault =");
    expect(src).toContain('selected.ownership.kind === "personal" && selected.ownership.userId === viewer.userId');
    expect(src).toContain('id: "default"');
    expect(src).toContain("isCallerDefault");
    expect(src).toContain("disabled: !canDefault");
  });

  it("shows a busy state while a mutation is in flight, distinct from the initial load", () => {
    expect(src).toContain("const [busy, setBusy] = useState(false)");
    expect(src).toContain("Saving…");
    expect(src).toContain("disabled={!savable || busy}");
  });

  it("confirms delete with an undoable-nothing warning before it fires", () => {
    expect(src).toContain('title="Delete saved view"');
    expect(src).toContain("This cannot be undone.");
    expect(src).toContain('form="delete-saved-view-live-form"');
  });
});
