'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  isAuthProviderOutage,
  resolvedAuthError,
} from '@/lib/supabase/bounded-auth-fetch'
import { oauthCallbackUrl, safeReturnTo } from '@/lib/auth/return-url'
import { destinationForAuthState } from '@/lib/auth/auth-state'
import { getDashboardContext } from '@/lib/dashboard/server'
import { isProviderConfigured, type OAuthProviderId } from '@/lib/auth/providers'
import { isDemoMode } from '@/lib/command-center/mode'
import { DEMO_PASSWORD } from './credentials'

// Password sign-in server action. Auth is performed server-side; on success the
// session cookie is set by the SSR client and the user is sent to a validated
// local returnTo — but only after the workspace membership check. Errors are
// surfaced generically (no user-enumeration, no token logging).
//
// An unreachable auth provider is NOT a credential failure: it redirects to the
// login page's explicit outage state instead of the wrong-password message, so
// an outage can never read as "the email or password is incorrect".
export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const returnTo = safeReturnTo(String(formData.get('returnTo') ?? ''))
  const denied = `/login?error=1&returnTo=${encodeURIComponent(returnTo)}`
  const unavailable = `/login?outage=1&returnTo=${encodeURIComponent(returnTo)}`

  // The published demo credential is a demo-mode artefact. In live mode it is
  // rejected outright, before any auth call, so it can never become a real
  // account password by accident.
  if (password === DEMO_PASSWORD) redirect(denied)

  const supabase = await createClient()
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    // auth-js resolves the network-class failure into `error` rather than
    // throwing it — check the resolved shape first, then the thrown one below.
    if (resolvedAuthError({ error })) redirect(unavailable)
    if (error) {
      // Any other error is the one generic credential rejection.
      redirect(denied)
    }
  } catch (error) {
    // A thrown network-class error (bounded timeout / dead host) is also an
    // outage — never allowed to surface as a 500 or as a denial.
    if (isAuthProviderOutage(error)) redirect(unavailable)
    throw error
  }

  redirect(await postAuthDestination(returnTo))
}

// Starts the real provider OAuth flow. The provider id is validated against the
// server-side allowlist and the server-side configuration flag, so the browser
// cannot launch a provider that is not actually configured.
export async function signInWithProvider(formData: FormData) {
  const raw = String(formData.get('provider') ?? '')
  const returnTo = safeReturnTo(String(formData.get('returnTo') ?? ''))
  const failure = destinationForAuthState('auth_error', returnTo)
  const unavailable = `/login?outage=1&returnTo=${encodeURIComponent(returnTo)}`

  if (isDemoMode()) redirect(failure)
  if (raw !== 'google' && raw !== 'apple') redirect(failure)
  const provider: OAuthProviderId = raw
  if (!isProviderConfigured(provider)) redirect(failure)

  const redirectTo = oauthCallbackUrl(returnTo)
  if (!redirectTo) redirect(failure)

  const supabase = await createClient()
  let data: { url: string | null } | null = null
  try {
    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    // Resolved network-class failure: the provider cannot be reached to start
    // the flow. Distinct from a configuration failure — only this may claim
    // "temporarily unavailable".
    if (resolvedAuthError(result)) redirect(unavailable)
    data = result.data
    if (result.error) redirect(failure)
  } catch (error) {
    if (isAuthProviderOutage(error)) redirect(unavailable)
    throw error
  }
  if (!data?.url) redirect(failure)

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  // Best-effort: the session is cleared locally by the SSR client even when the
  // auth server is unreachable, and sign-out must never strand the user on a
  // 500. The redirect always proceeds.
  try {
    await supabase.auth.signOut()
  } catch {
    // Swallowed deliberately: no provider error text reaches anything.
  }
  redirect('/login')
}

// Authenticated is not authorized: only an active workspace membership opens the
// dashboard. Everyone else lands on /access-pending.
async function postAuthDestination(returnTo: string): Promise<string> {
  let context = null
  try {
    context = await getDashboardContext()
  } catch (error) {
    // Membership resolution dies with the same hosted project. The session was
    // just granted, so identity is known-good; re-decide access when the
    // provider answers again instead of faking a landing.
    if (isAuthProviderOutage(error)) {
      redirect(`/login?outage=1&returnTo=${encodeURIComponent(returnTo)}`)
    }
    throw error
  }
  return destinationForAuthState(
    context ? 'authenticated_member' : 'authenticated_without_membership',
    returnTo,
  )
}
