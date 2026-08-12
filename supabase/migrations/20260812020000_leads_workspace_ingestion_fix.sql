-- Fix: submit_inquiry() never set leads.workspace_id. That column was added
-- later, nullable, no default (20260727_command_center_workspaces.sql), and
-- that migration deliberately left submit_inquiry unmodified. Every lead
-- ingested through the live public inquiry form since then landed with
-- workspace_id = NULL and became permanently invisible under the
-- leads_select_members RLS policy (`workspace_id is not null and
-- is_workspace_member(workspace_id)`).
--
-- CodeOutfitters is single-tenant in production: exactly one workspace is
-- ever seeded, slug 'codeoutfitters' (20260729010000_owner_bootstrap.sql).
-- Both ingestion paths now assign it: new leads get it on insert, and an
-- existing lead with a still-NULL workspace_id gets it backfilled on merge
-- (defense-in-depth; does not touch any lead that already has a workspace).
--
-- Not backfilled here: rows already sitting in production with
-- workspace_id = NULL. That is a data change, not a schema/function change,
-- and requires explicit authorization before running against real customer
-- rows — tracked separately, not done by this migration.

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
  v_workspace_id  uuid;
begin
  select id into v_workspace_id from public.workspaces where slug = 'codeoutfitters';

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
    -- workspace_id is backfilled only if still null.
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
      workspace_id     = coalesce(l.workspace_id,     v_workspace_id),
      updated_at       = now()
    where l.id = v_lead_id;
  else
    -- (3b) New lead with server-owned defaults (status defaults to 'New').
    insert into public.leads (
      first_name, last_name, work_email, phone, business_name, job_title,
      website_url, company_size, service_interest, industry,
      workflow_description, desired_outcome, timeline, budget_range,
      source_page, source_path, campaign, workspace_id
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
      p_payload->'campaign',
      v_workspace_id
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
