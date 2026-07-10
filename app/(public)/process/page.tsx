import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { ProcessTimeline, ProcessNoPricingCallout } from '@/components/process-timeline'
import { FAQ } from '@/components/faq'
import { processFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'Process — CodeOutfitters',
  description: 'How we go from discovery to a live, handed-off automation system — discovery, audit, proposal, build, testing, handoff, support.',
}

export default function ProcessPage() {
  return (
    <>
      <PageHero
        label="How It Works"
        title="From discovery to deployed, one connected process."
        description="No generic packages, no black box. Every step is visible before we build anything."
        breadcrumb="Process"
      />
      <ProcessTimeline />
      <ProcessNoPricingCallout />
      <FAQ items={processFaqs} title="Process questions" />
      <CTABanner />
    </>
  )
}
