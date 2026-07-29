// Safe return-URL validation — prevents open redirects. Only same-origin
// absolute *paths* are allowed; anything with a scheme/host, protocol-relative
// (`//evil`), or backslash tricks falls back to the dashboard root.
const DEFAULT_RETURN = '/dashboard'

export function safeReturnTo(input: string | null | undefined): string {
  if (!input) return DEFAULT_RETURN
  // Must be a root-relative path and must not start a new authority.
  if (!input.startsWith('/')) return DEFAULT_RETURN
  if (input.startsWith('//') || input.startsWith('/\\')) return DEFAULT_RETURN
  if (input.includes('\\')) return DEFAULT_RETURN
  // Reject anything that smuggles a scheme (e.g. "/%2F", "/http:").
  try {
    const decoded = decodeURIComponent(input)
    if (decoded.startsWith('//') || decoded.includes('\\')) return DEFAULT_RETURN
  } catch {
    return DEFAULT_RETURN
  }
  return input
}

/**
 * Absolute callback URL handed to the OAuth provider. The origin comes from the
 * server's own NEXT_PUBLIC_SITE_URL, never from user input, and the return path
 * is validated first — so a crafted `returnTo` cannot turn the provider round
 * trip into an open redirect.
 */
export function oauthCallbackUrl(
  returnTo: string | null | undefined,
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string | null {
  const base = siteUrl?.trim().replace(/\/+$/, '')
  if (!base) return null
  let origin: string
  try {
    const parsed = new URL(base)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return null
    origin = parsed.origin
  } catch {
    return null
  }
  const safe = safeReturnTo(returnTo)
  return `${origin}/auth/callback?returnTo=${encodeURIComponent(safe)}`
}
