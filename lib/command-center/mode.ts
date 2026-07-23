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

// Reads NEXT_PUBLIC_COMMAND_CENTER_MODE. Unset/empty defaults to `live` so a
// forgotten variable never quietly serves demo data. An explicit unrecognized
// value is a hard error so a typo can't change behavior unnoticed.
export function getCommandCenterMode(): CommandCenterMode {
  const raw = process.env.NEXT_PUBLIC_COMMAND_CENTER_MODE?.trim().toLowerCase()
  if (!raw) return 'live'
  if (raw === 'demo' || raw === 'live') return raw
  throw new Error(
    `Invalid NEXT_PUBLIC_COMMAND_CENTER_MODE: "${raw}" (expected "demo" or "live")`,
  )
}

export function isDemoMode(): boolean {
  return getCommandCenterMode() === 'demo'
}

// Live mode guard: throw a controlled error listing what is missing. Never falls
// back to demo.
export function assertLiveConfig(): void {
  const missing = LIVE_REQUIRED_ENV.filter((k) => !process.env[k])
  if (missing.length > 0) throw new CommandCenterConfigError(missing)
}
