// The Ollama transport.
//
// A local runtime exposing the same dialect. There is no key — which is why
// `PROVIDER_ENV_KEYS.ollama` declares no `apiKey` and the credential check treats
// it as always configured. Capabilities are conservative because what a local
// runtime supports depends entirely on which weights are loaded, and over-
// promising here produces a confusing 400 instead of a clear refusal.

import { OpenAICompatibleProvider } from "./openai-compatible";
import type { AIProvider, ProviderCapabilities, ProviderCredentials } from "./types";

export const OLLAMA_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: true,
  vision: false,
  jsonMode: true,
  structuredOutputs: false,
  promptCaching: false,
};

export function createOllamaProvider(
  credentials: ProviderCredentials,
  fetchImpl?: typeof fetch,
): AIProvider {
  return new OpenAICompatibleProvider({
    id: "ollama",
    credentials,
    capabilities: OLLAMA_CAPABILITIES,
    // A local runtime needs no credential, and sending an empty bearer token is
    // worse than sending none: some builds reject the malformed header outright.
    authHeaders: () => ({}),
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export default createOllamaProvider;
