-- =====================================================================
-- Inquiry backend — additive migration (Work Order C).
--
-- Creates the inquiry/lead persistence tables, idempotency + duplicate-lead
-- constraints, and ONE atomic persistence function (public.submit_inquiry)
-- called through Supabase RPC. All inquiry writes go through that function so
-- the multi-table write is a single Postgres transaction: any failure rolls
-- back every row (spec §9 atomic transaction requirement).
--
-- NOT APPLIED. Local file only. Do not run against production until the owner
-- approves [exact project, full SQL, rollback, backup status, test evidence].
--
-- Security posture (spec §12 / owner C):
--   * RLS enabled on every table.
--   * NO permissive policies — default-deny for anon and authenticated.
--   * The service-role key (server-only route handler) bypasses RLS and is the
--     ONLY write path. Dashboard read policies are deferred to the later auth
--     phase; until then no role can read/write directly from the browser.
--   * No `USING (true)` / `WITH CHECK (true)` policies.
--
-- Rollback: see the ROLLBACK block documented at the bottom of this file.
-- =====================================================================

-- Case-insensitive email matching for the duplicate-lead identity key.
create extension if not exists citext;

-- ---------------------------------------------------------------------
-- leads — the canonical lead entity (spec §10 Lead). The dashboard reads
-- from this table in Work Order G; column names are chosen to map cleanly
-- onto @command-center/contracts LeadStatus.
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  first_name          text        not null,
  last_name           text,
  work_email          citext      not null,
  phone               text,
  business_name       text        not null,
  job_title           text,
  website_url         text,
  company_size        text,
  service_interest    text,
  industry            text,
  workflow_description text       not null,
  desired_outcome     text,
  timeline            text,
  budget_range        text,
  source_page         text,
  source_path         text,
  campaign            jsonb,
  -- Server-owned fields (spec §8 "Server-owned fields"). The client never sets
  -- these; the submit_inquiry function assigns defaults / preserves them.
  status              text        not null default 'New'
                        check (status in (
                          'New','Contacted','Appt Pending','Appt Scheduled',
                          'Discovery Done','Proposal Req.','Proposal Sent',
                          'Negotiation','Won','Lost','FUL')),
  assigned_owner      uuid,
  appointment_status  text        not null default 'not_started',
  proposal_status     text,
  internal_notes      text,
  last_contacted_at   timestamptz,
  next_follow_up_at   timestamptz,
  -- Soft-delete / archive posture (owner C hardening 0.2): leads are archived,
  -- not hard-deleted. Combined with ON DELETE RESTRICT on every child FK below,
  -- historical business records cannot be destroyed as a convenience.
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Duplicate-lead identity key (spec §10 / owner duplicate policy): one lead per
-- normalized work email. citext makes the uniqueness case-insensitive.
create unique index if not exists leads_work_email_key
  on public.leads (work_email);

-- ---------------------------------------------------------------------
-- lead_form_submissions — every submitted inquiry (spec §10 Lead form
-- submission). submission_id UNIQUE is the DB-level idempotency guarantee.
-- ---------------------------------------------------------------------
create table if not exists public.lead_form_submissions (
  id                  uuid primary key default gen_random_uuid(),
  -- UNIQUE constraint (not just an index) so child tables can FK to it.
  submission_id       uuid        not null
                        constraint lead_form_submissions_submission_id_key unique,
  -- ON DELETE RESTRICT: a lead with submissions cannot be hard-deleted; archive
  -- it instead (owner C hardening 0.2). Preserves the inquiry audit trail.
  lead_id             uuid        not null references public.leads(id) on delete restrict,
  form_variant        text        not null,
  raw_answers         jsonb       not null,
  source_attribution  jsonb,
  consent             jsonb       not null,
  -- Deterministic hash of the substantive validated payload (see
  -- inquiry-idempotency.ts). Used to detect a reused submission_id carrying
  -- materially different content.
  request_fingerprint text        not null,
  created_at          timestamptz not null default now()
);

