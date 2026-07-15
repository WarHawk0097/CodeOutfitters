'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Mail, Bot, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useMotionMode } from '@/components/motion-mode-provider'

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
      <span style={{ width: '40px', height: '1px', background: '#D9B36A', flexShrink: 0 }} />
      <span style={{ font: '700 11.5px "Instrument Sans",sans-serif', letterSpacing: '.18em', color: '#D9B36A', textTransform: 'uppercase' }}>
        {text}
      </span>
      <span style={{ width: '40px', height: '1px', background: '#D9B36A', flexShrink: 0 }} />
    </div>
  )
}

function LivePill() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        font: '600 10.5px "Instrument Sans",sans-serif',
        color: '#2BD483',
        background: 'rgba(43,212,131,.10)',
        border: '1px solid rgba(43,212,131,.25)',
        borderRadius: '999px',
        padding: '4px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#2BD483' }} />
      Live in 7 days
    </span>
  )
}

function ChatDemo() {
  const { reduced } = useMotionMode()
  const [t, setT] = useState(12)
  useEffect(() => {
    if (reduced) { setT(12); return }
    setT(12)
    const i = setInterval(() => setT(12), 12000)
    return () => clearInterval(i)
  }, [reduced])

  const msg = (align: 'start' | 'end', style: Record<string, string>, children: React.ReactNode, showAt: number) =>
    t >= showAt ? (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          alignSelf: align === 'start' ? 'flex-start' : 'flex-end',
          maxWidth: '88%',
          borderRadius: align === 'start' ? '10px 10px 10px 3px' : '10px 10px 3px 10px',
          padding: '7px 10px',
          font: '400 11.5px/1.4 "Instrument Sans",sans-serif',
          ...style,
        }}
      >
        {children}
      </motion.div>
    ) : null

  const dots = (showAt: number) =>
    t >= showAt ? (
      <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '3px', padding: '6px 0' }}>
        {[0, 0.12, 0.24].map((d) => (
          <span
            key={d}
            style={{
              width: '5px', height: '5px', borderRadius: '999px', background: '#128A54',
              opacity: Math.sin((t - showAt + d) * 14) > 0 ? 1 : 0.2,
            }}
          />
        ))}
      </div>
    ) : null

  return (
    <div
      style={{
      display: 'flex', flexDirection: 'column', minHeight: '380px', padding: '16px',
        background: 'rgba(10,18,14,.03)', borderRadius: '14px',
        border: '1px solid rgba(13,58,49,.10)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(13,58,49,.08)' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '999px', background: '#2BD483', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={12} color="#0A120E" />
        </div>
        <span style={{ font: '600 11px "Instrument Sans",sans-serif', color: '#0A120E' }}>WhatsApp AI</span>
        <span style={{ marginLeft: 'auto', font: '500 9px "Instrument Sans",sans-serif', color: '#128A54', background: '#EAF6EF', borderRadius: '999px', padding: '2px 7px' }}>Online</span>
      </div>

      {msg('start', { background: '#fff', color: '#26312A', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }, 'Hi! Is the 2-bed on Maple St still available? Can I view it this week?', 0)}
      {dots(1.2)}
      {msg('end', { background: '#DCF0E5', color: '#14532D' }, 'It is! I can book you a private viewing this week — which day suits you best?', 2)}
      {msg('start', { background: '#fff', color: '#26312A', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }, 'Thursday afternoon works best.', 3.5)}
      {dots(4.5)}
      {msg('end', {
        background: 'linear-gradient(180deg,#fff,#FBF8F1)',
        borderLeft: '2.5px solid #D9B36A',
        borderRadius: '10px',
        padding: '9px 11px',
        boxShadow: '0 4px 12px rgba(0,0,0,.1)',
      }, (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="3" width="18" height="14" rx="3" stroke="#17A063" strokeWidth="1.5" fill="#EAF6EF" />
            <path d="M6 10l3 3 5-5" stroke="#17A063" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div style={{ font: '700 10.5px "Instrument Sans",sans-serif', color: '#0A120E' }}>Viewing booked — Thu 4:00 PM</div>
            <div style={{ font: '400 9.5px "Instrument Sans",sans-serif', color: '#8A857B' }}>12 Maple St · calendar invites sent to both sides</div>
          </div>
        </div>
      ), 6)}
      {t >= 8 && (
        <div style={{ alignSelf: 'center', font: '600 9.5px "Instrument Sans",sans-serif', color: '#128A54', background: '#EAF6EF', border: '1px solid rgba(18,138,84,.25)', borderRadius: '999px', padding: '4px 10px', marginTop: '4px' }}>
          Handled end-to-end in 26 seconds — no human needed
        </div>
      )}
      {t >= 9.5 && (
        <span style={{ position: 'absolute', top: '10px', right: '12px', font: '700 10px "Space Grotesk",sans-serif', color: '#0A120E', background: 'linear-gradient(160deg,#E9C783,#D9B36A)', borderRadius: '999px', padding: '5px 10px', boxShadow: '0 6px 16px rgba(217,179,106,.5)' }}>
          ★ Lead qualified · 9/10
        </span>
      )}
    </div>
  )
}

function EmailFlowDemo() {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 14px',
        background: 'rgba(10,18,14,.03)', borderRadius: '14px',
        border: '1px solid rgba(13,58,49,.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(13,58,49,.08)' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '9px', background: '#D9B36A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mail size={12} color="#0A120E" />
        </div>
        <span style={{ font: '600 11px "Instrument Sans",sans-serif', color: '#0A120E' }}>Email Workflow</span>
      </div>

      <div style={{ position: 'relative', paddingTop: '4px' }}>
        <div style={{ position: 'absolute', top: '16px', left: '8%', right: '8%', height: '3px', borderRadius: '2px', background: 'repeating-linear-gradient(90deg,#D9C9A8 0 5px,transparent 5px 10px)' }}>
          <motion.span
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-5px', width: '12px', height: '12px', borderRadius: '999px', background: 'linear-gradient(160deg,#E9C783,#D9B36A)' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginTop: '20px' }}>
          {[
            { num: '1', label: 'Lead captured', sub: 'Tagged ✓' },
            { num: '2', label: 'Nurture sent', sub: '68% opened' },
            { num: '3', label: 'Call booked', sub: 'Tue 10:30', gold: true },
          ].map((item) => (
            <div key={item.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '30px', height: '30px', borderRadius: '999px', border: '2px solid #CFE8DA', background: '#EAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px "Space Grotesk",sans-serif', color: '#128A54' }}>{item.num}</span>
              <span style={{ font: '600 9.5px "Instrument Sans",sans-serif', color: '#68705F', textAlign: 'center' }}>{item.label}</span>
              <span style={{ font: `600 8.5px/1.3 "Instrument Sans",sans-serif`, color: item.gold ? '#B08A3E' : '#128A54', background: '#fff', borderRadius: '6px', padding: '3px 6px', textAlign: 'center', boxShadow: item.gold ? '0 2px 8px rgba(217,179,106,.2)' : 'none' }}>{item.sub}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', font: '600 10px "Instrument Sans",sans-serif', color: '#128A54', marginTop: '4px' }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#2BD483' }} />
        412 emails automated this week
      </div>
    </div>
  )
}

function SupportTerminalDemo() {
  const { reduced } = useMotionMode()
  const [t, setT] = useState(10)
  useEffect(() => {
    if (reduced) { setT(10); return }
    setT(10)
    const i = setInterval(() => setT(10), 10000)
    return () => clearInterval(i)
  }, [reduced])

  const lines = [
    { text: '> visitor: "Can this integrate with my CRM?"', at: 0, c: 'rgba(245,240,232,.85)' },
    { text: '✓ intent detected: integration question · 0.19s', at: 2.5, c: '#8FE3C0' },
    { text: '→ drafting reply from knowledge base…', at: 4, c: 'rgba(245,240,232,.6)' },
    { text: '✓ replied in 2.4s — visitor satisfied', at: 6.5, c: '#2BD483' },
  ]

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '180px', padding: '12px 14px',
        background: '#0D1C15', borderRadius: '14px',
        border: '1px solid rgba(13,58,49,.10)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: '4px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '9px', background: '#17A063', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={12} color="#0A120E" />
        </div>
        <span style={{ font: '600 11px "Instrument Sans",sans-serif', color: '#F5F0E8' }}>AI Support</span>
      </div>

      {lines.map((item, i) => (
        <div
          key={i}
          style={{
            font: '500 10.5px/1.5 ui-monospace,monospace',
            color: item.c,
            opacity: t >= item.at ? 1 : 0,
            transform: t >= item.at ? 'translateX(0)' : 'translateX(-4px)',
            transition: 'opacity .25s, transform .25s',
          }}
        >
          {item.text}
        </div>
      ))}
      {t >= 8 && (
        <div
          style={{
            alignSelf: 'flex-start',
            font: '700 10px ui-monospace,monospace',
            color: '#D9B36A',
            background: 'rgba(217,179,106,.14)',
            border: '1px solid rgba(217,179,106,.45)',
            borderRadius: '6px',
            padding: '5px 9px',
            marginTop: '4px',
          }}
        >
          ★ QUALIFIED LEAD — routed to sales
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: 'auto' }}>
        <span style={{ font: '500 10px ui-monospace,monospace', color: 'rgba(245,240,232,.4)' }}>&gt;</span>
        <span style={{ display: 'inline-block', width: '7px', height: '12px', background: '#2BD483', animation: 'blink 1s step-end infinite' }} />
      </div>
    </div>
  )
}

export function ServicesBento() {
  const sectionRef = useScrollReveal<HTMLElement>(0.08)

  return (
    <section
      ref={sectionRef}
      style={{ backgroundImage: 'radial-gradient(rgba(14,42,29,.06) 1px,transparent 1.5px)', backgroundSize: '26px 26px', backgroundColor: '#F7F2EA' }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: 'clamp(56px,8vw,92px) clamp(20px,3vw,32px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '38px' }}>
          <SectionLabel text="01 · What we build" />
          <h2
            style={{
              font: '600 clamp(32px,4.2vw,50px)/1.12 "Space Grotesk",sans-serif',
              color: '#0A120E',
              letterSpacing: '-.02em',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            Each system is custom-built for your business — <span style={{ color: '#128A54' }}>deployed in 7 days.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Featured card */}
          <div
            data-reveal
            style={{
              background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)',
              border: '1px solid rgba(13,58,49,.14)',
              borderRadius: '22px',
              overflow: 'hidden',
            }}
          >
            <div style={{ height: '4px', background: '#2BD483' }} />
            <div className="hp-svc-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.92fr) minmax(0,1.08fr)', gap: 'clamp(22px,3vw,36px)', padding: 'clamp(24px,2.8vw,34px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#68705F', textTransform: 'uppercase' }}>
                    Service 01 · Lead response
                  </span>
                  <LivePill />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'linear-gradient(135deg,#2BD483,#17A063)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={22} color="#0A120E" />
                  </div>
                  <span
                    style={{
                      font: '700 10px "Instrument Sans",sans-serif',
                      color: '#D9B36A',
                      background: 'rgba(217,179,106,.12)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    ★ Featured system
                  </span>
                </div>

                <h3 style={{ font: '600 22px/1.2 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>
                  WhatsApp Lead Automation
                </h3>
                <p style={{ font: '400 14.5px/1.6 "Instrument Sans",sans-serif', color: '#68705F', margin: 0 }}>
                  Every inbound lead gets qualified, answered, and booked in seconds — while your CRM stays in perfect sync. You never miss a sales opportunity again.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Qualifies in under 30s', 'Books to calendar', 'Syncs to CRM'].map((chip) => (
                    <span
                      key={chip}
                      style={{
                        font: '500 12px "Instrument Sans",sans-serif',
                        color: '#0A120E',
                        background: 'rgba(10,18,14,.05)',
                        border: '1px solid rgba(13,58,49,.12)',
                        borderRadius: '999px',
                        padding: '5px 13px',
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '20px', padding: '14px 0', borderTop: '1px solid rgba(13,58,49,.08)', borderBottom: '1px solid rgba(13,58,49,.08)' }}>
                  {[
                    { value: '26s', label: 'Avg first reply' },
                    { value: '24/7', label: 'Always answering' },
                    { value: '0', label: 'Leads missed' },
                  ].map((m) => (
                    <div key={m.label} style={{ textAlign: 'center' }}>
                      <div style={{ font: '700 20px/1 "Space Grotesk",sans-serif', color: '#2BD483' }}>{m.value}</div>
                      <div style={{ font: '500 10.5px "Instrument Sans",sans-serif', color: '#8A857B' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start',
                    font: '600 14px "Instrument Sans",sans-serif', color: '#2BD483',
                    textDecoration: 'none', marginTop: '4px',
                  }}
                >
                  See a live build <ArrowRight size={14} />
                </Link>
              </div>

              <div style={{ minWidth: 0 }}>
                <ChatDemo />
              </div>
            </div>
          </div>

          {/* Supporting cards */}
          <div className="hp-svc-support-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div
              data-reveal
              style={{
                background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)',
                border: '1px solid rgba(13,58,49,.14)',
                borderRadius: '22px',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '4px', background: 'linear-gradient(90deg,#D9B36A,#E9C783)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(217,179,106,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} color="#D9B36A" />
                  </div>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#68705F', textTransform: 'uppercase' }}>Service 02 · Email</span>
                </div>
                <h3 style={{ font: '600 18px/1.2 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>Email Workflow Automation</h3>
                <p style={{ font: '400 13.5px/1.6 "Instrument Sans",sans-serif', color: '#68705F', margin: 0 }}>
                  Smart sequences that nurture prospects, onboard clients, and re-engage customers automatically.
                </p>
                <EmailFlowDemo />
                <Link
                  href="/contact"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    font: '600 13px "Instrument Sans",sans-serif', color: '#D9B36A',
                    textDecoration: 'none', marginTop: '2px',
                  }}
                >
                  Learn more <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div
              data-reveal
              style={{
                background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)',
                border: '1px solid rgba(13,58,49,.14)',
                borderRadius: '22px',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '4px', background: 'linear-gradient(90deg,#17A063,#2BD483)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(23,160,99,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={18} color="#17A063" />
                  </div>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#68705F', textTransform: 'uppercase' }}>Service 03 · Support</span>
                </div>
                <h3 style={{ font: '600 18px/1.2 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>Support Chat Systems</h3>
                <p style={{ font: '400 13.5px/1.6 "Instrument Sans",sans-serif', color: '#68705F', margin: 0 }}>
                  Intelligent chatbots that answer questions, collect data, and route hot leads to your team.
                </p>
                <SupportTerminalDemo />
                <Link
                  href="/contact"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    font: '600 13px "Instrument Sans",sans-serif', color: '#17A063',
                    textDecoration: 'none', marginTop: '2px',
                  }}
                >
                  Learn more <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1 }
          50% { opacity: 0 }
        }
        @media(max-width:900px){.hp-svc-featured-grid{grid-template-columns:1fr!important}.hp-svc-support-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  )
}
