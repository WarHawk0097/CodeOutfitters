// Dashboard control-system tests.
//
// The owner's report was ten visual defects across every list route, and the repair was
// one control system rather than ten local patches. These tests are the source-level guard
// on that system: that the primitives exist and are coherent, that the surfaces use them
// instead of re-declaring their own heights and inks, and that the specific confusions the
// owner photographed — an enabled action wearing the disabled foreground, a status line
// styled like a button, an oversized detached row action — cannot come back unnoticed.
//
// These are source assertions. They do not prove anything about rendered pixels; the
// rendered check is a separate authenticated visual review.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import * as controls from "../../lib/command-center/ui/control-system";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(join(repo, path), "utf8");

const controlSystem = read("lib/command-center/ui/control-system.ts");
const toolbar = read("components/demo/toolbar.tsx");
const savedViews = read("components/command-center/saved-views.tsx");
const menu = read("components/demo/menu.tsx");
const taskUi = read("components/dashboard/task-ui.tsx");
const overviewCards = read("lib/command-center/ui/overview-cards.tsx");

/** Every dashboard-owned source file, so a defect can be asserted absent everywhere
 *  rather than absent from the handful of files a fix happened to touch. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(repo, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(repo, rel)).isDirectory()) walk(rel, out);
    else if (/\.tsx?$/.test(entry) && !entry.includes(".test.")) out.push(rel);
  }
  return out;
}

const SURFACE_DIRS = [
  "app/dashboard",
  "lib/command-center",
  "components/command-center",
  "components/dashboard",
  "components/demo",
];
const surfaces = SURFACE_DIRS.flatMap((dir) => walk(dir)).map((path) => ({
  path,
  src: read(path),
}));

/** The route views that carry a search-and-filter toolbar and Saved Views. */
const LIST_ROUTES = [
  "app/dashboard/my-work/my-work-view.tsx",
  "app/dashboard/leads/leads-data.tsx",
  "app/dashboard/pipeline/pipeline-board.tsx",
  "app/dashboard/meetings/meetings-view.tsx",
  "app/dashboard/proposals/proposals-view.tsx",
  "app/dashboard/follow-ups/follow-ups-view.tsx",
  "app/dashboard/email-activity/email-activity-view.tsx",
];

