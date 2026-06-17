'use client'

import type { ProposalOutput } from '@/lib/admin-types'

interface SectionCardProps {
  title: string
  children: React.ReactNode
  onCopy?: () => void
}

function SectionCard({ title, children, onCopy }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[rgba(42,107,90,0.12)] shadow-[0_2px_12px_rgba(42,107,90,0.06)] overflow-hidden print:border print:shadow-none">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(42,107,90,0.08)]">
        <h2 className="font-heading text-lg font-bold text-[#1C1612] tracking-tight">
          {title}
        </h2>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-xs text-[#6B6155] hover:text-[#2A6B5A] transition-colors print:hidden"
          >
            Copy
          </button>
        )}
      </div>
      <div className="px-6 py-5 text-sm text-[#1C1612] leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function TimelineCard({ timeline }: { timeline: ProposalOutput['timeline'] }) {
  return (
    <div className="bg-white rounded-xl border border-[rgba(42,107,90,0.12)] shadow-[0_2px_12px_rgba(42,107,90,0.06)] overflow-hidden print:border print:shadow-none">
      <div className="px-6 py-4 border-b border-[rgba(42,107,90,0.08)]">
        <h2 className="font-heading text-lg font-bold text-[#1C1612] tracking-tight">
          Timeline
        </h2>
      </div>
      <div className="px-6 py-5">
        <div className="space-y-4">
          {timeline.map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#2A6B5A] flex-shrink-0 mt-1" />
                {i < timeline.length - 1 && (
                  <div className="w-px flex-1 bg-[rgba(42,107,90,0.2)]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C1612]">
                  {item.week}
                </p>
                <p className="text-sm text-[#6B6155] mt-0.5">
                  {item.deliverable}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProposalSections({
  proposal,
  onCopySection,
}: {
  proposal: ProposalOutput
  onCopySection: (text: string) => void
}) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Executive Summary"
        onCopy={() => onCopySection(proposal.executiveSummary)}
      >
        <p>{proposal.executiveSummary}</p>
      </SectionCard>

      <SectionCard
        title="We Understand Your Challenge"
        onCopy={() => onCopySection(proposal.challenge)}
      >
        <p>{proposal.challenge}</p>
      </SectionCard>

      <SectionCard
        title="What We Recommend"
        onCopy={() => onCopySection(proposal.recommendation)}
      >
        <p>{proposal.recommendation}</p>
      </SectionCard>

      <SectionCard
        title="What This Looks Like in Practice"
        onCopy={() => onCopySection(proposal.practicalLook)}
      >
        <p>{proposal.practicalLook}</p>
      </SectionCard>

      <SectionCard
        title="The Technical Approach"
        onCopy={() => onCopySection(proposal.technicalApproach)}
      >
        <p>{proposal.technicalApproach}</p>
      </SectionCard>

      <SectionCard
        title="What We Need From You"
        onCopy={() =>
          onCopySection(proposal.requirements.join('\n'))
        }
      >
        <ul className="list-disc pl-5 space-y-1.5">
          {proposal.requirements.map((req, i) => (
            <li key={i} className="text-[#1C1612]">
              {req}
            </li>
          ))}
        </ul>
      </SectionCard>

      <TimelineCard timeline={proposal.timeline} />

      <SectionCard
        title="Investment"
        onCopy={() => onCopySection(proposal.investment)}
      >
        <p>{proposal.investment}</p>
      </SectionCard>

      <SectionCard
        title="Why CodeOutfitters"
        onCopy={() =>
          onCopySection(proposal.whyUs.join('\n'))
        }
      >
        <ul className="space-y-2">
          {proposal.whyUs.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[#2A6B5A] mt-0.5 flex-shrink-0">✦</span>
              <span className="text-[#1C1612]">{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="Next Steps"
        onCopy={() =>
          onCopySection(proposal.nextSteps.join('\n'))
        }
      >
        <ol className="list-decimal pl-5 space-y-1.5">
          {proposal.nextSteps.map((step, i) => (
            <li key={i} className="text-[#1C1612]">
              {step}
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="What Else Is Possible"
        onCopy={() => onCopySection(proposal.futureOpportunities)}
      >
        <p className="text-[#6B6155] italic">
          {proposal.futureOpportunities}
        </p>
      </SectionCard>
    </div>
  )
}
