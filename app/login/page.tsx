import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { boundedGetUser, isAuthProviderOutage } from '@/lib/supabase/bounded-auth-fetch'
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
  // when the hosted auth provider is unreachable it fails fast and — whichever
  // delivery contract auth-js uses, resolved `{ data, error }` or thrown —
  // boundedGetUser classifies it as an outage. That must render an explicit,
  // honest outage state — never an unhandled 500 (the "click Sign in and
  // nothing happens" bug) and never a fake success.
  const supabase = await createClient()
  const userResult = await boundedGetUser(() => supabase.auth.getUser())
  if (userResult.outcome === 'outage') {
    return (
      <LoginFrame>
        <AuthOutageNotice />
      </LoginFrame>
    )
  }
  const user = userResult.outcome === 'authenticated' ? userResult.user : null

  if (user) {
    // Authenticated: membership — not authentication — decides where they land.
    // getDashboardContext now throws the classified outage error itself when the
    // auth or data plane is unreachable (identity confirmed or not — the read
    // failed after all), so a provider failure lands on the explicit
    // identity-confirmed notice instead of a bare 500 or a misdirect to
    // /access-pending.
    let context = null
    try {
      context = await getDashboardContext()
    } catch (error) {
      if (isAuthProviderOutage(error)) {
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
      throw error
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