describe("dashboard control system", () => {
  it("declares the documented variant family", () => {
    for (const name of [
      "BTN_PRIMARY",
      "BTN_SECONDARY",
      "BTN_TERTIARY",
      "BTN_QUIET",
      "BTN_DANGER",
      "BTN_SELECT",
      "BTN_SELECTED",
      "BTN_ICON",
      "BTN_DISABLED",
      "ROW_ACTION",
      "ROW_ACTION_PRIMARY",
      "ROW_ACTION_ICON",
      "ROW_ACTION_ICON_QUIET",
      "ROW_ACTION_DISABLED",
      "CARD_ROW_ACTION",
      "FIELD_CONTROL",
      "FIELD_TEXTAREA",
    ]) {
      expect(controls, name).toHaveProperty(name);
    }
  });

  it("holds standard controls at 40px and compact controls at 36px", () => {
    expect(controls.CONTROL_HEIGHT_STANDARD).toBe(40);
    expect(controls.CONTROL_HEIGHT_COMPACT).toBe(36);
    expect(controls.CONTROL_TOUCH_TARGET).toBe(44);
    // h-10 is 40px and sm:h-9 is 36px in this project's spacing scale.
    expect(controls.SIZE_STANDARD).toContain("h-10");
    expect(controls.SIZE_COMPACT).toContain("sm:h-9");
  });

  it("gives compact controls a legal touch target below the sm breakpoint", () => {
    // A 36px row action is fine with a mouse and illegal with a thumb, so the compact
    // sizes start at 44px and shrink at sm — not the other way round.
    expect(controls.SIZE_COMPACT).toContain("min-h-[44px]");
    expect(controls.SIZE_COMPACT_ICON).toContain("h-11");
    expect(controls.SIZE_COMPACT_ICON).toContain("sm:h-9");
  });

  it("gives every enabled variant a hover and an active state", () => {
    for (const [name, variant] of [
      ["primary", controls.VARIANT_PRIMARY],
      ["secondary", controls.VARIANT_SECONDARY],
      ["tertiary", controls.VARIANT_TERTIARY],
      ["quiet", controls.VARIANT_QUIET],
      ["danger", controls.VARIANT_DANGER],
    ] as const) {
      expect(variant, `${name} hover`).toMatch(/hover:/);
      expect(variant, `${name} active`).toMatch(/active:/);
    }
  });

  it("puts a visible focus ring on every control, including the inset case", () => {
    expect(controls.CONTROL_BASE).toContain(controls.CONTROL_FOCUS);
    for (const focus of [controls.CONTROL_FOCUS, controls.CONTROL_FOCUS_INSET]) {
      expect(focus).toContain("focus-visible:outline-2");
      expect(focus).toContain("focus-visible:outline-cc-green");
    }
    // The card row action is a link, not a button, so it carries the ring itself.
    expect(controls.CARD_ROW_ACTION).toContain("focus-visible:outline-cc-green");
  });

  it("never dresses an enabled control in the disabled or placeholder foreground", () => {
    for (const [name, variant] of [
      ["primary", controls.VARIANT_PRIMARY],
      ["secondary", controls.VARIANT_SECONDARY],
      ["tertiary", controls.VARIANT_TERTIARY],
      ["quiet", controls.VARIANT_QUIET],
      ["danger", controls.VARIANT_DANGER],
      ["selected", controls.VARIANT_SELECTED],
      ["select", controls.VARIANT_SELECT],
      ["card row action", controls.CARD_ROW_ACTION],
    ] as const) {
      // cc-t3 is the placeholder and disabled ink; cc-t4 is weaker still.
      expect(variant, `${name} uses disabled ink`).not.toMatch(/text-cc-t[34]\b/);
      expect(variant, `${name} uses opacity`).not.toMatch(/\bopacity-/);
      expect(variant, `${name} uses a faded colour`).not.toMatch(/(bg|text)-[a-z-]+\/\d/);
    }
  });

  it("gives the selected filter value full-strength ink, not the placeholder colour", () => {
    // "Owner: Marc" once shared its colour with "All owners", which made an applied
    // filter unreadable as applied.
    expect(controls.VARIANT_SELECTED).toContain("text-cc-green-ink");
    expect(toolbar).toContain("className={value ? `${BTN_SELECT} ${VARIANT_SELECTED}` : BTN_SELECT}");
    // The placeholder colour belongs to the placeholder.
    expect(controls.FIELD_CONTROL).toContain("placeholder:text-cc-t3");
    expect(controls.FIELD_CONTROL).toContain("text-cc-ink");
  });

  it("keeps the primary fill on the AA-safe token rather than the brand accent", () => {
    expect(controls.VARIANT_PRIMARY).toContain("bg-cc-green-solid");
    expect(controls.VARIANT_PRIMARY).not.toMatch(/bg-cc-green(?![-\w])/);
  });

  it("expresses the disabled state as real disabled semantics", () => {
    expect(controls.CONTROL_DISABLED).toContain("cursor-not-allowed");
    expect(controls.CONTROL_DISABLED).toContain("bg-cc-secondary");
    expect(controls.CONTROL_DISABLED).toContain("text-cc-t3");
    expect(controls.CONTROL_DISABLED).not.toMatch(/\bopacity-/);
    // The in-place variant must also neutralise the hover it inherits, or a disabled
    // button repaints itself as an enabled one under the cursor.
    expect(controls.CONTROL_DISABLED_STATE).toContain("disabled:cursor-not-allowed");
    expect(controls.CONTROL_DISABLED_STATE).toMatch(/disabled:hover:/);
    expect(controls.CONTROL_DISABLED_STATE).not.toMatch(/\bopacity-/);
  });

  it("has no opacity-faded control left on any dashboard surface", () => {
    // The specific confusion this closes: a faded green primary and a pale enabled
    // action met in the middle and became indistinguishable.
    for (const { path, src } of surfaces) {
      expect(src, path).not.toMatch(/disabled:opacity-/);
      expect(src, path).not.toMatch(/bg-cc-green\/\d/);
      expect(src, path).not.toMatch(/text-cc-green-ink opacity-/);
    }
  });

  it("says why a control is disabled wherever a reason is needed", () => {
    expect(controls.DISABLED_REASON).toBeTruthy();
    // The toolbar action and the Saved View save both carry a reason and wire it to the
    // control, so the reason reaches a screen reader and not only the eye.
    expect(toolbar).toContain("aria-describedby={reasonId}");
    expect(toolbar).toContain("className={DISABLED_REASON}");
    expect(savedViews).toContain("saveDisabledReason");
    expect(savedViews).toMatch(/aria-describedby=\{savable \? undefined :/);
  });
});

describe("dashboard toolbars", () => {
  it("builds one toolbar row from shared primitives", () => {
    expect(controls.TOOLBAR_ROW).toContain("flex-wrap");
    expect(controls.TOOLBAR_ROW).toContain("items-center");
    expect(controls.TOOLBAR_GROUP).toContain("flex-wrap");
    expect(toolbar).toContain("className={TOOLBAR_ROW}");
  });

  it("lets the search field shrink instead of forcing horizontal overflow", () => {
    expect(controls.TOOLBAR_SEARCH).toContain("min-w-0");
    expect(controls.TOOLBAR_SEARCH).toContain("flex-1");
    expect(toolbar).toContain("min-w-0 flex-1 bg-transparent");
  });

  it("holds the search field at the standard control height", () => {
    expect(controls.TOOLBAR_SEARCH).toContain("h-10");
    expect(controls.FIELD_CONTROL).toContain("h-10");
    expect(controls.SIZE_STANDARD).toContain("h-10");
  });

  it("renders the status line as copy, never as a control", () => {
    // "Saved in this browser." is a statement about where the data went. Styled like the
    // buttons beside it, the owner read it as an action.
    expect(controls.TOOLBAR_STATUS).not.toMatch(/border|bg-cc-surface|hover:/);
    expect(toolbar).toMatch(/export function ToolbarStatus\(/);
    expect(toolbar).toContain("<span id={id}");
    expect(toolbar).not.toMatch(/ToolbarStatus[\s\S]{0,400}<button/);
    // It may take its own line on a narrow viewport rather than crowd the controls.
    expect(controls.TOOLBAR_STATUS).toContain("basis-full");
    expect(controls.TOOLBAR_STATUS).toContain("sm:basis-auto");
  });

  it("keeps an enabled toolbar action on an enabled variant", () => {
    // "Reset demo tasks" is always enabled and looked switched off.
    expect(toolbar).toContain(
      "className={disabled ? BTN_DISABLED : tone === \"primary\" ? BTN_PRIMARY : BTN_SECONDARY}",
    );
    expect(controls.BTN_SECONDARY).toContain("text-cc-ink");
  });

  it("orders every list route search, filters, secondary action, Saved Views", () => {
    for (const route of LIST_ROUTES) {
      const src = read(route);
      expect(src, route).toContain("SavedViewsBar");
      // The Saved View group is the last thing in the toolbar row, not a second bar
      // below it stacking another band of vertical space onto the page.
      const toolbarClose = src.indexOf("</RouteToolbar>");
      const savedViewsAt = src.indexOf("<SavedViewsBar");
      expect(toolbarClose, `${route} has a toolbar`).toBeGreaterThan(-1);
      expect(savedViewsAt, `${route} Saved Views inside the toolbar`).toBeLessThan(toolbarClose);
    }
  });
});

describe("saved view controls", () => {
  it("comes from one component, used by every list route", () => {
    expect(savedViews).toContain("export function SavedViewsBar");
    for (const route of LIST_ROUTES) {
      expect(read(route), route).toContain(
        'from "../../../components/command-center/saved-views"',
      );
    }
  });

  it("labels the selector when no view is selected", () => {
    expect(savedViews).toContain('selected?.name ?? "No saved view"');
  });

  it("gives the selector a chevron and a specific accessible name", () => {
    expect(savedViews).toMatch(/chevron/);
    expect(savedViews).toContain("Saved view for ${descriptor.label}");
    expect(menu).toContain("export function MenuChevron");
  });

  it("keeps management on a compact icon button with a specific accessible name", () => {
    expect(savedViews).toContain("Manage saved views");
    expect(savedViews).toContain("className={BTN_ICON}");
  });

  it("states the dirty state in words, not in colour alone", () => {
    expect(savedViews).toContain(">Unsaved changes<");
    expect(controls.TOOLBAR_STATUS_DIRTY).toContain("font-semibold");
  });
});

describe("row and card actions", () => {
  it("gives list rows one compact action family", () => {
    expect(controls.ROW_ACTION).toContain(controls.SIZE_COMPACT);
    expect(controls.ROW_ACTION_PRIMARY).toContain(controls.SIZE_COMPACT);
    expect(taskUi).toContain("export const TASK_PRIMARY_ACTION = ROW_ACTION_PRIMARY;");
    expect(taskUi).toContain("export const TASK_SECONDARY_ACTION = ROW_ACTION;");
  });

  it("gives card rows one action pattern, so Review and Open match", () => {
    // Defect 6 was "Review" and "Open" using two different visual patterns on the same
    // Overview rail. Both are the one card row action now.
    const cardActions = overviewCards.match(/className=\{CARD_ROW_ACTION\}/g) ?? [];
    expect(cardActions.length).toBeGreaterThanOrEqual(5);
    expect(controls.CARD_ROW_ACTION).toContain("text-cc-green-ink");
    expect(controls.CARD_ROW_ACTION).toContain(controls.SIZE_COMPACT);
  });

  it("attaches the row action to its row instead of floating it", () => {
    expect(taskUi).toContain("items-center gap-1.5 self-center");
  });

  it("keeps a specific accessible name on every row action", () => {
    // "Open" repeated down a column tells a screen-reader user nothing about which
    // record they are opening.
    expect(overviewCards).toContain("aria-label={meetings.ariaLabel}");
    expect(overviewCards).toContain("aria-label={proposals.ariaLabel}");
    expect(overviewCards).toContain("actionLabel: string;");
  });

  it("gives the row overflow trigger a real target rather than a bare glyph", () => {
    expect(controls.ROW_ACTION_ICON_QUIET).toContain(controls.SIZE_COMPACT_ICON);
    for (const { path, src } of surfaces) {
      expect(src, path).not.toContain('className="px-1 leading-none text-cc-icon-muted');
    }
  });

  it("leaves dialog and form submissions on the standard size", () => {
    // A confirm dialog's "Delete" is not a row action, and shrinking it to the compact
    // band was explicitly out of scope.
    const dialog = read("components/demo/dialog.tsx");
    expect(dialog).toContain("className={BTN_SECONDARY}");
    expect(dialog).toMatch(/tone === "red" \? `\$\{CONTROL_BASE\} \$\{SIZE_STANDARD\}/);
  });
});

describe("dashboard menus", () => {
  it("keeps menu items at a legal touch target", () => {
    expect(menu).toContain("min-h-[44px]");
    expect(menu).toContain("sm:min-h-9");
  });

  it("keeps the trigger label truncatable so a long saved view name cannot stretch the row", () => {
    expect(menu).toContain('className={truncate ? "min-w-0 truncate" : undefined}');
  });
});

describe("demo mode stays offline", () => {
  it("reaches no Supabase client from any dashboard surface", () => {
    for (const { path, src } of surfaces) {
      expect(src, path).not.toMatch(/from ["'][^"']*supabase/);
      expect(src, path).not.toMatch(/createBrowserClient|createServerClient/);
    }
  });
});

// The tenth defect: the Meetings & proposals card painted over the operations band below
// it. The cause was height propagation, not stacking, so these assert the shape of the fix
// — the desktop rows are content-driven and the scroll lives in the shell — and refuse the
// two workarounds that would hide the symptom again (a z-index, a negative margin).
describe("overview card flow", () => {
  const overviewPage = read("app/dashboard/(overview)/page.tsx");
  /** JSX comments in these files quote the broken classes on purpose. */
  const code = (src: string) =>
    src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/^\s*\/\/.*$/gm, "");

  it("sizes the desktop columns by their content instead of pinning them to the frame", () => {
    const src = code(overviewPage);
    expect(src).toContain("grid grid-cols-[1fr_372px] items-start");
    expect(src).not.toContain("grid-rows-[minmax(0,1fr)]");
    expect(src).not.toContain("h-full");
  });

  it("leaves the scroll to the shell's one scroll container", () => {
    expect(read("app/dashboard/shell-nav.tsx")).toContain("min-h-0 flex-1 overflow-y-auto");
  });

  it("clips no overview card to a fixed height", () => {
    for (const src of [code(overviewPage), code(overviewCards)]) {
      expect(src).not.toMatch(/max-h-/);
      expect(src).not.toMatch(/flex-1 overflow-hidden/);
    }
  });

  it("repairs the overlap by layout rather than by stacking or negative space", () => {
    for (const src of [code(overviewPage), code(overviewCards)]) {
      expect(src).not.toMatch(/\bz-\d/);
      expect(src).not.toMatch(/(^|\s)-m[tblrxy]?-/);
    }
  });

  it("keeps long proposal and meeting metadata inside its own card", () => {
    // Both metadata columns shrink and ellipsise, so a long client or proposal name
    // lengthens no card and pushes into no neighbour.
    const rows = overviewCards.match(/<div className="min-w-0 flex-1">[\s\S]*?<\/div>/g) ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) expect(row).toContain("truncate");
  });
});

// The tab strips were the last duplicated skin: four routes, the same two class strings,
// no focus ring in any copy. These hold them on the shared primitive and hold the whole
// dashboard off the one fill that measures under AA behind a white label.
describe("segmented view toggles", () => {
  const SEGMENT_ROUTES = [
    "app/dashboard/my-work/my-work-view.tsx",
    "app/dashboard/meetings/meetings-view.tsx",
    "app/dashboard/follow-ups/follow-ups-view.tsx",
    "app/dashboard/settings/settings-view.tsx",
  ];

  it("draws every tab strip from the one shared pair", () => {
    for (const path of SEGMENT_ROUTES) {
      const src = read(path);
      expect(src, path).toContain("SEGMENT_ACTIVE");
      expect(src, path).toContain("SEGMENT");
      // No route restates the strip's own inks and paddings any more.
      expect(src, path).not.toContain('py-[7px] text-[11.5px] font-semibold text-white');
    }
  });

  it("gives the strip a focus ring and a legal touch target", () => {
    for (const variant of [controls.SEGMENT, controls.SEGMENT_ACTIVE]) {
      expect(variant).toContain("focus-visible:outline");
      expect(variant).toContain(`min-h-[${controls.CONTROL_TOUCH_TARGET}px]`);
    }
  });

  it("keeps the selected tab readable rather than accent-filled", () => {
    expect(controls.SEGMENT_ACTIVE).toContain("bg-cc-ink-strong");
    expect(controls.SEGMENT_ACTIVE).toContain("text-white");
    expect(controls.SEGMENT).toContain("text-cc-t2");
  });

  it("puts no white label on the brand accent on any dashboard surface", () => {
    // white on --cc-accent measures 3.4:1; --cc-green-solid is the AA-safe fill and the
    // only one the primary variant is allowed to use.
    for (const { path, src } of surfaces) {
      expect(src, path).not.toMatch(/bg-cc-green(?![-\w])[^"`]*text-white/);
    }
  });
});
