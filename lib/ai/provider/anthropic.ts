// The Anthropic transport.
//
// The one provider that is not OpenAI-compatible, and therefore the real test of
// the abstraction: system instructions are a top-level field rather than a
// message, tool calls are content blocks rather than a parallel array, tool
// results are user messages, and the streaming protocol is a block-oriented state
// machine rather than a flat delta feed.
//
// All of that is translated here. Nothing above `AIProvider` can tell which of
// the two dialects served a request, which is exactly the property the task asked
// for.

import { ProviderError } from "../errors";
import type { AIStreamEvent } from "../streaming/events";
import { iterateStream, parseSSE } from "../streaming/sse";
import { assertSupported, costOf, resolveDescriptor } from "./dispatch";
import type { AIMessage, ContentPart, FinishReason, TokenUsage, ToolCall } from "./message";
import { ANTHROPIC_PROTECTED_FIELDS, connect, sanitizeProviderOptions } from "./transport";
import type {
  AIProvider,
  ProviderCapabilities,
  ProviderCredentials,
  ProviderRequest,
  ProviderResponse,
  ProviderRuntimeOptions,
} from "./types";

export const ANTHROPIC_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: true,
  vision: true,
  // No JSON mode; schema conformance is achieved by forcing a tool call, which is
  // a different mechanism and not claimed as the same capability.
  jsonMode: false,
  structuredOutputs: false,
  promptCaching: true,
};

const ANTHROPIC_VERSION = "2023-06-01";

