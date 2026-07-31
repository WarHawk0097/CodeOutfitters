// The mock provider.
//
// Every test in this stack runs against this and nothing else. That is the point
// of the whole provider abstraction: the planner, the tool loop, the conversation
// reducer and the streaming layer are all exercised end to end with no network,
// no key and no cost, and the assertions are exact because the output is
// deterministic.
//
// It also doubles as the safe default in `AI_CONFIG_DEFAULTS`: an unconfigured
// environment produces an obviously-fake answer rather than reaching for a
// credential that is not there.

import { CancelledError, type AIError } from "../errors";
import type { AIStreamEvent } from "../streaming/events";
import { assertSupported, costOf, resolveDescriptor } from "./dispatch";
import { textOf, type FinishReason, type TokenUsage, type ToolCall } from "./message";
import type {
  AIProvider,
  ProviderCapabilities,
  ProviderCredentials,
  ProviderRequest,
  ProviderResponse,
} from "./types";

/** One scripted turn. Consumed in order; the last entry repeats once exhausted. */
export type MockTurn = {
  text?: string;
  toolCalls?: readonly ToolCall[];
  finishReason?: FinishReason;
  usage?: TokenUsage;
  /** Thrown instead of answering. Used to exercise retry and error mapping. */
  error?: AIError;
  /** Simulated latency. Reported, never actually waited. */
  latencyMs?: number;
};

export type MockProviderOptions = {
  turns?: readonly MockTurn[];
  /** Characters per streamed delta. Small values exercise the chunking paths. */
  chunkSize?: number;
};

/**
 * Deterministic in-process provider.
 *
 * With no script it echoes the last user message, which makes it useful as a
 * development default; with a script it reproduces any provider behaviour the
 * layers above need to handle, including failures.
 */
export class MockProvider implements AIProvider {
  readonly id = "mock" as const;

  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    vision: true,
    jsonMode: true,
    structuredOutputs: true,
    promptCaching: false,
  };

  /** Every request received, in order. The assertion surface for the tests. */
  readonly requests: ProviderRequest[] = [];

  private turnIndex = 0;

  constructor(private readonly options: MockProviderOptions = {}) {}

  async generate(request: ProviderRequest, signal?: AbortSignal): Promise<ProviderResponse> {
    const model = resolveDescriptor(request.model);
    assertSupported(request, model, this.capabilities, false, this.id);
    signal?.throwIfAborted();

    this.requests.push(request);
    const turn = this.nextTurn(request);
    if (turn.error) throw turn.error;

    const usage = turn.usage ?? this.estimateUsage(request, turn.text ?? "");
    return {
      id: `mock-${this.requests.length}`,
      model: model.id,
      content: turn.text ? [{ type: "text", text: turn.text }] : [],
      toolCalls: turn.toolCalls ?? [],
      finishReason: turn.finishReason ?? (turn.toolCalls?.length ? "tool_calls" : "stop"),
      usage,
      latencyMs: turn.latencyMs ?? 1,
    };
  }

  async *stream(request: ProviderRequest, signal?: AbortSignal): AsyncIterable<AIStreamEvent> {
    const model = resolveDescriptor(request.model);
    assertSupported(request, model, this.capabilities, true, this.id);

    this.requests.push(request);
    const turn = this.nextTurn(request);

    yield {
      type: "start",
      conversationId: "mock",
      messageId: `mock-${this.requests.length}`,
      providerId: this.id,
      model: model.id,
    };

    if (turn.error) {
      const error = turn.error;
      yield { type: "error", code: error.code, message: error.safeMessage, retryable: error.retryable };
      return;
    }

    const text = turn.text ?? "";
    const chunkSize = this.options.chunkSize ?? 8;
    for (let index = 0; index < text.length; index += chunkSize) {
      // Checked between chunks so an abort mid-stream is observed promptly and
      // surfaces as cancellation rather than as a truncated success.
      if (signal?.aborted) {
        const cancelled = new CancelledError();
        yield {
          type: "error",
          code: cancelled.code,
          message: cancelled.safeMessage,
          retryable: false,
        };
        return;
      }
      yield { type: "text-delta", text: text.slice(index, index + chunkSize) };
    }

    for (const toolCall of turn.toolCalls ?? []) {
      yield { type: "tool-call", toolCall };
    }

    const usage = turn.usage ?? this.estimateUsage(request, text);
    yield {
      type: "finish",
      finishReason: turn.finishReason ?? (turn.toolCalls?.length ? "tool_calls" : "stop"),
      usage,
      costUsd: costOf(model, usage),
      latencyMs: turn.latencyMs ?? 1,
    };
  }

  /** Scripted turns are consumed in order; the final one repeats. */
  private nextTurn(request: ProviderRequest): MockTurn {
    const turns = this.options.turns ?? [];
    if (turns.length === 0) return { text: `echo: ${lastUserText(request)}` };
    const turn = turns[Math.min(this.turnIndex, turns.length - 1)];
    this.turnIndex += 1;
    return turn ?? { text: "" };
  }

  /**
   * Token counts by a fixed characters-per-token ratio.
   *
   * Not accurate, and not meant to be — it is stable, which is what lets the
   * accounting tests assert exact numbers.
   */
  private estimateUsage(request: ProviderRequest, text: string): TokenUsage {
    const inputChars = request.messages.reduce(
      (total, message) =>
        total + (message.role === "tool" ? message.content.length : textOf(message.content).length),
      0,
    );
    return { inputTokens: Math.ceil(inputChars / 4), outputTokens: Math.ceil(text.length / 4) };
  }
}

function lastUserText(request: ProviderRequest): string {
  for (let index = request.messages.length - 1; index >= 0; index -= 1) {
    const message = request.messages[index];
    if (message?.role === "user") return textOf(message.content);
  }
  return "";
}

/** Matches `ProviderFactory`. Credentials are accepted and ignored. */
export function createMockProvider(_credentials: ProviderCredentials): AIProvider {
  return new MockProvider();
}

export default createMockProvider;
