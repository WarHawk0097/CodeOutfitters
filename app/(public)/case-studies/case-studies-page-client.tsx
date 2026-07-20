'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Star, Home, ShoppingBag, HeartPulse, Scale, Truck, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useMotionMode } from '@/components/motion-mode-provider'

interface CaseStudy {
  icon: typeof Home
  industry: string
  system: string
  title: string
  summary: string
  problem: string
  solution: string
  metrics: { value: string; label: string }[]
  sample?: boolean
}

const caseStudies: CaseStudy[] = [
  {
    icon: Home, industry: 'Real Estate', system: 'WhatsApp Automation',
    title: 'How a Real Estate Agency Doubled Lead Response Rate',
    summary: 'A 3-agent office was losing leads to faster competitors. We built a WhatsApp bot that qualifies, responds, and books viewings 24/7.',
    problem: 'Leads emailed or texted after hours went unanswered until the next morning — by then, competing agencies had often already booked the viewing.',
    solution: 'A WhatsApp bot now answers instantly, qualifies buyer intent, checks listing availability, and books viewing slots straight into the team calendar.',
    metrics: [
      { value: '2x', label: 'Response rate' },
      { value: '87%', label: 'Faster follow-ups' },
      { value: '18 hrs', label: 'Saved / week' },
    ],
  },
  {
    icon: ShoppingBag, industry: 'E-commerce', system: 'Invoice Automation',
    title: 'Invoice Processing Reduced from 4 Hours to 8 Minutes Daily',
    summary: 'An online retailer was manually creating invoices and reconciling orders. Our pipeline now handles 200+ invoices per day, error-free.',
    problem: 'A single ops person spent close to half her day copying order data into invoices and manually checking payments against orders.',
    solution: 'Orders now flow automatically into templated invoices, matched against incoming payments, with exceptions flagged for a quick human check.',
    metrics: [
      { value: '97%', label: 'Time Saved' },
      { value: '0', label: 'Data-entry errors' },
      { value: '$1,200', label: 'Saved / mo' },
    ],
  },
  {
    icon: HeartPulse, industry: 'Healthcare', system: 'Booking Bot',
    title: 'Medical Clinic Eliminates 90% of Phone-Based Scheduling',
    summary: 'A busy clinic was overwhelmed by appointment calls. We deployed an AI booking bot that syncs with their calendar and sends reminders automatically.',
    problem: 'Front-desk staff spent most of the day on the phone booking and rebooking appointments, with no time left for patients in the office.',
    solution: 'An AI booking bot now handles scheduling by chat, checks real-time calendar availability, and sends automatic reminder texts to cut no-shows.',
    metrics: [
      { value: '90%', label: 'Fewer Calls' },
      { value: '40%', label: 'Drop in no-shows' },
      { value: '24/7', label: 'Booking' },
    ],
  },
  {
    icon: Scale, industry: 'Legal', system: 'Intake Automation',
    title: 'Law Firm Cuts Client Intake From Half a Week to Minutes',
    summary: 'A busy practice had a paralegal manually processing every new client intake form by hand, delaying case starts.',
    problem: 'New client intake — forms, conflict checks, document requests — consumed a significant chunk of a paralegal’s week, and nothing moved forward until it was done.',
    solution: 'An automated intake flow now collects client information, runs conflict checks, and requests missing documents the moment a new client signs on.',
    metrics: [
      { value: '80%', label: 'Faster Intake' },
      { value: '0', label: 'Missed Forms' },
      { value: '12 hrs', label: 'Saved / week' },
    ],
    sample: true,
  },
  {
    icon: Truck, industry: 'Logistics', system: 'Dispatch Automation',
    title: 'Logistics Company Automates Dispatch in Six Days',
    summary: 'A regional carrier was coordinating drivers and jobs through phone calls and spreadsheets, with no reliable record of what was assigned.',
    problem: 'Dispatch decisions lived in one coordinator’s head and a shared spreadsheet — assignments were slow, and nothing was tracked automatically.',
    solution: 'We mapped the full dispatch workflow and built an automation that assigns jobs to available drivers and logs every assignment automatically.',
    metrics: [
      { value: '35%', label: 'Faster Dispatch' },
      { value: '100%', label: 'Jobs logged' },
      { value: '22 hrs', label: 'Saved / week' },
    ],
    sample: true,
  },
  {
    icon: Wrench, industry: 'Home Services', system: 'WhatsApp Automation',
    title: 'HVAC Company Triples Review Volume With an Automated Follow-Up',
    summary: 'An HVAC business was quoting and booking jobs by phone, and rarely remembered to ask happy customers for a review.',
    problem: 'Job quoting happened over scattered phone calls, and review requests were an afterthought that usually never got sent.',
    solution: 'A WhatsApp bot now quotes common jobs instantly, books technicians into the calendar, and automatically follows up for a review after each job.',
    metrics: [
      { value: '3x', label: 'More Reviews' },
      { value: '24/7', label: 'Quoting' },
      { value: '15 hrs', label: 'Saved / week' },
    ],
    sample: true,
  },
]

