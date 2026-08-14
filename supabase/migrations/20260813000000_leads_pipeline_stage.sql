-- Pipeline stage persistence. Decision: Option A — leads.status IS the canonical
-- pipeline stage (PIPELINE_STAGES === CANONICAL_LEAD_STATUS_ORDER in
-- lib/demo/seed.ts, PipelineStage is a type alias of LeadStatus in
-- lib/demo/types.ts). No new column, no second enum. This migration adds the
-- one thing that did not already exist: an immutable stage-change history and
-- an atomic RPC to write a status change + its history row together.
--
-- PATCH /api/leads/[id] (20260812000000_leads_update.sql) already updates
-- status directly and is left as-is for owner-only patches. The pipeline
-- board's stage moves go through change_lead_stage() instead, because a
-- pipeline move must always produce exactly one history row — a bare
-- `update leads set status=...` has no way to guarantee that.

begin;

create table public.lead_stage_history (
  id             uuid        primary key default gen_random_uuid(),
  workspace_id   uuid        not null references public.workspaces(id),
  lead_id        uuid        not null references public.leads(id),
  from_stage     text,
  to_stage       text        not null check (to_stage in (
                    'New','Contacted','Appt Pending','Appt Scheduled',
                    'Discovery Done','Proposal Req.','Proposal Sent',
                    'Negotiation','Won','Lost','FUL')),
  actor_user_id  uuid        not null,
  change_source  text        not null default 'pipeline' check (change_source in ('pipeline', 'lead_detail', 'api')),
  reason         text,
  occurred_at    timestamptz not null default now()
);

create index lead_stage_history_lead_id_idx on public.lead_stage_history (lead_id, occurred_at desc);
create index lead_stage_history_workspace_id_idx on public.lead_stage_history (workspace_id);

alter table public.lead_stage_history enable row level security;

-- Read-only to clients. Rows are written exclusively by change_lead_stage()
-- below, which runs as the function owner (security definer) — no insert,
-- update or delete grant is given to `authenticated`, so a normal session
-- cannot forge, edit or erase a history row under any policy.
create policy lead_stage_history_select_members on public.lead_stage_history
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

grant select on public.lead_stage_history to authenticated;

-- Atomic stage change: validate lead -> validate target stage -> update
-- leads.status -> insert history -> return the updated lead + history id.
-- All-or-nothing because it is one plpgsql function body; any raised
-- exception rolls back the whole thing, including the row lock taken below.
--
-- security definer so it can write lead_stage_history (which grants no
-- write access to `authenticated`), but it is still called through the
-- normal authenticated Supabase client from the Next.js server — never a
-- service-role client — and re-checks workspace membership itself with
-- is_workspace_member(), since security definer bypasses RLS on the tables
-- it touches.
create or replace function public.change_lead_stage(
  p_lead_id       uuid,
  p_to_stage      text,
  p_reason        text default null,
  p_change_source text default 'pipeline'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor        uuid := auth.uid();
  v_workspace_id uuid;
  v_from_stage   text;
  v_history_id   uuid;
begin
  if v_actor is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  if p_to_stage not in (
    'New','Contacted','Appt Pending','Appt Scheduled',
    'Discovery Done','Proposal Req.','Proposal Sent',
    'Negotiation','Won','Lost','FUL'
  ) then
    raise exception 'invalid_stage' using errcode = 'P0001';
  end if;

  if p_to_stage in ('Won', 'Lost', 'FUL') and coalesce(trim(p_reason), '') = '' then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;

  -- Row-locked so two concurrent moves of the same lead serialize instead of
  -- one silently clobbering the other's history.
  select workspace_id, status into v_workspace_id, v_from_stage
    from public.leads
   where id = p_lead_id
     for update;

  if not found then
    raise exception 'lead_not_found' using errcode = 'P0002';
  end if;

  if v_workspace_id is null or not public.is_workspace_member(v_workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_from_stage = p_to_stage then
    return jsonb_build_object('lead_id', p_lead_id, 'from_stage', v_from_stage, 'to_stage', p_to_stage, 'changed', false);
  end if;

  update public.leads
     set status = p_to_stage, updated_at = now()
   where id = p_lead_id;

  insert into public.lead_stage_history (workspace_id, lead_id, from_stage, to_stage, actor_user_id, change_source, reason)
  values (v_workspace_id, p_lead_id, v_from_stage, p_to_stage, v_actor, coalesce(p_change_source, 'pipeline'), p_reason)
  returning id into v_history_id;

  return jsonb_build_object(
    'lead_id', p_lead_id,
    'history_id', v_history_id,
    'from_stage', v_from_stage,
    'to_stage', p_to_stage,
    'changed', true
  );
end;
$$;

revoke all on function public.change_lead_stage(uuid, text, text, text) from public;
grant execute on function public.change_lead_stage(uuid, text, text, text) to authenticated;

commit;

-- Rollback (local only):
--   begin;
--   revoke execute on function public.change_lead_stage(uuid, text, text, text) from authenticated;
--   drop function public.change_lead_stage(uuid, text, text, text);
--   drop policy lead_stage_history_select_members on public.lead_stage_history;
--   drop table public.lead_stage_history;
--   commit;
