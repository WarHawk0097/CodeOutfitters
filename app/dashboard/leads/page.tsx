import Link from 'next/link'
import { ChevronLeft, ChevronRight, Inbox, Paperclip } from 'lucide-react'
import { requireDashboardContext, listLeads } from '@/lib/dashboard/server'
import { clampPage, clampPageSize } from '@/lib/dashboard/validation'

export const metadata = { title: 'Leads — Command Center' }

const PAGE_SIZE = 25

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const ctx = await requireDashboardContext('/dashboard/leads')
  const sp = await searchParams
  const page = clampPage(sp.page)
  const pageSize = clampPageSize(PAGE_SIZE)

  const { items, total } = await listLeads(ctx.workspaceId, page, pageSize)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
          Leads
        </h1>
        <p className="mt-1 text-sm text-white/40">
          {total === 0
            ? 'No leads yet'
            : `Showing ${from}–${to} of ${total}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#1C3D32]/40 px-6 py-16 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-white/30" />
          <p className="text-sm font-medium text-white/70">No leads to show</p>
          <p className="mt-1 text-xs text-white/40">
            Inquiries submitted through the public site land here.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#1C3D32]">
            {items.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/dashboard/leads/${lead.id}`}
                  className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {lead.name}
                      </p>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60">
                        {lead.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-white/50">
                      {lead.email}
                      {lead.company ? ` · ${lead.company}` : ''}
                    </p>
                    {lead.preview && (
                      <p className="mt-1 line-clamp-1 max-w-xl text-xs text-white/35">
                        {lead.preview}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <time className="text-[11px] text-white/40">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </time>
                    {lead.attachmentCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-white/40">
                        <Paperclip className="h-3 w-3" />
                        {lead.attachmentCount}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-6 flex items-center justify-between"
            >
              <PageLink
                page={page - 1}
                disabled={page <= 1}
                label="Previous"
                dir="prev"
              />
              <span className="text-xs text-white/40">
                Page {page} of {totalPages}
              </span>
              <PageLink
                page={page + 1}
                disabled={page >= totalPages}
                label="Next"
                dir="next"
              />
            </nav>
          )}
        </>
      )}
    </div>
  )
}

function PageLink({
  page,
  disabled,
  label,
  dir,
}: {
  page: number
  disabled: boolean
  label: string
  dir: 'prev' | 'next'
}) {
  const cls =
    'inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/5'
  if (disabled) {
    return (
      <span className={`${cls} pointer-events-none opacity-30`} aria-disabled>
        {dir === 'prev' && <ChevronLeft className="h-3.5 w-3.5" />}
        {label}
        {dir === 'next' && <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    )
  }
  return (
    <Link href={`/dashboard/leads?page=${page}`} className={cls} rel={dir}>
      {dir === 'prev' && <ChevronLeft className="h-3.5 w-3.5" />}
      {label}
      {dir === 'next' && <ChevronRight className="h-3.5 w-3.5" />}
    </Link>
  )
}
