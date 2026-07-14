import type { Metadata } from 'next'
import { CaseStudiesPageClient } from './case-studies-page-client'

export const metadata: Metadata = {
  title: 'Case Studies — CodeOutfitters',
  description: 'Illustrative case studies showing how automation systems save time across real estate, e-commerce, healthcare, legal, logistics, and home services.',
}

export default function CaseStudiesPage() {
  return <CaseStudiesPageClient />
}
