"use client";
// The parts of the Pipeline screen the canonical design puts in the SHELL HEADER rather
// than in the route body: the subtitle (C-D06 213), the stage pager chip (C-D06 213
// "STAGES 2–5 OF 11 ‹ ›") and the mobile record count (MO-03 1090).
//
// The chip and the board read the same useStageWindow store, so the label can never
// describe a different slice from the one the columns show.
import { useDemoState } from "../../../lib/demo/store";
import { useStageWindow } from "./stage-window";

export function PipelineSubtitle() {
  const state = useDemoState();
  return (
    <>
      {state.opportunities.length} active leads
      <span className="hidden xl:inline">
        {" "}
        · drag, or press Space to pick up and ⌥ + arrows to move · gated stages ask for a reason
      </span>
    </>
  );
}

export function PipelineHeaderChip() {
  const { start, columns, total, canPrev, canNext, step, breakpoint } = useStageWindow();
  const first = start + 1;
  const last = Math.min(start + columns, total);
  // MO-03 1090 replaces the range chip with the record count, so the chip is desktop and
  // tablet only — the mobile stepper inside the board is the mobile control.
  if (breakpoint === "mobile") return null;
  return (
    <span className="flex items-center gap-1.5 font-cc-mono text-[10.5px] text-cc-t3">
      <span>
        STAGES {first}–{last} OF {total}
      </span>
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={!canPrev}
        aria-label="Show earlier stages"
        className="rounded-[4px] px-1 py-px text-cc-t2 hover:bg-cc-secondary disabled:opacity-40"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={!canNext}
        aria-label="Show later stages"
        className="rounded-[4px] px-1 py-px text-cc-t2 hover:bg-cc-secondary disabled:opacity-40"
      >
        <span aria-hidden="true">›</span>
      </button>
    </span>
  );
}

export function PipelineMobileCount() {
  const state = useDemoState();
  return <span className="font-cc-mono text-[10px] text-cc-t3">{state.opportunities.length}</span>;
}
