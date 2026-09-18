import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { boundedGetUser } from '@/lib/supabase/bounded-auth-fetch'
import { roleRank, type WorkspaceRole } from '@/lib/dashboard/roles'
import { isUuid } from '@/lib/dashboard/validation'
import { resolveDisplayName, initialsFor } from '@/lib/identity/display-name'

export type DashboardContext = {
  userId: string
  email: string | undefined
  workspaceId: string
  workspaceName: string
  role: WorkspaceRole
  name: string
  initials: string
}

// Resolves the authenticated user and their highest-privilege active workspace.
// All queries run through the SSR (authenticated) client, so RLS is the boundary
// even if application logic has a bug. Returns null when unauthenticated or
// when the user has no active membership. THROWS the classified provider-outage
// error when the auth or data plane is unreachable: "no membership" and
// "membership unknown" must never be confused by a caller.
export async function getDashboardContext(): Promise<DashboardContext | null> {
  const supabase = await createClient()
  const userResult = await boundedGetUser(() => supabase.auth.getUser())
  if (userResult.outcome === 'outage') throw userResult.error
  if (userResult.outcome === 'unauthenticated') return null
  const user = userResult.user

  // profiles has no FK PostgREST can embed on the memberships query (same reason
  // lib/tasks/server-provider.ts's displayNamesByUserId fetches it separately) —
  // one extra id-scoped lookup, RLS-bound to the caller's own row. Both depend
  // only on user.id, so they run concurrently: one network round trip, not two.
  const [{ data: memberships, error: membershipsError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from('workspace_memberships')
        .select('role, workspace_id, workspaces(name)')
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    ])

  // PostgREST delivers a network-class failure as a RESOLVED error (status 0 —
  // no HTTP answer ever arrived). That is an unreachable data plane, not "no
  // membership": rethrow as a classified outage so callers render the honest
  // unavailable state instead of ejecting a signed-in member to /access-pending.
  const isDataPlaneOutage = (e: unknown): boolean =>
    Boolean(e && typeof e === 'object' && (e as { status?: unknown }).status === 0)
  if (isDataPlaneOutage(membershipsError) || isDataPlaneOutage(profileError)) {
    throw isDataPlaneOutage(membershipsError) ? membershipsError : profileError
  }

  if (!memberships || memberships.length === 0) return null

  const best = [...memberships].sort(
    (a, b) => roleRank(b.role as WorkspaceRole) - roleRank(a.role as WorkspaceRole),
  )[0]

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null)
  const name = resolveDisplayName({
    profileFullName: profile?.full_name ?? null,
    providerFullName: asString(meta.full_name) ?? asString(meta.name),
    providerGivenName: asString(meta.given_name),
    providerFamilyName: asString(meta.family_name),
    email: user.email ?? null,
  })

  return {
    userId: user.id,
    email: user.email,
    workspaceId: best.workspace_id as string,
    workspaceName:
      (best.workspaces as { name?: string } | null)?.name ?? 'Workspace',
    role: best.role as WorkspaceRole,
    name,
    initials: initialsFor(name),
  }
}

// Guard for dashboard server components: unauthenticated users go to login (the
// middleware also does this; this is defense in depth for direct server renders).
// An authenticated user with no active membership goes to /access-pending —
// sending them back to /login would loop, and admitting them would mean
// "authenticated equals authorized", which this app never does.
export async function requireDashboardContext(returnTo: string): Promise<DashboardContext> {
  const ctx = await getDashboardContext()
  if (ctx) return ctx

  // ctx was null — either signed out, or a transient answer. Distinguish via
  // getUser; an outage THROWS out of getDashboardContext/boundedGetUser, so a
  // provider failure can never masquerade as "signed out" here.
  const supabase = await createClient()
  const userResult = await boundedGetUser(() => supabase.auth.getUser())
  if (userResult.outcome === 'outage') throw userResult.error
  if (userResult.outcome === 'authenticated') redirect('/access-pending')
  redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
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
