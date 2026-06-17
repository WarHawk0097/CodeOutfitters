import { PageHero } from '@/components/page-hero'
import { Portfolio } from '@/components/portfolio'
import { CTABanner } from '@/components/cta-banner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio — CodeOutfitters',
  description: 'Sample automation scenarios from CodeOutfitters. See the kinds of workflows we build for US small businesses in real estate, e-commerce, and healthcare.',
}

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        label="Sample Scenarios"
        title="Sample Automation Scenarios"
        description="Illustrative examples of the kinds of automations we build for US small businesses. Each card shows the workflow shape, the time and money saved, and how a similar system could fit your business."
        breadcrumb="Portfolio"
      />
      <Portfolio hideHeader />
      <CTABanner />
    </>
  )
}
