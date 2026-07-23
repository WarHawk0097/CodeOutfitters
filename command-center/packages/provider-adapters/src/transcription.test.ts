import { describe, expect, it } from "vitest";
import { MockTranscriptionProvider } from "./transcription";

describe("MockTranscriptionProvider", () => {
  it("defaults to NOT_CONFIGURED", () => {
    expect(new MockTranscriptionProvider().status).toBe("NOT_CONFIGURED");
  });

  it("refuses to start without consent (consent gate applies to mock too)", async () => {
    const result = await new MockTranscriptionProvider().startSession("meeting-001", false);
    expect(result).toEqual({ error: "failed" });
  });

  it("returns canned transcript segments when consent given", async () => {
    const result = await new MockTranscriptionProvider().startSession("meeting-001", true);
    expect(Array.isArray(result)).toBe(true);
  });

  it("simulates a provider failure", async () => {
    const result = await new MockTranscriptionProvider().startSession("meeting-provider-unavailable", true);
    expect(result).toEqual({ error: "reconnecting" });
  });
});
