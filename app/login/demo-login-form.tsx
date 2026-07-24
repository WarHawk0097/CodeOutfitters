"use client";

// Demo-only sign-in screen. Demo mode has NO auth plane (no Supabase — see
// page.tsx), so this validates the one published demo credential entirely on the
// client and routes straight into the demo Command Center. The live sign-in path
// (real Supabase, server action) is the separate branch in page.tsx.
//
// Google / Apple are shown but DISABLED on purpose: there is no OAuth provider in
// demo, and faking a social sign-in success would be dishonest. They stay disabled
// with an explanatory note wired via aria-describedby, never a fake "success".
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// The single published demo credential (owner-provided). Email match is
// case-insensitive; password is exact.
const DEMO_EMAIL = "marc@gmail.com";
const DEMO_PASSWORD = "123";

const inputClass =
  "mt-1 block w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand-green,#0A7C4A)] focus:ring-2 focus:ring-[var(--brand-green,#0A7C4A)]/30";

function SocialButton({ label, describedBy }: { label: string; describedBy: string }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-describedby={describedBy}
      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-[var(--brand-muted,#666)] opacity-60"
    >
      Continue with {label}
    </button>
  );
}

export function DemoLoginForm() {
  const router = useRouter();
  const [error, setError] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      router.push("/dashboard");
      return;
    }
    setError(true);
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-[var(--brand-text,#111)]">Command Center</h1>
      <p className="mt-1 text-sm text-[var(--brand-muted,#666)]">Sign in to your workspace.</p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Invalid email or password.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--brand-text,#111)]">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--brand-text,#111)]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-[var(--brand-green,#0A7C4A)] px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Sign in
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-[var(--brand-muted,#666)]">
        Demo credentials — email <b>{DEMO_EMAIL}</b>, password <b>{DEMO_PASSWORD}</b>.
      </p>

      <div className="my-5 flex items-center gap-3 text-xs text-[var(--brand-muted,#666)]">
        <span className="h-px flex-1 bg-black/10" />
        or
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <div className="space-y-2">
        <SocialButton label="Google" describedBy="social-demo-note" />
        <SocialButton label="Apple" describedBy="social-demo-note" />
        <p id="social-demo-note" className="text-center text-xs text-[var(--brand-muted,#666)]">
          Google and Apple sign-in aren&apos;t available in this demo.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="mt-4 block text-center text-sm text-[var(--brand-muted,#666)] underline-offset-2 hover:underline"
      >
        Skip and open the demo dashboard
      </Link>
    </div>
  );
}
