"use client";
// Form controls with the accessibility the brief requires wired in once: a visible label
// bound to the control, and a validation message associated through aria-describedby and
// aria-invalid rather than left as loose red text next to an input.
import { useId } from "react";
import type { ReactNode } from "react";

const CONTROL =
  "w-full rounded-cc-control border border-cc-line-strong bg-cc-surface px-2.5 py-1.5 text-[12.5px] text-cc-ink focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-cc-green";

function Wrapper({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label htmlFor={id} className="mb-1 block text-[11.5px] font-semibold text-cc-t2">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-cc-t3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-semibold text-cc-red-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  type?: "text" | "email" | "date" | "time" | "number";
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  error,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  hint?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="mb-3 flex items-start gap-2.5 last:mb-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--cc-green)]"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[12.5px] text-cc-ink">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-[11px] text-cc-t3">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** A field the demo deliberately does not accept a value for — an API key, a provider
 *  secret. Rendered as an explanation, never as an input that looks like it will store
 *  something. */
export function SecretFieldNotice({ label, help }: { label: string; help?: string }) {
  return (
    <div className="mb-3 rounded-cc-control border border-dashed border-cc-line-strong bg-cc-secondary px-2.5 py-2 last:mb-0">
      <p className="text-[11.5px] font-semibold text-cc-t2">{label}</p>
      <p className="mt-0.5 text-[11px] text-cc-t3">
        {help ?? "Demo mode never asks for or stores a credential. No provider is connected."}
      </p>
    </div>
  );
}
