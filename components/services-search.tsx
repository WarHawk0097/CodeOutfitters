'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'

const allServices = [
  { name: 'AI Helpdesk', tags: 'support chat helpdesk faq inbox' },
  { name: 'Booking Automation', tags: 'booking calendar scheduling appointments' },
  { name: 'CRM Workflow', tags: 'crm data sync sales pipeline' },
  { name: 'Lead Capture', tags: 'leads capture forms qualification' },
  { name: 'Analytics Dashboard', tags: 'analytics dashboard reporting metrics' },
  { name: 'Ecommerce Support', tags: 'ecommerce orders inventory shopify' },
]

export function ServicesSearch() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return allServices
    const q = query.toLowerCase()
    return allServices.filter((s) => s.name.toLowerCase().includes(q) || s.tags.includes(q))
  }, [query])

  return (
    <div className="max-w-xl mx-auto mb-14">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9088]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services…"
          className="w-full bg-white border border-[rgba(42,107,90,0.15)] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#1C1612] placeholder-[#9B9088] outline-none focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/15 transition-all duration-200"
        />
      </div>
      {query.trim() && (
        <div className="mt-3 text-xs text-[#6B6155] text-center">
          {results.length === 0 ? 'No matching services — every build is custom-scoped, ask us on a discovery call.' : `${results.length} matching service${results.length === 1 ? '' : 's'}`}
        </div>
      )}
    </div>
  )
}
