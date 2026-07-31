// The single AI configuration.
//
// Every knob the stack has is declared here and nowhere else: no module reads
// `process.env` for itself, and no module carries its own default timeout or
// retry count. That is what makes the provider swap a one-value change — set
// `AI_PROVIDER` and `AI_DEFAULT_MODEL`, restart, done.
//
// This module is server-only. Credentials are resolved lazily, per provider, and
// are never bundled into a config object that something might serialise. The
// presence helpers exist precisely so that a health check or an admin screen can
// ask "is this configured" and receive a boolean rather than a secret.
import "server-only";

import { ConfigurationError } from "./errors";
import { findModel, type ModelDescriptor } from "./models";
import { isProviderId, type ProviderId } from "./provider/message";
import type { ProviderCredentials } from "./provider/types";

/** The environment shape this module reads. Injectable, so tests never mutate globals. */
export type AIEnvironment = Readonly<Record<string, string | undefined>>;

export type AIConfig = {
  /** The one value that decides which vendor serves every request. */
  provider: ProviderId;
  /** Catalog model id, not a wire name. */
  defaultModel: string;
  /** Used when the default is unavailable for a request's capabilities. */
  fallbackModel: string;
  requestTimeoutMs: number;
  /** Attempts after the first, for retryable failures only. */
  maxRetries: number;
  /** Hard ceiling on tool-loop iterations. Bounds cost and stops runaway loops. */
  maxToolIterations: number;
  /** Trailing messages kept when a conversation is compacted for a request. */
  maxContextMessages: number;
  /** Requests started per minute, per subject, before `RateLimitError`. */
  requestsPerMinute: number;
  logLevel: "debug" | "info" | "warn" | "error" | "silent";
  /** When true, message bodies are dropped from logs and traces. */
  redactPrompts: boolean;
};

/**
 * Defaults chosen to be safe rather than fast: the mock provider means an
 * unconfigured environment starts and fails closed at the first real request
 * instead of at import time, and prompt redaction is on unless deliberately
 * disabled for local debugging.
 */
export const AI_CONFIG_DEFAULTS: AIConfig = {
  provider: "mock",
  defaultModel: "mock-model",
  fallbackModel: "mock-model",
  requestTimeoutMs: 60_000,
  maxRetries: 2,
  maxToolIterations: 8,
  maxContextMessages: 40,
  requestsPerMinute: 30,
  logLevel: "info",
  redactPrompts: true,
};

/** Every environment variable this stack reads. One list, for docs and for tests. */
export const AI_ENV_KEYS = {
  provider: "AI_PROVIDER",
  defaultModel: "AI_DEFAULT_MODEL",
  fallbackModel: "AI_FALLBACK_MODEL",
  requestTimeoutMs: "AI_REQUEST_TIMEOUT_MS",
  maxRetries: "AI_MAX_RETRIES",
  maxToolIterations: "AI_MAX_TOOL_ITERATIONS",
  maxContextMessages: "AI_MAX_CONTEXT_MESSAGES",
  requestsPerMinute: "AI_REQUESTS_PER_MINUTE",
  logLevel: "AI_LOG_LEVEL",
  redactPrompts: "AI_REDACT_PROMPTS",
} as const;

const LOG_LEVELS: readonly AIConfig["logLevel"][] = ["debug", "info", "warn", "error", "silent"];

/**
 * Credential variables, per provider.
 *
 * Names only. This table is safe to log, safe to render in an admin screen and
 * safe to copy into `.env.example` — which is the point of keeping it separate
 * from the values.
 */
export const PROVIDER_ENV_KEYS: Readonly<Record<ProviderId, { apiKey?: string; baseUrl?: string }>> =
  {
    openai: { apiKey: "OPENAI_API_KEY", baseUrl: "OPENAI_BASE_URL" },
    anthropic: { apiKey: "ANTHROPIC_API_KEY", baseUrl: "ANTHROPIC_BASE_URL" },
    gemini: { apiKey: "GEMINI_API_KEY", baseUrl: "GEMINI_BASE_URL" },
    "azure-openai": { apiKey: "AZURE_OPENAI_API_KEY", baseUrl: "AZURE_OPENAI_ENDPOINT" },
    openrouter: { apiKey: "OPENROUTER_API_KEY", baseUrl: "OPENROUTER_BASE_URL" },
    ollama: { baseUrl: "OLLAMA_BASE_URL" },
    mock: {},
  };

