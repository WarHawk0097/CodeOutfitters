// The orchestrator.
//
// The one place the layers meet, and the only module that knows they all exist.
// It depends exclusively on interfaces — provider, planner, tool registry, prompt
// registry, conversation store, memory, knowledge, telemetry — so every layer can
// be replaced without touching this file, and this file can be tested end to end
// with no network, no database and no key.
//
// The order of operations is the design: rate limit, load, plan, permission-gate
// the tool set, retrieve, prompt, then a bounded tool loop. Each step narrows what
// the model can do before the model is ever called.

import { CancelledError, isAIError, toAIError, AIError } from "../errors";
import type { AIConfig } from "../config";
import { costOf, resolveDescriptor } from "../provider/dispatch";
import {
  addUsage,
  EMPTY_USAGE,
  type AIMessage,
  type FinishReason,
  type TokenUsage,
  type ToolCall,
} from "../provider/message";
import type { ProviderRegistry } from "../provider/registry";
import type { ToolSchema } from "../provider/types";
import type { AIStreamEvent } from "../streaming/events";
import type { PromptRegistry } from "../prompts/registry";
import { withInstructions } from "../prompts/compose";
import type { RenderedPrompt } from "../prompts/types";
import type { Plan, PlanStep, Planner } from "../planner/types";
import type { ToolRegistry } from "../tools/registry";
import { isMutating, type PermissionSubject } from "../permissions/types";
import type { ConversationStore } from "../conversation/types";
import { appendMessage, createConversation, deriveTitle, selectContext } from "../conversation/state";
import type { Conversation, ConversationMessage } from "../conversation/types";
import type { MemorySystem } from "../memory/types";
import { formatChunksForPrompt, type KnowledgeSource } from "../knowledge/types";
import type { Telemetry } from "../observability/types";
import { InMemoryRateLimiter } from "../observability/resilience";
import { redactingTelemetry, summarizeText } from "../observability/redaction";

export type OrchestratorDependencies = {
  config: AIConfig;
  providers: ProviderRegistry;
  tools: ToolRegistry;
  prompts: PromptRegistry;
  planner: Planner;
  conversations: ConversationStore;
  memory: MemorySystem;
  knowledge: KnowledgeSource;
  telemetry: Telemetry;
  rateLimiter: InMemoryRateLimiter;
  /** Injected so conversation timestamps and ids are deterministic in tests. */
  clock: () => Date;
  newId: () => string;
};

export type CopilotRequest = {
  subject: PermissionSubject;
  text: string;
  /** Omitted to start a new conversation. */
  conversationId?: string;
  /** Catalog model id. Overrides the configured default for this request only. */
  model?: string;
  /**
   * Set once a human has approved a state-changing plan. Until then, mutating
   * tools are withheld — the model is never in a position to approve itself.
   */
  confirmed?: boolean;
  /** Interpolated into the system prompt. Never taken from client input. */
  workspaceName: string;
  signal?: AbortSignal;
};

export class Orchestrator {
  private readonly deps: OrchestratorDependencies;

  constructor(deps: OrchestratorDependencies) {
    // The single point where telemetry is made safe. Every logger, span and
    // metric below — including the `logger` handed to every tool — comes from
    // here, so no call site can opt out of redaction by forgetting about it, and
    // `config.redactPrompts` finally decides something.
    this.deps = {
      ...deps,
      telemetry: redactingTelemetry(deps.telemetry, {
        redactPrompts: deps.config.redactPrompts,
        logLevel: deps.config.logLevel,
      }),
    };
  }

