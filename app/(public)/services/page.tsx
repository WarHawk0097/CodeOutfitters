import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { ServicesSearch } from '@/components/services-search'
import { Services } from '@/components/services'
import { ServicesHowItWorks } from '@/components/services-how-it-works'
import { ToolsStrip } from '@/components/tools-strip'
import { FAQ } from '@/components/faq'
import { servicesFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'Services — CodeOutfitters',
  description: 'Custom AI automation systems for US small businesses — helpdesk, booking, CRM workflow, lead capture, analytics, and ecommerce support.',
}

export default function ServicesPage() {
  return (
    <>
      <PageHero
        label="Automation OS"
        title="Six systems. One connected automation stack."
        description="Each module is scoped to your business and connects to the tools you already use — no generic packages, no rip-and-replace."
        breadcrumb="Services"
      />
      <div className="pt-16 px-5">
        <ServicesSearch />
      </div>
      <Services hideHeader />
      <ServicesHowItWorks />
      <ToolsStrip />
      <FAQ items={servicesFaqs} title="Services FAQ" />
      <CTABanner />
    </>
  )
}
