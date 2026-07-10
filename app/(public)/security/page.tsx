import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { SecurityAccessSecrets, SecurityGuardrails, SecurityReliabilityHandoff } from '@/components/security-practices'
import { FAQ } from '@/components/faq'
import { securityFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'Security & Reliability — CodeOutfitters',
  description: 'How CodeOutfitters handles access, secrets, AI guardrails, testing, and handoff on every automation build.',
}

export default function SecurityPage() {
  return (
    <>
      <PageHero
        label="Security & Reliability"
        title="How we handle access, secrets, and reliability."
        description="Automation touches sensitive parts of your business — your leads, your calendar, your money. Here is how we handle it on every build."
        breadcrumb="Security & Reliability"
      />
      <SecurityAccessSecrets />
      <SecurityGuardrails />
      <SecurityReliabilityHandoff />
      <FAQ items={securityFaqs} title="Security questions" />
      <CTABanner />
    </>
  )
}
