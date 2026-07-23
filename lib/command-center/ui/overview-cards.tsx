// C-D01 Overview cards. Source: Dashboard/Command Center Final.dc.html —
// desktop C-D01 44-79, tablet T-01 856-883, mobile MO-01 1040-1064.
//
// The three frames are not one layout at three widths: mobile drops the chart
// entirely and leads with Today's work, tablet drops the right rail, and only
// desktop shows Meetings & proposals and Recent activity. Each component
// therefore takes an explicit `variant` and renders that frame's markup, rather
// than one markup tree bent with utility classes until all three "roughly" fit.
//
// No data here: every value is supplied by the caller from
// apps/web/mocks/fixtures/overview-canonical.ts, which documents the
// no-backing-contract gap (same arrangement as pipeline-journey.tsx).
//
// Static presentation only — no state, no handlers, so no client boundary.
import type { CSSProperties } from "react";

export type OverviewKpi = {
  label: string;
  tabletLabel?: string;
  value: string;
  valueColor: string;
  pill: string;
  pillInk: string;
  pillTint: string;
  pillBorder: string;
  context: string;
};

export type TodaysWorkItem = {
  title: string;
  meta: string;
  tag: string;
  color: string;
  cta: string;
};

export type ActivityItem = { text: string; time: string; color: string };

export type LeadFlowGeometry = {
  area: string;
  received: string;
  contacted: string;
  won: string;
  wonPoints: { x: string; y: string }[];
  labels: string[];
  receivedStroke: string;
  contactedStroke: string;
  wonStroke: string;
  areaFill: string;
};

const CARD = "rounded-cc-card border border-cc-line bg-cc-surface";

/* ------------------------------------------------------------------ KPIs -- */

// CANON 45: one bordered card containing a four-cell grid, NOT four detached
// cards — the cells are divided by internal 1px rules, with no gap between them.
export function KpiStrip({ kpis }: { kpis: OverviewKpi[] }) {
  return (
    <div className={`grid grid-cols-4 overflow-hidden ${CARD} shrink-0`}>
      {kpis.map((k, i) => (
        // CANON 1323 kc(): 16px 20px, left rule on every cell but the first.
        <div key={k.label} className={`px-5 py-4 ${i ? "border-l border-cc-line-inner" : ""}`}>
          <div className="flex justify-between gap-2">
            <span className="text-[11px] font-bold tracking-[.1em] text-cc-t-header">{k.label}</span>
            <Pill kpi={k} />
          </div>
          <div
            className="mt-2.5 font-cc-mono text-[32px] font-semibold leading-none"
            style={{ color: k.valueColor }}
          >
            {k.value}
          </div>
          <div className="mt-2 text-[11.5px] text-cc-t3">{k.context}</div>
        </div>
      ))}
    </div>
  );
}

// CANON 1324 pill().
function Pill({ kpi }: { kpi: OverviewKpi }) {
  return (
    <span
      className="shrink-0 rounded-[4px] border px-1.5 py-px font-cc-mono text-[10.5px] font-semibold"
      style={{ color: kpi.pillInk, backgroundColor: kpi.pillTint, borderColor: kpi.pillBorder }}
    >
      {kpi.pill}
    </span>
  );
}

