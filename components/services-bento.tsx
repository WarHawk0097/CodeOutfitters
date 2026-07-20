'use client'

import { Mail, Bot, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '16px' }}>
      <span style={{ width: '38px', height: '2px', background: '#D9B36A', flexShrink: 0 }} />
      <span style={{ font: '700 12px "Instrument Sans",sans-serif', letterSpacing: '.18em', color: '#128A54', textTransform: 'uppercase' }}>{text}</span>
      <span style={{ width: '38px', height: '2px', background: '#D9B36A', flexShrink: 0 }} />
    </div>
  )
}

function ChatDemo() {
  return (
    <div className="co-whatsapp-demo" style={{ minHeight: '380px', background: 'linear-gradient(180deg,#EFE8D8,#E6DEC9)', display: 'flex', flexDirection: 'column', borderRadius: '22px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'linear-gradient(135deg,#0E2A1D,#0A1F15)', padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '999px', background: 'linear-gradient(160deg,#E9C783,#D9B36A)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 10.5px "Space Grotesk",sans-serif', color: '#0A120E', flexShrink: 0 }}>JM</span>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ font: '600 11.5px "Instrument Sans",sans-serif', color: '#F5F0E8', whiteSpace: 'nowrap' }}>Jordan M. · New Lead</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', font: '500 9.5px "Instrument Sans",sans-serif', color: '#2BD483' }}><span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#2BD483', animation: 'v3Pulse 1.8s ease-out infinite' }} />online</span>
          </div>
        </div>
        <span style={{ font: '700 9px "Instrument Sans",sans-serif', letterSpacing: '.08em', color: 'rgba(245,240,232,.5)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Bot active</span>
      </div>
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', padding: '16px' }}>
        <div className="co-wa-m1" style={{ alignSelf: 'flex-start', maxWidth: '86%', background: '#fff', borderRadius: '11px 11px 11px 3px', padding: '8px 11px', font: '400 12.5px/1.45 "Instrument Sans",sans-serif', color: '#26312A', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          Hi! Do you have any openings this week? I&apos;d like to book an appointment. <span className="co-wa-read" style={{ font: '600 9px "Instrument Sans",sans-serif', marginLeft: '3px', color: '#9AA79E' }}>✓✓</span>
        </div>
        <div className="co-wa-typing1" style={{ alignSelf: 'flex-end', display: 'flex', gap: '4px', background: '#DCF0E5', borderRadius: '10px', padding: '9px 11px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#128A54', animation: 'v3Blink 1s ease-in-out infinite' }} />
          <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#128A54', animation: 'v3Blink 1s ease-in-out .2s infinite' }} />
          <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#128A54', animation: 'v3Blink 1s ease-in-out .4s infinite' }} />
        </div>
        <div className="co-wa-m2" style={{ alignSelf: 'flex-end', maxWidth: '86%', background: '#DCF0E5', borderRadius: '11px 11px 3px 11px', padding: '8px 11px', font: '400 12.5px/1.45 "Instrument Sans",sans-serif', color: '#14532D' }}>
          We do! I can get you booked in this week — which day suits you best?
        </div>
        <div className="co-wa-m3" style={{ alignSelf: 'flex-start', maxWidth: '86%', background: '#fff', borderRadius: '11px 11px 11px 3px', padding: '8px 11px', font: '400 12.5px/1.45 "Instrument Sans",sans-serif', color: '#26312A', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          Thursday afternoon works best.
        </div>
        <div className="co-wa-typing2" style={{ alignSelf: 'flex-end', display: 'flex', gap: '4px', background: '#DCF0E5', borderRadius: '10px', padding: '9px 11px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#128A54', animation: 'v3Blink 1s ease-in-out infinite' }} />
          <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#128A54', animation: 'v3Blink 1s ease-in-out .2s infinite' }} />
          <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: '#128A54', animation: 'v3Blink 1s ease-in-out .4s infinite' }} />
        </div>
        <div className="co-wa-confirm" style={{ alignSelf: 'flex-end', width: '86%', background: 'linear-gradient(180deg,#fff,#FBF8F1)', borderLeft: '3px solid #D9B36A', borderRadius: '10px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 6px 16px rgba(0,0,0,.12)' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="3" width="18" height="14" rx="3" stroke="#17A063" strokeWidth="1.5" fill="#EAF6EF" />
            <path d="M6 10l3 3 5-5" stroke="#17A063" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
            <span style={{ font: '700 11.5px "Instrument Sans",sans-serif', color: '#0A120E' }}>Appointment booked — Thu 4:00 PM</span>
            <span style={{ font: '400 10.5px "Instrument Sans",sans-serif', color: '#8A857B' }}>Calendar invites sent to both sides</span>
          </div>
        </div>
        <div className="co-wa-done" style={{ alignSelf: 'center', font: '600 10px "Instrument Sans",sans-serif', color: '#128A54', background: '#EAF6EF', border: '1px solid rgba(18,138,84,.25)', borderRadius: '999px', padding: '4px 10px' }}>
          Handled end-to-end in 26 seconds — no human needed
        </div>
      </div>
    </div>
  )
}

function EmailFlowDemo() {
  return (
    <div className="co-email-demo" style={{ flex: '1 1 auto', background: 'linear-gradient(180deg,#F6F0E4,#EFE6D2)', padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '22px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid rgba(176,138,62,.18)' }}>
        <span style={{ font: '700 10px ui-monospace,monospace', color: '#8A857B', letterSpacing: '.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>WORKFLOW · lead-nurture-v2</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', font: '700 10px ui-monospace,monospace', color: '#128A54', background: 'rgba(23,160,99,.1)', borderRadius: '999px', padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span className="co-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#2BD483' }} />412 sent this week
        </span>
      </div>
      <div style={{ position: 'relative', paddingTop: '4px' }}>
        <div style={{ position: 'absolute', top: '20px', left: '9%', right: '9%', height: '4px', borderRadius: '2px' }}>
          <div className="co-eflow" style={{ position: 'absolute', inset: 0, borderRadius: '2px', background: 'repeating-linear-gradient(90deg,#D9C9A8 0 6px,transparent 6px 12px)' }} />
          <span className="co-eorb" style={{ position: 'absolute', top: '-5px', width: '14px', height: '14px', borderRadius: '999px', background: 'linear-gradient(160deg,#E9C783,#D9B36A)', boxShadow: '0 0 18px rgba(217,179,106,.95)' }} />
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <span className="co-en1" style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '999px', border: '2px solid #CFE8DA', background: '#EAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px "Space Grotesk",sans-serif', color: '#128A54', flexShrink: 0 }}>
              1<span className="co-er1" style={{ position: 'absolute', inset: '-7px', borderRadius: '999px', border: '2px solid #17A063', opacity: 0 }} />
            </span>
            <span style={{ font: '600 10.5px "Instrument Sans",sans-serif', color: '#68705F', textAlign: 'center' }}>Lead captured</span>
            <span className="co-ec1" style={{ font: '600 9.5px/1.35 "Instrument Sans",sans-serif', color: '#128A54', background: '#fff', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(32,24,12,.08)' }}>Tagged &amp; synced to CRM ✓</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <span className="co-en2" style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '999px', border: '2px solid #CFE8DA', background: '#EAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px "Space Grotesk",sans-serif', color: '#128A54', flexShrink: 0 }}>
              2<span className="co-er2" style={{ position: 'absolute', inset: '-7px', borderRadius: '999px', border: '2px solid #17A063', opacity: 0 }} />
            </span>
            <span style={{ font: '600 10.5px "Instrument Sans",sans-serif', color: '#68705F', textAlign: 'center' }}>Nurture sequence</span>
            <span className="co-ec2" style={{ font: '600 9.5px/1.35 "Instrument Sans",sans-serif', color: '#128A54', background: '#fff', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(32,24,12,.08)' }}>Email 2 sent · 68% opened</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <span className="co-en3" style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '999px', border: '2px solid #CFE8DA', background: '#EAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px "Space Grotesk",sans-serif', color: '#128A54', flexShrink: 0 }}>
              3<span className="co-er3" style={{ position: 'absolute', inset: '-7px', borderRadius: '999px', border: '2px solid #17A063', opacity: 0 }} />
            </span>
            <span style={{ font: '600 10.5px "Instrument Sans",sans-serif', color: '#68705F', textAlign: 'center' }}>Call booked</span>
            <span className="co-ec3" style={{ font: '700 9.5px/1.35 "Instrument Sans",sans-serif', color: '#B08A3E', background: '#fff', border: '1px solid rgba(217,179,106,.5)', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(217,179,106,.25)' }}>Booked · Tue 10:30 ✓</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SupportTerminalDemo() {
  return (
    <div className="co-terminal-demo" style={{ flex: '1 1 auto', background: 'radial-gradient(120% 100% at 50% 0%,rgba(23,160,99,.10),transparent 60%),linear-gradient(180deg,#0D1C15,#0A1712)', padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px', borderRadius: '22px', overflow: 'hidden', position: 'relative' }}>
      <span className="co-cscan" style={{ position: 'absolute', left: 0, right: 0, height: '34px', background: 'linear-gradient(180deg,transparent,rgba(43,212,131,.07),transparent)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,.09)' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#E5734B' }} />
        <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#D9B36A' }} />
        <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#2BD483' }} />
        <span style={{ font: '500 10px ui-monospace,monospace', color: 'rgba(245,240,232,.45)', marginLeft: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>hermes@codeoutfitters — live session</span>
      </div>
      <div className="co-cl1" style={{ font: '500 11.5px/1.5 ui-monospace,monospace', color: 'rgba(245,240,232,.85)', maxWidth: '100%', overflow: 'hidden' }}>
        <span style={{ display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap', verticalAlign: 'bottom', maxWidth: '100%' }}>&gt; visitor: &ldquo;Do you install on weekends?&rdquo;</span>
      </div>
      <div className="co-cl2" style={{ font: '500 11.5px/1.5 ui-monospace,monospace', color: '#8FE3C0' }}>✓ intent detected: scheduling · 0.21s</div>
      <div className="co-cl3" style={{ font: '500 11.5px/1.5 ui-monospace,monospace', color: 'rgba(245,240,232,.6)', maxWidth: '100%', overflow: 'hidden' }}>
        <span style={{ display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap', verticalAlign: 'bottom', maxWidth: '100%' }}>→ drafting reply from knowledge base&hellip;</span>
      </div>
      <div className="co-cl4" style={{ font: '500 11.5px/1.5 ui-monospace,monospace', color: '#2BD483' }}>✓ replied in 3.8s — visitor satisfied</div>
      <div className="co-cl5" style={{ alignSelf: 'flex-start', font: '700 11.5px ui-monospace,monospace', color: '#D9B36A', background: 'rgba(217,179,106,.14)', border: '1px solid rgba(217,179,106,.45)', borderRadius: '7px', padding: '6px 10px' }}>
        <span className="co-cflash" style={{ position: 'absolute', inset: 0, borderRadius: '7px', backgroundImage: 'linear-gradient(110deg,transparent 35%,rgba(217,179,106,.5) 50%,transparent 65%)', backgroundSize: '250% 100%', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />
        ★ HOT LEAD — routed to sales team
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
        <span style={{ font: '500 11.5px ui-monospace,monospace', color: 'rgba(245,240,232,.5)' }}>&gt;</span>
        <span style={{ display: 'inline-block', width: '8px', height: '13px', background: '#2BD483', animation: 'coCursorBlink 1.1s steps(2) infinite' }} />
      </div>
    </div>
  )
}

export function ServicesBento() {
  const sectionRef = useScrollReveal<HTMLElement>(0.08)

  return (
    <section ref={sectionRef} style={{ backgroundImage: 'radial-gradient(rgba(14,42,29,.06) 1px,transparent 1.5px)', backgroundSize: '26px 26px', backgroundColor: '#F7F2EA' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: 'clamp(56px,8vw,92px) clamp(20px,3vw,32px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '38px' }}>
          <SectionLabel text="01 · What we build" />
          <h2 style={{ font: '600 clamp(32px,4.2vw,50px)/1.12 "Space Grotesk",sans-serif', color: '#0A120E', letterSpacing: '-.02em', maxWidth: '700px', margin: '0 auto' }}>
            Each system is custom-built for your business — <span style={{ color: '#128A54' }}>deployed in 7 days.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div data-reveal style={{ background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)', border: '1px solid rgba(13,58,49,.14)', borderRadius: '22px', overflow: 'hidden' }}>
            <div style={{ height: '4px', background: '#17A063' }} />
            <div className="hp-svc-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.92fr) minmax(0,1.08fr)', gap: 'clamp(22px,3vw,36px)', padding: 'clamp(24px,2.8vw,34px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#128A54', textTransform: 'uppercase' }}>Service 01 · Lead response</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.09em', color: '#128A54', background: '#EAF6EF', border: '1px solid rgba(18,138,84,.22)', borderRadius: '999px', padding: '5px 11px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <span className="co-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#2BD483' }} />Live automation
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(160deg,#EAF6EF,#DCF0E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 24px rgba(18,32,27,.14), inset 0 1px 0 rgba(255,255,255,.7)' }}>
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#0A120E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', color: '#B08A3E', background: '#F8EFDD', border: '1px solid rgba(217,179,106,.35)', borderRadius: '999px', padding: '5px 11px', letterSpacing: '.09em', textTransform: 'uppercase' }}>★ Featured system</span>
                </div>
                <h3 style={{ font: '600 22px/1.2 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>WhatsApp Lead Automation</h3>
                <p style={{ font: '400 14.5px/1.6 "Instrument Sans",sans-serif', color: '#68705F', margin: 0 }}>Every inbound lead gets qualified, answered, and booked in seconds — while your CRM stays in perfect sync. You never miss a sales opportunity again.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Qualifies in under 30s', 'Books to calendar', 'Syncs to CRM'].map(c => <span key={c} style={{ font: '600 11.5px "Instrument Sans",sans-serif', color: '#128A54', background: '#EAF6EF', border: '1px solid rgba(18,138,84,.18)', borderRadius: '999px', padding: '5px 12px' }}>{c}</span>)}
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, background: 'linear-gradient(165deg,#0E2A1D,#0A1F15)', borderRadius: '14px', padding: '4px 0', marginTop: '2px' }}>
                  {[{ value: '26s', label: 'Avg first reply' }, { value: '24/7', label: 'Always answering' }, { value: '0', label: 'Leads missed' }].map((m, i) => (
                    <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'center', padding: '12px 8px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.09)' : 'none' }}>
                      <div style={{ font: '700 21px/1 "Space Grotesk",sans-serif', letterSpacing: '-.01em', color: '#2BD483' }}>{m.value}</div>
                      <div style={{ font: '600 9.5px/1.3 "Instrument Sans",sans-serif', letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,.55)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', font: '600 13.5px "Instrument Sans",sans-serif', color: '#128A54' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '999px', background: '#EAF6EF', color: '#17A063', font: '700 12px sans-serif', flexShrink: 0 }}>✓</span>
                  <span>Never miss a lead again</span>
                  <Link href="/contact" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', font: '600 14px "Instrument Sans",sans-serif', color: '#0E2A1D', textDecoration: 'none', borderBottom: '2px solid #D9B36A', paddingBottom: '3px', whiteSpace: 'nowrap' }}>See a live build <ArrowRight size={14} /></Link>
                </div>
              </div>
              <div style={{ minWidth: 0 }}><ChatDemo /></div>
            </div>
          </div>

          <div className="hp-svc-support-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div data-reveal style={{ background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)', border: '1px solid rgba(13,58,49,.14)', borderRadius: '22px', overflow: 'hidden' }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg,#D9B36A,#E9C783)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(217,179,106,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mail size={18} color="#D9B36A" /></div>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#68705F', textTransform: 'uppercase' }}>Service 02 · Email</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.09em', color: '#B08A3E', background: '#F8EFDD', border: '1px solid rgba(217,179,106,.35)', borderRadius: '999px', padding: '5px 11px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <span className="co-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#D9B36A' }} />Live automation
                  </span>
                </div>
                <h3 style={{ font: '600 18px/1.2 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>Email Workflow Automation</h3>
                <p style={{ font: '400 13.5px/1.6 "Instrument Sans",sans-serif', color: '#68705F', margin: 0 }}>Smart sequences that nurture prospects, onboard clients, and re-engage customers automatically.</p>
                <EmailFlowDemo />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', font: '600 13px "Instrument Sans",sans-serif', color: '#128A54' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '999px', background: '#F8EFDD', color: '#B08A3E', font: '700 11px sans-serif', flexShrink: 0 }}>✓</span>
                  <span>Turn one-time buyers into repeat clients</span>
                  <Link href="/contact" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', font: '600 13.5px "Instrument Sans",sans-serif', color: '#0E2A1D', textDecoration: 'none', borderBottom: '2px solid #D9B36A', paddingBottom: '3px', whiteSpace: 'nowrap' }}>Get this system <ArrowRight size={13} /></Link>
                </div>
              </div>
            </div>

            <div data-reveal style={{ background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)', border: '1px solid rgba(13,58,49,.14)', borderRadius: '22px', overflow: 'hidden' }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg,#17A063,#2BD483)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(23,160,99,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bot size={18} color="#17A063" /></div>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#68705F', textTransform: 'uppercase' }}>Service 03 · Support</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.09em', color: '#17A063', background: '#E8EDE9', border: '1px solid rgba(23,160,99,.25)', borderRadius: '999px', padding: '5px 11px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <span className="co-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#17A063' }} />Live automation
                  </span>
                </div>
                <h3 style={{ font: '600 18px/1.2 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>Support Chat Systems</h3>
                <p style={{ font: '400 13.5px/1.6 "Instrument Sans",sans-serif', color: '#68705F', margin: 0 }}>Intelligent chatbots that answer questions, collect data, and route hot leads to your team.</p>
                <SupportTerminalDemo />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', font: '600 13px "Instrument Sans",sans-serif', color: '#128A54' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '999px', background: '#E8EDE9', color: '#17A063', font: '700 11px sans-serif', flexShrink: 0 }}>✓</span>
                  <span>Your website works while you sleep</span>
                  <Link href="/contact" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', font: '600 13.5px "Instrument Sans",sans-serif', color: '#0E2A1D', textDecoration: 'none', borderBottom: '2px solid #D9B36A', paddingBottom: '3px', whiteSpace: 'nowrap' }}>Get this system <ArrowRight size={13} /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .co-pulse-dot{animation:v3Pulse 1.8s ease-out infinite}
        .co-badge-glow{animation:badgeGlow 3s ease-in-out infinite}

        /* === WhatsApp demo (13s CSS loop) === */
        .co-wa-m1,.co-wa-typing1,.co-wa-m2,.co-wa-m3,.co-wa-typing2,.co-wa-confirm,.co-wa-done,.co-wa-read{animation-duration:13s;animation-timing-function:ease;animation-iteration-count:infinite}
        .co-wa-read{animation-name:coWaRead}
        .co-wa-m1{animation-name:coWaM1}
        .co-wa-typing1{animation-name:coWaTy1}
        .co-wa-m2{animation-name:coWaM2}
        .co-wa-m3{animation-name:coWaM3}
        .co-wa-typing2{animation-name:coWaTy2}
        .co-wa-confirm{animation-name:coWaConf}
        .co-wa-done{animation-name:coWaDone}
        @keyframes coWaM1{0%,2%{opacity:0;transform:translateY(14px) scale(.86)}4.5%{opacity:1;transform:translateY(-2px) scale(1.04)}6%,90%{opacity:1;transform:translateY(0) scale(1)}95%,100%{opacity:0;transform:translateY(-8px) scale(.98)}}
        @keyframes coWaTy1{0%,9%{opacity:0}12%,23%{opacity:1}27%,100%{opacity:0}}
        @keyframes coWaM2{0%,21%{opacity:0;transform:translateY(14px) scale(.86)}23.5%{opacity:1;transform:translateY(-2px) scale(1.04)}25%,90%{opacity:1;transform:translateY(0) scale(1)}95%,100%{opacity:0;transform:translateY(-8px) scale(.98)}}
        @keyframes coWaM3{0%,33%{opacity:0;transform:translateY(14px) scale(.86)}35.5%{opacity:1;transform:translateY(-2px) scale(1.04)}37%,90%{opacity:1;transform:translateY(0) scale(1)}95%,100%{opacity:0;transform:translateY(-8px) scale(.98)}}
        @keyframes coWaTy2{0%,39%{opacity:0}42%,50%{opacity:1}53%,100%{opacity:0}}
        @keyframes coWaConf{0%,51%{opacity:0;transform:translateY(16px) scale(.8)}54%{opacity:1;transform:translateY(-3px) scale(1.06)}56%,90%{opacity:1;transform:translateY(0) scale(1)}95%,100%{opacity:0;transform:translateY(-8px) scale(.98)}}
        @keyframes coWaDone{0%,60%{opacity:0;transform:rotate(-10deg) scale(1.6)}63%{opacity:1;transform:rotate(2deg) scale(.96)}65%,100%{opacity:1;transform:rotate(0deg) scale(1)}}
        @keyframes coWaRead{0%,8%{color:#9AA79E}11%,93%{color:#2D9CDB}96%,100%{color:#9AA79E}}

        /* === Email workflow (11s CSS loop) === */
        .co-eflow{animation:coEFlow .7s linear infinite}
        .co-eorb{animation:coEOrb 11s ease-in-out infinite}
        .co-en1{animation:coEN1 11s ease-in-out infinite}
        .co-en2{animation:coEN2 11s ease-in-out infinite}
        .co-en3{animation:coEN3 11s ease-in-out infinite}
        .co-er1{animation:coER1 11s ease-out infinite}
        .co-er2{animation:coER2 11s ease-out infinite}
        .co-er3{animation:coER3 11s ease-out infinite}
        .co-ec1{animation:coEC1 11s ease-in-out infinite}
        .co-ec2{animation:coEC2 11s ease-in-out infinite}
        .co-ec3{animation:coEC3 11s ease-in-out infinite}
        @keyframes coEFlow{from{background-position:0 0}to{background-position:24px 0}}
        @keyframes coEOrb{0%{left:2%;opacity:0}5%{left:2%;opacity:1}28%{left:48%}40%{left:48%}64%{left:94%}88%{left:94%;opacity:1}94%,100%{left:94%;opacity:0}}
        @keyframes coEN1{0%,3%{background:#EAF6EF;border-color:#CFE8DA;color:#128A54;transform:scale(1)}6%,28%{background:#17A063;border-color:#17A063;color:#fff;transform:scale(1.12)}34%,100%{background:#EAF6EF;border-color:#CFE8DA;color:#128A54;transform:scale(1)}}
        @keyframes coEN2{0%,28%{background:#EAF6EF;border-color:#CFE8DA;color:#128A54;transform:scale(1)}32%,58%{background:#17A063;border-color:#17A063;color:#fff;transform:scale(1.12)}64%,100%{background:#EAF6EF;border-color:#CFE8DA;color:#128A54;transform:scale(1)}}
        @keyframes coEN3{0%,60%{background:#EAF6EF;border-color:#CFE8DA;color:#128A54;transform:scale(1)}64%,90%{background:#17A063;border-color:#17A063;color:#fff;transform:scale(1.12)}96%,100%{background:#EAF6EF;border-color:#CFE8DA;color:#128A54;transform:scale(1)}}
        @keyframes coER1{0%,4%{opacity:0;transform:scale(.4)}7%{opacity:.6;transform:scale(1.3)}14%,100%{opacity:0;transform:scale(1.9)}}
        @keyframes coER2{0%,30%{opacity:0;transform:scale(.4)}33%{opacity:.6;transform:scale(1.3)}40%,100%{opacity:0;transform:scale(1.9)}}
        @keyframes coER3{0%,62%{opacity:0;transform:scale(.4)}65%{opacity:.6;transform:scale(1.3)}72%,100%{opacity:0;transform:scale(1.9)}}
        @keyframes coEC1{0%,7%{opacity:0;transform:translateY(10px)}11%,90%{opacity:1;transform:translateY(0)}96%,100%{opacity:0;transform:translateY(0)}}
        @keyframes coEC2{0%,34%{opacity:0;transform:translateY(10px)}38%,90%{opacity:1;transform:translateY(0)}96%,100%{opacity:0;transform:translateY(0)}}
        @keyframes coEC3{0%,66%{opacity:0;transform:translateY(10px)}70%,90%{opacity:1;transform:translateY(0)}96%,100%{opacity:0;transform:translateY(0)}}

        /* === Terminal demo (12s CSS loop) === */
        .co-cscan{animation:coCScan 5s linear infinite}
        .co-cl1{animation:coCL1 12s infinite}
        .co-cl1>span{animation:coCL1Type 12s steps(41,end) infinite}
        .co-cl2{animation:coCL2 12s infinite}
        .co-cl3{animation:coCL3 12s infinite}
        .co-cl3>span{animation:coCL3Type 12s steps(37,end) infinite}
        .co-cl4{animation:coCL4 12s infinite}
        .co-cl5{animation:coCL5 12s ease infinite}
        .co-cflash{animation:coCFlash 12s linear infinite}
        @keyframes coCScan{0%{top:-14%;opacity:0}12%{opacity:.6}88%{opacity:.6}100%{top:106%;opacity:0}}
        @keyframes coCL1{0%,2%{width:0;opacity:1}14%{width:41ch}90%{width:41ch;opacity:1}95%,100%{width:41ch;opacity:0}}
        @keyframes coCL1Type{0%{width:0}14%{width:41ch}90%{width:41ch}100%{width:0}}
        @keyframes coCL2{0%,16%{opacity:0;transform:translateX(-6px)}19%,90%{opacity:1;transform:translateX(0)}95%,100%{opacity:0;transform:translateX(0)}}
        @keyframes coCL3{0%,24%{width:0;opacity:1}36%{width:37ch}90%{width:37ch;opacity:1}95%,100%{width:37ch;opacity:0}}
        @keyframes coCL3Type{0%{width:0}36%{width:37ch}90%{width:37ch}100%{width:0}}
        @keyframes coCL4{0%,40%{opacity:0;transform:translateX(-6px)}43%,90%{opacity:1;transform:translateX(0)}95%,100%{opacity:0;transform:translateX(0)}}
        @keyframes coCL5{0%,48%{opacity:0;transform:scale(.92)}51%,90%{opacity:1;transform:scale(1)}95%,100%{opacity:0;transform:scale(1)}}
        @keyframes coCFlash{0%,48%{background-position:-150% 0}62%{background-position:150% 0}100%{background-position:150% 0}}
        @keyframes coCursorBlink{0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes v3Blink{0%,100%{opacity:.25}50%{opacity:1}}

        /* === Reduced motion === */
        html.motion-reduced .co-wa-m1,html.motion-reduced .co-wa-typing1,html.motion-reduced .co-wa-m2,html.motion-reduced .co-wa-m3,html.motion-reduced .co-wa-typing2,html.motion-reduced .co-wa-confirm,html.motion-reduced .co-wa-done{animation:none!important;opacity:1!important;transform:none!important}
        html.motion-reduced .co-eflow,html.motion-reduced .co-eorb,html.motion-reduced .co-en1,html.motion-reduced .co-en2,html.motion-reduced .co-en3,html.motion-reduced .co-er1,html.motion-reduced .co-er2,html.motion-reduced .co-er3,html.motion-reduced .co-ec1,html.motion-reduced .co-ec2,html.motion-reduced .co-ec3{animation:none!important}
        html.motion-reduced .co-cscan,html.motion-reduced .co-cl1,html.motion-reduced .co-cl1>span,html.motion-reduced .co-cl2,html.motion-reduced .co-cl3,html.motion-reduced .co-cl3>span,html.motion-reduced .co-cl4,html.motion-reduced .co-cl5,html.motion-reduced .co-cflash,html.motion-reduced .co-cursor{animation:none!important;opacity:1!important;transform:none!important;background-position:150% 0!important;width:auto!important}
        html.motion-reduced .co-pulse-dot,html.motion-reduced .co-badge-glow{animation:none!important}

        @media(max-width:900px){.hp-svc-featured-grid{grid-template-columns:1fr!important}.hp-svc-support-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  )
}
