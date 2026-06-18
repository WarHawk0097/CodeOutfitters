import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Public browser fallback values for the Supabase project.
// These are the public Supabase URL and the public anon key shipped to
// every browser that loads the site. They are safe to include here.
//
// The environment variables NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY are read first (build-time replacement
// for static export). If Cloudflare Pages did not inline them, these
// fallback constants ensure the booking availability still loads.
//
// SECURITY: The Supabase service-role key MUST NEVER be placed in this
// file or anywhere in the frontend bundle. Only the anon key belongs
// in the browser.
const FALLBACK_SUPABASE_URL = 'https://rsxdhwtprmuhzuocyxcu.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeGRod3Rwcm11aHp1b2N5Y3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTY4NTYsImV4cCI6MjA5NzE5Mjg1Nn0.4yJX9oTWaGbXRA8HFoCLwSEmyl7lUMVMVpmRrLeFOdw'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}
