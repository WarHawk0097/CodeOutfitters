import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

// Run on dashboard + auth routes only; skip static assets and the public site so
// the marketing pages keep their static behavior.
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/auth/:path*'],
}
