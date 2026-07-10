'use client'

import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { Badge } from '@/components/ui/badge'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const industries = [
  { name: 'Home Services / HVAC', problems: 'Missed calls after hours, slow quote turnaround, techs double-booked or no-showed.', examples: ['Missed-call text-back', 'Auto quote follow-up', 'Dispatch reminders'], tools: 'ServiceTitan, Housecall Pro, Jobber, Google Calendar' },
  { name: 'Healthcare Clinics / Med-Spas', problems: 'No-shows eating schedule capacity, intake forms chased down manually, staff buried in reminder calls.', examples: ['Appointment reminders', 'Digital intake routing', 'Rebooking nudges'], tools: 'Calendly, Square Appointments, EHR exports, SMS' },
  { name: 'Real Estate', problems: 'Leads go cold waiting for a reply, showings scheduled by phone tag, paperwork chased by hand.', examples: ['Instant lead qualification', 'Showing scheduling', 'Document follow-up'], tools: 'CRMs, DocuSign, MLS feeds, WhatsApp' },
  { name: 'E-commerce / Retail', problems: 'Order and invoice entry done by hand, support inbox flooded with the same order questions.', examples: ['Order-to-invoice sync', 'Order status auto-replies', 'Returns triage'], tools: 'Shopify, QuickBooks, Stripe, Zendesk' },
  { name: 'Professional Services', problems: 'Client onboarding scattered across email, proposals and invoices tracked in spreadsheets.', examples: ['Client onboarding sequences', 'Proposal-to-invoice handoff', 'Status update emails'], tools: 'Gmail/Outlook, Notion, QuickBooks, DocuSign' },
  { name: 'Education / Training', problems: 'Enrollment questions answered one-by-one, cohort reminders sent manually, certificates issued by hand.', examples: ['Enrollment chat answers', 'Cohort reminder sequences', 'Certificate delivery'], tools: 'Kajabi, Teachable, Mailchimp, Google Sheets' },
  { name: 'Local Service Businesses', problems: 'Booking requests come in on five different channels and get lost between them.', examples: ['Unified booking intake', 'Review request automation', 'No-show follow-up'], tools: 'WhatsApp, Instagram DMs, Google Business, Calendly' },
]

const needs = [
  { num: '01', title: 'Lead intake', desc: 'Every inbound message gets a fast, qualified reply instead of a delayed one.' },
  { num: '02', title: 'Scheduling', desc: 'Booking, rescheduling, and reminders happen without a phone call.' },
  { num: '03', title: 'Follow-up', desc: 'Quotes, proposals, and after-visit messages go out automatically, on time.' },
  { num: '04', title: 'Back office', desc: 'Invoices, records, and status updates sync without manual re-entry.' },
]

const workflows = [
  { tag: 'Home Services', title: 'After-hours missed call — booked job', steps: ['Missed call triggers an instant text with booking link', 'Customer picks a slot from live tech availability', 'Job auto-added to dispatch board, tech notified'] },
  { tag: 'Real Estate', title: 'New lead — qualified showing', steps: ['Inquiry auto-qualified by budget, area, and timeline', 'Hot leads routed straight to the right agent', 'Showing booked and confirmed without back-and-forth'] },
  { tag: 'E-commerce', title: 'Order placed — invoice reconciled', steps: ['Order synced from store to invoicing tool instantly', 'Payment matched automatically against the invoice', 'Customer gets a status update with zero manual entry'] },
]

const stats = [
  { num: '7', label: 'Industries served' },
  { num: '120+', label: 'Systems shipped' },
  { num: '7 days', label: 'Typical build time' },
  { num: '30 days', label: 'Support included' },
]

export function IndustriesGrid() {
  const gridRef = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <section className="py-[var(--space-section)] section-tinted relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-12">
          <span data-reveal className="section-label-pill">Seven industries, one approach</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5 mb-4">Built around how your business already runs.</h2>
        </div>
        <div ref={gridRef}>
          <BentoGrid>
            {industries.map((ind, i) => (
              <BentoCard key={ind.name} span={i < 1 ? 12 : 6} className="p-6 sm:p-8" data-reveal>
                <h3 className="font-heading text-lg font-semibold text-[#1C1612] mb-2">{ind.name}</h3>
                <p className="text-sm text-[#6B6155] leading-relaxed mb-4">{ind.problems}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ind.examples.map((ex) => (
                    <Badge key={ex} variant="accent">{ex}</Badge>
                  ))}
                </div>
                <p className="text-xs text-[#9B9088]">Connects with: {ind.tools}</p>
              </BentoCard>
            ))}
          </BentoGrid>
        </div>
      </div>
    </section>
  )
}

export function IndustriesNeeds() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-12">
          <span data-reveal className="section-label-pill">Common needs</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5 mb-4">Whatever your industry, most bottlenecks fall into one of these buckets.</h2>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {needs.map((n) => (
            <div key={n.num} data-reveal className="glass-card p-6 rounded-2xl">
              <span className="text-2xl font-heading font-bold text-[#C8A96E]">{n.num}</span>
              <h3 className="font-heading text-base font-semibold text-[#1C1612] mt-3 mb-2">{n.title}</h3>
              <p className="text-sm text-[#6B6155] leading-relaxed">{n.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function IndustriesWorkflows() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] section-tinted relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-12">
          <span data-reveal className="section-label-pill">In practice</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5">Example workflows by industry.</h2>
        </div>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflows.map((wf) => (
            <div key={wf.title} data-reveal className="glass-card p-6 rounded-2xl">
              <Badge variant="primary">{wf.tag}</Badge>
              <h3 className="font-heading text-base font-semibold text-[#1C1612] mt-4 mb-4">{wf.title}</h3>
              <ol className="space-y-3">
                {wf.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#6B6155] leading-relaxed">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#2A6B5A]/10 text-[#2A6B5A] text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14">
          {stats.map((s) => (
            <div key={s.label} data-reveal className="text-center">
              <div className="text-2xl md:text-3xl font-heading font-bold text-[#2A6B5A]">{s.num}</div>
              <div className="text-xs text-[#6B6155] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
