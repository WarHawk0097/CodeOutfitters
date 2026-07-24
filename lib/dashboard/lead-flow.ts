// Pure, deterministic aggregation for the Dashboard Lead-flow chart.
//
// No React, no clock, no I/O — just leads in, daily buckets out — so the whole thing is
// unit-testable in isolation (lead-flow.test.ts) and the chart component can stay thin.
//
// Time model (documented once, here):
//   reference instant   REFERENCE_NOW = 2026-04-22T17:00:00.000Z (the shared demo
//                        "now"; NEVER the real clock — see generate-leads.ts).
//   timezone            UTC throughout. Every lead timestamp is a `Z` instant and we
//                        only ever read UTC parts, so no local-time day-shift can occur.
//   bucket              a rolling 24h window ending at REFERENCE_NOW - k·DAY, half-open
//                        at the start and inclusive at the end: (end-DAY, end]. Bucket
//                        k=0 is (Apr 21 17:00, Apr 22 17:00]. This matches isNewThisWeek
//                        exactly, so the 7-day range's newLeads sum equals the Leads
//                        header's "new this week" count (asserted in the test).
//   range               the last N such buckets, N ∈ {7, 30, 90}, oldest bucket first.
//   date label          the UTC calendar date of each bucket's END instant. Consecutive
//                        bucket ends fall on distinct UTC dates, so labels are unique.
import { isQualifiedStatus, type Lead } from "@command-center/contracts";
import { REFERENCE_NOW } from "../../mocks/fixtures/generate-leads";

const DAY_MS = 86_400_000;

export type LeadFlowRangeValue = "90d" | "30d" | "7d";

export type LeadFlowRange = {
  value: LeadFlowRangeValue;
  /** Option label in the range selector. */
  label: string;
  /** Lower-case fragment for the accessible summary: "…during <summaryLabel>". */
  summaryLabel: string;
  days: number;
};

// Order is the selector's display order (widest first), matching the supplied component.
export const LEAD_FLOW_RANGES: readonly LeadFlowRange[] = [
  { value: "90d", label: "Last 3 months", summaryLabel: "the last 3 months", days: 90 },
  { value: "30d", label: "Last 30 days", summaryLabel: "the last 30 days", days: 30 },
  { value: "7d", label: "Last 7 days", summaryLabel: "the last 7 days", days: 7 },
];

export const DEFAULT_LEAD_FLOW_RANGE: LeadFlowRangeValue = "90d";

export function leadFlowRange(value: LeadFlowRangeValue): LeadFlowRange {
  return LEAD_FLOW_RANGES.find((r) => r.value === value) ?? LEAD_FLOW_RANGES[0]!;
}

// Single source of truth for the two series' human labels and theme colors. The chart's
// chartConfig, the tooltip and the legend all read these, so the label a user sees never
// drifts from the internal data key (newLeads / qualifiedLeads) — which is never shown.
export const LEAD_FLOW_SERIES = {
  newLeads: { label: "New leads", colorVar: "var(--chart-1)" },
  qualifiedLeads: { label: "Qualified leads", colorVar: "var(--chart-2)" },
} as const;

export type LeadFlowPoint = {
  /** UTC calendar date of the bucket's end instant, `YYYY-MM-DD`. Internal key. */
  date: string;
  newLeads: number;
  qualifiedLeads: number;
};

/**
 * The instant a lead counts as qualified, or null if it is not qualified.
 *
 * Primary source is the typed `qualifiedAt` set by the mock generator. The fallback
 * covers a lead qualified at RUNTIME by a demo mutation (a status override carries no
 * qualifiedAt): if the current status is qualified we use `updatedAt` — the last state
 * change — clamped to the reference instant. It is deliberately NEVER `createdAt`:
 * intake time is not qualification time.
 */
export function qualifiedInstant(lead: Lead, referenceNow: string = REFERENCE_NOW): string | null {
  if (lead.qualifiedAt) return lead.qualifiedAt;
  if (!isQualifiedStatus(lead.status)) return null;
  const refMs = Date.parse(referenceNow);
  return new Date(Math.min(refMs, Date.parse(lead.updatedAt))).toISOString();
}

/** UTC date key `YYYY-MM-DD` of an ISO instant. Safe: reads the UTC calendar date. */
function utcDateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Bucket index of an instant relative to the reference: 0 = most recent 24h. */
function bucketIndex(ms: number, refMs: number): number {
  return Math.floor((refMs - ms) / DAY_MS);
}

/**
 * Aggregate leads into daily {date, newLeads, qualifiedLeads} points for the range.
 * Oldest bucket first. Always returns exactly `days` points (zero-filled), so the chart
 * has a stable x-axis even where no lead landed.
 */
export function aggregateLeadFlow(
  leads: readonly Lead[],
  range: LeadFlowRangeValue,
  referenceNow: string = REFERENCE_NOW,
): LeadFlowPoint[] {
  const { days } = leadFlowRange(range);
  const refMs = Date.parse(referenceNow);

  // points[i] corresponds to bucket index (days-1-i): index days-1 is the oldest.
  const points: LeadFlowPoint[] = Array.from({ length: days }, (_, i) => {
    const idx = days - 1 - i;
    return { date: utcDateKey(refMs - idx * DAY_MS), newLeads: 0, qualifiedLeads: 0 };
  });

  const bump = (ms: number, key: "newLeads" | "qualifiedLeads") => {
    if (ms > refMs) return;
    const idx = bucketIndex(ms, refMs);
    if (idx < 0 || idx >= days) return;
    points[days - 1 - idx]![key] += 1;
  };

  for (const lead of leads) {
    bump(Date.parse(lead.createdAt), "newLeads");
    const qi = qualifiedInstant(lead, referenceNow);
    if (qi) bump(Date.parse(qi), "qualifiedLeads");
  }

  return points;
}

export function leadFlowTotals(points: readonly LeadFlowPoint[]): {
  newTotal: number;
  qualifiedTotal: number;
} {
  return points.reduce(
    (acc, p) => ({
      newTotal: acc.newTotal + p.newLeads,
      qualifiedTotal: acc.qualifiedTotal + p.qualifiedLeads,
    }),
    { newTotal: 0, qualifiedTotal: 0 },
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Human date for the x-axis / tooltip, e.g. "Apr 22". UTC — never shifts by timezone. */
export function formatBucketDate(dateKey: string): string {
  const ms = Date.parse(`${dateKey}T00:00:00.000Z`);
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
