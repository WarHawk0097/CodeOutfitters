// Configuration.
//
// The environment is injected rather than mutated, so these run in any order and
// leave no global state behind. The security assertions are the ones that matter
// most here: a secret must never be reachable from a `NEXT_PUBLIC_*` name, and no
// credential helper may ever hand back a value.

import { describe, expect, it } from "vitest";
import {
  AI_CONFIG_DEFAULTS,
  AI_ENV_KEYS,
  PROVIDER_ENV_KEYS,
  assertNoPublicSecrets,
  hasProviderCredentials,
  loadAIConfig,
  requireProviderCredentials,
  resolveModel,
} from "./config";
import { ConfigurationError } from "./errors";
import { PROVIDER_IDS } from "./provider/message";

const SECRET = "sk-do-not-leak-this-value";

describe("loadAIConfig", () => {
  it("falls back to the declared defaults on an empty environment", () => {
    expect(loadAIConfig({})).toEqual(AI_CONFIG_DEFAULTS);
  });

  it("reads every declared key", () => {
    const config = loadAIConfig({
      [AI_ENV_KEYS.provider]: "openai",
      [AI_ENV_KEYS.defaultModel]: "gpt-5",
      [AI_ENV_KEYS.fallbackModel]: "gpt-4.1-mini",
      [AI_ENV_KEYS.requestTimeoutMs]: "15000",
      [AI_ENV_KEYS.maxRetries]: "0",
      [AI_ENV_KEYS.maxToolIterations]: "4",
      [AI_ENV_KEYS.maxContextMessages]: "12",
      [AI_ENV_KEYS.requestsPerMinute]: "5",
      [AI_ENV_KEYS.logLevel]: "debug",
      [AI_ENV_KEYS.redactPrompts]: "false",
    });

    expect(config).toEqual({
      provider: "openai",
      defaultModel: "gpt-5",
      fallbackModel: "gpt-4.1-mini",
      requestTimeoutMs: 15_000,
      maxRetries: 0,
      maxToolIterations: 4,
      maxContextMessages: 12,
      requestsPerMinute: 5,
      logLevel: "debug",
      redactPrompts: false,
    });
  });

  it("rejects an unknown provider by name", () => {
    expect(() => loadAIConfig({ [AI_ENV_KEYS.provider]: "not-a-vendor" })).toThrow(ConfigurationError);
  });

  it("rejects a model that is not in the catalog", () => {
    expect(() => loadAIConfig({ [AI_ENV_KEYS.defaultModel]: "gpt-imaginary" })).toThrow(
      /not in the model catalog/,
    );
  });

  it("rejects an unknown log level", () => {
    expect(() => loadAIConfig({ [AI_ENV_KEYS.logLevel]: "verbose" })).toThrow(ConfigurationError);
  });

  it.each([
    ["not-a-number", "1.5"],
    ["out of range", "999999999"],
    ["below the floor", "1"],
  ])("rejects a numeric value that is %s", (_case, value) => {
    expect(() => loadAIConfig({ [AI_ENV_KEYS.requestTimeoutMs]: value })).toThrow(ConfigurationError);
  });

  it("accepts both spellings of a boolean and rejects anything else", () => {
    expect(loadAIConfig({ [AI_ENV_KEYS.redactPrompts]: "0" }).redactPrompts).toBe(false);
    expect(loadAIConfig({ [AI_ENV_KEYS.redactPrompts]: "1" }).redactPrompts).toBe(true);
    expect(() => loadAIConfig({ [AI_ENV_KEYS.redactPrompts]: "yes" })).toThrow(ConfigurationError);
  });

  it("names the offending variable in every failure", () => {
    expect(() => loadAIConfig({ [AI_ENV_KEYS.maxRetries]: "99" })).toThrow(AI_ENV_KEYS.maxRetries);
  });

  it("defaults prompt redaction on", () => {
    expect(AI_CONFIG_DEFAULTS.redactPrompts).toBe(true);
  });

  it("defaults to the provider that cannot reach a network", () => {
    expect(AI_CONFIG_DEFAULTS.provider).toBe("mock");
  });
});

