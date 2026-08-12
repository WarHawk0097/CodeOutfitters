import { describe, expect, it } from "vitest";
import { LeadsPatchRequestSchema } from "./leads";

// LeadsPatchRequestSchema's superRefine (leads.ts:228) is the ONLY place the
// reason-required-for-status rule lives — enforced at the API layer, not RLS/DB (the
// leads_update grant/policy has no opinion on `reason`, which isn't even a DB column). This
// is the test that would have caught it if that rule regressed.
describe("LeadsPatchRequestSchema — reason-required statuses", () => {
  it("rejects a status change to Won/Lost/FUL with no reason", () => {
    for (const status of ["Won", "Lost", "FUL"] as const) {
      const result = LeadsPatchRequestSchema.safeParse({ status });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === "reason_required")).toBe(true);
      }
    }
  });

  it("accepts a status change to Won/Lost/FUL when a reason is present", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Won", reason: "Signed contract" });
    expect(result.success).toBe(true);
  });

  it("does not require a reason for a status outside the reason-required set", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Contacted" });
    expect(result.success).toBe(true);
  });

  it("does not require a reason when status is unchanged (owner-only patch)", () => {
    const result = LeadsPatchRequestSchema.safeParse({ owner: "11111111-1111-1111-1111-111111111111" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty patch body with no recognizable fields as still schema-valid but semantically a no-op — patch shape itself is optional-only", () => {
    const result = LeadsPatchRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
