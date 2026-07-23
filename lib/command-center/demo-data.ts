// Deterministic, repository-owned demo fixtures for the Command Center demo mode.
// Entirely fictional — no real client names, emails, phone numbers, records, or
// storage URLs. Feeds the SAME presentation components as live mode through the
// resolver in ./data.ts. No Date.now()/Math.random(): timestamps are fixed so
// the demo is byte-stable across renders and environments.

import type {
  DashboardContext,
  LeadListItem,
  LeadDetail,
  LeadAttachment,
} from '@/lib/dashboard/server'

export const DEMO_WORKSPACE_NAME = 'CodeOutfitters Demo Workspace'

type DemoAttachment = {
  id: string
  originalFilename: string
  mimeType: string
  byteSize: number | null
  scanStatus: string
  uploadStatus: string
  createdAt: string
}

type DemoLead = {
  id: string
  first_name: string
  last_name: string
  work_email: string
  phone: string | null
  business_name: string | null
  job_title: string | null
  service_interest: string | null
  industry: string | null
  timeline: string | null
  budget_range: string | null
  source_page: string | null
  formVariant: string | null
  status: string
  created_at: string
  workflow_description: string
  attachments: DemoAttachment[]
}

// Newest first (matches the live created_at DESC ordering).
const DEMO_LEADS: DemoLead[] = [
  {
    id: '0a7c9e14-8b3f-4c21-9d5a-1e2f3a4b5c6d',
    first_name: 'Nadia',
    last_name: 'Fenwick',
    work_email: 'nadia.fenwick@brightloom.example',
    phone: '+1-555-0142',
    business_name: 'Brightloom Logistics',
    job_title: 'Head of Operations',
    service_interest: 'Automation discovery',
    industry: 'Logistics & supply chain',
    timeline: '1–3 months',
    budget_range: '$25k–$50k',
    source_page: '/services',
    formVariant: 'services_inline',
    status: 'New',
    created_at: '2026-07-21T09:12:00.000Z',
    workflow_description:
      'We manually reconcile carrier invoices against shipment records every week — roughly 400 line items across three spreadsheets. Looking to discover where automation could remove the double entry and flag mismatches before they hit finance.',
    attachments: [
      {
        id: 'aa1c0001-0000-4000-8000-000000000001',
        originalFilename: 'invoice-reconciliation-sample.csv',
        mimeType: 'text/csv',
        byteSize: 48213,
        scanStatus: 'clean',
        uploadStatus: 'completed',
        createdAt: '2026-07-21T09:12:30.000Z',
      },
    ],
  },
  {
    id: '1b8daf25-9c40-4d32-8e6b-2f3a4b5c6d7e',
    first_name: 'Marcus',
    last_name: 'Ilori',
    work_email: 'marcus.ilori@northwind-retail.example',
    phone: '+1-555-0198',
    business_name: 'Northwind Retail Group',
    job_title: 'VP, Retail Operations',
    service_interest: 'Operations dashboard',
    industry: 'Retail',
    timeline: 'ASAP',
    budget_range: '$50k–$100k',
    source_page: '/industries',
    formVariant: 'industries_inline',
    status: 'Qualified',
    created_at: '2026-07-20T15:47:00.000Z',
    workflow_description:
      'Store managers report daily numbers by email and we consolidate them by hand. We want a single operations dashboard that pulls POS, staffing, and inventory into one live view for 62 locations.',
    attachments: [
      {
        id: 'aa1c0002-0000-4000-8000-000000000002',
        originalFilename: 'store-kpi-template.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        byteSize: 71680,
        scanStatus: 'clean',
        uploadStatus: 'completed',
        createdAt: '2026-07-20T15:48:10.000Z',
      },
      {
        id: 'aa1c0003-0000-4000-8000-000000000003',
        originalFilename: 'current-reporting-flow.pdf',
        mimeType: 'application/pdf',
        byteSize: 205331,
        scanStatus: 'pending',
        uploadStatus: 'completed',
        createdAt: '2026-07-20T15:49:02.000Z',
      },
    ],
  },
  {
    id: '2c9eb036-ad51-4e43-9f7c-3a4b5c6d7e8f',
    first_name: 'Priya',
    last_name: 'Raman',
    work_email: 'priya.raman@cobalt-fintech.example',
    phone: null,
    business_name: 'Cobalt Fintech',
    job_title: 'Director of Support',
    service_interest: 'AI customer support',
    industry: 'Financial services',
    timeline: '3–6 months',
    budget_range: '$100k+',
    source_page: '/case-studies',
    formVariant: 'case_study_contextual',
    status: 'In review',
    created_at: '2026-07-19T11:03:00.000Z',
    workflow_description:
      'Support volume doubled after our last launch. We are evaluating an AI assist layer that drafts responses from our knowledge base while keeping a human in the loop for anything touching account balances.',
    attachments: [],
  },
  {
    id: '3dafc147-be62-4f54-8a8d-4b5c6d7e8f90',
    first_name: 'Tomas',
    last_name: 'Berg',
    work_email: 'tomas.berg@meridian-health.example',
    phone: '+1-555-0173',
    business_name: 'Meridian Health Partners',
    job_title: 'Chief Operating Officer',
    service_interest: 'Workflow audit',
    industry: 'Healthcare',
    timeline: '1–3 months',
    budget_range: '$25k–$50k',
    source_page: '/process',
    formVariant: 'workflow_audit_popup',
    status: 'New',
    created_at: '2026-07-18T08:26:00.000Z',
    workflow_description:
      'Patient intake still runs on paper forms that staff re-key into two separate systems. We want an audit of the end-to-end workflow before committing to a build, with a clear map of where errors and delays come from.',
    attachments: [
      {
        id: 'aa1c0004-0000-4000-8000-000000000004',
        originalFilename: 'intake-process-notes.txt',
        mimeType: 'text/plain',
        byteSize: 3120,
        scanStatus: 'rejected',
        uploadStatus: 'completed',
        createdAt: '2026-07-18T08:27:15.000Z',
      },
    ],
  },
  {
    id: '4eb0d258-cf73-4a65-9b9e-5c6d7e8f9012',
    first_name: 'Sasha',
    last_name: 'Kovac',
    work_email: 'sasha.kovac@ironvale-mfg.example',
    phone: '+1-555-0121',
    business_name: 'Ironvale Manufacturing',
    job_title: 'IT Systems Lead',
    service_interest: 'Secure integration',
    industry: 'Manufacturing',
    timeline: '6+ months',
    budget_range: '$50k–$100k',
    source_page: '/security',
    formVariant: 'security_contextual',
    status: 'Qualified',
    created_at: '2026-07-17T14:55:00.000Z',
    workflow_description:
      'We need to connect our on-prem ERP to a new supplier portal without exposing the ERP to the public internet. Security review and a documented integration boundary are the priority for this engagement.',
    attachments: [
      {
        id: 'aa1c0005-0000-4000-8000-000000000005',
        originalFilename: 'network-boundary-diagram.pdf',
        mimeType: 'application/pdf',
        byteSize: 512044,
        scanStatus: 'clean',
        uploadStatus: 'completed',
        createdAt: '2026-07-17T14:56:40.000Z',
      },
    ],
  },
]

