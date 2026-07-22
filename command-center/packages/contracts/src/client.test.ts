import { describe, expect, it } from "vitest";
import { ClientProposalViewSchema, ClientAcceptResponseSchema } from "./client";

describe("client-facing contracts", () => {
  it("accepts a valid client proposal view with no AI fields present", () => {
    const parsed = ClientProposalViewSchema.parse({
      proposalId: "proposal-001",
      clientName: "Acme Co",
      lineItems: [{ description: "Automation setup", amount: 1000 }],
      total: 1000,
      status: "sent",
    });
    expect(Object.keys(parsed)).not.toContain("provenance");
    expect(Object.keys(parsed)).not.toContain("confidence");
  });

  it("accepts a valid client.accept response with the audit event", () => {
    expect(() =>
      ClientAcceptResponseSchema.parse({
        proposalId: "proposal-001",
        acceptedAt: "2026-01-05T09:00:00.000Z",
        auditEvent: "proposal_accepted",
      }),
    ).not.toThrow();
  });
});
