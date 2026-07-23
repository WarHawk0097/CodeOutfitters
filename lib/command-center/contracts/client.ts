// client.view, client.accept — api-contracts.json
// GET /proposal/:token (roles: client-token), POST /proposal/:token/accept (audit: proposal_accepted)
// Client-facing surface: no AI labels/warnings ever shown here (AI-SAFETY-AND-REVIEW-SPEC.md).
import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./shared";

export const ClientProposalViewSchema = z.object({
  proposalId: IdSchema,
  clientName: z.string(),
  lineItems: z.array(z.object({ description: z.string(), amount: z.number().nonnegative() })),
  total: z.number().nonnegative(),
  status: z.enum(["sent", "accepted"]),
});
export type ClientProposalView = z.infer<typeof ClientProposalViewSchema>;

export const ClientAcceptResponseSchema = z.object({
  proposalId: IdSchema,
  acceptedAt: IsoDateTimeSchema,
  auditEvent: z.literal("proposal_accepted"),
});
