'use client'

import Link from 'next/link'
import { FileText, ChevronRight, Zap, Clock } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
          CodeOutfitters Admin
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Internal tools — client intake, proposal builder, and soon: client management
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          href="/admin/onboarding"
          className="bg-[#1C3D32] rounded-2xl border border-white/10 p-8 hover:border-white/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#2A6B5A]/20 flex items-center justify-center mb-5">
            <FileText className="w-6 h-6 text-[#C8A96E]" />
          </div>
          <h2 className="font-heading text-lg font-bold text-white mb-2 tracking-tight">
            New Client Intake
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-4">
            Fill in the post-meeting intake form. Captures prospect details, pain points, tech stack, and your internal notes. Saves to local storage and launches the AI proposal builder.
          </p>
          <span className="flex items-center gap-1 text-xs font-semibold text-[#C8A96E] group-hover:gap-2 transition-all">
            Start Intake
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <div className="bg-[#1C3D32] rounded-2xl border border-white/10 p-8 opacity-60">
          <div className="w-12 h-12 rounded-xl bg-[#C8A96E]/20 flex items-center justify-center mb-5">
            <Clock className="w-6 h-6 text-[#C8A96E]" />
          </div>
          <h2 className="font-heading text-lg font-bold text-white mb-2 tracking-tight">
            Recent Proposals
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-4">
            View and manage all generated proposals. This feature is coming soon — proposals are currently stored in your browser only.
          </p>
          <span className="text-xs font-medium text-white/30">
            Coming soon
          </span>
        </div>
      </div>

      <div className="mt-10 p-5 rounded-xl bg-[#C8A96E]/5 border border-[#C8A96E]/20">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-[#C8A96E] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white/70 text-xs font-medium">
              Tip: Complete the intake form right after your discovery call while everything is fresh. The AI proposal builder uses your notes to generate a tailored proposal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
