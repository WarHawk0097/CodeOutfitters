import { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/routing/public-origin'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  // Public marketing routes only, on the one client-facing origin. /dashboard and
  // /proposal/[secureToken] are deliberately absent: one is behind auth, the other
  // is a client's commercial terms and is marked noindex.
  return [
    { url: CANONICAL_ORIGIN, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${CANONICAL_ORIGIN}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${CANONICAL_ORIGIN}/industries`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${CANONICAL_ORIGIN}/process`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${CANONICAL_ORIGIN}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${CANONICAL_ORIGIN}/security`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${CANONICAL_ORIGIN}/case-studies`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${CANONICAL_ORIGIN}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  ]
}
