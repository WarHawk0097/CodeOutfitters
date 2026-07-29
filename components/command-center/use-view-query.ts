"use client";
// Reading a list's filter state out of the URL, and putting it back.
//
// This is what makes three separate things work, and they are worth naming because each one is
// a promise made elsewhere in the product that would otherwise be a lie:
//
//   * A search result that opens a list already narrowed — `/dashboard/pipeline?q=Harbor
//     Logistics`. Without this the link opens the board unfiltered, which is a dead link
//     wearing a working link's clothes.
//   * A Saved View, which is a filter state given a name. Applying one is writing it here.
//   * A shareable link: the URL a colleague is sent reproduces the list, because the list reads
//     the URL rather than only writing to it.
//
// `useSearchParams` is deliberately not used. It opts the whole page into client-side
// rendering unless it is wrapped in a `<Suspense>` boundary, and only My Work has one today —
// so reaching for it would mean adding a boundary to six routes to get a value that is already
// available synchronously. This uses `window.location.search` through `useSyncExternalStore`,
// which is the pattern the Leads route and `useDemoQuery` already established: the server
// snapshot is the empty string, the client snapshot is the real query, and React swaps between
// them at hydration without a mismatch.
//
// The URL is the state, not a copy of it. Lists do not keep their filters in `useState` and
// mirror them into the address bar, because two copies of one value is two chances to disagree:
// applying a Saved View would have to remember to write both, and a shared link would reproduce
// whichever copy the route happened to read. So `publish` writes the URL and tells the store,
// and every list reading it re-renders from the one value.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  defaultFilters,
  parseFilters,
  parseSort,
  serializeFilters,
  SAVED_VIEW_SCOPES,
  SCOPE_DESCRIPTORS,
  type SavedViewFilterState,
  type SavedViewScope,
  type SavedViewSortState,
} from "../../lib/views/model";

// `replaceState` fires no event of its own, so the writer announces its own writes. `popstate`
// covers the Back button, which is the only other way the query can change under a mounted list.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function announce(): void {
  for (const listener of [...listeners]) listener();
}

const currentSearch = () => window.location.search;
const noSearch = () => "";

/** The raw query string for this load. `""` during the server render and during hydration. */
export function useSearchString(): string {
  return useSyncExternalStore(subscribe, currentSearch, noSearch);
}

/** One query parameter, or null. For the flags that are not filters — `?new=1`, `mock-scenario`. */
export function useQueryParam(name: string): string | null {
  const search = useSearchString();
  return useMemo(() => new URLSearchParams(search).get(name), [search, name]);
}

/** Write one query parameter, for the lists that carry a search term but have no Saved View
 *  scope of their own. Same `replaceState` reasoning as `publish` below. */
export function setQueryParam(name: string, value: string): void {
  const params = new URLSearchParams(window.location.search);
  if (value === "") params.delete(name);
  else params.set(name, value);
  const query = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${query === "" ? "" : `?${query}`}`,
  );
  announce();
}

export type ViewQuery = {
  /** The filter state this page was opened with — the scope's defaults, overlaid with whatever
   *  the URL carried that the scope actually accepts. Never throws; see `sanitizeFilters`. */
  filters: SavedViewFilterState;
  sort: SavedViewSortState;
  /** Reflect the current state back into the address bar.
   *
   *  `replaceState`, not `pushState` and not a router navigation. Typing in a search box
   *  produces a state per keystroke, and pushing each one would make the browser's Back button
   *  walk backwards through a sentence one letter at a time. Replacing keeps the URL
   *  shareable — which is the whole point — while leaving Back meaning "the page before this
   *  one". */
  publish: (filters: SavedViewFilterState, sort?: SavedViewSortState) => void;
};

export function useViewQuery(scope: SavedViewScope): ViewQuery {
  const search = useSearchString();

  const filters = useMemo(() => {
    if (search === "") return defaultFilters(scope);
    return parseFilters(scope, new URLSearchParams(search));
  }, [scope, search]);

  const sort = useMemo(() => {
    if (search === "") return null;
    return parseSort(scope, new URLSearchParams(search));
  }, [scope, search]);

  const publish = useCallback(
    (next: SavedViewFilterState, nextSort: SavedViewSortState = null) => {
      if (typeof window === "undefined") return;
      const query = serializeFilters(scope, next, nextSort);
      // Parameters this module does not own — `mock-scenario`, `visual-state`, `new` — are
      // carried through untouched. Dropping them would break the deterministic QA scenarios,
      // which are set by URL and expected to survive a filter change.
      const preserved = new URLSearchParams(window.location.search);
      const owned = new URLSearchParams(query);
      const merged = new URLSearchParams();
      for (const [key, value] of preserved) {
        if (!isOwnedKey(scope, key)) merged.set(key, value);
      }
      for (const [key, value] of owned) merged.set(key, value);
      const serialized = merged.toString();
      const url = `${window.location.pathname}${serialized === "" ? "" : `?${serialized}`}`;
      window.history.replaceState(window.history.state, "", url);
      announce();
    },
    [scope],
  );

  return { filters, sort, publish };
}

export type ListView = ViewQuery & {
  /** Change one filter, keep the rest. `null` clears — the scope's own default is what a
   *  cleared filter means, and `serializeFilters` drops defaults from the URL, so clearing a
   *  filter shortens the link rather than leaving `owner=` in it. */
  set: (key: string, value: string | null) => void;
};

/** What a list route uses: the filter state, and one setter per control. */
export function useListView(scope: SavedViewScope): ListView {
  const { filters, sort, publish } = useViewQuery(scope);
  const set = useCallback(
    (key: string, value: string | null) => publish({ ...filters, [key]: value ?? "" }, sort),
    [filters, sort, publish],
  );
  return { filters, sort, publish, set };
}

function isOwnedKey(scope: SavedViewScope, key: string): boolean {
  if (key === "sort") return true;
  return Object.prototype.hasOwnProperty.call(SCOPE_FIELD_NAMES[scope], key);
}

// Built once at module load rather than per call: `publish` runs on every keystroke in a
// search box. `Object.create(null)` so a query parameter literally named `constructor` is
// answered by the table rather than by Object.prototype.
const SCOPE_FIELD_NAMES: Record<SavedViewScope, Record<string, true>> = (() => {
  const result = {} as Record<SavedViewScope, Record<string, true>>;
  for (const scope of SAVED_VIEW_SCOPES) {
    const names: Record<string, true> = Object.create(null);
    for (const key of Object.keys(SCOPE_DESCRIPTORS[scope].fields)) names[key] = true;
    result[scope] = names;
  }
  return result;
})();