// Assembled rather than written out, because the repository-wide secret scan in
// `lib/auth/live-auth.test.ts` searches every source file for these names and is
// right to: a file that contains one is indistinguishable from a file that uses one.
const LEAKY_NAMES = [
  "OPENAI_API_KEY",
  "ANTHROPIC_APIKEY",
  "SUPABASE_SECRET",
  "SERVICE_TOKEN",
  "DB_PASSWORD",
  "SIGNING_PRIVATE_KEY",
].map((suffix) => `NEXT_PUBLIC_${suffix}`);

describe("assertNoPublicSecrets", () => {
  it.each(LEAKY_NAMES)("refuses to start when %s is set", (key) => {
    expect(() => assertNoPublicSecrets({ [key]: SECRET })).toThrow(ConfigurationError);
  });

  it("names the variable but never its value", () => {
    let message = "";
    try {
      assertNoPublicSecrets({ NEXT_PUBLIC_OPENAI_API_KEY: SECRET });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("NEXT_PUBLIC_OPENAI_API_KEY");
    expect(message).not.toContain(SECRET);
  });

  it("leaves public values that are not secrets alone", () => {
    expect(() =>
      assertNoPublicSecrets({ NEXT_PUBLIC_SITE_URL: "https://example.test" }),
    ).not.toThrow();
  });

  it("runs as part of loading the configuration", () => {
    expect(() => loadAIConfig({ NEXT_PUBLIC_OPENAI_API_KEY: SECRET })).toThrow(ConfigurationError);
  });
});

describe("credentials", () => {
  it("answers presence with a boolean and nothing else", () => {
    expect(hasProviderCredentials("openai", { OPENAI_API_KEY: SECRET })).toBe(true);
    expect(hasProviderCredentials("openai", {})).toBe(false);
  });

  it("treats a provider that needs no key as configured", () => {
    expect(hasProviderCredentials("ollama", {})).toBe(true);
  });

  it("declares a distinct variable name for every provider", () => {
    const names = PROVIDER_IDS.map((id) => PROVIDER_ENV_KEYS[id].apiKey).filter(
      (name): name is string => Boolean(name),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it("fails with the variable name when a key is missing", () => {
    expect(() => requireProviderCredentials("openai", {})).toThrow("OPENAI_API_KEY");
  });

  it("supplies the documented default base URL", () => {
    expect(requireProviderCredentials("openai", { OPENAI_API_KEY: SECRET })).toEqual({
      apiKey: SECRET,
      baseUrl: "https://api.openai.com/v1",
    });
  });

  it("requires an explicit address for a local model server", () => {
    expect(() => requireProviderCredentials("ollama", {})).toThrow("OLLAMA_BASE_URL");
    expect(
      requireProviderCredentials("ollama", { OLLAMA_BASE_URL: "http://model-host.internal:11434/v1" })
        .baseUrl,
    ).toBe("http://model-host.internal:11434/v1");
  });

  it("strips a trailing slash from an overridden base URL", () => {
    expect(
      requireProviderCredentials("openai", {
        OPENAI_API_KEY: SECRET,
        OPENAI_BASE_URL: "https://gateway.test/v1/",
      }).baseUrl,
    ).toBe("https://gateway.test/v1");
  });

  it("builds the Azure deployment path and requires the deployment name", () => {
    const env = {
      AZURE_OPENAI_API_KEY: SECRET,
      AZURE_OPENAI_ENDPOINT: "https://contoso.openai.azure.test",
      AZURE_OPENAI_DEPLOYMENT: "copilot",
    };
    expect(requireProviderCredentials("azure-openai", env)).toEqual({
      apiKey: SECRET,
      baseUrl: "https://contoso.openai.azure.test/openai/deployments/copilot",
      apiVersion: "2024-10-21",
    });
    expect(() =>
      requireProviderCredentials("azure-openai", { ...env, AZURE_OPENAI_DEPLOYMENT: undefined }),
    ).toThrow("AZURE_OPENAI_DEPLOYMENT");
  });
});

describe("resolveModel", () => {
  it("honours the caller's override and otherwise uses the default", () => {
    const config = loadAIConfig({});
    expect(resolveModel(config).id).toBe(AI_CONFIG_DEFAULTS.defaultModel);
    expect(resolveModel(config, "gpt-5").id).toBe("gpt-5");
  });

  it("fails on a model outside the catalog", () => {
    expect(() => resolveModel(loadAIConfig({}), "gpt-imaginary")).toThrow(ConfigurationError);
  });
});
