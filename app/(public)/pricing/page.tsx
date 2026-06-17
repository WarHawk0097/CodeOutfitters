import { PageHero } from '@/components/page-hero'
import { QuoteForm } from '@/components/quote-form'
import { PricingFAQ } from '@/components/pricing-faq'
import { CTABanner } from '@/components/cta-banner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get a Quote — CodeOutfitters',
  description: 'Request a custom quote for AI automation. We scope each project to your specific needs, tools, and goals. No templates, no surprise fees.',
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        label="Custom Pricing"
        title="Every business is different. So is our pricing."
        description="We scope each project based on your specific needs, tools, and goals. No templates. No surprise fees."
        breadcrumb="Get a Quote"
      />
      <QuoteForm />
      <div className="text-center py-8 px-5">
        <p className="text-[#6B6155] text-lg max-w-xl mx-auto">
          Prefer to talk first?{' '}
          <a href="/book" className="text-[#2A6B5A] font-semibold underline underline-offset-2 hover:text-[#1A4A3B] transition-colors">
            Book a Free Discovery Call &rarr;
          </a>
        </p>
      </div>
      <PricingFAQ />
      <CTABanner />
    </>
  )
}
