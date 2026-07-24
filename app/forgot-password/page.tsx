import type { Metadata } from 'next'
import Link from 'next/link'
import { isDemoMode } from '@/lib/command-center/mode'
import { requestPasswordReset } from './actions'

export const metadata: Metadata = { title: 'Reset password — CodeOutfitters Command Center' }

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const sp = await searchParams
  const sent = Boolean(sp.sent)

  // Demo mode has no real auth plane: never touch Supabase here and never show a
  // reset form that cannot deliver mail. Offer honest direct entry, matching
  // /login's demo branch.
  if (isDemoMode()) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--brand-bg,#0A120E)] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--brand-text,#111)]">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">
            This is a demo. No account required — password reset is disabled in demo mode.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 block w-full rounded-md bg-[var(--brand-green,#0A7C4A)] px-4 py-2 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            Open Command Center
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--brand-bg,#0A120E)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--brand-text,#111)]">
          Reset password
        </h1>

        {sent ? (
          <>
            <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">
              If an account exists for that address, we&apos;ve sent a reset link. Check your inbox.
            </p>
            <Link
              href="/login"
              className="mt-6 block w-full rounded-md bg-[var(--brand-green,#0A7C4A)] px-4 py-2 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">
              Enter your email and we&apos;ll send a reset link.
            </p>

            <form action={requestPasswordReset} className="mt-6 space-y-4">
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
              <button
                type="submit"
                className="w-full rounded-md bg-[var(--brand-green,#0A7C4A)] px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Send reset link
              </button>
            </form>

            <Link
              href="/login"
              className="mt-4 block text-center text-sm text-[var(--brand-muted,#666)] underline-offset-2 hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
