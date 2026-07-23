'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeReturnTo } from '@/lib/auth/return-url'

// Password sign-in server action. Auth is performed server-side; on success the
// session cookie is set by the SSR client and the user is sent to a validated
// local returnTo. Errors are surfaced generically (no user-enumeration, no
// token logging).
export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const returnTo = safeReturnTo(String(formData.get('returnTo') ?? ''))

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(`/login?error=1&returnTo=${encodeURIComponent(returnTo)}`)
  }
  redirect(returnTo)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
