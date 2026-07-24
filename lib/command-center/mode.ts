// Command Center runtime mode. `demo` renders a Supabase-free sample dashboard
// (safe to publish before the production data tier exists); `live` uses the real
// Work Order F authentication + workspace-scoped data foundation.
//
// The boundary is explicit and one-way: live mode NEVER silently falls back to
// demo. A misconfigured live deploy fails with a controlled configuration error,
// not fabricated sample data.

export type CommandCenterMode = 'demo' | 'live'

const LIVE_REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

// Thrown when live mode is selected but required Supabase configuration is
// absent. The dashboard renders this as a clean notice instead of a raw 500.
export class CommandCenterConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(
      `Command Center live mode is missing required configuration: ${missing.join(', ')}`,
    )
    this.name = 'CommandCenterConfigError'
  }
}

// Reads the SERVER-ONLY COMMAND_CENTER_MODE (never NEXT_PUBLIC_*, so the mode is
// never inlined into client bundles). Unset/empty defaults to `demo` — a
// deliberate, documented default so the dashboard publishes as a Supabase-free
// demo until the production data tier is provisioned. `demo`/`live` pass through;
// any other value is a hard error so a typo can't silently change behavior.
export function getCommandCenterMode(): CommandCenterMode {
  const raw = process.env.COMMAND_CENTER_MODE?.trim().toLowerCase()
  if (!raw) return 'demo'
  if (raw === 'demo' || raw === 'live') return raw
  throw new Error('Invalid COMMAND_CENTER_MODE: expected "demo" or "live".')
}

export function isDemoMode(): boolean {
  return getCommandCenterMode() === 'demo'
}

export type CommandCenterClientConfig = {
  /** Live mode — the Work Order F data plane. Demo resolves to false. */
  live: boolean
  /** Real file downloads (CSV export, attachments) permitted. Demo => false. */
  downloadsEnabled: boolean
}

// The client-facing config handed to the dashboard tree (see mode-provider). Only
// booleans cross the server/client boundary — never the mode env — so demo/live is
// server-decided and never inlined into client bundles. Demo disables real
// downloads; live permits them.
export function commandCenterClientConfig(): CommandCenterClientConfig {
  const live = getCommandCenterMode() === 'live'
  return { live, downloadsEnabled: live }
}

// Live mode guard: throw a controlled error listing what is missing. Never falls
// back to demo.
export function assertLiveConfig(): void {
  const missing = LIVE_REQUIRED_ENV.filter((k) => !process.env[k])
  if (missing.length > 0) throw new CommandCenterConfigError(missing)
}
