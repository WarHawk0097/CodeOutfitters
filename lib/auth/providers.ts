import 'server-only'

// External identity providers for the Command Center.
//
// Google and Apple credentials live in the Supabase Auth dashboard, not in this
// application — the app cannot introspect them. So availability is declared by a
// SERVER-ONLY environment flag per provider (never NEXT_PUBLIC_*, so a browser
// value can never enable a button). The resolved booleans are computed in a
// server component and handed to the client form as props.
//
// A provider button is enabled only when BOTH are true:
//   - the Command Center is in live mode (demo mode has no auth plane at all)
//   - that provider's server flag is explicitly on
// Otherwise it renders disabled with an accessible reason, so a broken OAuth
// flow can never launch.

export type OAuthProviderId = 'google' | 'apple'

export type ProviderAvailability = {
  id: OAuthProviderId
  label: string
  enabled: boolean
  /** Accessible explanation rendered when `enabled` is false. */
  reason: string | null
}

export const PROVIDER_LABELS: Record<OAuthProviderId, string> = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
}

const PROVIDER_ENV: Record<OAuthProviderId, string> = {
  google: 'AUTH_GOOGLE_ENABLED',
  apple: 'AUTH_APPLE_ENABLED',
}

export const DEMO_PROVIDER_REASON =
  'Available when live authentication is connected.'

export const UNCONFIGURED_PROVIDER_REASON =
  'Available once this provider is configured.'

type EnvLike = Record<string, string | undefined>

function flagIsOn(value: string | undefined): boolean {
  const raw = value?.trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'enabled'
}

/** Server-side truth for one provider. Reads a server-only flag, never NEXT_PUBLIC_*. */
export function isProviderConfigured(
  id: OAuthProviderId,
  env: EnvLike = process.env,
): boolean {
  return flagIsOn(env[PROVIDER_ENV[id]])
}

/**
 * Availability for the sign-in screen, in the required order: Google, Apple.
 * Demo mode always yields disabled buttons with the demo reason.
 */
export function providerAvailability(
  live: boolean,
  env: EnvLike = process.env,
): ProviderAvailability[] {
  return (['google', 'apple'] as const).map((id) => {
    if (!live) {
      return {
        id,
        label: PROVIDER_LABELS[id],
        enabled: false,
        reason: DEMO_PROVIDER_REASON,
      }
    }
    const configured = isProviderConfigured(id, env)
    return {
      id,
      label: PROVIDER_LABELS[id],
      enabled: configured,
      reason: configured ? null : UNCONFIGURED_PROVIDER_REASON,
    }
  })
}
