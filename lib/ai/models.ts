// The model catalog.
//
// One table, so that "which models exist, what can they do, what do they cost"
// is answered in exactly one place. Nothing else in the stack may hardcode a
// wire model name: callers ask for a `ModelId`, and the provider layer reads
// `wireName` off the entry. That indirection is what makes swapping providers a
// config change rather than a search-and-replace.
//
// Capabilities are declared rather than probed. A request that asks for vision
// against a text-only model fails before it leaves the process, with a typed
// error naming the capability, instead of costing a round trip to find out.

import type { ProviderId } from "./provider/message";

/** Everything a model may or may not be able to do. Checked before dispatch. */
export type ModelCapabilities = {
  /** Accepts image content parts. */
  vision: boolean;
  /** Accepts tool definitions and can emit tool calls. */
  toolCalling: boolean;
  /** Honours `responseFormat: { type: "json_object" }`. */
  jsonMode: boolean;
  /** Honours `responseFormat: { type: "json_schema" }` with guaranteed conformance. */
  structuredOutputs: boolean;
  /** Emits incremental deltas. */
  streaming: boolean;
  /** Exposes a reasoning budget; `temperature`/`topP` are typically ignored. */
  reasoning: boolean;
};

/** Cost in USD per one million tokens. Used for accounting, never for routing. */
export type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  /** Cached input, where the provider bills it separately. */
  cachedInputPerMillion?: number;
};

export type ModelDescriptor = {
  /** Stable internal identifier. This is what application code names. */
  id: string;
  providerId: ProviderId;
  /** The identifier the provider's API expects. May change without app changes. */
  wireName: string;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
};

const TEXT_ONLY: ModelCapabilities = {
  vision: false,
  toolCalling: true,
  jsonMode: true,
  structuredOutputs: true,
  streaming: true,
  reasoning: false,
};

const MULTIMODAL: ModelCapabilities = { ...TEXT_ONLY, vision: true };

const REASONING: ModelCapabilities = { ...MULTIMODAL, reasoning: true };

/**
 * The catalog. Ordering is irrelevant; lookup is by `id`.
 *
 * Prices are list prices at the time of writing and are only used to attribute
 * spend to a conversation. They are deliberately not a routing input — a model
 * is chosen by capability and configuration, never by the cheapest row.
 */
export const MODEL_CATALOG: readonly ModelDescriptor[] = [
  {
    id: "gpt-5",
    providerId: "openai",
    wireName: "gpt-5",
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    capabilities: REASONING,
    pricing: { inputPerMillion: 1.25, outputPerMillion: 10, cachedInputPerMillion: 0.125 },
  },
  {
    id: "gpt-5-mini",
    providerId: "openai",
    wireName: "gpt-5-mini",
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    capabilities: REASONING,
    pricing: { inputPerMillion: 0.25, outputPerMillion: 2, cachedInputPerMillion: 0.025 },
  },
  {
    id: "gpt-4.1-mini",
    providerId: "openai",
    wireName: "gpt-4.1-mini",
    contextWindow: 1_047_576,
    maxOutputTokens: 32_768,
    capabilities: MULTIMODAL,
    pricing: { inputPerMillion: 0.4, outputPerMillion: 1.6, cachedInputPerMillion: 0.1 },
  },
  {
    id: "claude-sonnet-4-5",
    providerId: "anthropic",
    wireName: "claude-sonnet-4-5",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    capabilities: REASONING,
    pricing: { inputPerMillion: 3, outputPerMillion: 15, cachedInputPerMillion: 0.3 },
  },
  {
    id: "claude-haiku-4-5",
    providerId: "anthropic",
    wireName: "claude-haiku-4-5",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    capabilities: MULTIMODAL,
    pricing: { inputPerMillion: 1, outputPerMillion: 5, cachedInputPerMillion: 0.1 },
  },
  {
    id: "gemini-2.5-flash",
    providerId: "gemini",
    wireName: "gemini-2.5-flash",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    capabilities: REASONING,
    pricing: { inputPerMillion: 0.3, outputPerMillion: 2.5 },
  },
  {
    id: "llama-3.3-70b-local",
    providerId: "ollama",
    wireName: "llama3.3:70b",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    capabilities: TEXT_ONLY,
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
  {
    // The catalog entry the whole test suite runs against. Never reaches a network.
    id: "mock-model",
    providerId: "mock",
    wireName: "mock-model",
    contextWindow: 8_192,
    maxOutputTokens: 1_024,
    capabilities: REASONING,
    pricing: { inputPerMillion: 0, outputPerMillion: 0 },
  },
];

const BY_ID = new Map(MODEL_CATALOG.map((model) => [model.id, model]));

/** Undefined for unknown ids — callers that require a model use `requireModel`. */
export function findModel(id: string): ModelDescriptor | undefined {
  return BY_ID.get(id);
}

export function listModelsForProvider(providerId: ProviderId): readonly ModelDescriptor[] {
  return MODEL_CATALOG.filter((model) => model.providerId === providerId);
}

/**
 * Cost of a completed exchange, in USD.
 *
 * Cached input tokens are a subset of prompt tokens, so they are billed at the
 * cached rate and subtracted from the full-rate count rather than added on top.
 */
export function estimateCostUsd(
  model: ModelDescriptor,
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens?: number },
): number {
  const cached = usage.cachedInputTokens ?? 0;
  const fullRateInput = Math.max(0, usage.inputTokens - cached);
  const cachedRate = model.pricing.cachedInputPerMillion ?? model.pricing.inputPerMillion;
  const perMillion =
    fullRateInput * model.pricing.inputPerMillion +
    cached * cachedRate +
    usage.outputTokens * model.pricing.outputPerMillion;
  return perMillion / 1_000_000;
}
