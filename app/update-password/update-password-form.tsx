"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { updatePassword, type UpdatePasswordState } from "./actions";

const INITIAL_STATE: UpdatePasswordState = { status: "idle" };

export function UpdatePasswordForm() {
  const uid = useId();
  const [state, formAction, pending] = useActionState(updatePassword, INITIAL_STATE);
  const passwordId = `${uid}-password`;
  const confirmId = `${uid}-confirm`;
  const errorId = `${uid}-error`;

  if (state.status === "success") {
    return (
      <div className="mt-6">
        <p role="status" className="text-sm text-[var(--brand-muted,#666)]">
          Your password has been updated. Sign in with your new password to continue.
        </p>
        <Link
          href="/login"
          className="mt-6 block w-full rounded-md bg-[var(--brand-green-solid,#0E7A4E)] px-4 py-2 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.status === "error" && state.message ? (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor={passwordId} className="block text-sm font-medium text-[var(--brand-text,#111)]">
          New password
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          aria-describedby={state.status === "error" ? errorId : undefined}
          className="mt-1 block w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand-focus,#0E7A4E)] focus:ring-2 focus:ring-[var(--brand-focus,#0E7A4E)]/30"
        />
      </div>

      <div>
        <label htmlFor={confirmId} className="block text-sm font-medium text-[var(--brand-text,#111)]">
          Confirm new password
        </label>
        <input
          id={confirmId}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          aria-describedby={state.status === "error" ? errorId : undefined}
          className="mt-1 block w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand-focus,#0E7A4E)] focus:ring-2 focus:ring-[var(--brand-focus,#0E7A4E)]/30"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[var(--brand-green-solid,#0E7A4E)] px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
