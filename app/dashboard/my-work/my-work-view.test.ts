// My Work surface tests (58-70). The screens are client components that read the store (or,
// in live mode, the API), the router and the DOM, so — following this repo's established
// convention — the facts that cannot be rendered under react-dom/server are asserted by
// reading the source.
//
// What these lock down is the honest posture of the feature: a real route behind every
// link, a spoken result for every write, "Saved in this browser." on every demo write
// surface and nowhere else, and a live mode that is genuinely backed by the workspace
// database rather than a fixture or a browser store.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { OPERATIONS_NAV } from "@/lib/command-center/ui/sidebar";
import { IMPLEMENTED_ROUTES } from "@/app/dashboard/shell-nav";
import { createSeedState, DEMO_TODAY } from "@/lib/demo/seed";
import { attentionCount } from "@/lib/tasks/model";
import { resolveTaskPlane } from "@/lib/tasks/provider";
import { DEMO_TASK_SAVE_NOTICE } from "@/components/dashboard/task-ui";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = `${here}../../../`;

const read = (relative: string) => readFileSync(`${root}${relative}`, "utf8");

const pageSrc = read("app/dashboard/my-work/page.tsx");
const viewSrc = read("app/dashboard/my-work/my-work-view.tsx");
const viewLiveSrc = read("app/dashboard/my-work/my-work-view-live.tsx");
const detailSrc = read("app/dashboard/my-work/task-detail.tsx");
const taskPageSrc = read("app/dashboard/my-work/[taskId]/task-page-view.tsx");
const taskPageLiveSrc = read("app/dashboard/my-work/[taskId]/task-page-view-live.tsx");
const nextActionSrc = read("components/dashboard/next-action-card.tsx");
const nextActionLiveSrc = read("components/dashboard/next-action-card-live.tsx");
const taskUiSrc = read("components/dashboard/task-ui.tsx");
const operationsSrc = read("components/dashboard/overview-operations.tsx");
const overviewSrc = read("app/dashboard/(overview)/page.tsx");
const shellNavSrc = read("app/dashboard/shell-nav.tsx");
const providerSrc = read("lib/tasks/provider.ts");
const useLiveTasksSrc = read("lib/tasks/use-live-tasks.ts");

/** Every file that renders a task control. If a new one is added it belongs here, or the
 *  honesty scans below stop covering it. */
const TASK_SURFACES: ReadonlyArray<[string, string]> = [
  ["my-work-view.tsx", viewSrc],
  ["my-work-view-live.tsx", viewLiveSrc],
  ["task-detail.tsx", detailSrc],
  ["task-page-view.tsx", taskPageSrc],
  ["task-page-view-live.tsx", taskPageLiveSrc],
  ["next-action-card.tsx", nextActionSrc],
  ["next-action-card-live.tsx", nextActionLiveSrc],
  ["task-ui.tsx", taskUiSrc],
  ["overview-operations.tsx", operationsSrc],
];

/** Demo surfaces that write directly (not through an injected saveNotice prop). These must
 *  say where the write went. */
const DEMO_WRITE_SURFACES: ReadonlyArray<[string, string]> = [
  ["my-work-view.tsx", viewSrc],
  ["next-action-card.tsx", nextActionSrc],
];

/** Live surfaces — no source anywhere in this session may claim a browser-only save. */
const LIVE_SURFACES: ReadonlyArray<[string, string]> = [
  ["my-work-view-live.tsx", viewLiveSrc],
  ["task-page-view-live.tsx", taskPageLiveSrc],
  ["next-action-card-live.tsx", nextActionLiveSrc],
  ["use-live-tasks.ts", useLiveTasksSrc],
];

