// Sign-in decision logic, kept pure so it can be tested for real behaviour
// instead of asserted against source strings.
//
// The demo credential is the one the owner publishes on the sign-in screen. It
// is consulted ONLY in demo mode (see login-form.tsx); in live mode the existing
// Supabase server action is the sole authority, so these constants can never be
// used to bypass real authentication.

export const DEMO_EMAIL = "marc@gmail.com";
export const DEMO_PASSWORD = "123";

/** One generic message for every credential failure — never reveal which field was wrong. */
export const GENERIC_CREDENTIAL_ERROR = "The email or password is incorrect.";

export type LoginErrors = { email?: string; password?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const trimmed = email.trim();
  if (!trimmed) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(trimmed)) errors.email = "Enter a valid email address.";
  // Deliberately not trimmed: the password is compared exactly as typed.
  if (!password) errors.password = "Enter your password.";
  return errors;
}

/**
 * Demo-mode credential check. Email is trimmed and compared case-insensitively;
 * the password must match exactly (no trimming, no case folding).
 */
export function matchesDemoCredential(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}
