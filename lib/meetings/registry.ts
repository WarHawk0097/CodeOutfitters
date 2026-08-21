import "server-only";
import type { MeetingProviderId } from "./types";
import type { MeetingProviderAdapter } from "./provider";
import { MeetingProviderError } from "./provider";

// Lazy, cached adapter lookup — same shape as lib/integrations/registry.ts. One literal
// import() per provider so an unconfigured provider never pulls its module into a bundle
// that never uses it. Adding Zoom/Teams later is one loader line here, not a rewrite.
const LOADERS: Partial<Record<MeetingProviderId, () => Promise<MeetingProviderAdapter>>> = {
  google_meet: async () => (await import("./providers/google-meet")).default(),
};

const instances = new Map<MeetingProviderId, MeetingProviderAdapter>();

export async function getMeetingProviderAdapter(id: MeetingProviderId): Promise<MeetingProviderAdapter> {
  const cached = instances.get(id);
  if (cached) return cached;

  const load = LOADERS[id];
  if (!load) {
    throw new MeetingProviderError(id, "provider_error", `No meeting adapter is implemented for provider "${id}" yet.`);
  }
  const adapter = await load();
  instances.set(id, adapter);
  return adapter;
}

/** Test-only seam: swap in a fake adapter without touching the module cache. */
export function __overrideMeetingProviderAdapterForTests(id: MeetingProviderId, adapter: MeetingProviderAdapter): void {
  instances.set(id, adapter);
}

export function __clearMeetingProviderAdaptersForTests(): void {
  instances.clear();
}
