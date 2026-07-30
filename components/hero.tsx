'use client'

import { motion } from 'framer-motion'
import { useMotionMode } from '@/components/motion-mode-provider'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const HERO_EYEBROW = 'Bespoke web application development'
export const HERO_HEADLINE = 'Web applications built around how your business actually works.'
export const HERO_BODY =
  'We design and build custom platforms, portals, dashboards and workflow systems for businesses that have outgrown off-the-shelf software.'
export const HERO_PRIMARY_CTA = { label: 'Discuss application', href: '/contact' } as const
export const HERO_SECONDARY_CTA = { label: 'View selected work', href: '/case-studies' } as const

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
  const { reduced } = useMotionMode()

  return (
    <section className="hp-hero relative overflow-hidden" style={{ background: '#0A120E' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(1000px 600px at 78% -15%, rgba(23,160,99,.20), transparent 60%), radial-gradient(700px 460px at 2% 115%, rgba(217,179,106,.09), transparent 60%)' }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(880px 560px at 60% 30%, #000 25%, transparent 74%)', WebkitMaskImage: 'radial-gradient(880px 560px at 60% 30%, #000 25%, transparent 74%)' }} aria-hidden="true" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><style>{`.h1{stroke-dasharray:6 16;animation:pf1 18s linear infinite}.h2{stroke-dasharray:6 16;animation:pf2 22s linear infinite;animation-delay:-5s}.h3{stroke-dasharray:6 16;animation:pf3 25s linear infinite;animation-delay:-10s}@keyframes pf1{to{stroke-dashoffset:-320}}@keyframes pf2{to{stroke-dashoffset:-340}}@keyframes pf3{to{stroke-dashoffset:-360}}`}</style></defs>
        <path className="h1" d="M-60 140 C 300 60, 520 280, 860 200 S 1400 80, 1520 220" stroke="#2BD483" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path className="h2" d="M-60 320 C 320 260, 560 460, 900 380 S 1420 280, 1520 400" stroke="#17A063" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.4" />
        <path className="h3" d="M-60 520 C 300 460, 620 640, 940 560 S 1420 500, 1520 600" stroke="#D9B36A" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
      </svg>

      <div className="hp-hero-inner relative z-10 mx-auto w-full">
        <motion.div className="hp-hero-grid items-center" variants={cont} initial={reduced ? false : 'hidden'} animate="show">
          <motion.div variants={itemV} className="flex flex-col items-start gap-6 min-w-0">
            <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full overflow-hidden" style={{ background: 'rgba(217,179,106,.10)', border: '1px solid rgba(217,179,106,.4)' }}>
              <span className="w-[7px] h-[7px] rounded-full bg-[#D9B36A] flex-shrink-0" />
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#D9B36A]">{HERO_EYEBROW}</span>
            </div>

            <h1 className="m-0 font-heading text-[clamp(34px,4.4vw,58px)] leading-[1.08] text-[#F5F0E8] tracking-[-0.025em] text-balance" style={{ fontWeight: 600 }}>
              Web applications built around{' '}
              <span style={{ color: '#2BD483' }}>how your business actually works.</span>
            </h1>

            <p className="m-0 text-[19px] leading-[1.65] max-w-[520px]" style={{ color: 'rgba(245,240,232,.64)', fontFamily: "'Instrument Sans', sans-serif", fontWeight: 400 }}>
              {HERO_BODY}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={HERO_PRIMARY_CTA.href} className="cta-sweep inline-flex items-center gap-2.5 text-[15.5px] font-semibold rounded-[11px] px-7 py-3.5 whitespace-nowrap no-underline" style={{ color: '#0A120E', background: '#2BD483', boxShadow: '0 14px 34px rgba(43,212,131,.28)' }}>
                {HERO_PRIMARY_CTA.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href={HERO_SECONDARY_CTA.href} className="inline-flex items-center text-[15.5px] font-semibold rounded-[11px] px-6 py-3 whitespace-nowrap no-underline" style={{ color: '#F5F0E8', border: '1px solid rgba(245,240,232,.25)', background: 'transparent' }}>
                {HERO_SECONDARY_CTA.label}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {['Platforms and portals', 'Operational dashboards', 'Workflow systems'].map((item) => (
                <span key={item} className="flex items-center gap-[7px] text-[14px] font-medium whitespace-nowrap" style={{ color: 'rgba(245,240,232,.62)', fontFamily: "'Instrument Sans', sans-serif" }}>
                  <span style={{ color: '#2BD483', fontWeight: 700 }}>✓</span>{item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemV} className="relative mt-12 lg:mt-0 min-w-0">
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '22px', padding: '10px', boxShadow: '0 44px 100px rgba(0,0,0,.5)' }}>
              <div style={{ background: '#FDFBF6', borderRadius: '15px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: 'linear-gradient(180deg,#12261C,#0E2018)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#E5734B' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#E9C46A' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#2BD483' }} />
                  <span style={{ marginLeft: '8px', flex: '1', minWidth: 0, display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '999px', padding: '5px 12px', font: '500 11px ui-monospace,monospace', color: 'rgba(245,240,232,.55)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <Logo size={12} />operations workspace
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '15px 18px', borderBottom: '1px solid #EDE6D8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Logo size={22} />
                    <span style={{ font: '600 14.5px "Space Grotesk",sans-serif', color: '#0A120E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>Bespoke application</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', font: '600 11.5px "Instrument Sans",sans-serif', color: '#128A54', background: '#EAF6EF', borderRadius: '999px', padding: '5px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span className="co-pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '999px', background: '#2BD483' }} />Live
                  </span>
                </div>

                <div className="hp-hero-app">
                  <ModuleRail />
                  <RecordList />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', padding: '13px 18px', background: '#F4EEE2', borderTop: '1px solid #EDE6D8' }}>
                  <span style={{ font: '500 12px "Instrument Sans",sans-serif', color: '#5B6355' }}>Modules, roles and records</span>
                  <span style={{ font: '600 12px "Instrument Sans",sans-serif', color: '#128A54', whiteSpace: 'nowrap' }}>designed around one operation</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <style>{`
        .hp-hero-inner{max-width:1180px;padding:clamp(48px,7vw,84px) clamp(20px,3vw,32px) clamp(56px,8vw,96px)}
        .hp-hero-grid{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:clamp(32px,4vw,58px)}
        .hp-hero-app{display:grid;grid-template-columns:minmax(0,.42fr) minmax(0,1fr)}
        .hp-hero-app>ul:first-child{border-right:1px solid #EDE6D8}
        @media(max-width:900px){.hp-hero-grid{grid-template-columns:1fr}.hp-hero-grid>div:last-child{margin-top:36px}}
        @media(max-width:520px){.hp-hero-inner{padding-top:42px}.hp-hero-grid>div:first-child{gap:18px}.hp-hero-grid>div:last-child{margin-top:28px}.hp-hero-grid>div:last-child>div{transform:scale(.94);transform-origin:top center}.hp-hero-app{grid-template-columns:1fr}.hp-hero-app>ul:first-child{border-right:0;border-bottom:1px solid #EDE6D8}}
        .co-pulse-dot{animation:v3Pulse 1.8s ease-out infinite}
        html.motion-reduced .h1,html.motion-reduced .h2,html.motion-reduced .h3{animation:none!important}
        html.motion-reduced .co-pulse-dot{animation:none!important}
      `}</style>
    </section>
  )
}

const APP_MODULES = ['Intake', 'Scheduling', 'Fulfilment', 'Reporting'] as const

const APP_RECORDS = [
  { label: 'Venue onboarding', state: 'In review' as const },
  { label: 'Order #4821 packing list', state: 'Ready' as const },
  { label: 'Shift roster · week 32', state: 'Published' as const },
  { label: 'Partner portal access', state: 'Queued' as const },
]

const listV = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } } }
const rowV = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } } }

const STATE_STYLE = {
  Ready: { color: '#128A54', background: '#EAF6EF' },
  'In review': { color: '#8A5A00', background: '#FBF1DC' },
  Published: { color: '#128A54', background: '#EAF6EF' },
  Queued: { color: '#5B6355', background: '#F1EBDE' },
} as const

function ModuleRail() {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#FAF6EE' }}>
      {APP_MODULES.map((module, i) => (
        <li
          key={module}
          style={{
            display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '9px',
            font: '600 12.5px "Instrument Sans",sans-serif',
            color: i === 0 ? '#0A120E' : '#5B6355',
            background: i === 0 ? '#EAF6EF' : 'transparent',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: i === 0 ? '#17A063' : '#C9BEA8', flexShrink: 0 }} />
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{module}</span>
        </li>
      ))}
    </ul>
  )
}

function RecordList() {
  const { reduced } = useMotionMode()
  return (
    <motion.ul variants={listV} initial={reduced ? false : 'hidden'} animate="show" style={{ listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', minHeight: '212px', padding: '10px 12px' }}>
      {APP_RECORDS.map((record) => (
        <motion.li variants={rowV} key={record.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 10px', borderBottom: '1px solid #F1EBDE' }}>
          <span style={{ flex: 1, minWidth: 0, font: '500 13.5px "Instrument Sans",sans-serif', color: '#26312A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.label}</span>
          <span style={{ font: '600 11.5px "Instrument Sans",sans-serif', borderRadius: '999px', padding: '5px 11px', flexShrink: 0, ...STATE_STYLE[record.state] }}>{record.state}</span>
        </motion.li>
      ))}
    </motion.ul>
  )
}
