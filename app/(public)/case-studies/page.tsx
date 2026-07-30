import type { Metadata } from 'next'
import { CaseStudiesPageClient } from './case-studies-page-client'

export const metadata: Metadata = {
  title: 'Case Studies — CodeOutfitters',
  description: 'Selected platforms, portals and internal applications designed and built by CodeOutfitters around specialist workflows and day-to-day operations.',
}

export default function CaseStudiesPage() {
  return <CaseStudiesPageClient />
}
