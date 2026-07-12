import type { Metadata } from 'next'
import { ContactPageClient } from './contact-page-client'

export const metadata: Metadata = {
  title: 'Contact — CodeOutfitters',
  description: 'Book a free discovery call and workflow audit with CodeOutfitters. Response within 1 business day.',
}

export default function ContactPage() {
  return (
    <>
      <ContactPageClient />
    </>
  )
}
