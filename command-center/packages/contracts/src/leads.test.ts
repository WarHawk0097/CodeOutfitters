import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_STATUS_LABELS,
  AppointmentStatusSchema,
  LEADS_PAGE_SIZE,
  LEAD_STATUS_LABELS,
  LeadStatusSchema,
  LeadsListParamsSchema,
  LeadsListResponseSchema,
  LeadsPatchRequestSchema,
  pageCountOf,
} from "./leads";

const FIXTURE_LEAD = {
  id: "lead-001",
  name: "Jane Doe",
  company: "Acme Co",
  status: "New" as const,
  owner: "user-001",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// The list envelope now carries the page it answered. These fixtures gained
// `page`, `pageSize` and `serviceFacetCounts` when leads.list became
// server-paginated, then the two header aggregates (CANON 143), then the owner
// directory; the assertions themselves are unchanged.
const ENVELOPE = {
  total: 1,
  page: 1,
  pageSize: LEADS_PAGE_SIZE,
  facetCounts: { New: 1 },
  serviceFacetCounts: { "Web Development": 1 },
  ownerFacets: [{ id: "user-001", label: "Ada Lovelace", count: 1 }],
  newThisWeekCount: 0,
  awaitingFirstContactCount: 1,
};

describe("leads contracts", () => {
  it("accepts a valid leads.list response envelope", () => {
    expect(() => LeadsListResponseSchema.parse({ ...ENVELOPE, rows: [FIXTURE_LEAD] })).not.toThrow();
  });

  it("accepts a lead with Phase 3 optional fields populated", () => {
    expect(() =>
      LeadsListResponseSchema.parse({
        ...ENVELOPE,
        rows: [
          {
            ...FIXTURE_LEAD,
            serviceInterest: "Web Development",
            appointmentStatus: "scheduled",
            nextFollowUpAt: "2026-01-08T00:00:00.000Z",
          },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects an invalid appointmentStatus value", () => {
    const result = LeadsListResponseSchema.safeParse({
      ...ENVELOPE,
      rows: [{ ...FIXTURE_LEAD, appointmentStatus: "bogus_status" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a leads.list envelope missing pagination metadata", () => {
    // The defect this contract closes: a response that carried rows and total but
    // no page/pageSize left the client unable to tell which page it was showing.
    const result = LeadsListResponseSchema.safeParse({
      rows: [FIXTURE_LEAD],
      total: 128,
      facetCounts: { New: 1 },
    });
    expect(result.success).toBe(false);
  });

  it("defaults the leads page size to the canonical C-D05 page of ten", () => {
    const params = LeadsListParamsSchema.parse({});
    expect(params.pageSize).toBe(10);
    expect(params.page).toBe(1);
    expect(LEADS_PAGE_SIZE).toBe(10);
  });

  it("accepts the leads filter params the toolbar sends", () => {
    const params = LeadsListParamsSchema.parse({
      page: 3,
      status: "Contacted",
      service: "AI Automation",
      owner: "user-002",
      q: "acme",
      sortBy: "name",
      sortDir: "desc",
    });
    expect(params).toMatchObject({
      page: 3,
      pageSize: 10,
      status: "Contacted",
      service: "AI Automation",
      owner: "user-002",
      q: "acme",
      sortBy: "name",
      sortDir: "desc",
    });
  });

  it("derives page count from total and page size", () => {
    // Canonical C-D05: 128 records at ten per page is 13 pages.
    expect(pageCountOf(128, 10)).toBe(13);
    expect(pageCountOf(130, 10)).toBe(13);
    expect(pageCountOf(0, 10)).toBe(1);
    expect(pageCountOf(1, 10)).toBe(1);
  });

  it("maps every typed status and appointment value to a human-facing label", () => {
    for (const status of LeadStatusSchema.options) {
      expect(LEAD_STATUS_LABELS[status]).toBeTruthy();
    }
    for (const appt of AppointmentStatusSchema.options) {
      const label = APPOINTMENT_STATUS_LABELS[appt];
      expect(label).toBeTruthy();
      // No snake_case identifier may survive into a label.
      expect(label).not.toContain("_");
    }
    // Canonical ST map keys this status 'Follow Up Later'.
    expect(LEAD_STATUS_LABELS.FUL).toBe("Follow Up Later");
    expect(APPOINTMENT_STATUS_LABELS.not_started).toBe("Not Started");
    expect(APPOINTMENT_STATUS_LABELS.no_show).toBe("No Show");
  });

  it("requires a reason when moving status to Won", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Won" });
    expect(result.success).toBe(false);
  });

  it("accepts Won status when a reason is provided", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Won", reason: "closed deal" });
    expect(result.success).toBe(true);
  });

  it("does not require a reason for a non-terminal status", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Contacted" });
    expect(result.success).toBe(true);
  });
});
