// The shared OpenAI-compatible transport.
//
// Five of the seven providers speak the `/chat/completions` dialect: the vendor
// itself, Azure, OpenRouter, Ollama and Gemini's compatibility endpoint. They
// differ in base URL, authentication header and a handful of quirks — nothing
// that justifies five copies of the same request builder, SSE reader and error
// mapper. Each of those five is a factory over this class.
//
// The class is exported so the thin factories can extend behaviour where a vendor
// genuinely diverges, without any of that leaking above `AIProvider`.

import { ProviderError } from "../errors";
import type { AIStreamEvent } from "../streaming/events";
import { iterateStream, parseSSE, SSE_DONE } from "../streaming/sse";
import { assertSupported, costOf, resolveDescriptor } from "./dispatch";
import { connect, OPENAI_PROTECTED_FIELDS, sanitizeProviderOptions } from "./transport";
import type {
  AIMessage,
  ContentPart,
  FinishReason,
  ProviderId,
  TokenUsage,
  ToolCall,
} from "./message";
import type {
  AIProvider,
  ProviderCapabilities,
  ProviderCredentials,
  ProviderRequest,
  ProviderResponse,
  ProviderRuntimeOptions,
  ToolSchema,
} from "./types";

export type OpenAICompatibleOptions = {
  id: ProviderId;
  credentials: ProviderCredentials;
  capabilities: ProviderCapabilities;
  /**
   * Builds the auth header. Vendors disagree: a bearer token, an `api-key`
   * header, or nothing at all for a local runtime.
   */
  authHeaders: (credentials: ProviderCredentials) => Record<string, string>;
  /** Azure appends `?api-version=`; everyone else uses the plain path. */
  completionsUrl?: (credentials: ProviderCredentials) => string;
  /** Timeout, retry budget and the injected `fetch`. Defaults in `transport.ts`. */
  runtime?: ProviderRuntimeOptions;
};

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;

  private readonly runtime: ProviderRuntimeOptions;

  constructor(private readonly options: OpenAICompatibleOptions) {
    this.id = options.id;
    this.capabilities = options.capabilities;
    this.runtime = options.runtime ?? {};
  }

  async generate(request: ProviderRequest, signal?: AbortSignal): Promise<ProviderResponse> {
    const model = resolveDescriptor(request.model);
    assertSupported(request, model, this.capabilities, false, this.id);

    const startedAt = Date.now();
    const { response, deadline } = await this.connect(request, model.wireName, false, signal);
    let payload: ChatCompletion;
    try {
      payload = (await response.json()) as ChatCompletion;
    } finally {
      // The deadline covers reading the body too, so it is only released once
      // the body is in hand.
      deadline.release();
    }

    const choice = payload.choices?.[0];
    const message = choice?.message;
    const content: ContentPart[] = message?.content ? [{ type: "text", text: message.content }] : [];
    if (message?.reasoning_content) {
      content.unshift({ type: "reasoning", text: message.reasoning_content });
    }

    return {
      id: payload.id ?? "",
      model: model.id,
      content,
      toolCalls: (message?.tool_calls ?? []).map(
        (call): ToolCall => ({
          id: call.id,
          name: call.function.name,
          arguments: call.function.arguments,
        }),
      ),
      finishReason: mapFinishReason(choice?.finish_reason),
      usage: mapUsage(payload.usage),
      latencyMs: Date.now() - startedAt,
    };
  }

  async *stream(request: ProviderRequest, signal?: AbortSignal): AsyncIterable<AIStreamEvent> {
    const model = resolveDescriptor(request.model);
    assertSupported(request, model, this.capabilities, true, this.id);

    const startedAt = Date.now();
    const { response, deadline } = await this.connect(request, model.wireName, true, signal);
    if (!response.body) {
      deadline.release();
      throw new ProviderError(this.id, "The provider returned a streaming response with no body");
    }

    yield {
      type: "start",
      conversationId: "",
      messageId: "",
      providerId: this.id,
      model: model.id,
    };

    // Tool calls arrive as deltas keyed by index: the id and name in one frame,
    // the arguments accumulated across many. They are only complete at the end of
    // the stream, so they are assembled here and emitted once.
    const pending = new Map<number, { id: string; name: string; arguments: string }>();
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    let finishReason: FinishReason = "stop";

    // Everything past this point is one attempt with no second chance: the caller
    // already has a `start` event, so a mid-body failure propagates rather than
    // being retried. The deadline is released whichever way the loop ends,
    // including a consumer that abandons the generator early.
    try {
      for await (const frame of parseSSE(iterateStream(response.body))) {
        if (frame.data === SSE_DONE) break;

        let chunk: ChatCompletionChunk;
        try {
          chunk = JSON.parse(frame.data) as ChatCompletionChunk;
        } catch {
          // A malformed frame is a framing bug, not a model output. Skipping it is
          // preferable to failing a stream that is otherwise well-formed.
          continue;
        }

        if (chunk.usage) usage = mapUsage(chunk.usage);

        const choice = chunk.choices?.[0];
        if (!choice) continue;
        if (choice.finish_reason) finishReason = mapFinishReason(choice.finish_reason);

        const delta = choice.delta;
        if (delta?.reasoning_content) {
          yield { type: "reasoning-delta", text: delta.reasoning_content };
        }
        if (delta?.content) {
          yield { type: "text-delta", text: delta.content };
        }

        for (const call of delta?.tool_calls ?? []) {
          const existing = pending.get(call.index) ?? { id: "", name: "", arguments: "" };
          pending.set(call.index, {
            id: call.id ?? existing.id,
            name: call.function?.name ?? existing.name,
            arguments: existing.arguments + (call.function?.arguments ?? ""),
          });
        }
      }

      for (const call of pending.values()) {
        yield {
          type: "tool-call",
          toolCall: { id: call.id, name: call.name, arguments: call.arguments },
        };
      }

      yield {
        type: "finish",
        finishReason: pending.size > 0 ? "tool_calls" : finishReason,
        usage,
        costUsd: costOf(model, usage),
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      // An abort reads as `AbortError` whoever caused it; only the deadline knows
      // whether the caller cancelled or the request ran out of time.
      throw deadline.toError(error);
    } finally {
      deadline.release();
    }
  }

  private url(): string {
    const { credentials, completionsUrl } = this.options;
    return completionsUrl
      ? completionsUrl(credentials)
      : `${credentials.baseUrl}/chat/completions`;
  }

  /**
   * Opens the request. Timeout, retry and error typing all live in `transport`.
   *
   * Retries stop the instant a response exists, so `stream` is never replayed
   * after its first token.
   */
  private connect(
    request: ProviderRequest,
    wireModel: string,
    stream: boolean,
    signal?: AbortSignal,
  ): ReturnType<typeof connect> {
    return connect(
      this.id,
      () => ({
        url: this.url(),
        headers: {
          ...this.options.authHeaders(this.options.credentials),
          ...this.options.credentials.headers,
        },
        body: this.buildBody(request, wireModel, stream),
      }),
      this.runtime,
      signal,
    );
  }

  private buildBody(request: ProviderRequest, wireModel: string, stream: boolean): Record<string, unknown> {
    const model = resolveDescriptor(request.model);
    const params = request.params ?? {};

    // Reasoning models reject sampling parameters and use a different token
    // field, so the two shapes are built separately rather than patched.
    const tokenField = model.capabilities.reasoning ? "max_completion_tokens" : "max_tokens";
    const sampling = model.capabilities.reasoning
      ? { ...(params.reasoningEffort ? { reasoning_effort: params.reasoningEffort } : {}) }
      : {
          ...(params.temperature === undefined ? {} : { temperature: params.temperature }),
          ...(params.topP === undefined ? {} : { top_p: params.topP }),
          ...(params.frequencyPenalty === undefined
            ? {}
            : { frequency_penalty: params.frequencyPenalty }),
          ...(params.presencePenalty === undefined
            ? {}
            : { presence_penalty: params.presencePenalty }),
        };

    return {
      // Sanitised vendor options go first, so a field the pipeline decides
      // overwrites whatever the caller asked for rather than the other way round.
      // The sanitiser has already dropped the protected keys; the ordering is the
      // second lock, and it is the one that survives someone adding a field below
      // without remembering to add it to the list.
      ...sanitizeProviderOptions(request.providerOptions, OPENAI_PROTECTED_FIELDS),
      model: wireModel,
      messages: request.messages.map(toWireMessage),
      stream,
      // Without this, a streamed response reports no usage at all and every
      // conversation's cost silently reads as zero.
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      ...sampling,
      ...(params.maxOutputTokens === undefined ? {} : { [tokenField]: params.maxOutputTokens }),
      ...(params.stop === undefined ? {} : { stop: [...params.stop] }),
      ...(params.seed === undefined ? {} : { seed: params.seed }),
      ...(request.tools && request.tools.length > 0
        ? { tools: request.tools.map(toWireTool), tool_choice: toWireToolChoice(request.toolChoice) }
        : {}),
      ...(request.responseFormat ? { response_format: toWireResponseFormat(request.responseFormat) } : {}),
    };
  }
}

