'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Password-reset request server action. Recovery is performed server-side; the
// emailed link lands on /auth/callback which exchanges the recovery code for a
// session and forwards to the dashboard. The response is always the same
// generic confirmation regardless of whether the address exists — no
// user-enumeration, no token logging.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '')

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${proto}://${host}` : ''

  const supabase = await createClient()
  // Fire-and-forget: ignore the result so timing/errors can't reveal account
  // existence. Supabase itself does not error on unknown addresses.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?returnTo=/dashboard`,
  })

  redirect('/forgot-password?sent=1')
}
