import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Instrument_Sans } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://codeoutfitters.com'),
  title: 'CodeOutfitters — AI Automation for Small Businesses',
  description:
    'AI automation for US small businesses. We build WhatsApp bots, AI chatbots, email workflows, and custom automation. 7-day setup, zero code required.',
  keywords: 'AI automation, small business automation, WhatsApp bot, chatbot, workflow automation, no-code',
  authors: [{ name: 'CodeOutfitters' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'CodeOutfitters — AI Automation Agency',
    description: "We automate the work you shouldn't be doing.",
    type: 'website',
    images: [{ url: '/hero-fallback.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-fallback.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#F7F2EA',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${instrumentSans.variable}`}>
      <body className="font-body antialiased" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
