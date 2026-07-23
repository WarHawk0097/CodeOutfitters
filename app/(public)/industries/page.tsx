'use client'

import type { CSSProperties, PointerEvent } from 'react'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { ContextualInquiryCta } from '@/components/inquiry/inquiry-cta'

const industries = [
  { name: 'Home Services / HVAC', icon: 'icon-automate.svg', bg: ['#EAF6EF', '#DCF0E5'], problems: 'Missed calls after hours, slow quote turnaround, techs double-booked or no-showed.', examples: ['Missed-call text-back', 'Auto quote follow-up', 'Dispatch reminders'], tools: 'ServiceTitan, Housecall Pro, Jobber, Google Calendar' },
  { name: 'Healthcare Clinics / Med-Spas', icon: 'icon-chat-square.svg', bg: ['#E8EDE9', '#DBE3DC'], problems: 'No-shows eating schedule capacity, intake forms chased down manually, staff buried in reminder calls.', examples: ['Appointment reminders', 'Digital intake routing', 'Rebooking nudges'], tools: 'Calendly, Square Appointments, EHR exports, SMS' },
  { name: 'Real Estate', icon: 'icon-lead-user.svg', bg: ['#F8EFDD', '#F0E2C4'], problems: 'Leads go cold waiting for a reply, showings scheduled by phone tag, paperwork chased by hand.', examples: ['Instant lead qualification', 'Showing scheduling', 'Document follow-up'], tools: 'CRMs, DocuSign, MLS feeds, WhatsApp' },
  { name: 'E-commerce / Retail', icon: 'icon-database-stack.svg', bg: ['#EAF6EF', '#DCF0E5'], problems: 'Order and invoice entry done by hand, support inbox flooded with the same order questions.', examples: ['Order-to-invoice sync', 'Order status auto-replies', 'Returns triage'], tools: 'Shopify, QuickBooks, Stripe, Zendesk' },
  { name: 'Professional Services', icon: 'icon-edit-square.svg', bg: ['#F8EFDD', '#F0E2C4'], problems: 'Client onboarding scattered across email, proposals and invoices tracked in spreadsheets.', examples: ['Client onboarding sequences', 'Proposal-to-invoice handoff', 'Status update emails'], tools: 'Gmail/Outlook, Notion, QuickBooks, DocuSign' },
  { name: 'Education / Training', icon: 'icon-check-square.svg', bg: ['#E8EDE9', '#DBE3DC'], problems: 'Enrollment questions answered one-by-one, cohort reminders sent manually, certificates issued by hand.', examples: ['Enrollment chat answers', 'Cohort reminder sequences', 'Certificate delivery'], tools: 'Kajabi, Teachable, Mailchimp, Google Sheets' },
  { name: 'Local Service Businesses', icon: 'icon-orchestrate.svg', bg: ['#EAF6EF', '#DCF0E5'], problems: 'Booking requests come in on five different channels and get lost between them.', examples: ['Unified booking intake', 'Review request automation', 'No-show follow-up'], tools: 'WhatsApp, Instagram DMs, Google Business, Calendly' },
]

const needs = [
  { num: '01', title: 'Lead intake', desc: 'Every inbound message gets a fast, qualified reply instead of a delayed one.' },
  { num: '02', title: 'Scheduling', desc: 'Booking, rescheduling, and reminders happen without a phone call.' },
  { num: '03', title: 'Follow-up', desc: 'Quotes, proposals, and after-visit messages go out automatically, on time.' },
  { num: '04', title: 'Back office', desc: 'Invoices, records, and status updates sync without manual re-entry.' },
]

const workflows = [
  { tag: 'Home Services', title: 'After-hours missed call → booked job', steps: ['Missed call triggers an instant text with booking link', 'Customer picks a slot from live tech availability', 'Job auto-added to dispatch board, tech notified'] },
  { tag: 'Real Estate', title: 'New lead → qualified showing', steps: ['Inquiry auto-qualified by budget, area, and timeline', 'Hot leads routed straight to the right agent', 'Showing booked and confirmed without back-and-forth'] },
  { tag: 'E-commerce', title: 'Order placed → invoice reconciled', steps: ['Order synced from store to invoicing tool instantly', 'Payment matched automatically against the invoice', 'Customer gets a status update with zero manual entry'] },
]

