// Leads list derivations — pure functions mirroring mocks/handlers/leads.ts's selectLeads,
// computeOwnerFacets, computeStatusFacets, computeServiceFacets, ownerLabel. Kept in one
// place so the live route and the mock cannot drift on filter/sort/facet semantics.
// "now" is passed in, never read from the clock — same rule as lib/tasks/model.ts.
import type { Lead, LeadsListParams, OwnerFacet } from "@command-center/contracts";
import { LEADS_PAGE_SIZE, pageCountOf } from "@command-center/contracts";

export function ownerLabel(row: Lead): string {
  return row.ownerName ?? row.owner;
}

export function computeStatusFacets(rows: readonly Lead[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

export function computeServiceFacets(rows: readonly Lead[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.serviceInterest) counts[row.serviceInterest] = (counts[row.serviceInterest] ?? 0) + 1;
  }
  return counts;
}

// Directory from the WHOLE dataset, counts from matchedWithoutOwner — see OwnerFacetSchema
// in lib/command-center/contracts/leads.ts for the guarantees this must preserve.
export function computeOwnerFacets(all: readonly Lead[], matchedWithoutOwner: readonly Lead[]): OwnerFacet[] {
  const labels = new Map<string, string>();
  for (const row of all) if (!labels.has(row.owner)) labels.set(row.owner, ownerLabel(row));
  const counts = new Map<string, number>();
  for (const row of matchedWithoutOwner) counts.set(row.owner, (counts.get(row.owner) ?? 0) + 1);
  return [...labels]
    .map(([id, label]) => ({ id, label, count: counts.get(id) ?? 0 }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function countNewThisWeek(rows: readonly Lead[], nowMs: number): number {
  const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
  return rows.filter((r) => Date.parse(r.createdAt) >= weekAgo).length;
}

export function countAwaitingFirstContact(rows: readonly Lead[]): number {
  return rows.filter((r) => r.status === "New").length;
}

export type LeadSelection = {
  page: Lead[];
  matched: Lead[];
  matchedWithoutOwner: Lead[];
  pageNumber: number;
  pageSize: number;
};

type SelectParams = Partial<
  Pick<LeadsListParams, "status" | "service" | "owner" | "q" | "sortBy" | "sortDir" | "page" | "pageSize" | "view">
>;

// Mirrors mocks/handlers/leads.ts's selectLeads exactly: view -> status -> service -> q ->
// (capture matchedWithoutOwner) -> owner -> sort -> paginate. `coveredLeadIds` (leads with an
// open, non-COMPLETED task) is resolved by the caller — this function has no I/O.
export function selectLeads(
  rows: readonly Lead[],
  params: SelectParams,
  coveredLeadIds: ReadonlySet<string>,
): LeadSelection {
  let matched = [...rows];

  if (params.view === "no-next-action") matched = matched.filter((r) => !coveredLeadIds.has(r.id));
  if (params.status) matched = matched.filter((r) => r.status === params.status);
  if (params.service) matched = matched.filter((r) => r.serviceInterest === params.service);

  const q = params.q?.trim().toLowerCase();
  if (q) matched = matched.filter((r) => r.name.toLowerCase().includes(q) || r.company.toLowerCase().includes(q));

  const matchedWithoutOwner = matched;

  if (params.owner) matched = matched.filter((r) => r.owner === params.owner);

  if (params.sortBy) {
    const dir = params.sortDir === "desc" ? -1 : 1;
    const sortBy = params.sortBy;
    const key = (r: Lead) => (sortBy === "owner" ? ownerLabel(r) : String(r[sortBy as keyof Lead] ?? ""));
    matched = [...matched].sort((a, b) => {
      const av = key(a);
      const bv = key(b);
      return av === bv ? a.id.localeCompare(b.id) : (av < bv ? -1 : 1) * dir;
    });
  }

  const pageSize = Math.max(1, params.pageSize || LEADS_PAGE_SIZE);
  const lastPage = pageCountOf(matched.length, pageSize);
  const pageNumber = Math.min(lastPage, Math.max(1, params.page || 1));
  const start = (pageNumber - 1) * pageSize;

  return { page: matched.slice(start, start + pageSize), matched, matchedWithoutOwner, pageNumber, pageSize };
}
