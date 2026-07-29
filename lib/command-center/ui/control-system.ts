// The dashboard's one control system.
//
// Every enabled control in /dashboard is assembled from the strings below. It exists
// because the same button was previously written by hand in thirty places, and a
// hand-written button drifts: the toolbar grew a 30px "Reset demo tasks" beside a 36px
// search field, "Open" was a boxed 26px chip in one card and an underlined link in the
// card directly beneath it, and several enabled controls borrowed the muted foreground
// that only disabled controls are allowed to use — so they read as unavailable.
//
// Two rules are load-bearing and are enforced by app/dashboard/visual-system.test.ts
// rather than merely written down here:
//
//   1. An ENABLED control never uses a muted/placeholder foreground. `text-cc-t3` and
//      `text-cc-t4` are the disabled and hint colours; they appear in DISABLED_* only.
//      Reduced opacity is likewise a disabled signal and appears in no enabled variant.
//   2. A DISABLED control is disabled for real (`disabled` / `aria-disabled`), looks
//      unavailable, and cannot be mistaken for an enabled neutral control — hence a
//      muted surface AND a weaker border AND the muted foreground, not just one of them.
//      Where the reason is not obvious it is named in copy and wired with
//      aria-describedby; see DISABLED_REASON.
//
// Heights are a three-band scale, not a free number:
//
//   standard   40px   toolbar and page-level controls, inputs, selects, icon buttons
//   compact    36px   actions that live inside a record row
//   touch      44px   the minimum a compact control collapses to below `sm`
//
// The bands come from the owner's brief (standard 40-44, compact row action 34-38,
// mobile touch target minimum 44) and are exported as numbers so the tests assert the
// band rather than re-reading a Tailwind class.

/* ------------------------------------------------------------------ sizing -- */

export const CONTROL_HEIGHT_STANDARD = 40;
export const CONTROL_HEIGHT_COMPACT = 36;
export const CONTROL_TOUCH_TARGET = 44;

/** Toolbar/page control. 40px tall at every width. */
export const SIZE_STANDARD = "h-10 px-3.5 text-[12.5px]";

/** Square icon control at standard height — an ellipsis menu, a pager arrow. */
export const SIZE_STANDARD_ICON = "h-10 w-10 px-0";

/**
 * Row action. 36px on pointer widths; 44px below `sm` so the touch target is legal
 * without making the desktop row taller. `min-h-*` rather than `h-*` at the mobile end
 * because a wrapped label must be allowed to grow past the floor.
 */
export const SIZE_COMPACT = "min-h-[44px] px-3 text-[12px] sm:h-9 sm:min-h-0";

/** Square icon row action, same two-band height. */
export const SIZE_COMPACT_ICON = "h-11 w-11 px-0 sm:h-9 sm:w-9";

/* ------------------------------------------------------------------- state -- */

/**
 * The focus ring. Offset outward so it is visible against both the card surface and the
 * row divider it may sit on, and `focus-visible` so a mouse click does not ring.
 */
export const CONTROL_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cc-green focus-visible:outline";

/** Same ring, drawn inside the box — for controls flush against a container edge. */
export const CONTROL_FOCUS_INSET =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cc-green focus-visible:outline";

/**
 * Shared skeleton: layout, radius, weight, focus. Carries no colour, so a variant can
 * never accidentally inherit a foreground it did not choose.
 */
export const CONTROL_BASE =
  `inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap ` +
  `rounded-cc-control font-semibold leading-none transition-colors ${CONTROL_FOCUS}`;

/**
 * The one disabled treatment. Muted surface + weak border + muted foreground together:
 * any one of the three on its own still reads as a live neutral button.
 */
export const CONTROL_DISABLED =
  "cursor-not-allowed border border-cc-line bg-cc-secondary text-cc-t3";

/** Class for the copy that says WHY a control is disabled. Never interactive. */
export const DISABLED_REASON = "text-[11px] leading-[1.45] text-cc-t3";

/**
 * The disabled state for a control that toggles in place — a pager arrow, "Complete
 * selected", a stage stepper — appended to whichever variant it normally wears.
 *
 * A faded opacity utility is what this replaces. Fading a control keeps its enabled
 * colours at reduced strength, which is how a disabled green primary came to look like
 * an enabled one and a pale enabled action came to look disabled: the two states met in
 * the middle. Disabling changes the tokens instead. The `disabled:hover:` pair is not
 * redundant — without it, hovering a disabled button re-applies the variant's hover
 * colours, since both are variants of equal specificity.
 */
export const CONTROL_DISABLED_STATE =
  "disabled:cursor-not-allowed disabled:border-cc-line disabled:bg-cc-secondary disabled:text-cc-t3 " +
  "disabled:hover:border-cc-line disabled:hover:bg-cc-secondary disabled:hover:text-cc-t3";

/** The same, for a borderless control that must stay borderless when disabled (the
 *  table pagers, which are bare monospace glyphs inside a footer). */
