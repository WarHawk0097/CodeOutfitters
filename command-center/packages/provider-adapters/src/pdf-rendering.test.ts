import { describe, expect, it } from "vitest";
import { MockPdfRenderingProvider } from "./pdf-rendering";

describe("MockPdfRenderingProvider", () => {
  it("defaults to NOT_CONFIGURED", () => {
    expect(new MockPdfRenderingProvider().status).toBe("NOT_CONFIGURED");
  });

  it("renders a fixture PDF url", async () => {
    const result = await new MockPdfRenderingProvider().renderProposalPdf(["intro"]);
    expect("url" in result && result.url).toMatch(/\.pdf$/);
  });

  it("simulates an overflow error", async () => {
    const result = await new MockPdfRenderingProvider().renderProposalPdf(["__trigger_overflow__"]);
    expect(result).toEqual({ error: "overflow" });
  });
});
