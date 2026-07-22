import { describe, expect, it } from "vitest";
import { CrmApplyRequestSchema, CrmApplyResponseSchema } from "./crm";

describe("crm contracts", () => {
  it("requires an idempotencyKey", () => {
    const result = CrmApplyRequestSchema.safeParse({
      meetingId: "meeting-001",
      approvedBy: "user-001",
      items: [{ leadId: "lead-001", field: "status", value: "Won" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid crm.apply request", () => {
    const result = CrmApplyRequestSchema.safeParse({
      meetingId: "meeting-001",
      idempotencyKey: "idem-001",
      approvedBy: "user-001",
      items: [{ leadId: "lead-001", field: "status", value: "Won" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a per-item conflict result (409 pattern)", () => {
    expect(() =>
      CrmApplyResponseSchema.parse({
        meetingId: "meeting-001",
        results: [{ leadId: "lead-001", status: "conflict", error: "stale version" }],
      }),
    ).not.toThrow();
  });
});