export const CONTROL_DISABLED_INK =
  "disabled:cursor-not-allowed disabled:text-cc-t4 disabled:hover:bg-transparent disabled:hover:text-cc-t4";

/* ---------------------------------------------------------------- variants -- */

/**
 * Primary. One per surface: the thing the screen is for. White on the accent, so it is
 * the only variant whose foreground is not an ink token.
 */
export const VARIANT_PRIMARY =
  "border border-transparent bg-cc-green-solid text-white hover:bg-cc-green-press active:bg-cc-green-press";

/** Secondary. A live neutral: real surface, strong border, full-strength ink. */
export const VARIANT_SECONDARY =
  "border border-cc-line-strong bg-cc-surface text-cc-ink hover:border-cc-green-border hover:bg-cc-green-tint hover:text-cc-green-ink active:bg-cc-green-tint";

/** Tertiary. No box until hovered — for the second and third action in a group. */
export const VARIANT_TERTIARY =
  "border border-transparent bg-transparent text-cc-t-table hover:bg-cc-secondary hover:text-cc-ink active:bg-cc-secondary";

/** Quiet/ghost. Tertiary with an even lighter voice, for icon-only affordances. */
export const VARIANT_QUIET =
  "border border-transparent bg-transparent text-cc-t2 hover:bg-cc-secondary hover:text-cc-ink active:bg-cc-secondary";

/** Destructive. Only ever the confirming action inside a dialog. */
export const VARIANT_DANGER =
  "border border-transparent bg-cc-red text-white hover:bg-cc-red-ink active:bg-cc-red-ink";

/** Selected/applied state of a toggle, filter or tab. Enabled — full-strength ink. */
export const VARIANT_SELECTED =
  "border border-cc-green-border bg-cc-green-tint text-cc-green-ink hover:bg-cc-green-tint";

/** Select/menu trigger. Secondary plus room for the chevron, and a left-aligned value. */
export const VARIANT_SELECT =
  "justify-between border border-cc-line-strong bg-cc-surface text-cc-ink hover:border-cc-green-border active:border-cc-green-border";

/* -------------------------------------------------------- assembled tokens -- */

export const BTN_PRIMARY = `${CONTROL_BASE} ${SIZE_STANDARD} ${VARIANT_PRIMARY}`;
export const BTN_SECONDARY = `${CONTROL_BASE} ${SIZE_STANDARD} ${VARIANT_SECONDARY}`;
export const BTN_TERTIARY = `${CONTROL_BASE} ${SIZE_STANDARD} ${VARIANT_TERTIARY}`;
export const BTN_QUIET = `${CONTROL_BASE} ${SIZE_STANDARD} ${VARIANT_QUIET}`;
export const BTN_DANGER = `${CONTROL_BASE} ${SIZE_STANDARD} ${VARIANT_DANGER}`;
export const BTN_SELECTED = `${CONTROL_BASE} ${SIZE_STANDARD} ${VARIANT_SELECTED}`;
export const BTN_SELECT = `${CONTROL_BASE} ${SIZE_STANDARD} ${VARIANT_SELECT}`;
export const BTN_ICON = `${CONTROL_BASE} ${SIZE_STANDARD_ICON} ${VARIANT_SECONDARY}`;
export const BTN_ICON_QUIET = `${CONTROL_BASE} ${SIZE_STANDARD_ICON} ${VARIANT_QUIET}`;
export const BTN_DISABLED = `${CONTROL_BASE} ${SIZE_STANDARD} ${CONTROL_DISABLED}`;

/**
 * Row actions inside a record row of a list or table: boxed and compact, because a row
 * holds two or three of them and they need to be told apart at a glance.
 */
export const ROW_ACTION = `${CONTROL_BASE} ${SIZE_COMPACT} ${VARIANT_SECONDARY}`;
export const ROW_ACTION_PRIMARY = `${CONTROL_BASE} ${SIZE_COMPACT} ${VARIANT_PRIMARY}`;
export const ROW_ACTION_DANGER = `${CONTROL_BASE} ${SIZE_COMPACT} border border-cc-red-border bg-cc-surface text-cc-red-ink hover:bg-cc-red-tint`;
export const ROW_ACTION_ICON = `${CONTROL_BASE} ${SIZE_COMPACT_ICON} ${VARIANT_SECONDARY}`;

/** The row overflow trigger ("⋯"). Quiet rather than boxed — one bordered square per row
 *  reads as the row's main action — but a real square target all the same: it used to be
 *  `px-1` around a glyph, which is a 14px tap target in a 44px row. */
export const ROW_ACTION_ICON_QUIET = `${CONTROL_BASE} ${SIZE_COMPACT_ICON} ${VARIANT_QUIET}`;
export const ROW_ACTION_DISABLED = `${CONTROL_BASE} ${SIZE_COMPACT} ${CONTROL_DISABLED}`;