const stats = [
  { num: '7', label: 'Industries served' },
  { num: '120+', label: 'Systems shipped' },
  { num: '7 days', label: 'Typical build time' },
  { num: '30 days', label: 'Support included' },
]

const faqs = [
  { q: "What if my industry isn't listed?", a: "Most automation we build isn't industry-specific software — it's the workflow underneath it (intake, scheduling, follow-up, back office). If you run a business with repetitive manual work, we can very likely help." },
  { q: 'Do you need industry-specific software experience?', a: 'We learn your existing tools during discovery rather than forcing you onto new software. Most builds connect to what you already use.' },
  { q: 'How is pricing decided per industry?', a: "There's no fixed package by industry — every build gets a fixed quote and timeline after a discovery call and workflow audit, based on the actual scope." },
  { q: 'Can one system serve multiple industries at once (e.g. multi-location)?', a: 'Yes — we regularly build systems that flex across locations or service lines within the same business.' },
]

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return <header className="ind-heading" data-reveal>
    {eyebrow && <div className="ind-eyebrow"><i /><span>{eyebrow}</span><i /></div>}
    <h2>{title}</h2>
  </header>
}

function IndustryCard({ industry }: { industry: typeof industries[number] }) {
  const spotlight = (event: PointerEvent<HTMLElement>) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--sx', `${((event.clientX - rect.left) / rect.width) * 100}%`)
    card.style.setProperty('--sy', `${((event.clientY - rect.top) / rect.height) * 100}%`)
  }
  const glowOn = (e: React.PointerEvent<HTMLElement>) => e.currentTarget.style.setProperty('--sglow', '1')
  const glowOff = (e: React.PointerEvent<HTMLElement>) => e.currentTarget.style.setProperty('--sglow', '0')
  const style = { '--sx': '50%', '--sy': '50%', '--sglow': '0', '--icon-bg': `linear-gradient(160deg,${industry.bg[0]},${industry.bg[1]})` } as CSSProperties
  return <article className="ind-card" data-reveal style={style} onPointerMove={spotlight} onPointerEnter={glowOn} onPointerLeave={glowOff}>
    <div className="ind-card-title"><span className="ind-icon"><img src={`/assets/${industry.icon}`} alt="" /></span><h3>{industry.name}</h3></div>
    <div className="ind-copy"><strong>Common problems</strong><p>{industry.problems}</p></div>
    <div className="ind-copy"><strong>What we automate</strong><div className="ind-chips">{industry.examples.map(example => <span key={example}>{example}</span>)}</div></div>
    <div className="ind-copy"><strong>Tools we connect to</strong><p className="ind-tools">{industry.tools}</p></div>
    <Link href="/contact">Talk about {industry.name} automation <img src="/assets/icon-arrow-right.svg" alt="" /></Link>
  </article>
}

