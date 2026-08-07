'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, ChevronRight, ShieldCheck } from 'lucide-react'

// Breadcrumb needs the live pathname, so it stays a client component even
// though the admin layout itself is now server-only (see app/admin/layout.tsx).
export function AdminHeader() {
  const pathname = usePathname()
  const isDashboard = pathname === '/admin'

  return (
    <header className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2A6B5A] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-heading text-base font-bold text-white tracking-tight">
                Admin
              </span>
            </Link>

            {!isDashboard && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                <span className="text-sm text-white/60 capitalize">
                  {pathname.replace('/admin/', '').replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium text-white/40 px-2 py-1 rounded-full bg-white/5 border border-white/10"
              title="Development-only tool. The layout returns a 404 for any non-development build, so this never renders in a deployed environment."
            >
              <ShieldCheck className="w-3 h-3" />
              Dev-only
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
