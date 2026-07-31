// Pre-flight checks every transport shares.
//
// Capability validation happens once, here, rather than in each provider. It runs
// before any network call so that asking a text-only model for vision, or a
// non-tool-calling model for tools, costs a typed error instead of a round trip
// and a vendor-specific 400.
//
// A dispatch is legal only when the model and the transport both support it. The
// two are separate declarations because they fail independently: the same model
// served through a different gateway may lose structured outputs.

import { ConfigurationError, UnsupportedCapabilityError } from "../errors";
import { estimateCostUsd, findModel, type ModelDescriptor } from "../models";
import { requiresVision, type ProviderId } from "./message";
import type { ProviderCapabilities, ProviderRequest } from "./types";

/**
 * Providers that legitimately serve other vendors' models.
 *
 * A gateway's whole purpose is to front a catalog it did not author, so a model
 * whose `providerId` names someone else is correct there and a misconfiguration
 * anywhere else.
 */
const GATEWAY_PROVIDERS: ReadonlySet<string> = new Set(["azure-openai", "openrouter"]);

/** Resolves a catalog id to its descriptor, or fails naming the unknown id. */
export function resolveDescriptor(modelId: string): ModelDescriptor {
  const model = findModel(modelId);
  if (!model) throw new ConfigurationError(`Unknown model: "${modelId}"`);
  return model;
}

/**
 * Rejects a request the model or transport cannot serve.
 *
 * Each check names the capability in the error, so the failure tells an operator
 * which model to switch to rather than that something went wrong.
 */
export function assertSupported(
  request: ProviderRequest,
  model: ModelDescriptor,
  capabilities: ProviderCapabilities,
  streaming: boolean,
  providerId?: ProviderId,
): void {
  // Optional so the capability checks stay callable on their own, but every
  // transport passes it. Without it, `AI_PROVIDER=anthropic` with
  // `AI_DEFAULT_MODEL=gpt-5` reaches the wire and comes back as an opaque vendor
  // 400 — the two settings are validated separately and nothing compares them.
  if (
    providerId !== undefined &&
    providerId !== model.providerId &&
    !GATEWAY_PROVIDERS.has(providerId)
  ) {
    throw new ConfigurationError(
      `Model "${model.id}" belongs to ${model.providerId} and cannot be served by ${providerId}`,
    );
  }

  if (streaming && !(model.capabilities.streaming && capabilities.streaming)) {
    throw new UnsupportedCapabilityError("streaming", `${model.id} cannot stream`);
  }

  if (request.tools && request.tools.length > 0) {
    if (!(model.capabilities.toolCalling && capabilities.toolCalling)) {
      throw new UnsupportedCapabilityError("toolCalling", `${model.id} cannot call tools`);
    }
  }

  if (requiresVision(request.messages) && !(model.capabilities.vision && capabilities.vision)) {
    throw new UnsupportedCapabilityError("vision", `${model.id} cannot read images`);
  }

  const format = request.responseFormat?.type;
  if (format === "json_object" && !(model.capabilities.jsonMode && capabilities.jsonMode)) {
    throw new UnsupportedCapabilityError("jsonMode", `${model.id} cannot guarantee JSON output`);
  }
  if (
    format === "json_schema" &&
    !(model.capabilities.structuredOutputs && capabilities.structuredOutputs)
  ) {
    throw new UnsupportedCapabilityError(
      "structuredOutputs",
      `${model.id} cannot guarantee schema-conforming output`,
    );
  }

  const maxOutputTokens = request.params?.maxOutputTokens;
  if (maxOutputTokens !== undefined && maxOutputTokens > model.maxOutputTokens) {
    throw new ConfigurationError(
      `maxOutputTokens ${maxOutputTokens} exceeds the ${model.maxOutputTokens} limit of ${model.id}`,
    );
  }
}

/** Cost of a completed call. Attached to the terminal stream event by every provider. */
export function costOf(
  model: ModelDescriptor,
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens?: number },
): number {
  return estimateCostUsd(model, usage);
}
