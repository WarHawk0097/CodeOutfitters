import { createBrowserClient } from '@supabase/ssr'

// Browser (client component) Supabase client — anon key only. Never import the
// service-role client into anything that ships to the browser.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createBrowserClient(url, anonKey)
}
