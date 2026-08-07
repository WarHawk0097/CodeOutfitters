-- Command Center operations — the workspace activity log behind lib/activity/provider.ts.
--
-- NOT APPLIED by this change: the live activity plane resolves to `provider_required`
-- until this migration is deployed and an ActivityProvider is wired to it. The demo plane
-- never touches this table (or any Supabase request) at all.
--
-- Shape follows the workspace foundation in 20260727_command_center_workspaces.sql and the
-- task collection in 20260729020000_command_center_tasks.sql: RLS is the primary boundary,
-- membership is a row in workspace_memberships, and authorization never reads editable JWT
-- metadata. An event is visible only inside the workspace that owns it.
--
-- The three things a client must not be able to do, enforced in the database rather than in
-- application code:
--   * write an event into another workspace       -> RLS WITH CHECK on workspace_id
--   * claim to be somebody else                   -> actor_id defaults to auth.uid() and a
--                                                    trigger overwrites whatever was sent
--   * choose when something happened              -> occurred_at is set by the trigger from
--                                                    now(), not from the payload
--
-- Deliberately NOT created here: a proposal_versions table. There is no proposals table in
-- this schema yet, so a versions table would have nothing to reference and no writer; the
-- proposal activity screen states that it is not a diff viewer for the same reason. It
-- belongs to the release that lands proposals themselves.

