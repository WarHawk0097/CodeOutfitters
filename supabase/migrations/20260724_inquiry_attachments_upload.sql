-- =====================================================================
-- Work Order E — secure attachment upload. ADDITIVE migration.
--
-- NOT APPLIED. Local file only. Do not run in production until the owner
-- approves [exact project, full SQL, rollback, backup status, test evidence].
--
-- Layers on top of 20260723_inquiry_backend.sql; load both, in order.
-- 20260723 created public.inquiry_attachments as an association-point
-- placeholder ("Populated by the upload flow (Work Order E)"). This
-- migration grows it into the full two-phase upload record and folds
-- single-use attachment-token association into the existing atomic
-- submit_inquiry transaction (spec §9 atomicity, §11 tokens).
--
-- Security posture unchanged from 20260723: RLS stays enabled and
-- default-deny; only the service-role write path (server-only) and the
-- SECURITY DEFINER function touch these rows. No public.* policy is added.
-- =====================================================================

-- ---------------------------------------------------------------------
-- (1) Grow inquiry_attachments into the real upload record.
--   * storage_key / declared_mime_type: rename the placeholder columns to
--     their spec names (no data — the table has never held a row).
--   * provisional_submission_id: the client-supplied submissionId captured
--     at AUTHORIZE time, before any lead_form_submissions row exists. The
--     real submission_id FK stays NULL until atomic association.
--   * detected_mime_type: server-verified content type (file signature),
--     distinct from the browser-declared type.
--   * token columns: only the SHA-256 hash is stored; the raw token lives
--     in the browser for exactly one final POST.
-- ---------------------------------------------------------------------
alter table public.inquiry_attachments rename column stored_key to storage_key;
alter table public.inquiry_attachments rename column mime_type  to declared_mime_type;

alter table public.inquiry_attachments
  add column if not exists provisional_submission_id   uuid,
  add column if not exists storage_bucket              text not null default 'inquiry-attachments',
  add column if not exists sanitized_filename          text,
  add column if not exists detected_mime_type          text,
  add column if not exists authorization_expires_at    timestamptz,
  add column if not exists upload_completed_at         timestamptz,
  add column if not exists attachment_token_hash       text,
  add column if not exists attachment_token_expires_at timestamptz,
  add column if not exists token_consumed_at           timestamptz,
  add column if not exists updated_at                  timestamptz not null default now();

-- Widen the status vocabularies (Postgres auto-names table CHECK constraints
-- deterministically as <table>_<column>_check, so we can drop and recreate).
--   upload_status: pending -> authorized (phase 1) -> completed (phase 3).
--   scan_status:   pending | clean | rejected | failed | unavailable
--                  ('infected'/'skipped' from the placeholder are dropped;
--                   the table has no rows to migrate).
alter table public.inquiry_attachments drop constraint if exists inquiry_attachments_upload_status_check;
alter table public.inquiry_attachments add  constraint inquiry_attachments_upload_status_check
  check (upload_status in ('pending','authorized','completed','failed'));

alter table public.inquiry_attachments drop constraint if exists inquiry_attachments_scan_status_check;
alter table public.inquiry_attachments add  constraint inquiry_attachments_scan_status_check
  check (scan_status in ('pending','clean','rejected','failed','unavailable'));

-- Data-integrity constraints (spec §11): positive size, one object per key,
-- one row per token hash, and a token can only be consumed once (enforced in
-- the association function; the partial unique index stops two live tokens
-- from colliding).
alter table public.inquiry_attachments
  add constraint inquiry_attachments_byte_size_positive check (byte_size > 0);

create unique index if not exists inquiry_attachments_storage_key_key
  on public.inquiry_attachments (storage_key);
create unique index if not exists inquiry_attachments_token_hash_key
  on public.inquiry_attachments (attachment_token_hash)
  where attachment_token_hash is not null;

-- Lookup indexes (spec §11 indexes): submission binding, provisional binding,
-- status filters, expiry sweeps (orphan cleanup), and recency ordering.
create index if not exists inquiry_attachments_submission_id_idx
  on public.inquiry_attachments (submission_id);
create index if not exists inquiry_attachments_provisional_idx
  on public.inquiry_attachments (provisional_submission_id);
create index if not exists inquiry_attachments_upload_status_idx
  on public.inquiry_attachments (upload_status);
create index if not exists inquiry_attachments_scan_status_idx
  on public.inquiry_attachments (scan_status);
create index if not exists inquiry_attachments_auth_expiry_idx
  on public.inquiry_attachments (authorization_expires_at);
create index if not exists inquiry_attachments_created_at_idx
  on public.inquiry_attachments (created_at);

