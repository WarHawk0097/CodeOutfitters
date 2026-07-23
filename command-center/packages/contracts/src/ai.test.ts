import { describe, expect, it } from "vitest";
import { AiAnalyzeResponseSchema } from "./ai";

describe("ai contracts", () => {
  it("accepts a valid ai.analyze response with full provenance", () => {
    expect(() =>
      AiAnalyzeResponseSchema.parse({
        meetingId: "meeting-001",
        insights: [
          {
            insightId: "insight-001",
            meetingId: "meeting-001",
            summary: "Client expressed interest in a follow-up meeting.",
            provenance: {
              sourceMeetingId: "meeting-001",
              transcriptRangeStart: 0,
              transcriptRangeEnd: 4200,
              generatedAt: "2026-01-05T09:00:00.000Z",
              provider: "mock",
              model: "mock-language-model",
              confidence: 0.82,
              reviewStatus: "pending",
              reviewer: null,
              originalValue: "Client expressed interest in a follow-up meeting.",
              editedValue: null,
              approvedValue: null,
              requiresApproval: true,
            },
          },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects an insight missing requiresApproval", () => {
    const result = AiAnalyzeResponseSchema.safeParse({
      meetingId: "meeting-001",
      insights: [
        {
          insightId: "insight-001",
          meetingId: "meeting-001",
          summary: "x",
          provenance: {
            sourceMeetingId: "meeting-001",
            transcriptRangeStart: 0,
            transcriptRangeEnd: 1,
            generatedAt: "2026-01-05T09:00:00.000Z",
            provider: "mock",
            model: "mock-language-model",
            confidence: 0.5,
            reviewStatus: "pending",
            reviewer: null,
            originalValue: "x",
            editedValue: null,
            approvedValue: null,
          },
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
