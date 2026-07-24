import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, FileWarning, Paperclip } from 'lucide-react'
import { type LeadAttachment } from '@/lib/dashboard/server'
import {
  resolveDashboardContext,
  resolveLead,
  resolveLeadAttachments,
} from '@/lib/command-center/data'
import { isDemoMode } from '@/lib/command-center/mode'
import { isDownloadable } from '@/lib/dashboard/validation'

export const metadata = { title: 'Lead — Command Center' }

// A foreign-workspace or non-existent lead must be indistinguishable: RLS makes
// getLead() return null for a lead outside the caller's workspace, and we then
// render the same generic 404 as a truly missing id — no existence leak.
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params
  await resolveDashboardContext(`/dashboard/leads/${leadId}`)
  const demo = isDemoMode()

  const lead = await resolveLead(leadId)
  if (!lead) notFound()

  const attachments = await resolveLeadAttachments(leadId)

  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'
  const fields: Array<[string, unknown]> = [
    ['Email', lead.work_email],
    ['Phone', lead.phone],
    ['Company', lead.business_name],
    ['Job title', lead.job_title],
    ['Service interest', lead.service_interest],
    ['Industry', lead.industry],
    ['Timeline', lead.timeline],
    ['Budget', lead.budget_range],
    ['Source', lead.source_page],
    ['Form variant', lead.formVariant],
  ]

  return (
    <div className="cc-scope mx-auto max-w-3xl font-cc-body">
      <Link
        href="/dashboard/leads"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to leads
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-cc-ink-strong">
          {name}
        </h1>
        <span className="rounded-cc-control border border-cc-line bg-cc-secondary px-2.5 py-1 text-[11px] font-medium text-cc-t2">
          {String(lead.status ?? 'New')}
        </span>
      </div>

      <dl className="mb-8 grid grid-cols-1 gap-x-8 gap-y-4 rounded-cc-card border border-cc-line bg-cc-surface p-6 sm:grid-cols-2">
        {fields
          .filter(([, v]) => v != null && v !== '')
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-wide text-cc-t4">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm text-cc-ink">{String(value)}</dd>
            </div>
          ))}
      </dl>

      {typeof lead.workflow_description === 'string' && lead.workflow_description && (
        <div className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cc-t3">
            Workflow description
          </h2>
          <p className="whitespace-pre-wrap rounded-cc-card border border-cc-line bg-cc-surface p-6 text-sm leading-relaxed text-cc-ink">
            {lead.workflow_description}
          </p>
        </div>
      )}

      <section aria-labelledby="attachments-heading">
        <h2
          id="attachments-heading"
          className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cc-t3"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attachments
        </h2>
        {attachments.length === 0 ? (
          <p className="rounded-cc-card border border-dashed border-cc-line-strong bg-cc-surface px-6 py-10 text-center text-sm text-cc-t3">
            No attachments on this lead.
          </p>
        ) : (
          <ul className="space-y-3">
            {attachments.map((a) => (
              <AttachmentRow key={a.id} attachment={a} demo={demo} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function AttachmentRow({
  attachment: a,
  demo,
}: {
  attachment: LeadAttachment
  demo: boolean
}) {
  const downloadable = isDownloadable({
    leadId: 'present', // detail scope already scoped to this lead; leadId is set
    uploadStatus: a.uploadStatus,
    scanStatus: a.scanStatus,
  })

  return (
    <li className="flex items-center justify-between gap-4 rounded-cc-control border border-cc-line bg-cc-surface px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-cc-ink">
          {a.originalFilename}
        </p>
        <p className="mt-0.5 text-xs text-cc-t3">
          {a.mimeType}
          {a.byteSize != null ? ` · ${formatBytes(a.byteSize)}` : ''}
          {' · '}
          <ScanBadge scan={a.scanStatus} upload={a.uploadStatus} />
        </p>
      </div>
      {demo ? (
        <span
          className="inline-flex max-w-[14rem] flex-shrink-0 items-center gap-1.5 rounded-cc-control border border-cc-line px-3 py-2 text-right text-xs font-medium text-cc-t3"
          title="Available when the production data service is connected."
        >
          <FileWarning className="h-3.5 w-3.5 flex-shrink-0" />
          Available when the production data service is connected
        </span>
      ) : downloadable ? (
        <a
          href={`/api/dashboard/attachments/${a.id}/download`}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-cc-control bg-cc-green px-3 py-2 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      ) : (
        <span
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-cc-control border border-cc-line px-3 py-2 text-xs font-medium text-cc-t3"
          title="This file is not available for download."
        >
          <FileWarning className="h-3.5 w-3.5" />
          Unavailable
        </span>
      )}
    </li>
  )
}

function ScanBadge({ scan, upload }: { scan: string; upload: string }) {
  if (upload !== 'completed') return <span className="text-cc-t3">Uploading</span>
  if (scan === 'clean') return <span className="text-cc-green-ink">Clean</span>
  if (scan === 'rejected') return <span className="text-cc-red-ink">Rejected</span>
  if (scan === 'pending') return <span className="text-cc-t3">Scanning</span>
  return <span className="text-cc-t3">Not available</span>
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
