// Release 4 — SAVED VIEW UI, surface half (tests 90-96).
//
// The Saved View control is a client component, so these are source-surface tests in the idiom
// this repository already uses for `.tsx` (see app/dashboard/repair-audit.test.ts). They check
// the properties that would be a lie if they regressed — that the local-storage wording is
// present on every surface, that Shared is disabled with a reason rather than hidden or faked,
// that live mode has no local fallback, and that destructive actions are confirmed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SAVED_VIEWS_LOCAL_NOTICE } from "../../lib/views/store";
import {
  SAVED_VIEWS_PROVIDER_REQUIRED_REASON,
  SAVED_VIEWS_PROVIDER_REQUIRED_TITLE,
  SHARED_VIEWS_UNAVAILABLE_REASON,
} from "../../lib/views/provider";
import { SAVED_VIEW_SCOPES } from "../../lib/views/model";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("components/command-center/saved-views.tsx");

/** Every list that has a Saved View scope, and the file that renders it. */
const SCOPE_SCREENS: Record<string, string> = {
  myWork: "app/dashboard/my-work/my-work-view.tsx",
  leads: "app/dashboard/leads/leads-data.tsx",
  pipeline: "app/dashboard/pipeline/pipeline-board.tsx",
  meetings: "app/dashboard/meetings/meetings-view.tsx",
  proposals: "app/dashboard/proposals/proposals-view.tsx",
  followUps: "app/dashboard/follow-ups/follow-ups-view.tsx",
  emailActivity: "app/dashboard/email-activity/email-activity-view.tsx",
};

