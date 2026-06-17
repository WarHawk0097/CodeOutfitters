'use client'

// Security 2 (2026-06-16): this client-side password gate is no longer
// the primary admin protection. It is a **convenience-only** gate that
// exists so the admin UI does not render in a casual browser session.
//
// The real admin boundary is **Cloudflare Access** in front of /admin/*
// on the deployed site. Cloudflare Access is mandatory before any
// non-internal deployment. See `docs/SECURITY.md` (R-001), `docs/DEPLOYMENT.md`
// (Cloudflare Access setup), and `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`
// (owner setup steps).
//
// This file must not be promoted to real auth. It must not introduce
// Supabase Auth, Auth.js, a server route, or any auth library. It is
// intentionally a static-friendly, no-dependency convenience gate.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Zap, ChevronRight, ShieldCheck } from 'lucide-react'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem('co_admin_auth')
    if (stored && stored === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true)
    }
    setLoading(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Enter the admin password')
      return
    }
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem('co_admin_auth', password)
      setAuthed(true)
      setError('')
    } else {
      setError('Wrong password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('co_admin_auth')
    setAuthed(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1612] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C8A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#1C1612] flex items-center justify-center px-5">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl p-8 w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#2A6B5A] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-[#1C1612] tracking-tight">
                Admin Access
              </p>
              <p className="text-xs text-[#6B6155]">CodeOutfitters internal</p>
            </div>
          </div>

          <div className="mb-5 p-3 rounded-lg bg-[#E8F5F1] border border-[rgba(42,107,90,0.2)] flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2A6B5A] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-[#1C3D32] leading-relaxed">
              <strong>Convenience gate only.</strong> Real admin protection
              is Cloudflare Access in front of <code className="font-mono">/admin/*</code>{' '}
              on the deployed site. This local check is not security.
            </p>
          </div>

          <label
            htmlFor="admin-pw"
            className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2"
          >
            Password
          </label>
          <input
            id="admin-pw"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Enter admin password"
            autoFocus
            className="w-full bg-[#FAFAF7] border border-transparent rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#1C1612] placeholder-[#9B9088] outline-none transition-all duration-200 focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/15 focus:bg-white"
          />
          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full mt-5 text-sm py-3"
          >
            Unlock Dashboard
          </button>

          <p className="text-[10px] text-[#9B9088] text-center mt-4 leading-relaxed">
            This password is in the static bundle. It is not a security
            boundary. Configure Cloudflare Access in front of{' '}
            <code className="font-mono">/admin/*</code> on Cloudflare Pages.
          </p>
        </form>
      </div>
    )
  }

  const isDashboard = pathname === '/admin'

  return (
    <div className="min-h-screen bg-[#1C1612]">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex items-center gap-2"
              >
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
                title="Cloudflare Access in front of /admin/* is the real admin boundary. This local gate is convenience-only."
              >
                <ShieldCheck className="w-3 h-3" />
                Local gate · Cloudflare Access = primary
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
