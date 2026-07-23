// Loading, error and empty presentation shared by every demo route, so the three states
// look and announce the same way everywhere instead of being re-invented per page.
import type { ReactNode } from "react";

export function RouteLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="h-64 animate-pulse rounded-cc-card border border-cc-line bg-cc-soft"
    >
      <span className="sr-only">Loading {label}…</span>
    </div>
  );
}

export function RouteError({
  label,
  error,
  onRetry,
}: {
  label: string;
  error: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="rounded-cc-card border border-cc-line bg-cc-surface p-4 text-sm text-cc-t2">
      <p>
        Couldn&apos;t load {label}: {error}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
      >
        Retry
      </button>
    </div>
  );
}

export function RouteEmpty({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="rounded-cc-card border border-dashed border-cc-line-strong bg-cc-surface px-4 py-10 text-center">
      <p className="text-[13px] font-semibold text-cc-ink">{title}</p>
      {hint ? <p className="mt-1 text-[12px] text-cc-t3">{hint}</p> : null}
    </div>
  );
}
