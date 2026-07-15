'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useMotionMode } from '@/components/motion-mode-provider'
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

const cont = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }
const itemV = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } }

export function Hero() {
  const [hoursSaved, setHoursSaved] = useState(1285.8)
  const [tasksToday, setTasksToday] = useState(328)
  const { reduced } = useMotionMode()
  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => {
      setHoursSaved((v) => Math.round((v + 0.1) * 10) / 10)
      setTasksToday((v) => v + 1)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [reduced])

  return (
    <section className="hp-hero relative overflow-hidden" style={{ background: '#0A120E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(1000px 600px at 78% -15%, rgba(23,160,99,.20), transparent 60%), radial-gradient(700px 460px at 2% 115%, rgba(217,179,106,.09), transparent 60%)' }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(880px 560px at 60% 30%, #000 25%, transparent 74%)', WebkitMaskImage: 'radial-gradient(880px 560px at 60% 30%, #000 25%, transparent 74%)' }} aria-hidden="true" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><style>{`@keyframes pf1{to{stroke-dashoffset:-320}}@keyframes pf2{to{stroke-dashoffset:-340}}@keyframes pf3{to{stroke-dashoffset:-360}}.h1{stroke-dasharray:6 16;animation:pf1 18s linear infinite}.h2{stroke-dasharray:6 16;animation:pf2 22s linear infinite;animation-delay:-5s}.h3{stroke-dasharray:6 16;animation:pf3 25s linear infinite;animation-delay:-10s}@media(prefers-reduced-motion:reduce){.h1,.h2,.h3{animation:none}}`}</style></defs>
        <path className="h1" d="M-60 140 C 300 60, 520 280, 860 200 S 1400 80, 1520 220" stroke="#2BD483" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path className="h2" d="M-60 320 C 320 260, 560 460, 900 380 S 1420 280, 1520 400" stroke="#17A063" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.4" />
        <path className="h3" d="M-60 520 C 300 460, 620 640, 940 560 S 1420 500, 1520 600" stroke="#D9B36A" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
      </svg>

      <div className="hp-hero-inner relative z-10 mx-auto w-full">
        <motion.div className="hp-hero-grid items-center" variants={cont} initial={reduced ? false : 'hidden'} animate="show">
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
                    <span style={{ font: '600 12px ui-monospace,monospace', color: '#8A857B', whiteSpace: 'nowrap', flexShrink: 0 }}>{hoursSaved.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hrs saved</span>
                  </div>

                  <AutomationTaskList />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', padding: '13px 18px', background: '#F4EEE2', borderTop: '1px solid #EDE6D8' }}>
                    <span style={{ font: '500 12px "Instrument Sans",sans-serif', color: '#68705F' }}>Today</span>
                    <span style={{ font: '600 12px ui-monospace,monospace', color: '#128A54', whiteSpace: 'nowrap' }}>{tasksToday.toLocaleString('en-US')} tasks automated</span>
                    <span style={{ font: '600 12px ui-monospace,monospace', color: '#B08A3E', whiteSpace: 'nowrap' }}>$0 payroll spent</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <style>{`
        .hp-hero-inner{max-width:1180px;padding:clamp(48px,7vw,84px) clamp(20px,3vw,32px) clamp(56px,8vw,96px)}
        .hp-hero-grid{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:clamp(32px,4vw,58px)}
        @media(max-width:900px){.hp-hero-grid{grid-template-columns:1fr}.hp-hero-grid>div:last-child{margin-top:36px}}
        @media(max-width:520px){.hp-hero-inner{padding-top:42px}.hp-hero-grid>div:first-child{gap:18px}.hp-hero-grid>div:last-child{margin-top:28px}.hp-hero-grid>div:last-child>div{transform:scale(.94);transform-origin:top center}}
        .hp-task-pulse{animation:hpTaskPulse 1.6s ease-in-out infinite}@keyframes hpTaskPulse{0%,100%{opacity:1}50%{opacity:.55}}@media(prefers-reduced-motion:reduce){.hp-task-pulse{animation:none}}
      `}</style>
    </section>
  )
}

const AUTOMATION_TASKS = [
  { label: 'Route hot lead to sales', status: 'done' as const },
  { label: 'Reconcile daily invoices', status: 'processing' as const },
  { label: 'Send onboarding email #2', status: 'queued' as const },
  { label: 'Update CRM contact record', status: 'queued' as const },
]

const taskListV = { hidden: {}, show: { transition: { staggerChildren: 0.22, delayChildren: 0.5 } } }
const taskRowV = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } } }

function AutomationTaskList() {
  const { reduced } = useMotionMode()
  const dotColor = (status: string) => status === 'done' ? '#2BD483' : status === 'processing' ? '#D9B36A' : '#D5CDBC'
  return (
    <motion.ul variants={taskListV} initial={reduced ? false : 'hidden'} animate="show" style={{ listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '252px', padding: '14px 14px' }}>
      {AUTOMATION_TASKS.map((task) => (
        <motion.li variants={taskRowV} key={task.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: dotColor(task.status), flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, font: '500 12.5px "Instrument Sans",sans-serif', color: '#26312A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.label}</span>
          {task.status === 'done' && <span style={{ font: '600 10.5px "Instrument Sans",sans-serif', color: '#128A54', whiteSpace: 'nowrap' }}>Done ✓</span>}
          {task.status === 'processing' && (
            <span role="progressbar" aria-label="Reconciling daily invoices" aria-valuetext="In progress" style={{ position: 'relative', width: '46px', height: '5px', borderRadius: '3px', background: '#EDE6D8', overflow: 'hidden', flexShrink: 0 }}>
              <span className={reduced ? '' : 'hp-task-pulse'} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', borderRadius: '3px', background: '#D9B36A' }} />
            </span>
          )}
          {task.status === 'queued' && <span style={{ font: '600 10.5px "Instrument Sans",sans-serif', color: '#8A857B', whiteSpace: 'nowrap' }}>Queued</span>}
        </motion.li>
      ))}
    </motion.ul>
  )
}
