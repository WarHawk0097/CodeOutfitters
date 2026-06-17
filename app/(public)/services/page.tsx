import { PageHero } from '@/components/page-hero'
import { Services } from '@/components/services'
import { CTABanner } from '@/components/cta-banner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services — CodeOutfitters',
  description: 'Explore all six AI automation systems CodeOutfitters builds for US small businesses: WhatsApp bots, email workflows, chatbots, booking automation, and more.',
}

export default function ServicesPage() {
  return (
    <>
      <PageHero
        label="What We Build"
        title="Six Systems. Zero Grunt Work."
        description="Each automation is custom-built for your business — deployed in 7 days, zero coding required on your end."
        breadcrumb="Services"
      />
      <Services hideHeader />
      <CTABanner />
    </>
  )
}
