// Polling policy — the timing honesty tests. The pre-fix hook polled not_started
// forever (its terminal branch was unreachable); these tests pin the bounded behavior
// before the hook is rewired to the policy.
import { describe, expect, it } from "vitest";
import {
  ACTIVE_POLL_MS,
  ERROR_BACKOFF_MS,
  MAX_ONE_PROBE_COUNT,
  decideNextPoll,
} from "./poll-policy";

describe("decideNextPoll — not_started is bounded, never perpetual", () => {
  it("schedules exactly one follow-up after the initial probe, then stops", () => {
    // Probe 1 (the initial request came back not_started): one bounded follow-up.
    expect(decideNextPoll("not_started", 1)).toEqual({ action: "schedule", delayMs: ACTIVE_POLL_MS });
    // Probe 2 (the follow-up also came back not_started): STOP.
    expect(decideNextPoll("not_started", MAX_ONE_PROBE_COUNT)).toEqual({ action: "stop" });
    // Even an inflated counter must never re-arm idle polling.
    expect(decideNextPoll("not_started", 99)).toEqual({ action: "stop" });
  });

  it("an explicit refresh or visibility transition resets the probe budget (explicit probe, not idle polling)", () => {
    // The hook resets the counter to 0 before an explicit probe; one probe from a
    // reset state is again bounded to a single follow-up.
    expect(decideNextPoll("not_started", 0)).toEqual({ action: "schedule", delayMs: ACTIVE_POLL_MS });
  });
});

describe("decideNextPoll — terminal phases stop polling entirely", () => {
  it("stops on completed and failed", () => {
    expect(decideNextPoll("completed", 0)).toEqual({ action: "stop" });
    expect(decideNextPoll("failed", 0)).toEqual({ action: "stop" });
  });
});

describe("decideNextPoll — live phases keep the steady cadence", () => {
  it("schedules ACTIVE_POLL_MS for preparing/recording/paused/processing", () => {
    for (const phase of ["preparing", "recording", "paused", "processing"] as const) {
      expect(decideNextPoll(phase, 0)).toEqual({ action: "schedule", delayMs: ACTIVE_POLL_MS });
      expect(decideNextPoll(phase, 5)).toEqual({ action: "schedule", delayMs: ACTIVE_POLL_MS });
    }
  });
});

describe("decideNextPoll — errors back off instead of spinning", () => {
  it("retries with the doubled backoff delay", () => {
    expect(decideNextPoll("error", 0)).toEqual({ action: "schedule", delayMs: ERROR_BACKOFF_MS });
    expect(ERROR_BACKOFF_MS).toBe(ACTIVE_POLL_MS * 2);
  });
});