// --- wire mapping ------------------------------------------------------------

function toWireMessage(message: AIMessage): Record<string, unknown> {
  switch (message.role) {
    case "system":
      return { role: "system", content: message.content };
    case "developer":
      // Not every compatible endpoint knows the `developer` role; `system` is the
      // portable spelling and carries the same precedence on all of them.
      return { role: "system", content: message.content };
    case "tool":
      return { role: "tool", tool_call_id: message.toolCallId, content: message.content };
    case "assistant":
      return {
        role: "assistant",
        content: typeof message.content === "string" ? message.content : toWireParts(message.content),
        ...(message.toolCalls && message.toolCalls.length > 0
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                id: call.id,
                type: "function",
                function: { name: call.name, arguments: call.arguments },
              })),
            }
          : {}),
      };
    default:
      return {
        role: "user",
        content: typeof message.content === "string" ? message.content : toWireParts(message.content),
        ...(message.name ? { name: message.name } : {}),
      };
  }
}

function toWireParts(parts: readonly ContentPart[]): unknown[] {
  return parts.flatMap((part): unknown[] => {
    if (part.type === "text") return [{ type: "text", text: part.text }];
    if (part.type === "image") {
      const url = part.url ?? `data:${part.mediaType};base64,${part.data ?? ""}`;
      return [{ type: "image_url", image_url: { url, ...(part.detail ? { detail: part.detail } : {}) } }];
    }
    // Reasoning parts are model output, never input; file parts need a vendor
    // upload step this transport does not perform. Both are dropped rather than
    // sent in a shape the endpoint would reject.
    return [];
  });
}

