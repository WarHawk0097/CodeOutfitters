// Saved Views kept in this browser.
//
// In demo mode this is the whole of Saved View storage, and the UI says so in as many words:
// "Saved in this browser." Not synced, not shared, not an account feature. A person who saves a
// view on their laptop will not find it on their phone, and the copy must never imply
// otherwise — see SAVED_VIEWS_LOCAL_NOTICE.
//
// The functions here are pure: they take a state and return a new one, and the caller owns
// localStorage. That is what makes the merge rules, the default-view rules and the collision
// rules testable without a DOM, and it is why nothing in this file reads a clock or a global.
//
// Everything read back is untrusted. localStorage is writable by anything on this origin, so a
// stored view is re-validated field by field — scope, filter keys, filter values, sort — before
// it can be applied to a list. A corrupt or hand-edited key yields the shipped defaults, never
// a crash and never an unchecked filter. The dangerous shape this is guarding against is not a
// broken view; it is a plausible-looking one carrying a filter key the route will forward
// somewhere it should not.
import {
  DEFAULT_SAVED_VIEWS,
  defaultViewsForScope,
} from "./defaults";
import {
  isSavedViewScope,
  sanitizeFilters,
  sanitizeSort,
  savedViewId,
  SAVED_VIEW_NAME_MAX,
  SAVED_VIEW_SCOPES,
  SCOPE_DESCRIPTORS,
  type SavedView,
  type SavedViewScope,
} from "./model";

export const SAVED_VIEWS_STORAGE_KEY = "codeoutfitters.command-center.saved-views";

/** Shown wherever a view can be created or managed. Load-bearing wording: it must not suggest
 *  an account, a sync, or visibility to a colleague. */
export const SAVED_VIEWS_LOCAL_NOTICE = "Saved in this browser";

/** Enough to be useful, few enough that the selector stays a menu rather than a search
 *  problem. Per scope, not overall, so a heavy Leads user does not crowd out Meetings. */
export const SAVED_VIEWS_PER_SCOPE_MAX = 20;

/** Bumped when the stored shape changes incompatibly. A payload from another version is
 *  discarded rather than migrated — these are twenty seconds of filter state, and a migration
 *  path is more code than the data is worth. */
export const SAVED_VIEWS_STORAGE_VERSION = 1;

export type SavedViewsState = {
  /** Personal views only. Shipped defaults are code and are merged in on read. */
  views: readonly SavedView[];
  /** The view each list opens with in this browser, by scope. A scope with no entry opens
   *  unfiltered. */
  defaults: Readonly<Partial<Record<SavedViewScope, string>>>;
};

export const EMPTY_SAVED_VIEWS_STATE: SavedViewsState = { views: [], defaults: {} };

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** Re-validate one stored record. Returns null for anything that cannot be trusted whole —
 *  partial recovery is deliberately not attempted, because a view with half its filters applied
 *  is a view that shows the wrong rows without looking wrong. */
function readView(raw: unknown, userId: string): SavedView | null {
  if (typeof raw !== "object" || raw === null) return null;
  const candidate = raw as Record<string, unknown>;

  const scope = candidate.scope;
  if (!isSavedViewScope(scope)) return null;

  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (name === "" || name.length > SAVED_VIEW_NAME_MAX) return null;

  // The id is recomputed rather than read. A stored id is just a string somebody could have
  // set to anything, including the id of a shipped default — which would let a hand-written
  // entry shadow "Overdue" with different filters. Deriving it from (scope, name) makes that
  // impossible: the id always describes the view it is on.
  return {
    id: savedViewId(scope, name),
    scope,
    name,
    filters: sanitizeFilters(scope, candidate.filters),
    sort: sanitizeSort(scope, candidate.sort),
    // No scope declares any columns yet (see ScopeDescriptor.columns), so anything stored here
    // is discarded rather than carried forward as unusable state.
    columns: [],
    ownership: { kind: "personal", userId },
  };
}

