// Conversation state transitions.
//
// Pure functions over immutable records. Nothing here touches storage, a clock or
// a random source unless one is handed to it, which is why the accounting
// arithmetic and the context-window trimming can be tested exactly rather than
// approximately.
//
// The reducer is the only writer of `totals`. Recomputing them from the message
// list on read would be equivalent today and quadratic once a conversation is
// long, so they are maintained incrementally and asserted against a recomputation
// in the tests.

import { addUsage, EMPTY_USAGE, type AIMessage, type TokenUsage } from "../provider/message";
import { toWireMessage, type Conversation, type ConversationMessage } from "./types";

export type ConversationIdentity = {
  id: string;
  workspaceId: string;
  userId: string;
};

/** Deterministic construction: the caller supplies id and clock. */
export function createConversation(
  identity: ConversationIdentity,
  now: string,
  title = "New conversation",
): Conversation {
  return {
    ...identity,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
    totals: { usage: EMPTY_USAGE, costUsd: 0, latencyMs: 0 },
  };
}

/**
 * Appends a message and folds its metrics into the running totals.
 *
 * Returns a new conversation rather than mutating: the same record is read by
 * concurrent requests, and in-place mutation is how one request's totals end up
 * attributed to another's.
 */
export function appendMessage(
  conversation: Conversation,
  message: ConversationMessage,
): Conversation {
  const metrics = message.metrics;
  return {
    ...conversation,
    updatedAt: message.createdAt,
    messages: [...conversation.messages, message],
    totals: metrics
      ? {
          usage: addUsage(conversation.totals.usage, metrics.usage),
          costUsd: conversation.totals.costUsd + metrics.costUsd,
          latencyMs: conversation.totals.latencyMs + metrics.latencyMs,
        }
      : conversation.totals,
  };
}

/** Recomputes totals from scratch. The oracle the incremental path is checked against. */
export function recomputeTotals(conversation: Conversation): Conversation["totals"] {
  return conversation.messages.reduce(
    (totals, message) =>
      message.metrics
        ? {
            usage: addUsage(totals.usage, message.metrics.usage),
            costUsd: totals.costUsd + message.metrics.costUsd,
            latencyMs: totals.latencyMs + message.metrics.latencyMs,
          }
        : totals,
    { usage: EMPTY_USAGE as TokenUsage, costUsd: 0, latencyMs: 0 },
  );
}

/**
 * Titles a conversation from its first user message.
 *
 * A deterministic first pass so a sidebar has something to show immediately; a
 * model-generated title can replace it later without changing this code.
 */
export function deriveTitle(text: string, maxLength = 60): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized === "") return "New conversation";
  if (normalized.length <= maxLength) return normalized;
  const cut = normalized.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Selects the trailing messages that fit the configured context budget.
 *
 * Trailing rather than leading because recency is what a conversation needs;
 * standing instructions live in prompts, which are re-applied on every request
 * and so cannot be trimmed away here.
 *
 * A tool result is never separated from the assistant message that requested it.
 * Providers reject a `tool` message whose call is missing, so a naive slice at the
 * wrong index produces a 400 rather than a shorter conversation.
 */
export function selectContext(
  messages: readonly ConversationMessage[],
  maxMessages: number,
): readonly AIMessage[] {
  const start = Math.max(0, messages.length - maxMessages);
  let index = start;
  while (index < messages.length && messages[index]?.role === "tool") index += 1;
  return messages.slice(index).map(toWireMessage);
}
