import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeReturnTo } from '@/lib/auth/return-url'
import { resolvedAuthError } from './bounded-auth-fetch'

// Vercel edge middleware has a finite execution budget. Supabase Auth is a
// network dependency, so a stalled request must be cancelled well before that
// budget is exhausted instead of turning every matched route into a 25s timeout.
const AUTH_FETCH_TIMEOUT_MS = 4_000

// Routes an outage must fail closed on. /dashboard is authorization;
// /access-pending and /extension-auth are membership-state pages that must not
// render a "you have no access" verdict while the provider cannot answer.
function needsGuard(pathname: string): boolean {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/access-pending' ||
    pathname.startsWith('/access-pending/') ||
    pathname === '/extension-auth' ||
    pathname.startsWith('/extension-auth/')
  )
}

const authFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController()
  const parentSignal = init?.signal
  const abortFromParent = () => controller.abort(parentSignal?.reason)

  if (parentSignal?.aborted) abortFromParent()
  else parentSignal?.addEventListener('abort', abortFromParent, { once: true })

  const timeout = setTimeout(
    () => controller.abort(new Error('supabase_auth_timeout')),
    AUTH_FETCH_TIMEOUT_MS,
  )

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
    parentSignal?.removeEventListener('abort', abortFromParent)
  }
}

// Refreshes the Supabase auth cookie on every matched request and guards
// /dashboard/**. Unauthenticated dashboard access redirects to /login with a
// validated returnTo. Auth is validated with getUser() (contacts the auth
// server), never getSession() alone.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return response

  const supabase = createServerClient(url, anonKey, {
    global: { fetch: authFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const path = request.nextUrl.pathname
  let user = null
  let providerOutage = false
  try {
    const result = await supabase.auth.getUser()
    // auth-js resolves `{ data: { user: null }, error }` on a network-class
    // failure (it catches auth errors internally) — the resolved error, not a
    // throw, is what an outage actually looks like here. Classify it: treating
    // it as "no user" would bounce signed-in members to /login.
    if (resolvedAuthError(result)) providerOutage = true
    else user = result.data.user
  } catch {
    // Thrown network-class errors keep the same fail-closed handling.
    providerOutage = true
  }

  if (providerOutage) {
    // Never turn an auth-provider outage into an authorization decision.
    // Protected routes fail closed and explicitly retry; login, callback and
    // access-pending stay reachable so users are not trapped behind middleware
    // during recovery.
    if (needsGuard(path)) {
      return new NextResponse('Authentication temporarily unavailable.', {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '5',
        },
      })
    }
    return response
  }

  if (!user && needsGuard(path)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('returnTo', safeReturnTo(path + request.nextUrl.search))
    return NextResponse.redirect(loginUrl)
  }

  return response
}
