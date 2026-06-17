import dynamic from 'next/dynamic'
import { Hero } from '@/components/hero'
import { ToolsStrip } from '@/components/tools-strip'
import { Services } from '@/components/services'
import { Process } from '@/components/process'
import { CTABanner } from '@/components/cta-banner'

const ROICalculator = dynamic(() => import('@/components/roi-calculator').then(m => m.ROICalculator))
const Portfolio = dynamic(() => import('@/components/portfolio').then(m => m.Portfolio))

export default function Home() {
  return (
    <>
      <Hero />
      <ToolsStrip />
      <Services preview />
      <Process />
      <ROICalculator />
      <Portfolio />
      <CTABanner />
    </>
  )
}
