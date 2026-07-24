// proposals.create/validate/review/pdf/send — api-contracts.json
// pdf errors: font/image/overflow, note "REQUIRES BACKEND"
// send: humanApproval "CONFIRM & SEND", preconditions [approved, validation READY, pdf fresh], idempotency required, rollback retry email_failed
import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./shared";

export const ProposalStatusSchema = z.enum(["draft", "validated", "approved", "sent"]);
export const ValidationStatusSchema = z.enum(["PENDING", "READY", "FAILED"]);

export const ProposalSchema = z.object({
  id: IdSchema,
  leadId: IdSchema,
  status: ProposalStatusSchema,
  validationStatus: ValidationStatusSchema,
  pdfGeneratedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});
export type Proposal = z.infer<typeof ProposalSchema>;

export const ProposalsCreateRequestSchema = z.object({
  leadId: IdSchema,
});
export const ProposalsCreateResponseSchema = ProposalSchema;

export const ProposalsValidateResponseSchema = z.object({
  proposalId: IdSchema,
  validationStatus: ValidationStatusSchema,
  issues: z.array(z.string()),
});

export const ProposalsReviewRequestSchema = z.object({
  approverId: IdSchema,
  ownerId: IdSchema,
}).refine((val) => val.approverId !== val.ownerId, {
  message: "approver_must_differ_from_owner",
  path: ["approverId"],
});
export const ProposalsReviewResponseSchema = z.object({
  proposalId: IdSchema,
  status: ProposalStatusSchema,
  approvedBy: IdSchema,
  approvedAt: IsoDateTimeSchema,
});

export const ProposalsPdfErrorSchema = z.enum(["font", "image", "overflow"]);
export const ProposalsPdfResponseSchema = z.object({
  proposalId: IdSchema,
  pdfUrl: z.string(),
  generatedAt: IsoDateTimeSchema,
});

export const ProposalsSendRequestSchema = z.object({
  idempotencyKey: z.string().min(1),
  confirmed: z.literal(true), // "CONFIRM & SEND" humanApproval gate
});
export const ProposalsSendResponseSchema = z.object({
  proposalId: IdSchema,
  status: ProposalStatusSchema,
  sentAt: IsoDateTimeSchema,
});
// Send preconditions the mock adapter must check before allowing send:
// status === "approved", validationStatus === "READY", pdfGeneratedAt fresh (non-null).
