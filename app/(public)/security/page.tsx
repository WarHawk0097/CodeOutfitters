import type { Metadata } from 'next'
import { SecurityPageClient } from './security-page-client'

export const metadata: Metadata = {
  title: 'Security & Reliability — CodeOutfitters',
  description: 'How CodeOutfitters handles access, secrets, AI guardrails, and reliability on every automation build.',
}

export default function SecurityPage() {
  return <SecurityPageClient />
}
