import type { Metadata } from 'next'
import { ContactPageClient } from './contact-page-client'

export const metadata: Metadata = {
  title: 'Contact — CodeOutfitters',
  description: 'Talk to CodeOutfitters about a bespoke web application: platforms, portals, dashboards and workflow systems. Response within 1 business day.',
}

export default function ContactPage() {
  return (
    <>
      <ContactPageClient />
    </>
  )
}
