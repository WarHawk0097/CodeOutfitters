"use client";
// Narrow client wrapper around Sidebar/ShellHeader — only usePathname needs the
// client boundary; the rest of the shell layout stays server-rendered.
import { useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, ShellHeader } from "@command-center/ui";
import { useHeaderStats, useLeadsExport, useDashboardRange } from "./header-stats";
import { useCommandCenterConfig } from "@/components/command-center/mode-provider";
import { downloadCsv, exportLeadsCsv } from "../../lib/leads-csv";
import { PipelineHeaderChip, PipelineMobileCount, PipelineSubtitle } from "./pipeline/pipeline-header";
import { AppointmentsMobileView, AppointmentsSubtitle, AppointmentsViewTabs } from "./appointments/appointments-header";

// Canonical header copy, C-D01 41 and C-D05 143. The Overview date line is
// canonical display copy, not a live clock: no data source in this phase
// supplies it, and the deterministic fixtures are explicitly clock-free.
// The Leads subtitle ("128 total · …") is derived from the real response total
// and is wired from LeadsData rather than hard-coded here.
// The trailing meeting clause is desktop-only: C-D01 41 has it, T-01 858 ends
// the line at "4 items need attention".
const PAGE_META: Record<string, { title: string; subtitle?: ReactNode }> = {
  "/dashboard": {
    title: "Overview",
    subtitle: (
      <>
        Tuesday, April 22 · 4 items need attention
        <span className="hidden xl:inline"> · next meeting in 1h 20m</span>
      </>
    ),
  },
  "/dashboard/leads": { title: "Leads" },
  // CANON 213. The count and the pager are live, so both come from components rather than
  // from literals here.
  "/dashboard/pipeline": { title: "Pipeline", subtitle: <PipelineSubtitle /> },
  // CANON 316. Both counts are derived from the appointments the list renders.
  "/dashboard/appointments": { title: "Appointments", subtitle: <AppointmentsSubtitle /> },
  // M-D01 452 / MO-08 1157: the header reads "Meeting Intelligence", not the nav label
  // "Meetings". The view switch and subtitle live in the route body (MO-08 draws the strip
  // below the header), so nothing header-side is needed beyond the title.
  "/dashboard/meetings": { title: "Meeting Intelligence" },
  // C-D12 342: the view switch lives in the route body, so nothing header-side is needed
  // beyond the title.
  "/dashboard/follow-ups": { title: "Follow-ups" },
  // CANON 1428: the proposal directory owns its own toolbar, so the header carries the title only.
  "/dashboard/proposals": { title: "Proposals" },
  // The email log owns its own toolbar, so the header carries the title only.
  "/dashboard/email-activity": { title: "Email Activity" },
  // The member table owns its own toolbar, so the header carries the title only.
  "/dashboard/team": { title: "Team" },
  // The settings form owns its own section index, so the header carries the title only.
  "/dashboard/settings": { title: "Settings" },
};

// C-D01 42 (desktop) / T-01 858 (tablet). The desktop header carries a search
// field, the range switch, a notification bell and the account avatar; the
// tablet header keeps only the range switch. Presentation only in this phase:
// search and range are not wired to any query, so they are rendered as inert
// chrome rather than as controls that look interactive and do nothing.
// Range switch labels paired with the shared LeadFlowRangeValue they set.
const RANGE_PILLS = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
] as const;

