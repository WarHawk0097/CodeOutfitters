'use server'

import { createClient } from '@/lib/supabase/server'
import { isAuthProviderOutage } from '@/lib/supabase/bounded-auth-fetch'
import { redirect } from 'next/navigation'

// Password-update server action for the recovery destination. The password is
// applied to whichever user the current session cookie belongs to — there is
// no user-id field on the form, so a client cannot ask to change someone
// else's password. No service role, no local persistence of the value.
export type UpdatePasswordState = { status: 'idle' | 'error' | 'success'; message?: string }

const MIN_PASSWORD_LENGTH = 6 // matches supabase/config.toml auth.minimum_password_length

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // Auth provider unreachable: an explicit unavailable message — never a
    // 500, never a message that implies the new password was rejected.
    if (isAuthProviderOutage(error)) {
      return {
        status: 'error',
        message: 'The authentication service is temporarily unavailable. Please try again shortly.',
      }
    }
    throw error
  }
  // No session (direct access, expired/consumed recovery link): fail safe,
  // never accept a password change with nothing behind it.
  if (!user) redirect('/login')

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: 'error', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password !== confirmPassword) {
    return { status: 'error', message: 'Passwords do not match.' }
  }

  let updateError = true
  try {
    const { error } = await supabase.auth.updateUser({ password })
    updateError = Boolean(error)
  } catch (error) {
    if (isAuthProviderOutage(error)) {
      return {
        status: 'error',
        message: 'The authentication service is temporarily unavailable. Please try again shortly.',
      }
    }
    throw error
  }
  // Never surface the raw Supabase/provider error string to the client.
  if (updateError) {
    return { status: 'error', message: 'Could not update your password. Please try again.' }
  }

  // secure_password_change is off, so this session would otherwise keep
  // working after the change. A recovery-link session is single-purpose:
  // end it here and require a fresh sign-in with the new password, rather
  // than leaving a password-reset flow able to keep browsing the dashboard.
  try {
    await supabase.auth.signOut()
  } catch {
    // The local session is cleared by the SSR client even if the auth server
    // is unreachable; sign-out must never strand the flow.
  }

  return { status: 'success' }
}
