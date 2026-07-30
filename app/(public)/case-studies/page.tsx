import type { Metadata } from 'next'
import { CaseStudiesPageClient } from './case-studies-page-client'

export const metadata: Metadata = {
  title: 'Selected Work — CodeOutfitters',
  description:
    'Bespoke web applications designed and built by CodeOutfitters: operations platforms, studio software, portals and internal tools built around specialist workflows.',
}

export default function CaseStudiesPage() {
  return <CaseStudiesPageClient />
}
