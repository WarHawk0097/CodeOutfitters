// crm.apply — api-contracts.json "POST /meetings/:id/crm-apply"
// humanApproval mandatory, idempotencyKey required, rollback per-item (409/422 simulated by mock adapter)
import { z } from "zod";
import { IdSchema } from "./shared";

export const CrmApplyItemSchema = z.object({
  leadId: IdSchema,
  field: z.string(),
  value: z.string(),
});

export const CrmApplyRequestSchema = z.object({
  meetingId: IdSchema,
  idempotencyKey: z.string().min(1),
  approvedBy: IdSchema,
  items: z.array(CrmApplyItemSchema).min(1),
});
export type CrmApplyRequest = z.infer<typeof CrmApplyRequestSchema>;

export const CrmApplyItemResultSchema = z.object({
  leadId: IdSchema,
  status: z.enum(["applied", "conflict", "invalid"]),
  error: z.string().nullable(),
});

export const CrmApplyResponseSchema = z.object({
  meetingId: IdSchema,
  results: z.array(CrmApplyItemResultSchema),
});
export type CrmApplyResponse = z.infer<typeof CrmApplyResponseSchema>;