function toWireTool(tool: ToolSchema): Record<string, unknown> {
  return {
    type: "function",
    function: { name: tool.name, description: tool.description, parameters: tool.parameters },
  };
}

function toWireToolChoice(choice: ProviderRequest["toolChoice"]): unknown {
  if (choice === undefined) return "auto";
  if (typeof choice === "string") return choice;
  return { type: "function", function: { name: choice.name } };
}

function toWireResponseFormat(format: NonNullable<ProviderRequest["responseFormat"]>): unknown {
  if (format.type === "json_schema") {
    return {
      type: "json_schema",
      json_schema: { name: format.name, schema: format.schema, strict: format.strict ?? true },
    };
  }
  return { type: format.type };
}

function mapFinishReason(reason: string | null | undefined): FinishReason {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "tool_calls":
    case "function_call":
      return "tool_calls";
    case "content_filter":
      return "content_filter";
    default:
      return "stop";
  }
}

function mapUsage(usage: ChatUsage | undefined): TokenUsage {
  const cached = usage?.prompt_tokens_details?.cached_tokens ?? 0;
  const reasoning = usage?.completion_tokens_details?.reasoning_tokens ?? 0;
  return {
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    ...(cached > 0 ? { cachedInputTokens: cached } : {}),
    ...(reasoning > 0 ? { reasoningTokens: reasoning } : {}),
  };
}

// --- wire types --------------------------------------------------------------
// Only the fields this transport reads. Declared locally rather than imported
// from a vendor SDK, which is the dependency the abstraction exists to avoid.

type ChatUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
};

type WireToolCall = { id: string; function: { name: string; arguments: string } };

type ChatCompletion = {
  id?: string;
  usage?: ChatUsage;
  choices?: {
    finish_reason?: string | null;
    message?: { content?: string | null; reasoning_content?: string | null; tool_calls?: WireToolCall[] };
  }[];
};

type ChatCompletionChunk = {
  usage?: ChatUsage;
  choices?: {
    finish_reason?: string | null;
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
      tool_calls?: {
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
  }[];
};
