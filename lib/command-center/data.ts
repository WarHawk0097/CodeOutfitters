import 'server-only'
import { getCommandCenterMode, assertLiveConfig } from './mode'
import {
  requireDashboardContext,
  listLeads,
  getLead,
  listLeadAttachments,
  type DashboardContext,
  type LeadListItem,
  type LeadDetail,
  type LeadAttachment,
} from '@/lib/dashboard/server'
import {
  demoContext,
  listDemoLeads,
  getDemoLead,
  listDemoLeadAttachments,
} from './demo-data'

// Single mode boundary for every dashboard route. Demo mode returns repository
// fixtures and NEVER touches Supabase or requireDashboardContext(); live mode
// asserts configuration is present (controlled error, never a demo fallback)
// then delegates to the Work Order F implementation unchanged.

export async function resolveDashboardContext(
  returnTo: string,
): Promise<DashboardContext> {
  if (getCommandCenterMode() === 'demo') return demoContext()
  assertLiveConfig()
  return requireDashboardContext(returnTo)
}

export async function resolveLeads(
  ctx: DashboardContext,
  page: number,
  pageSize: number,
): Promise<{ items: LeadListItem[]; total: number }> {
  if (getCommandCenterMode() === 'demo') return listDemoLeads(page, pageSize)
  return listLeads(ctx.workspaceId, page, pageSize)
}

export async function resolveLead(leadId: string): Promise<LeadDetail | null> {
  if (getCommandCenterMode() === 'demo') return getDemoLead(leadId)
  return getLead(leadId)
}

export async function resolveLeadAttachments(
  leadId: string,
): Promise<LeadAttachment[]> {
  if (getCommandCenterMode() === 'demo') return listDemoLeadAttachments(leadId)
  return listLeadAttachments(leadId)
}
