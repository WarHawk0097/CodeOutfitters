-- Command Center — Saved Views, the workspace store behind lib/views/provider.ts.
--
-- NOT APPLIED by this change, locally or in production. The live Saved View plane resolves to
-- `provider_required` until this migration is deployed and a SavedViewProvider is wired to it,
-- and the demo plane never touches this table — or any Supabase request — at all. Browser-local
-- Saved Views (lib/views/store.ts) are device state and are never written here as if they were
-- account data.
--
-- Shape follows the workspace foundation in 20260727_command_center_workspaces.sql: RLS is the
-- boundary, membership is a row in workspace_memberships, and authorization never reads
-- editable JWT metadata. Owner identity and workspace both come from the authenticated session,
-- never from the request body — see the column defaults and the WITH CHECK clauses below.

-- ---------------------------------------------------------------------------
-- 1. Enums — the same value sets lib/views/model.ts uses
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.saved_view_scope as enum (
    'myWork', 'leads', 'pipeline', 'meetings', 'proposals', 'followUps', 'emailActivity'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- 'personal' is one person's own view. 'shared' is the workspace's. There is deliberately no
  -- third value: a view visible to "some" of a workspace would need an audience model that
  -- does not exist yet, and inventing one here would let the UI imply a boundary the database
  -- cannot hold.
  create type public.saved_view_visibility as enum ('personal', 'shared');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------------
create table if not exists public.saved_views (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  -- Who the view belongs to. Defaulted from the session rather than accepted from the client:
  -- a body-supplied owner id is a value the client can set to somebody else.
  owner_user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  scope          public.saved_view_scope not null,
  -- The filter state, as the scope's own field names. Stored as jsonb rather than columns
  -- because each scope filters on different fields; validated by the provider against
  -- SCOPE_DESCRIPTORS before it is written, and re-validated by sanitizeFilters on read, so a
  -- row hand-written here still cannot introduce a filter key a list will act on.
  filters        jsonb not null default '{}'::jsonb,
  search_text    text,
  sort_state     jsonb not null default '{}'::jsonb,
  column_state   jsonb not null default '{}'::jsonb,
  visibility     public.saved_view_visibility not null default 'personal',
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint saved_views_name_present check (length(btrim(name)) > 0),
  -- Matches SAVED_VIEW_NAME_MAX in lib/views/model.ts. A limit in one place only is a limit
  -- that holds until somebody writes through a different door.
  constraint saved_views_name_length check (length(name) <= 60),
  -- Objects, not arrays or scalars: `filters` is a field map and `sort_state` is a single
  -- {field, direction}. A JSON array here would pass a bare `jsonb not null` and then fail
  -- somewhere further away.
  constraint saved_views_filters_object check (jsonb_typeof(filters) = 'object'),
  constraint saved_views_sort_object check (jsonb_typeof(sort_state) = 'object'),
  constraint saved_views_columns_object check (jsonb_typeof(column_state) = 'object'),
  -- A search term belongs in `filters` under the scope's own `q` field, where it is subject to
  -- the same validation as every other filter value. This column exists for the provider that
  -- wants it separate; either way it is bounded.
  constraint saved_views_search_length check (search_text is null or length(search_text) <= 120)
);

-- One name per scope per owner, so "Save" cannot silently produce two views a person then has
-- to tell apart by nothing. Shared views are unique per workspace instead of per owner: two
-- admins must not both publish "Closing soon".
create unique index if not exists saved_views_personal_name_idx
  on public.saved_views(workspace_id, owner_user_id, scope, lower(name))
  where visibility = 'personal';

create unique index if not exists saved_views_shared_name_idx
  on public.saved_views(workspace_id, scope, lower(name))
  where visibility = 'shared';

-- One default per person per scope. Partial unique index rather than a trigger: the constraint
-- is declarative, so a second default cannot be created by a path that forgot to call the
-- trigger's helper.
create unique index if not exists saved_views_one_default_idx
  on public.saved_views(workspace_id, owner_user_id, scope)
  where is_default;

create index if not exists saved_views_workspace_scope_idx
  on public.saved_views(workspace_id, scope);

create or replace function public.saved_views_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  -- Ownership and workspace are not editable. Without this an UPDATE could move a row to
  -- another owner while still satisfying a WITH CHECK written against the old row.
  new.owner_user_id := old.owner_user_id;
  new.workspace_id := old.workspace_id;
  return new;
end;
$$;

drop trigger if exists saved_views_touch_updated_at on public.saved_views;
create trigger saved_views_touch_updated_at before update on public.saved_views
  for each row execute function public.saved_views_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Authorization helper
-- ---------------------------------------------------------------------------
-- Who may publish, edit or remove a view the whole workspace sees. Members keep their own
-- personal views; the shared list is a workspace-wide surface, so it takes a workspace-wide
-- role.
create or replace function public.can_manage_shared_views(p_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_min_workspace_role(p_workspace, 'admin');
$$;

revoke all on function public.can_manage_shared_views(uuid) from public;
grant execute on function public.can_manage_shared_views(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table public.saved_views enable row level security;

-- anon gets nothing: no grant, no policy. service_role bypasses RLS server-side.
grant select, insert, update, delete on public.saved_views to authenticated;

-- Read: your own views, plus everything the workspace has published. A personal view is
-- private to its owner even from an admin — it is a bookmark, not a record.
drop policy if exists saved_views_select on public.saved_views;
create policy saved_views_select on public.saved_views
  for select to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (owner_user_id = auth.uid() or visibility = 'shared')
  );

-- Insert: inside your own workspace, as yourself. Shared additionally needs the role. The
-- `owner_user_id = auth.uid()` term is what makes the column default load-bearing rather than
-- merely convenient.
drop policy if exists saved_views_insert on public.saved_views;
create policy saved_views_insert on public.saved_views
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and owner_user_id = auth.uid()
    and (visibility = 'personal' or public.can_manage_shared_views(workspace_id))
  );

-- Update: your own view, or a shared one if you may manage shared views. Both sides of the
-- check are constrained so a row cannot be moved between workspaces, and a personal view
-- cannot be promoted to shared without the role.
drop policy if exists saved_views_update on public.saved_views;
create policy saved_views_update on public.saved_views
  for update to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (
      owner_user_id = auth.uid()
      or (visibility = 'shared' and public.can_manage_shared_views(workspace_id))
    )
  )
  with check (
    public.is_workspace_member(workspace_id)
    and (visibility = 'personal' or public.can_manage_shared_views(workspace_id))
  );

-- Delete: your own, or a shared view if you may manage shared views. Unlike tasks, a saved
-- view has no history worth keeping — it is a saved filter, and a list of views nobody can
-- prune is a list nobody will use.
drop policy if exists saved_views_delete on public.saved_views;
create policy saved_views_delete on public.saved_views
  for delete to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (
      owner_user_id = auth.uid()
      or (visibility = 'shared' and public.can_manage_shared_views(workspace_id))
    )
  );

-- Rollback (local only):
--   drop policy saved_views_delete on public.saved_views;
--   drop policy saved_views_update on public.saved_views;
--   drop policy saved_views_insert on public.saved_views;
--   drop policy saved_views_select on public.saved_views;
--   revoke select, insert, update, delete on public.saved_views from authenticated;
--   drop function public.can_manage_shared_views(uuid);
--   drop trigger saved_views_touch_updated_at on public.saved_views;
--   drop function public.saved_views_touch_updated_at();
--   drop table public.saved_views;
--   drop type public.saved_view_visibility; drop type public.saved_view_scope;
