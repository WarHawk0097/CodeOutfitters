// The provider contract.
//
// This is the seam the whole task hangs on: nothing above this file may import
// an SDK, name a vendor, or branch on which model is in use. A provider is two
// methods and a capability declaration. Adding a seventh vendor means writing one
// module that satisfies `AIProvider` and adding one line to the registry — no
// caller changes, no new configuration surface.
//
// The interface is deliberately narrower than any vendor SDK. Anything a single
// vendor supports but the others cannot express belongs in `providerOptions`,
// where it is opaque to this layer and interpreted only by the transport that
// understands it.

import type {
  AIMessage,
  ContentPart,
  FinishReason,
  ProviderId,
  TokenUsage,
  ToolCall,
} from "./message";
import type { AIStreamEvent } from "../streaming/events";

/**
 * Sampling and decoding controls, in vendor-neutral names.
 *
 * `maxOutputTokens` rather than `max_tokens` because the same field means
 * different things across vendors; the transport maps it. Every field is optional
 * so that a caller who wants provider defaults can omit the object entirely.
 */
export type GenerationParams = {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  stop?: readonly string[];
  /** Determinism hint. Honoured by some providers, ignored by others. */
  seed?: number;
  /** Reasoning-model budget. Providers without reasoning ignore this. */
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  /** Penalties, where supported. */
  frequencyPenalty?: number;
  presencePenalty?: number;
};

/** Free text, JSON, or JSON conforming to a schema. Checked against capabilities. */
export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; name: string; schema: Record<string, unknown>; strict?: boolean };

/** How hard the model is pushed toward calling a tool. */
export type ToolChoice = "auto" | "none" | "required" | { type: "tool"; name: string };

/**
 * A tool as the model sees it: name, description, JSON Schema.
 *
 * Deliberately not the same type as a registered tool. The registry's
 * `ToolDefinition` carries an executor and a required permission, and neither of
 * those may ever be serialised toward a provider.
 */
export type ToolSchema = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ProviderRequest = {
  /** Catalog `ModelDescriptor.id`. The transport resolves it to a wire name. */
  model: string;
  messages: readonly AIMessage[];
  params?: GenerationParams;
  tools?: readonly ToolSchema[];
  toolChoice?: ToolChoice;
  responseFormat?: ResponseFormat;
  /**
   * Escape hatch for vendor-specific fields. Opaque above the transport, and
   * never populated from client input.
   */
  providerOptions?: Readonly<Record<string, unknown>>;
};

export type ProviderResponse = {
  /** Provider-assigned response id, where one exists. Used for correlation. */
  id: string;
  model: string;
  content: readonly ContentPart[];
  toolCalls: readonly ToolCall[];
  finishReason: FinishReason;
  usage: TokenUsage;
  /** Wall-clock time for the call, measured by the transport. */
  latencyMs: number;
};

/**
 * What a transport can do, independent of the model in use.
 *
 * Model-level capability lives in the catalog; this is the transport's own floor.
 * A dispatch is legal only when both agree — Ollama declares no prompt caching
 * regardless of which model is loaded into it.
 */
export type ProviderCapabilities = {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  jsonMode: boolean;
  structuredOutputs: boolean;
  promptCaching: boolean;
};

/**
 * The one interface every vendor is reduced to.
 *
 * `stream` returns an async iterable rather than taking a callback so that
 * cancellation, back-pressure and `for await` composition all work without the
 * provider knowing anything about the consumer.
 */
export interface AIProvider {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;
  generate(request: ProviderRequest, signal?: AbortSignal): Promise<ProviderResponse>;
  stream(request: ProviderRequest, signal?: AbortSignal): AsyncIterable<AIStreamEvent>;
}

/** Credentials and endpoint for one transport. Only ever built server-side. */
export type ProviderCredentials = {
  apiKey: string;
  baseUrl: string;
  /** Azure deployments and OpenRouter attribution headers land here. */
  headers?: Readonly<Record<string, string>>;
  /** Azure only: the API version query parameter. */
  apiVersion?: string;
};

/** A provider module's default export shape. Keeps lazy imports type-checked. */
export type ProviderFactory = (credentials: ProviderCredentials) => AIProvider;
