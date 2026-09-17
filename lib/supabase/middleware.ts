import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeReturnTo } from '@/lib/auth/return-url'

// Vercel edge middleware has a finite execution budget. Supabase Auth is a
// network dependency, so a stalled request must be cancelled well before that
// budget is exhausted instead of turning every matched route into a 25s timeout.
const AUTH_FETCH_TIMEOUT_MS = 4_000

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
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    // Never turn an auth-provider outage into an authorization bypass. Dashboard
    // routes fail closed and explicitly retry; login/callback surfaces remain
    // reachable so users are not trapped behind middleware during recovery.
    if (path.startsWith('/dashboard')) {
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

  if (!user && path.startsWith('/dashboard')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('returnTo', safeReturnTo(path + request.nextUrl.search))
    return NextResponse.redirect(loginUrl)
  }

  return response
}