-- DB-enforced idempotency (spec §9.6 / owner): submission_id is UNIQUE (declared
-- inline above as lead_form_submissions_submission_id_key). A concurrent replay
-- hits that constraint, not a duplicate.
create index if not exists lead_form_submissions_lead_id_idx
  on public.lead_form_submissions (lead_id);

-- ---------------------------------------------------------------------
-- inquiry_attachments — file records (spec §10 Attachment). Populated by the
-- upload flow (Work Order E); C only creates the table and the association
-- point. No rows are linked in C because no authorized uploads exist yet.
-- ---------------------------------------------------------------------
create table if not exists public.inquiry_attachments (
  id                   uuid primary key default gen_random_uuid(),
  -- RESTRICT (owner 0.2): attachments are audit/consent-adjacent evidence and
  -- must not be erased by deleting a parent. Archive the lead instead.
  lead_id              uuid references public.leads(id) on delete restrict,
  submission_id        uuid
                         references public.lead_form_submissions(submission_id) on delete restrict,
  original_filename    text        not null,
  stored_key           text        not null,
  mime_type            text        not null,
  byte_size            bigint      not null,
  storage_provider_key text,
  scan_status          text        not null default 'pending'
                         check (scan_status in ('pending','clean','infected','skipped')),
  upload_status        text        not null default 'pending'
                         check (upload_status in ('pending','completed','failed')),
  created_at           timestamptz not null default now()
);

create index if not exists inquiry_attachments_lead_id_idx
  on public.inquiry_attachments (lead_id);

