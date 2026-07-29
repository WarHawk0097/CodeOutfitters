// My Work surface tests (58-70). The screens are client components that read the store,
// the router and the DOM, so — following this repo's established convention — the facts
// that cannot be rendered under react-dom/server are asserted by reading the source.
//
// What these lock down is the honest posture of the feature: a real route behind every
// link, a spoken result for every write, "Saved in this browser." on every write surface,
// and a live mode that refuses to pretend the demo store is a database.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { OPERATIONS_NAV } from "@/lib/command-center/ui/sidebar";
import { IMPLEMENTED_ROUTES } from "@/app/dashboard/shell-nav";
import { createSeedState, DEMO_TODAY } from "@/lib/demo/seed";
import { attentionCount } from "@/lib/tasks/model";
import { resolveTaskPlane, TASK_PROVIDER_REQUIRED_REASON } from "@/lib/tasks/provider";
import { DEMO_TASK_SAVE_NOTICE } from "@/components/dashboard/task-ui";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = `${here}../../../`;

const read = (relative: string) => readFileSync(`${root}${relative}`, "utf8");

const pageSrc = read("app/dashboard/my-work/page.tsx");
const viewSrc = read("app/dashboard/my-work/my-work-view.tsx");
const detailSrc = read("app/dashboard/my-work/task-detail.tsx");
const taskPageSrc = read("app/dashboard/my-work/[taskId]/task-page-view.tsx");
const nextActionSrc = read("components/dashboard/next-action-card.tsx");
const taskUiSrc = read("components/dashboard/task-ui.tsx");
const operationsSrc = read("components/dashboard/overview-operations.tsx");
const overviewSrc = read("app/dashboard/(overview)/page.tsx");
const shellNavSrc = read("app/dashboard/shell-nav.tsx");

/** Every file that renders a task control. If a new one is added it belongs here, or the
 *  honesty scans below stop covering it. */
const TASK_SURFACES: ReadonlyArray<[string, string]> = [
  ["my-work-view.tsx", viewSrc],
  ["task-detail.tsx", detailSrc],
  ["task-page-view.tsx", taskPageSrc],
  ["next-action-card.tsx", nextActionSrc],
  ["task-ui.tsx", taskUiSrc],
  ["overview-operations.tsx", operationsSrc],
];

/** Surfaces that actually write. These must say where the write went. */
const WRITE_SURFACES: ReadonlyArray<[string, string]> = [
  ["my-work-view.tsx", viewSrc],
  ["task-detail.tsx", detailSrc],
  ["next-action-card.tsx", nextActionSrc],
];

describe("my work surfaces (tests 58-70)", () => {
  // 58
  it("the list route and the task deep route both have a page behind them", () => {
    expect(existsSync(`${here}page.tsx`)).toBe(true);
    expect(existsSync(`${here}my-work-view.tsx`)).toBe(true);
    expect(existsSync(`${here}[taskId]/page.tsx`)).toBe(true);
    expect(existsSync(`${here}[taskId]/task-page-view.tsx`)).toBe(true);
  });

  // 59
  it("the screen is wrapped in Suspense because it reads ?view= from the URL", () => {
    // The Overview modules drill into a specific view. Next refuses to build a statically
    // rendered page that calls useSearchParams outside a boundary, so this is a build
    // requirement, not a nicety.
    expect(viewSrc).toContain("useSearchParams");
    expect(pageSrc).toContain("<Suspense");
    expect(pageSrc).toContain("<MyWorkScreen />");
  });

  // 60
  it("the view switch is a real tablist with roving tabindex and arrow-key movement", () => {
    expect(viewSrc).toContain('role="tablist"');
    expect(viewSrc).toContain('role="tab"');
    expect(viewSrc).toContain('role="tabpanel"');
    expect(viewSrc).toContain("aria-selected={candidate === view}");
    expect(viewSrc).toContain("tabIndex={candidate === view ? 0 : -1}");
    expect(viewSrc).toContain('event.key !== "ArrowRight" && event.key !== "ArrowLeft"');
  });

  // 61
  it("every write result is spoken through a polite live region", () => {
    expect(viewSrc).toContain('role="status"');
    expect(viewSrc).toContain('aria-live="polite"');
    // A dialog that closes without saying what happened leaves a screen-reader user
    // guessing whether the task was created.
    expect(viewSrc).toContain("announce(`Task created.");
    expect(detailSrc).toContain("onAnnounce(`Task completed.");
    expect(nextActionSrc).toContain("setAnnouncement(`Next action added.");
  });

  // 62
  it("every write surface says where the write went, in those exact words", () => {
    expect(DEMO_TASK_SAVE_NOTICE).toBe("Saved in this browser.");
    for (const [name, source] of WRITE_SURFACES) {
      expect(source, name).toContain("DEMO_TASK_SAVE_NOTICE");
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
  it("live mode resolves to an unavailable task service and never falls back to the demo store", () => {
    expect(resolveTaskPlane(false)).toEqual({ kind: "demo" });
    const live = resolveTaskPlane(true);
    expect(live.kind).toBe("provider_required");
    expect(live.kind === "provider_required" && live.reason).toBe(TASK_PROVIDER_REQUIRED_REASON);
    // The reason has to say what is NOT happening, or "unavailable" reads as "broken".
    expect(TASK_PROVIDER_REQUIRED_REASON).toContain("Nothing is being kept in this browser.");
  });

  // 66
  it("every task screen checks the plane before it touches the demo store", () => {
    for (const [name, source] of [
      ["my-work-view.tsx", viewSrc],
      ["task-page-view.tsx", taskPageSrc],
      ["next-action-card.tsx", nextActionSrc],
      ["overview-operations.tsx", operationsSrc],
    ] as ReadonlyArray<[string, string]>) {
      expect(source, name).toContain("resolveTaskPlane");
      expect(source, name).toContain('plane.kind === "provider_required"');
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
    expect(operationsSrc).toContain('href="/dashboard/my-work?view=today"');
  });

  // 70
  it("every operations drill-down points at a route that exists, and nothing is a dead link", () => {
    const hrefs = [...operationsSrc.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]!);
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
