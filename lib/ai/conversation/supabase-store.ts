// The durable `ConversationStore`, backed by Postgres through the request's own
// Supabase client.
//
// Every statement this file issues runs as the signed-in user, under the policies
// declared in supabase/migrations/20260802000000_ai_conversations.sql. There is no
// service-role key here and no admin client: the database decides what this store
// can see, so a bug in the mapping below cannot widen it. That is also why `get`
// takes no workspace or user argument — scoping one is RLS's job, and duplicating
// it here would suggest the boundary lives in TypeScript.
//
// The client is a constructor argument rather than something this module builds.
// A module-global client would outlive the request whose cookies authenticated it,
// which is the one way a store like this leaks between users.
//
// Nothing raw from Postgres reaches a caller. A driver error carries table names,
// column names, policy names and sometimes the row that failed; every one of them
// is mapped to a typed AI error with fixed, safe text before it leaves.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIError, ValidationError } from "../errors";
import type { FinishReason, MessageRole, ToolCall } from "../provider/message";
import { recomputeTotals } from "./state";
import type {
  Conversation,
  ConversationMessage,
  ConversationStore,
  MessageMetrics,
} from "./types";

/** Postgres SQLSTATEs this store has a specific answer for. */
const UNIQUE_VIOLATION = "23505";
/** An insert refused by a policy, and an insert naming a conversation that is not
 *  there, both arrive as this. Keeping them indistinguishable is deliberate. */
const RLS_VIOLATION = "42501";

const CONVERSATION_COLUMNS = "id, workspace_id, user_id, title, created_at, updated_at";

// One literal rather than a concatenation: supabase-js parses the column list at
// the type level, and a joined string arrives there as an opaque `string`, which it
// then reports as an error shape instead of a row shape.
const MESSAGE_COLUMNS =
  "id, conversation_id, seq, role, content, tool_calls, tool_call_id, metadata, provider_id, model, input_tokens, output_tokens, cached_input_tokens, reasoning_tokens, cost_usd, latency_ms, finish_reason, created_at";

/**
 * A conversation could not be read or written.
 *
 * Retryable because the failures that reach it are transport and availability
 * ones; the two failures that are the caller's fault — a duplicate id, an
 * unreachable conversation — are raised as `ValidationError` instead.
 */
export class ConversationStoreError extends AIError {
  constructor(message: string) {
    super("ai/provider", message, {
      retryable: true,
      safeMessage: "The assistant could not reach its conversation history.",
    });
  }
}

/** What supabase-js hands back on failure. Narrowed rather than imported so this
 *  file does not depend on the driver's error class staying a class. */
type DriverError = { code?: string; message?: string };

function failed(operation: string, error: DriverError): never {
  // `error.message` is deliberately dropped rather than wrapped: it is where
  // Postgres puts the policy name and, on a check violation, the offending row.
  throw new ConversationStoreError(`ai conversation store: ${operation} failed`);
}

type ConversationRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_calls: ToolCall[] | null;
  tool_call_id: string | null;
  metadata: Record<string, string> | null;
  provider_id: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cached_input_tokens: number | null;
  reasoning_tokens: number | null;
  cost_usd: number | string | null;
  latency_ms: number | null;
  finish_reason: FinishReason | null;
  created_at: string;
};

/** Rebuilds the accounting the metrics columns hold, or nothing if there is none. */
function metricsOf(row: MessageRow): MessageMetrics | undefined {
  // The migration's all-or-nothing check means one non-null column implies the
  // rest, so a single probe is enough and a half-built MessageMetrics is
  // unrepresentable rather than merely unlikely.
  if (row.provider_id === null || row.model === null || row.finish_reason === null) return undefined;
  return {
    providerId: row.provider_id,
    model: row.model,
    usage: {
      inputTokens: row.input_tokens ?? 0,
      outputTokens: row.output_tokens ?? 0,
      // Absent and zero mean the same thing upstream — `addUsage` drops a zero —
      // so a null comes back absent rather than as a fabricated 0.
      ...(row.cached_input_tokens ? { cachedInputTokens: row.cached_input_tokens } : {}),
      ...(row.reasoning_tokens ? { reasoningTokens: row.reasoning_tokens } : {}),
    },
    // numeric arrives as a number over PostgREST and as a string from some drivers.
    costUsd: Number(row.cost_usd ?? 0),
    latencyMs: row.latency_ms ?? 0,
    finishReason: row.finish_reason,
  };
}

function toMessage(row: MessageRow): ConversationMessage {
  const metrics = metricsOf(row);
  const metadata = row.metadata;
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
    ...(row.tool_calls && row.tool_calls.length > 0 ? { toolCalls: row.tool_calls } : {}),
    ...(row.tool_call_id ? { toolCallId: row.tool_call_id } : {}),
    ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    ...(metrics ? { metrics } : {}),
  };
}

