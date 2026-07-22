import { describe, expect, it } from "vitest";
import { MockProposalAcceptanceProvider } from "./proposal-acceptance";

describe("MockProposalAcceptanceProvider", () => {
  it("defaults to NOT_CONFIGURED", () => {
    expect(new MockProposalAcceptanceProvider().status).toBe("NOT_CONFIGURED");
  });

  it("starts pending after sendForSignature", async () => {
    const result = await new MockProposalAcceptanceProvider().sendForSignature("proposal-001");
    expect(result.status).toBe("pending");
  });

  it("simulates a declined status", async () => {
    const result = await new MockProposalAcceptanceProvider().getStatus("proposal-mock-declined");
    expect(result.status).toBe("declined");
  });

  it("simulates a signed status", async () => {
    const result = await new MockProposalAcceptanceProvider().getStatus("proposal-001");
    expect(result.status).toBe("signed");
  });
});
