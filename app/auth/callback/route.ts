import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeReturnTo } from '@/lib/auth/return-url'

// Exchanges the OAuth/magic-link code for a session, then redirects to a
// validated local returnTo. Never redirects to an attacker-supplied origin.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const returnTo = safeReturnTo(searchParams.get('returnTo'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${returnTo}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
