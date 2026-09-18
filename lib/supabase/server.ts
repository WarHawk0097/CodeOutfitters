import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withAuthFetchTimeout } from './bounded-auth-fetch'

// Server (Server Component / Route Handler) Supabase client bound to the request
// cookies. Auth is ALWAYS validated server-side with supabase.auth.getUser();
// callers must never trust getSession() alone for an authorization decision.
//
// Every auth HTTP call this client makes is bounded (see withAuthFetchTimeout):
// when the hosted Supabase project is unreachable, callers get a fast,
// classifiable failure instead of a request that stalls until the platform
// kills it. Network-level auth failures are detected with isAuthProviderOutage
// (thrown shape) and resolvedAuthError (resolved `{ data, error }` shape — the
// one auth-js 2.110.8 actually delivers) and rendered as an explicit
// "temporarily unavailable" state — never as a wrong-password message, a 500,
// or a demo fallback.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    global: {
      fetch: withAuthFetchTimeout(fetch),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        // In a Server Component the cookie store is read-only; the middleware
        // performs the actual refresh write, so ignore the failure here.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {}
      },
    },
  })
}