-- ---------------------------------------------------------------------
-- (2) Atomic attachment association, folded into submit_inquiry.
--
-- The final POST /api/inquiries payload carries attachmentTokenHashes — the
-- server hashes the raw single-use tokens BEFORE calling this function, so no
-- raw token ever reaches the database (spec §11 "token hashed at rest"). Each
-- hash is resolved, row-locked, validated, bound to the final lead + real
-- submission, and consumed exactly once. Any failure RAISEs, which aborts the
-- whole submit_inquiry transaction — no partial association (spec §9).
--
-- Idempotent replay is preserved: the two early replay returns (steps 1 and 4)
-- exit before association, so a retried POST never re-consumes tokens or
-- duplicates timeline rows.
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
  v_token_hash    text;
  v_attachment    public.inquiry_attachments%rowtype;
begin
  -- (1) Idempotency replay.
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

  -- (2) Duplicate-lead resolution by normalized email, row-locked.
  select id into v_existing_lead
    from public.leads
   where work_email = v_email
   for update;

  if v_existing_lead is not null then
    -- (3a) Non-destructive fill of blank approved fields only.
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
    -- (3b) New lead with server-owned defaults.
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

  -- (4) Submission row (unique submission_id = last-line idempotency defense).
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

  -- (5.5) Atomic attachment association (spec §9 / §11). One completed,
  -- unexpired, unconsumed, same-submission token per hash; consume exactly
  -- once and bind to the final lead + real submission. Any violation RAISEs
  -- and rolls back the entire inquiry.
  for v_token_hash in
    select value from jsonb_array_elements_text(coalesce(p_payload->'attachmentTokenHashes','[]'::jsonb))
  loop
    select * into v_attachment
      from public.inquiry_attachments
     where attachment_token_hash = v_token_hash
     for update;

    if not found then
      raise exception 'inquiry_attachment_token_invalid'
        using errcode = 'P0001', detail = 'no attachment for token';
    end if;
    if v_attachment.provisional_submission_id is distinct from v_submission_id then
      raise exception 'inquiry_attachment_wrong_submission'
        using errcode = 'P0001', detail = 'token belongs to a different submission';
    end if;
    if v_attachment.token_consumed_at is not null then
      raise exception 'inquiry_attachment_token_consumed'
        using errcode = 'P0001', detail = 'token already consumed';
    end if;
    if v_attachment.upload_status is distinct from 'completed' then
      raise exception 'inquiry_attachment_incomplete'
        using errcode = 'P0001', detail = 'attachment upload not completed';
    end if;
    if v_attachment.attachment_token_expires_at is null
       or v_attachment.attachment_token_expires_at <= now() then
      raise exception 'inquiry_attachment_token_expired'
        using errcode = 'P0001', detail = 'attachment token expired';
    end if;

    update public.inquiry_attachments
       set lead_id           = v_lead_id,
           submission_id      = v_submission_id,
           token_consumed_at  = now(),
           updated_at         = now()
     where id = v_attachment.id;

    insert into public.lead_timeline_events (lead_id, event_type, summary, actor, metadata)
    values (
      v_lead_id,
      'attachment_associated',
      'Attachment received: ' || coalesce(v_attachment.sanitized_filename, v_attachment.original_filename),
      'system',
      jsonb_build_object('submission_id', v_submission_id, 'attachment_id', v_attachment.id)
    );
  end loop;

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
-- Grants unchanged: anon/authenticated keep NO table and NO EXECUTE rights;
-- the service-role write path and SECURITY DEFINER owner remain the only
-- writers. (submit_inquiry EXECUTE grant is already set by 20260723.)
-- ---------------------------------------------------------------------

-- =====================================================================
-- ROLLBACK (manual):
--   -- Restore the placeholder submit_inquiry from 20260723 (re-run its
--   -- create-or-replace), then:
--   drop index  if exists public.inquiry_attachments_created_at_idx;
--   drop index  if exists public.inquiry_attachments_auth_expiry_idx;
--   drop index  if exists public.inquiry_attachments_scan_status_idx;
--   drop index  if exists public.inquiry_attachments_upload_status_idx;
--   drop index  if exists public.inquiry_attachments_provisional_idx;
--   drop index  if exists public.inquiry_attachments_submission_id_idx;
--   drop index  if exists public.inquiry_attachments_token_hash_key;
--   drop index  if exists public.inquiry_attachments_storage_key_key;
--   alter table public.inquiry_attachments
--     drop constraint if exists inquiry_attachments_byte_size_positive,
--     drop column if exists updated_at,
--     drop column if exists token_consumed_at,
--     drop column if exists attachment_token_expires_at,
--     drop column if exists attachment_token_hash,
--     drop column if exists upload_completed_at,
--     drop column if exists authorization_expires_at,
--     drop column if exists detected_mime_type,
--     drop column if exists sanitized_filename,
--     drop column if exists storage_bucket,
--     drop column if exists provisional_submission_id;
--   alter table public.inquiry_attachments rename column declared_mime_type to mime_type;
--   alter table public.inquiry_attachments rename column storage_key to stored_key;
-- =====================================================================
