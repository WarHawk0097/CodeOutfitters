// ai.analyze — api-contracts.json "POST /meetings/:id/analyze"
// providerErrors: unavailable/limit, note: "output lands unreviewed"
// Every field here must carry AiProvenance per AI-SAFETY-AND-REVIEW-SPEC.md.
// No invented pricing/timelines/case studies/testimonials/guarantees.
// No purchase-probability or sentiment percentages, no manipulative objection guidance.
import { z } from "zod";
import { AiProvenanceSchema, IdSchema } from "./shared";

export const AiProviderErrorSchema = z.enum(["unavailable", "limit"]);

export const AiInsightSchema = z.object({
  insightId: IdSchema,
  meetingId: IdSchema,
  summary: z.string(),
  provenance: AiProvenanceSchema,
});
export type AiInsight = z.infer<typeof AiInsightSchema>;

export const AiAnalyzeRequestSchema = z.object({
  meetingId: IdSchema,
});

// Lands unreviewed: reviewStatus must always start "pending" in the mock provider.
export const AiAnalyzeResponseSchema = z.object({
  meetingId: IdSchema,
  insights: z.array(AiInsightSchema),
});
export type AiAnalyzeResponse = z.infer<typeof AiAnalyzeResponseSchema>;
