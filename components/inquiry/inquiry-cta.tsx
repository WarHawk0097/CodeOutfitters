'use client'

// Contextual inquiry surfaces (spec §6). Two shapes:
//  - InquiryPopupTrigger: a button that opens the global workflow-audit popup
//    (for Home / Process / About, where the placement strategy is "popup only"
//    but a manual CTA should stay available).
//  - ContextualInquiryCta: an inline compact form with contextual copy, for the
//    Case Studies (case_study_contextual) and Security (security_contextual)
//    placements, carrying the prefilled selected entity into attribution.
import { ArrowRight } from 'lucide-react'
import type { FormVariant } from '@/lib/inquiry/inquiry-schema'
import type { BuildSourceContextInput } from '@/lib/inquiry/inquiry-source-context'
import { CompactInquiryForm, type ContextFieldKey } from './compact-inquiry-form'
import { openInquiryPopup, type InquiryPopupContext } from './workflow-audit-popup'

export function InquiryPopupTrigger({
  label = 'Get a free workflow audit',
  className,
  context,
}: {
  label?: string
  className?: string
  // When provided, the popup opens with this contextual placement (e.g. a
  // case study) instead of the default global popup.
  context?: InquiryPopupContext
}) {
  return (
    <button
      type="button"
      onClick={() => openInquiryPopup(context)}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-xl bg-[var(--brand-green)] px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px'
      }
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  )
}

export function ContextualInquiryCta({
  formVariant,
  pageName,
  heading,
  description,
  selectedCaseStudy,
  selectedIndustry,
  selectedService,
  sourceSection,
  descriptionLabel = 'What would you like to automate?',
  descriptionPlaceholder = 'Tell us where the manual work is.',
  submitLabel = 'Get my free workflow audit',
  contextKey,
  contextLabel,
  contextPlaceholder,
}: {
  formVariant: FormVariant
  pageName: string
  heading: string
  description: string
  selectedCaseStudy?: string
  selectedIndustry?: string
  selectedService?: string
  sourceSection?: string
  descriptionLabel?: string
  descriptionPlaceholder?: string
  submitLabel?: string
  // Renders an editable, prefilled contextual entity field (Services /
  // Industries). The prefilled value is the matching selected* prop above.
  contextKey?: ContextFieldKey
  contextLabel?: string
  contextPlaceholder?: string
}) {
  const sourceInput: BuildSourceContextInput = {
    formVariant,
    pageName,
    sourceSection,
    selectedCaseStudy,
    selectedIndustry,
    selectedService,
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-sm sm:p-8">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-green)]">
        Free workflow audit
      </p>
      <h2 className="font-display text-2xl font-semibold leading-tight text-[var(--brand-text)]">
        {heading}
      </h2>
      <p className="mt-2 mb-6 text-sm leading-relaxed text-[var(--brand-muted)]">{description}</p>
      <CompactInquiryForm
        formVariant={formVariant}
        sourceInput={sourceInput}
        descriptionLabel={descriptionLabel}
        descriptionPlaceholder={descriptionPlaceholder}
        submitLabel={submitLabel}
        contextKey={contextKey}
        contextLabel={contextLabel}
        contextPlaceholder={contextPlaceholder}
      />
    </section>
  )
}
