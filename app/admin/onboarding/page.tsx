'use client'

import { OnboardingForm } from '@/components/admin/onboarding-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function OnboardingPage() {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>
      <OnboardingForm />
    </div>
  )
}
