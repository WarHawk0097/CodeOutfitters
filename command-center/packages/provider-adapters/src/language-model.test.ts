import { describe, expect, it } from "vitest";
import { MockLanguageModelProvider } from "./language-model";

describe("MockLanguageModelProvider", () => {
  it("defaults to NOT_CONFIGURED", () => {
    expect(new MockLanguageModelProvider().status).toBe("NOT_CONFIGURED");
  });

  it("always sets requiresApproval true and reviewStatus pending", async () => {
    const result = await new MockLanguageModelProvider().generateInsight("normal context");
    if ("error" in result) throw new Error("expected success result");
    expect(result.requiresApproval).toBe(true);
    expect(result.reviewStatus).toBe("pending");
  });

  it("never emits invented numeric facts (pricing/sentiment %) in the fixture output", async () => {
    const result = await new MockLanguageModelProvider().generateInsight("normal context");
    if ("error" in result) throw new Error("expected success result");
    expect(result.output).not.toMatch(/\$|%/);
  });

  it("simulates provider unavailable", async () => {
    const result = await new MockLanguageModelProvider().generateInsight("trigger-provider-unavailable");
    expect(result).toEqual({ error: "unavailable" });
  });

  it("simulates provider limit", async () => {
    const result = await new MockLanguageModelProvider().generateInsight("trigger-provider-limit");
    expect(result).toEqual({ error: "limit" });
  });
});