  /**
   * Runs one turn, emitting events as they happen.
   *
   * A generator rather than a promise so a caller can stream to a browser, drain
   * it with `collectStream` for a non-streaming call, or stop reading to cancel —
   * all from the same implementation.
   */
  async *run(request: CopilotRequest): AsyncGenerator<AIStreamEvent, void, undefined> {
    const { config, telemetry, clock } = this.deps;
    const span = telemetry.tracer.startSpan("ai.turn", {
      workspaceId: request.subject.workspaceId,
      // The prompt itself is never traced — only its shape, which is enough to
      // correlate a trace with a report without storing customer text.
      prompt: summarizeText(request.text),
    });
    const startedAt = Date.now();

    try {
      this.deps.rateLimiter.consume(`${request.subject.workspaceId}:${request.subject.userId}`);

      const conversation = await this.loadOrCreate(request);
      const model = resolveDescriptor(request.model ?? config.defaultModel);

      const messageId = this.deps.newId();
      yield {
        type: "start",
        conversationId: conversation.id,
        messageId,
        providerId: config.provider,
        model: model.id,
      };

      const offeredTools = this.deps.tools.listFor(request.subject);
      const plan = await this.deps.planner.plan({
        text: request.text,
        subject: request.subject,
        hasHistory: conversation.messages.length > 0,
        availableTools: offeredTools.map((tool) => tool.name),
        knowledgeAvailable: this.deps.knowledge.id !== "null",
      });
      yield { type: "step", step: 1, label: `intent:${plan.intent.id}` };

      // Withholding mutating tools until a human has confirmed is enforced here,
      // not asked for in a prompt: the model is never handed a capability it
      // could be talked into using.
      const withheldMutations = plan.requiresConfirmation && !request.confirmed;
      const permittedNames = new Set(
        offeredTools
          .filter((tool) => !(withheldMutations && isMutating(tool.permission)))
          .map((tool) => tool.name),
      );
      if (withheldMutations) {
        yield { type: "step", step: 2, label: "awaiting-confirmation" };
      }

      const toolStep = findStep(plan, "tools");
      const toolSchemas: readonly ToolSchema[] = toolStep
        ? this.deps.tools.schemasFor(request.subject).filter((tool) => permittedNames.has(tool.name))
        : [];

      const reference = await this.retrieve(request, findStep(plan, "retrieve"));

      const now = clock().toISOString();
      const userMessage: ConversationMessage = {
        id: this.deps.newId(),
        role: "user",
        content: request.text,
        createdAt: now,
      };
      let working = appendMessage(conversation, userMessage);
      await this.deps.conversations.append(conversation.id, userMessage);

      const instructions = this.buildInstructions(request, reference);
      const provider = await this.deps.providers.get(config.provider);

      let usage: TokenUsage = EMPTY_USAGE;
      // The final answer only. Intermediate iterations are persisted as their own
      // messages, so accumulating them here would store the same text twice.
      let finalText = "";
      // Reported rather than assumed. "stop" for a turn that was actually cut off
      // at the token ceiling is a lie the caller cannot detect, and it is the one
      // signal that tells a UI whether to offer "continue".
      let finishReason: FinishReason = "stop";
      const maxIterations = toolStep ? toolStep.maxIterations : 1;

      for (let iteration = 0; iteration < maxIterations; iteration += 1) {
        request.signal?.throwIfAborted();

        const messages: readonly AIMessage[] = withInstructions(
          instructions,
          selectContext(working.messages, config.maxContextMessages),
        );

        const pendingCalls: ToolCall[] = [];
        let iterationText = "";

        for await (const event of provider.stream(
          {
            model: model.id,
            messages,
            params: { maxOutputTokens: model.maxOutputTokens },
            ...(toolSchemas.length > 0 ? { tools: toolSchemas, toolChoice: "auto" as const } : {}),
          },
          request.signal,
        )) {
          switch (event.type) {
            case "text-delta":
              iterationText += event.text;
              yield event;
              break;
            case "reasoning-delta":
              // Forwarded but never stored: reasoning is not part of the record.
              yield event;
              break;
            case "tool-call":
              pendingCalls.push(event.toolCall);
              yield event;
              break;
            case "finish":
              usage = addUsage(usage, event.usage);
              finishReason = event.finishReason;
              break;
            case "error":
              yield event;
              return;
            default:
              break;
          }
        }

        if (pendingCalls.length === 0) {
          finalText = iterationText;
          break;
        }

        // An intermediate turn: the model asked for tools rather than answering.
        // It is persisted with its calls, because a conversation reloaded without
        // them shows tool results that nothing requested — a shape several
        // providers reject outright, and one no reader can follow.
        const requestMessage: ConversationMessage = {
          id: this.deps.newId(),
          role: "assistant",
          content: iterationText,
          createdAt: clock().toISOString(),
          toolCalls: pendingCalls,
        };
        working = appendMessage(working, requestMessage);
        await this.deps.conversations.append(conversation.id, requestMessage);

        for (const call of pendingCalls) {
          // A call the plan did not permit is refused here rather than executed.
          // The model is told, so it can adapt, and nothing runs.
          const allowed = permittedNames.has(call.name);
          const toolStartedAt = Date.now();
          const result = allowed
            ? await this.invokeTool(call, request, conversation.id)
            : { content: `Tool "${call.name}" is not available in this context.`, isError: true };

          yield {
            type: "tool-result",
            toolCallId: call.id,
            name: call.name,
            result: result.content,
            isError: result.isError ?? false,
            durationMs: Date.now() - toolStartedAt,
          };

          const toolMessage: ConversationMessage = {
            id: this.deps.newId(),
            role: "tool",
            content: result.content,
            toolCallId: call.id,
            createdAt: clock().toISOString(),
            metadata: { toolName: call.name },
          };
          working = appendMessage(working, toolMessage);
          await this.deps.conversations.append(conversation.id, toolMessage);
        }
      }

      const latencyMs = Date.now() - startedAt;
      const assistantMessage: ConversationMessage = {
        id: messageId,
        role: "assistant",
        content: finalText,
        createdAt: clock().toISOString(),
        metrics: {
          providerId: provider.id,
          model: model.id,
          usage,
          costUsd: costOf(model, usage),
          latencyMs,
          finishReason,
        },
      };
      await this.deps.conversations.append(conversation.id, assistantMessage);

      this.deps.telemetry.metrics.record("ai.turn.latency_ms", latencyMs);
      this.deps.telemetry.metrics.record("ai.turn.tokens", usage.inputTokens + usage.outputTokens);

      yield {
        type: "finish",
        finishReason,
        usage,
        costUsd: costOf(model, usage),
        latencyMs,
      };
    } catch (error) {
      const failure = toAIError(error, () =>
        error instanceof Error && error.name === "AbortError"
          ? new CancelledError()
          : unexpectedFailure(error),
      );
      span.recordError(failure);
      this.deps.telemetry.metrics.increment("ai.turn.error", 1, { code: failure.code });
      // Only the client-safe projection is emitted; the raw message stays in the
      // trace and the log.
      yield {
        type: "error",
        code: failure.code,
        message: failure.safeMessage,
        retryable: failure.retryable,
      };
    } finally {
      span.end();
    }
  }

