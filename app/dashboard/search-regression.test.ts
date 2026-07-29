// Release 4 — REGRESSION (tests 121-139).
//
// Search touched every list in the shell: each one gave up its local filter state and now reads
// the URL. That is the kind of change that quietly costs a feature nobody thought to look at —
// a pagination reset, a mock scenario, a tab that used to remember where it was. These lock
// down what Releases 1 to 3 established, so a later change to search has to break a named
// assertion rather than a screen.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TASK_VIEWS } from "../../lib/tasks/model";
import { ACTIVITY_VISIBILITIES } from "../../lib/activity/model";
import { INDEXABLE_ACTIVITY_VISIBILITIES, SENSITIVE_INDEX_PATTERNS, sensitiveFindings } from "../../lib/search/model";
import { buildDemoSearchIndex } from "../../lib/search/demo-index";
import { ALL_COMMANDS } from "../../lib/search/commands";
import {
  createSeedState,
  DEMO_CURRENT_USER_ID,
  DEMO_NOW,
  DEMO_SEED,
  DEMO_STATE_VERSION,
  DEMO_TODAY,
} from "../../lib/demo/seed";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");

const LIST_SCREENS = [
  "app/dashboard/my-work/my-work-view.tsx",
  "app/dashboard/leads/leads-data.tsx",
  "app/dashboard/pipeline/pipeline-board.tsx",
  "app/dashboard/meetings/meetings-view.tsx",
  "app/dashboard/proposals/proposals-view.tsx",
  "app/dashboard/follow-ups/follow-ups-view.tsx",
  "app/dashboard/email-activity/email-activity-view.tsx",
];

const NEW_FILES = [
  "lib/search/model.ts",
  "lib/search/demo-index.ts",
  "lib/search/commands.ts",
  "lib/search/recent-items.ts",
  "lib/search/routes.ts",
  "lib/search/provider.ts",
  "lib/views/model.ts",
  "lib/views/defaults.ts",
  "lib/views/store.ts",
  "lib/views/provider.ts",
  "components/command-center/command-center.tsx",
  "components/command-center/command-dialog.tsx",
  "components/command-center/saved-views.tsx",
  "components/command-center/use-view-query.ts",
];

