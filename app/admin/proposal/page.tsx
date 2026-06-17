'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { OnboardingFormData } from '@/lib/admin-types'
import { ProposalOutputView } from '@/components/admin/proposal-output'

export default function ProposalPage() {
  const [intakeData, setIntakeData] = useState<OnboardingFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('co_onboarding_data')
    if (stored) {
      try {
        setIntakeData(JSON.parse(stored) as OnboardingFormData)
      } catch {
        setIntakeData(null)
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C8A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!intakeData) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[#C8A96E]/10 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-[#C8A96E]" />
        </div>
        <h1 className="font-heading text-xl font-bold text-white mb-3 tracking-tight">
          No Intake Data Found
        </h1>
        <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
          Complete the client intake form first before building a proposal. Your data will be saved automatically.
        </p>
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-1.5 bg-[#2A6B5A] hover:bg-[#1A4A3B] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Go to Intake Form
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>
      <ProposalOutputView intakeData={intakeData} />
    </div>
  )
}
