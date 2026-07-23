import Link from 'next/link'
import { LogOut, Zap } from 'lucide-react'
import { requireDashboardContext } from '@/lib/dashboard/server'
import { signOut } from '@/app/login/actions'

// Every /dashboard/** route is per-request authenticated data — never
// statically prerendered. This also prevents build-time evaluation of the
// Supabase client (which needs runtime env).
export const dynamic = 'force-dynamic'

// Server-rendered shell. requireDashboardContext() is the authorization
// boundary for every /dashboard/** page (the middleware redirects
// unauthenticated users too; this is defense in depth and also resolves the
// active workspace shown in the header).
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await requireDashboardContext('/dashboard')

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
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