const byId = new Map(DEMO_LEADS.map((l) => [l.id, l]))

// A recognizable demo lead id for QA / URLs.
export const DEMO_SAMPLE_LEAD_ID = DEMO_LEADS[0].id

export function demoContext(): DashboardContext {
  return {
    userId: 'demo-user',
    email: 'demo@codeoutfitters.example',
    workspaceId: 'demo-workspace',
    workspaceName: DEMO_WORKSPACE_NAME,
    role: 'owner',
  }
}

function toListItem(l: DemoLead): LeadListItem {
  const desc = l.workflow_description ?? ''
  return {
    id: l.id,
    name: `${l.first_name} ${l.last_name}`.trim() || 'Unknown',
    email: l.work_email,
    company: l.business_name,
    phone: l.phone,
    source: l.source_page,
    status: l.status,
    createdAt: l.created_at,
    attachmentCount: l.attachments.length,
    preview: desc.length > 120 ? `${desc.slice(0, 117)}…` : desc,
  }
}

export function listDemoLeads(
  page: number,
  pageSize: number,
): { items: LeadListItem[]; total: number } {
  const from = (page - 1) * pageSize
  const items = DEMO_LEADS.slice(from, from + pageSize).map(toListItem)
  return { items, total: DEMO_LEADS.length }
}

export function getDemoLead(leadId: string): LeadDetail | null {
  const l = byId.get(leadId)
  if (!l) return null
  const { attachments: _omit, ...rest } = l
  return { ...rest } as LeadDetail
}

export function listDemoLeadAttachments(leadId: string): LeadAttachment[] {
  const l = byId.get(leadId)
  if (!l) return []
  return l.attachments.map((a) => ({
    id: a.id,
    originalFilename: a.originalFilename,
    mimeType: a.mimeType,
    byteSize: a.byteSize,
    scanStatus: a.scanStatus,
    uploadStatus: a.uploadStatus,
    createdAt: a.createdAt,
  }))
}
