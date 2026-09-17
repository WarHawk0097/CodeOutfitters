// Bounded Supabase auth fetch + one shared outage classifier.
//
// The hosted Supabase project is externally managed and can be unreachable
// (paused project, lost DNS, network partition). Two classes of bug follow from
// that, and both have shipped before:
//
//   1. An UNBOUNDED request. `supabase.auth.getUser()` from a server component
//      or the middleware has no deadline of its own; against a host that
//      accepts connections and never answers, every /login and /dashboard
//      request stalls until the platform kills it. The page looks frozen —
//      "click Sign in and nothing happens".
//   2. An UNGUARDED failure. `auth.getUser()` REJECTS on network failure
//      (AuthRetryableFetchError) instead of resolving `{ error }`, so an
//      uncaught rejection in a server component is a 500. The methods that do
//      resolve (`signInWithPassword`, `signInWithOAuth`, `resetPasswordForEmail`,
//      `signOut`) resolve a retryable error that, unclassified, collapses into
//      "wrong password" — a lie the UI must never tell during an outage.
//
// The bounded fetch fixes 1 (every auth HTTP call carries a deadline). The
// classifier fixes 2 (callers branch on `isAuthProviderOutage` and render a
// safe, truthful state). Generic messages only: no provider error strings,
// project refs, or stack traces reach the client or logs.

export const SUPABASE_AUTH_TIMEOUT_MS = 4_000

/**
 * Wraps a fetch with a hard deadline for every Supabase auth HTTP request.
 * Applies to `getUser()`, token refresh, password grant, OAuth URL creation,
 * code exchange, password reset and sign-out alike — one boundary, no call
 * site can forget it.
 *
 * An existing caller signal (a superseded navigation) is combined with the
 * deadline rather than replaced by it. The rejection that reaches auth-js is
 * a DOMException TimeoutError, which auth-js converts to its retryable
 * network-error class — handled below by `isAuthProviderOutage`.
 */
export function withAuthFetchTimeout(
  fetchFn: typeof fetch,
  timeoutMs: number = SUPABASE_AUTH_TIMEOUT_MS,
): typeof fetch {
  return async function boundedSupabaseAuthFetch(input, init) {
    const timeout = AbortSignal.timeout(timeoutMs)
    const merged = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
    return fetchFn(input, { ...init, signal: merged })
  }
}

/**
 * True when the auth provider cannot answer properly — the request never got a
 * real GoTrue answer (network refused, DNS dead, bounded deadline elapsed) or
 * the auth service answered with a server-side failure (5xx; auth-js raises
 * AuthRetryableFetchError for exactly those). Both mean "sign-in cannot work
 * right now". Distinct from a credential rejection or an authorization
 * decision, which carry 4xx API statuses and are NOT outages.
 */
export function isAuthProviderOutage(error: unknown): boolean {
  if (!(error instanceof Error) || error.name !== 'AuthRetryableFetchError') return false
  const status = (error as { status?: number }).status
  return status === 0 || (typeof status === 'number' && status >= 500)
}