describe("saved view control (tests 90-96)", () => {
  // 90
  it("appears on every list that has a scope, and on no list that has not", () => {
    for (const scope of SAVED_VIEW_SCOPES) {
      const file = SCOPE_SCREENS[scope];
      expect(file, `${scope} has no screen`).toBeDefined();
      const screen = read(file!);
      expect(screen, `${scope}`).toContain("SavedViewsBar");
      expect(screen, `${scope}`).toContain(`scope="${scope}"`);
      // The control needs the same filter state the list is showing, or the unsaved-changes
      // line would describe a different list than the one on screen.
      expect(screen).toContain(`useListView("${scope}")`);
    }
    // Appointments is a day, not a filter set, so it gets no view control.
    expect(read("app/dashboard/appointments/appointments-view.tsx")).not.toContain("SavedViewsBar");
  });

  // 91
  it("says where the views are stored, on the bar and inside both save surfaces", () => {
    expect(SAVED_VIEWS_LOCAL_NOTICE).toBe("Saved in this browser");
    // Once on the bar itself...
    expect(src).toContain("{SAVED_VIEWS_LOCAL_NOTICE}");
    // ...once beside the visibility choice, and once in the delete confirmation, so the claim
    // is never more than a glance away from the action it qualifies.
    expect(src).toContain("Just me — {SAVED_VIEWS_LOCAL_NOTICE.toLowerCase()}");
    expect(src).toContain("This cannot be undone. {SAVED_VIEWS_LOCAL_NOTICE.toLowerCase()}");
    // And nothing anywhere claims the opposite.
    for (const claim of ["synced", "across your account", "your team can see", "shared with"]) {
      expect(src.toLowerCase()).not.toContain(claim);
    }
  });

  // 92
  it("shows the shared option disabled with its reason, rather than hidden or faked", () => {
    expect(src).toContain("My whole workspace");
    expect(src).toContain('name="saved-view-visibility"');
    expect(src).toContain('aria-describedby="saved-view-shared-reason"');
    expect(src).toContain('id="saved-view-shared-reason"');
    expect(src).toContain("{live ? SAVED_VIEWS_PROVIDER_REQUIRED_REASON : SHARED_VIEWS_UNAVAILABLE_REASON}");
    // The reasons are sentences a person can act on, not "unavailable".
    for (const reason of [SHARED_VIEWS_UNAVAILABLE_REASON, SAVED_VIEWS_PROVIDER_REQUIRED_REASON]) {
      expect(reason.trim().length).toBeGreaterThan(40);
      expect(reason.toLowerCase()).not.toBe("unavailable");
    }
    // There is exactly one visibility control that can be chosen, and the other is disabled.
    expect(src.match(/name="saved-view-visibility"/g)?.length).toBe(2);
    expect(src).toContain("disabled\n            aria-describedby=\"saved-view-shared-reason\"");
  });

  // 93
  it("has no local fallback in live mode — it renders the provider-required state and saves nothing", () => {
    expect(src).toContain('if (plane.kind !== "demo")');
    expect(src).toContain("{SAVED_VIEWS_PROVIDER_REQUIRED_TITLE}. {SAVED_VIEWS_PROVIDER_REQUIRED_REASON}");
    expect(SAVED_VIEWS_PROVIDER_REQUIRED_TITLE.trim().length).toBeGreaterThan(0);

    // The early return sits above every write path, so live mode cannot reach localStorage.
    const guard = src.indexOf('if (plane.kind !== "demo")');
    const write = src.indexOf("window.localStorage.setItem");
    expect(guard).toBeGreaterThan(-1);
    // The only setItem is inside `commit`, which is declared above the guard but only ever
    // called from the demo branch below it — so assert the guard precedes every call site.
    for (const match of [...src.matchAll(/commit\(/g)]) {
      expect(match.index, "a commit() call sits above the live-mode guard").toBeGreaterThan(guard);
    }
    expect(src.match(/window\.localStorage\.setItem/g)?.length).toBe(1);
    expect(write).toBeGreaterThan(-1);
  });

  // 94
  it("states unsaved changes in words, and offers Update only for a view it may change", () => {
    expect(src).toContain(">Unsaved changes<");
    // A coloured dot alone would be a state only somebody already told could read.
    expect(src).toContain('const dirty = selected !== null && isDirty(scope, selected, filters, sort);');
    expect(src).toContain('dirty && selected !== null && selected.ownership.kind !== "builtIn"');
    // Saving never overwrites by accident: the update path is explicit, and the create path is
    // a separate button.
    expect(src).toContain("saveView(state, updated, { replace: true })");
    expect(src).toContain("Save as new view");
    expect(src).toContain("Revert");
    expect(src).toContain("Save view");
    expect(src).toContain("Clear filters");
  });

  // 95
  it("confirms a delete, and never offers rename or delete for a shipped view", () => {
    expect(src).toContain('title="Delete saved view"');
    expect(src).toContain('<DialogSubmitButton label="Delete view" tone="red" form="delete-saved-view-form" />');
    expect(src).toContain("will be removed from this browser. Nothing about the records themselves changes.");
    // Both management entries are disabled for the views the product ships with, which the
    // store also refuses — the menu simply does not lead a person into that refusal.
    expect(src.match(/disabled: selected\.ownership\.kind === "builtIn",/g)?.length).toBe(2);
  });

  // 96
  it("labels its controls for a screen reader and keeps its state line polite", () => {
    expect(src).toContain("ariaLabel={`Saved view for ${descriptor.label}: ${selected?.name ?? \"no view\"}`}");
    expect(src).toContain('"Manage saved views — select a view first"');
    expect(src).toContain("`Manage saved view ${selected.name}`");
    // Confirmation of a save, a rename or a delete is announced rather than only shown.
    expect(src).toContain('role="status" aria-live="polite"');
    // The provider-required notice is tied to the control it disables.
    expect(src).toContain("aria-describedby={`saved-views-unavailable-${scope}`}");
    expect(src).toContain("id={`saved-views-unavailable-${scope}`}");
    // No hover-only affordance: every action is a button or a menu item.
    expect(src).not.toContain("group-hover:");
  });
});
