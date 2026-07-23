'use client'

// Contact journey (owner directive, Work Order D finalization). FullInquiryForm
// is the authoritative inquiry experience and the ONLY thing shown on initial
// load. The legacy ContactBookingFlow is preserved unchanged but is offered
// ONLY after the inquiry has persisted through POST /api/inquiries — as an
// optional, skippable scheduling step. Booking is a separate action: it never
// re-submits the inquiry (which stays in its terminal success state), and a
// booking failure cannot invalidate the already-persisted inquiry.
import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { ContactBookingFlow } from '@/components/contact-booking-flow'
import { FullInquiryForm } from './full-inquiry-form'

export function ContactInquiryJourney() {
  // 'offer' = show the optional scheduling CTA; 'booking' = legacy flow mounted;
  // 'skipped' = visitor declined, inquiry stands on its own.
  const [bookingState, setBookingState] = useState<'offer' | 'booking' | 'skipped'>('offer')

  const bookingSlot = (
    <div className="border-t border-[var(--brand-border)] pt-5">
      {bookingState === 'booking' ? (
        // Legacy scheduler, preserved unchanged. Separate from inquiry persistence.
        <ContactBookingFlow />
      ) : bookingState === 'skipped' ? (
        <p className="text-center text-sm text-[var(--brand-muted)]">
          No problem — your request is in. We will email you at the address you gave to
          find a time that works.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-[var(--brand-muted)]">
            Want to save a step? Book your free 30-minute discovery call now — optional,
            your request is already received.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setBookingState('booking')}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-px"
            >
              <Calendar className="h-4 w-4" />
              Book a discovery call
            </button>
            <button
              type="button"
              onClick={() => setBookingState('skipped')}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--brand-muted)] transition-colors hover:text-[var(--brand-text)]"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return <FullInquiryForm bookingSlot={bookingSlot} />
}
