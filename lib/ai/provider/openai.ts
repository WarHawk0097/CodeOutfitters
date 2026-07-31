// The OpenAI transport.
//
// A configuration of the shared OpenAI-compatible transport, nothing more. The
// file is this short by design: if adding a vendor were a large amount of code,
// the abstraction would not be doing its job.

import { OpenAICompatibleProvider } from "./openai-compatible";
import type { AIProvider, ProviderCapabilities, ProviderCredentials } from "./types";

export const OPENAI_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: true,
  vision: true,
  jsonMode: true,
  structuredOutputs: true,
  promptCaching: true,
};

export function createOpenAIProvider(
  credentials: ProviderCredentials,
  fetchImpl?: typeof fetch,
): AIProvider {
  return new OpenAICompatibleProvider({
    id: "openai",
    credentials,
    capabilities: OPENAI_CAPABILITIES,
    authHeaders: ({ apiKey }) => ({ Authorization: `Bearer ${apiKey}` }),
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export default createOpenAIProvider;
