// Turning rendered prompts into messages.
//
// Kept separate from the registry because it is the one place that decides how
// the four prompt layers map onto the three instruction roles a provider
// understands. The mapping is not one-to-one — there is no `workspace` role on
// any API — and hiding that translation behind a function stops each caller from
// inventing its own.

import type { AIMessage } from "../provider/message";
import { orderByLayer } from "./registry";
import type { RenderedPrompt } from "./types";

/**
 * Builds the instruction prefix for a request.
 *
 * The system layer becomes the system message. Developer and workspace layers
 * both become `developer` messages, in that order, because workspace text is
 * configuration supplied by a tenant and must never gain system authority. The
 * user layer is excluded here: it belongs with the conversation history, not with
 * the instructions.
 */
export function toInstructionMessages(prompts: readonly RenderedPrompt[]): readonly AIMessage[] {
  return orderByLayer(prompts)
    .filter((prompt) => prompt.layer !== "user")
    .map((prompt): AIMessage =>
      prompt.layer === "system"
        ? { role: "system", content: prompt.text }
        : { role: "developer", content: prompt.text },
    );
}

/**
 * Prepends instructions to a conversation.
 *
 * Any instruction messages already present in `history` are dropped. History is
 * reconstructed from storage on every request, and letting a stale or injected
 * system message survive into a new request is exactly the failure this prevents.
 */
export function withInstructions(
  prompts: readonly RenderedPrompt[],
  history: readonly AIMessage[],
): readonly AIMessage[] {
  return [
    ...toInstructionMessages(prompts),
    ...history.filter((message) => message.role !== "system" && message.role !== "developer"),
  ];
}
