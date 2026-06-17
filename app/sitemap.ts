import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://codeoutfitters.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://codeoutfitters.com/services', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://codeoutfitters.com/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://codeoutfitters.com/portfolio', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://codeoutfitters.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://codeoutfitters.com/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://codeoutfitters.com/book', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]
}
