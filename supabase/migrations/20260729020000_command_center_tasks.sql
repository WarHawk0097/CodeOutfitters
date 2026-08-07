-- Command Center operations — the workspace task collection behind lib/tasks/provider.ts.
--
-- NOT APPLIED by this change: the live task plane resolves to `provider_required`
-- until this migration is deployed and a TaskProvider is wired to it. The demo plane
-- never touches this table (or any Supabase request) at all.
--
-- Shape follows the workspace foundation in 20260727_command_center_workspaces.sql:
-- RLS is the primary boundary, membership is a row in workspace_memberships, and
-- authorization never reads editable JWT metadata. A task is visible, writable and
-- assignable only inside the workspace that owns it.

-- ---------------------------------------------------------------------------
-- 1. Enums — the same value sets the TypeScript model uses (lib/demo/types.ts)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.task_state as enum ('OPEN', 'WAITING', 'COMPLETED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('High', 'Medium', 'Low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_relation_kind as enum ('lead', 'opportunity', 'appointment', 'meeting', 'proposal', 'followUp');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  title          text not null,
  detail         text not null default '',
  -- The assignee. A task with no owner is a task nobody is doing, so this is not null.
  owner_id       uuid not null references auth.users(id) on delete restrict,
  created_by     uuid          references auth.users(id) on delete set null,
  state          public.task_state    not null default 'OPEN',
  priority       public.task_priority not null default 'Medium',
  due_date       date,
  -- Optional link back to the record the task came from. lead_id is a real foreign key;
  -- the other record kinds do not have tables yet, so they are carried as kind + id +
  -- the label that was true when the task was created.
  lead_id        uuid references public.leads(id) on delete set null,
  relation_kind  public.task_relation_kind,
  relation_id    text,
  relation_label text,
  waiting_on     text not null default '',
  completed_on   date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- The fields that must move together, enforced where it cannot be forgotten:
  -- a WAITING task names who it waits on, and only a COMPLETED task has a completion date.
  constraint tasks_waiting_named check (state <> 'WAITING' or length(btrim(waiting_on)) > 0),
  constraint tasks_completed_dated check ((state = 'COMPLETED') = (completed_on is not null)),
  -- A relation is all three columns or none of them.
  constraint tasks_relation_complete check (
    (relation_kind is null and relation_id is null and relation_label is null)
    or (relation_kind is not null and relation_id is not null and relation_label is not null)
  ),
  constraint tasks_title_present check (length(btrim(title)) > 0)
);

create index if not exists tasks_workspace_idx     on public.tasks(workspace_id);
create index if not exists tasks_workspace_own_idx on public.tasks(workspace_id, owner_id);
-- The three list views the workspace actually opens with: overdue, due today, upcoming.
create index if not exists tasks_open_due_idx      on public.tasks(workspace_id, due_date) where state <> 'COMPLETED';
create index if not exists tasks_lead_idx          on public.tasks(lead_id) where lead_id is not null;

create or replace function public.tasks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at before update on public.tasks
  for each row execute function public.tasks_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Authorization helper
-- ---------------------------------------------------------------------------
create or replace function public.can_view_task(p_task uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tasks t
    where t.id = p_task
      and public.is_workspace_member(t.workspace_id)
  );
$$;

revoke all on function public.can_view_task(uuid) from public;
grant execute on function public.can_view_task(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;

-- anon gets nothing: no grant, no policy. service_role bypasses RLS server-side.
grant select, insert, update on public.tasks to authenticated;

drop policy if exists tasks_select_members on public.tasks;
create policy tasks_select_members on public.tasks
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- A member may create work in their own workspace only, and may not plant a task in
-- someone else's: the WITH CHECK is evaluated against the row as written.
drop policy if exists tasks_insert_members on public.tasks;
create policy tasks_insert_members on public.tasks
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

-- Update stays inside the workspace on both sides, so a row cannot be moved out of a
-- workspace the caller belongs to into one they do not.
drop policy if exists tasks_update_members on public.tasks;
create policy tasks_update_members on public.tasks
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- No delete grant and no delete policy: the task contract completes tasks, it does not
-- erase them, and an operations history that can be silently deleted is not a history.

-- Rollback (local only):
--   drop policy tasks_update_members on public.tasks;
--   drop policy tasks_insert_members on public.tasks;
--   drop policy tasks_select_members on public.tasks;
--   revoke select, insert, update on public.tasks from authenticated;
--   drop function public.can_view_task(uuid);
--   drop trigger tasks_touch_updated_at on public.tasks;
--   drop function public.tasks_touch_updated_at();
--   drop table public.tasks;
--   drop type public.task_relation_kind; drop type public.task_priority; drop type public.task_state;
