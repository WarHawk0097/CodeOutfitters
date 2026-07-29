// The seven authentication states of the Command Center sign-in flow, plus the
// only user-facing failure text. Provider/Supabase errors are never surfaced:
// every failure collapses to `auth_error` and one generic sentence, so we cannot
// leak provider internals, token material or account-existence hints.

export type AuthState =
  | 'loading'
  | 'signed_out'
  | 'authenticating'
  | 'authenticated_without_membership'
  | 'authenticated_member'
  | 'access_pending'
  | 'auth_error'

export const AUTH_STATES: readonly AuthState[] = [
  'loading',
  'signed_out',
  'authenticating',
  'authenticated_without_membership',
  'authenticated_member',
  'access_pending',
  'auth_error',
]

/** Shown for every `auth_error`, whatever actually failed upstream. */
export const GENERIC_AUTH_ERROR =
  'We could not complete sign-in. Please try again.'

/**
 * Where a resolved post-callback state sends the browser. An authenticated user
 * without an active workspace membership is never admitted to /dashboard — no
 * "first user in wins" path exists.
 */
export function destinationForAuthState(
  state: AuthState,
  returnTo: string,
): string {
  switch (state) {
    case 'authenticated_member':
      return returnTo
    case 'authenticated_without_membership':
    case 'access_pending':
      return '/access-pending'
    default:
      return '/login?error=auth'
  }
}
