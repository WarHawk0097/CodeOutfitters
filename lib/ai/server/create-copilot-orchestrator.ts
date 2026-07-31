// The server composition root for the Copilot endpoint.
//
// One place assembles the orchestrator, and it is not the route handler. The
// route decides HTTP; this module decides which implementation of each seam the
// running server uses, so the two can be reasoned about — and tested — apart.
//
// Read-only by construction, not by policy: the tool registry is built empty and
// its permission checker denies everything, so there is no capability for a
// crafted prompt to reach. Nothing here can send mail, write a record or touch
// the database.
//
// Lifetime notes, because they are load-bearing rather than incidental:
//   - The conversation store, the memory system and the rate limiter are held
//     per process. They have to be, or a conversation id would not survive the
//     next request and a rate limit would reset on every one.
//   - Per process also means per instance. Nothing here is shared between
//     serverless instances and nothing survives a redeploy. See the limits noted
//     on `sharedRateLimiter` below.

import "server-only";
import { randomUUID } from "node:crypto";
import {
  ConfigurationError,
  CORE_PROMPTS,
  DefaultPlanner,
  InMemoryConversationStore,
  InMemoryRateLimiter,
  Orchestrator,
  PromptRegistry,
  ProviderRegistry,
  ToolRegistry,
  createInMemoryMemorySystem,
  denyAllPermissionChecker,
  getAIConfig,
  isAIError,
  nullKnowledgeSource,
  type AIConfig,
  type AIEnvironment,
  type Logger,
  type LogLevel,
  type Metrics,
  type OrchestratorDependencies,
  type Span,
  type Telemetry,
  type Tracer,
} from "@/lib/ai";

type Fields = Readonly<Record<string, unknown>>;

/**
 * Refuses the in-process mock transport in a production deployment.
 *
 * `AI_CONFIG_DEFAULTS` falls back to `mock` so an unconfigured environment boots
 * rather than crashing at import. That is the right default everywhere except
 * production, where it would mean shipping fabricated answers to real users under
 * the product's own name. The environment is a parameter so this is testable
 * without a production-only branch anywhere in the request path.
 */
export function assertUsableProvider(config: AIConfig, env: AIEnvironment = process.env): void {
  if (config.provider === "mock" && env.NODE_ENV === "production") {
    throw new ConfigurationError("No AI provider is configured for this deployment.");
  }
}

/**
 * Structured logging that carries the correlation id and nothing sensitive.
 *
 * Only metadata is emitted here — level, message, correlation id, and whatever
 * safe fields the caller passed. Message bodies never reach this logger in the
 * first place: the orchestrator wraps whatever it is given in `redactingTelemetry`
 * before any layer can use it, and the tracer below deliberately drops the span
 * attributes rather than forwarding them.
 */
class CorrelatedLogger implements Logger {
  constructor(private readonly fields: Fields) {}

  log(level: LogLevel, message: string, fields?: Fields): void {
    const line = JSON.stringify({ level, message, ...this.fields, ...fields });
    if (level === "error" || level === "warn") console.error(line);
    else console.log(line);
  }

  child(fields: Fields): Logger {
    return new CorrelatedLogger({ ...this.fields, ...fields });
  }
}

/** Telemetry for one request. Emits safe metadata; never prompts or results. */
export function copilotTelemetry(correlationId: string): Telemetry {
  const logger: Logger = new CorrelatedLogger({ correlationId });

  const tracer: Tracer = {
    startSpan(name: string): Span {
      return {
        // Span attributes are dropped rather than logged: the orchestrator puts a
        // summary of the prompt in them, and a summary is still derived from
        // customer text.
        setAttributes(): void {},
        recordError(error: unknown): void {
          logger.log("error", `${name} failed`, {
            code: isAIError(error) ? error.code : "unknown",
          });
        },
        end(): void {},
      };
    },
  };

  const metrics: Metrics = {
    increment(name, value = 1, tags) {
      logger.log("info", name, { value, ...tags });
    },
    record(name, value, tags) {
      logger.log("info", name, { value, ...tags });
    },
  };

  return { logger, tracer, metrics };
}

// Per-process state. Held here rather than per request so a conversation id and a
// rate-limit window mean something across two calls from the same browser.
const conversations = new InMemoryConversationStore();
const memory = createInMemoryMemorySystem();
/** No tool is registered, and the checker denies every capability regardless. */
const tools = new ToolRegistry(denyAllPermissionChecker);
const prompts = new PromptRegistry(CORE_PROMPTS);

let providers: ProviderRegistry | undefined;
let rateLimiter: InMemoryRateLimiter | undefined;

/** Cached so a credential is read once per process, not once per request. */
function sharedProviders(config: AIConfig): ProviderRegistry {
  providers ??= new ProviderRegistry(config);
  return providers;
}

/**
 * The request budget, per subject, per minute.
 *
 * INSTANCE-LOCAL. This counts requests inside one process: it resets on
 * redeploy and is not shared between serverless instances, so it bounds a single
 * client's cost rather than enforcing a distributed quota. A durable limiter is
 * a replacement for this object, not a change to any caller.
 */
function sharedRateLimiter(config: AIConfig): InMemoryRateLimiter {
  rateLimiter ??= new InMemoryRateLimiter(config.requestsPerMinute, 60_000);
  return rateLimiter;
}

export type CopilotOrchestratorOptions = {
  correlationId: string;
  /** Replaced seams. The production route passes none. */
  overrides?: Partial<OrchestratorDependencies>;
};

export function createCopilotOrchestrator(options: CopilotOrchestratorOptions): Orchestrator {
  const config = options.overrides?.config ?? getAIConfig();
  assertUsableProvider(config);

  return new Orchestrator({
    config,
    providers: sharedProviders(config),
    tools,
    prompts,
    planner: new DefaultPlanner({ maxToolIterations: config.maxToolIterations }),
    conversations,
    memory,
    // No retrieval in this slice. The null source reports itself as unavailable,
    // which is what stops the planner from ever adding a retrieve step.
    knowledge: nullKnowledgeSource,
    telemetry: copilotTelemetry(options.correlationId),
    rateLimiter: sharedRateLimiter(config),
    clock: () => new Date(),
    newId: () => randomUUID(),
    ...options.overrides,
  });
}