const DEFAULT_BASE_URLS: Readonly<Record<ProviderId, string>> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  "azure-openai": "",
  openrouter: "https://openrouter.ai/api/v1",
  // No default: where a local model server listens is deployment configuration,
  // not product source, and this repository does not hard-code a host anywhere.
  // `OLLAMA_BASE_URL` must be set for that provider to start.
  ollama: "",
  mock: "",
};

/**
 * Fails the process if a credential was published to the browser bundle.
 *
 * `NEXT_PUBLIC_*` is inlined into client JavaScript by the bundler, so a key with
 * that prefix is already compromised. Detecting it at config load turns a silent
 * leak into a startup failure, and the error names only the variable, never its
 * value.
 */
export function assertNoPublicSecrets(env: AIEnvironment): void {
  const leaked = Object.keys(env).filter((key) =>
    /^NEXT_PUBLIC_.*(API_KEY|APIKEY|SECRET|TOKEN|PASSWORD|PRIVATE)/i.test(key),
  );
  if (leaked.length > 0) {
    throw new ConfigurationError(
      `Secrets must never be exposed to the browser bundle. Rename: ${leaked.join(", ")}`,
    );
  }
}

function readInt(env: AIEnvironment, key: string, fallback: number, min: number, max: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ConfigurationError(`${key} must be an integer between ${min} and ${max}; got "${raw}"`);
  }
  return value;
}

function readBoolean(env: AIEnvironment, key: string, fallback: boolean): boolean {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  throw new ConfigurationError(`${key} must be true or false; got "${raw}"`);
}

/**
 * Builds the config, validating as it goes.
 *
 * Every failure mode is a `ConfigurationError` naming the offending variable, so
 * a misconfigured deployment reports the fix rather than surfacing later as an
 * unexplained provider error.
 */
export function loadAIConfig(env: AIEnvironment = process.env): AIConfig {
  assertNoPublicSecrets(env);

  const providerRaw = env[AI_ENV_KEYS.provider];
  if (providerRaw !== undefined && providerRaw !== "" && !isProviderId(providerRaw)) {
    throw new ConfigurationError(`${AI_ENV_KEYS.provider} is not a known provider: "${providerRaw}"`);
  }
  const provider: ProviderId = isProviderId(providerRaw ?? "")
    ? (providerRaw as ProviderId)
    : AI_CONFIG_DEFAULTS.provider;

  const logLevelRaw = env[AI_ENV_KEYS.logLevel];
  if (
    logLevelRaw !== undefined &&
    logLevelRaw !== "" &&
    !LOG_LEVELS.includes(logLevelRaw as AIConfig["logLevel"])
  ) {
    throw new ConfigurationError(
      `${AI_ENV_KEYS.logLevel} must be one of ${LOG_LEVELS.join(", ")}; got "${logLevelRaw}"`,
    );
  }

  const defaultModel = env[AI_ENV_KEYS.defaultModel] || AI_CONFIG_DEFAULTS.defaultModel;
  const fallbackModel = env[AI_ENV_KEYS.fallbackModel] || defaultModel;

  for (const [key, id] of [
    [AI_ENV_KEYS.defaultModel, defaultModel],
    [AI_ENV_KEYS.fallbackModel, fallbackModel],
  ] as const) {
    if (!findModel(id)) {
      throw new ConfigurationError(`${key} is not in the model catalog: "${id}"`);
    }
  }

  return {
    provider,
    defaultModel,
    fallbackModel,
    requestTimeoutMs: readInt(
      env,
      AI_ENV_KEYS.requestTimeoutMs,
      AI_CONFIG_DEFAULTS.requestTimeoutMs,
      1_000,
      600_000,
    ),
    maxRetries: readInt(env, AI_ENV_KEYS.maxRetries, AI_CONFIG_DEFAULTS.maxRetries, 0, 10),
    maxToolIterations: readInt(
      env,
      AI_ENV_KEYS.maxToolIterations,
      AI_CONFIG_DEFAULTS.maxToolIterations,
      1,
      50,
    ),
    maxContextMessages: readInt(
      env,
      AI_ENV_KEYS.maxContextMessages,
      AI_CONFIG_DEFAULTS.maxContextMessages,
      2,
      500,
    ),
    requestsPerMinute: readInt(
      env,
      AI_ENV_KEYS.requestsPerMinute,
      AI_CONFIG_DEFAULTS.requestsPerMinute,
      1,
      10_000,
    ),
    logLevel: (logLevelRaw as AIConfig["logLevel"]) || AI_CONFIG_DEFAULTS.logLevel,
    redactPrompts: readBoolean(env, AI_ENV_KEYS.redactPrompts, AI_CONFIG_DEFAULTS.redactPrompts),
  };
}

