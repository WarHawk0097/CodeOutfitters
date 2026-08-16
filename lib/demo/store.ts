// The versioned local demo store.
//
// Everything the dashboard writes lands here and nowhere else: no network call, no
// external database, no credential, no cross-user data, no third-party transmission.
// State lives in this browser tab's sessionStorage, so a reload keeps the session's work
// and a new tab starts from the deterministic seed again.
"use client";

import { useSyncExternalStore } from "react";
import { useCommandCenterConfig } from "@/components/command-center/mode-provider";
import { createSeedState, DEMO_CURRENT_USER_ID, DEMO_NOW, DEMO_STATE_VERSION } from "./seed";
import { categoryOf, defaultImportance } from "@/lib/activity/model";
import type {
  ActivityEvent,
  ActivityEventType,
  ActivityMetadata,
  ActivityRef,
} from "@/lib/activity/model";
import type { DemoState } from "./types";

const STORAGE_KEY = "cc-demo-state";

/** The pristine seed. Also the server snapshot, so server and first client render agree
 *  and hydration is not a mismatch. Built once, on first access rather than at module
 *  load: this module is imported (via useDemoState/useDemoQuery) from client components
 *  that also mount in live mode, and createSeedState() must not run there — see
 *  useDemoState() below, which never reaches this in live mode, and getLeadDirectory()
 *  in ./seed for the same pattern one layer down. */
let _seedState: DemoState | null = null;
function getSeedStateLazy(): DemoState {
  if (_seedState === null) _seedState = createSeedState();
  return _seedState;
}

/** Static, always-empty state for live mode. A plain constant, never generated fixture
 *  data — live mode must not call createSeedState()/getLeadDirectory()/generateLeads(). */
const EMPTY_DEMO_STATE: DemoState = {
  version: DEMO_STATE_VERSION,
  team: [],
  opportunities: [],
  appointments: [],
  meetings: [],
  proposals: [],
  followUps: [],
  tasks: [],
  emails: [],
  settings: [],
  leadOverrides: {},
  activity: [],
  publications: [],
  accessLinks: [],
  clientResponses: [],
  nextId: 0,
};
function getEmptyDemoState(): DemoState {
  return EMPTY_DEMO_STATE;
}
function neverSubscribe(): () => void {
  return () => {};
}

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

let state: DemoState | null = null;
const listeners = new Set<() => void>();

export function getDemoState(): DemoState {
  if (state === null) state = readStored() ?? getSeedStateLazy();
  return state;
}

/** Server render always sees the seed, never a stored session. */
export function getSeedState(): DemoState {
  return getSeedStateLazy();
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
  const current = getDemoState();
  const next = updater(current);
  if (next === current) return;
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
/** What a caller of an activity-producing mutation is allowed to state.
 *
 *  Deliberately absent: category, importance, occurredAt, source and actor. A call site
 *  that could set those could file a routine edit as a critical event, or stamp it with
 *  someone else's name — so they are derived here from the event type and the fixed demo
 *  clock, exactly as the live provider derives them server-side (lib/activity/provider.ts). */
export type DemoActivityIntent = {
  type: ActivityEventType;
  summary: string;
  detail?: string;
  related: ActivityRef;
  parent?: ActivityRef | null;
  metadata?: ActivityMetadata;
};

export function withActivity(
  current: DemoState,
  intent: DemoActivityIntent,
): { activity: ActivityEvent[]; nextId: number } {
  const { id, nextId } = mintId(current, "act");
  const actor = current.team.find((member) => member.id === DEMO_CURRENT_USER_ID) ?? null;
  const event: ActivityEvent = {
    id,
    type: intent.type,
    category: categoryOf(intent.type),
    // A change made in this session came from a person clicking something, which is what
    // separates it from the seeded history the demo opens with.
    source: "user_action",
    visibility: "internal",
    importance: defaultImportance(intent.type),
    actorId: actor?.id ?? null,
    actorLabel: actor?.name ?? "You",
    occurredAt: DEMO_NOW,
    summary: intent.summary,
    detail: intent.detail ?? "",
    related: intent.related,
    parent: intent.parent ?? null,
    metadata: intent.metadata ?? [],
  };
  return { activity: [event, ...current.activity].slice(0, 200), nextId };
}

/** Append an activity entry attributed to a CLIENT rather than to a workspace member.
 *
 *  Separate from {@link withActivity} on purpose. A client is not a team member: they have no
 *  user id, they cannot be looked up in the directory, and attributing their action to
 *  whoever happened to be signed in would put a colleague's name on somebody else's decision.
 *  So `actorId` is null and the label is the recipient the link was issued to.
 *
 *  What a caller still cannot state: the instant, the category, the importance. The label is
 *  the one added degree of freedom, and every call site takes it from the stored link rather
 *  than from anything the public request sent — a browser that could name its own actor could
 *  file an acceptance under a name that never agreed to anything. */
export function withClientActivity(
  current: DemoState,
  intent: DemoActivityIntent & { actorLabel: string },
): { activity: ActivityEvent[]; nextId: number } {
  const { id, nextId } = mintId(current, "act");
  const event: ActivityEvent = {
    id,
    type: intent.type,
    category: categoryOf(intent.type),
    source: "user_action",
    // The client wrote it, so the client may be shown it. Nothing here is an internal note.
    visibility: "client_safe",
    importance: defaultImportance(intent.type),
    actorId: null,
    actorLabel: intent.actorLabel,
    occurredAt: DEMO_NOW,
    summary: intent.summary,
    detail: intent.detail ?? "",
    related: intent.related,
    parent: intent.parent ?? null,
    metadata: intent.metadata ?? [],
  };
  return { activity: [event, ...current.activity].slice(0, 200), nextId };
}

/** Read the demo state. Deliberately returns the whole object rather than taking a
 *  selector: a selector that builds a new array on every call makes useSyncExternalStore
 *  loop forever. Derive with useMemo at the call site instead. */
export function useDemoState(): DemoState {
  // Live mode must never touch the demo store: no createSeedState(), no fixtures. `live`
  // is resolved server-side and stable for a page's lifetime (see mode-provider.tsx), so
  // switching which getters are passed here does not violate the Rules of Hooks — this
  // call is always made, in the same order, on every render.
  const { live } = useCommandCenterConfig();
  return useSyncExternalStore(
    live ? neverSubscribe : subscribeDemoState,
    live ? getEmptyDemoState : getDemoState,
    live ? getEmptyDemoState : getSeedState,
  );
}
