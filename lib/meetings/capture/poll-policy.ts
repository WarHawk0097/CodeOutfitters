// Recording Events polling policy — the pure decision the data hook applies after
// every poll. Extracted from use-capture-events.ts so the timing rules are testable
// without a DOM and have exactly ONE home (the pre-fix hook encoded them inline, and
// its "not_started stops after one bounded probe" rule was dead code: the follow-up
// branch ran before the terminal branch, so a meeting that never starts capture was
// polled forever).
//
// The rules, in the order the hook must apply them:
//   1. error            → retry with backoff (keep the last good snapshot on screen)
//   2. terminal phase   → stop (completed/failed need no more truth than they have;
//                         not_started stops after ONE bounded follow-up so a start
//                         command from another tab still lands, then idle is idle)
//   3. one-probe phase  → bounded follow-up while probes remain
//   4. live phase       → steady ACTIVE_POLL_MS cadence
import type { RecordingPhase } from "./events";

export const ACTIVE_POLL_MS = 5000;
export const ERROR_BACKOFF_MS = ACTIVE_POLL_MS * 2;

/** Phases that are final truth: polling further cannot change the story. */
export const TERMINAL_PHASES: readonly RecordingPhase[] = ["completed", "failed"];

/** Phases that get an initial probe plus ONE bounded follow-up, then stop. */
export const ONE_PROBE_PHASES: readonly RecordingPhase[] = ["not_started"];

/** How many times a one-probe phase may be probed before polling stops
 *  (the initial probe counts, so 2 = initial + one follow-up). */
export const MAX_ONE_PROBE_COUNT = 2;

export type PollDecision =
  | { action: "stop" }
  | { action: "schedule"; delayMs: number };

/** Count of consecutive not_started probes seen so far, INCLUDING the one that
 *  just resolved. Reset to 0 by an explicit refresh or a visibility transition. */
export function decideNextPoll(
  phase: RecordingPhase | "error",
  notStartedProbes: number,
): PollDecision {
  if (phase === "error") return { action: "schedule", delayMs: ERROR_BACKOFF_MS };
  if ((TERMINAL_PHASES as readonly string[]).includes(phase)) return { action: "stop" };
  if ((ONE_PROBE_PHASES as readonly string[]).includes(phase)) {
    return notStartedProbes >= MAX_ONE_PROBE_COUNT
      ? { action: "stop" }
      : { action: "schedule", delayMs: ACTIVE_POLL_MS };
  }
  return { action: "schedule", delayMs: ACTIVE_POLL_MS };
}