function toConversation(row: ConversationRow, messages: readonly ConversationMessage[]): Conversation {
  const base: Conversation = {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
    totals: { usage: { inputTokens: 0, outputTokens: 0 }, costUsd: 0, latencyMs: 0 },
  };
  // Totals are derived rather than stored. The reducer maintains them incrementally
  // for the in-process store; here the messages are already in hand, so a column
  // holding the same sum would only be a second thing that can disagree.
  return { ...base, totals: recomputeTotals(base) };
}

function toMessageRow(conversationId: string, message: ConversationMessage) {
  if (typeof message.content !== "string") {
    // ContentPart[] has no producer in this slice — no upload path, no vision
    // model — so it is refused loudly rather than flattened to text behind the
    // caller's back, which would silently drop an image.
    throw new ValidationError("Only text message content can be persisted");
  }
  const metrics = message.metrics;
  return {
    id: message.id,
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    tool_calls: message.toolCalls ? [...message.toolCalls] : null,
    tool_call_id: message.toolCallId ?? null,
    metadata: message.metadata ?? {},
    provider_id: metrics?.providerId ?? null,
    model: metrics?.model ?? null,
    input_tokens: metrics?.usage.inputTokens ?? null,
    output_tokens: metrics?.usage.outputTokens ?? null,
    cached_input_tokens: metrics?.usage.cachedInputTokens ?? null,
    reasoning_tokens: metrics?.usage.reasoningTokens ?? null,
    cost_usd: metrics?.costUsd ?? null,
    latency_ms: metrics?.latencyMs ?? null,
    finish_reason: metrics?.finishReason ?? null,
    created_at: message.createdAt,
  };
}

export class SupabaseConversationStore implements ConversationStore {
  constructor(private readonly client: SupabaseClient) {}

  async create(conversation: Conversation): Promise<Conversation> {
    const { error } = await this.client.from("ai_conversations").insert({
      id: conversation.id,
      workspace_id: conversation.workspaceId,
      user_id: conversation.userId,
      title: conversation.title,
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt,
    });
    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new ValidationError(`Conversation "${conversation.id}" already exists`);
      }
      failed("create", error);
    }
    // A new conversation has no messages, so the record handed in is already the
    // record that was written; reading it back would only cost a round trip.
    return conversation;
  }

  async get(id: string): Promise<Conversation | undefined> {
    const { data, error } = await this.client
      .from("ai_conversations")
      .select(CONVERSATION_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) failed("get", error);
    // Not there and not yours are the same answer. The caller turns either into the
    // same 404, so the endpoint cannot be used to find out which ids are real.
    if (!data) return undefined;

    return toConversation(data as ConversationRow, await this.messagesOf([id]).then((byId) => byId.get(id) ?? []));
  }

  async list(workspaceId: string, userId: string, limit = 50): Promise<readonly Conversation[]> {
    const { data, error } = await this.client
      .from("ai_conversations")
      .select(CONVERSATION_COLUMNS)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) failed("list", error);

    const rows = (data ?? []) as ConversationRow[];
    if (rows.length === 0) return [];
    // One query for every conversation's messages rather than one per conversation:
    // a history list is exactly the shape that turns into an N+1 by accident.
    const byConversation = await this.messagesOf(rows.map((row) => row.id));
    return rows.map((row) => toConversation(row, byConversation.get(row.id) ?? []));
  }

  async append(id: string, message: ConversationMessage): Promise<Conversation> {
    const { error } = await this.client.from("ai_messages").insert(toMessageRow(id, message));
    if (error) {
      // A conversation that is missing and one that belongs to somebody else both
      // fail the insert policy, and both are reported the way the in-process store
      // reports a missing one.
      if (error.code === RLS_VIOLATION) throw new ValidationError(`No such conversation: "${id}"`);
      if (error.code === UNIQUE_VIOLATION) {
        throw new ValidationError(`Message "${message.id}" already exists`);
      }
      failed("append", error);
    }

    const updated = await this.get(id);
    if (!updated) throw new ValidationError(`No such conversation: "${id}"`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("ai_conversations").delete().eq("id", id);
    if (error) failed("delete", error);
    // Messages go with it by cascade. Deleting a conversation that is not yours
    // matches no row and is not an error, which is the in-process behaviour and
    // also the only one that does not reveal whether the id exists.
  }

  /** Every message of the given conversations, grouped, each group in order. */
  private async messagesOf(ids: readonly string[]): Promise<Map<string, ConversationMessage[]>> {
    const { data, error } = await this.client
      .from("ai_messages")
      .select(MESSAGE_COLUMNS)
      .in("conversation_id", [...ids])
      // seq, not created_at: several messages in one turn share a timestamp, and a
      // tool result read back before the assistant message that requested it is a
      // shape providers reject.
      .order("seq", { ascending: true });
    if (error) failed("messages", error);

    const grouped = new Map<string, ConversationMessage[]>();
    for (const row of (data ?? []) as MessageRow[]) {
      const group = grouped.get(row.conversation_id);
      if (group) group.push(toMessage(row));
      else grouped.set(row.conversation_id, [toMessage(row)]);
    }
    return grouped;
  }
}
