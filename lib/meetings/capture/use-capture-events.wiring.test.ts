// useCaptureEvents — the hook's policy wiring, pinned at source level. The node
// environment here has no DOM/act(), so the hook's timing behavior itself is covered
// by poll-policy.test.ts (the pure decision module the hook must apply); this file
// pins that the hook actually uses that policy and the terminal-stop structure the
// panel depends on, so the two can silently diverge again.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const HOOK = "lib/meetings/capture/use-capture-events.ts";

function hookSrc(): string {
  return readFileSync(HOOK, "utf8");
}

describe("useCaptureEvents — polling policy wiring", () => {
  it("decides every next poll through the shared policy module (single home for timing rules)", () => {
    const src = hookSrc();
    expect(src).toContain('from "./poll-policy"');
    expect(src).toContain("decideNextPoll(");
    // The old inline constants must be gone — the policy module owns them now.
    expect(src).not.toContain('new Set(["completed", "failed", "not_started"])');
    expect(src).not.toContain('new Set(["not_started"])');
  });

  it("tracks not_started probes so the bounded budget is actually enforced", () => {
    const src = hookSrc();
    expect(src).toContain("notStartedProbes");
  });

  it("stops scheduling on terminal phases (no perpetual idle polling for any phase)", () => {
    const src = hookSrc();
    // Terminal and one-probe-exhausted decisions must route to a stop, not another
    // setTimeout: the only "schedule" branch left is the policy's decision itself.
    expect(src).toContain('decision.action === "stop"');
  });

  it("resets the probe budget for explicit refreshes and visibility re-probes", () => {
    const src = hookSrc();
    expect(src).toMatch(/refresh[\s\S]*notStartedProbes\.current\s*=\s*0/);
    expect(src).toMatch(/onVisible[\s\S]*notStartedProbes\.current\s*=\s*0/);
  });
});
