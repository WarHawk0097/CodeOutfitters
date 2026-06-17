import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AOSProvider from '@/components/aos-provider'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
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
  themeColor: '#FAFAF7',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <AOSProvider>{children}</AOSProvider>
      </body>
    </html>
  )
}
