'use client'

import { useState, ChangeEvent } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCounter } from '@/hooks/useCounter'

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

export function ROICalculator() {
  const [team, setTeam] = useState(5)
  const [hoursWasted, setHoursWasted] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(35)
  const sectionRef = useScrollReveal<HTMLDivElement>(0.08)

  const weeklyCost = team * hoursWasted * hourlyRate
  const monthlyCost = weeklyCost * 4.33
  const yearlyCost = monthlyCost * 12

  const { ref: yrRef, val: yrVal } = useCounter<HTMLDivElement>(yearlyCost, 2.2)
  const { ref: moRef, val: moVal } = useCounter<HTMLDivElement>(monthlyCost, 1.8)
  const { ref: wkRef, val: wkVal } = useCounter<HTMLDivElement>(weeklyCost, 1.4)

  return (
    <section
      style={{
        background: 'linear-gradient(160deg, #0E241A, #0A1C12)',
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(600px 400px at 70% 20%, rgba(43,212,131,.08), transparent 60%), radial-gradient(500px 350px at 30% 80%, rgba(217,179,106,.05), transparent 60%)',
        }}
      />

      <div ref={sectionRef} style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <SectionLabel text="03 · The math" />
          <h2
            style={{
              font: '600 clamp(26px,3.5vw,38px)/1.15 "Space Grotesk",sans-serif',
              color: '#F5F0E8',
              letterSpacing: '-.02em',
              maxWidth: '540px',
              margin: '0 auto',
            }}
          >
            What is manual work costing your business?
          </h2>
        </div>

        <div
          data-reveal
          style={{
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.10)',
            borderRadius: '22px',
            padding: '28px 30px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{ font: '600 11px "Instrument Sans",sans-serif', letterSpacing: '.16em', color: 'rgba(245,240,232,.4)', textTransform: 'uppercase' }}>
              Manual Labor Cost Calculator
            </span>
          </div>

          {/* Live output */}
          <div
            style={{
              background: 'linear-gradient(135deg, #D9B36A, #C8A96E)',
              borderRadius: '16px',
              padding: '20px 24px',
              textAlign: 'center',
              marginBottom: '28px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #0A120E 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <div style={{ font: '600 10px "Instrument Sans",sans-serif', letterSpacing: '.12em', color: 'rgba(10,18,14,.5)', textTransform: 'uppercase', marginBottom: '4px', position: 'relative' }}>
              Estimated annual waste
            </div>
            <div ref={yrRef} style={{ font: '700 clamp(36px,5vw,52px)/1 "Space Grotesk",sans-serif', color: '#0A120E', position: 'relative' }}>
              ${yrVal.toLocaleString()}
            </div>
          </div>

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginBottom: '28px' }}>
            {[
              {
                label: 'Team size',
                value: team,
                set: setTeam,
                min: 1,
                max: 20,
                unit: 'people',
              },
              {
                label: 'Hours wasted / week per person',
                value: hoursWasted,
                set: setHoursWasted,
                min: 1,
                max: 40,
                unit: 'hrs',
              },
              {
                label: 'Avg. hourly rate',
                value: hourlyRate,
                set: setHourlyRate,
                min: 15,
                max: 150,
                unit: '$/hr',
              },
            ].map((s) => {
              const pct = ((s.value - s.min) / (s.max - s.min)) * 100
              return (
                <div key={s.label} data-reveal>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ font: '500 13px "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.8)' }}>
                      {s.label}
                    </label>
                    <span
                      style={{
                        font: '700 13px "Space Grotesk",sans-serif',
                        color: '#D9B36A',
                        background: 'rgba(217,179,106,.12)',
                        borderRadius: '999px',
                        padding: '3px 12px',
                      }}
                    >
                      {s.value} {s.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={s.value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => s.set(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '999px',
                      appearance: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(to right, #2BD483 0%, #2BD483 ${pct}%, rgba(255,255,255,.08) ${pct}%, rgba(255,255,255,.08) 100%)`,
                    }}
                    className="roi-slider"
                  />
                </div>
              )
            })}
          </div>

          {/* Output grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div data-reveal style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div ref={wkRef} style={{ font: '700 24px/1 "Space Grotesk",sans-serif', color: '#D9B36A', marginBottom: '4px' }}>
                ${wkVal.toLocaleString()}
              </div>
              <div style={{ font: '500 11px "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Per week</div>
            </div>
            <div data-reveal style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div ref={moRef} style={{ font: '700 24px/1 "Space Grotesk",sans-serif', color: '#D9B36A', marginBottom: '4px' }}>
                ${moVal.toLocaleString()}
              </div>
              <div style={{ font: '500 11px "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Per month</div>
            </div>
          </div>

          <div
            data-reveal
            style={{
              background: 'rgba(43,212,131,.08)',
              border: '1px solid rgba(43,212,131,.2)',
              borderRadius: '14px',
              padding: '16px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ font: '500 12px "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.5)', marginBottom: '6px' }}>
              With CodeOutfitters automation
            </div>
            <div style={{ font: '600 16px/1.4 "Space Grotesk",sans-serif', color: '#F5F0E8' }}>
              You could reclaim{' '}
              <span style={{ color: '#2BD483' }}>
                ${monthlyCost.toLocaleString()}/month
              </span>{' '}
              or more
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #D9B36A;
          border: 3px solid #0A120E;
          cursor: pointer;
          box-shadow: 0 0 0 2px rgba(217,179,106,.3);
        }
        .roi-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #D9B36A;
          border: 3px solid #0A120E;
          cursor: pointer;
        }
      `}</style>
    </section>
  )
}
