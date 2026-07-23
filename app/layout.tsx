import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Instrument_Sans, Geist, Geist_Mono, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
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

// Canonical Command Center typography (Dashboard/Command Center Final.dc.html):
// Geist for the sidebar, IBM Plex Sans/Mono for the body. Exposed as CSS vars on
// <html> so the dashboard subtree's font-cc-* utilities resolve; the public site
// keeps its own Instrument Sans / Space Grotesk (body font is unchanged below).
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })
const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ibm-plex-sans', display: 'swap' })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-ibm-plex-mono', display: 'swap' })

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
  const motionResolverScript = `
(function(){
  try{
    var params=new URLSearchParams(window.location.search);
    var pref=params.get('motion');
    var reduced=false;
    if(pref==='reduced'){reduced=true}
    else if(pref==='full'){reduced=false}
    else{reduced=false}
    var osReduced=false;
    try{osReduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){}
    document.documentElement.dataset.motion=reduced?'reduced':'full';
    document.documentElement.dataset.motionReduced=String(reduced);
    document.documentElement.setAttribute('data-os-reduced',String(osReduced));
    if(reduced){document.documentElement.classList.add('motion-reduced')}
    document.documentElement.classList.add('motion-ready');
  }catch(e){}
})();`

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${instrumentSans.variable} ${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionResolverScript }} />
      </head>
      <body className="font-body antialiased" style={{ fontFamily: "'Instrument Sans', sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
