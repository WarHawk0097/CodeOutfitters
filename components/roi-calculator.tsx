'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCounter } from '@/hooks/useCounter'

export function ROICalculator() {
  const [employees, setEmployees] = useState(5)
  const [hoursWasted, setHoursWasted] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(25)
  const sectionRef = useScrollReveal<HTMLDivElement>()

  const weeklyLoss = employees * hoursWasted * hourlyRate
  const monthlyLoss = weeklyLoss * 4
  const yearlyLoss = monthlyLoss * 12

  const { ref: counterRef, val: annualVal } = useCounter<HTMLDivElement>(yearlyLoss, 2.2)
  const { ref: monthlyRef, val: monthlyVal } = useCounter<HTMLDivElement>(monthlyLoss, 1.8)
  const { ref: weeklyRef, val: weeklyVal } = useCounter<HTMLDivElement>(weeklyLoss, 1.4)

  return (
    <section className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1C3D32 0%, #1C1612 100%)' }}>
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(200,169,110,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} aria-hidden="true" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-[120px] opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #2A6B5A 0%, transparent 70%)' }} aria-hidden="true" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-14 md:mb-16">
          <span data-reveal className="section-label-pill" style={{ color: '#C8A96E', background: 'rgba(200,169,110,0.12)', borderColor: 'rgba(200,169,110,0.25)' }}>SAVINGS CONSOLE</span>
          <h2 data-reveal className="text-[clamp(2rem,4.5vw,3.5rem)] text-[#FAFAF7] font-extrabold mt-6 mb-4 max-w-3xl mx-auto leading-tight text-shadow-glow">
            What is manual work <br className="hidden sm:block" />
            <span className="text-gradient">costing your business?</span>
          </h2>
          <p data-reveal className="text-[rgba(250,250,247,0.55)] text-lg max-w-lg mx-auto">Adjust the sliders. See exactly what you could reclaim every month.</p>
        </div>

        <div ref={sectionRef} className="rounded-2xl p-8 lg:p-10" style={{ background: 'rgba(250,250,247,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(250,250,247,0.1)' }}>
          <div data-reveal className="rounded-2xl p-8 mb-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #C8A96E 0%, #B8975A 100%)', boxShadow: '0 8px 40px rgba(200,169,110,0.3)' }}>
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #1C1612 1px, transparent 1px)', backgroundSize: '16px 16px' }} aria-hidden="true" />
            <p className="text-[rgba(28,22,18,0.6)] font-semibold text-xs uppercase tracking-wider mb-2">Estimated annual waste</p>
            <div ref={counterRef} className="text-5xl md:text-6xl lg:text-7xl font-bold font-mono text-[#1C1612] tracking-tight">
              ${annualVal.toLocaleString()}
            </div>
            <p className="text-[rgba(28,22,18,0.5)] text-sm mt-2">that your business is losing every year to manual work</p>
          </div>

          <div className="grid grid-cols-1 gap-7 mb-10">
            {[
              { label: 'Team members doing repetitive tasks', value: employees, setValue: setEmployees, min: 1, max: 50, unit: 'people' },
              { label: 'Hours wasted per person per week', value: hoursWasted, setValue: setHoursWasted, min: 1, max: 40, unit: 'hrs/week' },
              { label: 'Average hourly rate', value: hourlyRate, setValue: setHourlyRate, min: 10, max: 150, unit: '$/hr' },
            ].map((slider) => (
              <div key={slider.label} data-reveal>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-base font-medium text-[rgba(250,250,247,0.85)]">{slider.label}</label>
                  <span className="text-base font-bold text-[#C8A96E] px-4 py-1.5 rounded-full" style={{ background: 'rgba(200,169,110,0.15)' }}>
                    {slider.value} {slider.unit}
                  </span>
                </div>
                <input type="range" min={slider.min} max={slider.max} value={slider.value}
                  onChange={(e) => slider.setValue(Number(e.target.value))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #C8A96E 0%, #C8A96E ${((slider.value - slider.min) / (slider.max - slider.min)) * 100}%, rgba(250,250,247,0.08) ${((slider.value - slider.min) / (slider.max - slider.min)) * 100}%, rgba(250,250,247,0.08) 100%)` }}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            <div data-reveal className="rounded-2xl p-6 text-center" style={{ background: 'rgba(250,250,247,0.05)', border: '1px solid rgba(250,250,247,0.1)' }}>
              <div ref={weeklyRef} className="text-3xl md:text-4xl font-bold font-mono text-[#C8A96E] mb-2">${weeklyVal.toLocaleString()}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[rgba(250,250,247,0.4)]">Lost per week</div>
            </div>
            <div data-reveal className="rounded-2xl p-6 text-center" style={{ background: 'rgba(250,250,247,0.05)', border: '1px solid rgba(250,250,247,0.1)' }}>
              <div ref={monthlyRef} className="text-3xl md:text-4xl font-bold font-mono text-[#C8A96E] mb-2">${monthlyVal.toLocaleString()}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[rgba(250,250,247,0.4)]">Lost per month</div>
            </div>
          </div>

          <div data-reveal className="rounded-2xl p-6 text-center" style={{ background: 'rgba(42,107,90,0.15)', border: '1px solid rgba(42,107,90,0.3)' }}>
            <p className="text-[rgba(250,250,247,0.55)] font-semibold text-sm mb-2 uppercase tracking-wider">With CodeOutfitters automation</p>
            <p className="text-white font-bold text-xl md:text-2xl">
              You could reclaim{' '}
              <span className="text-[#C8A96E] font-mono text-2xl md:text-3xl">
                ${monthlyLoss.toLocaleString()}/month
              </span>
              {' '}or more — and redirect that time to growth.
            </p>
          </div>

          <Link href="/contact" className="btn-primary w-full mt-6 py-4 text-base block text-center">
            Claim Free Workflow Audit
          </Link>
        </div>
      </div>
    </section>
  )
}
