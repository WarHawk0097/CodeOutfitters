// Conversation records.
//
// A conversation is the unit everything else is attributed to: tokens, latency,
// cost, which provider and model answered, and which tools ran. Recording those
// per message rather than per session is what later makes "why did last month
// cost that" answerable without re-running anything.
//
// These are storage types, distinct from `AIMessage`, which is the wire type. A
// stored message has an id, a timestamp and accounting; a wire message has none
// of that and must not carry it.

import type {
  AIMessage,
  ContentPart,
  FinishReason,
  MessageRole,
  TokenUsage,
  ToolCall,
} from "../provider/message";

export type Attachment = {
  id: string;
  name: string;
  mediaType: string;
  sizeBytes: number;
  /** Where the bytes live. Never the bytes themselves — records get logged. */
  storageKey: string;
};

/** Per-message accounting. Absent on user messages, which cost nothing to store. */
export type MessageMetrics = {
  providerId: string;
  model: string;
  usage: TokenUsage;
  costUsd: number;
  latencyMs: number;
  finishReason: FinishReason;
};

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string | readonly ContentPart[];
  createdAt: string;
  toolCalls?: readonly ToolCall[];
  /** Set on `role: "tool"` messages, correlating a result with its call. */
  toolCallId?: string;
  attachments?: readonly Attachment[];
  metrics?: MessageMetrics;
  /** Application-defined. Never sent to a provider. */
  metadata?: Readonly<Record<string, string>>;
};

export type Conversation = {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: readonly ConversationMessage[];
  /** Running totals across every message. Maintained by the reducer. */
  totals: { usage: TokenUsage; costUsd: number; latencyMs: number };
  metadata?: Readonly<Record<string, string>>;
};

/**
 * Persistence seam.
 *
 * Interface only in this branch. Keeping it here — rather than reaching for the
 * existing database layer — is what allows the AI foundation to be built and
 * tested without a schema change, which this task forbids.
 */
export interface ConversationStore {
  create(conversation: Conversation): Promise<Conversation>;
  get(id: string): Promise<Conversation | undefined>;
  /** Newest first. Scoped by workspace so a store can never leak across tenants. */
  list(workspaceId: string, userId: string, limit?: number): Promise<readonly Conversation[]>;
  append(id: string, message: ConversationMessage): Promise<Conversation>;
  delete(id: string): Promise<void>;
}

/** Strips storage-only fields to produce the wire form a provider is sent. */
export function toWireMessage(message: ConversationMessage): AIMessage {
  switch (message.role) {
    case "system":
      return { role: "system", content: typeof message.content === "string" ? message.content : "" };
    case "developer":
      return { role: "developer", content: typeof message.content === "string" ? message.content : "" };
    case "assistant":
      return {
        role: "assistant",
        content: message.content,
        ...(message.toolCalls ? { toolCalls: message.toolCalls } : {}),
      };
    case "tool":
      return {
        role: "tool",
        toolCallId: message.toolCallId ?? "",
        name: message.metadata?.toolName ?? "",
        content: typeof message.content === "string" ? message.content : "",
      };
    default:
      return { role: "user", content: message.content };
  }
}
