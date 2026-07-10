'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export interface FaqItem {
  q: string
  a: string
}

export const homepageFaqs: FaqItem[] = [
  { q: 'How much does an automation project cost?', a: 'There are no generic packages or fixed pricing tiers. Every build is scoped individually after a free discovery call, and you get a fixed proposal before any work starts — no hourly creep, no surprises.' },
  { q: 'Really — live in 7 days?', a: 'For a single well-defined workflow, yes. Larger multi-system builds take longer. Either way you get a working preview early and approve everything before it goes live.' },
  { q: 'Do I need a technical team on my side?', a: 'No. We handle every technical detail — integrations, hosting, monitoring. You only need to show us how the work happens today and approve the result.' },
  { q: 'What tools do you work with?', a: 'WhatsApp Business, Anthropic Claude, n8n, Make, Zapier, Airtable, Notion, Google Workspace, and most CRMs. If your stack is unusual, we tell you on the discovery call whether we can connect it.' },
  { q: 'What happens if something breaks?', a: 'Every build includes post-launch support, and we monitor your automations continuously. Most issues are fixed before you notice them.' },
]

export function FAQ({ items = homepageFaqs, title = 'Everything clients ask us first', label = 'FAQ' }: { items?: FaqItem[]; title?: string; label?: string }) {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.1)

  return (
    <section className="py-[var(--space-section)] bg-[#F5F0EB] relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-8">
          <span data-reveal className="label-overline mb-3 block">{label}</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] text-balance mb-6">{title}</h2>
        </div>

        <div ref={sectionRef}>
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} data-reveal>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
