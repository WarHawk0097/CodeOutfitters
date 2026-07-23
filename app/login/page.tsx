import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeReturnTo } from '@/lib/auth/return-url'
import { isDemoMode } from '@/lib/command-center/mode'
import { signIn } from './actions'

export const metadata: Metadata = { title: 'Sign in — CodeOutfitters Command Center' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>
}) {
  const sp = await searchParams
  const returnTo = safeReturnTo(sp.returnTo)
  const hasError = Boolean(sp.error)

  // Demo mode has no real auth plane: never touch Supabase here (that would be a demo
  // Supabase call), never show a credential form that cannot authenticate. Offer honest
  // direct entry to the demo Command Center instead.
  if (isDemoMode()) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--brand-bg,#0A120E)] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--brand-text,#111)]">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">
            This is a demo. No account is required — sign-in is disabled in demo mode.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 block w-full rounded-md bg-[var(--brand-green,#0A7C4A)] px-4 py-2 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            Open the demo Command Center
          </Link>
        </div>
      </main>
    )
  }

  // Already signed in? Skip the form.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect(returnTo)

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--brand-bg,#0A120E)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--brand-text,#111)]">
          Command Center
        </h1>
        <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">
          Sign in to your workspace.
        </p>

        {hasError && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid email or password.
          </p>
        )}

        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--brand-text,#111)]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand-green,#0A7C4A)] focus:ring-2 focus:ring-[var(--brand-green,#0A7C4A)]/30"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--brand-text,#111)]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand-green,#0A7C4A)] focus:ring-2 focus:ring-[var(--brand-green,#0A7C4A)]/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--brand-green,#0A7C4A)] px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  )
}
