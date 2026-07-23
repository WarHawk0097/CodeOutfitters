import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// RLS tenant-isolation integration tests (Work Order F, Phase 12). Runs against
// the REAL local Docker stack. Requires `node scripts/bootstrap-command-center.mjs`
// to have seeded the two workspaces, owner/second users, and seed leads +
// attachments. RLS is the boundary under test: every query below goes through an
// authenticated (or anonymous) client, never the service role.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const OWNER_EMAIL = process.env.BOOTSTRAP_OWNER_EMAIL || 'owner@codeoutfitters.local'
const OWNER_PASSWORD = process.env.BOOTSTRAP_OWNER_PASSWORD || 'localdev-owner-pass'
const SECOND_EMAIL = process.env.BOOTSTRAP_SECOND_EMAIL || 'second@codeoutfitters.local'
const SECOND_PASSWORD = process.env.BOOTSTRAP_SECOND_PASSWORD || 'localdev-second-pass'

async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message} (run the bootstrap script)`)
  return c
}

let owner: SupabaseClient
let second: SupabaseClient
let anon: SupabaseClient

beforeAll(async () => {
  owner = await signedInClient(OWNER_EMAIL, OWNER_PASSWORD)
  second = await signedInClient(SECOND_EMAIL, SECOND_PASSWORD)
  anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
})

async function emails(c: SupabaseClient): Promise<string[]> {
  const { data, error } = await c.from('leads').select('work_email')
  if (error) throw error
  return (data ?? []).map((r) => r.work_email as string)
}

describe('lead visibility by workspace membership', () => {
  it('owner sees primary-workspace leads, not the foreign one', async () => {
    const seen = await emails(owner)
    expect(seen).toContain('ada@seed.codeoutfitters.local')
    expect(seen).toContain('grace@seed.codeoutfitters.local')
    expect(seen).not.toContain('foreign@seed.codeoutfitters.local')
  })

  it('second user sees only the isolation-workspace lead', async () => {
    const seen = await emails(second)
    expect(seen).toContain('foreign@seed.codeoutfitters.local')
    expect(seen).not.toContain('ada@seed.codeoutfitters.local')
    expect(seen).not.toContain('grace@seed.codeoutfitters.local')
  })

  it('anonymous client sees no leads', async () => {
    const { data } = await anon.from('leads').select('work_email')
    expect(data ?? []).toHaveLength(0)
  })
})

describe('attachment visibility + download eligibility', () => {
  it('owner sees associated attachments but never the unassociated one', async () => {
    const { data, error } = await owner
      .from('inquiry_attachments')
      .select('id, original_filename, scan_status, lead_id')
    expect(error).toBeNull()
    const names = (data ?? []).map((r) => r.original_filename as string)
    expect(names).toContain('clean-brief.csv')
    expect(names).toContain('rejected-file.txt')
    expect(names).not.toContain('orphan-upload.txt')
    // No row the owner can see is unassociated.
    expect((data ?? []).every((r) => r.lead_id != null)).toBe(true)
  })

  it('can_download_attachment is true for clean, false for rejected', async () => {
    const { data } = await owner
      .from('inquiry_attachments')
      .select('id, original_filename')
    const clean = (data ?? []).find((r) => r.original_filename === 'clean-brief.csv')!
    const rejected = (data ?? []).find((r) => r.original_filename === 'rejected-file.txt')!

    const { data: okClean } = await owner.rpc('can_download_attachment', { p_attachment: clean.id })
    const { data: okRejected } = await owner.rpc('can_download_attachment', { p_attachment: rejected.id })
    expect(okClean).toBe(true)
    expect(okRejected).toBe(false)
  })

  it('cross-workspace user cannot download an attachment they do not own', async () => {
    // The clean attachment id, discovered as the owner…
    const { data } = await owner
      .from('inquiry_attachments')
      .select('id, original_filename')
    const clean = (data ?? []).find((r) => r.original_filename === 'clean-brief.csv')!
    // …is invisible and non-downloadable for the second user.
    const { data: seen } = await second
      .from('inquiry_attachments')
      .select('id')
      .eq('id', clean.id)
    expect(seen ?? []).toHaveLength(0)
    const { data: canDl } = await second.rpc('can_download_attachment', { p_attachment: clean.id })
    expect(canDl).toBe(false)
  })
})
