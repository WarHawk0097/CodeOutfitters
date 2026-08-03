// use-command-create-dialog underlies the "New X" create dialog on five
// routes (Proposals, Pipeline, My Work, Meetings, Follow-ups). It replaced a
// `useState` + `useEffect` pair duplicated identically in all five view
// files, each syncing local dialog-open state from a `?new=1` query read.
//
// Two things matter here, and neither can be proven by reading source alone:
// 1. Closing must remove *only* `new` from the query string, leaving every
//    other param (a Saved View's filters, `mock-scenario`, etc.) untouched.
// 2. That removal must go through `history.replaceState`, never
//    `pushState` — so closing the dialog never adds a Back-button stop and
//    never scrolls the page (replaceState does neither).
//
// The hook itself (`useCommandCreateDialog`) can't be exercised without a
// React renderer, which this app's unit suite doesn't have (see
// my-work-view.test.ts's note on source-based assertions). What it delegates
// to for closing — `setQueryParam` from ./use-view-query — is a plain
// function and *can* be exercised directly, against a minimal stand-in for
// `window` (this suite runs under vitest's node environment, which has no
// DOM; see vitest.config.ts).
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setQueryParam } from "./use-view-query";
import { COMMAND_CREATE_PARAM } from "../../lib/search/commands";

const here = fileURLToPath(new URL(".", import.meta.url));
const hookSrc = readFileSync(`${here}use-command-create-dialog.ts`, "utf8");

const VIEW_FILES = [
  "app/dashboard/proposals/proposals-view.tsx",
  "app/dashboard/pipeline/pipeline-board.tsx",
  "app/dashboard/my-work/my-work-view.tsx",
  "app/dashboard/meetings/meetings-view.tsx",
  "app/dashboard/follow-ups/follow-ups-view.tsx",
] as const;

describe("useCommandCreateDialog", () => {
  it("derives open state; it does not synchronize it through an effect", () => {
    expect(hookSrc).toContain("localOpen || requested");
    expect(hookSrc).not.toMatch(/useEffect/);
  });

  it("is the one place all five create-dialog routes get this from", () => {
    for (const relative of VIEW_FILES) {
      const src = readFileSync(`${here}../../${relative}`, "utf8");
      expect(src).toContain("useCommandCreateDialog");
      // The old pattern this replaced: a local boolean plus an effect that
      // set it from the URL. If any route regresses to that, the whole
      // point of a shared hook — one behavior, not five near-copies — is
      // gone.
      expect(src).not.toMatch(/useEffect\(\s*\(\) => {\s*if \(createRequested\)/);
    }
  });

  it("closing clears only `new`, preserving every other query param", () => {
    const window = {
      location: { pathname: "/dashboard/proposals", search: "?a=1&new=1&b=2" },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("window", window);

    setQueryParam(COMMAND_CREATE_PARAM, "");

    expect(window.history.pushState).not.toHaveBeenCalled();
    expect(window.history.replaceState).toHaveBeenCalledTimes(1);
    const [, , url] = window.history.replaceState.mock.calls[0]!;
    expect(url).toBe("/dashboard/proposals?a=1&b=2");

    vi.unstubAllGlobals();
  });

  it("closing when there is no other param leaves a bare path, no trailing `?`", () => {
    const window = {
      location: { pathname: "/dashboard/my-work", search: "?new=1" },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("window", window);

    setQueryParam(COMMAND_CREATE_PARAM, "");

    const [, , url] = window.history.replaceState.mock.calls[0]!;
    expect(url).toBe("/dashboard/my-work");

    vi.unstubAllGlobals();
  });
});