/**
 * Parse the stored payload.
 *
 * `userId` is who the reader is, and every recovered view is attributed to them — not to
 * whatever the payload claimed. Storage in this browser belongs to whoever is using this
 * browser; a stored `ownerUserId` would be a value the owner could edit, and honouring it
 * would let a hand-written entry claim to belong to somebody else. Ownership that matters is
 * decided server-side (see lib/views/provider.ts); this is device state.
 */
export function parseSavedViews(raw: string | null, userId: string): SavedViewsState {
  if (raw === null || raw === "") return EMPTY_SAVED_VIEWS_STATE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_SAVED_VIEWS_STATE;
  }
  if (typeof parsed !== "object" || parsed === null) return EMPTY_SAVED_VIEWS_STATE;
  const payload = parsed as Record<string, unknown>;
  if (payload.version !== SAVED_VIEWS_STORAGE_VERSION) return EMPTY_SAVED_VIEWS_STATE;

  const views: SavedView[] = [];
  const seen = new Set<string>();
  const perScope = new Map<SavedViewScope, number>();
  if (Array.isArray(payload.views)) {
    for (const entry of payload.views) {
      const view = readView(entry, userId);
      if (view === null) continue;
      if (seen.has(view.id)) continue;
      // A shipped default's id cannot be taken over by a stored entry.
      if (DEFAULT_SAVED_VIEWS.some((shipped) => shipped.id === view.id)) continue;
      const count = perScope.get(view.scope) ?? 0;
      if (count >= SAVED_VIEWS_PER_SCOPE_MAX) continue;
      perScope.set(view.scope, count + 1);
      seen.add(view.id);
      views.push(view);
    }
  }

  const defaults: Partial<Record<SavedViewScope, string>> = {};
  if (typeof payload.defaults === "object" && payload.defaults !== null) {
    const stored = payload.defaults as Record<string, unknown>;
    for (const scope of SAVED_VIEW_SCOPES) {
      const id = stored[scope];
      if (typeof id !== "string") continue;
      // A default must point at a view that exists right now — a shipped one or a personal one
      // recovered above. A dangling default would silently open an unfiltered list while the
      // selector claimed a view was active.
      const exists =
        views.some((view) => view.id === id) ||
        DEFAULT_SAVED_VIEWS.some((view) => view.id === id && view.scope === scope);
      if (exists) defaults[scope] = id;
    }
  }

  return { views, defaults };
}

export function serializeSavedViews(state: SavedViewsState): string {
  return JSON.stringify({
    version: SAVED_VIEWS_STORAGE_VERSION,
    views: state.views.map((view) => ({
      scope: view.scope,
      name: view.name,
      filters: view.filters,
      sort: view.sort,
    })),
    defaults: state.defaults,
  });
}

// ---------------------------------------------------------------------------
// Composing
// ---------------------------------------------------------------------------

/** Everything selectable for one list: the shipped views first, in catalogue order, then this
 *  browser's own in the order they were saved. Shipped first because they are the ones a new
 *  workspace has, and a menu whose top item moves as you save things is disorienting. */
export function viewsForScope(state: SavedViewsState, scope: SavedViewScope): SavedView[] {
  return [...defaultViewsForScope(scope), ...state.views.filter((view) => view.scope === scope)];
}

export function findView(state: SavedViewsState, id: string): SavedView | null {
  return (
    DEFAULT_SAVED_VIEWS.find((view) => view.id === id) ??
    state.views.find((view) => view.id === id) ??
    null
  );
}

