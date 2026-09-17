import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAuthProviderOutage } from '@/lib/supabase/bounded-auth-fetch'
import { safeReturnTo } from '@/lib/auth/return-url'
import { destinationForAuthState } from '@/lib/auth/auth-state'
import { providerAvailability } from '@/lib/auth/providers'
import { getDashboardContext } from '@/lib/dashboard/server'
import { isDemoMode } from '@/lib/command-center/mode'
import { signIn, signInWithProvider } from './actions'
import { LoginFrame } from './login-frame'
import { LoginForm } from './login-form'
import { AuthOutageNotice } from './auth-outage-notice'

export const metadata: Metadata = { title: 'Sign in — CodeOutfitters Command Center' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string; outage?: string }>
}) {
  const sp = await searchParams
  const returnTo = safeReturnTo(sp.returnTo)
  const hasError = Boolean(sp.error)
  // `outage=1` may still arrive from old bookmarks/actions; the page itself now
  // detects an outage live, so the parameter carries no rendering behavior.
  void sp.outage

  // Demo mode has no auth plane: never touch Supabase here (that would be a
  // Supabase request from a demo page). The form validates the published demo
  // credential in memory and opens the demo workspace. Provider buttons render
  // disabled with an accessible reason.
  if (isDemoMode()) {
    return (
      <LoginFrame>
        <LoginForm
          live={false}
          initialError={false}
          returnTo={returnTo}
          providers={providerAvailability(false)}
        />
      </LoginFrame>
    )
  }

  // Live mode. The bounded auth fetch guarantees the getUser() call completes;
  // when the hosted auth provider is unreachable it fails fast with a
  // network-class error. That must render an explicit, honest outage state —
  // never an unhandled 500 (the "click Sign in and nothing happens" bug) and
  // never a fake success.
  const supabase = await createClient()
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    if (isAuthProviderOutage(error)) {
      return (
        <LoginFrame>
          <AuthOutageNotice />
        </LoginFrame>
      )
    }
    throw error
  }

  if (user) {
    // Authenticated: membership — not authentication — decides where they land.
    // The membership READ goes through PostgREST, which dies with the same
    // hosted project, so a failed check is also an outage signal. We cannot
    // distinguish "no membership" from "membership unreachable" without a
    // second failing request, so the visitor sees an explicit
    // identity-confirmed notice (with a truthful post-restoration outlook)
    // instead of a bare 500 or a misdirect to /access-pending.
    let context = null
    let membershipCheckFailed = false
    try {
      context = await getDashboardContext()
    } catch (error) {
      if (isAuthProviderOutage(error)) membershipCheckFailed = true
      else throw error
    }
    if (membershipCheckFailed) {
      return (
        <LoginFrame>
          {/* Identity was verified by the provider before it became unreachable;
              the notice says that without echoing the address itself. Access
              decisions are re-made when the provider answers again — nothing is
              promised, nothing faked. */}
          <AuthOutageNotice
            identityConfirmed
            pendingMessage="Once the service is restored, trying again will take you exactly as far as your access allows."
          />
        </LoginFrame>
      )
    }
    redirect(
      destinationForAuthState(
        context ? 'authenticated_member' : 'authenticated_without_membership',
        returnTo,
      ),
    )
  }

  return (
    <LoginFrame>
      <LoginForm
        live
        initialError={hasError}
        returnTo={returnTo}
        action={signIn}
        providers={providerAvailability(true)}
        providerAction={signInWithProvider}
      />
    </LoginFrame>
  )
}
