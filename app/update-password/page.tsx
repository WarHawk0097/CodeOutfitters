import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isDemoMode } from '@/lib/command-center/mode'
import { createClient } from '@/lib/supabase/server'
import { UpdatePasswordForm } from './update-password-form'

export const metadata: Metadata = { title: 'Set new password — CodeOutfitters Command Center' }

export default async function UpdatePasswordPage() {
  // Demo mode has no real auth plane, matching /forgot-password's demo branch:
  // never touch Supabase here and never show a form that cannot actually work.
  if (isDemoMode()) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--brand-bg,#0A120E)] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--brand-text,#111)]">Set a new password</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">
            This is a demo. Password reset is disabled in demo mode.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 block w-full rounded-md bg-[var(--brand-green-solid,#0E7A4E)] px-4 py-2 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            Open Command Center
          </Link>
        </div>
      </main>
    )
  }

  // Requires the real session established by the recovery link's code exchange
  // in /auth/callback. Direct or unauthenticated access (no code ever
  // exchanged, or an expired/already-used link) fails safe to /login rather
  // than rendering a form with no session behind it.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--brand-bg,#0A120E)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--brand-text,#111)]">Set a new password</h1>
        <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">
          Choose a new password for your account.
        </p>
        <UpdatePasswordForm />
      </div>
    </main>
  )
}
