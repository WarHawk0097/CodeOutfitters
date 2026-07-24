"use client";
// The C-D05 header subtitle ("128 total · 12 new this week · 9 awaiting first contact",
// CANON 143) describes
// the leads response, but the header is rendered by the shell layout and the response is
// owned by the LeadsData island below it. Rather than fetch the list twice, the island
// publishes what it already has and the header reads it.
//
// Deliberately not a store: one value, one writer, one reader, cleared on unmount.
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LeadsListParams } from "@command-center/contracts";

export type HeaderStats = {
  /** Records matching the current filters — the same number the footer counts. */
  total: number;
  /**
   * Leads created inside the reference week. Server-derived aggregate over the whole
   * matched set; the window is the fixed instant documented in mocks/fixtures/generate-leads.ts,
   * never the real clock.
   */
  newThisWeek: number;
  /** Leads still at status "New", i.e. never contacted. Server-derived aggregate. */
  awaitingFirstContact: number;
};

type HeaderStatsValue = {
  stats: HeaderStats | null;
  setStats: (stats: HeaderStats | null) => void;
};

const HeaderStatsContext = createContext<HeaderStatsValue>({ stats: null, setStats: () => {} });

// The Export CSV control is a header control (C-D05 136) but the query it must export is
// owned by the same island that owns the stats. Rather than stand up a second provider
// around the identical subtree, the island publishes its current query here and the header
// reads it — the same one-writer/one-reader bridge, one context further.
//
// The value is the CURRENT filter/sort state, so an export always reflects what is on
// screen. `null` means no Leads island is mounted, which is how the header knows the
// control has nothing to act on.
// The contract's own params minus the pagination fields: the export pages the whole result
// set itself, so carrying a page number here would only invite exporting one page of it.
export type LeadsExportQuery = Omit<Partial<LeadsListParams>, "page" | "pageSize">;

type LeadsExportValue = {
  exportQuery: LeadsExportQuery | null;
  setExportQuery: (query: LeadsExportQuery | null) => void;
};

const LeadsExportContext = createContext<LeadsExportValue>({
  exportQuery: null,
  setExportQuery: () => {},
});

export function HeaderStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<HeaderStats | null>(null);
  const [exportQuery, setExportQuery] = useState<LeadsExportQuery | null>(null);
  const value = useMemo(() => ({ stats, setStats }), [stats]);
  const exportValue = useMemo(() => ({ exportQuery, setExportQuery }), [exportQuery]);
  return (
    <HeaderStatsContext.Provider value={value}>
      <LeadsExportContext.Provider value={exportValue}>{children}</LeadsExportContext.Provider>
    </HeaderStatsContext.Provider>
  );
}

export function useHeaderStats(): HeaderStatsValue {
  return useContext(HeaderStatsContext);
}

export function useLeadsExport(): LeadsExportValue {
  return useContext(LeadsExportContext);
}
