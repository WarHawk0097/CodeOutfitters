'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { useMotionMode } from '@/components/motion-mode-provider'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const steps = [
  { badge: 'Step 1', title: 'Discovery Call', text: 'A free 30-minute call where we map how the work happens today and find your biggest time drains.' },
  { badge: 'Step 2', title: 'Workflow Audit', text: 'We dig into your actual tools and steps — no assumptions — to understand exactly what needs to connect to what.' },
  { badge: 'Step 3', title: 'Fixed-Scope Proposal', text: 'You receive a clear, written proposal — exact deliverables, timeline, and cost. No packages, no guessing.' },
  { badge: 'Step 4', title: 'Build Phase', text: 'We build against the approved scope, integrating with the tools you already use — you get progress updates, not surprises.' },
  { badge: 'Step 5', title: 'Testing & Handoff', text: 'We test against real scenarios before anything goes live, then hand off with documentation your team can actually use.' },
  { badge: '30-Day Support', title: 'Live & Supported', text: '30 days of support included after launch — we monitor, fix, and fine-tune as your team gets used to the new system.' },
]

const faqs = [
  { q: "Why isn't there a pricing page?", a: 'Because two businesses rarely need the same build. We scope every project after a discovery call and workflow audit, so your quote reflects your actual tools and volume — not a generic tier.' },
  { q: 'How long does discovery take?', a: 'Just one 30-minute call. We come prepared with questions about your current workflow and walk away with enough to scope a proposal.' },
  { q: 'When do I find out the cost?', a: 'After the workflow audit, in your fixed-scope proposal — before any build work starts. No surprise invoices later.' },
  { q: "What happens if I don't want to move forward after discovery?", a: "Nothing — there's no obligation. The call and audit are free, and it's common for us to tell people automation isn't the right fit yet." },
  { q: 'What does the 30-day support window include?', a: 'We monitor your automations, fix issues fast, and make small adjustments as your team gets used to the new system.' },
]