-- ---------------------------------------------------------------------
-- lead_timeline_events — activity log (spec §10 Lead timeline event).
-- ---------------------------------------------------------------------
create table if not exists public.lead_timeline_events (
  id          uuid primary key default gen_random_uuid(),
  -- RESTRICT (owner 0.2): the timeline is the lead's audit history.
  lead_id     uuid        not null references public.leads(id) on delete restrict,
  event_type  text        not null,
  summary     text        not null,
  actor       text        not null default 'system',
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists lead_timeline_events_lead_id_idx
  on public.lead_timeline_events (lead_id, created_at);

-- ---------------------------------------------------------------------
-- email_events — email lifecycle (spec §10 Email event). C creates rows in the
-- 'queued' state inside the transaction; the actual send happens AFTER commit
-- and updates status to 'sent'/'failed'. No real email is sent in C.
-- ---------------------------------------------------------------------
create table if not exists public.email_events (
  id            uuid primary key default gen_random_uuid(),
  -- RESTRICT (owner 0.2): email delivery history is business/audit evidence.
  lead_id       uuid        not null references public.leads(id) on delete restrict,
  submission_id uuid        not null
                  references public.lead_form_submissions(submission_id) on delete restrict,
  email_type    text        not null
                  check (email_type in ('visitor_confirmation','internal_notification')),
  provider_id   text,
  recipient     text        not null,
  status        text        not null default 'queued'
                  check (status in ('queued','sent','failed','delayed')),
  created_at    timestamptz not null default now()
);

create index if not exists email_events_lead_id_idx
  on public.email_events (lead_id);
create index if not exists email_events_submission_id_idx
  on public.email_events (submission_id);

-- ---------------------------------------------------------------------
-- submit_inquiry — the atomic persistence transaction (spec §9 Option A).
--
-- One SECURITY DEFINER plpgsql function == one transaction. It performs, in
-- order and all-or-nothing:
--   1. idempotency replay lookup (by submission_id);
--   2. duplicate-lead resolution (by normalized work_email);
--   3. lead create OR non-destructive update of approved fields;
--   4. submission insert;
--   5. timeline event insert;
--   6. queued email-event inserts (visitor_confirmation, internal_notification).
--
-- Any RAISE aborts the whole function and rolls back every write above. No
-- external network call happens inside the transaction (email send is after
-- commit, in the service layer).
--
-- Errors (mapped by inquiry-errors.ts):
--   * 'inquiry_idempotency_conflict' (P0001): same submission_id, different
--     fingerprint — the original submission is preserved, never overwritten.
--
-- Returns: jsonb { lead_id, submission_id, status:'received', replay:boolean }.
-- ---------------------------------------------------------------------
create or replace function public.submit_inquiry(
  p_payload     jsonb,
  p_fingerprint text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid := (p_payload->>'submissionId')::uuid;
  v_email         citext := lower(trim(p_payload->>'workEmail'));
  v_lead_id       uuid;
  v_existing_fp   text;
  v_existing_lead uuid;
begin
  -- (1) Idempotency replay. If this submission_id already persisted, return the
  -- original result when the content matches; conflict when it differs.
  select request_fingerprint, lead_id
    into v_existing_fp, v_existing_lead
    from public.lead_form_submissions
   where submission_id = v_submission_id;

  if found then
    if v_existing_fp is distinct from p_fingerprint then
      raise exception 'inquiry_idempotency_conflict'
        using errcode = 'P0001',
              detail  = 'submission_id reused with different payload fingerprint';
    end if;
    return jsonb_build_object(
      'lead_id', v_existing_lead,
      'submission_id', v_submission_id,
      'status', 'received',
      'replay', true
    );
  end if;

  -- (2) Duplicate-lead resolution by normalized email, row-locked to serialize
  -- concurrent inquiries for the same person.
  select id into v_existing_lead
    from public.leads
   where work_email = v_email
   for update;

  if v_existing_lead is not null then
    -- (3a) Non-destructive update: fill only blank approved contact/business
    -- fields; NEVER erase existing richer values, and preserve authoritative
    -- internal state (status, assigned_owner, internal_notes, pipeline).
    v_lead_id := v_existing_lead;
    update public.leads l set
      last_name        = coalesce(l.last_name,        nullif(p_payload->>'lastName','')),
      phone            = coalesce(l.phone,            nullif(p_payload->>'phone','')),
      job_title        = coalesce(l.job_title,        nullif(p_payload->>'jobTitle','')),
      website_url      = coalesce(l.website_url,      nullif(p_payload->>'websiteUrl','')),
      company_size     = coalesce(l.company_size,     nullif(p_payload->>'companySize','')),
      service_interest = coalesce(l.service_interest, nullif(p_payload->>'selectedService','')),
      industry         = coalesce(l.industry,         nullif(p_payload->>'selectedIndustry','')),
      desired_outcome  = coalesce(l.desired_outcome,  nullif(p_payload->>'desiredOutcome','')),
      timeline         = coalesce(l.timeline,         nullif(p_payload->>'timeline','')),
      budget_range     = coalesce(l.budget_range,     nullif(p_payload->>'budgetRange','')),
      updated_at       = now()
    where l.id = v_lead_id;
  else
    -- (3b) New lead with server-owned defaults (status defaults to 'New').
    insert into public.leads (
      first_name, last_name, work_email, phone, business_name, job_title,
      website_url, company_size, service_interest, industry,
      workflow_description, desired_outcome, timeline, budget_range,
      source_page, source_path, campaign
    ) values (
      p_payload->>'firstName',
      nullif(p_payload->>'lastName',''),
      v_email,
      nullif(p_payload->>'phone',''),
      p_payload->>'businessName',
      nullif(p_payload->>'jobTitle',''),
      nullif(p_payload->>'websiteUrl',''),
      nullif(p_payload->>'companySize',''),
      nullif(p_payload->>'selectedService',''),
      nullif(p_payload->>'selectedIndustry',''),
      p_payload->>'workflowDescription',
      nullif(p_payload->>'desiredOutcome',''),
      nullif(p_payload->>'timeline',''),
      nullif(p_payload->>'budgetRange',''),
      nullif(p_payload->>'sourcePage',''),
      nullif(p_payload->>'sourcePath',''),
      p_payload->'campaign'
    ) returning id into v_lead_id;
  end if;

  -- (4) Submission row. The unique index on submission_id is the last-line
  -- idempotency defense under concurrency; a race raises unique_violation,
  -- caught below and resolved as a replay.
  begin
    insert into public.lead_form_submissions (
      submission_id, lead_id, form_variant, raw_answers,
      source_attribution, consent, request_fingerprint
    ) values (
      v_submission_id,
      v_lead_id,
      p_payload->>'formVariant',
      p_payload,
      jsonb_build_object(
        'inquirySource', p_payload->>'inquirySource',
        'sourcePage',    p_payload->>'sourcePage',
        'sourcePath',    p_payload->>'sourcePath',
        'sourceSection', p_payload->>'sourceSection',
        'campaign',      p_payload->'campaign'
      ),
      p_payload->'consent',
      p_fingerprint
    );
  exception when unique_violation then
    -- Concurrent replay won the race: return the winner's result.
    select request_fingerprint, lead_id
      into v_existing_fp, v_existing_lead
      from public.lead_form_submissions
     where submission_id = v_submission_id;
    if v_existing_fp is distinct from p_fingerprint then
      raise exception 'inquiry_idempotency_conflict'
        using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'lead_id', v_existing_lead,
      'submission_id', v_submission_id,
      'status', 'received',
      'replay', true
    );
  end;

  -- (5) Timeline event.
  insert into public.lead_timeline_events (lead_id, event_type, summary, actor, metadata)
  values (
    v_lead_id,
    'inquiry_received',
    'Inquiry received via ' || coalesce(p_payload->>'formVariant','form'),
    'system',
    jsonb_build_object('submission_id', v_submission_id)
  );

  -- (6) Queue initial emails (real send happens after commit).
  insert into public.email_events (lead_id, submission_id, email_type, recipient, status)
  values
    (v_lead_id, v_submission_id, 'visitor_confirmation', v_email, 'queued'),
    (v_lead_id, v_submission_id, 'internal_notification', v_email, 'queued');

  return jsonb_build_object(
    'lead_id', v_lead_id,
    'submission_id', v_submission_id,
    'status', 'received',
    'replay', false
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Least-privilege grants + RLS.
-- ---------------------------------------------------------------------
alter table public.leads                 enable row level security;
alter table public.lead_form_submissions enable row level security;
alter table public.inquiry_attachments   enable row level security;
alter table public.lead_timeline_events  enable row level security;
alter table public.email_events          enable row level security;

-- No policies are created: with RLS enabled and no policy, anon and
-- authenticated are denied all access. The service-role key (server-only)
-- bypasses RLS and is the sole write path. Dashboard read policies come in the
-- later auth phase (owner C).

-- anon/authenticated get NO table privileges and NO EXECUTE on submit_inquiry.
revoke all on public.leads                 from anon, authenticated;
revoke all on public.lead_form_submissions from anon, authenticated;
revoke all on public.inquiry_attachments   from anon, authenticated;
revoke all on public.lead_timeline_events  from anon, authenticated;
revoke all on public.email_events          from anon, authenticated;
revoke all on function public.submit_inquiry(jsonb, text) from anon, authenticated, public;
-- Only the server (service_role) may execute the persistence transaction.
grant execute on function public.submit_inquiry(jsonb, text) to service_role;

-- ---------------------------------------------------------------------
-- Delete policy (owner C hardening 0.2). Every foreign key is ON DELETE
-- RESTRICT — NO cascades remain. Rationale: leads, submissions, timeline
-- events, email events and attachments are audit/consent/business history;
-- deleting a parent must never silently erase them. The intended lifecycle is
-- soft-delete via leads.archived_at, not row deletion. Hard-deleting a lead is
-- blocked by RESTRICT while any child exists, which is deliberate.
-- ---------------------------------------------------------------------

-- =====================================================================
-- ROLLBACK (manual; run only if this migration must be reverted):
--
--   drop function if exists public.submit_inquiry(jsonb, text);
--   drop table if exists public.email_events;
--   drop table if exists public.lead_timeline_events;
--   drop table if exists public.inquiry_attachments;
--   drop table if exists public.lead_form_submissions;
--   drop table if exists public.leads;
--   -- citext extension is left in place (may be used by other objects).
--
-- All tables are new in this migration, so the rollback is a clean drop with
-- no data migration. Take a backup before applying in any shared environment.
-- =====================================================================
