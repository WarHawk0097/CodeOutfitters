// The Gemini transport.
//
// Google publishes an OpenAI-compatible endpoint, so this goes through the shared
// transport rather than the native `generateContent` API. That is a deliberate
// trade: the compatibility layer does not expose every native feature, and in
// exchange this provider is thirty lines instead of a second full transport. If a
// native-only capability is ever needed, this file is where that transport would
// be written — no caller above `AIProvider` would change.

import { OpenAICompatibleProvider } from "./openai-compatible";
import type {
  AIProvider,
  ProviderCapabilities,
  ProviderCredentials,
  ProviderRuntimeOptions,
} from "./types";

export const GEMINI_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: true,
  vision: true,
  jsonMode: true,
  structuredOutputs: true,
  // Context caching exists natively but is not surfaced through the
  // compatibility endpoint, so it is not claimed here.
  promptCaching: false,
};

export function createGeminiProvider(
  credentials: ProviderCredentials,
  runtime?: ProviderRuntimeOptions,
): AIProvider {
  return new OpenAICompatibleProvider({
    id: "gemini",
    credentials,
    capabilities: GEMINI_CAPABILITIES,
    authHeaders: ({ apiKey }) => ({ Authorization: `Bearer ${apiKey}` }),
    ...(runtime ? { runtime } : {}),
  });
}

export default createGeminiProvider;
