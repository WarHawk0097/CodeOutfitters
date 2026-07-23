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
