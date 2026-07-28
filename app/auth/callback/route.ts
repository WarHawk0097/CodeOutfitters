import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeReturnTo } from '@/lib/auth/return-url'
import { destinationForAuthState, type AuthState } from '@/lib/auth/auth-state'
import { getDashboardContext } from '@/lib/dashboard/server'

// OAuth / magic-link landing. The session is exchanged and validated SERVER-side,
// then authorization is decided by workspace membership rows — never by the
// provider, never by an email domain, never by "first user wins".
//
//   provider -> /auth/callback -> exchange -> getUser() -> membership check
//     member                       -> validated same-origin returnTo
//     authenticated, no membership -> /access-pending
//     anything else                -> /login?error=auth  (one generic message)
//
// Provider errors arrive as query params (`error`, `error_description`); they are
// read only to detect failure and are never echoed back to the browser or logged.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const fail = () =>
    NextResponse.redirect(`${origin}${destinationForAuthState('auth_error', returnTo)}`)

  if (searchParams.get('error')) return fail()

  const code = searchParams.get('code')
  if (!code) return fail()

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return fail()

  // Re-read the user from the auth server; never trust the exchange result alone.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail()

  let context = await getDashboardContext()

  // No membership yet: the controlled, single-use owner bootstrap is the only
  // path that can mint one. It enforces every precondition in the database and
  // rejects every user who is not the allowlisted owner, so calling it here is
  // safe for anyone — a denial simply leaves the user without membership.
  if (!context) {
    await supabase.rpc('bootstrap_initial_workspace_owner')
    context = await getDashboardContext()
  }

  const state: AuthState = context
    ? 'authenticated_member'
    : 'authenticated_without_membership'

  return NextResponse.redirect(`${origin}${destinationForAuthState(state, returnTo)}`)
}
