import { PageHero } from '@/components/page-hero'
import { BookingCalendarCustom } from '@/components/booking-calendar-custom'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Discovery Call — CodeOutfitters',
  description:
    'Schedule your free 30-minute discovery call. No sales pressure. Just an honest conversation about what automation could do for your business.',
}

export default function BookPage() {
  return (
    <>
      <PageHero
        label="Book a Call"
        title="Book a Free Discovery Call"
        description="30 minutes. No sales pressure. Just an honest conversation about what automation could do for your business."
        breadcrumb="Book"
      />
      <BookingCalendarCustom />
    </>
  )
}
