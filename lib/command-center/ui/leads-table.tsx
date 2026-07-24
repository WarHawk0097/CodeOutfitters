"use client";
// LEADS_DATA_TABLE per Dashboard/docs/COMPONENT-SOURCE-MAP.md, reconstructed against the
// canonical frames: C-D05 (Command Center Final.dc.html 142-195), T-02 (885-913),
// MO-02 (1068-1087).
//
// Canonical does not render a <table>: every row of C-D05 is a CSS grid
// (`38px 1.5fr .95fr 1.1fr .95fr .9fr .75fr .6fr 34px`, gap 12px, height 42px) and T-02 a
// narrower one (`30px 1.5fr 1.1fr .9fr .6fr`, gap 10px, height 48px). A <table> cannot hold
// those tracks — the columns would size to content — so the grid is the markup and the
// table semantics are carried by explicit ARIA roles instead.
//
// @tanstack/react-table was REMOVED here rather than restyled. Every model it offers
// (pagination, sorting, filtering) was already set to `manual`, because the server answers
// the query; what remained was flexRender over a nine-entry column array and a row-selection
// record. Both are cheaper written out, and the column defs could not express the grid.
//
// Pagination, filtering and sorting stay SERVER-DRIVEN. The table receives one page of rows
// plus the `total` matching the current filters, and reports every query change upward; it
// never slices, filters or sorts the rows it was handed. Paginating only the rows already
// loaded is exactly the defect this replaces — the footer read "Page 1 of 1" over a
// 128-record dataset because the table could only see ten rows.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type SelectHTMLAttributes } from "react";
import {
  APPOINTMENT_STATUS_LABELS,
  CANONICAL_LEAD_STATUS_ORDER,
  LEAD_STATUS_LABELS,
  UNKNOWN_OWNER_LABEL,
  pageCountOf,
} from "@command-center/contracts";
import type { Lead, LeadStatus } from "@command-center/contracts";

