'use client'

// The auth-outage notice. When the authentication provider is unreachable the
// sign-in flow must never look frozen, lie about credentials, or fall back to
// demo — it must say, in plain language, that sign-in is temporarily
// unavailable and offer the two safe exits: retry (reload) and the website.
// Internal detail is never shown: no provider names, no error strings, no
// status codes, no project identifiers — and no account identifiers either
// (the confirmed variant says identity was verified without naming it).
//
// Two variants, one component:
//   - default: the visitor never got far enough for identity to matter.
//   - identity-confirmed (`identityConfirmed`): the provider verified the
//     person before dying, so the notice says so and stays truthful about what
//     happens after restoration — access is re-decided then, nothing promised.
import Link from 'next/link'

export function AuthOutageNotice({
  identityConfirmed = false,
  pendingMessage = null,
}: {
  identityConfirmed?: boolean
  pendingMessage?: string | null
} = {}) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="login-alert login-outage"
      aria-labelledby="auth-outage-heading"
    >
      <h2 id="auth-outage-heading" className="login-outage-heading">
        Sign in is temporarily unavailable
      </h2>
      {identityConfirmed ? (
        <>
          <p className="login-outage-copy">
            Your sign-in was confirmed, but your workspace access could not be verified because
            the authentication service is temporarily unavailable.
          </p>
          {pendingMessage ? <p className="login-outage-copy">{pendingMessage}</p> : null}
        </>
      ) : (
        <p className="login-outage-copy">
          We could not reach the authentication service just now. Your credentials were not
          accepted or rejected — the sign-in service itself is unreachable.
        </p>
      )}
      <p className="login-outage-copy">Please try again shortly.</p>
      <div className="login-outage-actions">
        <button
          type="button"
          className="login-outage-retry"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
        <Link href="/" className="login-outage-home">
          Back to the website
        </Link>
      </div>
      <style>{`
.login-outage{display:flex;flex-direction:column;gap:10px}
.login-outage-heading{margin:0;font:600 17px/1.3 'Space Grotesk',sans-serif;color:#0A120E}
.login-outage-copy{margin:0;font:400 14px/1.5 'Instrument Sans',sans-serif;color:#4A5248}
.login-outage-actions{display:flex;align-items:center;gap:14px;margin-top:4px;flex-wrap:wrap}
.login-outage-retry{font:600 14px 'Instrument Sans',sans-serif;color:#F7F2EA;background:#0E2A1D;border:0;border-radius:10px;padding:10px 18px;cursor:pointer;transition:.15s}
.login-outage-retry:hover{background:var(--brand-green-solid)}
.login-outage-home{font:600 14px 'Instrument Sans',sans-serif;color:var(--brand-green-ink);text-decoration:none}
.login-outage-home:hover{text-decoration:underline}
      `}</style>
    </section>
  )
}
