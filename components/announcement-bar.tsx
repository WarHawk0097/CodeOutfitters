'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AnnouncementBar() {
  const pathname = usePathname()

  if (pathname !== '/') return null

  return (
    <div
      className="text-white text-center text-xs sm:text-sm font-medium flex items-center justify-center px-4"
      style={{ background: '#0E2A1D', height: '44px' }}
    >
      <span className="flex items-center">
        Free workflow audit with every discovery call this July.
        <Link href="/contact#cta" className="underline underline-offset-2 ml-1 font-semibold hover:no-underline">
          Book yours →
        </Link>
      </span>
    </div>
  )
}
