// The read-only projection of a conversation, and the JSON envelope both history
// endpoints answer in.
//
// A stored `Conversation` carries far more than a history list is allowed to show:
// which workspace and user own it, which provider and model answered, what the
// answer cost, how long it took, which tools it called and what they returned.
// None of that is a field here. The mapping is subtractive by construction —
// every exposed key is written out by hand — so a column added to the schema
// later appears in this file's tests as a decision rather than in a response as
// an accident.
//
// Pure on purpose: no Supabase client, no session, no environment. The routes
// resolve identity and build a store; this decides only what a caller may see.

import type { Conversation, ConversationMessage } from "../conversation/types";

/** Small enough to render at once, large enough to be the whole history for most. */
export const DEFAULT_HISTORY_LIMIT = 25;
/** A ceiling rather than a preference: `list` reads every transcript it returns. */
export const MAX_HISTORY_LIMIT = 50;

/** The schema makes a title mandatory; this covers a row that predates that. */
export const UNTITLED = "Untitled conversation";

/** One row of the history list. No body, no accounting, no owner. */
export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** Renderable messages only, so the count matches what opening it will show. */
  messageCount: number;
};

/** A transcript line, in the only two roles this screen renders. */
export type HistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: readonly HistoryMessage[];
};

export type HistoryListBody = { ok: true; conversations: readonly ConversationSummary[] };
export type HistoryDetailBody = { ok: true; conversation: ConversationDetail };
export type ApiErrorBody = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};

/**
 * Whether a stored message is one this UI can render.
 *
 * System and developer messages are the prompt, tool messages are machinery, and
 * `ContentPart[]` has no renderer in this slice — an image flattened to its alt
 * text would be a silent lie about what was said. All four are dropped rather
 * than approximated, which is why the count above is computed from the same
 * predicate the transcript is.
 */
function isRenderable(message: ConversationMessage): boolean {
  if (message.role !== "user" && message.role !== "assistant") return false;
  if (typeof message.content !== "string") return false;
  // An assistant turn that only requested a tool has no text; an empty bubble
  // reads as a failure rather than as the protocol step it is.
  return message.content.trim().length > 0;
}

function renderable(conversation: Conversation): readonly ConversationMessage[] {
  return conversation.messages.filter(isRenderable);
}

function toHistoryMessage(message: ConversationMessage): HistoryMessage {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content as string,
    createdAt: message.createdAt,
  };
}

export function toConversationSummary(conversation: Conversation): ConversationSummary {
  return {
    id: conversation.id,
    title: conversation.title.trim() || UNTITLED,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount: renderable(conversation).length,
  };
}

export function toConversationDetail(conversation: Conversation): ConversationDetail {
  return {
    id: conversation.id,
    title: conversation.title.trim() || UNTITLED,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    // Already in `seq` order from the store; the filter preserves it.
    messages: renderable(conversation).map(toHistoryMessage),
  };
}

export type LimitResult = { ok: true; limit: number } | { ok: false; message: string };

/**
 * The one query parameter either endpoint accepts.
 *
 * Digits only, deliberately: `Number("1e3")` is 1000 and `Number(" 4 ")` is 4,
 * so coercion would quietly accept two spellings of a bound this exists to
 * enforce. There is no `sort`, no `offset` and no filter — an arbitrary one
 * would be a query language, and a query language against a private transcript
 * table is a much larger thing to have to reason about.
 */
export function parseHistoryLimit(raw: string | null): LimitResult {
  if (raw === null) return { ok: true, limit: DEFAULT_HISTORY_LIMIT };
  if (!/^\d+$/.test(raw)) return { ok: false, message: "Limit must be a whole number." };
  const limit = Number(raw);
  if (limit < 1 || limit > MAX_HISTORY_LIMIT) {
    return { ok: false, message: `Limit must be between 1 and ${MAX_HISTORY_LIMIT}.` };
  }
  return { ok: true, limit };
}

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store" } as const;

export function jsonOk(body: HistoryListBody | HistoryDetailBody, correlationId: string): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...JSON_HEADERS, "x-correlation-id": correlationId },
  });
}

/**
 * The failure envelope the Copilot endpoint already answers in.
 *
 * Fixed copy, chosen here, never a driver message: Postgres puts table names,
 * column names and sometimes the offending row in its errors, and the store
 * above it puts nothing else in the typed error it raises. The correlation id is
 * what connects a report to the server log that does carry the reason.
 */
export function jsonError(
  status: number,
  code: string,
  message: string,
  correlationId: string,
  fields?: Record<string, string>,
): Response {
  const body: ApiErrorBody = { ok: false, error: { code, message, ...(fields ? { fields } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, "x-correlation-id": correlationId },
  });
}
