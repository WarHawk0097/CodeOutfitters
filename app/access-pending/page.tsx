import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardContext } from '@/lib/dashboard/server'
import { isDemoMode } from '@/lib/command-center/mode'
import { LoginFrame } from '../login/login-frame'
import { signOut } from '../login/actions'

export const metadata: Metadata = {
  title: 'Access pending — CodeOutfitters Command Center',
}

// The `access_pending` state: a real, verified sign-in that carries no active
// workspace membership. Nothing here grants access — there is no "request
// access" button that self-provisions, and no email-domain shortcut. The owner
// adds people explicitly; until then this page is the whole experience.
export default async function AccessPendingPage() {
  // Demo mode has no auth plane, so this state cannot exist there.
  if (isDemoMode()) redirect('/login')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnTo=%2Fdashboard')

  // Membership may have been granted since the redirect; re-check before showing
  // a dead end.
  const context = await getDashboardContext()
  if (context) redirect('/dashboard')

  return (
    <LoginFrame>
      <div className="login-form-wrap">
        <h1 className="login-title">Access pending</h1>
        <p className="login-subtitle">
          You are signed in as <strong>{user.email ?? 'your account'}</strong>, but this
          account does not have access to a CodeOutfitters workspace yet.
        </p>
        <p className="login-subtitle">
          A workspace owner has to add you before the Command Center opens. Once that
          happens, sign in again and you will land straight on your dashboard.
        </p>
        <form action={signOut}>
          <button type="submit" className="login-submit">
            Sign out
          </button>
        </form>
      </div>
    </LoginFrame>
  )
}
