'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  isAuthProviderOutage,
  resolvedAuthError,
} from '@/lib/supabase/bounded-auth-fetch'
import { publicOrigin } from '@/lib/routing/public-origin'

// Password-reset request server action. Recovery is performed server-side; the
// emailed link lands on /auth/callback which exchanges the recovery code for a
// session and forwards to /update-password to complete the reset. The response
// is always the same generic confirmation regardless of whether the address
// exists — no user-enumeration, no token logging.
//
// When the auth provider is unreachable the reset cannot be sent; the action
// then lands on an explicit "sent=0" state that says the service is
// unavailable. It never renders the generic "we've sent a link" confirmation —
// that would be a fake success.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '')

  // The emailed link is built from the resolved public origin, never from the
  // request's forwarded host: a forwarded host is caller-controlled, and a reset
  // link that honours it is a working account-takeover redirect.
  const origin = publicOrigin()

  const supabase = await createClient()
  try {
    // The result is ignored on success so timing can't reveal account
    // existence; Supabase itself does not error on unknown addresses.
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?returnTo=/update-password`,
    })
    // A resolved network-class error means no reset was sent — the honest
    // "sent=0" state, never the fake "we've sent a link" confirmation.
    if (resolvedAuthError(result)) redirect('/forgot-password?sent=0')
  } catch (error) {
    if (isAuthProviderOutage(error)) redirect('/forgot-password?sent=0')
    throw error
  }

  redirect('/forgot-password?sent=1')
}
