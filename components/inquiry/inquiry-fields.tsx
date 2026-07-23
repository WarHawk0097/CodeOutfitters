'use client'

// Presentational field primitives for the inquiry engine, styled with the
// CodeOutfitters token system (Instrument Sans body, Space Grotesk not used in
// inputs, brand green focus, brand border). Label ABOVE input, helper optional,
// error BELOW the field with role="alert" (spec §18 a11y, taste §4.6). Every
// primitive is register-driven so the shared hook owns validation.
import { type UseFormRegisterReturn } from 'react-hook-form'

const inputClass =
  'w-full min-h-12 rounded-xl bg-white border px-4 py-3 text-sm text-[var(--brand-text)] ' +
  'placeholder-[var(--brand-placeholder)] outline-none transition-all duration-200 ' +
  'focus:border-[var(--brand-green)] focus:ring-2 focus:ring-[var(--brand-green)]/15'

function borderClass(hasError: boolean): string {
  return hasError ? 'border-red-400' : 'border-[var(--brand-border)]'
}

type FieldShell = {
  id: string
  label: string
  error?: string
  required?: boolean
  helper?: string
}

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label
      htmlFor={id}
      className="block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5"
    >
      {label}
      {required && (
        <span className="text-[var(--brand-green)] ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-500">
      {error}
    </p>
  )
}

function Helper({ id, helper }: { id: string; helper?: string }) {
  if (!helper) return null
  return (
    <p id={`${id}-helper`} className="mt-1.5 text-xs text-[var(--brand-muted)]">
      {helper}
    </p>
  )
}

function describedBy(id: string, error?: string, helper?: string): string | undefined {
  const ids = [helper ? `${id}-helper` : null, error ? `${id}-error` : null].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

type TextProps = FieldShell & {
  registration: UseFormRegisterReturn
  type?: 'text' | 'email' | 'tel' | 'url'
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
}

export function InquiryText({
  id,
  label,
  error,
  required,
  helper,
  registration,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
}: TextProps) {
  return (
    <div>
      <Label id={id} label={label} required={required} />
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, helper)}
        className={`${inputClass} ${borderClass(Boolean(error))}`}
        {...registration}
      />
      <Helper id={id} helper={helper} />
      <FieldError id={id} error={error} />
    </div>
  )
}

// Controlled variant for values the shared FORM schema does not own — the
// contextual entity (selectedService / selectedIndustry / selectedCaseStudy)
// lives in source attribution, not form state, so it is fed by value/onChange
// rather than a react-hook-form registration. Prefilled from a CTA, editable,
// and cleared when a new CTA supplies a different entity.
type ControlledTextProps = FieldShell & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function InquiryControlledText({
  id,
  label,
  helper,
  value,
  onChange,
  placeholder,
}: ControlledTextProps) {
  return (
    <div>
      <Label id={id} label={label} />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-describedby={describedBy(id, undefined, helper)}
        className={`${inputClass} ${borderClass(false)}`}
      />
      <Helper id={id} helper={helper} />
    </div>
  )
}

type TextareaProps = FieldShell & {
  registration: UseFormRegisterReturn
  rows?: number
  placeholder?: string
}

export function InquiryTextarea({
  id,
  label,
  error,
  required,
  helper,
  registration,
  rows = 4,
  placeholder,
}: TextareaProps) {
  return (
    <div>
      <Label id={id} label={label} required={required} />
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, helper)}
        className={`${inputClass} ${borderClass(Boolean(error))} resize-y leading-relaxed`}
        {...registration}
      />
      <Helper id={id} helper={helper} />
      <FieldError id={id} error={error} />
    </div>
  )
}

type SelectProps = FieldShell & {
  registration: UseFormRegisterReturn
  options: { value: string; label: string }[]
  placeholder?: string
}

export function InquirySelect({
  id,
  label,
  error,
  required,
  helper,
  registration,
  options,
  placeholder,
}: SelectProps) {
  return (
    <div>
      <Label id={id} label={label} required={required} />
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, helper)}
        defaultValue=""
        className={`${inputClass} ${borderClass(Boolean(error))} appearance-none bg-white`}
        {...registration}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Helper id={id} helper={helper} />
      <FieldError id={id} error={error} />
    </div>
  )
}

type ConsentProps = {
  id: string
  registration: UseFormRegisterReturn
  error?: string
  children: React.ReactNode
}

// Single consent checkbox row (privacy or marketing). Label wraps the control
// so the whole row is a 44px+ touch target (spec §18).
export function InquiryCheckbox({ id, registration, error, children }: ConsentProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-green)]"
          {...registration}
        />
        <span className="text-xs leading-relaxed text-[var(--brand-muted)]">{children}</span>
      </label>
      <FieldError id={id} error={error} />
    </div>
  )
}

// Visually-hidden honeypot. A filled value flags a bot; the hook fakes success
// (existing site convention). Not a real field — never registered with rhf.
export function InquiryHoneypot({
  value,
  onChange,
}: {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      type="text"
      name="company_website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={onChange}
      style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
    />
  )
}