let cached: AIConfig | undefined;

/** Process-wide config. Parsed once; `resetAIConfigCache` exists for tests. */
export function getAIConfig(): AIConfig {
  cached ??= loadAIConfig();
  return cached;
}

export function resetAIConfigCache(): void {
  cached = undefined;
}

/**
 * Whether a provider could serve a request. Returns a boolean and nothing else.
 *
 * Deliberately the only credential-shaped thing any non-transport caller may
 * reach: a status endpoint can report readiness without a value ever leaving
 * this module.
 */
export function hasProviderCredentials(
  providerId: ProviderId,
  env: AIEnvironment = process.env,
): boolean {
  const keys = PROVIDER_ENV_KEYS[providerId];
  if (!keys.apiKey) return true; // Local or in-process transports need no key.
  return Boolean(env[keys.apiKey]);
}

/**
 * Resolves credentials for one transport, or throws naming the missing variable.
 *
 * Called only by the provider registry, at construction time, so a key exists in
 * memory for exactly as long as the provider instance does and is never attached
 * to a request, a response, a log line or an error.
 */
export function requireProviderCredentials(
  providerId: ProviderId,
  env: AIEnvironment = process.env,
): ProviderCredentials {
  assertNoPublicSecrets(env);
  const keys = PROVIDER_ENV_KEYS[providerId];
  const apiKey = keys.apiKey ? (env[keys.apiKey] ?? "") : "";
  if (keys.apiKey && !apiKey) {
    throw new ConfigurationError(`${keys.apiKey} is not set; the ${providerId} provider cannot start.`);
  }

  const baseUrl = (keys.baseUrl ? env[keys.baseUrl] : undefined) || DEFAULT_BASE_URLS[providerId];
  if (!baseUrl && providerId !== "mock") {
    throw new ConfigurationError(
      `${keys.baseUrl ?? "A base URL"} is not set; the ${providerId} provider cannot start.`,
    );
  }

  if (providerId === "azure-openai") {
    const deployment = env.AZURE_OPENAI_DEPLOYMENT;
    if (!deployment) {
      throw new ConfigurationError("AZURE_OPENAI_DEPLOYMENT is not set; the azure-openai provider cannot start.");
    }
    return {
      apiKey,
      baseUrl: `${baseUrl.replace(/\/$/, "")}/openai/deployments/${deployment}`,
      apiVersion: env.AZURE_OPENAI_API_VERSION || "2024-10-21",
    };
  }

  return { apiKey, baseUrl: baseUrl.replace(/\/$/, "") };
}

/** The model a request should use, honouring the caller's override. */
export function resolveModel(config: AIConfig, requested?: string): ModelDescriptor {
  const id = requested || config.defaultModel;
  const model = findModel(id);
  if (!model) throw new ConfigurationError(`Unknown model: "${id}"`);
  return model;
}