/** Required by the API and unlimited in this stack's types, so a ceiling is needed. */
const DEFAULT_MAX_TOKENS = 4_096;

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic" as const;
  readonly capabilities = ANTHROPIC_CAPABILITIES;

  constructor(
    private readonly credentials: ProviderCredentials,
    private readonly runtime: ProviderRuntimeOptions = {},
  ) {}

  async generate(request: ProviderRequest, signal?: AbortSignal): Promise<ProviderResponse> {
    const model = resolveDescriptor(request.model);
    assertSupported(request, model, this.capabilities, false, this.id);

    const startedAt = Date.now();
    const { response, deadline } = await this.connect(request, model, false, signal);
    let payload: AnthropicMessage;
    try {
      payload = (await response.json()) as AnthropicMessage;
    } finally {
      // Reading the body is still on the clock, so the deadline outlives connect.
      deadline.release();
    }

    const content: ContentPart[] = [];
    const toolCalls: ToolCall[] = [];
    for (const block of payload.content ?? []) {
      if (block.type === "text" && block.text) content.push({ type: "text", text: block.text });
      if (block.type === "thinking" && block.thinking) {
        content.unshift({ type: "reasoning", text: block.thinking });
      }
      if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id ?? "",
          name: block.name ?? "",
          // The stack's `ToolCall.arguments` is JSON text; the API returns a
          // parsed object, so it is re-serialised to keep one representation.
          arguments: JSON.stringify(block.input ?? {}),
        });
      }
    }

    return {
      id: payload.id ?? "",
      model: model.id,
      content,
      toolCalls,
      finishReason: mapStopReason(payload.stop_reason),
      usage: mapUsage(payload.usage),
      latencyMs: Date.now() - startedAt,
    };
  }

  async *stream(request: ProviderRequest, signal?: AbortSignal): AsyncIterable<AIStreamEvent> {
    const model = resolveDescriptor(request.model);
    assertSupported(request, model, this.capabilities, true, this.id);

    const startedAt = Date.now();
    const { response, deadline } = await this.connect(request, model, true, signal);
    if (!response.body) {
      deadline.release();
      throw new ProviderError(this.id, "The provider returned a streaming response with no body");
    }

    yield { type: "start", conversationId: "", messageId: "", providerId: this.id, model: model.id };

    // Blocks are addressed by index and interleaved, so partial state is kept per
    // index and only emitted when that block closes.
    const blocks = new Map<number, { type: string; id: string; name: string; json: string }>();
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    let finishReason: FinishReason = "stop";
    let sawToolUse = false;

    // Past this point there is no second attempt: the caller already holds a
    // `start` event, so a mid-stream failure propagates instead of replaying a
    // request that has already produced tokens.
    try {
      for await (const frame of parseSSE(iterateStream(response.body))) {
        let event: AnthropicStreamEvent;
        try {
          event = JSON.parse(frame.data) as AnthropicStreamEvent;
        } catch {
          continue;
        }

        switch (event.type) {
          case "message_start":
            usage = mapUsage(event.message?.usage);
            break;

          case "content_block_start":
            if (event.index !== undefined && event.content_block) {
              blocks.set(event.index, {
                type: event.content_block.type,
                id: event.content_block.id ?? "",
                name: event.content_block.name ?? "",
                json: "",
              });
            }
            break;

          case "content_block_delta": {
            const delta = event.delta;
            if (delta?.type === "text_delta" && delta.text) {
              yield { type: "text-delta", text: delta.text };
            } else if (delta?.type === "thinking_delta" && delta.thinking) {
              yield { type: "reasoning-delta", text: delta.thinking };
            } else if (delta?.type === "input_json_delta" && event.index !== undefined) {
              const block = blocks.get(event.index);
              if (block) block.json += delta.partial_json ?? "";
            }
            break;
          }

          case "content_block_stop": {
            const block = event.index === undefined ? undefined : blocks.get(event.index);
            if (block?.type === "tool_use") {
              sawToolUse = true;
              yield {
                type: "tool-call",
                toolCall: { id: block.id, name: block.name, arguments: block.json || "{}" },
              };
            }
            break;
          }

          case "message_delta":
            if (event.delta?.stop_reason) finishReason = mapStopReason(event.delta.stop_reason);
            // Output tokens are only final on this event; input tokens came with
            // `message_start` and are preserved.
            if (event.usage?.output_tokens !== undefined) {
              usage = { ...usage, outputTokens: event.usage.output_tokens };
            }
            break;

          case "error":
            throw new ProviderError(this.id, `anthropic stream error: ${event.error?.message ?? ""}`, {
              retryable: event.error?.type === "overloaded_error",
            });

          default:
            break;
        }
      }

      yield {
        type: "finish",
        finishReason: sawToolUse ? "tool_calls" : finishReason,
        usage,
        costUsd: costOf(model, usage),
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      // Only the deadline can tell a timeout from a caller cancellation; both
      // reach here as `AbortError`.
      throw deadline.toError(error);
    } finally {
      deadline.release();
    }
  }

  /**
   * Opens the request. Timeout, retry and error typing live in `transport`, so
   * this dialect and the OpenAI-compatible one get exactly the same policy.
   */
  private connect(
    request: ProviderRequest,
    model: { wireName: string; maxOutputTokens: number },
    stream: boolean,
    signal?: AbortSignal,
  ): ReturnType<typeof connect> {
    return connect(
      this.id,
      () => ({
        url: `${this.credentials.baseUrl}/messages`,
        headers: {
          "x-api-key": this.credentials.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          ...this.credentials.headers,
        },
        body: this.buildBody(request, model.wireName, model.maxOutputTokens, stream),
      }),
      this.runtime,
      signal,
    );
  }

  private buildBody(
    request: ProviderRequest,
    wireModel: string,
    modelMaxTokens: number,
    stream: boolean,
  ): Record<string, unknown> {
    const params = request.params ?? {};

    // System and developer layers are not messages here. Joining them preserves
    // their precedence order while fitting the single `system` field.
    const system = request.messages
      .filter((message) => message.role === "system" || message.role === "developer")
      .map((message) => (typeof message.content === "string" ? message.content : ""))
      .filter((text) => text !== "")
      .join("\n\n");

    return {
      // First, so the pipeline's fields win on collision. The sanitiser has
      // already removed the protected keys; this ordering is what keeps that true
      // if a field is added below and the list is not updated with it.
      ...sanitizeProviderOptions(request.providerOptions, ANTHROPIC_PROTECTED_FIELDS),
      model: wireModel,
      messages: toAnthropicMessages(request.messages),
      ...(system ? { system } : {}),
      max_tokens: Math.min(params.maxOutputTokens ?? DEFAULT_MAX_TOKENS, modelMaxTokens),
      stream,
      ...(params.temperature === undefined ? {} : { temperature: params.temperature }),
      ...(params.topP === undefined ? {} : { top_p: params.topP }),
      ...(params.stop === undefined ? {} : { stop_sequences: [...params.stop] }),
      ...(request.tools && request.tools.length > 0
        ? {
            tools: request.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              input_schema: tool.parameters,
            })),
            ...(request.toolChoice ? { tool_choice: toAnthropicToolChoice(request.toolChoice) } : {}),
          }
        : {}),
    };
  }
}

