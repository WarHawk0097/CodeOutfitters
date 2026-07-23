"use client";
// Client data island: fetchLeads() only works client-side (see
// dashboard/overview-data.tsx for why). LeadsTable is itself already a
// client component (sort/selection state), so the fetch + table live
// together here rather than splitting a server shell around it.
//
// This component owns the leads QUERY. Every filter, search term, sort and page
// number is sent to the API and answered against the whole dataset, so a filter
// narrows 128 records rather than the ten currently on screen.
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { LeadsTable, type LeadsQuery } from "@command-center/ui";
import { fetchLeads } from "../../../lib/data/leads";
import { useHeaderStats, useLeadsExport } from "../header-stats";
import {
  LEADS_PAGE_SIZE,
  UNKNOWN_OWNER_LABEL,
  type Lead,
  type LeadsListResponse,
} from "@command-center/contracts";

const INITIAL_QUERY: LeadsQuery = {
  page: 1,
  pageSize: LEADS_PAGE_SIZE,
  q: "",
  status: null,
  service: null,
  owner: null,
};

// `?visual-state=canonical` stages the composite presentation the canonical Leads frames were
// authored in, so a captured frame and the canonical PNG show the same state. It is a
// MOCK/TEST-ONLY switch: outside mock mode the parameter is silently ignored — deliberately a
// plain boolean read and NOT assertMockDataAllowed(), which throws and would take the real Leads
// page down over a stray query string. It never enables mocks and never changes what is fetched.
function canonicalStateRequested(): boolean {
  if (process.env.NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE !== "mock") return false;
  return new URLSearchParams(window.location.search).get("visual-state") === "canonical";
}

// `?mock-scenario=initial-error` makes the FIRST leads request fail deterministically, so the
// error state and its Retry can be driven in a real browser without breaking a service. Read
// exactly like visual-state above: PRESENTATION_TEST_STATE, mock mode only, silently ignored
// everywhere else, and it never changes what the successful request returns.
//
// Only the first attempt carries it. Retry re-requests without it and succeeds, which is what
// makes the recovery deterministic and keeps the mock handler stateless — nothing to get stuck.
function mockScenarioRequested(): string | null {
  if (process.env.NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE !== "mock") return null;
  return new URLSearchParams(window.location.search).get("mock-scenario");
}

// The parameter cannot change without a reload, so the store has nothing to notify.
const neverChanges = () => () => {};

