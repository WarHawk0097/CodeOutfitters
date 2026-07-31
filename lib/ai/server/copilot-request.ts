// The Copilot request contract.
//
// The wire shape is deliberately four fields short of what the orchestrator can
// do. Provider, model, prompts, tools, permissions, context, memory, iteration
// limits, timeouts and cost ceilings are all server decisions, so none of them
// has a name here — `strictObject` rejects an unknown key rather than ignoring
// it, which turns an attempt to set one into a 422 instead of a silent no-op.
//
// The identity fields are the same story: `userId`, `workspaceId` and `role` are
// resolved from the session, so a body carrying them is not a request this
// endpoint understands.

import { z } from "zod";

/** Long enough for a pasted paragraph, short enough to bound a turn's cost. */
export const MAX_MESSAGE_LENGTH = 4_000;

export const CopilotRequestSchema = z.strictObject({
  message: z
    .string()
    .trim()
    .min(1, "Enter a message.")
    .max(MAX_MESSAGE_LENGTH, `Keep the message under ${MAX_MESSAGE_LENGTH} characters.`),
  /**
   * Continues an existing conversation. Omitted starts a new one — the id of a
   * new conversation is minted by the server, never accepted from here.
   */
  conversationId: z.uuid("That conversation id is not valid.").optional(),
  /**
   * Set once a human has approved a state-changing plan. Inert in this slice:
   * no tool is registered, so there is no capability for it to unlock.
   */
  confirmed: z.boolean().optional(),
});

export type CopilotRequestBody = z.infer<typeof CopilotRequestSchema>;

/** Field-keyed messages in the shape the repository's API errors already use. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    // A rejected key carries no path of its own, so without this every extra
    // field collapses into one "body" message that names none of them.
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) fields[key] ??= "This field is not accepted.";
      continue;
    }
    const key = issue.path.join(".") || "body";
    fields[key] ??= issue.message;
  }
  return fields;
}
