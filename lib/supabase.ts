import { createClient, SupabaseClient } from '@supabase/supabase-js'

// SECURITY: No hardcoded Supabase URL or key fallback here. A wrong or
// stale fallback silently points the browser at the wrong project (this
// file previously shipped a mistyped project ref). Missing public config
// must fail loudly instead of degrading to guessed values.
//
// SECURITY: The Supabase service-role key MUST NEVER be placed in this
// file or anywhere in the frontend bundle. Only the anon key belongs
// in the browser.
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}
