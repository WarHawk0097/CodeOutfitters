'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MotionModeProvider } from '@/components/motion-mode-provider'
import { AnnouncementBar } from '@/components/announcement-bar'
import { WorkflowAuditPopup } from '@/components/inquiry/workflow-audit-popup'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'CodeOutfitters',
  description: 'AI automation agency for US small businesses',
  url: 'https://codeoutfitters.com',
  email: 'hello@codeoutfitters.com',
  areaServed: 'US',
  serviceType: 'AI Automation',
  priceRange: 'Custom quote',
}

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <MotionModeProvider>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WorkflowAuditPopup />
    </MotionModeProvider>
  )
}
