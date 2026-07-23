#!/usr/bin/env node
// Local Command Center bootstrap (Work Order F, Phase 10).
//
// Creates, idempotently and LOCAL-ONLY:
//   * an owner auth user + primary workspace + owner membership
//   * a second auth user + second workspace + owner membership (isolation tests)
//   * seed leads in the primary workspace + a foreign lead in the second one
//   * attachments that are clean+associated (downloadable), rejected, and
//     unassociated (negative-authorization tests)
//   * a real storage object for the clean attachment so the signed-download path
//     is exercisable end to end
//   * backfill: any workspace_id-less lead is assigned to the primary workspace
//
// SAFETY / least-privilege:
//   * refuses to run unless NEXT_PUBLIC_SUPABASE_URL points at localhost
//   * auth users + the storage object use the service key (server-side only,
//     never printed)
//   * all TABLE writes go through the local Postgres superuser via
//     `docker exec psql` — the service role KEEPS its WO-E least privilege
//     (no broad grants on lead PII tables are added for this script)
//   * local dev credentials come from env with throwaway defaults documented in
//     docs/COMMAND_CENTER_LOCAL.md — they are NOT production credentials
//
// Rerun-safe: every statement is ON CONFLICT / idempotent.

import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
const bucket = process.env.INQUIRY_STORAGE_BUCKET || 'inquiry-attachments'
const dbContainer = process.env.BOOTSTRAP_DB_CONTAINER || 'supabase_db_CodeOutfitters'

if (!url || !secret) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY. Export local env first.')
  process.exit(1)
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(url)) {
  console.error(`Refusing to bootstrap against non-local URL: ${url}`)
  process.exit(1)
}

const OWNER_EMAIL = process.env.BOOTSTRAP_OWNER_EMAIL || 'owner@codeoutfitters.local'
const OWNER_PASSWORD = process.env.BOOTSTRAP_OWNER_PASSWORD || 'localdev-owner-pass'
const SECOND_EMAIL = process.env.BOOTSTRAP_SECOND_EMAIL || 'second@codeoutfitters.local'
const SECOND_PASSWORD = process.env.BOOTSTRAP_SECOND_PASSWORD || 'localdev-second-pass'

const CLEAN_KEY = 'seed/primary/clean-brief.csv'

const svc = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function ensureUser(email, password) {
  const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true })
  if (!error && data?.user) return data.user.id
  if (error && !/already/i.test(error.message)) throw error
  for (let page = 1; page <= 20; page++) {
    const { data: list, error: listErr } = await svc.auth.admin.listUsers({ page, perPage: 200 })
    if (listErr) throw listErr
    const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found.id
    if (list.users.length < 200) break
  }
  throw new Error(`Could not resolve existing user ${email}`)
}

