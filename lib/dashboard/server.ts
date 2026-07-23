import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { roleRank, type WorkspaceRole } from '@/lib/dashboard/roles'
import { isUuid } from '@/lib/dashboard/validation'

export type DashboardContext = {
  userId: string
  email: string | undefined
  workspaceId: string
  workspaceName: string
  role: WorkspaceRole
}

// Resolves the authenticated user and their highest-privilege active workspace.
// All queries run through the SSR (authenticated) client, so RLS is the boundary
// even if application logic has a bug. Returns null when unauthenticated or
// when the user has no active membership.
export async function getDashboardContext(): Promise<DashboardContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('workspace_memberships')
    .select('role, workspace_id, workspaces(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (!memberships || memberships.length === 0) return null

  const best = [...memberships].sort(
    (a, b) => roleRank(b.role as WorkspaceRole) - roleRank(a.role as WorkspaceRole),
  )[0]

  return {
    userId: user.id,
    email: user.email,
    workspaceId: best.workspace_id as string,
    workspaceName:
      (best.workspaces as { name?: string } | null)?.name ?? 'Workspace',
    role: best.role as WorkspaceRole,
  }
}

// Guard for dashboard server components: redirect unauthenticated users to
// login (the middleware also does this; this is defense in depth for direct
// server renders and for users with no membership).
export async function requireDashboardContext(returnTo: string): Promise<DashboardContext> {
  const ctx = await getDashboardContext()
  if (!ctx) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  return ctx
}

export type LeadListItem = {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  source: string | null
  status: string
  createdAt: string
  attachmentCount: number
  preview: string
}

const LEAD_LIST_COLUMNS =
  'id, first_name, last_name, work_email, business_name, phone, service_interest, industry, status, source_page, workflow_description, created_at, inquiry_attachments(count)'

export async function listLeads(
  workspaceId: string,
  page: number,
  pageSize: number,
): Promise<{ items: LeadListItem[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await supabase
    .from('leads')
    .select(LEAD_LIST_COLUMNS, { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const items = (data ?? []).map((row: Record<string, unknown>) => {
    const first = (row.first_name as string) ?? ''
    const last = (row.last_name as string) ?? ''
    const attach = row.inquiry_attachments as Array<{ count: number }> | null
    const desc = (row.workflow_description as string) ?? ''
    return {
      id: row.id as string,
      name: `${first} ${last}`.trim() || 'Unknown',
      email: (row.work_email as string) ?? '',
      company: (row.business_name as string) ?? null,
      phone: (row.phone as string) ?? null,
      source: (row.source_page as string) ?? null,
      status: (row.status as string) ?? 'New',
      createdAt: row.created_at as string,
      attachmentCount: attach?.[0]?.count ?? 0,
      preview: desc.length > 120 ? `${desc.slice(0, 117)}…` : desc,
    }
  })
  return { items, total: count ?? items.length }
}

export type LeadDetail = Record<string, unknown> & { id: string; formVariant: string | null }

export async function getLead(leadId: string): Promise<LeadDetail | null> {
  if (!isUuid(leadId)) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, lead_form_submissions(form_variant)')
    .eq('id', leadId)
    .maybeSingle()
  if (error || !data) return null
  const variants = (data.lead_form_submissions as Array<{ form_variant: string }> | null) ?? []
  return { ...data, formVariant: variants[0]?.form_variant ?? null } as LeadDetail
}

export type LeadAttachment = {
  id: string
  originalFilename: string
  mimeType: string
  byteSize: number | null
  scanStatus: string
  uploadStatus: string
  createdAt: string
}

export async function listLeadAttachments(leadId: string): Promise<LeadAttachment[]> {
  if (!isUuid(leadId)) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inquiry_attachments')
    .select('id, original_filename, declared_mime_type, byte_size, scan_status, upload_status, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    originalFilename: (r.original_filename as string) ?? 'attachment',
    mimeType: (r.declared_mime_type as string) ?? 'application/octet-stream',
    byteSize: (r.byte_size as number) ?? null,
    scanStatus: (r.scan_status as string) ?? 'pending',
    uploadStatus: (r.upload_status as string) ?? 'pending',
    createdAt: r.created_at as string,
  }))
}