const industries = ['All', 'Real Estate', 'E-commerce', 'Healthcare', 'Legal', 'Logistics', 'Home Services']

const testimonials = [
  {
    text: 'We used to lose weekend leads to whoever replied first on Monday. Now the bot has already booked the viewing before I’ve had my coffee.',
    handle: '— Principal broker, 3-agent real estate office',
    result: '',
  },
  {
    text: 'Invoicing used to be my entire afternoon. Now it’s an eight-minute check of a dashboard, and I get my afternoons back.',
    handle: '— Operations lead, online retailer',
    result: '',
  },
  {
    text: 'The front desk finally talks to the patients in the room instead of the ones on hold. That alone was worth the build.',
    handle: '— Practice manager, family clinic',
    result: '',
  },
]

function CaseStudiesHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#0A120E' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(1000px 600px at 78% -15%, rgba(23,160,99,.20), transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-[820px] mx-auto text-center" style={{padding:'clamp(56px,8vw,88px) clamp(20px,3vw,32px) clamp(36px,5vw,52px)'}}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-6"
            style={{
              color: '#D9B36A',
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            Sample work
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.1] text-[#F5F0E8] -tracking-[.02em] mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Real businesses. <span style={{ color: '#2BD483' }}>Real results.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg leading-relaxed max-w-2xl mx-auto"
          style={{ color: 'rgba(245,240,232,.62)' }}
        >
          Six industries, six automations, one shared outcome — hours of manual work handed back every week.
        </motion.p>

      </div>
    </section>
  )
}

function FilterPills({ selected, onChange }: { selected: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-[9px] px-5 md:px-8 pt-10 pb-10" style={{ background: 'transparent' }}>
      {industries.map((ind) => (
        <button
          key={ind}
          onClick={() => onChange(ind)}
          className="text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200"
          style={{
            background: selected === ind ? '#0E2A1D' : '#F4EEE2',
            color: selected === ind ? '#F7F2EA' : '#5B6355',
            borderColor: selected === ind ? '#0E2A1D' : '#E4DDD0',
          }}
        >
          {ind}
        </button>
      ))}
    </div>
  )
}

function CaseStudyCard({ study, index, expanded, onToggle }: { study: CaseStudy; index: number; expanded: boolean; onToggle: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const handlePointerMove = (e: React.PointerEvent) => {
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%')
    el.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100) + '%')
  }
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="case-glow-card rounded-[22px] overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(178deg,#fff 0%,#FBF7EE 68%,#F6F1E4 100%)',
        border: '1px solid rgba(13,58,49,.14)',
        boxShadow: '0 20px 54px rgba(18,32,27,.10), inset 0 1px 0 rgba(255,255,255,.8)',
      }}
      onPointerEnter={(e) => { handlePointerMove(e); cardRef.current?.style.setProperty('--sglow', '1') }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => cardRef.current?.style.setProperty('--sglow', '0')}
    >
      <div className="p-6 md:p-7 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-bold uppercase tracking-[.12em]" style={{color:'#A39C8C'}}>Case {String(index+1).padStart(2,'0')}</span><span className="text-[11px] font-semibold px-3 py-1 rounded-full" style={{color:'#8A857B',background:'rgba(255,255,255,.65)',border:'1px solid rgba(13,58,49,.16)'}}>Sample project</span></div>
        <div className="flex gap-2 flex-wrap mb-3">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{
                background: '#F4EEE2',
                color: '#68705F',
                border: '1px solid #E4DDD0',
              }}
            >
              {study.industry}
            </span>
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{
                background: '#EAF6EF',
                color: '#128A54',
                border: '1px solid rgba(18,138,84,.16)',
              }}
            >
              {study.system}
            </span>
        </div>

        <h3
          className="text-base font-semibold leading-snug mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
        >
          {study.title}
        </h3>

        <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: '#5B6355' }}>
          {study.summary}
        </p>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div
                className="pt-3 text-xs leading-relaxed space-y-2"
                style={{ borderTop: '1px solid rgba(13,58,49,.08)', color: '#5B6355' }}
              >
                <p><strong style={{ color: '#0A120E' }}>Problem:</strong> {study.problem}</p>
                <p><strong style={{ color: '#0A120E' }}>Solution:</strong> {study.solution}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-3 overflow-hidden mb-3" style={{background:'linear-gradient(165deg,#0E2A1D,#08160F)',borderRadius:14}}>{study.metrics.map((m)=><div key={m.label} className="text-center flex flex-col py-[14px] px-2"><div className="text-[21px] font-bold" style={{fontFamily:"'Space Grotesk',sans-serif",color:'#2BD483'}}>{m.value}</div><span className="text-[9.5px] font-semibold uppercase leading-tight" style={{color:'rgba(245,240,232,.55)'}}>{m.label}</span></div>)}</div>
        <div className="flex items-center justify-between gap-3 mt-auto"><button onClick={onToggle} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{color:'#0E2A1D'}}>{expanded?'Hide full story':'Read the full story'}<ArrowRight className={`w-3.5 h-3.5 transition-transform ${expanded?'rotate-90':''}`}/></button><Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-4" style={{color:'#0E2A1D'}}>Get a similar system<ArrowRight className="w-3.5 h-3.5"/></Link></div>
      </div>
    </motion.div>
  )
}

