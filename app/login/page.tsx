import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeReturnTo } from '@/lib/auth/return-url'
import { destinationForAuthState } from '@/lib/auth/auth-state'
import { providerAvailability } from '@/lib/auth/providers'
import { getDashboardContext } from '@/lib/dashboard/server'
import { isDemoMode } from '@/lib/command-center/mode'
import { signIn, signInWithProvider } from './actions'
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

  // Live mode: an already-authenticated visitor skips the form, but membership —
  // not authentication — decides where they land.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const context = await getDashboardContext()
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