-- ---------------------------------------------------------------------------
-- 1. Enums — the same value sets the TypeScript model uses (lib/activity/model.ts)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.activity_category as enum (
    'lead', 'task', 'meeting', 'proposal', 'communication', 'followUp', 'appointment', 'system'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_importance as enum ('critical', 'notable', 'routine');
exception when duplicate_object then null; end $$;

-- `demo_fixture` is absent on purpose: seeded demo history never reaches this table.
do $$ begin
  create type public.activity_source as enum (
    'user_action', 'provider', 'imported_history', 'system_derived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_visibility as enum ('internal', 'client_safe', 'restricted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_record_kind as enum (
    'lead', 'opportunity', 'meeting', 'proposal', 'task', 'followUp', 'appointment', 'email', 'workspace'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Metadata shape
--
-- A check constraint cannot contain a subquery, so the pair check lives in an immutable
-- function that the constraint calls. Keeping it in the database at all is deliberate: the
-- screens render metadata as labelled pairs and never as JSON, so a row that is not pairs
-- would have no honest rendering.
-- ---------------------------------------------------------------------------
create or replace function public.activity_metadata_is_pairs(p_metadata jsonb)
returns boolean language sql immutable set search_path = public as $$
  select jsonb_typeof(p_metadata) = 'array'
    and not exists (
      select 1 from jsonb_array_elements(p_metadata) as pair
      where jsonb_typeof(pair) <> 'object'
         or pair->>'label' is null
         or pair->>'value' is null
    );
$$;

revoke all on function public.activity_metadata_is_pairs(jsonb) from public;
grant execute on function public.activity_metadata_is_pairs(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Table
-- ---------------------------------------------------------------------------
create table if not exists public.activity_events (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  -- The operation that produced the event, e.g. 'task_completed'. Kept as text against the
  -- TypeScript union rather than a 60-value enum: the application adds event types far more
  -- often than it adds categories, and an enum ALTER is a migration for every one of them.
  event_type     text not null,
  category       public.activity_category   not null,
  importance     public.activity_importance not null default 'routine',
  source         public.activity_source     not null default 'user_action',
  visibility     public.activity_visibility not null default 'internal',
  -- Who did it. Null means the workspace itself did it (a scheduled job, a system rule).
  -- Never client-supplied: see activity_events_derive_actor below.
  actor_id       uuid references auth.users(id) on delete set null,
  actor_label    text not null default '',
  -- The record the event is about, and the record the timeline rolls it up to. lead_id is a
  -- real foreign key; the other record kinds have no tables yet, so they are carried as
  -- kind + id + the label that was true when the event was written.
  related_kind   public.activity_record_kind not null,
  related_id     text not null,
  related_label  text not null,
  parent_kind    public.activity_record_kind,
  parent_id      text,
  parent_label   text,
  lead_id        uuid references public.leads(id) on delete set null,
  summary        text not null,
  detail         text not null default '',
  -- Labelled pairs, not a free-form blob: [{"label": "New stage", "value": "Negotiation"}].
  -- The shape is checked here so a screen can render it without inventing a formatter.
  metadata       jsonb not null default '[]'::jsonb,
  -- Server-derived. The trigger below overwrites whatever a client sends.
  occurred_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),

  constraint activity_events_summary_present check (length(btrim(summary)) > 0),
  constraint activity_events_type_present check (length(btrim(event_type)) > 0),
  -- A parent is all three columns or none of them.
  constraint activity_events_parent_complete check (
    (parent_kind is null and parent_id is null and parent_label is null)
    or (parent_kind is not null and parent_id is not null and parent_label is not null)
  ),
  constraint activity_events_metadata_pairs check (public.activity_metadata_is_pairs(metadata))
);

-- The reads the application actually issues: a workspace timeline, one record's history
-- (including roll-ups), and the Overview's importance cut.
create index if not exists activity_events_workspace_idx on public.activity_events(workspace_id, occurred_at desc);
create index if not exists activity_events_related_idx   on public.activity_events(workspace_id, related_kind, related_id, occurred_at desc);
create index if not exists activity_events_parent_idx    on public.activity_events(workspace_id, parent_kind, parent_id, occurred_at desc)
  where parent_kind is not null;
create index if not exists activity_events_important_idx on public.activity_events(workspace_id, occurred_at desc)
  where importance <> 'routine';
create index if not exists activity_events_lead_idx      on public.activity_events(lead_id) where lead_id is not null;

-- ---------------------------------------------------------------------------
-- 4. Server-derived identity and time
--
-- This is the difference between an audit trail and a diary anyone can rewrite: the actor
-- and the instant are taken from the session and the database clock on every insert, so a
-- forged actor_id or a backdated occurred_at in the payload is discarded rather than trusted.
-- ---------------------------------------------------------------------------
create or replace function public.activity_events_derive_actor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.actor_id    := auth.uid();
  new.occurred_at := now();
  new.created_at  := now();
  return new;
end;
$$;

revoke all on function public.activity_events_derive_actor() from public;

drop trigger if exists activity_events_derive_actor on public.activity_events;
create trigger activity_events_derive_actor before insert on public.activity_events
  for each row execute function public.activity_events_derive_actor();

-- ---------------------------------------------------------------------------
-- 5. Authorization helper
--
-- Reuses public.is_workspace_member from 20260727_command_center_workspaces.sql. Membership
-- logic is not restated here: a second copy is a second thing to get wrong.
-- ---------------------------------------------------------------------------
create or replace function public.can_view_activity_event(p_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.activity_events e
    where e.id = p_event
      and public.is_workspace_member(e.workspace_id)
  );
$$;

revoke all on function public.can_view_activity_event(uuid) from public;
grant execute on function public.can_view_activity_event(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
alter table public.activity_events enable row level security;

-- anon gets nothing: no grant, no policy. service_role bypasses RLS server-side.
-- No update grant either — history that can be edited after the fact is not history.
grant select, insert on public.activity_events to authenticated;

drop policy if exists activity_events_select_members on public.activity_events;
create policy activity_events_select_members on public.activity_events
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- A member may record history in their own workspace only. The WITH CHECK is evaluated
-- against the row as written, so a client cannot plant an event in a workspace it does not
-- belong to by sending someone else's workspace_id.
drop policy if exists activity_events_insert_members on public.activity_events;
create policy activity_events_insert_members on public.activity_events
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

-- No update and no delete: no grant, no policy. An activity log that can be rewritten or
-- silently erased answers "what happened" with whatever somebody wanted to have happened.

-- Rollback (local only):
--   drop policy activity_events_insert_members on public.activity_events;
--   drop policy activity_events_select_members on public.activity_events;
--   revoke select, insert on public.activity_events from authenticated;
--   drop function public.can_view_activity_event(uuid);
--   drop trigger activity_events_derive_actor on public.activity_events;
--   drop function public.activity_events_derive_actor();
--   drop function public.activity_metadata_is_pairs(jsonb);
--   drop table public.activity_events;
--   drop type public.activity_record_kind; drop type public.activity_visibility;
--   drop type public.activity_source; drop type public.activity_importance;
--   drop type public.activity_category;
