import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The Work Order F server module is the LIVE data path. We mock it so these unit
// tests can prove the demo boundary never touches Supabase, and prove the live
// path still routes through the untouched WO-F auth guard — without a real DB.
// Mocks live in vi.hoisted() so the (hoisted) vi.mock factory can reference them.
const { requireDashboardContext, listLeads, getLead, listLeadAttachments } =
  vi.hoisted(() => ({
    requireDashboardContext: vi.fn(async () => ({
      userId: 'live-user',
      email: 'live@example.com',
      workspaceId: 'ws-live',
      workspaceName: 'Live Workspace',
      role: 'owner' as const,
    })),
    listLeads: vi.fn(async () => ({ items: [], total: 0 })),
    getLead: vi.fn(async () => null),
    listLeadAttachments: vi.fn(async () => []),
  }))

vi.mock('@/lib/dashboard/server', () => ({
  requireDashboardContext,
  listLeads,
  getLead,
  listLeadAttachments,
}))

import {
  getCommandCenterMode,
  isDemoMode,
  assertLiveConfig,
  commandCenterClientConfig,
  CommandCenterConfigError,
} from './mode'
import {
  demoContext,
  listDemoLeads,
  getDemoLead,
  DEMO_SAMPLE_LEAD_ID,
} from './demo-data'
import * as data from './data'

const ENV_KEYS = [
  'COMMAND_CENTER_MODE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  requireDashboardContext.mockClear()
  listLeads.mockClear()
  getLead.mockClear()
  listLeadAttachments.mockClear()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

function demoEnv() {
  process.env.COMMAND_CENTER_MODE = 'demo'
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// 1. Demo renders with zero Supabase configuration.
it('1: demo resolves a context without any Supabase env vars', async () => {
  demoEnv()
  expect(isDemoMode()).toBe(true)
  const ctx = await data.resolveDashboardContext('/dashboard')
  expect(ctx).toEqual(demoContext())
})

// 2. Demo never invokes the live auth guard.
it('2: demo does not invoke requireDashboardContext()', async () => {
  demoEnv()
  await data.resolveDashboardContext('/dashboard')
  expect(requireDashboardContext).not.toHaveBeenCalled()
  expect(listLeads).not.toHaveBeenCalled()
})

// 3. Demo leads list renders the fixtures.
it('3: demo leads list returns the sample leads', async () => {
  demoEnv()
  const ctx = await data.resolveDashboardContext('/dashboard/leads')
  const { items, total } = await data.resolveLeads(ctx, 1, 25)
  expect(total).toBe(5)
  expect(items).toHaveLength(5)
  expect(items[0].name).toBe('Nadia Fenwick')
})

// 4. Demo lead detail renders.
it('4: demo lead detail resolves a known lead', async () => {
  demoEnv()
  const lead = await data.resolveLead(DEMO_SAMPLE_LEAD_ID)
  expect(lead).not.toBeNull()
  expect(getDemoLead(DEMO_SAMPLE_LEAD_ID)).toEqual(lead)
})

// 5. Unknown demo lead → not-found (null) state.
it('5: unknown demo lead resolves to null', async () => {
  demoEnv()
  const lead = await data.resolveLead('ffffffff-ffff-4fff-8fff-ffffffffffff')
  expect(lead).toBeNull()
})

// 6. Demo exposes no mutation surface (no write/create/update/delete resolvers).
it('6: demo data boundary exposes only read resolvers', () => {
  const exported = Object.keys(data)
  expect(exported).not.toEqual(
    expect.arrayContaining([
      expect.stringMatching(/create|update|delete|write|upload|save|mutate/i),
    ]),
  )
})

// 7. Demo downloads are disabled (secure route returns generic 404, no Supabase).
it('7: demo download route returns 404 without touching Supabase', async () => {
  demoEnv()
  const { GET } = await import(
    '@/app/api/dashboard/attachments/[attachmentId]/download/route'
  )
  const res = await GET(new Request('http://localhost/x'), {
    params: Promise.resolve({
      attachmentId: 'aa1c0001-0000-4000-8000-000000000001',
    }),
  })
  expect(res.status).toBe(404)
})

// 8. Live mode still routes through the untouched WO-F auth guard.
it('8: live mode delegates to requireDashboardContext', async () => {
  process.env.COMMAND_CENTER_MODE = 'live'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  const ctx = await data.resolveDashboardContext('/dashboard')
  expect(requireDashboardContext).toHaveBeenCalledWith('/dashboard')
  expect(ctx.workspaceId).toBe('ws-live')
})

// 9. Live mode with missing config fails as a controlled error (no demo fallback).
it('9: live mode without Supabase config throws CommandCenterConfigError', () => {
  process.env.COMMAND_CENTER_MODE = 'live'
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  expect(() => assertLiveConfig()).toThrow(CommandCenterConfigError)
  expect(isDemoMode()).toBe(false)
})

// 10. No env deliberately means DEMO (documented default until the production
//     data tier exists — never a silent live). An invalid value fails loudly
//     rather than defaulting, so a typo can never silently pick a mode.
it('10: default mode is demo and invalid mode throws (no silent fallback)', () => {
  delete process.env.COMMAND_CENTER_MODE
  expect(getCommandCenterMode()).toBe('demo')
  process.env.COMMAND_CENTER_MODE = 'staging'
  expect(() => getCommandCenterMode()).toThrow(/Invalid COMMAND_CENTER_MODE/)
})

// 11-13. The client config seam: booleans handed to the dashboard tree gate real
// downloads. Demo must disable downloads (no real file emission); live enables them.
describe('commandCenterClientConfig', () => {
  it('11: demo (default, no mode env) disables downloads', () => {
    delete process.env.COMMAND_CENTER_MODE
    expect(commandCenterClientConfig()).toEqual({ live: false, downloadsEnabled: false })
  })

  it('12: explicit demo disables downloads', () => {
    demoEnv()
    expect(commandCenterClientConfig()).toEqual({ live: false, downloadsEnabled: false })
  })

  it('13: live enables downloads', () => {
    process.env.COMMAND_CENTER_MODE = 'live'
    expect(commandCenterClientConfig()).toEqual({ live: true, downloadsEnabled: true })
  })
})
