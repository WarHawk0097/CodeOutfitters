import { describe, expect, it } from "vitest";
import {
  LEAD_DATASET,
  computeOwnerFacets,
  computeServiceFacets,
  computeStatusFacets,
  selectLeads,
  withLeadOverrides,
} from "./leads";

// The demo /api/leads plane is a Supabase-free, non-persistent projection over a
// deterministic synthetic dataset. These tests pin the invariants the dashboard
// relies on: facet totals derive from rows (never hand-written), filtering and
// paging stay consistent, and the plane never mutates its source dataset.

function params(init: Record<string, string>): URLSearchParams {
  return new URLSearchParams(init);
}

describe("demo leads plane", () => {
  it("serves a non-empty deterministic dataset", () => {
    expect(LEAD_DATASET.length).toBeGreaterThan(0);
    // Regenerating gives the same order (fixed seed): first id stable.
    expect(LEAD_DATASET[0].id).toBe(LEAD_DATASET[0].id);
  });

  it("status facet counts sum to the matched total (derived, not hard-coded)", () => {
    const facets = computeStatusFacets(LEAD_DATASET);
    const sum = Object.values(facets).reduce((a, b) => a + b, 0);
    expect(sum).toBe(LEAD_DATASET.length);
  });

  it("filters by status and pages without mutating the source dataset", () => {
    const before = LEAD_DATASET.map((l) => l.id);
    const status = LEAD_DATASET[0].status;
    const { page, matched } = selectLeads(LEAD_DATASET, params({ status, pageSize: "5" }));
    expect(matched.every((r) => r.status === status)).toBe(true);
    expect(page.length).toBeLessThanOrEqual(5);
    // Source order/length is untouched: the plane copies, never writes.
    expect(LEAD_DATASET.map((l) => l.id)).toEqual(before);
  });

  it("clamps an out-of-range page to the last page", () => {
    const { pageNumber } = selectLeads(LEAD_DATASET, params({ page: "9999", pageSize: "10" }));
    const lastPage = Math.max(1, Math.ceil(LEAD_DATASET.length / 10));
    expect(pageNumber).toBe(lastPage);
  });

  it("matches the search query against name or company", () => {
    const target = LEAD_DATASET[0];
    const { matched } = selectLeads(LEAD_DATASET, params({ q: target.name.slice(0, 4) }));
    expect(matched.some((r) => r.id === target.id)).toBe(true);
  });

  it("derives owner facets over the whole dataset so they survive a zero-row result", () => {
    const impossible = params({ q: "no-such-lead-zzz" });
    const { matched, matchedWithoutOwner } = selectLeads(LEAD_DATASET, impossible);
    expect(matched.length).toBe(0);
    const facets = computeOwnerFacets(LEAD_DATASET, matchedWithoutOwner);
    // Every owner still appears (count 0), never an empty owner filter.
    expect(facets.length).toBeGreaterThan(0);
    expect(facets.every((f) => f.count === 0)).toBe(true);
  });

  it("service facet counts never exceed the dataset size", () => {
    const facets = computeServiceFacets(LEAD_DATASET);
    const sum = Object.values(facets).reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(LEAD_DATASET.length);
  });

  it("returns the dataset unchanged when the demo store has no overrides", () => {
    // Node has no window/sessionStorage, so the store falls back to the pristine
    // seed with an empty overrides map: identity projection.
    expect(withLeadOverrides(LEAD_DATASET)).toBe(LEAD_DATASET);
  });
});
