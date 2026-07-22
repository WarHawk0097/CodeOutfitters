import { describe, expect, it } from "vitest";
import { ProposalsReviewRequestSchema, ProposalsSendRequestSchema } from "./proposals";

describe("proposals contracts", () => {
  it("rejects a review where approver equals owner", () => {
    const result = ProposalsReviewRequestSchema.safeParse({ approverId: "user-001", ownerId: "user-001" });
    expect(result.success).toBe(false);
  });

  it("accepts a review where approver differs from owner", () => {
    const result = ProposalsReviewRequestSchema.safeParse({ approverId: "user-002", ownerId: "user-001" });
    expect(result.success).toBe(true);
  });

  it("requires confirmed: true for send (CONFIRM & SEND gate)", () => {
    const result = ProposalsSendRequestSchema.safeParse({ idempotencyKey: "idem-001", confirmed: false });
    expect(result.success).toBe(false);
  });

  it("accepts a valid send request", () => {
    const result = ProposalsSendRequestSchema.safeParse({ idempotencyKey: "idem-001", confirmed: true });
    expect(result.success).toBe(true);
  });
});