export function LeadsData() {
  const [query, setQuery] = useState<LeadsQuery>(INITIAL_QUERY);
  // useSyncExternalStore, not an effect: the server has no query string for this client route,
  // so the server snapshot is false and the client snapshot is read during hydration — no
  // mismatch, and no setState in an effect. The parameter never changes without a reload, so
  // the store never notifies.
  const canonicalState = useSyncExternalStore(neverChanges, canonicalStateRequested, () => false);
  const [data, setData] = useState<LeadsListResponse | null>(null);
  // MO-02 1084: the mobile control appends the next batch instead of replacing the page, so
  // the cards already on screen have to survive the next response. Accumulated here, where the
  // responses arrive — the table is handed one page at a time and could not rebuild the list.
  // Same query, same 128-record dataset, same server ordering; only the retention differs.
  const [mobileRows, setMobileRows] = useState<readonly Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Bumped by Retry. In the deps of the fetch effect, so a retry re-runs the same request
  // rather than needing a separate imperative fetch path.
  const [attempt, setAttempt] = useState(0);
  const { setStats } = useHeaderStats();
  const { setExportQuery } = useLeadsExport();
  const mockScenario = useSyncExternalStore(neverChanges, mockScenarioRequested, () => null);

  // Which request the mock failure scenario applies to. `initial-error` fails the first load;
  // `filter-error` fails the first request caused by a filter, sort, search or page change —
  // which is also what mobile load-more issues, so one scenario covers both. Either way the
  // arming ends at the first Retry, so nothing stays broken.
  const scenarioArmed =
    attempt === 0 &&
    (mockScenario === "initial-error"
      ? query === INITIAL_QUERY
      : mockScenario === "filter-error"
        ? query !== INITIAL_QUERY
        : false);

  // Any change other than the page itself returns to page 1 — a filter that kept
  // page 7 would land on an empty page whenever the narrowed set is shorter.
  // Applied here, once, so no individual control can forget to do it.
  const onQueryChange = useCallback((patch: Partial<LeadsQuery>) => {
    setQuery((prev) => {
      const changesResultSet = Object.keys(patch).some((k) => k !== "page");
      return { ...prev, ...patch, page: changesResultSet ? (patch.page ?? 1) : (patch.page ?? prev.page) };
    });
  }, []);

  useEffect(() => {
    // `active` guards against an out-of-order response: a slow page-1 request
    // must not overwrite the page-2 rows that arrived first. The in-flight
    // request is left to finish rather than aborted — it is a ten-row list.
    let active = true;
    fetchLeads(
      {
        page: query.page,
        pageSize: query.pageSize,
        q: query.q || undefined,
        status: query.status ?? undefined,
        service: query.service ?? undefined,
        owner: query.owner ?? undefined,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      },
      { mockScenario: scenarioArmed && mockScenario ? mockScenario : undefined },
    )
      .then((res) => {
        if (!active) return;
        setData(res);
        // A page-1 response restarts the list, which is also what every filter, search and
        // sort change produces (onQueryChange resets page). Later pages append, filtered by
        // id so a re-fetch of a page already held cannot duplicate a card. Arrival order is
        // the server's order, so the deterministic sequence is preserved.
        setMobileRows((prev) => {
          if (res.page === 1) return res.rows;
          const seen = new Set(prev.map((row) => row.id));
          return [...prev, ...res.rows.filter((row) => !seen.has(row.id))];
        });
        // Published for the shell header (CANON 143). All three figures come from this
        // response and are computed by the API over the whole matched set: the total it
        // answered, the count created inside the fixed reference week, and the count still
        // awaiting first contact. None is computed here — the client holds one page and
        // could not derive an aggregate over 128 records from it.
        setStats({
          total: res.total,
          newThisWeek: res.newThisWeekCount,
          awaitingFirstContact: res.awaitingFirstContactCount,
        });
        // Cleared here rather than at the top of the effect: a synchronous
        // setState in an effect body triggers cascading renders
        // (react-hooks/set-state-in-effect). A stale error therefore stays on
        // screen until the retry actually succeeds, which is the honest state.
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load leads");
      });
    return () => {
      active = false;
    };
  }, [query, setStats, scenarioArmed, mockScenario, attempt]);

  // Published for the header's Export CSV control, which must export the filtered and sorted
  // set the user is looking at. Page and pageSize are deliberately omitted: the export pages
  // the whole result set itself.
  useEffect(() => {
    setExportQuery({
      q: query.q || undefined,
      status: query.status ?? undefined,
      service: query.service ?? undefined,
      owner: query.owner ?? undefined,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    });
    return () => setExportQuery(null);
  }, [query, setExportQuery]);

  // Owner labels come from the response's owner DIRECTORY, never from the rows on screen.
  // Deriving them from rows was the defect this replaces: a filter that matched nothing
  // emptied the option list, so the applied owner lost its name and fell back to the display
  // name of a different real owner.
  //
  // A selected owner that the directory does not contain (a stale or hand-edited id) is kept
  // as an option under a neutral unknown label, so the control still shows that a filter is
  // applied instead of silently reading as "no filter".
  const ownerOptions = useMemo(() => {
    const facets = data?.ownerFacets ?? [];
    const selected = query.owner;
    if (!selected || facets.some((f) => f.id === selected)) {
      return facets.map((f) => ({ id: f.id, label: f.label }));
    }
    return [...facets.map((f) => ({ id: f.id, label: f.label })), { id: selected, label: UNKNOWN_OWNER_LABEL }];
  }, [data, query.owner]);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-cc-card border border-cc-line bg-cc-surface p-4 text-sm text-cc-t2"
      >
        <p>Couldn&apos;t load leads: {error}</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="mt-3 rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-64 animate-pulse rounded-cc-card border border-cc-line bg-cc-soft" aria-busy="true" />
    );
  }

  return (
    <LeadsTable
      data={data.rows}
      total={data.total}
      // Echo the page the server actually answered, not the one requested — a
      // clamped request (page 99 of 13) must not leave the footer showing 99.
      query={{ ...query, page: data.page, pageSize: data.pageSize }}
      onQueryChange={onQueryChange}
      ownerOptions={ownerOptions}
      serviceFacets={data.serviceFacetCounts}
      mobileData={mobileRows}
      canonicalState={canonicalState}
    />
  );
}
