'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function ROICalculator() {
  const [employees, setEmployees] = useState(5)
  const [hoursWasted, setHoursWasted] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(25)

  const weeklyLoss = employees * hoursWasted * hourlyRate
  const monthlyLoss = weeklyLoss * 4
  const yearlyLoss = monthlyLoss * 12

  return (
    <section className="py-16 md:py-20 px-5 md:px-8" style={{ background: 'linear-gradient(160deg, #1C1612 0%, #1C3D32 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-10"
        >
          <span className="text-xs font-body font-semibold tracking-[0.15em] uppercase text-[#C8A96E] mb-4 block">THE MATH</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAF7] mb-6">
            How much is manual work costing you?
          </h2>
          <p className="text-[rgba(250,250,247,0.6)] text-lg mt-8">Move the sliders to see your exact savings</p>
        </motion.div>

        <div className="bg-[#FAFAF7] border border-[rgba(42,107,90,0.15)] rounded-xl p-6 lg:p-8">
          <div data-aos="fade-right" className="grid grid-cols-1 gap-8 mb-10">
            {[
              { label: 'Team members doing repetitive tasks',
                value: employees, setValue: setEmployees,
                min: 1, max: 50, unit: 'people' },
              { label: 'Hours wasted per person per week',
                value: hoursWasted, setValue: setHoursWasted,
                min: 1, max: 40, unit: 'hrs/week' },
              { label: 'Average hourly rate',
                value: hourlyRate, setValue: setHourlyRate,
                min: 10, max: 150, unit: '$/hr' },
            ].map((slider) => (
              <div key={slider.label}>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-[#1C1612]">
                    {slider.label}
                  </label>
                  <span className="text-sm font-bold text-[#2A6B5A] bg-[#E8F5F1] px-3 py-1 rounded-full">
                    {slider.value} {slider.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={slider.value}
                  onChange={(e) => slider.setValue(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2A6B5A 0%,
                    #2A6B5A ${((slider.value - slider.min) /
                    (slider.max - slider.min)) * 100}%,
                    #E8F5F1 ${((slider.value - slider.min) /
                    (slider.max - slider.min)) * 100}%, #E8F5F1 100%)`
                  }}
                />
              </div>
            ))}
          </div>

          <div data-aos="fade-left" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Lost per week', value: `$${weeklyLoss.toLocaleString()}` },
              { label: 'Lost per month', value: `$${monthlyLoss.toLocaleString()}` },
              { label: 'Lost per year', value: `$${yearlyLoss.toLocaleString()}`, highlight: true },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-5 text-center ${stat.highlight ? 'text-white' : 'bg-white border border-[rgba(42,107,90,0.12)]'}`}
                style={stat.highlight ? { background: 'linear-gradient(135deg, #2A6B5A 0%, #1A4A3B 100%)' } : {}}>
                <div className={`text-2xl font-bold font-mono mb-1 ${stat.highlight ? 'text-white' : 'text-[#2A6B5A]'}`}>
                  {stat.value}
                </div>
                <div className={`text-xs font-medium uppercase tracking-wide ${stat.highlight ? 'text-white/80' : 'text-[#6B6155]'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5 text-center border border-[rgba(200,169,110,0.3)]" style={{ background: 'rgba(200,169,110,0.08)' }}>
            <p className="text-[#C8A96E] font-semibold text-sm mb-1">
              With CodeOutfitters automation
            </p>
            <p className="text-[#1C1612] font-bold text-lg">
              You could save{' '}
              <span className="text-[#2A6B5A] font-mono">
                ${monthlyLoss.toLocaleString()}/month
              </span>
              {' '}or more.
            </p>
          </div>

          <Link
            href="/pricing"
            className="btn-primary w-full mt-6 py-4 text-base block text-center"
          >
            Get a Custom Quote
          </Link>
        </div>
      </div>
    </section>
  )
}
