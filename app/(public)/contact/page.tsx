import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { Contact } from '@/components/contact'
import { ContactNextSteps } from '@/components/contact-next-steps'
import { FAQ } from '@/components/faq'
import { contactFaqs } from '@/data/faqs'

export const metadata: Metadata = {
  title: 'Contact — CodeOutfitters',
  description: 'Book a free discovery call and workflow audit with CodeOutfitters. Response within 4 hours on business days.',
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        label="Contact"
        title="Ready to stop doing repetitive work?"
        description="Book your free discovery call. We respond within 4 hours on business days."
        breadcrumb="Contact"
      />
      <Contact hideHeader />
      <ContactNextSteps />
      <FAQ items={contactFaqs} title="Contact questions" />
    </>
  )
}
