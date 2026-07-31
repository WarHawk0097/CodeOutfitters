// The server-side barrel for the AI foundation.
//
// Application code imports from here; the internal module layout stays free to
// change. Provider transports are deliberately absent — they are reached only
// through `ProviderRegistry`, whose dynamic imports are what keep the six unused
// vendors out of any given bundle. Re-exporting them here would undo that.
//
// This module is server-only by construction: it re-exports `./config`, which
// imports `server-only`, so an accidental client import fails at build time
// rather than shipping a code path that reads credentials.

export {
  AI_CONFIG_DEFAULTS,
  AI_ENV_KEYS,
  PROVIDER_ENV_KEYS,
  assertNoPublicSecrets,
  getAIConfig,
  hasProviderCredentials,
  loadAIConfig,
  requireProviderCredentials,
  resetAIConfigCache,
  resolveModel,
  type AIConfig,
  type AIEnvironment,
} from "./config";

export {
  MODEL_CATALOG,
  estimateCostUsd,
  findModel,
  listModelsForProvider,
  type ModelCapabilities,
  type ModelDescriptor,
  type ModelPricing,
} from "./models";

export {
  AIError,
  CancelledError,
  ConfigurationError,
  PermissionError,
  ProviderError,
  RateLimitError,
  TimeoutError,
  ToolError,
  UnsupportedCapabilityError,
  ValidationError,
  isAIError,
  isRetryable,
  toAIError,
  type AIErrorCode,
} from "./errors";

export {
  EMPTY_USAGE,
  PROVIDER_IDS,
  addUsage,
  isProviderId,
  requiresVision,
  textOf,
  type AIMessage,
  type ContentPart,
  type FinishReason,
  type MessageRole,
  type ProviderId,
  type TokenUsage,
  type ToolCall,
} from "./provider/message";

export {
  type AIProvider,
  type GenerationParams,
  type ProviderCapabilities,
  type ProviderCredentials,
  type ProviderFactory,
  type ProviderRequest,
  type ProviderResponse,
  type ResponseFormat,
  type ToolChoice,
  type ToolSchema,
} from "./provider/types";

export { ProviderRegistry } from "./provider/registry";
export { assertSupported, costOf, resolveDescriptor } from "./provider/dispatch";

export {
  collectStream,
  isTerminalEvent,
  type AIStreamEvent,
  type StreamErrorEvent,
  type StreamFinishEvent,
} from "./streaming/events";
export { SSE_DONE, SSE_HEADERS, encodeSSE, parseSSE, toSSEStream } from "./streaming/sse";

export { PromptRegistry, orderByLayer } from "./prompts/registry";
export { toInstructionMessages, withInstructions } from "./prompts/compose";
export {
  PROMPT_LAYER_ORDER,
  placeholdersIn,
  type PromptLayer,
  type PromptTemplate,
  type PromptVariables,
  type RenderedPrompt,
} from "./prompts/types";
export { CORE_PROMPTS } from "./prompts/library/core";

export { ToolRegistry } from "./tools/registry";
export {
  TOOL_NAME_PATTERN,
  defineTool,
  type RegisteredTool,
  type ToolContext,
  type ToolDefinition,
  type ToolResult,
} from "./tools/types";

export {
  DenyAllPermissionChecker,
  GrantListPermissionChecker,
  denyAllPermissionChecker,
  requirePermission,
} from "./permissions/checker";
export {
  MUTATING_PERMISSIONS,
  PERMISSION_IDS,
  isMutating,
  isPermissionId,
  type PermissionChecker,
  type PermissionDecision,
  type PermissionId,
  type PermissionSubject,
} from "./permissions/types";

export { DefaultPlanner } from "./planner/planner";
export { RuleBasedIntentClassifier, ruleBasedIntentClassifier } from "./planner/intent";
export {
  INTENT_IDS,
  type Intent,
  type IntentClassifier,
  type Plan,
  type PlanRequest,
  type PlanStep,
  type Planner,
} from "./planner/types";

export {
  appendMessage,
  createConversation,
  deriveTitle,
  recomputeTotals,
  selectContext,
} from "./conversation/state";
export { InMemoryConversationStore } from "./conversation/in-memory-store";
export {
  toWireMessage,
  type Attachment,
  type Conversation,
  type ConversationMessage,
  type ConversationStore,
  type MessageMetrics,
} from "./conversation/types";

export { createInMemoryMemorySystem } from "./memory/in-memory";
export {
  type ConversationMemory,
  type LongTermMemory,
  type MemoryRecord,
  type MemorySystem,
  type SessionMemory,
  type UserPreferences,
  type WorkspaceMemory,
} from "./memory/types";

export {
  NullKnowledgeSource,
  formatChunksForPrompt,
  nullKnowledgeSource,
  type KnowledgeChunk,
  type KnowledgeQuery,
  type KnowledgeSource,
} from "./knowledge/types";

export {
  noopLogger,
  noopMetrics,
  noopTelemetry,
  noopTracer,
  type LogLevel,
  type Logger,
  type Metrics,
  type Span,
  type Telemetry,
  type Tracer,
} from "./observability/types";
export { InMemoryRateLimiter, withRetry, withTimeout } from "./observability/resilience";
export { REDACTED, redactFields, redactSecrets, summarizeText } from "./observability/redaction";

export { Orchestrator, type CopilotRequest, type OrchestratorDependencies } from "./pipeline/orchestrator";