function CaseStudiesGrid() {
  const [filter, setFilter] = useState('All')
  const [openStory, setOpenStory] = useState(-1)
  const filtered = filter === 'All' ? caseStudies : caseStudies.filter((c) => c.industry === filter)

  return (
    <section style={{ backgroundColor: '#F7F2EA', backgroundImage:'radial-gradient(rgba(14,42,29,.06) 1px,transparent 1.5px)', backgroundSize:'26px 26px' }}>
      <FilterPills selected={filter} onChange={(value) => { setFilter(value); setOpenStory(-1) }} />
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 pb-[clamp(56px,8vw,92px)]">
        <div className="grid grid-cols-1 min-[761px]:grid-cols-2 gap-[22px]">
          {filtered.map((study, i) => (
            <CaseStudyCard key={study.title} study={study} index={i} expanded={openStory === i} onToggle={() => setOpenStory(openStory === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsRotator() {
  const [current, setCurrent] = useState(0)
  const { reduced } = useMotionMode()

  const next = useCallback(() => {
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))
  }, [])

  useEffect(() => {
    if (reduced) return
    const timer = setInterval(next, 5200)
    return () => clearInterval(timer)
  }, [next, reduced])

  return (
    <section
      className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0E241A' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(540px 340px at 50% 30%, rgba(23,160,99,.08), transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-6"
            style={{
              color: '#2BD483',
              background: 'rgba(43,212,131,.1)',
              border: '1px solid rgba(43,212,131,.2)',
            }}
          >
            In their words
          </span>
        </motion.div>

        <h2 style={{margin:'0 0 26px',font:'600 clamp(26px,3.2vw,38px)/1.15 "Space Grotesk",sans-serif',color:'#F5F0E8',letterSpacing:'-.02em'}}>What working with us feels like.</h2>

        <div className="relative min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="case-quote-mark" style={{font:'700 56px/.6 "Space Grotesk",sans-serif',color:'#D9B36A'}}>&quot;</span>
              <blockquote
                className="text-lg md:text-xl leading-relaxed font-medium mb-8 max-w-2xl"
                style={{ color: 'rgba(245,240,232,.85)' }}
              >
                &ldquo;{testimonials[current].text}&rdquo;
              </blockquote>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,.55)' }}>
                {testimonials[current].handle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 26 : 9,
                height: 9,
                background: i === current ? '#2BD483' : 'rgba(255,255,255,.22)',
              }}
            />
          ))}
        </div>
        <span style={{font:'400 12.5px "Instrument Sans",sans-serif',color:'rgba(245,240,232,.4)'}}>Illustrative feedback based on the sample projects above.</span>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden" style={{ background: '#F7F2EA' }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
        >
          Ready to see what automation looks like <span style={{ color: '#17A063' }}>for your business</span>?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-base leading-relaxed mb-8"
          style={{ color: '#5B6355' }}
        >
          Book a free discovery call and we&apos;ll map your biggest time drains — no obligation, no sales pitch.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:gap-3"
            style={{
              background: 'linear-gradient(160deg,#E7C57E,#D9B36A)',
              color: '#0A120E',
              boxShadow: '0 12px 32px rgba(217,179,106,.25), inset 0 1px 0 rgba(255,255,255,.4)',
            }}
          >
            Book Free Discovery Call
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function ApprovedCaseCTA(){return <section className="case-approved-cta"><div><div className="case-cta-panel"><div className="case-cta-copy"><strong>Your business, next</strong><h2>Book a <span>Discovery Call</span></h2><p>Every case study above started with the same 30-minute call. Let&apos;s map your biggest time drain next.</p><nav><Link href="/services">Explore Services</Link><Link href="/process">See Our Process</Link></nav><div>{['Free audit included','No long contracts','30-day support'].map(x=><span key={x}><b>✓</b>{x}</span>)}</div></div><div className="case-cta-action"><strong>What you get in 30 minutes</strong><div>{['A map of your biggest time drains','An honest automation-fit assessment','A fixed quote — before we build anything'].map(x=><span key={x}><b>✓</b>{x}</span>)}</div><Link href="/contact" className="cta-action-btn cta-sweep">Book Free Discovery Call <img src="/assets/icon-arrow-right.svg" alt=""/></Link><small><i/>3 build slots left for July</small></div></div></div><style>{`
.case-glow-card{--sx:50%;--sy:50%;--sglow:0;position:relative;isolation:isolate}.case-glow-card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(380px circle at var(--sx) var(--sy),rgba(43,212,131,.16),transparent 70%);opacity:var(--sglow);pointer-events:none;z-index:1;transition:opacity .3s ease}
.case-quote-mark{animation:coQuotePulse 4s ease-in-out infinite}@keyframes coQuotePulse{0%,100%{opacity:.5}50%{opacity:1}}
.co-pulse-dot{animation:coV3Pulse 1.8s ease-out infinite}@keyframes coV3Pulse{0%{box-shadow:0 0 0 0 rgba(43,212,131,.55)}70%{box-shadow:0 0 0 9px rgba(43,212,131,0)}100%{box-shadow:0 0 0 0 rgba(43,212,131,0)}}
.co-chevron{display:inline-block;transition:transform .35s cubic-bezier(.34,1.56,.64,1)}.co-chevron.open{transform:rotate(180deg);animation:coChevronPop .4s cubic-bezier(.34,1.56,.64,1)}@keyframes coChevronPop{0%{transform:scale(1)}40%{transform:scale(.82)}100%{transform:scale(1)}}.case-approved-cta{background:radial-gradient(760px 420px at 50% -15%,rgba(23,160,99,.18),transparent 62%),#0A120E}.case-approved-cta>div{max-width:1180px;margin:auto;padding:clamp(56px,8vw,96px) clamp(20px,3vw,32px)}.case-cta-panel{max-width:1060px;margin:auto;padding:clamp(26px,4.5vw,54px);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(28px,4vw,56px);align-items:center;background:linear-gradient(160deg,#10301F,#0A1C12);border:1px solid rgba(255,253,246,.14);border-radius:28px;box-shadow:0 44px 100px rgba(0,0,0,.45)}.case-cta-copy{display:flex;flex-direction:column;align-items:flex-start;gap:18px}.case-cta-copy>strong{font:700 12px 'Instrument Sans';letter-spacing:.18em;color:#D9B36A;text-transform:uppercase}.case-cta-copy h2{margin:0;font:600 clamp(30px,3.8vw,46px)/1.12 'Space Grotesk';color:#F5F0E8}.case-cta-copy h2 span{white-space:nowrap}.case-cta-copy p{max-width:440px;margin:0;font:400 17px/1.65 'Instrument Sans';color:rgba(245,240,232,.62)}.case-cta-copy nav{display:flex;gap:16px}.case-cta-copy nav a{font:600 13.5px 'Instrument Sans';color:#D9B36A;text-decoration:underline}.case-cta-copy>div{display:flex;flex-wrap:wrap;gap:10px}.case-cta-copy>div span{padding:9px 15px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);white-space:nowrap;font:600 13.5px 'Instrument Sans';color:rgba(245,240,232,.78)}.case-cta-copy b,.case-cta-action b{color:#2BD483;margin-right:8px}.case-cta-action{padding:clamp(20px,2.6vw,30px);display:flex;flex-direction:column;gap:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:20px}.case-cta-action>strong{font:700 10.5px 'Instrument Sans';letter-spacing:.14em;color:rgba(245,240,232,.5);text-transform:uppercase}.case-cta-action>div{display:flex;flex-direction:column;gap:11px}.case-cta-action>div span{font:500 14.5px/1.5 'Instrument Sans';color:rgba(245,240,232,.8)}.case-cta-action>a{display:flex;align-items:center;justify-content:center;gap:10px;padding:17px 20px;border-radius:13px;background:linear-gradient(160deg,#E7C57E,#D9B36A);font:600 16px 'Instrument Sans';color:#0A120E;text-decoration:none;white-space:nowrap}.case-cta-action>a img{width:15px;height:15px}.case-cta-action small{display:flex;align-items:center;justify-content:center;gap:8px;font:600 13px 'Instrument Sans';color:#D9B36A}.case-cta-action small i{width:8px;height:8px;border-radius:50%;background:#D9B36A}@media(max-width:860px){.case-cta-panel{grid-template-columns:1fr}}@media(max-width:640px){.case-cta-panel{padding:24px 20px}.case-cta-copy h2{font-size:29px}.case-cta-action>a{font-size:15px;padding:16px 14px}}
`}</style></section>}

export function CaseStudiesPageClient() {
  return (
    <>
      <CaseStudiesHero />
      <CaseStudiesGrid />
      <TestimonialsRotator />
      <ApprovedCaseCTA />
    </>
  )
}
