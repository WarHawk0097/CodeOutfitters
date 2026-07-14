'use client'

import { ArrowRight, ShoppingBag, HeartPulse } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

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

function SamplePill() {
  return (
    <span style={{
      font: '700 10px "Instrument Sans",sans-serif',
      color: '#D9B36A',
      background: 'rgba(217,179,106,.12)',
      borderRadius: '999px', padding: '4px 10px',
      letterSpacing: '.04em', textTransform: 'uppercase',
    }}>
      Sample project
    </span>
  )
}

function MetricRail({ metrics, thirdGold }: { metrics: { value: string; label: string }[]; thirdGold?: boolean }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${metrics.length},1fr)`,
      background: 'linear-gradient(165deg,#0E2A1D,#08160F)',
      borderRadius: '14px', overflow: 'hidden',
    }}>
      {metrics.map((m, i) => (
        <div key={m.label} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '16px 8px', textAlign: 'center',
          borderLeft: i > 0 ? '1px solid rgba(255,255,255,.08)' : 'none',
        }}>
          <div style={{
            font: '700 clamp(18px,2.2vw,26px)/1 "Space Grotesk",sans-serif',
            color: thirdGold && i === metrics.length - 1 ? '#E7C57E' : '#2BD483',
          }}>
            {m.value}
          </div>
          <div style={{
            font: '500 9.5px "Instrument Sans",sans-serif',
            color: 'rgba(245,240,232,.55)', textTransform: 'uppercase',
            letterSpacing: '.04em', marginTop: '4px',
          }}>
            {m.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CaseStudiesPreview() {
  const sectionRef = useScrollReveal<HTMLElement>(0.08)

  return (
    <section
      ref={sectionRef}
      style={{ background: '#F7F2EA', position: 'relative', overflow: 'hidden' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.035,
          backgroundImage: 'radial-gradient(circle, #0A120E 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: 'clamp(56px,8vw,92px) clamp(20px,3vw,32px)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '38px' }}>
          <SectionLabel text="04 · Real work" />
          <h2 style={{
            font: '600 clamp(32px,4.2vw,50px)/1.12 "Space Grotesk",sans-serif',
            color: '#0A120E', letterSpacing: '-.02em', maxWidth: '700px', margin: '0 auto',
          }}>
            Real Businesses, <span style={{ color: '#128A54' }}>Real Results</span>
          </h2>
          <p style={{
            font: '400 15px/1.6 "Instrument Sans",sans-serif',
            color: '#5B6355', maxWidth: '620px', margin: '12px auto 0',
          }}>
            See how businesses like yours are saving time, reducing overhead, and growing faster
            with custom automation.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Featured card */}
          <div
            data-reveal
            style={{
              background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)',
              border: '1px solid rgba(13,58,49,.14)',
              borderRadius: '22px', overflow: 'hidden',
            }}
          >
            <div style={{ height: '4px', background: '#2BD483' }} />
            <div className="hp-case-featured-grid" style={{ display: 'grid', gridTemplateColumns: '1.32fr 0.68fr', gap: '24px', padding: '28px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#5B6355', textTransform: 'uppercase' }}>
                    Case 01 · Featured
                  </span>
                  <SamplePill />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{
                        font: '500 11px "Instrument Sans",sans-serif', color: '#5B6355',
                        background: 'rgba(10,18,14,.05)', border: '1px solid rgba(13,58,49,.12)',
                        borderRadius: '999px', padding: '4px 11px',
                      }}>
                        Real Estate
                      </span>
                      <span style={{
                        font: '500 11px "Instrument Sans",sans-serif', color: '#128A54',
                        background: 'rgba(18,138,84,.10)', border: '1px solid rgba(18,138,84,.25)',
                        borderRadius: '999px', padding: '4px 11px',
                      }}>
                        WhatsApp Automation
                      </span>
                    </div>

                    <h3 style={{ font: '600 18px/1.25 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>
                      How a Real Estate Agency Doubled Lead Response Rate
                    </h3>
                    <p style={{ font: '400 13.5px/1.6 "Instrument Sans",sans-serif', color: '#5B6355', margin: 0 }}>
                      A 3-person agency was losing leads to faster competitors. We built an AI
                      WhatsApp bot that qualifies, responds, and books viewings 24/7.
                    </p>
                  </div>
                  <span style={{
                    font: '700 52px/1 "Space Grotesk",sans-serif',
                    color: '#D9B36A', opacity: 0.4, flexShrink: 0,
                  }}>
                    01
                  </span>
                </div>

                <Link
                  href="/contact"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start',
                    font: '600 13px "Instrument Sans",sans-serif', color: '#128A54',
                    textDecoration: 'none', marginTop: '2px',
                  }}
                >
                  Get a Similar System <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minWidth: 0 }}>
                <MetricRail
                  metrics={[
                    { value: '2x', label: 'Lead Response Rate' },
                    { value: '87%', label: 'Faster Follow-ups' },
                    { value: '18 hrs', label: 'Saved Per Week' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Supporting cards */}
          <div className="hp-case-support-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            {/* Case 02 */}
            <div
              data-reveal
              style={{
                background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)',
                border: '1px solid rgba(13,58,49,.14)',
                borderRadius: '22px', overflow: 'hidden',
              }}
            >
              <div style={{ height: '4px', background: 'linear-gradient(90deg,#D9B36A,#E9C783)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#5B6355', textTransform: 'uppercase' }}>
                    Case 02
                  </span>
                  <SamplePill />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg,#D9B36A,#E9C783)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <ShoppingBag size={18} color="#0A120E" />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      font: '500 10.5px "Instrument Sans",sans-serif', color: '#5B6355',
                      background: 'rgba(10,18,14,.05)', border: '1px solid rgba(13,58,49,.12)',
                      borderRadius: '999px', padding: '3px 10px',
                    }}>
                      E-commerce
                    </span>
                    <span style={{
                      font: '500 10.5px "Instrument Sans",sans-serif', color: '#128A54',
                      background: 'rgba(18,138,84,.10)', border: '1px solid rgba(18,138,84,.25)',
                      borderRadius: '999px', padding: '3px 10px',
                    }}>
                      Invoice Automation
                    </span>
                  </div>
                </div>

                <h3 style={{ font: '600 16px/1.25 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>
                  Invoice Processing Reduced from 4 Hours to 8 Minutes Daily
                </h3>
                <p style={{ font: '400 13px/1.6 "Instrument Sans",sans-serif', color: '#5B6355', margin: 0 }}>
                  An online retailer manually created invoices and reconciled orders every day.
                  Our pipeline handles 200+ invoices per day, error-free.
                </p>

                <MetricRail
                  metrics={[
                    { value: '97%', label: 'Time Saved' },
                    { value: '0', label: 'Data-entry errors' },
                    { value: '$1,200', label: 'Saved / mo' },
                  ]}
                  thirdGold
                />

                <Link
                  href="/contact"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    font: '600 13px "Instrument Sans",sans-serif', color: '#D9B36A',
                    textDecoration: 'none', marginTop: '2px',
                  }}
                >
                  Get a Similar System <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Case 03 */}
            <div
              data-reveal
              style={{
                background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)',
                border: '1px solid rgba(13,58,49,.14)',
                borderRadius: '22px', overflow: 'hidden',
              }}
            >
              <div style={{ height: '4px', background: 'linear-gradient(90deg,#17A063,#2BD483)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ font: '700 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: '#5B6355', textTransform: 'uppercase' }}>
                    Case 03
                  </span>
                  <SamplePill />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg,#17A063,#2BD483)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <HeartPulse size={18} color="#0A120E" />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      font: '500 10.5px "Instrument Sans",sans-serif', color: '#5B6355',
                      background: 'rgba(10,18,14,.05)', border: '1px solid rgba(13,58,49,.12)',
                      borderRadius: '999px', padding: '3px 10px',
                    }}>
                      Healthcare
                    </span>
                    <span style={{
                      font: '500 10.5px "Instrument Sans",sans-serif', color: '#128A54',
                      background: 'rgba(18,138,84,.10)', border: '1px solid rgba(18,138,84,.25)',
                      borderRadius: '999px', padding: '3px 10px',
                    }}>
                      Booking Automation
                    </span>
                  </div>
                </div>

                <h3 style={{ font: '600 16px/1.25 "Space Grotesk",sans-serif', color: '#0A120E', margin: 0 }}>
                  Medical Practice Cut No-Shows by 40% with Automated Booking
                </h3>
                <p style={{ font: '400 13px/1.6 "Instrument Sans",sans-serif', color: '#5B6355', margin: 0 }}>
                  A busy clinic was overwhelmed by appointment calls and losing patients to long
                  hold times. AI booking bot syncs with their calendar and sends reminders.
                </p>

                <MetricRail
                  metrics={[
                    { value: '90%', label: 'Fewer Calls' },
                    { value: '40%', label: 'Drop in No-Shows' },
                    { value: '24/7', label: 'Booking' },
                  ]}
                  thirdGold
                />

                <Link
                  href="/contact"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    font: '600 13px "Instrument Sans",sans-serif', color: '#17A063',
                    textDecoration: 'none', marginTop: '2px',
                  }}
                >
                  Get a Similar System <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:820px){.hp-case-support-grid,.hp-case-featured-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}
