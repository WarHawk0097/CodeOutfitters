import Link from 'next/link'
import { LogOut, TriangleAlert, Zap } from 'lucide-react'
import { resolveDashboardContext } from '@/lib/command-center/data'
import { isDemoMode, CommandCenterConfigError } from '@/lib/command-center/mode'
import { signOut } from '@/app/login/actions'

// Every /dashboard/** route is per-request (auth in live mode, env-mode branch in
// demo) — never statically prerendered. This also prevents build-time evaluation
// of the Supabase client (which needs runtime env).
export const dynamic = 'force-dynamic'

// Server-rendered shell. resolveDashboardContext() is the mode boundary: in demo
// mode it returns a fixture workspace without touching Supabase; in live mode it
// asserts config then runs the Work Order F auth guard (requireDashboardContext).
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const demo = isDemoMode()

  let ctx
  try {
    ctx = await resolveDashboardContext('/dashboard')
  } catch (err) {
    // Live mode with missing configuration fails as a controlled notice, never a
    // raw 500 that leaks stack/env. redirect() signals (live auth) are not
    // CommandCenterConfigError, so they propagate normally.
    if (err instanceof CommandCenterConfigError) return <ConfigNotice missing={err.missing} />
    throw err
  }

  return (
    <div className="min-h-[100dvh] bg-[#1C1612]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A6B5A]">
                <Zap className="h-4 w-4 text-white" fill="white" />
              </div>
              <span className="font-heading text-base font-bold tracking-tight text-white">
                Command Center
              </span>
            </Link>
            <span className="hidden text-sm text-white/40 sm:inline">
              {ctx.workspaceName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {demo ? (
              <span className="rounded-full border border-[#C8A96E]/30 bg-[#C8A96E]/10 px-2.5 py-1 text-[11px] font-medium text-[#C8A96E]">
                Demo
              </span>
            ) : (
              <>
                <span className="hidden text-xs text-white/40 sm:inline">
                  {ctx.email} · {ctx.role}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </header>

      {demo && (
        <div className="border-b border-[#C8A96E]/20 bg-[#C8A96E]/10">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-2.5 sm:px-6 lg:px-8">
            <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0 text-[#C8A96E]" />
            <p className="text-xs font-medium text-[#C8A96E]">
              Demo workspace — sample data only. Not connected to live business
              data; sign-in, downloads, and edits are disabled.
            </p>
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  )
}

function ConfigNotice({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#1C1612] px-6">
      <div className="max-w-md rounded-2xl border border-white/10 bg-[#1C3D32] p-8 text-center">
        <TriangleAlert className="mx-auto mb-4 h-8 w-8 text-[#C8A96E]" />
        <h1 className="font-heading text-lg font-bold text-white">
          Command Center is not configured
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Live mode requires the production data service. Missing configuration:{' '}
          <span className="text-white/70">{missing.join(', ')}</span>.
        </p>
      </div>
    </div>
  )
}
