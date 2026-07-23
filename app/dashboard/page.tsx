import Link from 'next/link'
import { ArrowRight, Inbox, Paperclip } from 'lucide-react'
import { resolveDashboardContext, resolveLeads } from '@/lib/command-center/data'

export const metadata = { title: 'Overview — Command Center' }

export default async function DashboardOverview() {
  const ctx = await resolveDashboardContext('/dashboard')
  const { items, total } = await resolveLeads(ctx, 1, 5)
  const attachmentTotal = items.reduce((n, l) => n + l.attachmentCount, 0)

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
          {ctx.workspaceName}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Inbound inquiries for your workspace.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#1C3D32] p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A6B5A]/20">
            <Inbox className="h-5 w-5 text-[#C8A96E]" />
          </div>
          <p className="font-heading text-3xl font-bold text-white">{total}</p>
          <p className="mt-1 text-sm text-white/50">Total leads</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1C3D32] p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8A96E]/20">
            <Paperclip className="h-5 w-5 text-[#C8A96E]" />
          </div>
          <p className="font-heading text-3xl font-bold text-white">
            {attachmentTotal}
          </p>
          <p className="mt-1 text-sm text-white/50">
            Attachments on recent leads
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold tracking-tight text-white">
          Recent leads
        </h2>
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-1 text-xs font-semibold text-[#C8A96E] transition-all hover:gap-2"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#1C3D32]">
          {items.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {lead.name}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {lead.email}
                    {lead.company ? ` · ${lead.company}` : ''}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  {lead.attachmentCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-white/40">
                      <Paperclip className="h-3 w-3" />
                      {lead.attachmentCount}
                    </span>
                  )}
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-white/60">
                    {lead.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-[#1C3D32]/40 px-6 py-16 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-white/30" />
      <p className="text-sm font-medium text-white/70">No leads yet</p>
      <p className="mt-1 text-xs text-white/40">
        New inquiries submitted through the site will appear here.
      </p>
    </div>
  )
}
