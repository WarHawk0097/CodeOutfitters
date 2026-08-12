import { describe, expect, it } from "vitest";
import type { Lead } from "@command-center/contracts";
import { computeOwnerFacets, countAwaitingFirstContact, countNewThisWeek, selectLeads } from "./select";

function lead(overrides: Partial<Lead> & { id: string }): Lead {
  return {
    name: "Lead " + overrides.id,
    company: "Co " + overrides.id,
    status: "New",
    owner: "unassigned",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const rows: Lead[] = [
  lead({ id: "b", status: "New", owner: "u1", ownerName: "Ada", serviceInterest: "AI Automation" }),
  lead({ id: "a", status: "Contacted", owner: "u1", ownerName: "Ada" }),
  lead({ id: "c", status: "New", owner: "unassigned" }),
];

describe("selectLeads", () => {
  it("filters by status", () => {
    const { matched } = selectLeads(rows, { status: "New" }, new Set());
    expect(matched.map((r) => r.id)).toEqual(["b", "c"]);
  });

  it("filters by q across name and company", () => {
    const { matched } = selectLeads(rows, { q: "Co a" }, new Set());
    expect(matched.map((r) => r.id)).toEqual(["a"]);
  });

  it("sorts by owner label then tie-breaks by id", () => {
    const { matched } = selectLeads(rows, { sortBy: "owner", sortDir: "asc" }, new Set());
    // "Ada" < row c's owner (raw id "unassigned"); within Ada, a before b by id.
    expect(matched.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("clamps page to the last valid page", () => {
    const { pageNumber, page } = selectLeads(rows, { page: 99, pageSize: 2 }, new Set());
    expect(pageNumber).toBe(2);
    expect(page.map((r) => r.id)).toEqual(["c"]);
  });

  it("excludes view=no-next-action covered leads", () => {
    const { matched } = selectLeads(rows, { view: "no-next-action" }, new Set(["a", "b"]));
    expect(matched.map((r) => r.id)).toEqual(["c"]);
  });

  it("captures matchedWithoutOwner before the owner filter", () => {
    const { matched, matchedWithoutOwner } = selectLeads(rows, { owner: "u1" }, new Set());
    expect(matched.map((r) => r.id)).toEqual(["b", "a"]);
    expect(matchedWithoutOwner.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });
});

describe("computeOwnerFacets", () => {
  it("builds the directory from the whole dataset, counts from matchedWithoutOwner", () => {
    const facets = computeOwnerFacets(rows, [rows[0]]);
    expect(facets).toEqual([
      { id: "u1", label: "Ada", count: 1 },
      { id: "unassigned", label: "unassigned", count: 0 },
    ]);
  });

  it("survives a zero-row matched set", () => {
    const facets = computeOwnerFacets(rows, []);
    expect(facets.every((f) => f.count === 0)).toBe(true);
    expect(facets).toHaveLength(2);
  });
});

describe("countNewThisWeek / countAwaitingFirstContact", () => {
  it("counts rows created within 7 days of now", () => {
    const now = Date.parse("2026-01-05T00:00:00.000Z");
    expect(countNewThisWeek(rows, now)).toBe(3);
    expect(countNewThisWeek(rows, Date.parse("2026-02-01T00:00:00.000Z"))).toBe(0);
  });

  it("counts New-status rows as awaiting first contact", () => {
    expect(countAwaitingFirstContact(rows)).toBe(2);
  });
});
