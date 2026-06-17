'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/page-transition'
import { ScrollProgress } from '@/components/scroll-progress'
import { FloatingCTA } from '@/components/floating-cta'
import { BackToTop } from '@/components/back-to-top'
import { CookieConsent } from '@/components/cookie-consent'
import { ConsentGated } from '@/components/consent-gated'
import { LiveChat } from '@/components/live-chat'
import { AnnouncementBar } from '@/components/announcement-bar'
import { GradientCanvas } from '@/components/gradient-canvas'
import { ErrorBoundary } from '@/components/error-boundary'

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <GradientCanvas />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: 'CodeOutfitters',
            description: 'AI automation agency for US small businesses',
            url: 'https://codeoutfitters.com',
            email: 'hello@codeoutfitters.com',
            areaServed: 'US',
            serviceType: 'AI Automation',
            priceRange: 'Custom quote',
          }),
        }}
      />
      <ScrollProgress />
      <AnnouncementBar />
      <Navbar />
      <main>
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </main>
      <Footer />
      <FloatingCTA />
      <BackToTop />
      <CookieConsent />
      <ConsentGated><LiveChat /></ConsentGated>
    </>
  )
}
