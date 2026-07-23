'use client'

// Shared success state (spec §6 step "Submitted / appointment", §19 appointment
// events). Shows confirmation and, when the server says an appointment slot is
// available, the booking CTA. Emits appointment_cta_shown on display and
// appointment_started on click (no PII).
import { useEffect } from 'react'
import { CheckCircle, ArrowRight, Calendar } from 'lucide-react'
import type { FormVariant, InquirySubmissionResponse } from '@/lib/inquiry/inquiry-schema'
import { trackInquiryEvent } from '@/lib/inquiry/inquiry-analytics'

export function InquirySuccess({
  response,
  formVariant,
  sourcePage,
  compact = false,
}: {
  response: InquirySubmissionResponse
  formVariant: FormVariant
  sourcePage: string
  compact?: boolean
}) {
  const appointment = response.appointmentNextStep
  const showAppointment = appointment.available && Boolean(appointment.url)

  useEffect(() => {
    if (showAppointment) {
      trackInquiryEvent('appointment_cta_shown', { formVariant, sourcePage })
    }
  }, [showAppointment, formVariant, sourcePage])

  return (
    <div className="flex flex-col items-center text-center gap-3 py-2">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary-light)]">
        <CheckCircle className="h-6 w-6 text-[var(--brand-green)]" />
      </span>
      <h3 className={`font-display font-semibold text-[var(--brand-text)] ${compact ? 'text-lg' : 'text-2xl'}`}>
        Your workflow audit request is in.
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--brand-muted)]">
        We read every submission ourselves. You will hear back with what is worth
        automating and what is not, usually within one business day.
      </p>

      {showAppointment ? (
        <a
          href={appointment.url}
          onClick={() => trackInquiryEvent('appointment_started', { formVariant, sourcePage })}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px"
        >
          <Calendar className="h-4 w-4" />
          Book your discovery call
          <ArrowRight className="h-4 w-4" />
        </a>
      ) : (
        <p className="mt-1 text-xs text-[var(--brand-placeholder)]">
          Prefer email? Reach us at hello@codeoutfitters.com
        </p>
      )}
    </div>
  )
}
