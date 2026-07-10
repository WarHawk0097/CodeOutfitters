import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { IndustriesGrid, IndustriesNeeds, IndustriesWorkflows } from '@/components/industries-grid'
import { FAQ } from '@/components/faq'
import { industriesFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'Industries — CodeOutfitters',
  description: 'Automation built around how home services, healthcare, real estate, e-commerce, professional services, education, and local service businesses actually run.',
}

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        label="Industries"
        title="Automation that fits how your industry actually works."
        description="Every industry loses time differently. We start from the workflows you already run — not a generic template."
        breadcrumb="Industries"
      />
      <IndustriesGrid />
      <IndustriesNeeds />
      <IndustriesWorkflows />
      <FAQ items={industriesFaqs} title="Industry questions" />
      <CTABanner />
    </>
  )
}
