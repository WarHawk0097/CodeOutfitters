'use client'

import { useEffect, useState } from 'react'
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

export function Process() {
  const [filled, setFilled] = useState(false)
  const { reduced } = useMotionMode()
  const sectionRef = useScrollReveal<HTMLElement>(0.1)

  useEffect(() => {
    if (reduced) { setFilled(true); return }
    const timer = window.setTimeout(() => setFilled(true), 150)
    return () => window.clearTimeout(timer)
  }, [reduced])

  return (
    <section id="process" className="pro-timeline-section" ref={sectionRef}>
      <div className="pro-inner">
        <header className="pro-heading" data-reveal>
          <div><i /><span>Six steps, start to finish</span><i /></div>
          <h2>From first call to <span>live and supported.</span></h2>
        </header>
        <div className="pro-timeline">
          <div className="pro-spine"><i className={filled ? 'is-filled' : ''} data-process-fill /></div>
          {steps.map((step, index) => (
            <article className="pro-step" data-reveal key={step.title}>
              <div className={`pro-node ${index === 5 ? 'is-final' : ''}`}>
                {index === 5 ? <><b>30</b><span>DAYS</span></> : <b>{index + 1}</b>}
              </div>
              <div className={`pro-card ${index % 2 ? 'is-right' : 'is-left'} ${index === 5 ? 'is-final' : ''}`}>
                <span>{step.badge}</span><h3>{step.title}</h3><p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <style>{`
        .pro-inner{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px)}.pro-timeline-section{background:#FDFBF6;border-top:1px solid #EDE6D8}.pro-heading{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:48px;text-align:center}.pro-heading>div{display:flex;align-items:center;gap:14px}.pro-heading>div i{width:38px;height:2px;background:#D9B36A}.pro-heading>div span{font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#128A54;text-transform:uppercase}.pro-heading h2{margin:0;font:600 clamp(32px,4.2vw,50px)/1.12 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.02em}.pro-heading h2 span{color:#128A54}.pro-timeline{position:relative;max-width:940px;margin:0 auto;display:flex;flex-direction:column;gap:30px}.pro-spine{position:absolute;left:50%;top:14px;bottom:14px;width:4px;transform:translateX(-50%);overflow:hidden;border-radius:2px;background:#E7DEC9;mask-image:linear-gradient(180deg,transparent,#000 5%,#000 95%,transparent)}.pro-spine i{position:absolute;inset:0;transform:scaleY(0);transform-origin:top;background:linear-gradient(180deg,#17A063,#D9B36A);transition:transform 1.8s cubic-bezier(.16,1,.3,1)}.pro-spine i.is-filled{transform:scaleY(1)}.pro-step{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 104px minmax(0,1fr);align-items:center}.pro-node{grid-column:2;grid-row:1;justify-self:center;z-index:3;width:64px;height:64px;border-radius:18px;background:#0E2A1D;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#F5F0E8;box-shadow:0 12px 26px rgba(14,42,29,.3)}.pro-node b{font:700 24px/1 'Space Grotesk',sans-serif}.pro-node.is-final{background:linear-gradient(160deg,#17A063,#0E7A4E);box-shadow:0 14px 30px rgba(23,160,99,.42)}.pro-node.is-final b{font-size:13px;letter-spacing:.06em}.pro-node.is-final span{font:700 9px 'Instrument Sans',sans-serif;letter-spacing:.12em;color:rgba(255,255,255,.85)}.pro-card{grid-row:1;display:flex;flex-direction:column;gap:9px;padding:22px 26px;background:linear-gradient(178deg,#fff,#FBF7EE 72%,#F6F1E4);border:1px solid rgba(13,58,49,.14);border-radius:18px;box-shadow:0 14px 40px rgba(18,32,27,.08),inset 0 1px 0 rgba(255,255,255,.8);transition:.5s cubic-bezier(.16,1,.3,1)}.pro-card:hover{transform:translateY(-4px);border-color:rgba(23,160,99,.3);box-shadow:0 24px 60px rgba(18,32,27,.14)}.pro-card.is-left{grid-column:1}.pro-card.is-right{grid-column:3}.pro-card.is-final{border-color:rgba(18,138,84,.32)}.pro-card>span{align-self:flex-start;padding:4px 12px;border-radius:999px;background:#F8EFDD;border:1px solid rgba(217,179,106,.4);font:700 10px 'Instrument Sans',sans-serif;letter-spacing:.12em;color:#B08A3E;text-transform:uppercase}.pro-card.is-final>span{color:#128A54;background:#EAF6EF;border-color:rgba(18,138,84,.3)}.pro-card h3{margin:0;font:600 21px 'Space Grotesk',sans-serif;color:#0A120E}.pro-card p{margin:0;font:400 15px/1.6 'Instrument Sans',sans-serif;color:#68705F}
        @media(max-width:760px){.pro-timeline{gap:22px}.pro-spine{left:31px;transform:none}.pro-step{grid-template-columns:64px minmax(0,1fr);align-items:start}.pro-node{grid-column:1;justify-self:start;width:52px;height:52px;border-radius:15px}.pro-node b{font-size:19px}.pro-card.is-left,.pro-card.is-right{grid-column:2}.pro-card h3{font-size:19px}}
        @media(prefers-reduced-motion:reduce){.pro-spine i{transform:scaleY(1)!important;transition:none}.pro-step{opacity:1!important;transform:none!important}}
      `}</style>
    </section>
  )
}
