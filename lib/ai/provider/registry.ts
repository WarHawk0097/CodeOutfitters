// The provider registry.
//
// The place where "which vendor" stops being a question. Everything above takes a
// `AIProvider` from here and never learns which one it got.
//
// Loading is lazy and per-provider, via dynamic `import()` with literal
// specifiers, so a deployment configured for one vendor never pulls the other six
// transports into its bundle — the requirement to lazy-load and tree-shake
// providers is satisfied by the module graph rather than by a build flag.
//
// Instances are cached per provider id because a provider owns its credentials
// and its `fetch` configuration; constructing one per request would be waste, and
// re-reading the environment per request would make a rotation take effect
// halfway through a conversation.

import { ConfigurationError } from "../errors";
import { getAIConfig, requireProviderCredentials, type AIConfig } from "../config";
import type { ProviderId } from "./message";
import type { AIProvider, ProviderCredentials, ProviderFactory } from "./types";

/**
 * One literal `import()` per provider.
 *
 * Deliberately not a computed specifier — `import(\`./${id}\`)` would defeat
 * static analysis and force every transport into the bundle, which is the exact
 * outcome this table exists to prevent.
 */
const LOADERS: Readonly<Record<ProviderId, () => Promise<ProviderFactory>>> = {
  openai: async () => (await import("./openai")).default,
  anthropic: async () => (await import("./anthropic")).default,
  gemini: async () => (await import("./gemini")).default,
  "azure-openai": async () => (await import("./azure-openai")).default,
  openrouter: async () => (await import("./openrouter")).default,
  ollama: async () => (await import("./ollama")).default,
  mock: async () => (await import("./mock")).default,
};

export class ProviderRegistry {
  private readonly instances = new Map<ProviderId, AIProvider>();
  private readonly overrides = new Map<ProviderId, AIProvider>();

  constructor(
    private readonly config: AIConfig = getAIConfig(),
    private readonly resolveCredentials: (id: ProviderId) => ProviderCredentials = (id) =>
      requireProviderCredentials(id),
  ) {}

  /** The provider named by configuration. The default path for every caller. */
  async getDefault(): Promise<AIProvider> {
    return this.get(this.config.provider);
  }

  async get(id: ProviderId): Promise<AIProvider> {
    const override = this.overrides.get(id);
    if (override) return override;

    const cached = this.instances.get(id);
    if (cached) return cached;

    const load = LOADERS[id];
    if (!load) throw new ConfigurationError(`No provider is registered for "${id}"`);

    const factory = await load();
    // Credentials are resolved here and captured by the instance; they are never
    // returned to the caller and never stored on the registry.
    //
    // The timeout and retry budget are handed over at the same time, so a
    // transport never reads configuration for itself and every provider inherits
    // one policy rather than its own defaults.
    const provider = factory(this.resolveCredentials(id), {
      requestTimeoutMs: this.config.requestTimeoutMs,
      maxRetries: this.config.maxRetries,
    });
    this.instances.set(id, provider);
    return provider;
  }

  /**
   * Substitutes an instance for one id.
   *
   * The seam the tests use to run the whole stack against `MockProvider` without
   * touching configuration, and the seam a future circuit breaker would use to
   * swap a failing provider for a fallback.
   */
  override(id: ProviderId, provider: AIProvider): this {
    this.overrides.set(id, provider);
    return this;
  }

  /** Drops cached instances. Used after a credential rotation. */
  clear(): void {
    this.instances.clear();
  }
}
