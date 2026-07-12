'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

function Logo({ size = 12 }: { size?: number }) {
  return (
    <svg style={{ width: size, height: size, flexShrink: 0 }} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#2BD483" />
      <path d="M14 6l-2 8h4l-2 8" stroke="#0A120E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

const cont = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const itemV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } } }

const tabContent = (tab: number, key: string, children: React.ReactNode) => (
  <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
)

export function Hero() {
  const [tab, setTab] = useState(0)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-center overflow-hidden" style={{ background: '#0A120E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(1000px 600px at 78% -15%, rgba(23,160,99,.20), transparent 60%), radial-gradient(700px 460px at 2% 115%, rgba(217,179,106,.09), transparent 60%)' }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(880px 560px at 60% 30%, #000 25%, transparent 74%)', WebkitMaskImage: 'radial-gradient(880px 560px at 60% 30%, #000 25%, transparent 74%)' }} aria-hidden="true" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><style>{`@keyframes pf1{to{stroke-dashoffset:-320}}@keyframes pf2{to{stroke-dashoffset:-340}}@keyframes pf3{to{stroke-dashoffset:-360}}.h1{stroke-dasharray:6 16;animation:pf1 18s linear infinite}.h2{stroke-dasharray:6 16;animation:pf2 22s linear infinite;animation-delay:-5s}.h3{stroke-dasharray:6 16;animation:pf3 25s linear infinite;animation-delay:-10s}@media(prefers-reduced-motion:reduce){.h1,.h2,.h3{animation:none}}`}</style></defs>
        <path className="h1" d="M-60 140 C 300 60, 520 280, 860 200 S 1400 80, 1520 220" stroke="#2BD483" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path className="h2" d="M-60 320 C 320 260, 560 460, 900 380 S 1420 280, 1520 400" stroke="#17A063" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.4" />
        <path className="h3" d="M-60 520 C 300 460, 620 640, 940 560 S 1420 500, 1520 600" stroke="#D9B36A" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24 w-full">
        <motion.div className="lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center" variants={cont} initial="hidden" animate={mounted ? 'show' : 'hidden'}>
          <motion.div variants={itemV} className="flex flex-col items-start gap-6 min-w-0">
            <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full overflow-hidden animate-[badgeGlow_4s_ease-in-out_1.2s_infinite]" style={{ background: 'rgba(217,179,106,.10)', border: '1px solid rgba(217,179,106,.4)' }}>
              <span className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(110deg,transparent 40%,rgba(217,179,106,.35) 50%,transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmerSweep 3.2s ease-in-out 1.5s infinite' }} />
              <span className="w-[7px] h-[7px] rounded-full bg-[#D9B36A] flex-shrink-0" />
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase whitespace-nowrap text-[#D9B36A]">AI Automation Agency</span>
            </div>

            <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,62px)] leading-[1.08] text-[#F5F0E8] tracking-[-0.025em] text-balance" style={{ fontWeight: 600 }}>
              We automate the work{' '}
              <span style={{ color: '#2BD483' }}>
                you shouldn&apos;t be{' '}
                <span className="relative inline-block">
                  doing
                  <span className="absolute left-0 right-0 bottom-[2px] h-[4px] rounded-[2px] bg-[#D9B36A]" style={{ transformOrigin: 'left' }} />
                </span>
              </span>
            </h1>

            <p className="m-0 text-[19px] leading-[1.65] max-w-[460px]" style={{ color: 'rgba(245,240,232,.64)', fontFamily: "'Instrument Sans', sans-serif", fontWeight: 400 }}>
              AI-powered automations for US small businesses — built in 7 days, zero coding required on your end.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact" className="cta-sweep inline-flex items-center gap-2.5 text-[15.5px] font-semibold rounded-[11px] px-7 py-3.5 whitespace-nowrap no-underline" style={{ color: '#0A120E', background: '#2BD483', boxShadow: '0 14px 34px rgba(43,212,131,.28)' }}>
                Get a Custom Quote <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center text-[15.5px] font-semibold rounded-[11px] px-6 py-3 whitespace-nowrap no-underline" style={{ color: '#F5F0E8', border: '1px solid rgba(245,240,232,.25)', background: 'transparent' }}>
                Book a Free Call
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {['No long contracts', 'Results in 7 days', '30-day support'].map((item) => (
                <span key={item} className="flex items-center gap-[7px] text-[14px] font-medium whitespace-nowrap" style={{ color: 'rgba(245,240,232,.55)', fontFamily: "'Instrument Sans', sans-serif" }}>
                  <span style={{ color: '#2BD483', fontWeight: 700 }}>✓</span>{item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemV} className="relative mt-12 lg:mt-0 min-w-0">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.4 }}>
              <div className="absolute -top-[15px] -right-[10px] z-10 flex items-center gap-2 rounded-full px-4 py-2" style={{ background: '#D9B36A', boxShadow: '0 16px 40px rgba(0,0,0,.4)' }}>
                <span className="text-[12.5px] font-heading font-bold whitespace-nowrap" style={{ color: '#0A120E', letterSpacing: '.02em' }}>Built in 7 days</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '22px', padding: '10px', boxShadow: '0 44px 100px rgba(0,0,0,.5)' }}>
                <div style={{ background: '#FDFBF6', borderRadius: '15px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: 'linear-gradient(180deg,#12261C,#0E2018)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#E5734B' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#E9C46A' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#2BD483' }} />
                    <span style={{ marginLeft: '8px', flex: '1', minWidth: 0, display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '999px', padding: '5px 12px', font: '500 11px ui-monospace,monospace', color: 'rgba(245,240,232,.5)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <Logo size={12} />app.codeoutfitters.ai/live
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '15px 18px', borderBottom: '1px solid #EDE6D8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Logo size={22} />
                      <span style={{ font: '600 14.5px "Space Grotesk",sans-serif', color: '#0A120E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>Automation Engine</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', font: '600 11.5px "Instrument Sans",sans-serif', color: '#128A54', background: '#EAF6EF', borderRadius: '999px', padding: '5px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: '#2BD483' }} />Running
                      </span>
                    </div>
                    <span style={{ font: '600 12px ui-monospace,monospace', color: '#8A857B', whiteSpace: 'nowrap', flexShrink: 0 }}>1,284 hrs saved</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', padding: '10px 14px 0' }}>
                    {['WhatsApp', 'Email', 'Support'].map((label, i) => (
                      <button key={label} onClick={() => setTab(i)}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', border: 'none', cursor: 'pointer', font: `600 ${tab === i ? '12.5' : '12'}px "Instrument Sans",sans-serif`, padding: tab === i ? '7px 13px' : '6px 11px', borderRadius: '8px', background: tab === i ? '#0E2A1D' : 'transparent', color: tab === i ? '#F5F0E8' : '#8A857B', transition: 'all .15s ease' }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {tab === 0 && tabContent(0, 'wa', <ActiveChatMessages />)}
                    {tab === 1 && tabContent(1, 'em', <div style={{ minHeight: '252px', padding: '22px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '18px' }}><EmailFlow /></div>)}
                    {tab === 2 && tabContent(2, 'sp', <div style={{ position: 'relative', minHeight: '252px', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'radial-gradient(120% 100% at 50% 0%, rgba(23,160,99,.10), transparent 60%), linear-gradient(180deg, #0D1C15, #0A1712)' }}><SupportConsole /></div>)}
                  </AnimatePresence>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', padding: '13px 18px', background: '#F4EEE2', borderTop: '1px solid #EDE6D8' }}>
                    <span style={{ font: '500 12px "Instrument Sans",sans-serif', color: '#68705F' }}>Today</span>
                    <span style={{ font: '600 12px ui-monospace,monospace', color: '#128A54', whiteSpace: 'nowrap' }}>312 tasks automated</span>
                    <span style={{ font: '600 12px ui-monospace,monospace', color: '#B08A3E', whiteSpace: 'nowrap' }}>$0 payroll spent</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function ActiveChatMessages() {
  const [t, setT] = useState(0)
  useEffect(() => { const i = setInterval(() => setT((p) => (p >= 13 ? 0 : p + 0.1)), 100); return () => clearInterval(i) }, [])
  const b = (align: string, style: Record<string, string>, children: React.ReactNode) => <div style={{ alignSelf: align === 'l' ? 'flex-start' : align === 'r' ? 'flex-end' : 'center', ...style }}>{children}</div>
  const dots = (offset: number) => (
    <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '4px', background: '#DCF0E5', borderRadius: '10px', padding: '9px 11px', marginTop: '4px' }}>
      {[0, 0.15, 0.3].map((d) => <span key={d} style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#128A54', opacity: Math.sin((t - offset + d) * 10) > 0 ? 1 : 0.25 }} />)}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '252px', padding: '10px 12px', position: 'relative' }}>
      <div style={{ alignSelf: 'flex-start', maxWidth: '86%', background: '#fff', borderRadius: '11px 11px 11px 3px', padding: '8px 11px', font: '400 12.5px/1.45 "Instrument Sans",sans-serif', color: '#26312A', boxShadow: '0 1px 3px rgba(0,0,0,.08)', opacity: 1 }}>
        Hi! Is the 2-bed on Maple St still available? Can I view it this week?{' '}
        <span style={{ font: '600 9px "Instrument Sans",sans-serif', color: t >= 0.8 ? '#2D9CDB' : '#9AA79E', transition: 'color .2s' }}>✓✓</span>
      </div>
      {t >= 1.5 && dots(1.5)}
      {t >= 2.2 && <div style={{ alignSelf: 'flex-end', maxWidth: '86%', background: '#DCF0E5', borderRadius: '11px 11px 3px 11px', padding: '8px 11px', font: '400 12.5px/1.45 "Instrument Sans",sans-serif', color: '#14532D', marginTop: '4px' }}>It is! I can book you a private viewing this week — which day suits you best?</div>}
      {t >= 4.5 && <div style={{ alignSelf: 'flex-start', maxWidth: '86%', background: '#fff', borderRadius: '11px 11px 11px 3px', padding: '8px 11px', font: '400 12.5px/1.45 "Instrument Sans",sans-serif', color: '#26312A', boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginTop: '4px' }}>Thursday afternoon works best.</div>}
      {t >= 5.8 && dots(5.8)}
      {t >= 6.5 && <div style={{ alignSelf: 'flex-end', width: '86%', background: 'linear-gradient(180deg,#fff,#FBF8F1)', borderLeft: '3px solid #D9B36A', borderRadius: '10px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 6px 16px rgba(0,0,0,.12)', marginTop: '4px' }}>
        <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 20 20" fill="none">
          <rect x="1" y="3" width="18" height="14" rx="3" stroke="#17A063" strokeWidth="1.5" fill="#EAF6EF" />
          <path d="M6 10l3 3 5-5" stroke="#17A063" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
          <span style={{ font: '700 11.5px "Instrument Sans",sans-serif', color: '#0A120E' }}>Viewing booked — Thu 4:00 PM</span>
          <span style={{ font: '400 10.5px "Instrument Sans",sans-serif', color: '#8A857B' }}>12 Maple St · calendar invites sent to both sides</span>
        </div>
      </div>}
      {t >= 8.5 && <div style={{ alignSelf: 'center', font: '600 10px "Instrument Sans",sans-serif', color: '#128A54', background: '#EAF6EF', border: '1px solid rgba(18,138,84,.25)', borderRadius: '999px', padding: '4px 10px', marginTop: '4px' }}>Handled end-to-end in 26 seconds — no human needed</div>}
      {t >= 10 && <span style={{ position: 'absolute', top: '10px', right: '12px', font: '700 10px "Space Grotesk",sans-serif', color: '#0A120E', background: 'linear-gradient(160deg,#E9C783,#D9B36A)', borderRadius: '999px', padding: '5px 10px', boxShadow: '0 6px 16px rgba(217,179,106,.5)' }}>★ Lead qualified · 9/10</span>}
    </div>
  )
}

function EmailFlow() {
  return <>
    <div style={{ position: 'relative', paddingTop: '4px' }}>
      <div style={{ position: 'absolute', top: '20px', left: '9%', right: '9%', height: '4px', borderRadius: '2px', background: 'repeating-linear-gradient(90deg,#D9C9A8 0 6px,transparent 6px 12px)' }}>
        <span style={{ position: 'absolute', top: '-5px', width: '14px', height: '14px', borderRadius: '999px', background: 'linear-gradient(160deg,#E9C783,#D9B36A)', boxShadow: '0 0 18px rgba(217,179,106,.95)' }} />
      </div>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
        {[
          { num: '1', label: 'Lead captured', sub: 'Tagged & synced ✓' },
          { num: '2', label: 'Nurture sent', sub: '68% opened' },
          { num: '3', label: 'Call booked', sub: 'Booked · Tue 10:30 ✓', gold: true },
        ].map((item) => (
          <div key={item.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <span style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '999px', border: '2px solid #CFE8DA', background: '#EAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px "Space Grotesk",sans-serif', color: '#128A54', flexShrink: 0 }}>{item.num}</span>
            <span style={{ font: '600 10.5px "Instrument Sans",sans-serif', color: '#68705F', textAlign: 'center' }}>{item.label}</span>
            <span style={{ font: `${item.gold ? '700' : '600'} 9.5px/1.35 "Instrument Sans",sans-serif`, color: item.gold ? '#B08A3E' : '#128A54', background: '#fff', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: item.gold ? '0 4px 12px rgba(217,179,106,.25)' : '0 2px 8px rgba(32,24,12,.08)', border: item.gold ? '1px solid rgba(217,179,106,.5)' : 'none' }}>{item.sub}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', font: '600 12px "Instrument Sans",sans-serif', color: '#128A54' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: '#2BD483', flexShrink: 0 }} />412 emails automated this week
    </div>
  </>
}

function SupportConsole() {
  const [t, setT] = useState(0)
  useEffect(() => { const i = setInterval(() => setT((p) => (p >= 12 ? 0 : p + 0.1)), 100); return () => clearInterval(i) }, [])
  const items = [
    { text: '> visitor: "Can this integrate with my CRM?"', at: 0, c: 'rgba(245,240,232,.85)' },
    { text: '✓ intent detected: integration question · 0.19s', at: 3.5, c: '#8FE3C0' },
    { text: '→ drafting reply from knowledge base…', at: 5, c: 'rgba(245,240,232,.6)' },
    { text: '✓ replied in 2.4s — visitor satisfied', at: 8, c: '#2BD483' },
  ]
  return <>
    <span style={{ position: 'absolute', left: 0, right: 0, height: '34px', background: 'linear-gradient(180deg,transparent,rgba(43,212,131,.07),transparent)', pointerEvents: 'none', top: `${(t * 6) % 120}%` }} />
    {items.map((item, i) => (
      <div key={i} style={{ font: '500 11.5px/1.5 ui-monospace,monospace', color: item.c, opacity: t >= item.at ? 1 : 0, transform: t >= item.at ? 'translateX(0)' : 'translateX(-6px)', transition: 'opacity .2s, transform .2s' }}>{item.text}</div>
    ))}
    {t >= 9.5 && <div style={{ alignSelf: 'flex-start', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', font: '700 11.5px ui-monospace,monospace', color: '#D9B36A', backgroundColor: 'rgba(217,179,106,.14)', backgroundImage: 'linear-gradient(110deg,transparent 35%,rgba(217,179,106,.5) 50%,transparent 65%)', backgroundSize: '250% 100%', backgroundRepeat: 'no-repeat', border: '1px solid rgba(217,179,106,.45)', borderRadius: '7px', padding: '6px 10px' }}>★ QUALIFIED LEAD — routed to sales team</div>}
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
      <span style={{ font: '500 11.5px ui-monospace,monospace', color: 'rgba(245,240,232,.5)' }}>&gt;</span>
      <span style={{ display: 'inline-block', width: '8px', height: '13px', background: '#2BD483' }} />
    </div>
  </>
}
