// The one seam allowed to call the network for Search. Kept out of command-dialog.tsx (and out
// of the pinned zero-network file list in lib/search/provider.test.ts #108) so the dialog itself
// stays free of fetch/supabase/createClient/XMLHttpRequest — this file owns the fetch, the
// dialog (via components/command-center/search-live.ts) owns turning its result into UI state.
//
// Pure and framework-free on purpose: the codebase's convention for this directory is
// source-surface tests on `.tsx` (see command-dialog.test.ts), not rendering. Putting the actual
// network/parsing logic in a plain async function here means the part worth a real behavioral
// test — abort handling, error mapping, the too-short-query short-circuit — gets one, without a
// DOM or a testing-library dependency this repo does not have.
import { MIN_QUERY_LENGTH, type CommandCenterSearchResult, type SearchScope } from "./model";

export type LiveSearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "results"; results: readonly CommandCenterSearchResult[] }
  | { status: "empty" }
  | { status: "error" };

// 200ms: long enough that "typing normally" fires one request, not one per keystroke; short
// enough that it does not read as sluggish. No library — a setTimeout the caller clears on the
// next keystroke is the whole mechanism.
export const LIVE_SEARCH_DEBOUNCE_MS = 200;

const LIVE_SEARCH_LIMIT = 20;

export function liveSearchUrl(text: string, scope: SearchScope): string {
  const params = new URLSearchParams({ q: text, scope, limit: String(LIVE_SEARCH_LIMIT) });
  return `/api/dashboard/search?${params.toString()}`;
}

/**
 * Runs one query against GET /api/dashboard/search. Returns `null` when the request was
 * aborted — the caller's signal that this response is stale and must not overwrite anything
 * newer. Never throws: a network failure, a non-2xx response, and an aborted fetch all resolve
 * (or resolve to null) rather than reject, so a caller can never forget to catch.
 *
 * Never falls back to demo data on any failure — an error is the `error` state, not a switch
 * back to fixtures.
 */
export async function fetchLiveSearch(
  text: string,
  scope: SearchScope,
  signal: AbortSignal,
): Promise<LiveSearchState | null> {
  const trimmed = text.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return { status: "idle" };
  try {
    const res = await fetch(liveSearchUrl(trimmed, scope), { signal, headers: { accept: "application/json" } });
    if (signal.aborted) return null;
    const body = await res.json().catch(() => null);
    if (signal.aborted) return null;
    if (!res.ok || body?.ok !== true || !Array.isArray(body.results)) return { status: "error" };
    const results = body.results as CommandCenterSearchResult[];
    return results.length === 0 ? { status: "empty" } : { status: "results", results };
  } catch {
    if (signal.aborted) return null;
    return { status: "error" };
  }
}