// --- wire mapping ------------------------------------------------------------

/**
 * Converts the conversation to Anthropic's shape.
 *
 * Tool results are `user` messages containing `tool_result` blocks, and
 * consecutive results must be merged into one message — sending them separately
 * is rejected. That merge is the reason this is a fold rather than a map.
 */
function toAnthropicMessages(messages: readonly AIMessage[]): unknown[] {
  const output: { role: string; content: unknown[] }[] = [];

  for (const message of messages) {
    if (message.role === "system" || message.role === "developer") continue;

    if (message.role === "tool") {
      const block = {
        type: "tool_result",
        tool_use_id: message.toolCallId,
        content: message.content,
        ...(message.isError ? { is_error: true } : {}),
      };
      const last = output[output.length - 1];
      if (last?.role === "user") last.content.push(block);
      else output.push({ role: "user", content: [block] });
      continue;
    }

    if (message.role === "assistant") {
      const content: unknown[] = toAnthropicParts(message.content);
      for (const call of message.toolCalls ?? []) {
        content.push({
          type: "tool_use",
          id: call.id,
          name: call.name,
          input: safeParseObject(call.arguments),
        });
      }
      output.push({ role: "assistant", content });
      continue;
    }

    output.push({ role: "user", content: toAnthropicParts(message.content) });
  }

  return output;
}

function toAnthropicParts(content: string | readonly ContentPart[]): unknown[] {
  if (typeof content === "string") return content === "" ? [] : [{ type: "text", text: content }];

  return content.flatMap((part): unknown[] => {
    if (part.type === "text") return [{ type: "text", text: part.text }];
    if (part.type === "image") {
      // Base64 is the portable form: a URL source is not accepted for every media
      // type, so an image without inline data is dropped rather than rejected.
      return part.data
        ? [{ type: "image", source: { type: "base64", media_type: part.mediaType, data: part.data } }]
        : [];
    }
    return [];
  });
}

function toAnthropicToolChoice(choice: NonNullable<ProviderRequest["toolChoice"]>): unknown {
  if (choice === "auto") return { type: "auto" };
  if (choice === "required") return { type: "any" };
  if (choice === "none") return { type: "none" };
  return { type: "tool", name: choice.name };
}

function safeParseObject(json: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(json || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function mapStopReason(reason: string | null | undefined): FinishReason {
  switch (reason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
      return "length";
    case "tool_use":
      return "tool_calls";
    case "refusal":
      return "content_filter";
    default:
      return "stop";
  }
}

function mapUsage(usage: AnthropicUsage | undefined): TokenUsage {
  const cached = usage?.cache_read_input_tokens ?? 0;
  return {
    // Cache reads are billed separately and are not included in `input_tokens`,
    // so they are added here to make the total comparable across providers.
    inputTokens: (usage?.input_tokens ?? 0) + cached,
    outputTokens: usage?.output_tokens ?? 0,
    ...(cached > 0 ? { cachedInputTokens: cached } : {}),
  };
}

// --- wire types --------------------------------------------------------------

type AnthropicUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
};

type AnthropicBlock = {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
};

type AnthropicMessage = {
  id?: string;
  content?: AnthropicBlock[];
  stop_reason?: string | null;
  usage?: AnthropicUsage;
};

type AnthropicStreamEvent = {
  type: string;
  index?: number;
  message?: { usage?: AnthropicUsage };
  content_block?: { type: string; id?: string; name?: string };
  delta?: {
    type?: string;
    text?: string;
    thinking?: string;
    partial_json?: string;
    stop_reason?: string | null;
  };
  usage?: { output_tokens?: number };
  error?: { type?: string; message?: string };
};

export function createAnthropicProvider(
  credentials: ProviderCredentials,
  runtime?: ProviderRuntimeOptions,
): AIProvider {
  return new AnthropicProvider(credentials, runtime);
}

export default createAnthropicProvider;