function psql(sql) {
  execFileSync(
    'docker',
    ['exec', '-i', dbContainer, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-f', '-'],
    { input: sql, stdio: ['pipe', 'inherit', 'inherit'] },
  )
}

function seedSql(ownerId, secondId) {
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`
  return `
begin;

insert into public.workspaces (slug, name) values
  ('primary', 'CodeOutfitters Primary'),
  ('isolation', 'Isolation Test Workspace')
on conflict (slug) do update set name = excluded.name;

insert into public.workspace_memberships (workspace_id, user_id, role, status)
  select w.id, ${q(ownerId)}::uuid, 'owner', 'active' from public.workspaces w where w.slug = 'primary'
on conflict (workspace_id, user_id) do update set role = 'owner', status = 'active';

insert into public.workspace_memberships (workspace_id, user_id, role, status)
  select w.id, ${q(secondId)}::uuid, 'owner', 'active' from public.workspaces w where w.slug = 'isolation'
on conflict (workspace_id, user_id) do update set role = 'owner', status = 'active';

insert into public.leads (first_name, last_name, work_email, business_name, phone, service_interest, industry, workflow_description, source_page, status, workspace_id)
  select 'Ada', 'Lovelace', 'ada@seed.codeoutfitters.local', 'Analytical Engines', '+1 555 0100', 'Automation', 'Manufacturing', 'Automate our monthly production report pipeline end to end.', '/contact', 'New', w.id
  from public.workspaces w where w.slug = 'primary'
on conflict (work_email) do update set workspace_id = excluded.workspace_id;

insert into public.leads (first_name, last_name, work_email, business_name, service_interest, industry, workflow_description, source_page, status, workspace_id)
  select 'Grace', 'Hopper', 'grace@seed.codeoutfitters.local', 'Compiler Co', 'Integration', 'Software', 'Integrate our CRM with the billing system.', '/services', 'New', w.id
  from public.workspaces w where w.slug = 'primary'
on conflict (work_email) do update set workspace_id = excluded.workspace_id;

insert into public.leads (first_name, last_name, work_email, business_name, workflow_description, source_page, status, workspace_id)
  select 'Foreign', 'Prospect', 'foreign@seed.codeoutfitters.local', 'Other Org', 'This lead must never be visible to the primary owner.', '/contact', 'New', w.id
  from public.workspaces w where w.slug = 'isolation'
on conflict (work_email) do update set workspace_id = excluded.workspace_id;

-- clean + associated (downloadable)
insert into public.inquiry_attachments (lead_id, original_filename, storage_key, storage_bucket, declared_mime_type, detected_mime_type, byte_size, upload_status, scan_status)
  select l.id, 'clean-brief.csv', ${q(CLEAN_KEY)}, ${q(bucket)}, 'text/csv', 'text/csv', 40, 'completed', 'clean'
  from public.leads l where l.work_email = 'ada@seed.codeoutfitters.local'
on conflict (storage_key) do nothing;

-- rejected (must never be downloadable)
insert into public.inquiry_attachments (lead_id, original_filename, storage_key, storage_bucket, declared_mime_type, byte_size, upload_status, scan_status)
  select l.id, 'rejected-file.txt', 'seed/primary/rejected-file.txt', ${q(bucket)}, 'text/plain', 20, 'completed', 'rejected'
  from public.leads l where l.work_email = 'ada@seed.codeoutfitters.local'
on conflict (storage_key) do nothing;

-- unassociated (lead_id NULL; must never be visible/downloadable)
insert into public.inquiry_attachments (lead_id, original_filename, storage_key, storage_bucket, declared_mime_type, byte_size, upload_status, scan_status)
  values (null, 'orphan-upload.txt', 'seed/orphan/orphan-upload.txt', ${q(bucket)}, 'text/plain', 15, 'completed', 'clean')
on conflict (storage_key) do nothing;

-- backfill: pre-existing leads with no workspace join the primary workspace
update public.leads set workspace_id = (select id from public.workspaces where slug = 'primary')
  where workspace_id is null;

commit;
`
}

async function main() {
  const ownerId = await ensureUser(OWNER_EMAIL, OWNER_PASSWORD)
  const secondId = await ensureUser(SECOND_EMAIL, SECOND_PASSWORD)

  const { error: upErr } = await svc.storage
    .from(bucket)
    .upload(CLEAN_KEY, Buffer.from('name,value\nseed,safe-to-download\n'), {
      contentType: 'text/csv',
      upsert: true,
    })
  if (upErr) throw upErr

  psql(seedSql(ownerId, secondId))

  console.log('Bootstrap complete (local).')
  console.log(`  owner user:  ${OWNER_EMAIL}  -> workspace "primary"`)
  console.log(`  second user: ${SECOND_EMAIL} -> workspace "isolation"`)
  console.log('  passwords: see docs/COMMAND_CENTER_LOCAL.md (local throwaway creds)')
}

main().catch((e) => {
  console.error('Bootstrap failed:', e.message)
  process.exit(1)
})
