// The Azure transport.
//
// Same dialect as the vendor's own API with two differences: authentication is an
// `api-key` header rather than a bearer token, and the deployment plus API
// version live in the URL. The deployment is folded into `baseUrl` when
// credentials are resolved, so only the query parameter is added here.

import { ConfigurationError } from "../errors";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { AIProvider, ProviderCapabilities, ProviderCredentials } from "./types";

export const AZURE_OPENAI_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: true,
  vision: true,
  jsonMode: true,
  structuredOutputs: true,
  promptCaching: true,
};

export function createAzureOpenAIProvider(
  credentials: ProviderCredentials,
  fetchImpl?: typeof fetch,
): AIProvider {
  if (!credentials.apiVersion) {
    throw new ConfigurationError("AZURE_OPENAI_API_VERSION is required for the azure-openai provider");
  }

  return new OpenAICompatibleProvider({
    id: "azure-openai",
    credentials,
    capabilities: AZURE_OPENAI_CAPABILITIES,
    authHeaders: ({ apiKey }) => ({ "api-key": apiKey }),
    completionsUrl: ({ baseUrl, apiVersion }) =>
      `${baseUrl}/chat/completions?api-version=${apiVersion}`,
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export default createAzureOpenAIProvider;
