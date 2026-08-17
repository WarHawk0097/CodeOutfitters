import "server-only";
import type { IntegrationProviderId } from "./types";
import type { IntegrationProviderAdapter } from "./provider";
import { IntegrationProviderError } from "./provider";

// Lazy, cached adapter lookup — same shape as lib/ai/provider/registry.ts, one literal
// import() per provider so an unconfigured provider never pulls its module (and, for a
// future Google adapter, its SDK) into a bundle that never uses it.
//
// google_calendar and gmail are reserved provider ids (the enum and this table both
// know them) with no loader yet: Phase 2 is the connection lifecycle, not a Google
// integration, per Master Goal Phase 2 ("local/test providers"). Adding one is Phase
// 3/4's job — a new file plus one line here, no change to store.ts or the API routes.
const LOADERS: Partial<Record<IntegrationProviderId, () => Promise<IntegrationProviderAdapter>>> = {
  local_test: async () => (await import("./providers/local-test")).default(),
};

const instances = new Map<IntegrationProviderId, IntegrationProviderAdapter>();

export async function getProviderAdapter(id: IntegrationProviderId): Promise<IntegrationProviderAdapter> {
  const cached = instances.get(id);
  if (cached) return cached;

  const load = LOADERS[id];
  if (!load) {
    throw new IntegrationProviderError(id, `No adapter is implemented for provider "${id}" yet.`);
  }
  const adapter = await load();
  instances.set(id, adapter);
  return adapter;
}

/** Test-only seam: swap in a fake adapter without touching the module cache. */
export function __overrideProviderAdapterForTests(id: IntegrationProviderId, adapter: IntegrationProviderAdapter): void {
  instances.set(id, adapter);
}

export function __clearProviderAdaptersForTests(): void {
  instances.clear();
}
