'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
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
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
    </>
  )
}