/** The view a list should open with in this browser, or null for unfiltered. */
export function defaultViewFor(state: SavedViewsState, scope: SavedViewScope): SavedView | null {
  const id = state.defaults[scope];
  if (id === undefined) return null;
  const view = findView(state, id);
  return view !== null && view.scope === scope ? view : null;
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export type SavedViewsWrite =
  | { ok: true; state: SavedViewsState; view: SavedView }
  | { ok: false; problem: string };

/**
 * Add a personal view, or replace one that already exists under the same name.
 *
 * The replace case is the "Update view" control and only that. It is never reached by saving —
 * the UI's Save path checks {@link nameTaken} first and offers a rename — because a save that
 * silently overwrote a view of the same name would destroy work with no undo and no prompt.
 */
export function saveView(
  state: SavedViewsState,
  view: SavedView,
  options: { replace?: boolean } = {},
): SavedViewsWrite {
  if (view.ownership.kind === "builtIn") {
    return { ok: false, problem: "The views the product ships with cannot be changed." };
  }
  if (DEFAULT_SAVED_VIEWS.some((shipped) => shipped.id === view.id)) {
    return {
      ok: false,
      problem: `"${view.name}" is the name of a view ${SCOPE_DESCRIPTORS[view.scope].label} already has.`,
    };
  }
  const existing = state.views.findIndex((candidate) => candidate.id === view.id);
  if (existing >= 0 && options.replace !== true) {
    return { ok: false, problem: `A view named "${view.name}" already exists.` };
  }
  if (existing < 0) {
    const count = state.views.filter((candidate) => candidate.scope === view.scope).length;
    if (count >= SAVED_VIEWS_PER_SCOPE_MAX) {
      return {
        ok: false,
        problem: `${SCOPE_DESCRIPTORS[view.scope].label} already has ${SAVED_VIEWS_PER_SCOPE_MAX} saved views in this browser. Delete one to save another.`,
      };
    }
  }
  const views =
    existing >= 0
      ? state.views.map((candidate, index) => (index === existing ? view : candidate))
      : [...state.views, view];
  return { ok: true, state: { ...state, views }, view };
}

export function nameTaken(state: SavedViewsState, scope: SavedViewScope, name: string): boolean {
  const id = savedViewId(scope, name);
  return (
    DEFAULT_SAVED_VIEWS.some((view) => view.id === id) ||
    state.views.some((view) => view.id === id)
  );
}

/** Delete a personal view. Deleting also clears any default that pointed at it, so a list
 *  cannot be left opening a view that is gone. */
export function deleteView(state: SavedViewsState, id: string): SavedViewsState {
  const views = state.views.filter((view) => view.id !== id);
  if (views.length === state.views.length) return state;
  const defaults: Partial<Record<SavedViewScope, string>> = {};
  for (const scope of SAVED_VIEW_SCOPES) {
    const current = state.defaults[scope];
    if (current !== undefined && current !== id) defaults[scope] = current;
  }
  return { views, defaults };
}

/** Rename in place. The id is derived from the name, so a rename mints a new id — and any
 *  default pointing at the old one is moved with it rather than dangling. */
export function renameView(state: SavedViewsState, id: string, name: string): SavedViewsWrite {
  const existing = state.views.find((view) => view.id === id);
  if (existing === undefined) {
    return { ok: false, problem: "That view is not one this browser saved." };
  }
  const trimmed = name.trim();
  if (trimmed === "") return { ok: false, problem: "A view needs a name." };
  if (trimmed.length > SAVED_VIEW_NAME_MAX) {
    return { ok: false, problem: `A view name can be at most ${SAVED_VIEW_NAME_MAX} characters.` };
  }
  const renamed: SavedView = { ...existing, id: savedViewId(existing.scope, trimmed), name: trimmed };
  if (renamed.id !== id && nameTaken(state, existing.scope, trimmed)) {
    return { ok: false, problem: `A view named "${trimmed}" already exists.` };
  }
  const views = state.views.map((view) => (view.id === id ? renamed : view));
  const defaults: Partial<Record<SavedViewScope, string>> = { ...state.defaults };
  if (defaults[existing.scope] === id) defaults[existing.scope] = renamed.id;
  return { ok: true, state: { views, defaults }, view: renamed };
}

/** Set — or, with `null`, clear — the view a list opens with in this browser. */
export function setBrowserDefault(
  state: SavedViewsState,
  scope: SavedViewScope,
  id: string | null,
): SavedViewsState {
  const defaults: Partial<Record<SavedViewScope, string>> = { ...state.defaults };
  if (id === null) {
    delete defaults[scope];
    return { ...state, defaults };
  }
  const view = findView(state, id);
  if (view === null || view.scope !== scope) return state;
  defaults[scope] = id;
  return { ...state, defaults };
}