// CANON 860-864: two columns inside one card, 28px values, and the fourth label
// abbreviated to "OVERDUE".
export function KpiGridTablet({ kpis }: { kpis: OverviewKpi[] }) {
  return (
    <div className={`grid grid-cols-2 overflow-hidden ${CARD}`}>
      {kpis.map((k, i) => (
        <div
          key={k.label}
          className={`px-[18px] py-3.5 ${i % 2 ? "border-l border-cc-line-inner" : ""} ${
            i < 2 ? "border-b border-cc-line-inner" : ""
          }`}
        >
          <span className="text-[11px] font-bold tracking-[.1em] text-cc-t-header">
            {k.tabletLabel ?? k.label}
          </span>
          <div className="mt-2 flex items-baseline gap-[9px]">
            <span
              className="font-cc-mono text-[28px] font-semibold"
              style={{ color: k.valueColor }}
            >
              {k.value}
            </span>
            <span
              className="rounded-[4px] px-1.5 py-px font-cc-mono text-[10px] font-semibold"
              style={{ color: k.pillInk, backgroundColor: k.pillTint }}
            >
              {k.pill}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// CANON 1048-1050: two separate cards, 22px values, and the pill loses its
// background and border — it is bare monospace text at this width.
export function KpiGridMobile({ kpis }: { kpis: OverviewKpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-[9px]">
      {kpis.map((k) => (
        <div key={k.label} className={`${CARD} px-[13px] py-2.5`}>
          <span className="text-[9.5px] font-bold tracking-[.08em] text-cc-t-header">
            {k.tabletLabel ?? k.label}
          </span>
          <div className="flex items-baseline gap-[7px]">
            <span
              className="font-cc-mono text-[22px] font-semibold"
              style={{ color: k.valueColor }}
            >
              {k.value}
            </span>
            <span className="font-cc-mono text-[9px] font-semibold" style={{ color: k.pillInk }}>
              {k.pill}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- Lead Flow -- */

const FLOW_VIEWBOX = "0 0 1090 212";

// CANON 50-55 (desktop) / 870-873 (tablet). Same 1090x212 geometry at both
// widths; the tablet frame is 10px shorter, drops the marker dots, the legend
// row and the four-stat header block, and thickens every stroke.
export function LeadFlowCard({
  flow,
  variant,
}: {
  flow: LeadFlowGeometry;
  variant: "desktop" | "tablet";
}) {
  const desktop = variant === "desktop";
  const chart = (
    <svg
      width="100%"
      height={desktop ? 160 : 150}
      viewBox={FLOW_VIEWBOX}
      preserveAspectRatio="none"
      className="block"
      style={{ padding: desktop ? "2px 10px 0" : "4px 8px 0" }}
      aria-hidden="true"
    >
      <path d={flow.area} fill={flow.areaFill} opacity=".12" />
      <path d={flow.received} fill="none" stroke={flow.receivedStroke} strokeWidth={desktop ? 1.75 : 2} />
      <path d={flow.contacted} fill="none" stroke={flow.contactedStroke} strokeWidth={desktop ? 2.25 : 2.5} />
      <path d={flow.won} fill="none" stroke={flow.wonStroke} strokeWidth={desktop ? 2.5 : 3} />
      {desktop
        ? flow.wonPoints.map((p) => (
            <circle key={p.x} cx={p.x} cy={p.y} r={3.5} fill={flow.wonStroke} />
          ))
        : null}
    </svg>
  );

  const labels = (
    <div
      className="flex justify-between"
      style={{ padding: desktop ? "2px 26px 5px" : "2px 20px 10px" }}
    >
      {flow.labels.map((l) => (
        <span
          key={l}
          className={`font-cc-mono text-cc-t3 ${desktop ? "text-[10px]" : "text-[9.5px]"}`}
        >
          {l}
        </span>
      ))}
    </div>
  );

  if (!desktop) {
    return (
      <div className={CARD}>
        {/* CANON 871 */}
        <div className="px-4 pt-[11px]">
          <div className="text-[13px] font-semibold text-cc-ink">Lead Flow</div>
          <div className="text-[10.5px] text-cc-t3">
            34 received · 26 contacted · 12 won · 35% recv→won
          </div>
        </div>
        {chart}
        {labels}
      </div>
    );
  }

  return (
    <div className={CARD}>
      {/* CANON 51 */}
      <div className="flex items-start justify-between px-[18px] pt-3.5">
        <div>
          <div className="text-[15px] font-semibold text-cc-ink">Lead Flow</div>
          <div className="mt-0.5 text-[12px] text-cc-t3">
            How new inquiries move from received to contacted and won · Mar 3 – Apr 22 vs prior
            period
          </div>
        </div>
        <div className="flex gap-[18px] text-right">
          <FlowStat value="34" caption="received" />
          <FlowStat value="26" caption="contacted" color="#8A5F17" />
          <FlowStat value="12" caption="won" color="#276B42" />
          <FlowStat value="35%" caption="recv→won · ▲4.2pp" color="#276B42" />
        </div>
      </div>
      {chart}
      {labels}
      {/* CANON 54 */}
      <div className="flex gap-4 px-[18px] pb-[7px] text-[11.5px] text-cc-t2">
        <LegendSwatch color={flow.receivedStroke} label="Received (area)" />
        <LegendSwatch color={flow.contactedStroke} label="Contacted" />
        <LegendSwatch color={flow.wonStroke} label="Won" />
        <span className="ml-auto shrink-0 font-cc-mono text-[10px] text-cc-t4">
          76% CONTACT RATE · 35% WIN RATE
        </span>
      </div>
    </div>
  );
}

function FlowStat({ value, caption, color }: { value: string; caption: string; color?: string }) {
  return (
    <div>
      <div className="font-cc-mono text-[17px] font-semibold" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="text-[10.5px] text-cc-t3">{caption}</div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <i className="h-[3px] w-2.5 shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// CANON 1056-1058: at mobile the chart is replaced by a one-line summary with an
// expand affordance — the series are not drawn at all.
export function LeadFlowSummaryMobile() {
  return (
    <div className={`${CARD} px-[13px] py-2.5`}>
      <div className="flex justify-between">
        <span className="text-[11.5px] font-semibold text-cc-ink">Lead Flow</span>
        <span className="text-[10px] font-semibold text-cc-green">Expand ▾</span>
      </div>
      <div className="mt-[3px] text-[10.5px] text-cc-t2">
        34 received · 26 contacted · 12 won ·{" "}
        <b className="text-cc-green-ink">35% recv→won ▲4.2pp</b>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Todays work -- */

// CANON 56-58 / 866-868 / 1044-1046. Desktop gives every row a CTA button and a
// square colour chip; tablet drops the button and moves the colour to an inset
// left rail; mobile keeps the rail but drops the meta line as well.
export function TodaysWorkCard({
  items,
  openCount,
  variant,
}: {
  items: TodaysWorkItem[];
  openCount: string;
  variant: "desktop" | "tablet" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <div className={CARD}>
        <div className="border-b border-cc-line-inner px-[13px] py-[9px] text-[11px] font-bold tracking-[.08em] text-cc-t-header">
          TODAY&apos;S WORK · {openCount}
        </div>
        {items.map((w) => (
          <div
            key={w.title}
            className="border-b border-cc-soft px-[13px] py-[9px] last:border-b-0"
            style={insetRail(w.color)}
          >
            <div className="flex justify-between gap-2">
              <span className="min-w-0 truncate text-[12px] font-semibold text-cc-ink">
                {w.title}
              </span>
              <span
                className="shrink-0 font-cc-mono text-[8.5px] font-semibold"
                style={{ color: w.color }}
              >
                {w.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "tablet") {
    return (
      <div className={CARD}>
        <div className="flex justify-between border-b border-cc-line-inner px-4 py-[11px]">
          <span className="text-[13px] font-semibold text-cc-ink">
            Today&apos;s work · {openCount} open
          </span>
          <span className="text-[11.5px] font-semibold text-cc-green">View queue</span>
        </div>
        {items.map((w) => (
          <div
            key={w.title}
            className="flex min-h-[46px] items-center gap-3 border-b border-cc-soft px-4 py-1.5 last:border-b-0"
            style={insetRail(w.color)}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-cc-ink">{w.title}</div>
              <div className="truncate text-[11px] text-cc-t3">{w.meta}</div>
            </div>
            <span
              className="shrink-0 font-cc-mono text-[9px] font-semibold"
              style={{ color: w.color }}
            >
              {w.tag}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between border-b border-cc-line-inner px-[18px] py-3">
        <span className="text-[15px] font-semibold text-cc-ink">
          Today&apos;s work{" "}
          <span className="font-cc-mono text-[11px] font-normal text-cc-t3">
            · {openCount} open
          </span>
        </span>
        <span className="text-[12px] font-semibold text-cc-green">View queue</span>
      </div>
      {items.map((w) => (
        <div
          key={w.title}
          className="flex h-10 items-center gap-3.5 border-b border-cc-soft px-[18px] last:border-b-0"
        >
          <i
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: w.color }}
          />
          <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
            <span className="truncate text-[13.5px] font-semibold text-cc-ink">{w.title}</span>
            <span className="truncate text-[12px] text-cc-t3">{w.meta}</span>
          </div>
          <span
            className="shrink-0 font-cc-mono text-[10px] font-semibold tracking-[.08em]"
            style={{ color: w.color }}
          >
            {w.tag}
          </span>
          <span className="shrink-0 rounded-[5px] border border-cc-line-strong px-2.5 py-[5px] text-[12px] font-semibold text-cc-t-table">
            {w.cta}
          </span>
        </div>
      ))}
    </div>
  );
}

// CANON 868/1046: the row's colour is an inset left rail, not a border — a
// border would shift the row's content box against the canonical frame.
function insetRail(color: string): CSSProperties {
  return { boxShadow: `inset 3px 0 0 ${color}` };
}

/* -------------------------------------------------- Meetings & proposals -- */

// CANON 67-70 (desktop) / 1052-1054 (mobile). Desktop shows a 30px icon tile and
// a sub-line per row; mobile reduces the tile to an 8px square and drops the sub.
export function MeetingsProposalsCard({ variant }: { variant: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <div className={CARD}>
        <div className="flex items-center gap-2.5 border-b border-cc-soft px-[13px] py-[9px]">
          <i className="h-2 w-2 rounded-[2px] bg-cc-blue" />
          <span className="flex-1 text-[11.5px] font-semibold text-cc-ink">
            2 meetings need review
          </span>
          <span className="text-[10.5px] font-semibold text-cc-green">Review</span>
        </div>
        <div className="flex items-center gap-2.5 px-[13px] py-[9px]">
          <i className="h-2 w-2 rounded-[2px] bg-cc-green" />
          <span className="flex-1 text-[11.5px] font-semibold text-cc-ink">
            3 proposals awaiting action
          </span>
          <span className="text-[10.5px] font-semibold text-cc-green">Open</span>
        </div>
      </div>
    );
  }

  return (
    <div className={CARD}>
      <div className="border-b border-cc-line-inner px-4 py-3 text-[13px] font-semibold text-cc-ink">
        Meetings &amp; proposals
      </div>
      <div className="flex items-center gap-[11px] border-b border-cc-soft px-4 py-[11px]">
        <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md bg-cc-blue-tint text-cc-blue-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden="true">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        </span>
        <div className="flex-1">
          <div className="text-[12.5px] font-semibold text-cc-ink">2 meetings need review</div>
          <div className="text-[11px] text-cc-t3">Solterra discovery · Northwind no-show</div>
        </div>
        <span className="text-[11.5px] font-semibold text-cc-green">Review</span>
      </div>
      <div className="flex items-center gap-[11px] px-4 py-[11px]">
        <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md bg-cc-green-tint text-cc-green-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <div className="flex-1">
          <div className="text-[12.5px] font-semibold text-cc-ink">3 proposals awaiting action</div>
          <div className="text-[11px] text-cc-t3">1 internal review · 1 viewed · 1 expiring Fri</div>
        </div>
        <span className="text-[11.5px] font-semibold text-cc-green">Open</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Recent work --- */

// CANON 72-74. Desktop only: the card takes the remaining rail height and clips
// its own overflow rather than growing the frame.
export function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <div className={`${CARD} min-h-0 flex-1 overflow-hidden`}>
      <div className="border-b border-cc-line-inner px-4 py-3 text-[13px] font-semibold text-cc-ink">
        Recent activity
      </div>
      {items.map((a) => (
        <div key={a.text} className="flex items-start gap-[11px] border-b border-cc-soft px-4 py-1.5">
          <i
            className="mt-1 h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: a.color }}
          />
          <span className="flex-1 text-[12px] leading-[1.45] text-cc-t-table">{a.text}</span>
          <span className="shrink-0 font-cc-mono text-[10px] text-cc-t4">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

// CANON 1064: mobile closes with a single combined next-appointment / latest
// activity card in place of the desktop Recent activity list.
export function NextUpCardMobile() {
  return (
    <div className={`${CARD} px-[13px] py-[9px]`}>
      <div className="text-[10.5px] text-cc-t-table">
        <b>Next appt:</b> Alicia F. · 10:00 AM · prep done
      </div>
      <div className="mt-[3px] text-[10px] text-cc-t4">
        Recent: analysis ready — Solterra · PRO-2031 viewed 3×
      </div>
    </div>
  );
}
