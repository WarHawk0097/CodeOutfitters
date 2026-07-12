'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  q: string
  a: string
}

export interface FAQProps {
  items: FaqItem[]
  title?: string
}

function FaqAccordionItem({
  item,
  isOpen,
  toggle,
  index,
}: {
  item: FaqItem
  isOpen: boolean
  toggle: () => void
  index: number
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [])

  return (
    <div
      id={`faq-item-${index}`}
      className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden transition-colors duration-300"
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 px-6 md:px-8 py-6 text-left focus-visible:outline-2 focus-visible:outline-[#D9B36A] focus-visible:outline-offset-2 focus-visible:outline-inset transition-colors duration-200 group"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="text-white/90 font-medium text-lg leading-snug group-hover:text-white transition-colors duration-200">
          {item.q}
        </span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 text-[#D9B36A] transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={`faq-answer-${index}`}
        role="region"
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-6 md:px-8 pb-6 text-[#8A857B] leading-relaxed">
          {item.a}
        </div>
      </div>
    </div>
  )
}

export const homepageFaqs: FaqItem[] = [
  { q: 'How much does an automation project cost?', a: 'There are no generic packages or fixed pricing tiers. Every build is scoped individually after a free discovery call, and you get a fixed proposal before any work starts — no hourly creep, no surprises.' },
  { q: 'Really — live in 7 days?', a: 'For a single well-defined workflow, yes. Larger multi-system builds take longer. Either way you get a working preview early and approve everything before it goes live.' },
  { q: 'Do I need a technical team on my side?', a: 'No. We handle every technical detail — integrations, hosting, monitoring. You only need to show us how the work happens today and approve the result.' },
  { q: 'What tools do you work with?', a: 'WhatsApp Business, Anthropic Claude, n8n, Make, Zapier, Airtable, Notion, Google Workspace, and most CRMs. If your stack is unusual, we tell you on the discovery call whether we can connect it.' },
  { q: 'What happens if something breaks?', a: 'Every build includes post-launch support, and we monitor your automations continuously. Most issues are fixed before you notice them.' },
]

export function FAQ({ items = homepageFaqs, title = 'Frequently Asked Questions' }: { items?: FaqItem[]; title?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(178deg, #10301F, #0C2417)' }}
    >
      <div className="max-w-3xl mx-auto relative z-10">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12 md:mb-16">
            {title}
          </h2>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <FaqAccordionItem
              key={index}
              item={item}
              index={index}
              isOpen={openIndex === index}
              toggle={() => toggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
