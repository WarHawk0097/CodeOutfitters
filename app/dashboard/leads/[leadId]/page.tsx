import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, FileWarning, Paperclip } from 'lucide-react'
import {
  requireDashboardContext,
  getLead,
  listLeadAttachments,
  type LeadAttachment,
} from '@/lib/dashboard/server'
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
  await requireDashboardContext(`/dashboard/leads/${leadId}`)

  const lead = await getLead(leadId)
  if (!lead) notFound()

  const attachments = await listLeadAttachments(leadId)

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
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/leads"
        className="mb-8 inline-flex items-center gap-1 text-xs font-medium text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to leads
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
          {name}
        </h1>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/60">
          {String(lead.status ?? 'New')}
        </span>
      </div>

      <dl className="mb-10 grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-white/10 bg-[#1C3D32] p-6 sm:grid-cols-2">
        {fields
          .filter(([, v]) => v != null && v !== '')
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-wide text-white/40">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm text-white/80">{String(value)}</dd>
            </div>
          ))}
      </dl>

      {typeof lead.workflow_description === 'string' && lead.workflow_description && (
        <div className="mb-10">
          <h2 className="mb-2 font-heading text-sm font-bold uppercase tracking-wide text-white/50">
            Workflow description
          </h2>
          <p className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#1C3D32] p-6 text-sm leading-relaxed text-white/80">
            {lead.workflow_description}
          </p>
        </div>
      )}

      <section aria-labelledby="attachments-heading">
        <h2
          id="attachments-heading"
          className="mb-4 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-white/50"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attachments
        </h2>
        {attachments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-[#1C3D32]/40 px-6 py-10 text-center text-sm text-white/40">
            No attachments on this lead.
          </p>
        ) : (
          <ul className="space-y-3">
            {attachments.map((a) => (
              <AttachmentRow key={a.id} attachment={a} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function AttachmentRow({ attachment: a }: { attachment: LeadAttachment }) {
  const downloadable = isDownloadable({
    leadId: 'present', // detail scope already scoped to this lead; leadId is set
    uploadStatus: a.uploadStatus,
    scanStatus: a.scanStatus,
  })

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1C3D32] px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {a.originalFilename}
        </p>
        <p className="mt-0.5 text-xs text-white/40">
          {a.mimeType}
          {a.byteSize != null ? ` · ${formatBytes(a.byteSize)}` : ''}
          {' · '}
          <ScanBadge scan={a.scanStatus} upload={a.uploadStatus} />
        </p>
      </div>
      {downloadable ? (
        <a
          href={`/api/dashboard/attachments/${a.id}/download`}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#2A6B5A] px-3 py-2 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      ) : (
        <span
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/40"
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
  if (upload !== 'completed') return <span className="text-white/40">Uploading</span>
  if (scan === 'clean') return <span className="text-[#7FBFA8]">Clean</span>
  if (scan === 'rejected') return <span className="text-red-400">Rejected</span>
  if (scan === 'pending') return <span className="text-white/40">Scanning</span>
  return <span className="text-white/40">Not available</span>
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