export default function IndustriesPage() {
  const [openFaq, setOpenFaq] = useState(-1)
  const gridRef = useScrollReveal<HTMLElement>(0.08)
  const needsRef = useScrollReveal<HTMLElement>(0.1)
  const workflowRef = useScrollReveal<HTMLElement>(0.1)
  const proofRef = useScrollReveal<HTMLElement>(0.08)
  const faqRef = useScrollReveal<HTMLElement>(0.08)
  const ctaRef = useScrollReveal<HTMLElement>(0.1)

  return <div className="industries-page">
    <section className="ind-hero">
      <div>
        <div className="ind-hero-badge"><i /><span>Who we build for</span></div>
        <h1>Automation that fits <span>how your industry</span> actually works.</h1>
        <p>Every industry loses time differently. We start from the workflows you already run — not a generic template.</p>
      </div>
    </section>

    <section className="ind-grid-section" id="industry-grid" ref={gridRef}>
      <div className="ind-section-inner">
        <SectionHeading eyebrow="Seven industries, one approach" title="Find where you fit." />
        <div className="ind-grid">{industries.map(industry => <IndustryCard key={industry.name} industry={industry} />)}</div>
      </div>
    </section>

    <section className="ind-needs" ref={needsRef}>
      <div className="ind-section-inner">
        <header data-reveal><h2>The same four gaps show up everywhere.</h2><p>Whatever your industry, most manual-work bottlenecks fall into one of these buckets.</p></header>
        <div className="ind-needs-grid">{needs.map(need => <article key={need.num} data-reveal><b>{need.num}</b><strong>{need.title}</strong><p>{need.desc}</p></article>)}</div>
      </div>
    </section>

    <section className="ind-workflows" ref={workflowRef}>
      <div className="ind-section-inner">
        <SectionHeading eyebrow="In practice" title="Example workflows by industry." />
        <div className="ind-workflow-grid">{workflows.map(workflow => <article key={workflow.title} data-reveal><span>{workflow.tag}</span><h3>{workflow.title}</h3><ol>{workflow.steps.map((step, index) => <li key={step}><b>{index + 1}</b><p>{step}</p></li>)}</ol></article>)}</div>
      </div>
    </section>

    <section className="ind-inquiry"><div className="ind-section-inner"><ContextualInquiryCta formVariant="industries_compact" pageName="Industries" sourceSection="industries-inline" heading="Tell us where your workflow gets stuck." description="Every business runs on the same handful of manual steps. Describe yours and we will tell you which one is worth automating first." descriptionLabel="Where does the manual work pile up?" descriptionPlaceholder="e.g. booking, follow-ups, and invoicing are all done by hand." submitLabel="Get my free workflow audit" /></div></section>

    <section className="ind-proof" ref={proofRef}><div>{stats.map(stat => <article key={stat.label} data-reveal><b>{stat.num}</b><span>{stat.label}</span></article>)}</div></section>

    <section className="ind-faq" id="faq" ref={faqRef}>
      <div>
        <SectionHeading title="Industry questions." />
        <div className="ind-faq-list">{faqs.map((faq, index) => {
          const open = openFaq === index
          const panelId = `ind-faq-panel-${index}`
          const btnId = `ind-faq-btn-${index}`
          return <article className={open ? 'is-open' : ''} key={faq.q} data-reveal>
            <button id={btnId} onClick={() => setOpenFaq(open ? -1 : index)} aria-expanded={open} aria-controls={panelId}><span>{faq.q}</span><i><ChevronDown size={17} /></i></button>
            <div className="ind-faq-answer" id={panelId} role="region" aria-labelledby={btnId}><div><p>{faq.a}</p></div></div>
          </article>
        })}</div>
      </div>
    </section>

    <section className="ind-cta" ref={ctaRef}>
      <div className="ind-cta-wrap"><div className="ind-cta-panel" data-reveal>
        <div className="ind-cta-copy"><strong>Don&apos;t see your industry?</strong><h2>We probably still <span>fit anyway.</span></h2><p>Most of what we build isn&apos;t industry-specific software — it&apos;s the workflow underneath it. Tell us how work happens today.</p><div>{['Free audit included', 'No long contracts', '30-day support'].map(item => <span key={item}><b>✓</b>{item}</span>)}</div></div>
        <div className="ind-cta-action"><strong>What you get in 30 minutes</strong><div>{['A map of your biggest time drains', 'Which workflow to automate first', 'A fixed quote — before we build anything'].map(item => <span key={item}><b>✓</b>{item}</span>)}</div><Link href="/contact" className="cta-action-btn cta-sweep">Book Free Discovery Call <img src="/assets/icon-arrow-right.svg" alt="" /></Link></div>
      </div></div>
    </section>

    <style>{`
      .industries-page,.industries-page *{box-sizing:border-box}.industries-page{overflow:hidden;background:#F7F2EA}.ind-section-inner{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px)}
      .ind-hero{position:relative;background:radial-gradient(1000px 600px at 78% -15%,rgba(23,160,99,.2),transparent 60%),#0A120E}.ind-hero>div{max-width:780px;margin:0 auto;padding:clamp(56px,8vw,88px) clamp(20px,3vw,32px) clamp(44px,6vw,64px);display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center}.ind-hero-badge{display:flex;align-items:center;gap:9px;background:rgba(217,179,106,.1);border:1px solid rgba(217,179,106,.4);border-radius:999px;padding:8px 16px;animation:v3Rise .65s var(--ease-premium) both}.ind-hero-badge i{width:7px;height:7px;border-radius:50%;background:#D9B36A}.ind-hero-badge span{font:700 11.5px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:#D9B36A;text-transform:uppercase}.ind-hero h1{margin:0;font:600 clamp(34px,4.6vw,54px)/1.1 'Space Grotesk',sans-serif;color:#F5F0E8;letter-spacing:-.025em;text-wrap:balance;animation:v3Rise .7s .08s var(--ease-premium) both}.ind-hero h1 span{color:#2BD483}.ind-hero p{margin:0;max-width:560px;font:400 18px/1.65 'Instrument Sans',sans-serif;color:rgba(245,240,232,.62);animation:v3Rise .7s .16s var(--ease-premium) both}
      .ind-grid-section{background-color:#F7F2EA;background-image:radial-gradient(rgba(14,42,29,.06) 1px,transparent 1.5px);background-size:26px 26px}.ind-heading{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:40px;text-align:center}.ind-heading h2{margin:0;font:600 clamp(28px,3.6vw,42px)/1.15 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.02em}.ind-eyebrow{display:flex;align-items:center;gap:14px}.ind-eyebrow i{width:38px;height:2px;background:#D9B36A}.ind-eyebrow span{font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#128A54;text-transform:uppercase}.ind-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:22px}.ind-card{position:relative;display:flex;flex-direction:column;gap:14px;padding:clamp(24px,2.6vw,30px);overflow:hidden;background:linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4);border:1px solid rgba(13,58,49,.14);border-radius:22px;box-shadow:0 20px 54px rgba(18,32,27,.1),inset 0 1px 0 rgba(255,255,255,.8);transition:transform .5s var(--ease-premium),box-shadow .5s var(--ease-premium),border-color .5s var(--ease-premium)}.ind-card:nth-child(1),.ind-card:nth-child(4),.ind-card:nth-child(5){grid-column:span 7}.ind-card:nth-child(2),.ind-card:nth-child(3),.ind-card:nth-child(6){grid-column:span 5}.ind-card:nth-child(7){grid-column:span 12}.ind-card:before{content:'';position:absolute;inset:0;background:radial-gradient(380px circle at var(--sx) var(--sy),rgba(43,212,131,.16),transparent 70%);opacity:var(--sglow);transition:opacity .35s ease;pointer-events:none;z-index:0}.ind-card:hover{transform:translateY(-6px);border-color:rgba(23,160,99,.34);box-shadow:0 34px 82px rgba(18,32,27,.16),0 0 0 1px rgba(23,160,99,.1)}.ind-card>*{position:relative}.ind-card-title{display:flex;align-items:center;gap:13px}.ind-icon{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--icon-bg);box-shadow:0 10px 24px rgba(18,32,27,.14),inset 0 1px 0 rgba(255,255,255,.7)}.ind-icon img{width:22px;height:22px}.ind-card h3{margin:0;font:600 21px/1.2 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.01em}.ind-copy{display:flex;flex-direction:column;gap:6px}.ind-copy>strong{font:700 10px 'Instrument Sans',sans-serif;letter-spacing:.1em;color:#A39C8C;text-transform:uppercase}.ind-copy p{margin:0;font:400 14.5px/1.6 'Instrument Sans',sans-serif;color:#5B6355}.ind-copy p.ind-tools{font-size:13.5px;color:#8A857B}.ind-chips{display:flex;flex-wrap:wrap;gap:8px}.ind-chips span{display:inline-flex;border-radius:999px;padding:5px 12px;white-space:nowrap;font:600 11.5px 'Instrument Sans',sans-serif;color:#128A54;background:#EAF6EF;border:1px solid rgba(18,138,84,.18)}.ind-card>a{display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:13px;border-top:1px solid rgba(13,58,49,.1);font:600 14px 'Instrument Sans',sans-serif;color:#0E2A1D;text-decoration:none}.ind-card>a img{width:13px;height:13px}
      .ind-needs{background:#0E241A}.ind-needs .ind-section-inner{padding-top:clamp(56px,7vw,80px);padding-bottom:clamp(56px,7vw,80px)}.ind-needs header{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:36px;text-align:center}.ind-needs h2{margin:0;font:600 clamp(26px,3.2vw,36px)/1.15 'Space Grotesk',sans-serif;color:#F5F0E8;letter-spacing:-.02em}.ind-needs header p{margin:0;max-width:560px;font:400 16px/1.6 'Instrument Sans',sans-serif;color:rgba(245,240,232,.6)}.ind-needs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.ind-needs-grid article{display:flex;flex-direction:column;gap:8px;padding:22px 20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px}.ind-needs-grid b{font:700 20px 'Space Grotesk',sans-serif;color:#2BD483}.ind-needs-grid strong{font:600 15px 'Instrument Sans',sans-serif;color:#F5F0E8}.ind-needs-grid p{margin:0;font:400 13.5px/1.55 'Instrument Sans',sans-serif;color:rgba(245,240,232,.55)}
      .ind-workflows{background:#F7F2EA}.ind-workflow-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.ind-workflow-grid article{display:flex;flex-direction:column;gap:14px;padding:26px;background:linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4);border:1px solid rgba(13,58,49,.14);border-radius:20px;box-shadow:0 16px 40px rgba(18,32,27,.08)}.ind-workflow-grid article>span{align-self:flex-start;border-radius:999px;padding:5px 12px;font:600 11.5px 'Instrument Sans',sans-serif;color:#B08A3E;background:#F8EFDD;border:1px solid rgba(217,179,106,.35)}.ind-workflow-grid h3{margin:0;font:600 18px/1.25 'Space Grotesk',sans-serif;color:#0A120E}.ind-workflow-grid ol{display:flex;flex-direction:column;gap:9px;margin:0;padding:0;list-style:none}.ind-workflow-grid li{display:flex;align-items:flex-start;gap:9px}.ind-workflow-grid li b{width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:50%;background:#EAF6EF;color:#128A54;font:700 10.5px 'Space Grotesk',sans-serif}.ind-workflow-grid li p{margin:0;font:400 13.5px/1.55 'Instrument Sans',sans-serif;color:#5B6355}
      .ind-inquiry{background:#F7F2EA;padding:clamp(48px,7vw,88px) clamp(20px,3vw,32px)}
      .ind-proof{background:#0A120E;border-top:1px solid rgba(255,255,255,.07)}.ind-proof>div{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:rgba(255,255,255,.09)}.ind-proof article{display:flex;flex-direction:column;gap:5px;padding:30px 24px;text-align:center;background:#0A120E}.ind-proof b{font:700 30px 'Space Grotesk',sans-serif;color:#2BD483}.ind-proof span{font:500 13.5px 'Instrument Sans',sans-serif;color:rgba(245,240,232,.55)}
      .ind-faq{background:#F7F2EA}.ind-faq>div{max-width:820px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px)}.ind-faq-list{display:flex;flex-direction:column;gap:12px}.ind-faq-list article{background:#FCFAF4;border:1px solid #EDE6D8;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(32,24,12,.04);transition:.4s}.ind-faq-list article.is-open{background:#fff;border-color:rgba(23,160,99,.4);box-shadow:0 18px 40px rgba(18,32,27,.12)}.ind-faq-list button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;cursor:pointer;background:transparent;border:0;text-align:left;font:600 16px 'Space Grotesk',sans-serif;color:#0A120E}.ind-faq-list button i{width:30px;height:30px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:50%;font-style:normal;color:#128A54;background:#EFE9DC;transition:.35s}.ind-faq-list .is-open button i{color:#fff;background:#128A54;transform:rotate(180deg)}.ind-faq-answer{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .45s var(--ease-premium),opacity .35s}.ind-faq-answer>div{overflow:hidden}.ind-faq-answer p{margin:0;padding:0 22px 20px;font:400 15px/1.62 'Instrument Sans',sans-serif;color:#68705F}.ind-faq-list .is-open .ind-faq-answer{grid-template-rows:1fr;opacity:1}
      .ind-cta{background:radial-gradient(760px 420px at 50% -15%,rgba(23,160,99,.18),transparent 62%),#0A120E}.ind-cta-wrap{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,3vw,32px)}.ind-cta-panel{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(28px,4vw,56px);align-items:center;padding:clamp(26px,4.5vw,54px);background:linear-gradient(160deg,#10301F,#0A1C12);border:1px solid rgba(255,253,246,.14);border-radius:28px;box-shadow:0 44px 100px rgba(0,0,0,.45)}.ind-cta-copy{display:flex;flex-direction:column;align-items:flex-start;gap:18px}.ind-cta-copy>strong{font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#D9B36A;text-transform:uppercase}.ind-cta-copy h2{margin:0;font:600 clamp(30px,3.8vw,46px)/1.12 'Space Grotesk',sans-serif;color:#F5F0E8;letter-spacing:-.02em}.ind-cta-copy h2 span{white-space:nowrap}.ind-cta-copy p{margin:0;max-width:440px;font:400 17px/1.65 'Instrument Sans',sans-serif;color:rgba(245,240,232,.62)}.ind-cta-copy>div{display:flex;flex-wrap:wrap;gap:10px}.ind-cta-copy>div span{display:flex;align-items:center;gap:8px;padding:9px 15px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);font:600 13.5px/1.4 'Instrument Sans',sans-serif;color:rgba(245,240,232,.78);white-space:nowrap}.ind-cta-copy b,.ind-cta-action b{color:#2BD483}.ind-cta-action{display:flex;flex-direction:column;gap:14px;padding:clamp(20px,2.6vw,30px);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:20px}.ind-cta-action>strong{font:700 10.5px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:rgba(245,240,232,.5);text-transform:uppercase}.ind-cta-action>div{display:flex;flex-direction:column;gap:11px}.ind-cta-action>div span{display:flex;align-items:flex-start;gap:10px;font:500 14.5px/1.5 'Instrument Sans',sans-serif;color:rgba(245,240,232,.8)}.ind-cta-action a{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:4px;padding:17px 20px;border-radius:13px;background:linear-gradient(160deg,#E7C57E,#D9B36A);box-shadow:0 16px 40px rgba(217,179,106,.3),inset 0 1px 0 rgba(255,255,255,.4);font:600 16px 'Instrument Sans',sans-serif;color:#0A120E;text-decoration:none;white-space:nowrap}.ind-cta-action a img{width:15px;height:15px}
      @media(max-width:900px){.ind-workflow-grid{grid-template-columns:1fr}}@media(max-width:860px){.ind-cta-panel{grid-template-columns:1fr;align-items:stretch}}@media(max-width:820px){.ind-grid{grid-template-columns:1fr}.ind-card{grid-column:auto!important}}@media(max-width:760px){.ind-needs-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.ind-needs-grid{grid-template-columns:1fr}.ind-cta-panel{padding:24px 20px}.ind-cta-copy h2{font-size:29px}.ind-cta-action a{font-size:15px;padding:16px 14px}}
      html[data-motion='reduced'] .ind-hero-badge,html[data-motion='reduced'] .ind-hero h1,html[data-motion='reduced'] .ind-hero p{animation:none!important}@media(prefers-reduced-motion:reduce){html:not([data-motion='full']) .ind-hero-badge,html:not([data-motion='full']) .ind-hero h1,html:not([data-motion='full']) .ind-hero p{animation:none!important}}
    `}</style>
  </div>
}