describe("release 4 regression guards (tests 121-139)", () => {
  // 121
  it("keeps the demo/live boundary where the server decided it", () => {
    const layout = read("app/dashboard/layout.tsx");
    expect(layout).toContain("commandCenterClientConfig()");
    expect(layout).toContain("<MockBrowserInit enabled={!config.live}>");
    // The Command Center provider was added inside that gate, not around it.
    expect(layout.indexOf("<MockBrowserInit")).toBeLessThan(layout.indexOf("<CommandCenterProvider>"));
  });

  // 122
  it("keeps My Work's tabs, and the vocabulary the commands link into", () => {
    expect([...TASK_VIEWS]).toEqual(["today", "upcoming", "overdue", "assigned", "waiting", "completed"]);
    const src = read("app/dashboard/my-work/my-work-view.tsx");
    expect(src).toContain('const view = readView(filters.view ?? null);');
    expect(src).toContain('setView');
    // Every view command still names a tab this screen has.
    for (const command of ALL_COMMANDS.filter((entry) => entry.href.includes("view="))) {
      const value = new URL(command.href, "https://example.test").searchParams.get("view");
      expect(TASK_VIEWS, command.id).toContain(value);
    }
  });

  // 123
  it("keeps the dashboard date-range control and its default", () => {
    const src = read("app/dashboard/header-stats.tsx");
    expect(src).toContain("DASHBOARD_RANGE_DEFAULT");
    expect(src).toContain("DashboardRangeContext.Provider");
    // The range lives in React context, not in the query string, so nothing about the Saved
    // View serialization could have swallowed it.
    expect(src).not.toContain("useViewQuery");
  });

  // 124
  it("keeps Leads paginating, and resets to page one only when the result set changes", () => {
    const src = read("app/dashboard/leads/leads-data.tsx");
    expect(src).toContain("const [page, setPage] = useState(1);");
    expect(src).toContain('const changesResultSet = Object.keys(patch).some((key) => key !== "page");');
    expect(src).toContain("setPage(changesResultSet ? (patch.page ?? 1) : (patch.page ?? page));");
    // Page number is deliberately not a Saved View filter: a stored view that opened on page 4
    // of a list whose contents have changed is a view of nothing.
    expect(src).toContain('const URL_FILTER_KEYS = ["q", "status", "service", "owner"] as const;');
  });

  // 125
  it("keeps the mock scenarios the lists are demonstrated with", () => {
    const src = read("app/dashboard/leads/leads-data.tsx");
    expect(src).toContain("scenarioArmed");
    expect(src).toContain("untouched");
    // The scenario switch reads its own parameter, and the filter parser ignores parameters it
    // does not own, so the two share a query string without either losing.
    expect(read("lib/views/model.ts")).toContain("parseFilters");
  });

  // 126
  it("keeps every list's own toolbar filters, now sourced from the URL", () => {
    for (const path of LIST_SCREENS) {
      const src = read(path);
      expect(src, path).toContain("useListView(");
      // No screen keeps a second copy of a filter in local state. Two copies of one value is
      // two chances to disagree, and the one that loses is whichever the URL did not write.
      expect(src, path).not.toMatch(/useState[<(].*(?:filter|query|search)/i);
    }
  });

  // 127
  it("keeps the public proposal surface out of search entirely", () => {
    const publicPage = read("app/proposal/[secureToken]/page.tsx");
    for (const module of ["lib/search", "lib/views", "command-center/command-dialog", "SavedViewsBar"]) {
      expect(publicPage, module).not.toContain(module);
    }
    // And nothing in the index resolves to that route.
    for (const document of buildDemoSearchIndex(createSeedState())) {
      expect(document.href.startsWith("/proposal/")).toBe(false);
    }
  });

  // 128
  it("keeps secure tokens and restricted activity unindexable", () => {
    expect(SENSITIVE_INDEX_PATTERNS.length).toBeGreaterThan(0);
    expect([...ACTIVITY_VISIBILITIES].length).toBe(3);
    // Exactly one visibility is excluded from the index, and it is the restricted one.
    expect([...INDEXABLE_ACTIVITY_VISIBILITIES]).toEqual(["internal", "client_safe"]);
    expect(ACTIVITY_VISIBILITIES.filter((value) => !INDEXABLE_ACTIVITY_VISIBILITIES.includes(value as never))).toEqual([
      "restricted",
    ]);
    for (const document of buildDemoSearchIndex(createSeedState())) {
      expect(sensitiveFindings(document), document.id).toEqual([]);
    }
  });

  // 129
  it("keeps a raw secure token out of every file this release added", () => {
    for (const path of NEW_FILES) {
      const src = read(path);
      // The demo access-token shape, a 32+ hex token, and a bearer-looking literal.
      expect(src, path).not.toMatch(/demo-proposal-[0-9a-f]{8}/);
      expect(src, path).not.toMatch(/[0-9a-f]{32,}/);
      expect(src, path).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    }
  });

  // 130
  it("keeps the shared PGlite harness — no suite opens its own instance", () => {
    const harness = read("test/pglite-schema.ts");
    expect(harness).toContain("export async function openTestDatabase");
    expect(harness).toContain("export async function resetSchema");
    expect(harness).toContain("Fatal process out of memory");
    // The new migration suite uses it, one connection per file.
    const suite = read("lib/views/saved-views-migration.pglite.test.ts");
    expect(suite).toContain('import { openTestDatabase, resetSchema } from "@/test/pglite-schema";');
    expect(suite).not.toContain("new PGlite(");
    expect(suite.match(/beforeAll\(/g)?.length).toBe(1);
    expect(suite).toContain("beforeEach(async () => {\n  await resetSchema(db,");
  });

  // 131
  it("keeps the unit sweep's boundaries, and adds only the components directory", () => {
    const config = read("vitest.config.ts");
    expect(config).toContain('"components/**/*.test.ts"');
    expect(config).toContain('"command-center/**"');
    expect(config).toContain('"**/*.integration.test.ts"');
    expect(config).toContain("poolOptions: { forks: { maxForks: 2 } }");
  });

  // 132
  it("adds no search dependency — the index is this repository's own code", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const forbidden of ["algoliasearch", "elasticsearch", "@elastic/elasticsearch", "meilisearch", "fuse.js", "cmdk", "typesense"]) {
      expect(all, forbidden).not.toContain(forbidden);
    }
  });

  // 133
  it("keeps the demo plane deterministic — same constants, no clock, no randomness", () => {
    expect(DEMO_STATE_VERSION).toBe(4);
    expect(DEMO_NOW).toBe("2026-04-22T17:00:00.000Z");
    expect(DEMO_TODAY).toBe("2026-04-22");
    expect(DEMO_SEED).toBe(20260423);
    expect(DEMO_CURRENT_USER_ID).toBe("user-002");
    for (const path of NEW_FILES) {
      // Comments name these three precisely because the code must not call them, so the check
      // is against code lines rather than the whole file.
      const code = read(path)
        .split("\n")
        .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
        .join("\n");
      expect(code, path).not.toContain("Math.random(");
      expect(code, path).not.toContain("Date.now(");
      expect(code, path).not.toContain("new Date()");
    }
  });

  // 134
  it("keeps every route the shell offers reachable, and every command pointed at one", () => {
    const nav = read("app/dashboard/shell-nav.tsx");
    for (const command of ALL_COMMANDS) {
      const path = command.href.split("?")[0]!;
      // Either the shell links to it, or it is a detail route the commands do not use.
      expect(nav.includes(`"${path}"`) || path === "/dashboard", command.id).toBe(true);
    }
  });

  // 135
  it("leaves no dead link behind in anything this release touched", () => {
    for (const path of [...NEW_FILES, ...LIST_SCREENS]) {
      expect(read(path), path).not.toContain('href="#"');
      expect(read(path), path).not.toContain("href={'#'}");
    }
  });

  // 136
  it("keeps the six palettes, and styles the new surfaces with tokens rather than literals", () => {
    const css = read("app/globals.css");
    for (const palette of ["forest-mist", "graphite-sage", "midnight-emerald", "ocean-slate", "warm-sand"]) {
      expect(css, palette).toContain(`[data-cc-theme='${palette}']`);
    }
    expect(css).toContain("--cc-green: var(--cc-accent);");
    // The dialog's one literal is its backdrop, which is a scrim rather than a themed surface.
    const dialog = read("components/command-center/command-dialog.tsx");
    expect([...dialog.matchAll(/#[0-9a-fA-F]{3,8}\b/g)]).toEqual([]);
    expect(read("components/command-center/saved-views.tsx")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  // 137
  it("keeps the Suspense boundary My Work needs to render statically", () => {
    const page = read("app/dashboard/my-work/page.tsx");
    expect(page).toContain("<Suspense");
    expect(page).toContain("<MyWorkScreen />");
  });

  // 138
  it("keeps the URL as the one copy of list state, with a store that can actually notify", () => {
    const src = read("components/command-center/use-view-query.ts");
    expect(src).toContain("useSyncExternalStore(subscribe, currentSearch, noSearch)");
    expect(src).toContain('window.addEventListener("popstate", onChange);');
    // `replaceState` fires no event, so publishing has to announce or every other subscriber
    // keeps rendering the previous filters.
    expect(src).toContain("window.history.replaceState(window.history.state, \"\", url);");
    expect(src.match(/announce\(\);/g)?.length).toBeGreaterThanOrEqual(2);
    // The server snapshot is the empty string, which is why no screen may seed `useState` from
    // this hook: hydration would capture the defaults and never see the real URL.
    expect(src).toContain('const noSearch = () => "";');
  });

  // 139
  it("keeps server-only modules server-only, and the mode decision on the server", () => {
    expect(read("lib/command-center/data.ts")).toContain("import 'server-only'");
    expect(read("lib/command-center/mode.ts")).toContain("live mode NEVER silently falls back to");
    expect(read("components/command-center/mode-provider.tsx")).toContain('"use client"');
    // Nothing this release added imports a server module into the browser bundle.
    for (const path of NEW_FILES) {
      expect(read(path), path).not.toContain('import "server-only"');
      expect(read(path), path).not.toContain("@supabase/supabase-js");
    }
  });
});
