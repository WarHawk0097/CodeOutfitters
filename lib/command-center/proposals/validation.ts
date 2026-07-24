// Canonical proposal validation + milestone-schedule invariants (P-D06 validation, P-D08 milestones).
// Shared by the builder (live-editing validation panel) and the preview (read-only send gate).
import type { ValidationItem } from "./model";

/** Total of the milestone payment percentages. A valid schedule sums to exactly 100. */
export function scheduleTotalPct(milestones: readonly { paymentPct: number }[]): number {
  return milestones.reduce((total, m) => total + m.paymentPct, 0);
}

export function isScheduleBalanced(milestones: readonly { paymentPct: number }[]): boolean {
  return scheduleTotalPct(milestones) === 100;
}

/** How many validation items still need attention (anything not already `valid`). */
export function unresolvedCount(items: readonly ValidationItem[]): number {
  return items.filter((i) => i.status !== "valid").length;
}

/** A proposal with any `blocked` finding cannot be sent (state-machines.json: blocked prevents send). */
export function isSendBlocked(items: readonly ValidationItem[]): boolean {
  return items.some((i) => i.status === "blocked");
}

// P-D06 frame: "2 TO RESOLVE" with a BLOCKED banner on the unsupported uptime claim.
export const CANONICAL_VALIDATION: ValidationItem[] = [
  { id: "pricing-sum", label: "Pricing lines sum to the proposal total", status: "valid" },
  { id: "schedule", label: "Milestone schedule totals 100%", status: "valid" },
  { id: "client", label: "Client and recipient details present", status: "valid" },
  { id: "exec-review", label: "Executive summary reviewed", status: "review" },
  { id: "uptime", label: "Uptime claim needs a source", status: "blocked" },
];

export const CANONICAL_BLOCKED_REASON =
  "Cannot send until the unsupported uptime claim is removed or sourced.";
