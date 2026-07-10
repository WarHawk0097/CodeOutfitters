import { Hero } from '@/components/hero'
import { ROICalculator } from '@/components/roi-calculator'
import { Services } from '@/components/services'
import { Process } from '@/components/process'
import { Portfolio } from '@/components/portfolio'
import { Testimonials } from '@/components/testimonials'
import { FAQ } from '@/components/faq'
import { CTABanner } from '@/components/cta-banner'
import { ToolsStrip } from '@/components/tools-strip'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ToolsStrip />
      <Services preview hideHeader={false} />
      <Process />
      <ROICalculator />
      <Portfolio hideHeader={false} />
      <Testimonials />
      <FAQ />
      <CTABanner />
    </>
  )
}
