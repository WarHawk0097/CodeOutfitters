'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { publicOrigin } from '@/lib/routing/public-origin'

// Password-reset request server action. Recovery is performed server-side; the
// emailed link lands on /auth/callback which exchanges the recovery code for a
// session and forwards to the dashboard. The response is always the same
// generic confirmation regardless of whether the address exists — no
// user-enumeration, no token logging.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '')

  // The emailed link is built from the resolved public origin, never from the
  // request's forwarded host: a forwarded host is caller-controlled, and a reset
  // link that honours it is a working account-takeover redirect.
  const origin = publicOrigin()

  const supabase = await createClient()
  // Fire-and-forget: ignore the result so timing/errors can't reveal account
  // existence. Supabase itself does not error on unknown addresses.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?returnTo=/dashboard`,
  })

  redirect('/forgot-password?sent=1')
}
