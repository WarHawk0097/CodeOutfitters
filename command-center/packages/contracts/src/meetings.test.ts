import { describe, expect, it } from "vitest";
import { TranscriptStreamFrameSchema, TranscriptMarkerRequestSchema } from "./meetings";

describe("meetings contracts", () => {
  it("accepts a transcript segment frame", () => {
    expect(() =>
      TranscriptStreamFrameSchema.parse({
        type: "segment",
        segment: {
          segmentId: "seg-001",
          meetingId: "meeting-001",
          speaker: "Rep",
          text: "Hello",
          startMs: 0,
          endMs: 1000,
        },
      }),
    ).not.toThrow();
  });

  it("accepts a provider_error frame", () => {
    expect(() => TranscriptStreamFrameSchema.parse({ type: "provider_error", error: "reconnecting" })).not.toThrow();
  });

  it("rejects an unknown provider error value", () => {
    const result = TranscriptStreamFrameSchema.safeParse({ type: "provider_error", error: "bogus" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid transcript marker request", () => {
    expect(() => TranscriptMarkerRequestSchema.parse({ label: "key moment", atMs: 5000 })).not.toThrow();
  });
});
