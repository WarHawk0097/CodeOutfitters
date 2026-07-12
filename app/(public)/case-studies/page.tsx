import type { Metadata } from 'next'
import { CaseStudiesPageClient } from './case-studies-page-client'
import { FAQ } from '@/components/faq'
import { caseStudiesFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'Case Studies — CodeOutfitters',
  description: 'Illustrative case studies showing how automation systems save time across real estate, e-commerce, healthcare, legal, logistics, and home services.',
}

export default function CaseStudiesPage() {
  return (
    <>
      <CaseStudiesPageClient />
      <FAQ items={caseStudiesFaqs} title="Case study questions" />
      <CTABanner />
    </>
  )
}
