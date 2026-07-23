'use client'

// Full multi-step Contact inquiry (spec §6 Contact flow: Contact, Business,
// Workflow, Supporting files, Review, Submitted/appointment). Runs on the shared
// engine; step navigation validates only the current step's fields before
// advancing and emits inquiry_step_completed. No passwords/usernames/address
// (spec §6). Multi-step forms are out of the marketing-taste scope, so this uses
// standard wizard patterns with the CodeOutfitters token styling.
import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Path } from 'react-hook-form'
import type { FormVariant, InquirySubmissionResponse } from '@/lib/inquiry/inquiry-schema'
import {
  FullInquiryValuesSchema,
  type FullInquiryValues,
} from '@/lib/inquiry/inquiry-form-values'
import type { BuildSourceContextInput } from '@/lib/inquiry/inquiry-source-context'
import { trackInquiryEvent } from '@/lib/inquiry/inquiry-analytics'
import { useInquiryForm } from './use-inquiry-form'
import {
  InquiryText,
  InquiryTextarea,
  InquirySelect,
  InquiryCheckbox,
  InquiryHoneypot,
} from './inquiry-fields'
import { InquiryFileUpload } from './inquiry-file-upload'
import { InquirySuccess } from './inquiry-success'

const FORM_VARIANT = 'contact_full' as const
const PAGE_NAME = 'Contact'

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201+'].map((v) => ({ value: v, label: v }))
const TIMELINES = [
  'As soon as possible',
  'Within 1-3 months',
  'Within 3-6 months',
  'Just exploring',
].map((v) => ({ value: v, label: v }))
const BUDGETS = [
  'Under $5k',
  '$5k - $15k',
  '$15k - $50k',
  'Not sure yet',
].map((v) => ({ value: v, label: v }))

const STEPS = ['Contact', 'Business', 'Workflow', 'Files', 'Review'] as const

const STEP_FIELDS: Path<FullInquiryValues>[][] = [
  ['firstName', 'lastName', 'workEmail', 'phone'],
  ['businessName', 'jobTitle', 'websiteUrl', 'companySize'],
  ['workflowDescription', 'desiredOutcome', 'timeline', 'budgetRange'],
  [],
  ['consent.privacyAccepted'],
]