function OverviewHeaderRight() {
  const { range, setRange } = useDashboardRange();
  return (
    <>
      {/* C-D01 42 draws a search field here. No search index exists yet, so it is a
          real but natively disabled input with the reason attached — not a div that
          merely looks like a field, and no keyboard-shortcut hint for a shortcut
          that is not bound. */}
      <div className="hidden h-9 w-[300px] items-center gap-[9px] rounded-cc-control border border-cc-line bg-cc-secondary px-3 xl:flex">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A868D" strokeWidth={2} aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          disabled
          aria-label="Search the Command Center"
          aria-describedby="overview-search-reason"
          placeholder="Search…"
          className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-[13px] text-cc-t3 outline-none placeholder:text-cc-t3"
        />
        <span id="overview-search-reason" className="sr-only">
          Search is available when a live workspace is connected.
        </span>
      </div>

      {/* Live 7D/30D/90D switch. Shares its range with the Lead-flow card's in-card
          selector via useDashboardRange, so the two never disagree. aria-pressed
          announces the active range to assistive tech (not colour-only). */}
      <div className="flex overflow-hidden rounded-cc-control border border-cc-line bg-cc-surface">
        {RANGE_PILLS.map(({ label, value }) => {
          const active = value === range;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              aria-label={`Show the last ${value.replace("d", "")} days`}
              onClick={() => setRange(value)}
              className={
                active
                  ? "bg-cc-ink-strong px-[11px] py-[7px] font-cc-mono text-[10.5px] font-semibold text-white xl:px-3 xl:py-2 xl:text-[11px]"
                  : "px-[11px] py-[7px] font-cc-mono text-[10.5px] text-cc-t2 transition-colors hover:text-cc-ink xl:px-3 xl:py-2 xl:text-[11px]"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <svg className="hidden xl:block" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3E4A52" strokeWidth={1.75} aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span className="hidden h-8 w-8 items-center justify-center rounded-[7px] bg-cc-avatar text-[12px] font-semibold text-cc-avatar-ink xl:flex">
        MR
      </span>
    </>
  );
}

// C-D05 143 (desktop) / T-02 888 (tablet). Both actions are inert chrome in this phase:
// no column-visibility state and no export endpoint exists yet, and rendering them as
// buttons would advertise behaviour that is not there. T-02 shortens "Export CSV".
function LeadsHeaderRight() {
  const { downloadsEnabled } = useCommandCenterConfig();
  const { exportQuery } = useLeadsExport();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // The guard is a ref, not the `exporting` state. State is only readable through the
  // closure the current render captured, so a second click landing before React re-renders
  // and rebinds this handler still sees `exporting === false` — three rapid clicks produced
  // two downloads in the browser. A ref is written synchronously and read by every closure.
  const exportingRef = useRef(false);

  const onExport = async () => {
    // Demo is a real download: exportLeadsCsv reads client fixture state and downloadCsv
    // writes a file. The mode config (server-decided) gates it off so demo never emits a
    // real download; live (Work Order F) is the only mode that exports.
    if (!downloadsEnabled || exportingRef.current || !exportQuery) return;
    exportingRef.current = true;
    setExporting(true);
    setMessage(null);
    try {
      const { csv, rowCount, filename } = await exportLeadsCsv(exportQuery);
      downloadCsv(csv, filename);
      setMessage(`Exported ${rowCount} leads to ${filename}`);
    } catch (err) {
      setMessage(`Export failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  };

  return (
    <>
      {/* Columns is Phase 4. Rendered as a real control with real disabled semantics rather
          than an enabled-looking no-op: role=button, aria-disabled, out of the tab order, and
          a guarded handler. The native `disabled` attribute is deliberately NOT used — its
          user-agent styling would repaint a pixel-accepted frame. */}
      <span
        role="button"
        aria-disabled="true"
        tabIndex={-1}
        title={DEFERRED_REASON}
        aria-describedby="leads-columns-reason"
        onClick={(event) => event.preventDefault()}
        className="cursor-default rounded-cc-control border border-cc-green-border bg-cc-green-tint px-[11px] py-[7px] text-[12px] font-semibold text-cc-green-ink xl:px-[13px] xl:py-2 xl:text-[12.5px]"
      >
        Columns ▾
      </span>
      {/* The title alone is not an accessible reason — it is not announced on a
          non-focusable element and never appears on touch. */}
      <span id="leads-columns-reason" className="sr-only">
        {DEFERRED_REASON}
      </span>
      {downloadsEnabled ? (
        <button
          type="button"
          onClick={onExport}
          aria-disabled={exporting || !exportQuery}
          aria-label="Export CSV"
          // appearance-none plus an explicit border: a <button> inherits user-agent chrome that
          // the <span> this replaces did not have, and the frame it sits in is pixel-accepted.
          className="appearance-none rounded-cc-control border-0 bg-cc-green px-[11px] py-[7px] text-[12px] font-semibold text-white xl:px-[13px] xl:py-2 xl:text-[12.5px]"
        >
          Export<span className="hidden xl:inline"> CSV</span>
        </button>
      ) : (
        // Demo: no real download. Same frame, inert — role=button, aria-disabled, out of the
        // tab order, guarded handler. Mirrors the Columns control so the accepted frame is
        // unchanged; honest title states downloads arrive with the production data service.
        <span
          role="button"
          aria-disabled="true"
          tabIndex={-1}
          title="Available when the production data service is connected."
          aria-describedby="leads-export-reason"
          onClick={(event) => event.preventDefault()}
          className="cursor-default appearance-none rounded-cc-control border-0 bg-cc-green px-[11px] py-[7px] text-[12px] font-semibold text-white xl:px-[13px] xl:py-2 xl:text-[12.5px]"
        >
          Export<span className="hidden xl:inline"> CSV</span>
        </span>
      )}
      {downloadsEnabled ? null : (
        <span id="leads-export-reason" className="sr-only">
          Available when the production data service is connected.
        </span>
      )}
      {/* Announced, not shown: the canonical header has no room for a status line, and a
          visible one would repaint an accepted frame. */}
      <span role="status" aria-live="polite" className="sr-only">
        {exporting ? "Preparing CSV export" : (message ?? "")}
      </span>
    </>
  );
}

// Only these two app routes exist in Phase 3. The other eight nav rows point at
// pages later phases build. Two separate problems come from that:
//   1. Next prefetches every visible <Link> on hover/idle, so each unbuilt row
//      fired an RSC request that answered 404 — real network failures in the
//      acceptance evidence, not cosmetic noise.
//   2. Clicking one navigated to /_not-found: an active-looking control whose
//      only outcome is an error page.
// Both are fixed by rendering those rows as gated links (below) instead of
// <Link>. Delete an entry from this set as its page lands — do NOT stub pages to
// silence the 404, that would fake later-phase completion.
export const IMPLEMENTED_ROUTES: ReadonlySet<string> = new Set([
  "/dashboard",
  "/dashboard/leads",
  "/dashboard/pipeline",
  "/dashboard/appointments",
  "/dashboard/meetings",
  "/dashboard/follow-ups",
  "/dashboard/proposals",
  "/dashboard/email-activity",
  "/dashboard/team",
  "/dashboard/settings",
]);

// The accessible explanation a gated row carries. Announced as the row's
// description (the label stays its name), and surfaced as the native tooltip.
const DEFERRED_REASON = "Not available yet — this section arrives in a later implementation phase";

// Sidebar/ShellHeader take the link component as a prop so packages/ui stays
// framework-agnostic; which routes exist is app knowledge, so the decision is
// applied here rather than pushed into the UI package.
export function ShellLink({
  href,
  children,
  title,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  "aria-label"?: string;
  "aria-current"?: "page";
}) {
  // The sidebar, the icon rail and the drawer all render the same rows, so the
  // reason id has to be per-instance rather than derived from the href.
  const uid = useId();
  if (!IMPLEMENTED_ROUTES.has(href)) {
    // An <a> with no href does not navigate and is not in the tab order, so
    // tabIndex puts it back: the row stays reachable and announced, it just
    // reports itself as unavailable instead of loading a 404. Every class and
    // inline style is the one the live rows use, so the frames are unchanged.
    // The reason lives outside the anchor so it describes the row without
    // becoming part of its accessible name, and it is wired with
    // aria-describedby rather than title alone (a tooltip never appears on
    // touch). sr-only is absolutely positioned, so the nav layout is unchanged.
    const reasonId = `${uid}-deferred-reason`;
    return (
      <>
        <a
          role="link"
          aria-disabled="true"
          tabIndex={0}
          title={title ? `${title} — ${DEFERRED_REASON}` : DEFERRED_REASON}
          aria-describedby={reasonId}
          {...rest}
        >
          {children}
        </a>
        <span id={reasonId} className="sr-only">
          {DEFERRED_REASON}
        </span>
      </>
    );
  }
  return (
    <Link href={href} title={title} {...rest}>
      {children}
    </Link>
  );
}

export function ShellNav() {
  const pathname = usePathname();
  return <Sidebar activeHref={pathname} linkAs={ShellLink} />;
}

// Content padding is canonical PER SCREEN, not per breakpoint alone: Overview is
// 14px 16px / 18px 20px / 12px 24px 14px (MO-01 1042, T-01 859, C-D01 44) and Leads is
// 11px 16px / 18px 20px / 20px 24px (MO-02 1077, T-02 894, C-D05 143). Reading the
// pathname here is what lets the shell keep one <main> instead of each page re-declaring
// the scroll container.
// Pipeline lands on the same three values (MO-03 1095, T-03 918, C-D06 206), so it shares
// the constant rather than declaring a duplicate of it.
const RECORD_PADDING = "px-4 py-[11px] md:px-5 md:py-[18px] xl:px-6 xl:py-5";
const DEFAULT_PADDING = "px-4 py-[14px] md:px-5 md:py-[18px] xl:px-6 xl:pt-3 xl:pb-[14px]";

// Appointments lands on the same three values (MO-07 1142, T-06 970, C-D11 315). Meetings
// shares them too — MO-08 1158 is 11px 16px, the desktop directory sits in a 24px gutter.
const RECORD_ROUTES = new Set(["/dashboard/leads", "/dashboard/pipeline", "/dashboard/appointments", "/dashboard/meetings", "/dashboard/follow-ups", "/dashboard/proposals", "/dashboard/email-activity", "/dashboard/team"]);

export function ShellMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main
      data-cc-scroll
      className={`min-h-0 flex-1 overflow-y-auto ${RECORD_ROUTES.has(pathname) ? RECORD_PADDING : DEFAULT_PADDING}`}
    >
      {children}
    </main>
  );
}

export function ShellHeaderBar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname];
  const { stats } = useHeaderStats();
  const isLeads = pathname === "/dashboard/leads";
  // CANON 143: "128 total · 12 new this week · 9 awaiting first contact". All three numbers
  // are aggregates the API computes over the whole matched set and returns on the list
  // envelope; none is a literal. The week window is a fixed reference instant documented in
  // mocks/fixtures/generate-leads.ts, so nothing here reads the real clock.
  //
  // Desktop-only: T-02 888 is a bare "Leads" with no second line, unlike T-01 858 which keeps
  // the Overview subtitle. The gate is therefore on the Leads subtitle node, not on the shared
  // header, so the accepted Overview tablet frame is unaffected.
  const leadsSubtitle =
    isLeads && stats ? (
      <span className="hidden xl:inline">
        {stats.total} total · {stats.newThisWeek} new this week · {stats.awaitingFirstContact}{" "}
        awaiting first contact
      </span>
    ) : undefined;
  return (
    <ShellHeader
      activeHref={pathname}
      linkAs={ShellLink}
      title={meta?.title ?? "Command Center"}
      subtitle={leadsSubtitle ?? meta?.subtitle}
      right={
        pathname === "/dashboard" ? (
          <OverviewHeaderRight />
        ) : isLeads ? (
          <LeadsHeaderRight />
        ) : pathname === "/dashboard/pipeline" ? (
          <PipelineHeaderChip />
        ) : pathname === "/dashboard/appointments" ? (
          // T-06 969 puts the Upcoming/Calendar/Past switch in the header, and C-D11 316
          // keeps it top-right of the screen. One instance, so the control and the panel it
          // switches can never disagree.
          <AppointmentsViewTabs />
        ) : undefined
      }
      mobileCenter={
        // MO-01 1041 keeps the brand mark in the header and repeats the page
        // title in the body; MO-02 1069 puts the page title in the header.
        // Exactly one of the two headings is ever rendered: the header block is
        // `hidden md:block`, this one is inside the `md:hidden` centre slot.
        pathname === "/dashboard" ? undefined : <h1 className="text-[15px] font-semibold text-cc-ink">{meta?.title}</h1>
      }
      mobileRight={
        pathname === "/dashboard" ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-cc-avatar text-[11px] font-semibold text-cc-avatar-ink">
            MR
          </span>
        ) : isLeads && stats ? (
          // MO-02 1070: the record count replaces the avatar at mobile.
          <span className="font-cc-mono text-[10px] text-cc-t3">{stats.total}</span>
        ) : pathname === "/dashboard/pipeline" ? (
          // MO-03 1090 does the same on Pipeline.
          <PipelineMobileCount />
        ) : pathname === "/dashboard/appointments" ? (
          // MO-07 1141: the view switch collapses to "Calendar ▾" in the header.
          <AppointmentsMobileView />
        ) : undefined
      }
    />
  );
}
