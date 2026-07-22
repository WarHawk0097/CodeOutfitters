// Server-side pagination semantics for leads.list.
//
// The defect these cover: the UI received ten rows and paginated those ten, so the
// footer read "Page 1 of 1" over a 128-record dataset. Fixing that required the API
// to answer page requests against the whole dataset and to say which page it answered.
// Every number below is derived from the generated dataset, never asserted against a
// hard-coded canonical string.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import {
  LEADS_PAGE_SIZE,
  LeadsListResponseSchema,
  pageCountOf,
  type LeadsListResponse,
} from "@command-center/contracts";
import { handlers } from "../handlers";
import { LEAD_DATASET } from "./leads";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function list(query = ""): Promise<LeadsListResponse> {
  const res = await fetch(`/api/leads${query}`);
  return LeadsListResponseSchema.parse(await res.json());
}

const TOTAL = LEAD_DATASET.length;
const PAGE_COUNT = pageCountOf(TOTAL, LEADS_PAGE_SIZE);

describe("leads.list pagination", () => {
  it("reports the unfiltered dataset total, not the page length", async () => {
    const body = await list();
    expect(body.total).toBe(TOTAL);
    expect(TOTAL).toBe(128);
    expect(body.rows).toHaveLength(LEADS_PAGE_SIZE);
  });

  it("echoes the page and page size it answered", async () => {
    const body = await list("?page=4&pageSize=10");
    expect(body.page).toBe(4);
    expect(body.pageSize).toBe(10);
  });

  it("derives thirteen pages from the total and a page size of ten", () => {
    expect(PAGE_COUNT).toBe(13);
  });

  it("returns eight rows on the last page", async () => {
    const body = await list(`?page=${PAGE_COUNT}`);
    expect(body.rows).toHaveLength(8);
    expect(body.total).toBe(TOTAL);
  });

  it("returns different records on each page, with no overlap and no gaps", async () => {
    const seen = new Set<string>();
    for (let page = 1; page <= PAGE_COUNT; page += 1) {
      const body = await list(`?page=${page}`);
      for (const row of body.rows) {
        expect(seen.has(row.id)).toBe(false);
        seen.add(row.id);
      }
    }
    expect(seen.size).toBe(TOTAL);
  });

  it("clamps a page beyond the last page to the last page", async () => {
    const body = await list("?page=99");
    expect(body.page).toBe(PAGE_COUNT);
    expect(body.rows).toHaveLength(8);
  });

  it("filters by status against the whole dataset, not the first page", async () => {
    const status = "Contacted";
    const expected = LEAD_DATASET.filter((r) => r.status === status).length;
    const body = await list(`?status=${encodeURIComponent(status)}`);
    expect(body.total).toBe(expected);
    // The proof that the filter is not scoped to a loaded page: more records match
    // than a single page can hold, and the unfiltered set is larger still.
    expect(expected).toBeGreaterThan(LEADS_PAGE_SIZE);
    expect(expected).toBeLessThan(TOTAL);
    expect(body.rows.every((r) => r.status === status)).toBe(true);
  });

  it("filters by owner against the whole dataset", async () => {
    const owner = LEAD_DATASET[0]!.owner;
    const expected = LEAD_DATASET.filter((r) => r.owner === owner).length;
    const body = await list(`?owner=${encodeURIComponent(owner)}`);
    expect(body.total).toBe(expected);
    expect(expected).toBeGreaterThan(LEADS_PAGE_SIZE);
    expect(body.rows.every((r) => r.owner === owner)).toBe(true);
  });

  it("filters by service against the whole dataset", async () => {
    const service = LEAD_DATASET[0]!.serviceInterest!;
    const expected = LEAD_DATASET.filter((r) => r.serviceInterest === service).length;
    const body = await list(`?service=${encodeURIComponent(service)}`);
    expect(body.total).toBe(expected);
    expect(body.rows.every((r) => r.serviceInterest === service)).toBe(true);
  });

  // "Contacted" rather than "New": the dataset holds exactly nine "New" records (the
  // "9 awaiting first contact" aggregate), so that filter is a single page and page 2
  // would exercise the clamp above instead of a second page.
  it("pages a filtered set independently of the unfiltered set", async () => {
    const status = "Contacted";
    const filtered = LEAD_DATASET.filter((r) => r.status === status).length;
    expect(filtered).toBeGreaterThan(LEADS_PAGE_SIZE);
    const body = await list(`?status=${encodeURIComponent(status)}&page=2`);
    expect(body.total).toBe(filtered);
    expect(body.page).toBe(2);
    expect(body.rows).toHaveLength(Math.min(LEADS_PAGE_SIZE, filtered - LEADS_PAGE_SIZE));
  });

  it("derives facet counts from the matched records", async () => {
    const body = await list();
    const summed = Object.values(body.facetCounts).reduce((a, b) => a + b, 0);
    expect(summed).toBe(body.total);
  });

  it("sorts deterministically across repeated requests", async () => {
    const a = await list("?sortBy=name&sortDir=asc&page=2");
    const b = await list("?sortBy=name&sortDir=asc&page=2");
    expect(a.rows.map((r) => r.id)).toEqual(b.rows.map((r) => r.id));
    const names = a.rows.map((r) => r.name);
    expect([...names].sort()).toEqual(names);
  });

  it("keeps a sorted page consistent with the page before it", async () => {
    const p1 = await list("?sortBy=name&sortDir=asc&page=1");
    const p2 = await list("?sortBy=name&sortDir=asc&page=2");
    const last = p1.rows[p1.rows.length - 1]!.name;
    expect(p2.rows[0]!.name >= last).toBe(true);
  });
});