function Heading({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return <header className="pro-heading" data-reveal>{eyebrow && <div><i /><span>{eyebrow}</span><i /></div>}<h2>{children}</h2></header>
}

export default function ProcessPage() {
  const [openFaq, setOpenFaq] = useState(-1)
  const { reduced } = useMotionMode()
  const timelineRef = useScrollReveal<HTMLElement>(0.1)
  const principlesRef = useScrollReveal<HTMLElement>(0.1)
  const faqRef = useScrollReveal<HTMLElement>(0.08)
  const ctaRef = useScrollReveal<HTMLElement>(0.1)

  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start 0.75', 'end 0.35'] })
  const fillProgress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 })
  const fillScaleY = reduced ? 1 : fillProgress
  const [activeCount, setActiveCount] = useState(reduced ? steps.length : 0)
  useMotionValueEvent(scrollYProgress, 'change', v => {
    if (reduced) return
    setActiveCount(Math.round(v * steps.length))
  })

  return <div className="process-page">
    <section className="pro-hero"><div>
      <div className="pro-badge"><i /><span>How it works</span></div>
      <h1>No generic packages. <span>Every build is scoped.</span></h1>
      <p>We don&apos;t sell off-the-shelf tiers. Every project starts with discovery, so you get a clear quote, timeline, and deliverables built around your actual workflow.</p>
      <div className="pro-hero-chips">{['Fixed quote after discovery', 'Transparent proposal', 'No pressure to commit'].map(item => <span key={item}><b>✓</b>{item}</span>)}</div>
    </div></section>

    <section className="pro-timeline-section" id="timeline" ref={timelineRef}><div className="pro-inner">
      <Heading eyebrow="Six steps, start to finish">From first call to <span>live and supported.</span></Heading>
      <div className="pro-timeline">
        <div className="pro-spine"><motion.i data-process-fill style={{ scaleY: fillScaleY }} /></div>
        {steps.map((step, index) => <article className={`pro-step ${index < activeCount ? 'is-active' : ''}`} data-reveal data-process-stage data-active={index < activeCount} key={step.title}>
          <div className={`pro-node ${index === 5 ? 'is-final' : ''}`}>{index === 5 ? <><b>30</b><span>DAYS</span></> : <b>{index + 1}</b>}</div>
          <div className={`pro-card ${index % 2 ? 'is-right' : 'is-left'} ${index === 5 ? 'is-final' : ''}`}>
            <span>{step.badge}</span><h3>{step.title}</h3><p>{step.text}</p>
          </div>
        </article>)}
      </div>
    </div></section>

    <section className="pro-principles" ref={principlesRef}><div>
      <h2 data-reveal>Why we don&apos;t sell generic packages.</h2>
      <p data-reveal>Two businesses in the same industry rarely run the same workflow, tools, or volume — a fixed tier either overcharges one or undersells the other. So every build is scoped after discovery: you get a clear proposal, a fixed quote, and a timeline built around what you actually need, not a plan you have to fit yourself into.</p>
      <div>{['Custom quote after discovery', 'Fixed scope after audit', 'No pressure to commit'].map(item => <article data-reveal key={item}>{item}</article>)}</div>
    </div></section>

    <section className="pro-faq" id="faq" ref={faqRef}><div>
      <Heading>Process questions.</Heading>
      <div className="pro-faq-list">{faqs.map((faq, index) => { const open = openFaq === index; return <article data-reveal className={open ? 'is-open' : ''} key={faq.q}>
        <button aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : index)}><span>{faq.q}</span><i><ChevronDown size={17} /></i></button>
        <div className="pro-answer"><div><p>{faq.a}</p></div></div>
      </article> })}</div>
    </div></section>

    <section className="pro-cta" ref={ctaRef}><div className="pro-cta-wrap"><div className="pro-cta-panel" data-reveal>
      <div className="pro-cta-copy"><strong>Ready for step one?</strong><h2>Book Your <span>Discovery Call</span></h2><p>No commitment, no pricing pitch — just an honest look at whether automation is worth it for you right now.</p><div>{['Free audit included', 'No long contracts', '30-day support'].map(item => <span key={item}><b>✓</b>{item}</span>)}</div></div>
      <div className="pro-cta-action"><strong>What you get in 30 minutes</strong><div>{['A map of your biggest time drains', 'Which workflow to automate first', 'A fixed quote — before we build anything'].map(item => <span key={item}><b>✓</b>{item}</span>)}</div><Link href="/contact" className="cta-sweep">Book Free Discovery Call <img src="/assets/icon-arrow-right.svg" alt="" /></Link></div>
    </div></div></section>

    <style>{`
      .process-page,.process-page *{box-sizing:border-box}.process-page{overflow:hidden;background:#F7F2EA}.pro-hero{background:radial-gradient(1000px 600px at 78% -15%,rgba(23,160,99,.2),transparent 60%),#0A120E}.pro-hero>div{max-width:780px;margin:0 auto;padding:clamp(56px,8vw,88px) clamp(20px,3vw,32px) clamp(44px,6vw,64px);display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center}.pro-badge{display:flex;align-items:center;gap:9px;padding:8px 16px;background:rgba(217,179,106,.1);border:1px solid rgba(217,179,106,.4);border-radius:999px;animation:v3Rise .65s var(--ease-premium) both}.pro-badge i{width:7px;height:7px;border-radius:50%;background:#D9B36A}.pro-badge span{font:700 11.5px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:#D9B36A;text-transform:uppercase}.pro-hero h1{margin:0;font:600 clamp(34px,4.6vw,54px)/1.1 'Space Grotesk',sans-serif;color:#F5F0E8;letter-spacing:-.025em;text-wrap:balance;animation:v3Rise .7s .08s var(--ease-premium) both}.pro-hero h1 span{color:#2BD483}.pro-hero p{max-width:560px;margin:0;font:400 18px/1.65 'Instrument Sans',sans-serif;color:rgba(245,240,232,.62);animation:v3Rise .7s .16s var(--ease-premium) both}.pro-hero-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;animation:v3Rise .7s .22s var(--ease-premium) both}.pro-hero-chips span{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;white-space:nowrap;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);font:600 11.5px 'Instrument Sans',sans-serif;color:rgba(245,240,232,.78)}.pro-hero-chips b{color:#2BD483}
      .pro-inner{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px)}.pro-timeline-section{background:#FDFBF6;border-top:1px solid #EDE6D8}.pro-heading{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:48px;text-align:center}.pro-heading>div{display:flex;align-items:center;gap:14px}.pro-heading>div i{width:38px;height:2px;background:#D9B36A}.pro-heading>div span{font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#128A54;text-transform:uppercase}.pro-heading h2{margin:0;font:600 clamp(32px,4.2vw,50px)/1.12 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.02em}.pro-heading h2 span{color:#128A54}.pro-timeline{position:relative;max-width:940px;margin:0 auto;display:flex;flex-direction:column;gap:30px}.pro-spine{position:absolute;left:50%;top:14px;bottom:14px;width:4px;transform:translateX(-50%);overflow:hidden;border-radius:2px;background:#E7DEC9;mask-image:linear-gradient(180deg,transparent,#000 5%,#000 95%,transparent)}.pro-spine i{position:absolute;inset:0;transform-origin:top;background:linear-gradient(180deg,#17A063,#D9B36A)}.pro-step{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 104px minmax(0,1fr);align-items:center}.pro-node{grid-column:2;grid-row:1;justify-self:center;z-index:3;width:64px;height:64px;border-radius:18px;background:#0E2A1D;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#F5F0E8;box-shadow:0 12px 26px rgba(14,42,29,.3)}.pro-node b{font:700 24px/1 'Space Grotesk',sans-serif}.pro-node.is-final{background:linear-gradient(160deg,#17A063,#0E7A4E);box-shadow:0 14px 30px rgba(23,160,99,.42)}.pro-step.is-active .pro-node:not(.is-final){background:linear-gradient(160deg,#17A063,#0E7A4E);box-shadow:0 12px 26px rgba(23,160,99,.35)}.pro-node.is-final b{font-size:13px;letter-spacing:.06em}.pro-node.is-final span{font:700 9px 'Instrument Sans',sans-serif;letter-spacing:.12em;color:rgba(255,255,255,.85)}.pro-card{grid-row:1;display:flex;flex-direction:column;gap:9px;padding:22px 26px;background:linear-gradient(178deg,#fff,#FBF7EE 72%,#F6F1E4);border:1px solid rgba(13,58,49,.14);border-radius:18px;box-shadow:0 14px 40px rgba(18,32,27,.08),inset 0 1px 0 rgba(255,255,255,.8);transition:.5s}.pro-card:hover{transform:translateY(-4px);border-color:rgba(23,160,99,.3);box-shadow:0 24px 60px rgba(18,32,27,.14)}.pro-card.is-left{grid-column:1}.pro-card.is-right{grid-column:3}.pro-card.is-final{border-color:rgba(18,138,84,.32)}.pro-card>span{align-self:flex-start;padding:4px 12px;border-radius:999px;background:#F8EFDD;border:1px solid rgba(217,179,106,.4);font:700 10px 'Instrument Sans',sans-serif;letter-spacing:.12em;color:#B08A3E;text-transform:uppercase}.pro-card.is-final>span{color:#128A54;background:#EAF6EF;border-color:rgba(18,138,84,.3)}.pro-card h3{margin:0;font:600 21px 'Space Grotesk',sans-serif;color:#0A120E}.pro-card p{margin:0;font:400 15px/1.6 'Instrument Sans',sans-serif;color:#68705F}
      .pro-principles{background:#0E241A}.pro-principles>div{max-width:900px;margin:0 auto;padding:clamp(56px,7vw,80px) clamp(20px,3vw,32px);display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center}.pro-principles h2{margin:0;font:600 clamp(26px,3.2vw,36px)/1.2 'Space Grotesk',sans-serif;color:#F5F0E8;letter-spacing:-.02em}.pro-principles>div>p{max-width:640px;margin:0;font:400 17px/1.7 'Instrument Sans',sans-serif;color:rgba(245,240,232,.62)}.pro-principles>div>div{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:8px}.pro-principles article{padding:18px 16px;text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;font:600 14.5px 'Instrument Sans',sans-serif;color:#F5F0E8}
      .pro-faq{background:#F7F2EA}.pro-faq>div{max-width:820px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px)}.pro-faq .pro-heading{margin-bottom:44px}.pro-faq .pro-heading h2{font-size:clamp(28px,3.6vw,42px)}.pro-faq-list{display:flex;flex-direction:column;gap:12px}.pro-faq-list article{background:#FCFAF4;border:1px solid #EDE6D8;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(32,24,12,.04);transition:.4s}.pro-faq-list article.is-open{background:#fff;border-color:rgba(23,160,99,.4);box-shadow:0 18px 40px rgba(18,32,27,.12)}.pro-faq-list button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;background:transparent;border:0;cursor:pointer;text-align:left;font:600 16px 'Space Grotesk',sans-serif;color:#0A120E}.pro-faq-list button i{width:30px;height:30px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:50%;font-style:normal;color:#128A54;background:#EFE9DC;transition:.35s}.pro-faq-list .is-open button i{color:#fff;background:#128A54;transform:rotate(180deg)}.pro-answer{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .45s var(--ease-premium),opacity .35s}.pro-answer>div{overflow:hidden}.pro-answer p{margin:0;padding:0 22px 20px;font:400 15px/1.62 'Instrument Sans',sans-serif;color:#68705F}.pro-faq-list .is-open .pro-answer{grid-template-rows:1fr;opacity:1}
      .pro-cta{background:radial-gradient(760px 420px at 50% -15%,rgba(23,160,99,.18),transparent 62%),#0A120E}.pro-cta-wrap{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,96px) clamp(20px,3vw,32px)}.pro-cta-panel{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(28px,4vw,56px);align-items:center;padding:clamp(26px,4.5vw,54px);background:linear-gradient(160deg,#10301F,#0A1C12);border:1px solid rgba(255,253,246,.14);border-radius:28px;box-shadow:0 44px 100px rgba(0,0,0,.45)}.pro-cta-copy{display:flex;flex-direction:column;align-items:flex-start;gap:18px}.pro-cta-copy>strong{font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#D9B36A;text-transform:uppercase}.pro-cta-copy h2{margin:0;font:600 clamp(30px,3.8vw,46px)/1.12 'Space Grotesk',sans-serif;color:#F5F0E8;letter-spacing:-.02em}.pro-cta-copy h2 span{white-space:nowrap}.pro-cta-copy p{max-width:440px;margin:0;font:400 17px/1.65 'Instrument Sans',sans-serif;color:rgba(245,240,232,.62)}.pro-cta-copy>div{display:flex;flex-wrap:wrap;gap:10px}.pro-cta-copy>div span{display:flex;align-items:center;gap:8px;padding:9px 15px;white-space:nowrap;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:999px;font:600 13.5px/1.4 'Instrument Sans',sans-serif;color:rgba(245,240,232,.78)}.pro-cta-copy b,.pro-cta-action b{color:#2BD483}.pro-cta-action{display:flex;flex-direction:column;gap:14px;padding:clamp(20px,2.6vw,30px);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:20px}.pro-cta-action>strong{font:700 10.5px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:rgba(245,240,232,.5);text-transform:uppercase}.pro-cta-action>div{display:flex;flex-direction:column;gap:11px}.pro-cta-action>div span{display:flex;align-items:flex-start;gap:10px;font:500 14.5px/1.5 'Instrument Sans',sans-serif;color:rgba(245,240,232,.8)}.pro-cta-action a{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:4px;padding:17px 20px;white-space:nowrap;background:linear-gradient(160deg,#E7C57E,#D9B36A);border-radius:13px;box-shadow:0 16px 40px rgba(217,179,106,.3),inset 0 1px 0 rgba(255,255,255,.4);font:600 16px 'Instrument Sans',sans-serif;color:#0A120E;text-decoration:none}.pro-cta-action a img{width:15px;height:15px}
      @media(max-width:860px){.pro-cta-panel{grid-template-columns:1fr;align-items:stretch}}@media(max-width:820px){.pro-principles>div>div{grid-template-columns:1fr}}@media(max-width:760px){.pro-timeline{gap:22px}.pro-spine{left:31px;transform:none}.pro-step{grid-template-columns:64px minmax(0,1fr);align-items:start}.pro-node{grid-column:1;justify-self:start;width:52px;height:52px;border-radius:15px}.pro-node b{font-size:19px}.pro-card.is-left,.pro-card.is-right{grid-column:2}.pro-card h3{font-size:19px}}@media(max-width:640px){.pro-cta-panel{padding:24px 20px}.pro-cta-copy h2{font-size:29px}.pro-cta-action a{padding:16px 14px;font-size:15px}}
    `}</style>
  </div>
}
