// Deterministic C-D01 Overview fixture. Values copied verbatim from the design
// authority (Dashboard/Command Center Final.dc.html: palette 1311, KPI cards
// 1325-1329, today's work 1330-1334, recent activity 1335-1340, lead-flow
// geometry 1341-1349) — no invented KPI values, stage values, or copy.
//
// Data-model note (same gap as mocks/fixtures/pipeline-phases.ts): none of this
// is backed by a contract or endpoint in @command-center/contracts. The design
// source carries it as static display copy inside its own script block, so it is
// passed to the UI as typed props rather than derived from LeadsListResponse.
// Deriving these tiles from the generated 128-record dataset would render
// generated counts, not the canonical 34/9/7/4 — that is a parity failure, not
// a data-integrity win. Only the Leads screen (C-D05) shows dataset-derived
// numbers, and its total comes from the live response.
//
// Nothing here is synthetic test data: every string and number below is a
// direct extraction from the cited design-authority lines.
import type {
  ActivityItem,
  LeadFlowGeometry,
  OverviewKpi,
  TodaysWorkItem,
} from "@command-center/ui";

// Design source palette (G) — Command Center Final.dc.html line 1311.
const G = {
  tx: "#1B2226",
  t3: "#7A868D",
  gr: "#2F7D4F",
  grI: "#276B42",
  grT: "#E2F0E7",
  grB: "#BFDCCA",
  am: "#B07C24",
  amI: "#8A5F17",
  amT: "#F4EBD4",
  rd: "#A63D2B",
  rdI: "#8C3021",
  rdT: "#F6E3DD",
  bl: "#46708E",
  blI: "#33566E",
  blT: "#E3EDF4",
  nt: "#85826F",
};

// CANON 1325-1329. pill() = line 1324, kc() = line 1323. `tabletLabel` carries
// the abbreviated fourth label from CANON 864.
export const OVERVIEW_KPIS: OverviewKpi[] = [
  {
    label: "NEW LEADS",
    value: "34",
    valueColor: G.tx,
    pill: "+18%",
    pillInk: G.grI,
    pillTint: G.grT,
    pillBorder: G.grB,
    context: "12 this week · Google brand is top source",
  },
  {
    label: "AWAITING CONTACT",
    value: "9",
    valueColor: G.tx,
    pill: "ACTION",
    pillInk: G.amI,
    pillTint: G.amT,
    pillBorder: "#E5D3A1",
    context: "oldest waiting 6h — Dana Whitfield",
  },
  {
    label: "APPOINTMENTS",
    value: "7",
    valueColor: G.tx,
    pill: "3 TODAY",
    pillInk: G.blI,
    pillTint: G.blT,
    pillBorder: "#C6D8E4",
    context: "next in 1h 20m · Alicia F. · 10:00 AM",
  },
  {
    label: "OVERDUE FOLLOW-UPS",
    tabletLabel: "OVERDUE",
    value: "4",
    valueColor: G.rd,
    pill: "+2",
    pillInk: G.rdI,
    pillTint: G.rdT,
    pillBorder: "#E8C4B8",
    context: "3 owned by Priya · 1 unassigned · 68% booking completion",
  },
];

// MO-01 1048-1050 shows only the first and last tile.
export const OVERVIEW_KPIS_MOBILE: OverviewKpi[] = [OVERVIEW_KPIS[0]!, OVERVIEW_KPIS[3]!];

// CANON 1330-1334; `color` is the design source's `tc`. The "· 7 open" count in the card header (CANON 57) is the
// design source's own figure and is not derived from this four-row sample.
export const TODAYS_WORK_OPEN_COUNT = "7";

export const TODAYS_WORK: TodaysWorkItem[] = [
  {
    title: "Call Ruben Ortega — first contact",
    meta: "Northwind Logistics · overdue since yesterday",
    tag: "OVERDUE",
    color: G.rd,
    cta: "Open",
  },
  {
    title: "Review discovery meeting — Priyanka Rao",
    meta: "Solterra Energy · transcript + CRM recommendations ready",
    tag: "REVIEW",
    color: G.bl,
    cta: "Review",
  },
  {
    title: "Proposal follow-up — Gregory Mullins",
    meta: "Harbor & Co · viewed yesterday, expires Friday",
    tag: "DUE TODAY",
    color: G.am,
    cta: "Open",
  },
  {
    title: "Appointment — Alicia Fenwick",
    meta: "Bright Harbor Realty · 10:00 AM PST · prepare questions",
    tag: "TODAY",
    color: G.gr,
    cta: "Prepare",
  },
];

// CANON 1335-1340 — five rows.
export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    text: "Meeting analysis ready — Solterra discovery (14 requirements, 2 objections)",
    time: "32m",
    color: G.bl,
  },
  { text: "Proposal PRO-2031 viewed by Harbor & Co (3rd view)", time: "1h", color: G.gr },
  { text: "Confirmation email delivered to Dana Whitfield", time: "2h", color: G.gr },
  { text: "Abandoned-booking reminder failed for Ruben Ortega", time: "5h", color: G.rd },
  { text: "Priya moved Derrick Vaughn to Negotiation", time: "1d", color: G.nt },
];

// Lead-flow chart geometry, CANON 1341-1349. The plot is authored in a fixed
// 1090x212 user-space box with the plot band at y 8..200; the SVG is stretched
// to the card width with preserveAspectRatio="none", so these coordinates are
// resolution-independent and are reproduced here rather than re-derived.
const X = [46, 248, 450, 652, 854, 1056];
const recv = [30, 38, 25, 46, 35, 48];
const cont = [19, 25, 16, 33, 26, 34];
const won = [4, 7, 3, 9, 6, 12];
const y = (v: number) => 200 - v * 3.9;
const line = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${X[i]} ${y(v)}`).join(" ");

export const LEAD_FLOW: LeadFlowGeometry = {
  area: `${line(recv)} L${X[5]} 200 L${X[0]} 200 Z`,
  received: line(recv),
  contacted: line(cont),
  won: line(won),
  /** Marker dots sit on the won series only (CANON 52). */
  wonPoints: won.map((v, i) => ({ x: String(X[i]), y: String(y(v)) })),
  labels: ["Mar 3", "Mar 17", "Mar 31", "Apr 7", "Apr 14", "This wk"],
  /** Series stroke colours, CANON 52. */
  receivedStroke: "#8B979D",
  contactedStroke: "#D9A94E",
  wonStroke: G.gr,
  areaFill: "#5A6B74",
};
