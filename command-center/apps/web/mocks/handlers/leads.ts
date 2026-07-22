// msw handlers for leads.list / leads.patch — shapes per api-contracts.json.
import { http, HttpResponse } from "msw";
import { LEADS_PAGE_SIZE, LeadsPatchRequestSchema, pageCountOf, type Lead } from "@command-center/contracts";
import { countAwaitingFirstContact, countNewThisWeek, generateLeads } from "../fixtures/generate-leads";

// Deterministic synthetic mock data for development and testing. Not canonical customer data.
//
// The dataset is built once from a fixed seed, so every request in a process sees the same
// rows in the same order. `total` is the size of this generated dataset — it is not asserted
// to be the canonical 128 by authority; it happens to be 128 because the generator is asked
// for that many. The canonical C-D05 header and "1–10 OF 128" pagination are design-only
// values for a dataset canonical never defined beyond its first page.
export const LEAD_DATASET: readonly Lead[] = generateLeads();

// Facet counts are DERIVED from the rows, never hard-coded. Each lead has exactly one
// status, so these sum to the dataset length by construction — an invariant a hand-written
// table cannot be trusted to preserve.
export function computeStatusFacets(rows: readonly Lead[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

// Service facets are derived the same way. The canonical popover shows AI Automation 21 /
// Workflow Automation 17 / Web Applications 14, but those describe the dataset canonical
// never defined; they are NOT reproduced here. These counts describe the generated rows.
export function computeServiceFacets(rows: readonly Lead[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.serviceInterest) {
      counts[row.serviceInterest] = (counts[row.serviceInterest] ?? 0) + 1;
    }
  }
  return counts;
}

// The label the Owner column actually shows. "unassigned" is a real owner with the real label
// "Unassigned"; it is not a missing value. Facet order and sort order both go through here so
// the two cannot drift apart.
export function ownerLabel(row: Lead): string {
  return row.ownerName ?? row.owner;
}

// The owner directory is derived from the WHOLE dataset, never from a filtered or paged
// subset, which is the entire point: a client must be able to name the owner it filtered
// by even when that filter plus a search returns nothing. Sorted by label so the option
// order is stable across requests.
export function computeOwnerFacets(
  all: readonly Lead[],
  matchedWithoutOwner: readonly Lead[],
): { id: string; label: string; count: number }[] {
  const labels = new Map<string, string>();
  for (const row of all) {
    if (!labels.has(row.owner)) labels.set(row.owner, ownerLabel(row));
  }
  const counts = new Map<string, number>();
  for (const row of matchedWithoutOwner) counts.set(row.owner, (counts.get(row.owner) ?? 0) + 1);

  return [...labels]
    .map(([id, label]) => ({ id, label, count: counts.get(id) ?? 0 }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Filtering and sorting run against the same stable dataset, so paging through a filtered or
// sorted view is consistent across requests.
//
// `matchedWithoutOwner` applies every filter EXCEPT owner. It is what owner facet counts are
// computed over, so each count answers "how many rows would this owner give me under the
// filters I already have" rather than the useless "total, or zero".
export function selectLeads(
  rows: readonly Lead[],
  params: URLSearchParams,
): { page: Lead[]; matched: Lead[]; matchedWithoutOwner: Lead[]; pageNumber: number; pageSize: number } {
  let matched = [...rows];

  const status = params.get("status");
  if (status) matched = matched.filter((r) => r.status === status);

  const service = params.get("service");
  if (service) matched = matched.filter((r) => r.serviceInterest === service);

  const q = params.get("q")?.trim().toLowerCase();
  if (q) {
    matched = matched.filter(
      (r) => r.name.toLowerCase().includes(q) || r.company.toLowerCase().includes(q),
    );
  }

  const matchedWithoutOwner = matched;

  // Owner is filtered by the opaque id the API carries, never by the display name.
  const owner = params.get("owner");
  if (owner) matched = matched.filter((r) => r.owner === owner);

  const sortBy = params.get("sortBy");
  if (sortBy) {
    const dir = params.get("sortDir") === "desc" ? -1 : 1;
    // Owner is stored as an opaque id but displayed as a name, so it sorts on the name. Every
    // other sortable column stores the string it displays.
    const key = (r: Lead) => (sortBy === "owner" ? ownerLabel(r) : String(r[sortBy as keyof Lead] ?? ""));
    matched.sort((a, b) => {
      const av = key(a);
      const bv = key(b);
      // Tie-break on id so equal keys never sort ambiguously between requests.
      return av === bv ? a.id.localeCompare(b.id) : (av < bv ? -1 : 1) * dir;
    });
  }

  const pageSize = Math.max(1, Number(params.get("pageSize") ?? LEADS_PAGE_SIZE) || LEADS_PAGE_SIZE);
  // Clamp the requested page to the last page that exists, so a stale "next" click
  // against a newly-filtered set returns the last page rather than an empty one.
  const lastPage = pageCountOf(matched.length, pageSize);
  const pageNumber = Math.min(lastPage, Math.max(1, Number(params.get("page") ?? 1) || 1));
  const start = (pageNumber - 1) * pageSize;

  return {
    page: matched.slice(start, start + pageSize),
    matched,
    matchedWithoutOwner,
    pageNumber,
    pageSize,
  };
}

// PRESENTATION_TEST_STATE. A deterministic, mock-only failure so the error and retry paths can
// be driven in a real browser without connecting to, or deliberately breaking, any service.
//
// Deliberately STATELESS: the decision is a pure function of the request. A module-level
// attempt counter would fail the first request of every unrelated load and stay stuck across
// sessions. Instead the client sends `mock-scenario=initial-error` on its first attempt and
// drops it on Retry, so the failure is reproducible on every fresh load and recovery is
// deterministic. Nothing can get wedged, and the normal route never sees this branch.
// Which request the client arms the parameter on is the CLIENT's decision (initial load vs
// the first filter/sort/page change). The handler only has to recognise the names.
export const MOCK_ERROR_SCENARIOS = ["initial-error", "filter-error"] as const;

function scenarioFailure(params: URLSearchParams): Response | null {
  const scenario = params.get("mock-scenario");
  if (!scenario || !(MOCK_ERROR_SCENARIOS as readonly string[]).includes(scenario)) return null;
  return HttpResponse.json(
    {
      error: {
        code: "mock_scenario_failure",
        message: `Deliberate mock failure (mock-scenario=${scenario}). Not a real service error.`,
        status: 500,
      },
    },
    { status: 500 },
  );
}

export const leadsHandlers = [
  http.get("/api/leads", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const failure = scenarioFailure(params);
    if (failure) return failure;
    const { page, matched, matchedWithoutOwner, pageNumber, pageSize } = selectLeads(LEAD_DATASET, params);
    // Every number below is computed from the rows that actually matched, so total,
    // facets and pagination cannot drift from the data they describe. `pageCount` is
    // not sent: the client derives it from total and pageSize.
    return HttpResponse.json({
      rows: page,
      total: matched.length,
      page: pageNumber,
      pageSize,
      facetCounts: computeStatusFacets(matched),
      serviceFacetCounts: computeServiceFacets(matched),
      // Derived from the whole dataset, so it survives a zero-row result. See
      // OwnerFacetSchema in @command-center/contracts for the count semantics.
      ownerFacets: computeOwnerFacets(LEAD_DATASET, matchedWithoutOwner),
      // Counted over `matched`, not over the page — the header describes the whole
      // result set. Both use the fixed reference instant documented in
      // generate-leads.ts; neither reads the real clock.
      newThisWeekCount: countNewThisWeek(matched),
      awaitingFirstContactCount: countAwaitingFirstContact(matched),
    });
  }),

  http.patch("/api/leads/:id", async ({ request, params }) => {
    const body = await request.json();
    const parsed = LeadsPatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: { code: "reason_required", message: "reason is required for this status", status: 422 } },
        { status: 422 },
      );
    }
    const lead = LEAD_DATASET.find((l) => l.id === params.id);
    if (!lead) {
      return HttpResponse.json(
        { error: { code: "not_found", message: "lead not found", status: 404 } },
        { status: 404 },
      );
    }
    // Non-mutating: the response projects the patch onto a copy, leaving LEAD_DATASET
    // untouched so the dataset resets deterministically between tests with no teardown.
    return HttpResponse.json({ ...lead, ...parsed.data, updatedAt: "2026-01-05T09:00:00.000Z" });
  }),
];
