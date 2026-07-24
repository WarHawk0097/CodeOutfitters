"use client";
// The three states every demo route has to show — loading, error with a working Retry, and
// ready — over a store that answers synchronously.
//
// Neither state is decorative. `loading` is the server render, which is the only moment a
// synchronous store genuinely has no client data; claiming a spinner after that would be a
// fake delay. `error` is armed by `?mock-scenario=demo-error`, mock mode only, exactly like
// the Leads route's scenario switch: deterministic, reproducible on every fresh load, cleared
// by the first Retry so nothing can stay wedged.
import { useCallback, useState, useSyncExternalStore } from "react";
import { useDemoState } from "../../lib/demo/store";
import type { DemoState } from "../../lib/demo/types";

export const DEMO_ERROR_SCENARIO = "demo-error";

export const DEMO_ERROR_MESSAGE =
  `Deliberate demo failure (mock-scenario=${DEMO_ERROR_SCENARIO}). Not a real service error.`;

function scenarioRequested(): string | null {
  return new URLSearchParams(window.location.search).get("mock-scenario");
}

// Neither store can change without a reload, so there is nothing to notify.
const neverChanges = () => () => {};
const isMounted = () => true;
const notMounted = () => false;

export type DemoQueryStatus = "loading" | "error" | "ready";

export type DemoQuery = {
  state: DemoState;
  status: DemoQueryStatus;
  error: string | null;
  retry: () => void;
};

export function useDemoQuery(): DemoQuery {
  const state = useDemoState();
  // useSyncExternalStore rather than an effect: React renders the server snapshot during
  // hydration and swaps to the client one afterwards, so there is no mismatch and no
  // setState-in-effect cascade.
  const mounted = useSyncExternalStore(neverChanges, isMounted, notMounted);
  const scenario = useSyncExternalStore(neverChanges, scenarioRequested, () => null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const status: DemoQueryStatus = !mounted
    ? "loading"
    : attempt === 0 && scenario === DEMO_ERROR_SCENARIO
      ? "error"
      : "ready";

  return { state, status, error: status === "error" ? DEMO_ERROR_MESSAGE : null, retry };
}
