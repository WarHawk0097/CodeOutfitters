import { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/routing/public-origin'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/admin' },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  }
}
