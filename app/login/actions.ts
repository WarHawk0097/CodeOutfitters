'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const returnTo = safeReturnTo(String(formData.get('returnTo') ?? ''))
  const denied = `/login?error=1&returnTo=${encodeURIComponent(returnTo)}`

  // The published demo credential is a demo-mode artefact. In live mode it is
  // rejected outright, before any auth call, so it can never become a real
  // account password by accident.
  if (password === DEMO_PASSWORD) redirect(denied)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(denied)

  redirect(await postAuthDestination(returnTo))
}

// Starts the real provider OAuth flow. The provider id is validated against the
// server-side allowlist and the server-side configuration flag, so the browser
// cannot launch a provider that is not actually configured.
export async function signInWithProvider(formData: FormData) {
  const raw = String(formData.get('provider') ?? '')
  const returnTo = safeReturnTo(String(formData.get('returnTo') ?? ''))
  const failure = destinationForAuthState('auth_error', returnTo)

  if (isDemoMode()) redirect(failure)
  if (raw !== 'google' && raw !== 'apple') redirect(failure)
  const provider: OAuthProviderId = raw
  if (!isProviderConfigured(provider)) redirect(failure)

  const redirectTo = oauthCallbackUrl(returnTo)
  if (!redirectTo) redirect(failure)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
  // `error` may carry provider detail; it is never rendered or logged.
  if (error || !data?.url) redirect(failure)

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Authenticated is not authorized: only an active workspace membership opens the
// dashboard. Everyone else lands on /access-pending.
async function postAuthDestination(returnTo: string): Promise<string> {
  const context = await getDashboardContext()
  return destinationForAuthState(
    context ? 'authenticated_member' : 'authenticated_without_membership',
    returnTo,
  )
}
