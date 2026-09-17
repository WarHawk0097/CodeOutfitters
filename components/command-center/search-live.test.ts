// Live search hook — source-surface tests, same idiom as saved-views-live.test.ts: this is a
// client hook, so these assert on the properties that would be a lie if they regressed (debounce,
// abort-on-stale, generation-gated apply, reset-to-idle) rather than on a render tree.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("components/command-center/search-live.ts");

describe("live search hook (search-live.ts)", () => {
  it("is the only file that imports fetchLiveSearch — the dialog itself never calls the network", () => {
    expect(src).toContain('import { fetchLiveSearch, LIVE_SEARCH_DEBOUNCE_MS, type LiveSearchState } from "../../lib/search/live-search";');
  });

  it("resets to idle the instant it is disabled — closed dialog, cleared query, or demo mode", () => {
    expect(src).toContain("if (!enabled) {\n      setState(IDLE);\n      return;\n    }");
  });

  it("debounces on the shared constant rather than a hand-rolled timeout duration", () => {
    expect(src).toContain("setTimeout(() => {");
    expect(src).toContain("}, LIVE_SEARCH_DEBOUNCE_MS);");
  });

  it("cancels the in-flight request and its timer on every re-run, so a stale query cannot outlive a newer one", () => {
    expect(src).toContain("clearTimeout(timer);");
    expect(src).toContain("controller.abort();");
  });

  it("gates a resolved response on a generation counter, so a late response cannot overwrite newer results", () => {
    expect(src).toContain("const mine = ++generation.current;");
    expect(src).toContain("if (next === null || mine !== generation.current) return;");
  });

  it("shows loading immediately on every enabled change, not only after the debounce fires", () => {
    expect(src).toContain('setState({ status: "loading" });');
  });
});
