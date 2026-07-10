import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { Portfolio } from '@/components/portfolio'
import { Testimonials } from '@/components/testimonials'
import { FAQ } from '@/components/faq'
import { caseStudiesFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'Case Studies — CodeOutfitters',
  description: 'Illustrative case studies showing how automation systems save time across real estate, e-commerce, and healthcare workflows.',
}

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero
        label="Case Studies"
        title="Real workflows, measurable time saved."
        description="Every build is measured by one thing: time and errors removed from a manual process."
        breadcrumb="Case Studies"
      />
      <Portfolio hideHeader filterable />
      <Testimonials />
      <FAQ items={caseStudiesFaqs} title="Case study questions" />
      <CTABanner />
    </>
  )
}
