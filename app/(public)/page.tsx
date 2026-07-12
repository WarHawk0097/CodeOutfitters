import { Hero } from '@/components/hero'
import { StatsStrip } from '@/components/stats-strip'
import { ToolsMarquee } from '@/components/tools-marquee'
import { ServicesBento } from '@/components/services-bento'
import { ProcessPreview } from '@/components/process-preview'
import { ROICalculator } from '@/components/roi-calculator'
import { CaseStudiesPreview } from '@/components/case-studies-preview'
import { Testimonials } from '@/components/testimonials'
import { FAQ } from '@/components/faq'
import { CTABanner } from '@/components/cta-banner'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <ToolsMarquee />
      <ServicesBento />
      <ProcessPreview />
      <ROICalculator />
      <CaseStudiesPreview />
      <Testimonials />
      <FAQ />
      <CTABanner />
    </>
  )
}
