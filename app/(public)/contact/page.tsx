import { PageHero } from '@/components/page-hero'
import { Contact } from '@/components/contact'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact  CodeOutfitters',
  description: 'Book your free discovery call with CodeOutfitters. We respond within 4 hours on business days and include a complimentary workflow audit.',
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        label="Get In Touch"
        title="Ready to Stop Doing Repetitive Work?"
        description="Book your free discovery call. We'll respond within 4 hours and audit your workflow on the spot  no obligation."
        breadcrumb="Contact"
      />
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <p className="section-label mb-3">Book Instantly</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#1C1612] tracking-tight mb-4">
            Pick a time that works for you
          </h2>
          <p className="text-[#6B6155] text-lg mb-8 max-w-xl mx-auto">
            Free 30-minute discovery call. No obligation. We&apos;ll audit your workflow on the spot.
          </p>
          <Link href="/book" className="btn-primary inline-flex">
            Book a Discovery Call
          </Link>
        </div>
      </section>
      <Contact hideHeader />
    </>
  )
}
