// The streaming event vocabulary.
//
// One discriminated union for every incremental thing the stack can emit, so a
// consumer writes a single exhaustive switch and the compiler tells them when a
// new event type appears. Providers translate their own SSE dialects into this;
// the tool loop and the orchestrator emit into it directly, which is why tool and
// step events live here alongside the model deltas.
//
// The union is transport-agnostic on purpose. It is serialised over SSE today
// (see `./sse.ts`); a WebSocket carrying the same JSON frames needs no change to
// anything above this file.

import type { FinishReason, TokenUsage, ToolCall } from "../provider/message";
import type { AIErrorCode } from "../errors";

/** Generation has begun. Carries what was actually dispatched, after resolution. */
export type StreamStartEvent = {
  type: "start";
  conversationId: string;
  messageId: string;
  providerId: string;
  model: string;
};

/** Visible output. Deltas concatenate in arrival order to form the final text. */
export type TextDeltaEvent = { type: "text-delta"; text: string };

/** Reasoning summary, where the provider exposes one. Never persisted verbatim. */
export type ReasoningDeltaEvent = { type: "reasoning-delta"; text: string };

/** The model has committed to calling a tool. Arguments are complete and raw. */
export type ToolCallEvent = { type: "tool-call"; toolCall: ToolCall };

/** A tool finished. `isError` distinguishes a failed run from an empty result. */
export type ToolResultEvent = {
  type: "tool-result";
  toolCallId: string;
  name: string;
  result: string;
  isError: boolean;
  durationMs: number;
};

/** One planner or tool-loop iteration completed. Used for progress, not content. */
export type StepEvent = { type: "step"; step: number; label: string };

/** Terminal success. Exactly one of this or `error` ends a well-formed stream. */
export type StreamFinishEvent = {
  type: "finish";
  finishReason: FinishReason;
  usage: TokenUsage;
  costUsd: number;
  latencyMs: number;
};

/**
 * Terminal failure. Carries the client-safe projection only — the raw provider
 * message never reaches this union, so a stream can be piped to a browser without
 * a redaction pass.
 */
export type StreamErrorEvent = {
  type: "error";
  code: AIErrorCode;
  message: string;
  retryable: boolean;
};

export type AIStreamEvent =
  | StreamStartEvent
  | TextDeltaEvent
  | ReasoningDeltaEvent
  | ToolCallEvent
  | ToolResultEvent
  | StepEvent
  | StreamFinishEvent
  | StreamErrorEvent;

export function isTerminalEvent(event: AIStreamEvent): boolean {
  return event.type === "finish" || event.type === "error";
}

/**
 * Collapses a stream into the result it describes.
 *
 * The reduction lives here rather than in each consumer because "what does this
 * sequence of events mean" must have one answer: a non-streaming caller that
 * drains a stream has to end up with exactly the object a `generate()` call
 * would have returned.
 */
export async function collectStream(
  events: AsyncIterable<AIStreamEvent>,
): Promise<{
  text: string;
  reasoning: string;
  toolCalls: ToolCall[];
  finishReason: FinishReason;
  usage: TokenUsage;
  costUsd: number;
  error?: StreamErrorEvent;
}> {
  let text = "";
  let reasoning = "";
  const toolCalls: ToolCall[] = [];
  let finishReason: FinishReason = "error";
  let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  let costUsd = 0;
  let error: StreamErrorEvent | undefined;

  for await (const event of events) {
    switch (event.type) {
      case "text-delta":
        text += event.text;
        break;
      case "reasoning-delta":
        reasoning += event.text;
        break;
      case "tool-call":
        toolCalls.push(event.toolCall);
        break;
      case "finish":
        finishReason = event.finishReason;
        usage = event.usage;
        costUsd = event.costUsd;
        break;
      case "error":
        error = event;
        finishReason = "error";
        break;
      default:
        // `start`, `step` and `tool-result` carry no content to accumulate.
        break;
    }
  }

  return { text, reasoning, toolCalls, finishReason, usage, costUsd, ...(error ? { error } : {}) };
}
