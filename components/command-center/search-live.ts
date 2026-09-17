"use client";
// Live-mode search results for the command dialog — the hook half of the seam. The network half
// lives in lib/search/live-search.ts. This file only wires that pure function to React state: it
// debounces keystrokes, cancels a query that is no longer the latest one before its response can
// overwrite a newer one, and clears itself the instant `enabled` goes false (dialog closed, query
// cleared below the minimum length, or demo mode).
//
// Not in the pinned zero-network file list (lib/search/provider.test.ts #108) — command-dialog.tsx
// is, and stays that way, because this file is the only thing that imports fetchLiveSearch.
import { useEffect, useRef, useState } from "react";
import { fetchLiveSearch, LIVE_SEARCH_DEBOUNCE_MS, type LiveSearchState } from "../../lib/search/live-search";
import type { SearchScope } from "../../lib/search/model";

const IDLE: LiveSearchState = { status: "idle" };

export function useLiveSearch(enabled: boolean, text: string, scope: SearchScope): LiveSearchState {
  const [state, setState] = useState<LiveSearchState>(IDLE);
  // A generation counter, not a clock: each effect run claims the next number, and a response
  // only applies if its number is still current when it resolves. The same shape as the demo
  // dialog's own `openedAt` counter (recent-items.ts) — this codebase's existing idiom for
  // "which of these happened last" without touching Date.now().
  const generation = useRef(0);

  useEffect(() => {
    const mine = ++generation.current;
    if (!enabled) {
      setState(IDLE);
      return;
    }
    // Feedback starts now, the network call waits for the debounce below — so a query that is
    // already long enough to search shows "loading" immediately rather than staying on stale
    // results from the previous keystroke for 200ms.
    setState({ status: "loading" });
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchLiveSearch(text, scope, controller.signal).then((next) => {
        if (next === null || mine !== generation.current) return;
        setState(next);
      });
    }, LIVE_SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, text, scope]);

  return state;
}
