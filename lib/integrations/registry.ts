import "server-only";
import type { IntegrationProviderId } from "./types";
import type { IntegrationProviderAdapter } from "./provider";
import { IntegrationProviderError } from "./provider";

// Lazy, cached adapter lookup — same shape as lib/ai/provider/registry.ts, one literal
// import() per provider so an unconfigured provider never pulls its module (and, for a
// future Google adapter, its SDK) into a bundle that never uses it.
//
// google_calendar now has a real adapter (Master Goal Phase 2.5, Google OAuth
// Foundation) — see providers/google.ts. gmail remains reserved with no loader: it
// either extends the google_calendar connection via incremental authorization or
// gets its own adapter later, per Section 10's decision; either way it is not a
// migration.
const LOADERS: Partial<Record<IntegrationProviderId, () => Promise<IntegrationProviderAdapter>>> = {
  local_test: async () => (await import("./providers/local-test")).default(),
  google_calendar: async () => (await import("./providers/google")).default(),
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
