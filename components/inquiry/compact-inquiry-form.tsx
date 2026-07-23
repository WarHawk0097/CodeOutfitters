'use client'

// Compact inquiry form (spec §6 Services/Industries inline forms, §7 popup
// body). Four fields + consent, driven by the shared engine. Same component
// powers the global popup, the Services placement, and the Industries
// placement; copy and formVariant differ per placement, mechanics do not.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Paperclip } from 'lucide-react'
import Link from 'next/link'
import type { FormVariant, InquirySubmissionResponse } from '@/lib/inquiry/inquiry-schema'
import { CompactInquiryValuesSchema } from '@/lib/inquiry/inquiry-form-values'
import type { BuildSourceContextInput } from '@/lib/inquiry/inquiry-source-context'
import { useInquiryForm } from './use-inquiry-form'
import {
  InquiryText,
  InquiryControlledText,
  InquiryTextarea,
  InquiryCheckbox,
  InquiryHoneypot,
} from './inquiry-fields'
import { InquirySuccess } from './inquiry-success'
import { InquiryFileUpload } from './inquiry-file-upload'

// The contextual entity a placement prefills. It lives in source attribution
// (not the form schema), so the form owns it as controlled state and merges it
// into the source at submit — that is what makes it both prefilled and editable.
export type ContextFieldKey = 'selectedService' | 'selectedIndustry' | 'selectedCaseStudy'

export type CompactInquiryFormProps = {
  formVariant: FormVariant
  sourceInput: BuildSourceContextInput
  descriptionLabel: string
  descriptionPlaceholder: string
  submitLabel: string
  // Placement-specific extras (e.g. the prepared file upload on Services /
  // Industries) rendered above the consent block.
  beforeConsent?: React.ReactNode
  onSuccess?: (response: InquirySubmissionResponse) => void
  // Editable contextual entity field (Services/Industries/Case Studies). When
  // set, an input prefilled from sourceInput[contextKey] renders above the
  // workflow description; its live value overrides the static attribution.
  contextKey?: ContextFieldKey
  contextLabel?: string
  contextPlaceholder?: string
  // Opt-in supporting-file uploads (Work Order E). Honored only for the two
  // compact variants the server accepts uploads from; ignored elsewhere so
  // popups/contextual placements stay upload-free.
  enableUploads?: boolean
}

export function CompactInquiryForm({
  formVariant,
  sourceInput,
  descriptionLabel,
  descriptionPlaceholder,
  submitLabel,
  beforeConsent,
  onSuccess,
  contextKey,
  contextLabel,
  contextPlaceholder,
  enableUploads,
}: CompactInquiryFormProps) {
  // Uploads are wired only for the two compact variants the API authorizes.
  const uploadVariant =
    enableUploads && (formVariant === 'services_compact' || formVariant === 'industries_compact')
      ? formVariant
      : null
  const attachmentTokensRef = useRef<string[]>([])
  const getAttachmentTokens = useCallback(() => attachmentTokensRef.current, [])
  // Prefill value the placement supplied for the contextual entity.
  const prefill = contextKey ? sourceInput[contextKey] ?? '' : ''
  const [contextValue, setContextValue] = useState(prefill)
  // A new CTA (different prefill) replaces the field so one placement's entity
  // never lingers into another; user edits within the same prefill are kept.
  useEffect(() => {
    setContextValue(prefill)
  }, [prefill])

  // Live source: the edited contextual entity wins over the static attribution.
  const liveSource: BuildSourceContextInput = contextKey
    ? { ...sourceInput, [contextKey]: contextValue.trim() || undefined }
    : sourceInput

  const { form, status, errorMessage, response, submissionId, onSubmit, honeypot, markStarted } =
    useInquiryForm({
      schema: CompactInquiryValuesSchema,
      formVariant,
      sourceInput: liveSource,
      defaultValues: {
        firstName: '',
        workEmail: '',
        businessName: '',
        workflowDescription: '',
        consent: { privacyAccepted: false, marketingOptIn: false },
      },
      onSuccess,
      ...(uploadVariant ? { getAttachmentTokens } : {}),
    })

  const {
    register,
    formState: { errors },
  } = form

  if (status === 'success' && response) {
    return (
      <InquirySuccess
        response={response}
        formVariant={formVariant}
        sourcePage={sourceInput.pageName}
        compact
      />
    )
  }

  const submitting = status === 'submitting'

  return (
    <form onSubmit={onSubmit} onChange={markStarted} noValidate className="flex flex-col gap-4">
      <InquiryHoneypot value={honeypot.value} onChange={honeypot.onChange} />

      {status === 'error' && errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <InquiryText
          id={`${formVariant}-firstName`}
          label="First name"
          required
          type="text"
          autoComplete="given-name"
          registration={register('firstName')}
          error={errors.firstName?.message}
        />
        <InquiryText
          id={`${formVariant}-workEmail`}
          label="Work email"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          registration={register('workEmail')}
          error={errors.workEmail?.message}
        />
      </div>

      <InquiryText
        id={`${formVariant}-businessName`}
        label="Business name"
        required
        type="text"
        autoComplete="organization"
        registration={register('businessName')}
        error={errors.businessName?.message}
      />

      {contextKey && (
        <InquiryControlledText
          id={`${formVariant}-${contextKey}`}
          label={contextLabel ?? 'Which system?'}
          value={contextValue}
          onChange={setContextValue}
          placeholder={contextPlaceholder}
        />
      )}

      <InquiryTextarea
        id={`${formVariant}-workflowDescription`}
        label={descriptionLabel}
        required
        rows={4}
        placeholder={descriptionPlaceholder}
        registration={register('workflowDescription')}
        error={errors.workflowDescription?.message}
      />

      {uploadVariant && (
        // Restrained by default: a native <details> keeps the compact layout
        // tight and stays keyboard- and reduced-motion-friendly with no JS.
        <details className="group rounded-xl border border-[var(--brand-border)] bg-black/[0.02] px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-[var(--brand-text)] [&::-webkit-details-marker]:hidden">
            <Paperclip className="h-4 w-4 text-[var(--brand-muted)]" />
            Add supporting files
            <span className="font-normal text-[var(--brand-muted)]">(optional)</span>
          </summary>
          <div className="mt-3">
            <InquiryFileUpload
              formVariant={uploadVariant}
              sourcePage={sourceInput.pageName}
              submissionId={submissionId}
              onTokensChange={(tokens) => {
                attachmentTokensRef.current = tokens
              }}
            />
          </div>
        </details>
      )}

      {beforeConsent}

      <InquiryCheckbox
        id={`${formVariant}-privacy`}
        registration={register('consent.privacyAccepted')}
        error={errors.consent?.privacyAccepted?.message}
      >
        I agree to the{' '}
        <Link href="/privacy" className="text-[var(--brand-green)] underline">
          privacy policy
        </Link>
        .
      </InquiryCheckbox>

      <InquiryCheckbox
        id={`${formVariant}-marketing`}
        registration={register('consent.marketingOptIn')}
      >
        Send me the occasional automation tip. Optional, unsubscribe anytime.
      </InquiryCheckbox>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-green)] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            {submitLabel}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}
