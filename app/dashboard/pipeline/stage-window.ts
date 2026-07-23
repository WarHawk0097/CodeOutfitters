"use client";
// Which slice of the eleven canonical stages the board is showing.
//
// The canonical control lives in the SHELL HEADER ("STAGES 2–5 OF 11 ‹ ›", CANON 213) while
// the columns it pages live in the route below it, so the state has to be readable from
// both. A three-function external store is used rather than a context provider because
// adding a provider to the shell layout for one route would make every other route pay for
// it, and because the header and the board must derive the window with the SAME code — the
// label and the columns disagreeing would be exactly the kind of contradiction the brief
// forbids.
import { useCallback, useSyncExternalStore } from "react";
import { useBreakpoint, type Breakpoint } from "../../../components/demo/use-breakpoint";
import { PIPELINE_STAGES } from "../../../lib/demo/seed";
import type { PipelineStage } from "../../../lib/demo/types";

/** Columns each form shows: C-D06 213 four, T-03 915 two, MO-03 1089 one. */
export const STAGE_COLUMNS: Record<Breakpoint, number> = { desktop: 4, tablet: 2, mobile: 1 };

/** Where each canonical frame starts. Desktop opens on "STAGES 2–5" (index 1), tablet on
 *  "STAGES 3–4" and mobile on "Stage 3 of 11" (both index 2).
 *
 *  DOCUMENTED CANONICAL DEVIATION: C-D06 213 labels its window "STAGES 2–5" but draws its
 *  fourth column as "Proposal Sent" — stage 7, not stage 5. The two cannot both hold. The
 *  window here is contiguous and the label follows it, because the pager is a live control:
 *  a chip reading "2–5" over a non-contiguous set makes every subsequent page nonsense. */
export const STAGE_DEFAULT_START: Record<Breakpoint, number> = { desktop: 1, tablet: 2, mobile: 2 };

// null means "nobody has paged yet", which is what lets each form open on its own canonical
// stage instead of inheriting another form's position.
let start: number | null = null;
const listeners = new Set<() => void>();

function getStart(): number | null {
  return start;
}

function getServerStart(): number | null {
  return null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test-only: the store outlives a component, so a test that pages the board would leak
 *  that position into the next test. */
export function __resetStageWindow(): void {
  start = null;
  for (const listener of listeners) listener();
}

export function clampStart(value: number, columns: number): number {
  return Math.min(Math.max(0, value), Math.max(0, PIPELINE_STAGES.length - columns));
}

export type StageWindow = {
  breakpoint: Breakpoint;
  columns: number;
  start: number;
  total: number;
  /** Human 1-based label, e.g. "STAGES 2–5 OF 11" or "Stage 3 of 11". */
  stages: readonly PipelineStage[];
  canPrev: boolean;
  canNext: boolean;
  setStart: (value: number) => void;
  step: (delta: number) => void;
};

export function useStageWindow(): StageWindow {
  const breakpoint = useBreakpoint();
  const stored = useSyncExternalStore(subscribe, getStart, getServerStart);
  const columns = STAGE_COLUMNS[breakpoint];
  const resolved = clampStart(stored ?? STAGE_DEFAULT_START[breakpoint], columns);

  const setStart = useCallback(
    (value: number) => {
      start = clampStart(value, columns);
      for (const listener of listeners) listener();
    },
    [columns],
  );

  const step = useCallback((delta: number) => setStart(resolved + delta), [resolved, setStart]);

  return {
    breakpoint,
    columns,
    start: resolved,
    total: PIPELINE_STAGES.length,
    stages: PIPELINE_STAGES.slice(resolved, resolved + columns),
    canPrev: resolved > 0,
    canNext: resolved + columns < PIPELINE_STAGES.length,
    setStart,
    step,
  };
}