// The query the server is answering. Owned by the data component above this one so a
// filter applies to the whole dataset, not to the page already in the browser.
export type LeadsQuery = {
  page: number;
  pageSize: number;
  q: string;
  status: LeadStatus | null;
  service: string | null;
  owner: string | null;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export type LeadsTableProps = {
  data: Lead[];
  /** Number of records matching the current filters — not the length of `data`. */
  total: number;
  query: LeadsQuery;
  onQueryChange: (patch: Partial<LeadsQuery>) => void;
  /** Owner id → display name, so no raw `user-001` reaches a control. */
  ownerOptions?: readonly { id: string; label: string }[];
  /** Service → count for the canonical "SERVICE · FACETED COUNTS" popover (CANON 153-159).
      Server-derived over the matched set; the popover never counts the rows on screen. */
  serviceFacets?: Readonly<Record<string, number>>;
  /** MO-02 1084 has no pager: its control APPENDS the next batch to the cards already on
      screen, so the mobile list is every batch loaded so far while `data` is one page. The
      accumulation lives in the data component, which is where the responses arrive; this is
      the same 128-record dataset paged by the same query, not a second mobile dataset.
      Omitted → the mobile list falls back to `data`, i.e. the current page only. */
  mobileData?: readonly Lead[];
  /** MOCK/TEST-ONLY VISUAL STATE. Stages the composite presentation the canonical frames were
      authored in — two selected rows, the Service popover open, the applied-filter chip row, a
      page-2 skeleton row, the loading footer suffix and the MO-02 duplicate banner — so the
      captured frames and the canonical PNGs show the same state and can be compared by a human.

      It changes presentation ONLY: `total`, the rows, the page size and the pager are untouched,
      and none of it filters anything. The staged chips, banner and facet ticks are not backed by
      contract fields and must never be shown as real records — the caller is responsible for
      passing this only under `NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE === "mock"`.

      Per-frame, canonical stages different chrome: chips / popover / skeleton / loading suffix
      are C-D05 only (xl), the bulk bar is C-D05 and T-02 (md+), the banner is MO-02 only. */
  canonicalState?: boolean;
};

// Derived from the contract, not restated: this list was a stale 6-value subset that still
// offered "Qualified" (removed 2026-07-22 as unsupported) and omitted 6 canonical statuses.
const STATUS_OPTIONS: readonly LeadStatus[] = CANONICAL_LEAD_STATUS_ORDER;

// Status dot colours, CANON 1362 (`ST`) resolved through the `G` palette at CANON 1311.
// Negotiation is the one status with a literal of its own there rather than a palette entry.
const STATUS_DOT: Record<LeadStatus, string> = {
  New: "#46708E",
  Contacted: "#85826F",
  "Appt Pending": "#B07C24",
  "Appt Scheduled": "#2F7D4F",
  "Discovery Done": "#46708E",
  "Proposal Req.": "#B07C24",
  "Proposal Sent": "#46708E",
  Negotiation: "#96731F",
  Won: "#2F7D4F",
  Lost: "#A63D2B",
  FUL: "#85826F",
};

// CANON 1374 colours the NEXT STEP cell by an authored per-row urgency code that no contract
// field carries. The three codes that map to a word rather than to a date are recovered from
// the word itself; every other value keeps the default body colour. "Review mtg" is blue in
// the canonical frame and renders default here — see the gap matrix.
const NEXT_STEP_TONE: Record<string, string> = {
  Overdue: "font-semibold text-cc-red-ink",
  Today: "font-semibold text-cc-amber-ink",
  Tomorrow: "font-semibold text-cc-amber-ink",
};

const DESKTOP_GRID = "38px 1.5fr .95fr 1.1fr .95fr .9fr .75fr .6fr 34px";
const TABLET_GRID = "30px 1.5fr 1.1fr .9fr .6fr";

// Canonical C-D05 renders authored relative-time strings ("2h", "Apr 24", "Overdue").
// Fall back to the ISO date only when the authored label is absent.
function labelled(label: string | undefined, iso: string | undefined): string {
  return label ?? (iso ? iso.slice(0, 10) : "—");
}

function ownerInitials(name: string): string {
  // CANON 1373: Unassigned carries an em dash, not initials. An unresolvable owner gets the
  // same treatment — inventing "UO" from a placeholder would read as a person's initials.
  if (name === "Unassigned" || name === UNKNOWN_OWNER_LABEL) return "—";
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("");
}

// Canonical C-D05 footer renders "Prev 1 2 3 … 13 Next" on page 1: a three-page window
// plus the last page. Derived from the page count so every page stays reachable.
export function pageWindow(current: number, pageCount: number): (number | "ellipsis")[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.min(Math.max(1, current - 1), pageCount - 3);
  const window = [start, start + 1, start + 2];
  const out: (number | "ellipsis")[] = [];
  if (start > 1) out.push(1, "ellipsis");
  out.push(...window);
  if (start + 2 < pageCount - 1) out.push("ellipsis");
  if (start + 2 < pageCount) out.push(pageCount);
  return out;
}

// CANON 164-166. Literal chip copy from the canonical frame, staged only under
// `canonicalState` — the canonical frame shows these three applied while still reporting the
// unfiltered 128 and the unfiltered ten rows, so they are presentation, not a query.
const CANONICAL_CHIPS = ["Service: AI Automation", "Service: Workflow", "Created: Last 30d"];

// CANON 156-157: the two service facets the canonical popover shows ticked. Matched by name, not
// by rank — the generated dataset carries seven services against canonical's three, so "the top
// two by count" would tick a different pair than the frame does.
const CANONICAL_TICKED_SERVICES = ["AI Automation", "Workflow Automation"];

// Stable id so the Service trigger can point at its panel with aria-controls. A literal
// rather than useId(): exactly one Leads toolbar is ever mounted, and a stable id keeps the
// accessibility snapshots in the evidence set comparable between builds.
const FACET_PANEL_ID = "leads-service-facet-panel";

/**
 * PRESENTATION_TEST_STATE_REFERENCE_DATA — CANON 156-158.
 *
 * The exact three rows the canonical popover renders, with the exact three figures it
 * prints. These are NOT live API truth and NOT status facets: they describe a dataset the
 * canonical frame never defined beyond its first page. They are staged only under
 * `canonicalState`, which is itself only reachable in explicit mock/test mode.
 *
 * The normal Leads route is untouched by this: it keeps deriving the popover from the
 * server's `serviceFacetCounts` over the real matched set. See `facetEntries` below.
 */
const CANONICAL_SERVICE_REFERENCE: readonly (readonly [string, number])[] = [
  ["AI Automation", 21],
  ["Workflow Automation", 17],
  ["Web Applications", 14],
];

/**
 * CANON 1077 + 1490 — `rows7: rows.slice(0, 7)`.
 *
 * The canonical mobile frame emits SEVEN cards (the loop is `hint-placeholder-count="7"`
 * over a seven-element slice); the last is Sofia Marchetti and Derrick Vaughn is not
 * rendered. Nothing is hidden — only seven card elements exist in the source.
 */
const CANONICAL_MOBILE_CARD_COUNT = 7;

/**
 * PRESENTATION_TEST_STATE_REFERENCE_DATA — CANON 1084.
 *
 * CANONICAL_PRESENTATION_INCONSISTENCY. The canonical frame renders seven cards but its
 * load-more label is the literal text `Load 10 more · 118 remaining`, a bare text node with
 * no binding. 128 − 7 = 121, not 118; the 118 corresponds to the ten-record page size the
 * desktop and tablet frames use. The canonical author sliced the card list for frame fit
 * without restating the label.
 *
 * So under `canonicalState` the label is reproduced verbatim as reference data and is NOT
 * claimed to be derived from the seven visible cards. Outside that staged state the mobile
 * control keeps its derived text, where `128 − 10 loaded = 118` is arithmetically correct.
 */
const CANONICAL_LOAD_MORE_LABEL = "Load 10 more · 118 remaining";

// CANON 896 (T-02). The tablet bulk bar is NOT the desktop bar restyled: it shortens
// "Change status" to "Status" and "Schedule follow-up" to "Follow-up", drops "Export"
// entirely, and carries no separator element after the count. Taken from the tablet frame
// itself rather than inferred from C-D05 169-172.
const TABLET_BULK_ACTIONS = ["Assign", "Status", "Follow-up"];
const DESKTOP_BULK_ACTIONS = ["Assign", "Change status", "Schedule follow-up", "Export"];

// CANON 149 vs T-02 890 / MO-02 1071: the desktop frame spells the search placeholder out,
// the tablet and mobile frames shorten it to "Search…". One input can carry one placeholder,
// so the string is chosen by width instead of adding a second search control. Note the
// canonical glyph is U+2026, not three periods.
const SEARCH_PLACEHOLDER_LONG = "Search name, email, company…";
const SEARCH_PLACEHOLDER_SHORT = "Search…";
const DESKTOP_QUERY = "(min-width: 1280px)";
// T-02 908 renders the pager as "‹ 1 2 3 … 13 ›" — U+2039 and U+203A, IBM Plex Mono 10.5px,
// #3E4A52. The md+ query is what tells the Next button whether it is a pager control (accessible
// name "Next page") or the mobile load-more control, whose own visible text is the name.
const TABLET_UP_QUERY = "(min-width: 768px)";

function subscribeToMedia(query: string): (onChange: () => void) => () => void {
  return (onChange) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

const subscribeToDesktop = subscribeToMedia(DESKTOP_QUERY);
const subscribeToTabletUp = subscribeToMedia(TABLET_UP_QUERY);

// CANON 192: seven bars over the nine desktop tracks, first and last column empty.
const SKELETON_BARS = ["72%", "60%", "55%", "58%", "50%", "46%", "60%"];

// The pill type size is not constant across the frames: C-D05 150-155 and T-02 891-892 set
// 12.5px, MO-02 1072-1073 sets 11.5px. Carrying both here rather than at the two mobile
// call sites keeps the override in a `md:` variant, whose cascade order is defined —
// appending a second `text-[…]` utility to the class string would not be.
const PILL_NEUTRAL =
  "rounded-cc-control border border-cc-line-strong px-[11px] py-[7px] text-[11.5px] text-cc-t-table md:text-[12.5px]";
const PILL_ACTIVE =
  "rounded-cc-control border border-cc-green-border bg-cc-green-tint px-[11px] py-[7px] text-[11.5px] font-semibold text-cc-green-ink md:text-[12.5px]";

/** The canonical filter pills draw their own "▾" (CANON 150 `Status ▾`, T-02 892, MO-02 1074).
    A native select is wrong for that in two ways, both measured in Edge against C-D05:

    1. It paints the browser's chevron and reserves room for it. `appearance-none` drops the
       native control and the caret below restores the canonical glyph.
    2. Its intrinsic width is the *widest option*, not the selected one, so the Status pill
       measured 123.29px against the canonical 73.29px and the 50px surplus pushed Service,
       Owner, Source, Appointment and Created right by the same amount. `field-sizing-content`
       sizes it to the current selection instead, which is what a canonical span does.

    The right padding is the canonical 11px plus the advance of the " ▾" run it now has to
    clear: 12.32px at the 11.5px mobile size, 13.39px at the 12.5px md+ size, both measured
    in IBM Plex Sans. That reproduces the canonical pill widths to within 0.02px — Status
    72.42 against 72.43, Owner 73.53 against 73.52, Sort 56.88 against 56.88. The wrapper
    carries the responsive visibility classes because it, not the select, is now the
    toolbar's flex child, and the caret repeats the pill's size variant because it sits in
    the wrapper and so does not inherit the select's. */
function SelectPill({
  className,
  wrapperClassName = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }) {
  return (
    <span className={`relative shrink-0 ${wrapperClassName}`}>
      <select
        {...props}
        className={`${className ?? ""} block appearance-none field-sizing-content pr-[23.32px] md:pr-[24.39px]`}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[11px] top-1/2 -translate-y-1/2 text-[11.5px] text-cc-t-table md:text-[12.5px]"
      >
        ▾
      </span>
    </span>
  );
}

export function LeadsTable({
  data,
  total,
  query,
  onQueryChange,
  ownerOptions = [],
  serviceFacets = {},
  mobileData,
  canonicalState = false,
}: LeadsTableProps) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [facetOpen, setFacetOpen] = useState(false);
  const facetTriggerRef = useRef<HTMLButtonElement>(null);
  const facetPanelRef = useRef<HTMLDivElement>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const pageCount = pageCountOf(total, query.pageSize);
  const firstRow = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const lastRow = Math.min(query.page * query.pageSize, total);
  // MOBILE ONLY. The mobile control appends rather than pages, so "remaining" counts against
  // everything loaded so far — 128 − 10 = 118 after the first batch. Derived from the length
  // of the accumulated list, never from a literal.
  const mobileLoaded = mobileData?.length ?? Math.min(query.page * query.pageSize, total);
  const mobileRemaining = Math.max(0, total - mobileLoaded);

  // CANON 1490 slices the mobile card list to seven, ending at Sofia Marchetti with Derrick
  // Vaughn unrendered. Staged only under `canonicalState`; the live mobile route shows every
  // record it has loaded.
  const mobileRows: readonly Lead[] = canonicalState
    ? data.slice(0, CANONICAL_MOBILE_CARD_COUNT)
    : (mobileData ?? data);

  // CANON 1373-1375: `sel:i===1||i===2` — the second and third rows of the page carry
  // `selBg:'#EAF2ED'` and drive the "2 SELECTED" bar. Derived rather than seeded into state,
  // because `data` arrives after the first render and a lazy initializer would see none of it.
  const activeSelected = canonicalState ? data.slice(1, 3).map((lead) => lead.id) : selected;

  const allSelected = data.length > 0 && data.every((lead) => activeSelected.includes(lead.id));

  // Some-but-not-all. The header box announced itself as a flat "not checked" while two rows
  // were selected, which is the one state a tri-state checkbox exists to distinguish.
  const someSelected = !allSelected && data.some((lead) => activeSelected.includes(lead.id));

  // One place resolves an owner's display name, for rows and for chips alike: the row's own
  // resolved name, else the server-supplied owner directory, else a neutral unknown label.
  // Never "Unassigned" as a fallback — that is a real owner, and defaulting to it labels an
  // unresolvable owner as a specific existing one.
  const ownerLabelOf = useMemo(() => {
    const byId = new Map(ownerOptions.map((o) => [o.id, o.label]));
    return (lead: Lead) => lead.ownerName ?? byId.get(lead.owner) ?? UNKNOWN_OWNER_LABEL;
  }, [ownerOptions]);

  // Every chip in the canonical FILTERS row (CANON 162-167) is one active query field, so
  // the row is derived from the query rather than tracked beside it.
  const chips = useMemo(() => {
    const out: { key: keyof LeadsQuery; label: string }[] = [];
    if (query.q) out.push({ key: "q", label: `Search: ${query.q}` });
    if (query.status) out.push({ key: "status", label: `Status: ${LEAD_STATUS_LABELS[query.status]}` });
    if (query.service) out.push({ key: "service", label: `Service: ${query.service}` });
    if (query.owner) {
      // Never fall back to "Unassigned": that is a real owner's display name, so an
      // unresolvable id would be labelled as a different, existing person. The options list
      // is a server-supplied directory that always contains every selectable owner, so a
      // miss here means the id itself is unknown — which is what the label then says.
      const owner = ownerOptions.find((o) => o.id === query.owner);
      out.push({ key: "owner", label: `Owner: ${owner?.label ?? UNKNOWN_OWNER_LABEL}` });
    }
    return out;
  }, [query.q, query.status, query.service, query.owner, ownerOptions]);

  // MO-02 1073 reads "Filters · 2" and C-D05 151 "Service · 2" — both count the two ticked
  // service facets, which is also what the canonical facet popover shows checked (CANON 156-157).
  // The literal is the canonical figure, not a recount of CANONICAL_CHIPS (which is three).
  const activeFilterCount = canonicalState ? 2 : chips.length;

  // Normal mode: the popover is the server's service facets over the matched set, ranked by
  // count. Canonical visual state: the three reference rows the frame prints, and only those
  // three — no additional service is visible in that state.
  const facetEntries = useMemo<readonly (readonly [string, number])[]>(
    () =>
      canonicalState
        ? CANONICAL_SERVICE_REFERENCE
        : Object.entries(serviceFacets).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    [serviceFacets, canonicalState],
  );

  // The server snapshot is the desktop string: the server has no viewport, and the desktop
  // frame is the one whose placeholder is load-bearing copy. The client corrects it during
  // hydration, before any capture runs.
  const isDesktop = useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );

  // Same server snapshot reasoning as above: the desktop frame is the server default, and the
  // desktop frame is a pager. Below md the client corrects this during hydration and the Next
  // button drops the pager label so the load-more copy is its accessible name.
  const isTabletUp = useSyncExternalStore(
    subscribeToTabletUp,
    () => window.matchMedia(TABLET_UP_QUERY).matches,
    () => true,
  );

  // The canonical staging opens this popover on C-D05 only. Gating it on `isDesktop` rather
  // than on CSS alone keeps the same pixels — `DESKTOP_QUERY` is the xl breakpoint the class
  // below uses — while stopping the trigger from reporting `aria-expanded="true"` at 820px,
  // where the dialog is `display:none` and therefore not exposed to assistive technology.
  // A user-opened panel (`facetOpen`) still opens at md+, unchanged.
  const facetPanelOpen = facetOpen || (canonicalState && isDesktop);

  // A popover that opens and cannot be dismissed is a trap: the only way out was
  // to pick a service or reload. Escape and a click outside close it, and Escape
  // hands focus back to the trigger that opened it. Only the user-opened panel is
  // wired — the canonical staged one is a static frame, not a live disclosure.
  useEffect(() => {
    if (!facetOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setFacetOpen(false);
      facetTriggerRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (facetPanelRef.current?.contains(target) || facetTriggerRef.current?.contains(target)) return;
      setFacetOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [facetOpen]);

  function toggleRow(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected(allSelected ? [] : data.map((lead) => lead.id));
  }

  function clearFilter(key: keyof LeadsQuery) {
    onQueryChange({ [key]: key === "q" ? "" : null } as Partial<LeadsQuery>);
  }

  function reset() {
    setSelected([]);
    onQueryChange({ q: "", status: null, service: null, owner: null, sortBy: undefined, sortDir: undefined });
  }

  function goToPage(page: number) {
    setSelected([]);
    onQueryChange({ page: Math.min(Math.max(1, page), pageCount) });
  }

  function toggleSort(id: string) {
    onQueryChange(
      query.sortBy === id && query.sortDir !== "desc"
        ? { sortBy: id, sortDir: "desc" }
        : { sortBy: id, sortDir: "asc" },
    );
  }

  // CANON 175: header labels are 10.5px/700 with .08em tracking, the sorted one green.
  // The DOM text stays title case and `uppercase` does the rest, so the accessible name
  // of the sort control reads as a word rather than as shouting.
  function headerCell(id: string, label: string, className = "") {
    const active = query.sortBy === id;
    return (
      // The role lives on the wrapper, not on the button: putting columnheader on the
      // button itself would replace its button role and take the sort control out of the
      // accessibility tree as an activatable thing.
      <div
        role="columnheader"
        aria-sort={active ? (query.sortDir === "desc" ? "descending" : "ascending") : "none"}
        className="min-w-0"
      >
        <button
          type="button"
          onClick={() => toggleSort(id)}
          className={`flex items-center gap-1 text-left text-[10.5px] font-bold uppercase tracking-[.08em] ${
            active ? "text-cc-green-ink" : "text-cc-t-header"
          } ${className}`}
        >
          {label}
          {active ? <span aria-hidden="true">{query.sortDir === "desc" ? "↓" : "↑"}</span> : null}
        </button>
      </div>
    );
  }

  function checkbox(checked: boolean, label: string, onChange: () => void, size: string, indeterminate = false) {
    return (
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        /* `indeterminate` is a DOM property with no HTML attribute, so it has to be written
           through a ref. Property only, deliberately no `indeterminate:` style: the box is
           `appearance-none`, the canonical desktop frame shows this exact partial selection
           with an unfilled header box, and styling it would change an accepted frame. The
           repair is what assistive technology reports ("mixed"), not what is drawn. */
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        onChange={onChange}
        className={`${size} shrink-0 appearance-none rounded-[3px] border-[1.5px] border-cc-icon-muted bg-cc-surface checked:border-cc-green checked:bg-cc-green`}
      />
    );
  }

  function statusDot(lead: Lead) {
    return (
      <span className="flex items-center gap-[7px]">
        <i
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-[2px]"
          style={{ background: STATUS_DOT[lead.status] }}
        />
        <span className="truncate text-[10.5px] font-semibold uppercase tracking-[.04em] text-cc-t-table">
          {LEAD_STATUS_LABELS[lead.status]}
        </span>
      </span>
    );
  }

  function nextStepText(lead: Lead) {
    return labelled(lead.nextStepLabel, lead.nextFollowUpAt);
  }

  return (
    // Below md the canonical MO-02 content is a bare card list on the canvas; at md and above
    // toolbar, table and footer are one bordered card (CANON 144 / 173 / 192).
    <div className="md:overflow-hidden md:rounded-cc-card md:border md:border-cc-line md:bg-cc-surface">
      {/* Toolbar. One instance for all three frames: a second copy would give the page two
          search fields with the same label. CANON 144-152 (desktop), 889-893 (tablet),
          1071-1075 (mobile filter bar, full-bleed against the content padding). */}
      <div className="relative -mx-4 -mt-[11px] mb-[11px] flex items-center gap-2 border-b border-cc-line bg-cc-surface px-4 py-[10px] md:mx-0 md:mt-0 md:mb-0 md:gap-2 md:px-[14px] md:py-[11px] xl:gap-[9px] xl:px-4 xl:py-3">
        {/* MO-02 1071 sets this field's inline padding to 10px, C-D05 148 and T-02 890 to 11px. */}
        <label className="flex h-9 flex-1 items-center gap-[9px] rounded-cc-control border border-cc-line bg-cc-secondary px-[10px] md:h-[34px] md:w-[210px] md:flex-none md:px-[11px] xl:w-60">
          {/* md+ only: C-D05 148 and T-02 890 draw the magnifier, MO-02 1071 does not — its
              field opens straight on the placeholder. */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7A868D"
            strokeWidth={2}
            aria-hidden="true"
            className="hidden md:block"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query.q}
            onChange={(e) => onQueryChange({ q: e.target.value })}
            /* CANON 149 at desktop, T-02 890 / MO-02 1071 below it. One input, one
               placeholder, chosen by width — the accessible name stays the descriptive
               "Search leads" at every width regardless of which string is shown. */
            placeholder={isDesktop ? SEARCH_PLACEHOLDER_LONG : SEARCH_PLACEHOLDER_SHORT}
            aria-label="Search leads"
            /* MO-02 1071 sets 12px here, C-D05 148 and T-02 890 12.5px. */
            className="min-w-0 flex-1 bg-transparent text-[12px] text-cc-ink placeholder:text-cc-t3 focus:outline-none md:text-[12.5px]"
          />
        </label>

        {/* Status: desktop pill only (CANON 150). T-02 891 drops it, and MO-02 1071-1074 has no
            Status control in the top toolbar at all — the mobile toolbar is Search / Filters /
            Sort, and Status moves into the Filters disclosure below. */}
        <SelectPill
          value={query.status ?? ""}
          onChange={(e) => onQueryChange({ status: (e.target.value || null) as LeadStatus | null })}
          aria-label="Filter by status"
          className={query.status ? PILL_ACTIVE : PILL_NEUTRAL}
          wrapperClassName="hidden xl:block"
        >
          <option value="">Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </SelectPill>

        {/* MO-02 1073: "Filters · 2", green while any filter is applied. Mobile only — it is the
            disclosure for the facets the desktop toolbar shows inline, so removing the Status
            pill from the mobile toolbar does not remove status filtering from mobile. */}
        <button
          type="button"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen((v) => !v)}
          className={`${activeFilterCount > 0 ? PILL_ACTIVE : PILL_NEUTRAL} h-9 shrink-0 px-[11px] py-0 md:hidden`}
        >
          Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </button>

        {/* Service BEFORE Owner. Both canonical frames agree on this order — C-D05 148-149 is
            Service then Owner, and T-02 891-892 is Service then Owner with Status dropped — so
            one DOM order satisfies both widths and no width-specific reordering is needed.

            Service is the one facet canonical opens as a popover with counts (CANON 152-159),
            so it is a disclosure button rather than a native select. */}
        <button
          ref={facetTriggerRef}
          type="button"
          aria-expanded={facetPanelOpen}
          // aria-controls points at the panel below. `aria-haspopup` is deliberately ABSENT:
          // the panel is a group of independent toggles with a Clear action, so it is neither
          // a dialog nor a menu, and claiming either would describe behaviour (focus trap,
          // arrow-key roving) that this control does not implement.
          aria-controls={FACET_PANEL_ID}
          onClick={() => setFacetOpen((v) => !v)}
          className={`hidden md:block ${query.service || canonicalState ? PILL_ACTIVE : PILL_NEUTRAL}`}
        >
          {canonicalState ? `Service · ${activeFilterCount}` : query.service ? `Service · ${query.service}` : "Service"} ▾
        </button>

        {/* Owner facet — values are owner ids, option text is the display name, so no raw
            `user-001` reaches a control. CANON 150 / T-02 892. */}
        <SelectPill
          value={query.owner ?? ""}
          onChange={(e) => onQueryChange({ owner: e.target.value || null })}
          aria-label="Filter by owner"
          className={query.owner ? PILL_ACTIVE : PILL_NEUTRAL}
          wrapperClassName="hidden md:block"
        >
          <option value="">Owner</option>
          {ownerOptions.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.label}
            </option>
          ))}
        </SelectPill>

        {/* Sort: MO-02 1074 only. The desktop and tablet frames sort from the header row. */}
        <SelectPill
          value={query.sortBy ?? ""}
          onChange={(e) =>
            onQueryChange(
              e.target.value ? { sortBy: e.target.value, sortDir: "asc" } : { sortBy: undefined, sortDir: undefined },
            )
          }
          aria-label="Sort leads"
          className={`${PILL_NEUTRAL} h-9 py-0`}
          /* MO-02 1074 measures 57px. `field-sizing-content` reaches that from the "Sort"
             label itself, so no fixed width is pinned here. */
          wrapperClassName="h-9 md:hidden"
        >
          <option value="">Sort</option>
          <option value="name">Lead</option>
          <option value="status">Status</option>
          <option value="createdAt">Created</option>
        </SelectPill>

        {/* CANON 150 also shows Source / Appointment / Created triggers. No list parameter
            backs them, so they are rendered as inert chrome — the same treatment the
            Overview header search gets — rather than as controls that do nothing. */}
        <span className={`${PILL_NEUTRAL} hidden xl:inline-block`} aria-hidden="true">
          Source ▾
        </span>
        <span className={`${PILL_NEUTRAL} hidden xl:inline-block`} aria-hidden="true">
          Appointment ▾
        </span>
        {/* CANON 153 spells this trigger "Created · Last 30d ▾" — the canonical frame is a
            visual-QA state with that range already chosen. It uses the same neutral pill as
            Status/Owner/Source/Appointment; only Service is green there. The applied range is
            therefore staged with the rest of the canonical state rather than forced onto the
            normal default view, which has no range selected. */}
        <span className={`${PILL_NEUTRAL} hidden xl:inline-block`} aria-hidden="true">
          {canonicalState ? "Created · Last 30d ▾" : "Created ▾"}
        </span>

        {/* CANON 152: "128 RESULTS" at desktop; T-02 893 keeps the figure alone. */}
        <span className="ml-auto hidden font-cc-mono text-[10.5px] uppercase text-cc-t3 md:inline xl:text-[11px]">
          {total}
          <span className="hidden xl:inline"> results</span>
        </span>

        {facetPanelOpen ? (
          <div
            ref={facetPanelRef}
            id={FACET_PANEL_ID}
            role="group"
            aria-label="Service faceted counts"
            /* CANON 154-160 opens this on C-D05 only; T-02 891 shows the trigger active with no
               popover, so the staged copy is xl-gated while a user-opened one stays md+. */
            className={`absolute left-4 top-[52px] z-10 w-[238px] rounded-cc-card border border-cc-line bg-cc-surface p-2 shadow-[0_16px_36px_rgba(20,26,30,.18)] xl:left-[262px] ${
              canonicalState && !facetOpen ? "hidden xl:block" : ""
            }`}
          >
            <div className="px-2 pb-[6px] pt-1 text-[10px] font-bold uppercase tracking-[.08em] text-cc-t-header">
              Service · faceted counts
            </div>
            {facetEntries.map(([service, count]) => (
              <button
                key={service}
                type="button"
                // A toggle, so it reports its own on/off state. The tick beside it is
                // aria-hidden decoration; aria-pressed is what a screen reader announces.
                // The accessible name comes from the service name and count text below.
                aria-pressed={query.service === service}
                onClick={() => onQueryChange({ service: query.service === service ? null : service })}
                className="flex w-full items-center gap-[9px] px-2 py-[6px] text-left"
              >
                {/* Normal mode: the count is the server's facet over the matched set.
                    Canonical visual state: the reference figure the frame prints, which is
                    staged presentation data and not a live count. */}
                <span
                  aria-hidden="true"
                  className={`h-[14px] w-[14px] shrink-0 rounded-[3px] ${
                    (canonicalState ? CANONICAL_TICKED_SERVICES.includes(service) : query.service === service)
                      ? "bg-cc-green"
                      : "border-[1.5px] border-cc-icon-muted"
                  }`}
                />
                <span className="flex-1 truncate text-[12.5px] text-cc-ink">{service}</span>
                <span className="font-cc-mono text-[10.5px] text-cc-t3">{count}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onQueryChange({ service: null });
                setFacetOpen(false);
              }}
              className="mt-1 w-full border-t border-cc-soft px-2 pt-2 text-left text-[11.5px] font-semibold text-cc-t2"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      {/* Mobile Filters disclosure (MO-02 1073 trigger). Closed by default, so the canonical
          mobile toolbar is Search / Filters / Sort exactly as the frame draws it. */}
      {mobileFiltersOpen ? (
        <div className="-mx-4 mb-2 flex flex-col gap-2 border-b border-cc-line bg-cc-surface px-4 pb-3 md:hidden">
          <select
            value={query.status ?? ""}
            onChange={(e) => onQueryChange({ status: (e.target.value || null) as LeadStatus | null })}
            aria-label="Filter by status"
            className={`${query.status ? PILL_ACTIVE : PILL_NEUTRAL} w-full`}
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            value={query.owner ?? ""}
            onChange={(e) => onQueryChange({ owner: e.target.value || null })}
            aria-label="Filter by owner"
            className={`${query.owner ? PILL_ACTIVE : PILL_NEUTRAL} w-full`}
          >
            <option value="">Owner</option>
            {ownerOptions.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* MO-02 1076. No contract field carries duplicate detection, so this is staged
          presentation only and never renders outside the mock/test visual state. */}
      {canonicalState ? (
        <div className="mb-2 flex items-center gap-2 rounded-[6px] border border-[#E5D3A1] bg-cc-surface px-[11px] py-2 md:hidden">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A5F17" strokeWidth={2} aria-hidden="true">
            <path d="M12 9v4M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span className="text-[10.5px] text-[#6E5A1E]">Possible duplicate — matching phone on LD-4820</span>
        </div>
      ) : null}

      {/* Active-filter chips, CANON 162-167 — a C-D05 band; T-02 has no chip row, so the staged
          copy is xl-only while chips a user actually applied stay visible from md up. */}
      {canonicalState || chips.length > 0 ? (
        <div
          className={`hidden flex-wrap items-center gap-2 bg-cc-surface px-4 pb-3 ${
            canonicalState ? "xl:flex" : "md:flex"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase text-cc-t3">Filters:</span>
          {canonicalState
            ? CANONICAL_CHIPS.map((label) => (
                <span
                  key={label}
                  className="rounded-[5px] border border-cc-green-border bg-cc-green-tint px-2 py-1 text-[11.5px] font-semibold text-cc-green-ink"
                >
                  {label} ✕
                </span>
              ))
            : chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  /* Without this the accessible name is "Service: AI Automation ✕" — the
                     glyph is decoration and says nothing about what the button does. */
                  aria-label={`Remove filter ${chip.label}`}
                  onClick={() => clearFilter(chip.key)}
                  className="rounded-[5px] border border-cc-green-border bg-cc-green-tint px-2 py-1 text-[11.5px] font-semibold text-cc-green-ink"
                >
                  {chip.label} <span aria-hidden="true">✕</span>
                </button>
              ))}
          <button type="button" onClick={reset} className="text-[11.5px] font-semibold text-cc-red">
            Reset all
          </button>
        </div>
      ) : null}

      {/* Bulk bar. C-D05 169-172 and T-02 896 are NOT the same bar restyled — the tablet frame
          was read on its own terms and differs in four ways: it shortens "Change status" to
          "Status" and "Schedule follow-up" to "Follow-up", drops "Export", omits the 1x14px
          separator after the count, and runs a 12px gap / 8px 14px padding / 11px count /
          11.5px labels against desktop's 14px / 9px 16px / 11.5px / 12px. Both label sets are
          rendered and gated by width; a `display:none` child produces no flex gap, so each
          width lays out exactly as its frame does.

          Only "Clear" has a list operation behind it in this phase; every action label is
          inert chrome. */}
      {activeSelected.length > 0 ? (
        <div className="hidden items-center gap-3 bg-cc-ink-strong px-[14px] py-2 text-[#F2F5F6] md:flex xl:gap-[14px] xl:px-4 xl:py-[9px]">
          <span className="font-cc-mono text-[11px] font-semibold uppercase xl:text-[11.5px]">
            {activeSelected.length} selected
          </span>
          {/* C-D05 170 only; T-02 896 has no separator element. */}
          <span aria-hidden="true" className="hidden h-[14px] w-px bg-[#3B4248] xl:block" />
          {TABLET_BULK_ACTIONS.map((action) => (
            <span key={action} aria-hidden="true" className="text-[11.5px] text-[#D5DBDE] xl:hidden">
              {action}
            </span>
          ))}
          {DESKTOP_BULK_ACTIONS.map((action) => (
            <span key={action} aria-hidden="true" className="hidden text-[12px] text-[#D5DBDE] xl:inline">
              {action}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setSelected([])}
            className="ml-auto text-[11.5px] text-cc-t3 xl:text-[12px]"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Desktop (xl+), C-D05 173-190. */}
      <div role="table" aria-label="Leads" className="hidden xl:block">
        <div role="rowgroup">
          <div
            role="row"
            style={{ gridTemplateColumns: DESKTOP_GRID }}
            className="grid items-center gap-3 border-b border-cc-line bg-cc-secondary px-4 py-[10px]"
          >
            {checkbox(allSelected, "Select all rows", toggleAll, "h-[14px] w-[14px]", someSelected)}
            {headerCell("name", "Lead")}
            {headerCell("serviceInterest", "Service")}
            {headerCell("status", "Status")}
            {headerCell("owner", "Owner")}
            {headerCell("appointmentStatus", "Appointment")}
            {headerCell("nextFollowUpAt", "Next step")}
            {headerCell("createdAt", "Created")}
            <span />
          </div>
        </div>
        <div role="rowgroup">
          {data.map((lead) => (
            <div
              key={lead.id}
              role="row"
              style={{ gridTemplateColumns: DESKTOP_GRID }}
              className={`grid h-[42px] items-center gap-3 border-b border-cc-soft px-4 ${
                activeSelected.includes(lead.id) ? "bg-[#EAF2ED]" : "bg-cc-surface"
              }`}
            >
              {checkbox(activeSelected.includes(lead.id), `Select row ${lead.name}`, () => toggleRow(lead.id), "h-[14px] w-[14px]")}
              {/* CANON 178: name and company share one baseline row, not two lines. */}
              <span role="cell" className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[13px] font-semibold text-cc-ink">{lead.name}</span>
                <span className="truncate text-[11px] text-cc-t3">{lead.company}</span>
              </span>
              <span role="cell" className="truncate text-[12px] text-cc-t-table">
                {lead.serviceInterest ?? "—"}
              </span>
              <span role="cell" className="min-w-0">
                {statusDot(lead)}
              </span>
              <span role="cell" className="flex min-w-0 items-center gap-[7px]">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#EEF2F0] text-[8.5px] font-bold text-cc-green-ink"
                >
                  {ownerInitials(ownerLabelOf(lead))}
                </span>
                <span className="truncate text-[12px] text-cc-t-table">{ownerLabelOf(lead)}</span>
              </span>
              <span role="cell" className="truncate text-[11.5px] text-cc-t2">
                {lead.appointmentStatus ? APPOINTMENT_STATUS_LABELS[lead.appointmentStatus] : "—"}
              </span>
              <span role="cell" className={`truncate text-[12px] ${NEXT_STEP_TONE[nextStepText(lead)] ?? "text-cc-t-table"}`}>
                {nextStepText(lead)}
              </span>
              <span role="cell" className="truncate font-cc-mono text-[10.5px] text-cc-t3">
                {labelled(lead.createdAgoLabel, lead.createdAt)}
              </span>
              <span role="cell" aria-hidden="true" className="text-cc-icon-muted">
                ↗
              </span>
            </div>
          ))}
          {/* CANON 192: the page-2 fetch in flight. Not a `role="row"` — it holds no cells, and
              exposing it as a row would put an eleventh empty row in the accessibility tree and
              in anything that counts rows. */}
          {canonicalState ? (
            <div
              aria-hidden="true"
              style={{ gridTemplateColumns: DESKTOP_GRID }}
              className="grid h-[42px] items-center gap-3 border-b border-cc-soft px-4"
            >
              <span />
              {SKELETON_BARS.map((width, i) => (
                <div key={i}>
                  <div className="h-[9px] rounded-[3px] bg-[#E7EBED]" style={{ width }} />
                </div>
              ))}
              <span />
            </div>
          ) : null}
        </div>
      </div>

      {/* Tablet (md–xl), T-02 903-909: five columns, 48px rows, lead cell stacked. */}
      <div role="table" aria-label="Leads" className="hidden md:block xl:hidden">
        <div role="rowgroup">
          <div
            role="row"
            style={{ gridTemplateColumns: TABLET_GRID }}
            className="grid items-center gap-[10px] border-b border-cc-line bg-cc-secondary px-[14px] py-[9px]"
          >
            {checkbox(allSelected, "Select all rows", toggleAll, "h-[15px] w-[15px]", someSelected)}
            {headerCell("name", "Lead", "text-[10px]")}
            {headerCell("status", "Status", "text-[10px]")}
            {headerCell("nextFollowUpAt", "Next step", "text-[10px]")}
            {headerCell("createdAt", "Created", "text-[10px]")}
          </div>
        </div>
        <div role="rowgroup">
          {data.map((lead) => (
            <div
              key={lead.id}
              role="row"
              style={{ gridTemplateColumns: TABLET_GRID }}
              className={`grid h-12 items-center gap-[10px] border-b border-cc-soft px-[14px] ${
                activeSelected.includes(lead.id) ? "bg-[#EAF2ED]" : "bg-cc-surface"
              }`}
            >
              {checkbox(activeSelected.includes(lead.id), `Select row ${lead.name}`, () => toggleRow(lead.id), "h-[15px] w-[15px]")}
              <span role="cell" className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold text-cc-ink">{lead.name}</span>
                <span className="block truncate text-[10.5px] text-cc-t3">{lead.company}</span>
              </span>
              <span role="cell" className="min-w-0">
                {statusDot(lead)}
              </span>
              <span role="cell" className={`truncate text-[11.5px] ${NEXT_STEP_TONE[nextStepText(lead)] ?? "text-cc-t-table"}`}>
                {nextStepText(lead)}
              </span>
              <span role="cell" className="truncate font-cc-mono text-[10px] text-cc-t3">
                {labelled(lead.createdAgoLabel, lead.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile (<md), MO-02 1079-1085: card list, no table. Outside the canonical state this
          is the CUMULATIVE list — every batch loaded so far, not just the current page —
          which is why it reads `mobileRows` rather than `data`. */}
      <ul className="md:hidden">
        {mobileRows.map((lead) => (
          <li key={lead.id} className="mb-2 rounded-[6px] border border-cc-line bg-cc-surface px-3 py-[10px]">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold text-cc-ink">{lead.name}</span>
              <span className="flex shrink-0 items-center gap-[6px]">
                <i
                  aria-hidden="true"
                  className="h-2 w-2 rounded-[2px]"
                  style={{ background: STATUS_DOT[lead.status] }}
                />
                <span className="text-[9.5px] font-semibold uppercase text-cc-t-table">
                  {LEAD_STATUS_LABELS[lead.status]}
                </span>
              </span>
            </div>
            {/* MO-02 1081: margin-top:1px. Without it the card is 1px short and the list drifts. */}
            <div className="mt-px truncate text-[11px] text-cc-t3">
              {lead.company} · {lead.serviceInterest} · {ownerLabelOf(lead)}
            </div>
            <div className="mt-[6px] flex items-center justify-between border-t border-cc-soft pt-[6px]">
              <span className={`truncate text-[11px] ${NEXT_STEP_TONE[nextStepText(lead)] ?? "text-cc-t-table"}`}>
                {nextStepText(lead)}
              </span>
              <span aria-hidden="true" className="shrink-0 text-[11px] font-semibold text-cc-green">
                Open ›
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* A query that matches nothing rendered the header row over blank space. The counters
          already read "0 results" and "0–0 of 0", so the state was reported — this only names
          it where the rows would be, and announces the change via role="status". No canonical
          authority defines this copy; it is an enhancement, not a defect repair. Outside the
          table elements rather than inside a rowgroup: a status message is not a row. No
          canonical frame is ever empty, so the accepted frames do not change. */}
      {data.length === 0 ? (
        <p role="status" className="px-4 py-8 text-center text-[12.5px] text-cc-t3">
          No leads match the current search and filters.
        </p>
      ) : null}

      {/* Footer. CANON 192-195 at desktop/tablet; MO-02 1086 replaces the pager with a
          single full-width control, so Next carries both presentations rather than the
          page gaining a second "next page" button. */}
      {/* No border-top: CANON 193 and T-02 908 both rely on the last row's own bottom rule. */}
      <div className="flex items-center justify-between gap-3 md:bg-cc-secondary md:px-[14px] md:py-[10px] xl:px-4 xl:py-[11px]">
        {/* Uppercased by CSS, not in the DOM: "1–10 OF 128" on screen, readable text under it. */}
        <span className="hidden font-cc-mono text-[10px] uppercase text-cc-t3 md:inline xl:text-[11px]">
          {firstRow}–{lastRow} of {total}
          {/* CANON 194 pairs the skeleton row with this suffix. T-02 908 is the bare count. */}
          {canonicalState ? <span className="hidden xl:inline"> · loading page 2…</span> : null}
        </span>
        {/* Tablet spacing is measured, not inherited. T-02 908 sets 6–9px of clear space
            between pager glyphs (mean 7.3); the shared 5px gap plus each item's md:px-[3px]
            produced 11px and made the run 107px wide against a canonical 86px. 1px + 3 + 3
            lands on 7px. Scoped to md only: the desktop pager is an accepted frame. */}
        <div className="flex w-full items-center gap-[5px] md:w-auto md:gap-px xl:gap-[5px]">
          <button
            type="button"
            aria-label="Previous page"
            aria-describedby={query.page <= 1 ? "leads-pager-prev-reason" : undefined}
            onClick={() => goToPage(query.page - 1)}
            disabled={query.page <= 1}
            /* T-02 908 renders the pager as a plain mono string; C-D05 195 boxes it. */
            className="hidden text-cc-t4 disabled:opacity-40 md:block md:px-[3px] md:font-cc-mono md:text-[10.5px] md:text-cc-t-table xl:rounded-[5px] xl:border xl:border-cc-line xl:px-[10px] xl:py-[5px] xl:font-cc-body xl:text-[12px] xl:text-cc-t4"
          >
            {/* T-02 908 is a chevron, C-D05 195 is the word. The accessible name is the
                aria-label above at both widths, so the glyph is never announced. */}
            <span aria-hidden="true" className="xl:hidden">
              ‹
            </span>
            <span className="hidden xl:inline">Prev</span>
          </button>
          {pageWindow(query.page, pageCount).map((entry, i) =>
            entry === "ellipsis" ? (
              <span key={`gap-${i}`} className="hidden font-cc-mono text-cc-t4 md:inline md:text-[10.5px] xl:text-[11.5px]">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                aria-label={`Go to page ${entry}`}
                aria-current={entry === query.page ? "page" : undefined}
                onClick={() => goToPage(entry)}
                className={
                  entry === query.page
                    ? "hidden font-cc-mono font-semibold md:block md:px-[3px] md:text-[10.5px] md:text-cc-ink xl:rounded-[5px] xl:bg-cc-ink-strong xl:px-[9px] xl:py-[5px] xl:text-[11.5px] xl:text-cc-surface"
                    : "hidden font-cc-mono text-cc-t-table md:block md:px-[3px] md:text-[10.5px] xl:rounded-[5px] xl:border xl:border-cc-line xl:px-[9px] xl:py-[5px] xl:text-[11.5px]"
                }
              >
                {entry}
              </button>
            ),
          )}
          {/* The label is applied at md and up only: at mobile this control is the load-more
              button and its visible text ("Load 10 more · 118 remaining") is the accessible
              name. Overriding that with "Next page" would misdescribe it. */}
          <button
            type="button"
            aria-label={isTabletUp ? "Next page" : undefined}
            aria-describedby={query.page >= pageCount ? "leads-pager-next-reason" : undefined}
            onClick={() => goToPage(query.page + 1)}
            disabled={query.page >= pageCount}
            className="w-full rounded-[6px] border border-cc-line-strong bg-cc-surface py-2 text-center text-[11.5px] font-semibold text-cc-t-table disabled:opacity-40 md:w-auto md:rounded-none md:border-0 md:bg-transparent md:px-[3px] md:py-0 md:font-cc-mono md:text-[10.5px] md:font-normal xl:rounded-[5px] xl:border xl:border-cc-line-strong xl:bg-cc-surface xl:px-[10px] xl:py-[5px] xl:font-cc-body xl:text-[12px] xl:font-semibold"
          >
            <span className="md:hidden">
              {canonicalState
                ? CANONICAL_LOAD_MORE_LABEL
                : mobileRemaining > 0
                  ? `Load ${Math.min(query.pageSize, mobileRemaining)} more · ${mobileRemaining} remaining`
                  : "No more results"}
            </span>
            {/* T-02 908 chevron at tablet, C-D05 195 word at desktop. */}
            <span aria-hidden="true" className="hidden md:inline xl:hidden">
              ›
            </span>
            <span className="hidden xl:inline">Next</span>
          </button>
          {/* Both pager ends are honestly disabled at the edges of the result set,
              with the reason announced rather than left to the dimmed styling. */}
          {query.page <= 1 ? (
            <span id="leads-pager-prev-reason" className="sr-only">
              You are on the first page.
            </span>
          ) : null}
          {query.page >= pageCount ? (
            <span id="leads-pager-next-reason" className="sr-only">
              You are on the last page. There are no more results.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
