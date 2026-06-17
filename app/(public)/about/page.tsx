import { PageHero } from '@/components/page-hero'
import { Process } from '@/components/process'
import { AboutValues } from '@/components/about-values'
import { CTABanner } from '@/components/cta-banner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — CodeOutfitters',
  description: 'Learn how CodeOutfitters works: our 4-step process, values, and why we focus exclusively on US small businesses.',
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        label="How We Work"
        title="From Discovery to Deployed in 7 Days"
        description="We built CodeOutfitters because small businesses deserve enterprise-grade automation without the enterprise price tag or complexity."
        breadcrumb="About"
      />
      <Process />
      <AboutValues />
      <CTABanner />
    </>
  )
}
