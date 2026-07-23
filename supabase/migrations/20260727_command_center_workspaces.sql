-- Work Order F — Command Center data foundation: workspaces, memberships,
-- lead↔workspace association, SECURITY DEFINER authorization helpers, and RLS.
--
-- The database is the authoritative authorization boundary. Authorization never
-- depends on editable JWT metadata; it depends on rows in workspace_memberships.
-- RLS is the primary boundary; service_role keeps its WO-E least-privilege
-- grants and bypasses RLS server-side; public inquiry submission keeps flowing
-- through the existing submit_inquiry SECURITY DEFINER function.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.workspace_role as enum ('owner', 'admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.membership_status as enum ('active', 'invited', 'suspended');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id)        on delete cascade,
  role         public.workspace_role     not null default 'member',
  status       public.membership_status  not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists workspace_memberships_user_idx      on public.workspace_memberships(user_id);
create index if not exists workspace_memberships_workspace_idx on public.workspace_memberships(workspace_id);

-- Associate every dashboard-visible inquiry with exactly one workspace.
alter table public.leads add column if not exists workspace_id uuid references public.workspaces(id) on delete restrict;
create index if not exists leads_workspace_idx on public.leads(workspace_id);

-- ---------------------------------------------------------------------------
-- 3. Authorization helpers (SECURITY DEFINER; fixed search_path; PUBLIC revoked)
--    Definer rights bypass RLS, which is what breaks the membership-policy
--    recursion — a membership RLS policy can safely call is_workspace_member.
-- ---------------------------------------------------------------------------
create or replace function public.workspace_role_rank(p_role public.workspace_role)
returns int language sql immutable as $$
  select case p_role when 'owner' then 3 when 'admin' then 2 when 'member' then 1 else 0 end;
$$;

create or replace function public.is_workspace_member(p_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_memberships m
    where m.workspace_id = p_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_min_workspace_role(p_workspace uuid, p_min public.workspace_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_memberships m
    where m.workspace_id = p_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
      and public.workspace_role_rank(m.role) >= public.workspace_role_rank(p_min)
  );
$$;

create or replace function public.can_view_lead(p_lead uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.leads l
    where l.id = p_lead
      and l.workspace_id is not null
      and public.is_workspace_member(l.workspace_id)
  );
$$;

create or replace function public.can_view_attachment(p_attachment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.inquiry_attachments a
    join public.leads l on l.id = a.lead_id
    where a.id = p_attachment
      and l.workspace_id is not null
      and public.is_workspace_member(l.workspace_id)
  );
$$;

-- Download is stricter than view: only a completed, clean, associated object.
create or replace function public.can_download_attachment(p_attachment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.inquiry_attachments a
    join public.leads l on l.id = a.lead_id
    where a.id = p_attachment
      and a.lead_id is not null
      and a.upload_status = 'completed'
      and a.scan_status = 'clean'
      and l.workspace_id is not null
      and public.is_workspace_member(l.workspace_id)
  );
$$;

revoke all on function public.workspace_role_rank(public.workspace_role)          from public;
revoke all on function public.is_workspace_member(uuid)                            from public;
revoke all on function public.has_min_workspace_role(uuid, public.workspace_role)  from public;
revoke all on function public.can_view_lead(uuid)                                  from public;
revoke all on function public.can_view_attachment(uuid)                            from public;
revoke all on function public.can_download_attachment(uuid)                        from public;
grant execute on function public.workspace_role_rank(public.workspace_role)         to authenticated, service_role;
grant execute on function public.is_workspace_member(uuid)                           to authenticated, service_role;
grant execute on function public.has_min_workspace_role(uuid, public.workspace_role) to authenticated, service_role;
grant execute on function public.can_view_lead(uuid)                                 to authenticated, service_role;
grant execute on function public.can_view_attachment(uuid)                           to authenticated, service_role;
grant execute on function public.can_download_attachment(uuid)                       to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS — the primary boundary for dashboard reads
-- ---------------------------------------------------------------------------
alter table public.workspaces            enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.leads                 enable row level security;
alter table public.lead_form_submissions enable row level security;
alter table public.inquiry_attachments   enable row level security;

-- authenticated may read only; RLS filters to workspace membership. anon gets
-- nothing (no grant + no policy). service_role bypasses RLS entirely.
grant select on public.workspaces            to authenticated;
grant select on public.workspace_memberships to authenticated;
grant select on public.leads                 to authenticated;
grant select on public.lead_form_submissions to authenticated;
grant select on public.inquiry_attachments   to authenticated;

drop policy if exists workspaces_select_members on public.workspaces;
create policy workspaces_select_members on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

-- A user sees their own membership rows and those of workspaces they belong to.
drop policy if exists memberships_select_self_or_ws on public.workspace_memberships;
create policy memberships_select_self_or_ws on public.workspace_memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_workspace_member(workspace_id));

drop policy if exists leads_select_members on public.leads;
create policy leads_select_members on public.leads
  for select to authenticated
  using (workspace_id is not null and public.is_workspace_member(workspace_id));

drop policy if exists submissions_select_members on public.lead_form_submissions;
create policy submissions_select_members on public.lead_form_submissions
  for select to authenticated
  using (public.can_view_lead(lead_id));

drop policy if exists attachments_select_members on public.inquiry_attachments;
create policy attachments_select_members on public.inquiry_attachments
  for select to authenticated
  using (lead_id is not null and public.can_view_lead(lead_id));

-- Rollback (local only):
--   drop policy ... ; alter table ... disable row level security;
--   revoke select on ... from authenticated;
--   alter table public.leads drop column workspace_id;
--   drop function public.can_download_attachment(uuid); ... ; drop table
--   public.workspace_memberships; drop table public.workspaces;
--   drop type public.membership_status; drop type public.workspace_role;