  /**
   * Resolves the conversation for this turn.
   *
   * Two rules, and they do not overlap. A request that names a conversation must
   * name one that already exists and belongs to the subject; a request that names
   * none gets a fresh, server-generated id.
   *
   * The id is never taken from the client, even for a new conversation. A
   * conversation id is the primary key of a stored row, so accepting one lets a
   * caller choose where their data lands: pick an id, get told it does not exist,
   * then create it — and now two tenants are one race apart from sharing a key,
   * or a future row can be squatted before its owner asks for it. Creation is the
   * server's to name.
   *
   * Both failures raise the same error with the same text. Distinguishing "not
   * yours" from "does not exist" would turn the endpoint into an oracle for
   * enumerating which ids are real.
   */
  private async loadOrCreate(request: CopilotRequest): Promise<Conversation> {
    if (request.conversationId) {
      const existing = await this.deps.conversations.get(request.conversationId);
      // Ownership is re-checked on every turn, not once at creation: a
      // conversation id is a guessable string, and possessing one must not grant
      // access to it.
      if (
        !existing ||
        existing.workspaceId !== request.subject.workspaceId ||
        existing.userId !== request.subject.userId
      ) {
        throw new CancelledError("Conversation not found");
      }
      return existing;
    }

    const now = this.deps.clock().toISOString();
    return this.deps.conversations.create(
      createConversation(
        {
          id: this.deps.newId(),
          workspaceId: request.subject.workspaceId,
          userId: request.subject.userId,
        },
        now,
        deriveTitle(request.text),
      ),
    );
  }

  private async retrieve(
    request: CopilotRequest,
    step: Extract<PlanStep, { kind: "retrieve" }> | undefined,
  ): Promise<string> {
    if (!step) return "";
    const chunks = await this.deps.knowledge.search(
      { workspaceId: request.subject.workspaceId, query: request.text, limit: step.limit },
      request.signal,
    );
    return formatChunksForPrompt(chunks);
  }

  /**
   * Builds the instruction stack.
   *
   * Retrieved reference material is appended as a developer-layer prompt, below
   * the system layer, and is labelled as data by `formatChunksForPrompt`.
   */
  private buildInstructions(request: CopilotRequest, reference: string): readonly RenderedPrompt[] {
    const prompts: RenderedPrompt[] = [
      this.deps.prompts.render("copilot.system", {
        workspaceName: request.workspaceName,
        currentDate: this.deps.clock().toISOString().slice(0, 10),
      }),
    ];

    if (this.deps.prompts.has("copilot.tool_use")) {
      prompts.push(this.deps.prompts.render("copilot.tool_use"));
    }

    if (reference !== "") {
      prompts.push({ id: "knowledge.reference", layer: "workspace", version: 1, text: reference });
    }

    return prompts;
  }

  /**
   * Runs one tool call, converting a failure into a result the model can read.
   *
   * A thrown error would end the turn; a failed tool usually should not. Returning
   * the safe message keeps the loop going while ensuring nothing internal reaches
   * the transcript.
   */
  private async invokeTool(
    call: ToolCall,
    request: CopilotRequest,
    conversationId: string,
  ): Promise<{ content: string; isError?: boolean }> {
    try {
      return await this.deps.tools.invoke(call.name, call.arguments, {
        subject: request.subject,
        conversationId,
        ...(request.signal ? { signal: request.signal } : {}),
        logger: this.deps.telemetry.logger,
      });
    } catch (error) {
      if (!isAIError(error)) throw error;
      this.deps.telemetry.logger.log("warn", "tool failed", {
        tool: call.name,
        code: error.code,
      });
      return { content: error.safeMessage, isError: true };
    }
  }
}

/**
 * Selects one step from a plan, narrowed to its variant.
 *
 * An explicit predicate rather than relying on inference, so the narrowing is
 * part of the signature and cannot quietly regress.
 */
function findStep<TKind extends PlanStep["kind"]>(
  plan: Plan,
  kind: TKind,
): Extract<PlanStep, { kind: TKind }> | undefined {
  return plan.steps.find(
    (step): step is Extract<PlanStep, { kind: TKind }> => step.kind === kind,
  );
}

/** Anything thrown that was not already typed. Never carries the original text. */
function unexpectedFailure(cause: unknown): AIError {
  return new AIError("ai/provider", cause instanceof Error ? cause.message : String(cause), {
    cause,
    retryable: false,
  });
}
