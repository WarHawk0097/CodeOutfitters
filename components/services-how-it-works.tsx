'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const items = [
  { q: 'AI Helpdesk — how it works', a: 'Inbound messages are classified by intent, answered instantly for common questions, and routed to a human with full context for anything complex. Connects to your existing inbox, WhatsApp, or live chat.' },
  { q: 'Booking Automation — how it works', a: 'Clients book directly against your real calendar availability. Automated reminders cut no-shows, and reschedules happen without a phone call.' },
  { q: 'CRM Workflow — how it works', a: 'New contacts, deals, and notes sync automatically between your forms, inbox, and CRM — no manual re-entry, no duplicate records.' },
  { q: 'Lead Capture — how it works', a: 'Every inbound lead is qualified against your criteria the moment it arrives and routed to the right person before it goes cold.' },
]

export function ServicesHowItWorks() {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.1)

  return (
    <section className="py-[var(--space-section)] bg-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-10">
          <span data-reveal className="section-label-pill">How It Works</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5">Expand any module for the full breakdown</h2>
        </div>
        <div ref={sectionRef}>
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`how-${i}`} data-reveal>
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
