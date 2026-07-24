"use client";

// CodeOutfitters Command Center sign-in form.
//
// Two honest modes, one presentation:
//   demo — no auth plane exists (page.tsx never touches Supabase), so the one
//          published demo credential is checked in memory and we open the demo
//          workspace. Nothing is persisted: the password never reaches
//          localStorage, sessionStorage, cookies, the query string or a log.
//   live — the existing Work Order F server action owns authentication. The demo
//          constants below are NOT consulted in live mode, so they can never
//          bypass real auth.
//
// Google / Apple render but stay natively disabled while no OAuth provider is
// configured, each wired to a visible reason through aria-describedby. No fake
// redirect, no fake spinner, no fake success.
import { useId, useRef, useState } from "react";
import Link from "next/link";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  GENERIC_CREDENTIAL_ERROR,
  matchesDemoCredential,
  validateCredentials,
  type LoginErrors,
} from "./credentials";

const PROVIDER_REASON = "Available when live authentication is connected.";

type Errors = LoginErrors;

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 20" width="16" height="20" fill="currentColor" focusable="false">
      <path d="M13.19 10.6c-.02-2.13 1.74-3.15 1.82-3.2-.99-1.45-2.54-1.65-3.09-1.67-1.31-.13-2.56.77-3.23.77-.66 0-1.69-.75-2.78-.73-1.43.02-2.75.83-3.48 2.11-1.48 2.57-.38 6.37 1.06 8.45.71 1.02 1.55 2.17 2.65 2.13 1.06-.04 1.47-.69 2.75-.69 1.28 0 1.64.69 2.76.67 1.14-.02 1.86-1.04 2.56-2.07.8-1.18 1.13-2.33 1.15-2.39-.03-.01-2.2-.85-2.22-3.38ZM11.1 4.05c.58-.71.97-1.7.86-2.68-.84.03-1.85.56-2.45 1.26-.54.63-1.01 1.63-.88 2.6.94.07 1.89-.48 2.47-1.18Z" />
    </svg>
  );
}

export function LoginForm({
  live,
  initialError,
  returnTo,
  action,
}: {
  live: boolean;
  initialError: boolean;
  returnTo: string;
  /** The live sign-in server action, handed down by page.tsx. Absent in demo. */
  action?: (formData: FormData) => void | Promise<void>;
}) {
  const uid = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState(initialError ? GENERIC_CREDENTIAL_ERROR : "");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const emailErrorId = `${uid}-email-error`;
  const passwordErrorId = `${uid}-password-error`;
  const formErrorId = `${uid}-form-error`;
  const providerReasonId = `${uid}-provider-reason`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (submitting) {
      event.preventDefault();
      return;
    }

    const nextErrors = validateCredentials(email, password);
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      event.preventDefault();
      setFormError("");
      setStatus("");
      // Focus the first invalid field.
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    if (live) {
      // Live mode: let the server action run. Demo constants are never consulted.
      setFormError("");
      setSubmitting(true);
      return;
    }

    event.preventDefault();
    setSubmitting(true);

    if (matchesDemoCredential(email, password)) {
      setFormError("");
      setStatus("Opening the demo workspace…");
      // Full navigation rather than a client push: the demo workspace should
      // start from a clean client state, and it keeps this component free of an
      // app-router context so it can be rendered directly in tests.
      window.location.assign("/dashboard");
      return;
    }

    setStatus("");
    setFormError(GENERIC_CREDENTIAL_ERROR);
    setSubmitting(false);
    emailRef.current?.focus();
  }

  function fillDemoCredentials() {
    // Fills only. Never auto-submits.
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setFormError("");
    setStatus("");
    emailRef.current?.focus();
  }

  return (
    <div className="login-form-wrap">
      <h1 className="login-title">Welcome back</h1>
      <p className="login-subtitle">Sign in to your CodeOutfitters Command Center.</p>

      {formError ? (
        <p id={formErrorId} role="alert" className="login-alert">
          {formError}
        </p>
      ) : null}

      <p className="login-status" role="status" aria-live="polite">
        {status}
      </p>

      <form
        className="login-form"
        noValidate
        {...(live && action ? { action } : {})}
        onSubmit={handleSubmit}
      >
        {live ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

        <div className="login-field">
          <label className="login-label" htmlFor={emailId}>
            Email address
          </label>
          <input
            id={emailId}
            ref={emailRef}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="login-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? emailErrorId : undefined}
          />
          {errors.email ? (
            <p id={emailErrorId} className="login-field-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="login-field">
          <div className="login-label-row">
            <label className="login-label" htmlFor={passwordId}>
              Password
            </label>
            <Link className="login-forgot" href="/forgot-password">
              Forgot password
            </Link>
          </div>
          <div className="login-password">
            <input
              id={passwordId}
              ref={passwordRef}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="login-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? "true" : undefined}
              aria-describedby={errors.password ? passwordErrorId : undefined}
            />
            <button
              type="button"
              className="login-reveal"
              onClick={() => setShowPassword((value) => !value)}
              aria-pressed={showPassword}
              aria-controls={passwordId}
            >
              {showPassword ? "Hide" : "Show"}
              <span className="login-sr"> password</span>
            </button>
          </div>
          {errors.password ? (
            <p id={passwordErrorId} className="login-field-error">
              {errors.password}
            </p>
          ) : null}
        </div>

        <button type="submit" className="login-submit" disabled={submitting}>
          Sign in
        </button>
      </form>

      <div className="login-divider">
        <span>or continue with</span>
      </div>

      <div className="login-providers">
        <button
          type="button"
          className="login-provider"
          disabled
          aria-describedby={providerReasonId}
        >
          <GoogleMark />
          Continue with Google
        </button>
        <button
          type="button"
          className="login-provider"
          disabled
          aria-describedby={providerReasonId}
        >
          <AppleMark />
          Continue with Apple
        </button>
        <p id={providerReasonId} className="login-provider-reason">
          {PROVIDER_REASON}
        </p>
      </div>

      {live ? null : (
        <section className="login-demo" aria-labelledby={`${uid}-demo-heading`}>
          <h2 id={`${uid}-demo-heading`} className="login-demo-heading">
            Demo access
          </h2>
          <p className="login-demo-copy">Use the demo credentials to explore the Command Center.</p>
          <dl className="login-demo-list">
            <div>
              <dt>Email</dt>
              <dd>{DEMO_EMAIL}</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>{DEMO_PASSWORD}</dd>
            </div>
          </dl>
          <button type="button" className="login-demo-fill" onClick={fillDemoCredentials}>
            Fill demo credentials
          </button>
        </section>
      )}
    </div>
  );
}
