import { Hero } from '@/components/hero'
import { Capabilities } from '@/components/capabilities'
import { ProcessPreview } from '@/components/process-preview'
import { SelectedWork } from '@/components/selected-work'
import { FAQ } from '@/components/faq'
import { CTABanner } from '@/components/cta-banner'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Capabilities />
      <ProcessPreview />
      <SelectedWork />
      <FAQ />
      <CTABanner />
    </>
  )
}
