// Tests for the deterministic synthetic lead generator (Decision 2).
// These assert the generator's guarantees: fixed count, reproducibility, unique stable ids,
// schema validity, and that every derived number comes from the records rather than a literal.
import { describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { LeadSchema, LeadStatusSchema } from "@command-center/contracts";
import {
  AWAITING_FIRST_CONTACT_COUNT,
  countAwaitingFirstContact,
  countNewThisWeek,
  generateLeads,
  isAwaitingFirstContact,
  isNewThisWeek,
  MOCK_LEAD_SEED,
  NEW_THIS_WEEK_COUNT,
  REFERENCE_NOW,
  REFERENCE_WEEK_START,
  TOTAL_LEAD_COUNT,
} from "./generate-leads";
import { LEAD_FIXTURES } from "./leads";
import { computeServiceFacets, computeStatusFacets, selectLeads } from "../handlers/leads";

describe("deterministic synthetic lead generator", () => {
  it("generates exactly 128 records", () => {
    expect(generateLeads()).toHaveLength(TOTAL_LEAD_COUNT);
    expect(TOTAL_LEAD_COUNT).toBe(128);
  });

  it("produces identical output across two runs with the same seed", () => {
    expect(generateLeads(MOCK_LEAD_SEED)).toEqual(generateLeads(MOCK_LEAD_SEED));
  });

  it("assigns unique ids", () => {
    const rows = generateLeads();
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it("produces records that all pass the shared Lead schema", () => {
    for (const row of generateLeads()) {
      expect(() => LeadSchema.parse(row)).not.toThrow();
    }
  });

  it("status facets are mutually exclusive and sum to the record count", () => {
    const rows = generateLeads();
    const sum = Object.values(computeStatusFacets(rows)).reduce((a, b) => a + b, 0);
    expect(sum).toBe(TOTAL_LEAD_COUNT);
  });

  it("service facets derive from the records, not from canonical popover values", () => {
    const rows = generateLeads();
    const facets = computeServiceFacets(rows);
    for (const [service, count] of Object.entries(facets)) {
      expect(count).toBe(rows.filter((r) => r.serviceInterest === service).length);
    }
    expect(Object.values(facets).reduce((a, b) => a + b, 0)).toBe(TOTAL_LEAD_COUNT);
  });

  it("pagination totals derive from the records", () => {
    const rows = generateLeads();
    const { page, matched } = selectLeads(rows, new URLSearchParams("page=1&pageSize=10"));
    expect(matched).toHaveLength(TOTAL_LEAD_COUNT);
    expect(page).toHaveLength(10);
    const last = selectLeads(rows, new URLSearchParams("page=13&pageSize=10"));
    expect(last.page).toHaveLength(8); // 128 = 12 full pages + 8
  });

  it("filters derive from the records", () => {
    const rows = generateLeads();
    for (const status of LeadStatusSchema.options) {
      const { matched } = selectLeads(rows, new URLSearchParams(`status=${encodeURIComponent(status)}`));
      expect(matched).toHaveLength(rows.filter((r) => r.status === status).length);
    }
  });

  it("sorting is deterministic", () => {
    const params = () => new URLSearchParams("sortBy=name&sortDir=asc&pageSize=128");
    const first = selectLeads(generateLeads(), params()).page.map((r) => r.id);
    const second = selectLeads(generateLeads(), params()).page.map((r) => r.id);
    expect(first).toEqual(second);
  });

  // The Owner column displays a name but stores an opaque id, so sorting it by the stored value
  // would order the column by something no one can see.
  it("sorts owner by the displayed name, not the stored id", () => {
    const rows = generateLeads();
    const sorted = selectLeads(rows, new URLSearchParams("sortBy=owner&sortDir=asc&pageSize=128")).page;
    const labels = sorted.map((r) => r.ownerName ?? r.owner);
    expect(labels).toEqual([...labels].sort());
    // The id order and the label order genuinely disagree here, so this would pass by accident
    // if the dataset ever stopped exercising the difference.
    expect(sorted.map((r) => r.owner)).not.toEqual([...sorted.map((r) => r.owner)].sort());
  });

  it("attaches no canonical-authority comments to generated values", async () => {
    const src = await readFile(resolve("mocks/fixtures/generate-leads.ts"), "utf8");
    expect(src).not.toMatch(/canonical values/i);
    expect(src).not.toMatch(/canonical records/i);
    expect(src).not.toMatch(/extracted records/i);
    expect(src).toMatch(/Not canonical customer data/);
  });

  // Page 1 of the default view must remain the canonical frame, or the visual comparison
  // against C-D05 silently regresses.
  it("keeps the 10 canonical seed records on page 1 in canonical order", () => {
    expect(generateLeads().slice(0, 10)).toEqual(LEAD_FIXTURES);
  });

  // Six synthetic records now sit INSIDE the reference week so "12 new this week" is a real
  // count (see REFERENCE_NOW). They are placed below every in-window seed row, so the
  // canonical six still lead a descending createdAt sort — which is the property the earlier
  // blanket "older than every seed" assertion was actually protecting.
  it("keeps the canonical six at the head of a newest-first ordering", () => {
    const newestFirst = [...generateLeads()].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    expect(newestFirst.slice(0, 6).map((r) => r.id)).toEqual(
      LEAD_FIXTURES.slice(0, 6).map((r) => r.id),
    );
  });

  // A first revision read rows.length inside the push loop, so the date offset was always 0
  // and all 118 generated records shared one createdAt. Every other test still passed.
  it("gives generated records distinct createdAt values, descending outside the week", () => {
    const generated = generateLeads().slice(10);
    const times = generated.map((r) => Date.parse(r.createdAt));
    expect(new Set(times).size).toBe(generated.length);
    // The six in-week records ascend within the window; everything after them steps back a
    // day at a time. Both blocks are strictly monotonic, so no two records collide.
    for (let i = 1; i < 6; i += 1) expect(times[i]!).toBeGreaterThan(times[i - 1]!);
    for (let i = 7; i < times.length; i += 1) expect(times[i]!).toBeLessThan(times[i - 1]!);
    // updatedAt never precedes createdAt.
    for (const row of generated) {
      expect(Date.parse(row.updatedAt)).toBeGreaterThanOrEqual(Date.parse(row.createdAt));
    }
  });
});

// CANON 143: "128 total · 12 new this week · 9 awaiting first contact". Both trailing figures
// are counted over the dataset against a fixed reference instant — no literal reaches the
// header, and nothing here reads the real clock.
describe("header aggregates", () => {
  it("counts 12 leads created inside the reference week", () => {
    expect(countNewThisWeek(generateLeads())).toBe(NEW_THIS_WEEK_COUNT);
    expect(NEW_THIS_WEEK_COUNT).toBe(12);
  });

  it("counts 9 leads awaiting first contact", () => {
    expect(countAwaitingFirstContact(generateLeads())).toBe(AWAITING_FIRST_CONTACT_COUNT);
    expect(AWAITING_FIRST_CONTACT_COUNT).toBe(9);
  });

  it("bounds the week at the documented instants, half-open at the start", () => {
    expect(Date.parse(REFERENCE_NOW) - Date.parse(REFERENCE_WEEK_START)).toBe(7 * 86_400_000);
    expect(isNewThisWeek({ createdAt: REFERENCE_WEEK_START })).toBe(false);
    expect(isNewThisWeek({ createdAt: REFERENCE_NOW })).toBe(true);
    expect(isNewThisWeek({ createdAt: "2026-04-22T17:00:00.001Z" })).toBe(false);
  });

  it("treats only status New as awaiting first contact", () => {
    for (const status of LeadStatusSchema.options) {
      expect(isAwaitingFirstContact({ status })).toBe(status === "New");
    }
  });

  it("stays clock-free: the same counts whatever the system time says", () => {
    vi.useFakeTimers();
    try {
      const before = countNewThisWeek(generateLeads());
      vi.setSystemTime(new Date("2031-01-01T00:00:00.000Z"));
      expect(countNewThisWeek(generateLeads())).toBe(before);
      expect(countAwaitingFirstContact(generateLeads())).toBe(AWAITING_FIRST_CONTACT_COUNT);
    } finally {
      vi.useRealTimers();
    }
  });
});
