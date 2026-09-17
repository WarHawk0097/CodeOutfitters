import { z } from "zod";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NOTE_LENGTH,
  type ResponseDraft,
  responseMessageOf,
  responseTypedNameOf,
  responseTypeOf,
  validateResponseDraft,
} from "./model";
import type { SubmitResponseIntent } from "./provider";

const TextResponseSchema = z.object({
  type: z.enum(["question", "comment"]),
  message: z.string().max(MAX_MESSAGE_LENGTH),
  displayName: z.string().max(MAX_DISPLAY_NAME_LENGTH),
});

const AcceptanceSchema = z.object({
  type: z.literal("acceptance"),
  typedName: z.string().max(MAX_DISPLAY_NAME_LENGTH),
  authorised: z.boolean(),
  note: z.string().max(MAX_NOTE_LENGTH),
});

const DeclineSchema = z.object({
  type: z.literal("decline"),
  reason: z.string().max(MAX_NOTE_LENGTH),
  confirmed: z.boolean(),
});

export const PublicProposalSubmitSchema = z.object({
  draft: z.discriminatedUnion("type", [TextResponseSchema, AcceptanceSchema, DeclineSchema]),
  idempotencyKey: z.string().uuid(),
});

export const PublicProposalOpenSchema = z.object({
  sessionKey: z.string().min(8).max(128),
});

export type PublicProposalSubmit = z.infer<typeof PublicProposalSubmitSchema>;

export function toSubmitIntent(rawToken: string, input: PublicProposalSubmit): SubmitResponseIntent | null {
  const draft = input.draft as ResponseDraft;
  if (Object.keys(validateResponseDraft(draft)).length > 0) return null;
  return {
    rawToken,
    responseType: responseTypeOf(draft),
    message: responseMessageOf(draft),
    typedName: responseTypedNameOf(draft),
    authorizationConfirmed: draft.type === "acceptance" ? draft.authorised : false,
    idempotencyKey: input.idempotencyKey,
  };
}
