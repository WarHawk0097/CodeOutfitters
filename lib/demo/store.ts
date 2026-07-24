// The versioned local demo store.
//
// Everything the dashboard writes lands here and nowhere else: no network call, no
// external database, no credential, no cross-user data, no third-party transmission.
// State lives in this browser tab's sessionStorage, so a reload keeps the session's work
// and a new tab starts from the deterministic seed again.
"use client";

import { useSyncExternalStore } from "react";
import { createSeedState, DEMO_NOW, DEMO_STATE_VERSION } from "./seed";
import type { ActivityEntry, DemoState } from "./types";

const STORAGE_KEY = "cc-demo-state";

/** The pristine seed. Also the server snapshot, so server and first client render agree
 *  and hydration is not a mismatch. */
const SEED_STATE: DemoState = createSeedState();

function readStored(): DemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    // A state written by an older shape is discarded, not migrated — a demo store has no
    // data worth migrating and a half-migrated shape is worse than a clean reseed.
    if (parsed?.version !== DEMO_STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(state: DemoState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked. The demo keeps working from memory; losing
    // persistence is not worth breaking the page over.
  }
}

let state: DemoState = readStored() ?? SEED_STATE;
const listeners = new Set<() => void>();

export function getDemoState(): DemoState {
  return state;
}

/** Server render always sees the seed, never a stored session. */
export function getSeedState(): DemoState {
  return SEED_STATE;
}

export function subscribeDemoState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Apply a mutation. The updater must return a new object — every reader compares by
 *  reference. */
export function updateDemoState(updater: (current: DemoState) => DemoState): void {
  const next = updater(state);
  if (next === state) return;
  state = next;
  writeStored(state);
  emit();
}

/** Safe reset: back to the deterministic seed, stored copy cleared. Nothing outside this
 *  browser is touched. */
export function resetDemoState(): void {
  state = createSeedState();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored for the same reason as writeStored.
    }
  }
  emit();
}

/** Test-only escape hatch: drop the stored session and the in-memory state together so
 *  each test starts from the same seed. */
export function __resetDemoStateForTests(): void {
  resetDemoState();
}

/** Mint an id without a clock or a random source, so a demo session replays identically. */
export function mintId(current: DemoState, prefix: string): { id: string; nextId: number } {
  return { id: `${prefix}-${String(current.nextId).padStart(4, "0")}`, nextId: current.nextId + 1 };
}

/** Append an activity entry. Newest first — every route that shows history reads the
 *  head of this list. */
export function withActivity(
  current: DemoState,
  entry: Omit<ActivityEntry, "id" | "at">,
): { activity: ActivityEntry[]; nextId: number } {
  const { id, nextId } = mintId(current, "act");
  return {
    activity: [{ id, at: DEMO_NOW, ...entry }, ...current.activity].slice(0, 200),
    nextId,
  };
}

/** Read the demo state. Deliberately returns the whole object rather than taking a
 *  selector: a selector that builds a new array on every call makes useSyncExternalStore
 *  loop forever. Derive with useMemo at the call site instead. */
export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribeDemoState, getDemoState, getSeedState);
}
