import type { Metadata } from 'next'
import { SecurityPageClient } from './security-page-client'
import { FAQ } from '@/components/faq'
import { securityFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'Security & Reliability — CodeOutfitters',
  description: 'How CodeOutfitters handles access, secrets, AI guardrails, and reliability on every automation build.',
}

export default function SecurityPage() {
  return (
    <>
      <SecurityPageClient />
      <FAQ items={securityFaqs} title="Security questions" />
      <CTABanner />
    </>
  )
}
