// Shared primitives reused across domain contracts.
// Source: Dashboard/integration-layer/api-contracts.json (base rule),
// Dashboard/docs/AI-SAFETY-AND-REVIEW-SPEC.md (review envelope).
import { z } from "zod";

export const IdSchema = z.string().min(1);

// ISO 8601 datetime string. Contracts distinguish transport (string) from
// any persistence-layer Date type — persistence types never leak here.
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    status: z.number().int(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

// api-contracts.json response: "rows,total,facetCounts"
export function listEnvelopeSchema<T extends z.ZodTypeAny>(rowSchema: T) {
  return z.object({
    rows: z.array(rowSchema),
    total: z.number().int().nonnegative(),
    facetCounts: z.record(z.string(), z.number().int().nonnegative()),
  });
}

export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  filters: z.record(z.string(), z.string()).optional(),
});
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

// AI-safety review envelope (AI-SAFETY-AND-REVIEW-SPEC.md).
// Every AI-generated item must carry provenance + review metadata.
// reviewStatus starts "pending"; UI must render inferred-vs-fact distinctly.
export const ReviewStatusSchema = z.enum(["pending", "approved", "edited", "rejected"]);

export const AiProvenanceSchema = z.object({
  sourceMeetingId: IdSchema,
  transcriptRangeStart: z.number().int().nonnegative(),
  transcriptRangeEnd: z.number().int().nonnegative(),
  generatedAt: IsoDateTimeSchema,
  provider: z.string(),
  model: z.string(),
  confidence: z.number().min(0).max(1),
  reviewStatus: ReviewStatusSchema,
  reviewer: IdSchema.nullable(),
  originalValue: z.string(),
  editedValue: z.string().nullable(),
  approvedValue: z.string().nullable(),
  requiresApproval: z.literal(true),
});
export type AiProvenance = z.infer<typeof AiProvenanceSchema>;
