import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canonicalHostRedirect } from '@/lib/routing/public-origin'
import { isDemoMode } from '@/lib/command-center/mode'

// Paths whose Supabase auth cookie must be refreshed, and which the /dashboard
// guard depends on. Everything else is matched only so a production request
// arriving on a Vercel system alias can be folded onto the canonical origin.
const SESSION_PATHS = ['/dashboard', '/login', '/access-pending', '/auth']

function needsSession(pathname: string): boolean {
  return SESSION_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export async function middleware(request: NextRequest) {
  // One client-facing origin. Production only, never for /api, /auth, /proposal or
  // Vercel internals, and path plus query are preserved.
  const canonical = canonicalHostRedirect({
    host: request.headers.get('x-forwarded-host') ?? request.headers.get('host'),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  })
  if (canonical) return NextResponse.redirect(canonical, 308)

  // Demo mode has no auth plane at all (see app/login/page.tsx) — the Supabase
  // session guard must not run against it, or an unauthenticated demo visit to
  // /dashboard bounces straight back to /login even after a correct demo sign-in.
  if (needsSession(request.nextUrl.pathname) && !isDemoMode()) return updateSession(request)
  return NextResponse.next()
}

// The public site is matched for the host redirect but does no session work, so the
// marketing pages keep their static behavior. Static assets, Next internals and the
// API surface are excluded outright.
export const config = {
  matcher: ['/((?!api/|_next/|_vercel/|.*\\.[^/]+$).*)'],
}