export function FullInquiryForm({
  onInquirySuccess,
  bookingSlot,
}: {
  // Fired once when the inquiry persists (spec: offer optional scheduling
  // afterward). The inquiry is already committed; this is a UI hand-off only.
  onInquirySuccess?: (response: InquirySubmissionResponse) => void
  // Optional scheduling UI rendered BELOW the success state (Contact page mounts
  // the legacy ContactBookingFlow here). Booking is a separate action — it never
  // re-submits the inquiry, which stays in its terminal success state.
  bookingSlot?: React.ReactNode
} = {}) {
  const [step, setStep] = useState(0)

  // Clean attachment tokens, owned by the uploader and read at submit time. A
  // ref (not state) keeps the getter stable and avoids re-running the hook.
  const attachmentTokensRef = useRef<string[]>([])
  const getAttachmentTokens = useCallback(() => attachmentTokensRef.current, [])

  const { form, status, errorMessage, response, submissionId, onSubmit, honeypot, markStarted } =
    useInquiryForm({
      schema: FullInquiryValuesSchema,
      formVariant: FORM_VARIANT,
      sourceInput: { formVariant: FORM_VARIANT, pageName: PAGE_NAME } satisfies BuildSourceContextInput,
      onSuccess: onInquirySuccess,
      getAttachmentTokens,
      defaultValues: {
        firstName: '',
        lastName: '',
        workEmail: '',
        phone: '',
        businessName: '',
        jobTitle: '',
        websiteUrl: '',
        companySize: '',
        workflowDescription: '',
        desiredOutcome: '',
        timeline: '',
        budgetRange: '',
        consent: { privacyAccepted: false, marketingOptIn: false },
      },
    })

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = form

  if (status === 'success' && response) {
    return (
      <div className="flex flex-col gap-6">
        <InquirySuccess response={response} formVariant={FORM_VARIANT} sourcePage={PAGE_NAME} />
        {bookingSlot}
      </div>
    )
  }

  const isReview = step === STEPS.length - 1
  const submitting = status === 'submitting'

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) return
    trackInquiryEvent('inquiry_step_completed', {
      formVariant: FORM_VARIANT,
      sourcePage: PAGE_NAME,
      step: step + 1,
    })
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <form onSubmit={onSubmit} onChange={markStarted} noValidate className="flex flex-col gap-6">
      <InquiryHoneypot value={honeypot.value} onChange={honeypot.onChange} />

      {/* Step indicator */}
      <ol className="flex items-center gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1 rounded-full transition-colors ${
                index <= step ? 'bg-[var(--brand-green)]' : 'bg-[var(--brand-border)]'
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                index === step ? 'text-[var(--brand-text)]' : 'text-[var(--brand-placeholder)]'
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {status === 'error' && errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <InquiryText id="contact-firstName" label="First name" required autoComplete="given-name" registration={register('firstName')} error={errors.firstName?.message} />
          <InquiryText id="contact-lastName" label="Last name" autoComplete="family-name" registration={register('lastName')} error={errors.lastName?.message} />
          <InquiryText id="contact-workEmail" label="Work email" required type="email" inputMode="email" autoComplete="email" registration={register('workEmail')} error={errors.workEmail?.message} />
          <InquiryText id="contact-phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" registration={register('phone')} error={errors.phone?.message} />
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <InquiryText id="contact-businessName" label="Business name" required autoComplete="organization" registration={register('businessName')} error={errors.businessName?.message} />
          <InquiryText id="contact-jobTitle" label="Your role" autoComplete="organization-title" registration={register('jobTitle')} error={errors.jobTitle?.message} />
          <InquiryText id="contact-websiteUrl" label="Website" type="url" inputMode="url" placeholder="https://" registration={register('websiteUrl')} error={errors.websiteUrl?.message} />
          <InquirySelect id="contact-companySize" label="Company size" placeholder="Select team size" options={COMPANY_SIZES} registration={register('companySize')} error={errors.companySize?.message} />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <InquiryTextarea id="contact-workflowDescription" label="What workflow is costing you the most time?" required rows={4} placeholder="Describe the manual work you want to remove." registration={register('workflowDescription')} error={errors.workflowDescription?.message} />
          <InquiryTextarea id="contact-desiredOutcome" label="What would a good outcome look like?" rows={3} registration={register('desiredOutcome')} error={errors.desiredOutcome?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <InquirySelect id="contact-timeline" label="Timeline" placeholder="When do you want this live?" options={TIMELINES} registration={register('timeline')} error={errors.timeline?.message} />
            <InquirySelect id="contact-budgetRange" label="Budget range" placeholder="Rough budget" options={BUDGETS} registration={register('budgetRange')} error={errors.budgetRange?.message} />
          </div>
        </div>
      )}

      {step === 3 && (
        <InquiryFileUpload
          formVariant={FORM_VARIANT}
          sourcePage={PAGE_NAME}
          submissionId={submissionId}
          onTokensChange={(tokens) => {
            attachmentTokensRef.current = tokens
          }}
        />
      )}

      {isReview && (
        <div className="flex flex-col gap-4">
          <ReviewSummary values={getValues()} />
          <InquiryCheckbox id="contact-privacy" registration={register('consent.privacyAccepted')} error={errors.consent?.privacyAccepted?.message}>
            I agree to the{' '}
            <Link href="/privacy" className="text-[var(--brand-green)] underline">
              privacy policy
            </Link>
            .
          </InquiryCheckbox>
          <InquiryCheckbox id="contact-marketing" registration={register('consent.marketingOptIn')}>
            Send me the occasional automation tip. Optional, unsubscribe anytime.
          </InquiryCheckbox>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] px-5 py-3 text-sm font-semibold text-[var(--brand-text)] transition-colors hover:bg-black/[0.03]">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <span />
        )}

        {isReview ? (
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Send my request
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button type="button" onClick={goNext} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  )
}

function ReviewSummary({ values }: { values: FullInquiryValues }) {
  const rows: [string, string | undefined][] = [
    ['Name', [values.firstName, values.lastName].filter(Boolean).join(' ')],
    ['Work email', values.workEmail],
    ['Phone', values.phone],
    ['Business', values.businessName],
    ['Role', values.jobTitle],
    ['Website', values.websiteUrl],
    ['Company size', values.companySize],
    ['Timeline', values.timeline],
    ['Budget', values.budgetRange],
    ['Workflow', values.workflowDescription],
    ['Desired outcome', values.desiredOutcome],
  ]
  return (
    <dl className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface-2)] p-5 text-sm">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label} className="flex gap-3 border-b border-[var(--brand-border)] py-2 last:border-b-0">
            <dt className="w-32 shrink-0 font-semibold text-[var(--brand-muted)]">{label}</dt>
            <dd className="text-[var(--brand-text)]">{value}</dd>
          </div>
        ))}
    </dl>
  )
}
