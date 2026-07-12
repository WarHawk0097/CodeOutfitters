import type { Metadata } from 'next'
import { AboutPageClient } from './about-page-client'
import { CTABanner } from '@/components/cta-banner'

export const metadata: Metadata = {
  title: 'About — CodeOutfitters',
  description: 'CodeOutfitters builds custom automation systems for US small businesses — fixed scope, fully documented, fully owned by you.',
}

export default function AboutPage() {
  return (
    <>
      <AboutPageClient />
      <CTABanner />
    </>
  )
}
