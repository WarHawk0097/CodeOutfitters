// The OpenRouter transport.
//
// A gateway in front of many models, so capabilities here are the floor of what
// it can guarantee rather than the ceiling of what some model behind it offers:
// structured outputs and prompt caching depend on the upstream model and are not
// promised. Attribution headers, if configured, arrive through
// `credentials.headers` and are merged by the shared transport.

import { OpenAICompatibleProvider } from "./openai-compatible";
import type {
  AIProvider,
  ProviderCapabilities,
  ProviderCredentials,
  ProviderRuntimeOptions,
} from "./types";

export const OPENROUTER_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: true,
  vision: true,
  jsonMode: true,
  structuredOutputs: false,
  promptCaching: false,
};

export function createOpenRouterProvider(
  credentials: ProviderCredentials,
  runtime?: ProviderRuntimeOptions,
): AIProvider {
  return new OpenAICompatibleProvider({
    id: "openrouter",
    credentials,
    capabilities: OPENROUTER_CAPABILITIES,
    authHeaders: ({ apiKey }) => ({ Authorization: `Bearer ${apiKey}` }),
    ...(runtime ? { runtime } : {}),
  });
}

export default createOpenRouterProvider;
