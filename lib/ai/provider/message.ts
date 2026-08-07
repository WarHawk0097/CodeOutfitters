// The wire-neutral message vocabulary.
//
// Every provider has its own shape for a conversation turn: OpenAI wants
// `tool_calls` on an assistant message, Anthropic wants `tool_use` content
// blocks, Gemini wants `parts` with `functionCall`. None of that appears above
// the transport. Application code, the planner, the conversation reducer and the
// tool loop all speak the types in this file, and each transport translates at
// its own edge.
//
// This module is the root of the type graph: it imports nothing from the rest of
// `lib/ai`, which is what keeps the streaming and provider layers acyclic.

/** Every transport the registry knows how to lazily construct. */
export type ProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure-openai"
  | "openrouter"
  | "ollama"
  | "mock";

export const PROVIDER_IDS: readonly ProviderId[] = [
  "openai",
  "anthropic",
  "gemini",
  "azure-openai",
  "openrouter",
  "ollama",
  "mock",
];

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}

export type MessageRole = "system" | "developer" | "user" | "assistant" | "tool";

/** Text. The only part every model accepts. */
export type TextPart = { type: "text"; text: string };

/**
 * An image, referenced by URL or inlined as base64.
 *
 * `data` is kept separate from `url` so that the transport never has to guess
 * whether a string is a location or a payload, and so redaction can drop inline
 * bytes from logs without touching the rest of the message.
 */
export type ImagePart = {
  type: "image";
  mediaType: string;
  url?: string;
  data?: string;
  /** Provider hint where supported; ignored elsewhere. */
  detail?: "auto" | "low" | "high";
};

/** A file attachment the model may read. Resolution is the transport's problem. */
export type FilePart = {
  type: "file";
  mediaType: string;
  name: string;
  url?: string;
  data?: string;
};

/** Model-visible reasoning, where a provider returns it. Never sent to a client. */
export type ReasoningPart = { type: "reasoning"; text: string };

export type ContentPart = TextPart | ImagePart | FilePart | ReasoningPart;

/** A tool invocation requested by the model. Arguments are unvalidated here. */
export type ToolCall = {
  /** Provider-assigned; correlates the call with its result message. */
  id: string;
  name: string;
  /** Raw JSON text as emitted. Parsed and schema-checked by the tool registry. */
  arguments: string;
};

export type SystemMessage = { role: "system"; content: string };
/** Instructions from the application, ranked below system and above the user. */
export type DeveloperMessage = { role: "developer"; content: string };
export type UserMessage = { role: "user"; content: string | readonly ContentPart[]; name?: string };
export type AssistantMessage = {
  role: "assistant";
  content: string | readonly ContentPart[];
  toolCalls?: readonly ToolCall[];
};
/** The result of running one tool call, fed back for the next turn. */
export type ToolMessage = {
  role: "tool";
  toolCallId: string;
  name: string;
  content: string;
  isError?: boolean;
};

export type AIMessage =
  | SystemMessage
  | DeveloperMessage
  | UserMessage
  | AssistantMessage
  | ToolMessage;

/** Why generation stopped. Drives whether the tool loop runs another iteration. */
export type FinishReason =
  | "stop"
  | "length"
  | "tool_calls"
  | "content_filter"
  | "cancelled"
  | "error";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  /** Subset of `inputTokens` served from a prompt cache. */
  cachedInputTokens?: number;
  /** Reasoning tokens, where billed separately from visible output. */
  reasoningTokens?: number;
};

export const EMPTY_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 };

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  const cached = (a.cachedInputTokens ?? 0) + (b.cachedInputTokens ?? 0);
  const reasoning = (a.reasoningTokens ?? 0) + (b.reasoningTokens ?? 0);
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    ...(cached > 0 ? { cachedInputTokens: cached } : {}),
    ...(reasoning > 0 ? { reasoningTokens: reasoning } : {}),
  };
}

/** Flattens mixed content to plain text. Non-text parts are dropped, not stringified. */
export function textOf(content: string | readonly ContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/** True when any part needs a vision-capable model. Checked before dispatch. */
export function requiresVision(messages: readonly AIMessage[]): boolean {
  return messages.some(
    (message) =>
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content !== "string" &&
      message.content.some((part) => part.type === "image"),
  );
}
