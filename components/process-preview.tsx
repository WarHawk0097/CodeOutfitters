'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const steps = [
  { day: 'Day 1', title: 'Discovery Call', body: '30 minutes — we map your exact workflow, find your biggest time drains, and tell you honestly whether automation fits.' },
  { day: 'Day 2–3', title: 'Custom Scope', body: 'We design the automation architecture for your exact tools, then send a clear scope with timeline and cost before we start.' },
  { day: 'Day 4–6', title: 'We Build It', body: 'We handle every technical detail — integrations, hosting, testing. You just review and approve before anything goes live.' },
  { day: 'Day 7 · Live', title: 'You Save Time', body: 'Ongoing support included. We monitor your automations, fix issues fast, and optimize as your business grows.' },
]

export function ProcessPreview() {
  const ref = useRef<HTMLElement>(null)
  const visible = useInView(ref, { once: true, amount: 0.08 })

  return (
    <section ref={ref} className="hp-process">
      <div className="hp-section-inner">
        <header className="hp-section-head">
          <div className="hp-kicker"><i />02 · How it works<i /></div>
          <h2>From Discovery to <span>Deployed in 7 Days</span></h2>
          <p>A streamlined process designed to minimize your time investment while maximizing results.</p>
        </header>
        <div className="hp-timeline" data-process-timeline>
          <div className="hp-spine"><motion.span data-process-fill initial={{ scaleY: 0 }} animate={{ scaleY: visible ? 1 : 0 }} transition={{ duration: 1.9, ease: [0.16, 1, 0.3, 1] }} /></div>
          {steps.map((step, index) => (
            <motion.div className="hp-step" data-process-stage key={step.title} initial={{ opacity: 0, y: 24 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: .65, delay: index * .1, ease: [0.16, 1, 0.3, 1] }}>
              <div className={`hp-step-node ${index === 3 ? 'is-live' : ''}`}>
                {index === 3 ? <><b>DAY 7</b><small>LIVE</small></> : <b>{index + 1}</b>}
              </div>
              <article className={`hp-step-card ${index % 2 ? 'is-right' : 'is-left'} ${index === 3 ? 'is-final' : ''}`}>
                <span className={`hp-step-day ${index === 3 ? 'is-live' : ''}`}>{step.day}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        .hp-process{position:relative;background:#FDFBF6;border-top:1px solid #EDE6D8;overflow:hidden}
        .hp-section-inner{position:relative;max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px)}
        .hp-section-head{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:48px;text-align:center}
        .hp-kicker{display:flex;align-items:center;gap:14px;font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#128A54;text-transform:uppercase}
        .hp-kicker i{display:block;width:38px;height:2px;background:#D9B36A}
        .hp-section-head h2{margin:0;font:600 clamp(32px,4.2vw,50px)/1.12 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.02em}
        .hp-section-head h2 span{color:#128A54}.hp-section-head p{margin:0;font:400 17.5px/1.6 'Instrument Sans',sans-serif;color:#68705F;max-width:460px}
        .hp-timeline{position:relative;max-width:940px;margin:0 auto;display:flex;flex-direction:column;gap:30px}
        .hp-spine{position:absolute;left:50%;top:14px;bottom:14px;width:4px;transform:translateX(-50%);border-radius:2px;background:#E7DEC9;overflow:hidden;mask-image:linear-gradient(180deg,transparent,#000 5%,#000 95%,transparent)}
        .hp-spine span{position:absolute;inset:0;transform-origin:top;background:linear-gradient(180deg,#17A063,#D9B36A)}
        .hp-step{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 104px minmax(0,1fr);align-items:center}
        .hp-step-node{grid-column:2;grid-row:1;justify-self:center;width:64px;height:64px;border-radius:18px;background:linear-gradient(160deg,#17A063,#0E7A4E);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#F5F0E8;box-shadow:0 18px 38px rgba(23,160,99,.44);z-index:3}
        .hp-step-node b{font:700 24px/1 'Space Grotesk',sans-serif}.hp-step-node.is-live{background:linear-gradient(160deg,#17A063,#0E7A4E);box-shadow:0 14px 30px rgba(23,160,99,.42)}
        .hp-step-node.is-live b{font-size:13px;letter-spacing:.06em}.hp-step-node small{font:700 9px 'Instrument Sans',sans-serif;letter-spacing:.12em;color:rgba(255,255,255,.85)}
        .hp-step-card{grid-row:1;position:relative;background:linear-gradient(178deg,#fff,#FBF7EE 72%,#F6F1E4);border:1px solid rgba(13,58,49,.14);border-radius:18px;padding:22px 26px;box-shadow:0 14px 40px rgba(18,32,27,.08),inset 0 1px 0 rgba(255,255,255,.8);display:flex;flex-direction:column;gap:9px;min-width:0;transition:.5s cubic-bezier(.16,1,.3,1)}
        .hp-step-card:hover{transform:translateY(-4px);border-color:rgba(23,160,99,.3);box-shadow:0 24px 60px rgba(18,32,27,.14)}.hp-step-card.is-left{grid-column:1}.hp-step-card.is-right{grid-column:3}.hp-step-card.is-final{border-color:rgba(18,138,84,.32)}
        .hp-step-day{align-self:flex-start;white-space:nowrap;font:700 10px 'Instrument Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#B08A3E;background:#F8EFDD;border:1px solid rgba(217,179,106,.4);border-radius:999px;padding:4px 12px}.hp-step-day.is-live{color:#128A54;background:#EAF6EF;border-color:rgba(18,138,84,.3)}
        .hp-step-card h3{margin:0;font:600 21px 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.01em}.hp-step-card p{margin:0;font:400 15px/1.6 'Instrument Sans',sans-serif;color:#68705F}
        @media(max-width:760px){.hp-timeline{gap:22px}.hp-spine{left:31px;transform:none}.hp-step{grid-template-columns:64px minmax(0,1fr);align-items:start}.hp-step-node{grid-column:1;justify-self:start;width:52px;height:52px;border-radius:15px}.hp-step-node b{font-size:19px}.hp-step-card.is-left,.hp-step-card.is-right{grid-column:2}.hp-step-card h3{font-size:19px}}
        @media(prefers-reduced-motion:reduce){.hp-spine span{transform:scaleY(1)!important}.hp-step{opacity:1!important;transform:none!important}}
      `}</style>
    </section>
  )
}
