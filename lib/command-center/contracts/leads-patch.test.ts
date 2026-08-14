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

  it("accepts a status change to Won/Lost/FUL when a reason and expectedStatus are present", () => {
    const result = LeadsPatchRequestSchema.safeParse({
      status: "Won",
      expectedStatus: "Negotiation",
      reason: "Signed contract",
    });
    expect(result.success).toBe(true);
  });

  it("does not require a reason for a status outside the reason-required set", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Contacted", expectedStatus: "New" });
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

// Optimistic-concurrency input for public.change_lead_stage() — see
// supabase/migrations/20260813000000_leads_pipeline_stage.sql. Required by this schema
// whenever `status` is present, so a client can never send a bare status change with no
// assertion about what it saw the lead's status was.
describe("LeadsPatchRequestSchema — expectedStatus required for a status change", () => {
  it("rejects a status change with no expectedStatus", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Contacted" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "expected_status_required")).toBe(true);
    }
  });

  it("does not require expectedStatus for an owner-only patch", () => {
    const result = LeadsPatchRequestSchema.safeParse({ owner: "11111111-1111-1111-1111-111111111111" });
    expect(result.success).toBe(true);
  });

  it("accepts a status change once expectedStatus is present", () => {
    const result = LeadsPatchRequestSchema.safeParse({ status: "Contacted", expectedStatus: "New" });
    expect(result.success).toBe(true);
  });
});

// change_source (leads.ts:~240) is a UI-origin label, never an authorization signal —
// change_lead_stage() re-derives auth from auth.uid()/is_workspace_member(), not this
// field. This pins the enum to exactly the two real UI surfaces so a future edit cannot
// silently make a privileged-sounding value (e.g. "automation", "system") browser-selectable
// by just adding it here — that would need a deliberate, reviewed change to this test too.
describe("LeadsPatchRequestSchema — change_source is a closed UI-origin label set", () => {
  it("accepts only lead_detail and pipeline as source values", () => {
    expect(LeadsPatchRequestSchema.shape.source.unwrap().options).toEqual(["lead_detail", "pipeline"]);
  });

  it("rejects an unrecognized source value", () => {
    const result = LeadsPatchRequestSchema.safeParse({ source: "automation" });
    expect(result.success).toBe(false);
  });
});
