import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeReturnTo } from '@/lib/auth/return-url'
import { isDemoMode } from '@/lib/command-center/mode'
import { signIn } from './actions'
import { LoginFrame } from './login-frame'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in — CodeOutfitters Command Center' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>
}) {
  const sp = await searchParams
  const returnTo = safeReturnTo(sp.returnTo)
  const hasError = Boolean(sp.error)

  // Demo mode has no auth plane: never touch Supabase here (that would be a
  // Supabase request from a demo page). The form validates the published demo
  // credential in memory and opens the demo workspace.
  if (isDemoMode()) {
    return (
      <LoginFrame>
        <LoginForm live={false} initialError={false} returnTo={returnTo} />
      </LoginFrame>
    )
  }

  // Live mode: unchanged Work Order F behaviour — already-authenticated users
  // skip the form, everyone else posts to the existing signIn server action.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect(returnTo)

  return (
    <LoginFrame>
      <LoginForm live initialError={hasError} returnTo={returnTo} action={signIn} />
    </LoginFrame>
  )
}