describe("my work surfaces (tests 58-70)", () => {
  // 58
  it("the list route and the task deep route both have a page behind them", () => {
    expect(existsSync(`${here}page.tsx`)).toBe(true);
    expect(existsSync(`${here}my-work-view.tsx`)).toBe(true);
    expect(existsSync(`${here}my-work-view-live.tsx`)).toBe(true);
    expect(existsSync(`${here}[taskId]/page.tsx`)).toBe(true);
    expect(existsSync(`${here}[taskId]/task-page-view.tsx`)).toBe(true);
    expect(existsSync(`${here}[taskId]/task-page-view-live.tsx`)).toBe(true);
  });

  // 59
  it("the screen reads ?view= from the URL, behind a Suspense boundary, in both planes", () => {
    // The Overview modules drill into a specific view, and a Saved View applies its filters by
    // writing this same query string — one mechanism, so a link, a search result and a saved
    // view all reproduce the same screen, live or demo.
    for (const src of [viewSrc, viewLiveSrc]) {
      expect(src).toContain('useListView("myWork")');
      expect(src).toContain("filters.view");
    }
    expect(pageSrc).toContain("<Suspense");
    expect(pageSrc).toContain("<MyWorkScreen />");
  });

  // 60
  it("the view switch is a real tablist with roving tabindex and arrow-key movement, in both planes", () => {
    for (const src of [viewSrc, viewLiveSrc]) {
      expect(src).toContain('role="tablist"');
      expect(src).toContain('role="tab"');
      expect(src).toContain('role="tabpanel"');
      expect(src).toContain("aria-selected={candidate === view}");
      expect(src).toContain("tabIndex={candidate === view ? 0 : -1}");
      expect(src).toContain('event.key !== "ArrowRight" && event.key !== "ArrowLeft"');
    }
  });

  // 61
  it("every write result is spoken through a polite live region, in both planes", () => {
    for (const src of [viewSrc, viewLiveSrc]) {
      expect(src).toContain('role="status"');
      expect(src).toContain('aria-live="polite"');
    }
    // A dialog that closes without saying what happened leaves a screen-reader user
    // guessing whether the task was created.
    expect(viewSrc).toContain("announce(`Task created.");
    expect(viewLiveSrc).toContain('announce("Task created.")');
    expect(detailSrc).toContain("onAnnounce(result.ok ? `Task completed.");
    expect(nextActionSrc).toContain("setAnnouncement(`Next action added.");
    expect(nextActionLiveSrc).toContain('setAnnouncement("Next action added.")');
  });

  // 62
  it("demo write surfaces say where the write went, in those exact words — live surfaces never do", () => {
    expect(DEMO_TASK_SAVE_NOTICE).toBe("Saved in this browser.");
    for (const [name, source] of DEMO_WRITE_SURFACES) {
      expect(source, name).toContain("DEMO_TASK_SAVE_NOTICE");
    }
    // task-detail.tsx is plane-agnostic: the demo callers hand it the notice, live callers
    // don't. The component itself must not import the demo constant or render it directly.
    expect(detailSrc).not.toContain("DEMO_TASK_SAVE_NOTICE");
    expect(viewSrc).toContain("saveNotice={DEMO_TASK_SAVE_NOTICE}");
    expect(taskPageSrc).toContain("saveNotice={DEMO_TASK_SAVE_NOTICE}");
    for (const [name, source] of LIVE_SURFACES) {
      expect(source, name).not.toContain("DEMO_TASK_SAVE_NOTICE");
      expect(source, name).not.toContain("Saved in this browser");
    }
  });

  // 63
  it("no task surface claims the write reached an account, a CRM or a server", () => {
    // The demo store is sessionStorage. Any of these sentences would be a lie told by
    // the UI, and the kind a user only discovers after losing work.
    const forbidden = [
      "Saved to your account",
      "Synced",
      "Updated in CRM",
      "Assigned successfully",
      "saved to the server",
      "Saved to the server",
    ];
    for (const [name, source] of TASK_SURFACES) {
      for (const phrase of forbidden) {
        expect(source, `${name}: ${phrase}`).not.toContain(phrase);
      }
    }
  });

  // 64
  it("no task surface writes to localStorage", () => {
    // sessionStorage in the demo store is the only browser write in this feature, and in
    // live mode the browser is never the record of truth for a task.
    for (const [name, source] of TASK_SURFACES) {
      expect(source, name).not.toContain("localStorage");
    }
  });

  // 65
  it("live mode is genuinely task-backed — no third 'unavailable' branch to fall through", () => {
    expect(resolveTaskPlane(false)).toEqual({ kind: "demo" });
    expect(resolveTaskPlane(true)).toEqual({ kind: "live" });
    expect(providerSrc).toContain("no `provider_required` plane to fall through");
    // The live data hook talks to the API and the API alone.
    expect(useLiveTasksSrc).toContain('fetch("/api/dashboard/tasks"');
    expect(useLiveTasksSrc).not.toMatch(/lib\/demo/);
  });

  // 66
  it("every task screen dispatches to a live variant when the plane is live, with no demo fallback in it", () => {
    for (const [name, source] of [
      ["my-work-view.tsx", viewSrc],
      ["task-page-view.tsx", taskPageSrc],
      ["next-action-card.tsx", nextActionSrc],
    ] as ReadonlyArray<[string, string]>) {
      expect(source, name).toContain("useCommandCenterConfig");
      expect(source, name).toMatch(/if \(live\) return <\w+Live/);
    }
    // lib/demo/types is a shared type-only module (no store, no fixture) — reusing it is fine.
    // Any other lib/demo import would pull in the demo store, actions or seed fixture.
    for (const [name, source] of LIVE_SURFACES) {
      expect(source, name).not.toMatch(/lib\/demo\/(?!types)/);
    }
  });

  // 67
  it("the sidebar badge is the seeded attention count, not a decorative number", () => {
    const myWork = OPERATIONS_NAV.find((item) => item.label === "My Work");
    expect(myWork?.href).toBe("/dashboard/my-work");
    // Recomputed from the seed: overdue plus due today. If the fixtures move, this fails
    // rather than leaving the rail quietly wrong.
    const expected = attentionCount(createSeedState().tasks, DEMO_TODAY);
    expect(expected).toBe(5);
    expect(myWork?.badge).toBe(String(expected));
  });

  // 68
  it("My Work is registered in the shell as a built route with its own header copy", () => {
    expect(IMPLEMENTED_ROUTES.has("/dashboard/my-work")).toBe(true);
    expect(shellNavSrc).toContain('"/dashboard/my-work": {');
    expect(shellNavSrc).toContain('title: "My Work"');
  });

  // 69
  it("the Overview's Today's work card is store-derived and its count is a real length", () => {
    // The canonical four-row design sample is gone from the page; the card is fed from
    // the task collection, and the count it prints is the size of the set behind it.
    expect(overviewSrc).toContain("<TodaysWorkLive variant=");
    expect(overviewSrc).not.toContain("TODAYS_WORK_OPEN_COUNT");
    expect(operationsSrc).toContain("openCount={String(attention.length)}");
    // The card's own header control is the link to the queue, and it is the only one:
    // the duplicate "Open in My Work" link that used to sit under the card is gone.
    expect(operationsSrc).toContain('const TODAY_QUEUE_HREF = "/dashboard/my-work?view=today"');
    expect(operationsSrc).toContain("queueHref={TODAY_QUEUE_HREF}");
    expect(operationsSrc).not.toContain("Open in My Work");
  });

  // 70
  it("every operations drill-down points at a route that exists, and nothing is a dead link", () => {
    // Destinations are declared as named constants and per-row template literals, so both
    // forms are collected — a literal href left inline would be caught by the first pattern.
    const hrefs = [
      ...[...operationsSrc.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]!),
      ...[...operationsSrc.matchAll(/_HREF = "(\/[^"]*)"/g)].map((match) => match[1]!),
      ...[...operationsSrc.matchAll(/href: `(\/[^`]*)`/g)].map((match) =>
        match[1]!.replace(/\$\{[^}]*\}/g, "id"),
      ),
    ];
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const path = href.split("?")[0]!;
      const known =
        IMPLEMENTED_ROUTES.has(path) ||
        /^\/dashboard\/meetings\/[^/]+\/(prepare|review)$/.test(path) ||
        /^\/dashboard\/proposals\/[^/]+\/edit$/.test(path) ||
        /^\/dashboard\/my-work\/[^/]+$/.test(path);
      expect(known, href).toBe(true);
    }
    for (const [name, source] of TASK_SURFACES) {
      expect(source, name).not.toContain('href="#"');
      expect(source, name).not.toContain("href={'#'}");
    }
  });
});
