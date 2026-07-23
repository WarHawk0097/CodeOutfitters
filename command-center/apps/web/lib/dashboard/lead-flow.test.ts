import { describe, expect, it } from "vitest";
import { isQualifiedStatus, type Lead } from "@command-center/contracts";
import {
  countNewThisWeek,
  generateLeads,
  REFERENCE_NOW,
} from "../../mocks/fixtures/generate-leads";
import {
  aggregateLeadFlow,
  DEFAULT_LEAD_FLOW_RANGE,
  formatBucketDate,
  LEAD_FLOW_RANGES,
  leadFlowTotals,
  qualifiedInstant,
} from "./lead-flow";

const LEADS = generateLeads();
const REF_MS = Date.parse(REFERENCE_NOW);

describe("aggregateLeadFlow — shape", () => {
  it("returns exactly `days` points per range, oldest first, ending at the reference day", () => {
    for (const range of LEAD_FLOW_RANGES) {
      const points = aggregateLeadFlow(LEADS, range.value);
      expect(points).toHaveLength(range.days);
      // Ascending, unique, distinct dates.
      const dates = points.map((p) => p.date);
      expect(new Set(dates).size).toBe(range.days);
      expect([...dates].sort()).toEqual(dates);
      // Last bucket ends at the reference instant's UTC day.
      expect(points.at(-1)!.date).toBe(REFERENCE_NOW.slice(0, 10));
    }
  });

  it("emits only non-negative integers", () => {
    for (const p of aggregateLeadFlow(LEADS, "90d")) {
      expect(Number.isInteger(p.newLeads)).toBe(true);
      expect(Number.isInteger(p.qualifiedLeads)).toBe(true);
      expect(p.newLeads).toBeGreaterThanOrEqual(0);
      expect(p.qualifiedLeads).toBeGreaterThanOrEqual(0);
    }
  });

  it("changes the dataset between ranges (7d is a strict tail of 90d)", () => {
    const d7 = aggregateLeadFlow(LEADS, "7d");
    const d90 = aggregateLeadFlow(LEADS, "90d");
    expect(d7.length).not.toBe(d90.length);
    expect(d7[0]!.date).not.toBe(d90[0]!.date);
    // Same most-recent bucket in both.
    expect(d7.at(-1)!.date).toBe(d90.at(-1)!.date);
  });
});

describe("aggregateLeadFlow — consistency with the shared store", () => {
  it("7-day newLeads sum equals the Leads header 'new this week' count", () => {
    const { newTotal } = leadFlowTotals(aggregateLeadFlow(LEADS, "7d"));
    expect(newTotal).toBe(countNewThisWeek(LEADS));
  });

  it("qualified count equals the status-derived qualified count", () => {
    const statusQualified = LEADS.filter((l) => isQualifiedStatus(l.status)).length;
    const withTimestamp = LEADS.filter((l) => l.qualifiedAt).length;
    expect(withTimestamp).toBe(statusQualified);
    // Every lead across the widest range's qualified buckets is a qualified lead.
    const { qualifiedTotal } = leadFlowTotals(aggregateLeadFlow(LEADS, "90d"));
    expect(qualifiedTotal).toBeLessThanOrEqual(statusQualified);
  });
});

describe("qualifiedAt invariants", () => {
  it("sets qualifiedAt on exactly the qualified leads, bounded createdAt ≤ qualifiedAt ≤ now", () => {
    for (const lead of LEADS) {
      if (isQualifiedStatus(lead.status)) {
        expect(lead.qualifiedAt).toBeDefined();
        const q = Date.parse(lead.qualifiedAt!);
        expect(q).toBeGreaterThanOrEqual(Date.parse(lead.createdAt));
        expect(q).toBeLessThanOrEqual(REF_MS);
      } else {
        expect(lead.qualifiedAt).toBeUndefined();
      }
    }
  });
});

describe("qualifiedInstant — runtime override fallback", () => {
  it("uses updatedAt (clamped to now) when a lead is qualified but carries no qualifiedAt", () => {
    // Simulates a demo status override: status flipped to a qualified stage, no qualifiedAt.
    const overridden: Lead = {
      id: "lead-x",
      name: "X",
      company: "Y",
      status: "Won",
      owner: "user-001",
      createdAt: "2026-04-10T12:00:00.000Z",
      updatedAt: "2026-04-18T12:00:00.000Z",
    };
    expect(qualifiedInstant(overridden)).toBe("2026-04-18T12:00:00.000Z");
    // A non-qualified lead is never counted.
    expect(qualifiedInstant({ ...overridden, status: "New" })).toBeNull();
    // updatedAt after the reference clamps to the reference instant.
    expect(qualifiedInstant({ ...overridden, updatedAt: "2026-05-01T00:00:00.000Z" })).toBe(
      REFERENCE_NOW,
    );
  });
});

describe("UTC-safe bucketing", () => {
  it("does not shift a boundary lead across days by local timezone", () => {
    // A lead created one second before the reference lands in the most-recent bucket,
    // regardless of the machine timezone (UTC read only).
    const boundary: Lead = {
      id: "b",
      name: "b",
      company: "b",
      status: "New",
      owner: "u",
      createdAt: new Date(REF_MS - 1000).toISOString(),
      updatedAt: new Date(REF_MS - 1000).toISOString(),
    };
    const points = aggregateLeadFlow([boundary], "7d");
    expect(points.at(-1)!.newLeads).toBe(1);
    expect(leadFlowTotals(points).newTotal).toBe(1);
  });

  it("excludes a lead created after the reference instant", () => {
    const future: Lead = {
      id: "f",
      name: "f",
      company: "f",
      status: "New",
      owner: "u",
      createdAt: new Date(REF_MS + DAY(1)).toISOString(),
      updatedAt: new Date(REF_MS + DAY(1)).toISOString(),
    };
    expect(leadFlowTotals(aggregateLeadFlow([future], "90d")).newTotal).toBe(0);
  });
});

describe("formatBucketDate", () => {
  it("formats a UTC date key without timezone drift", () => {
    expect(formatBucketDate("2026-04-22")).toBe("Apr 22");
    expect(formatBucketDate("2026-01-01")).toBe("Jan 1");
  });
});

describe("defaults", () => {
  it("defaults to the widest range", () => {
    expect(DEFAULT_LEAD_FLOW_RANGE).toBe("90d");
    expect(LEAD_FLOW_RANGES[0]!.value).toBe("90d");
  });
});

function DAY(n: number): number {
  return n * 86_400_000;
}