/** The quiet compact action — "Clear selection" beside a bulk bar. Same box as
 *  ROW_ACTION with no border, for the escape hatch next to a real action. */
export const ROW_ACTION_QUIET = `${CONTROL_BASE} ${SIZE_COMPACT} ${VARIANT_QUIET}`;

/**
 * Segmented view toggles: the My work / Meetings / Follow-ups tab strips and the
 * appearance switch in Settings. Four routes each restated the same two class strings and
 * none of the copies carried a focus ring, so the keyboard could land on a tab invisibly.
 *
 * The active tab is the heading ink rather than the brand accent: white on the accent is
 * under AA at this size, and the strip sits on a tinted band where a mid-tone fill and an
 * unselected tab read alike.
 */
export const SEGMENT =
  `${CONTROL_BASE} ${SIZE_COMPACT} border border-transparent bg-transparent text-cc-t2 ` +
  `hover:bg-cc-secondary hover:text-cc-ink`;
export const SEGMENT_ACTIVE =
  `${CONTROL_BASE} ${SIZE_COMPACT} border border-transparent bg-cc-ink-strong text-white`;

/**
 * Row action inside a *card* row — Today's work, Meetings & proposals, the activity
 * rail. A strong tertiary link, not a box.
 *
 * The card rail is 372px wide and every row already carries a colour chip, a title, a
 * meta line and a tag; a bordered chip on the end of that reads as a floating empty
 * rectangle, which is exactly what the owner reported. The hit area is still a full
 * control (44px below `sm`, 36px above) — only the border is gone. One pattern for both
 * "Review" and "Open" so two adjacent cards cannot style the same verb differently.
 */
export const CARD_ROW_ACTION =
  `inline-flex shrink-0 items-center justify-center rounded-cc-control px-2 text-[12px] font-semibold ` +
  `leading-none text-cc-green-ink underline decoration-cc-green-border underline-offset-[3px] ` +
  `transition-colors hover:bg-cc-green-tint hover:decoration-cc-green ${SIZE_COMPACT} ${CONTROL_FOCUS}`;

/* ----------------------------------------------------------------- toolbar -- */

/**
 * One toolbar per list route, one row of it. Everything the route can do to its own
 * records lives here — search, filters, reset, create, and the Saved View group — so a
 * screen no longer stacks four full-width bars before the first record.
 *
 * `py-2` with 40px controls gives a 56px bar; `gap-y-2` keeps the wrapped rows from
 * touching when the viewport is too narrow to hold the group on one line.
 */
export const TOOLBAR_ROW =
  "mb-3 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-cc-card border border-cc-line bg-cc-surface px-3 py-2";

/** A related cluster inside the toolbar. Wraps as a unit. */
export const TOOLBAR_GROUP = "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2";

/** Vertical rule between toolbar groups. Hidden once the row wraps. */
export const TOOLBAR_DIVIDER = "hidden h-6 w-px shrink-0 bg-cc-line lg:block";

/**
 * Search field wrapper. `min-w-0` and no min-width floor: the field is the one control
 * in the row that is allowed to shrink, so the filters keep their labels instead of the
 * row overflowing sideways.
 */
export const TOOLBAR_SEARCH =
  `flex h-10 min-w-0 flex-1 basis-[200px] items-center gap-2 rounded-cc-control border border-cc-line-strong ` +
  `bg-cc-surface px-3 text-cc-ink transition-colors hover:border-cc-green-border ` +
  `focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cc-green focus-within:outline`;

/**
 * Non-interactive status copy in a toolbar — "Saved in this browser.", "Unsaved
 * changes". Rendered on a `span`, never styled as a control, and given the whole line to
 * itself below `sm` so it is not read as the last button in the row.
 */
export const TOOLBAR_STATUS =
  "min-w-0 basis-full text-[11px] leading-[1.45] text-cc-t2 sm:basis-auto";

/** Same, for the emphasised dirty-state word. Text carries the meaning; colour agrees. */
export const TOOLBAR_STATUS_DIRTY =
  "min-w-0 basis-full text-[11px] font-semibold leading-[1.45] text-cc-amber-ink sm:basis-auto";

/* ------------------------------------------------------------------- input -- */

/** Form field inside a dialog or settings panel. Standard height, same radius. */
export const FIELD_CONTROL =
  `h-10 w-full rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 text-[12.5px] text-cc-ink ` +
  `transition-colors placeholder:text-cc-t3 hover:border-cc-green-border ` +
  `focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-cc-green focus-visible:outline ` +
  `disabled:cursor-not-allowed disabled:border-cc-line disabled:bg-cc-secondary disabled:text-cc-t3`;

/** Textarea: same treatment, but height comes from `rows`. */
export const FIELD_TEXTAREA =
  `w-full rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-2 text-[12.5px] leading-[1.55] text-cc-ink ` +
  `transition-colors placeholder:text-cc-t3 hover:border-cc-green-border ` +
  `focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-cc-green focus-visible:outline`;
