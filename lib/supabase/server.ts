import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server (Server Component / Route Handler) Supabase client bound to the request
// cookies. Auth is ALWAYS validated server-side with supabase.auth.getUser();
// callers must never trust getSession() alone for an authorization decision.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
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
