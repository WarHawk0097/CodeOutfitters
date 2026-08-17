-- Integration Foundation (Phase 2, Master Goal). The shared connection model
-- Calendar (Phase 3) and Email (Phase 4) both extend — not either feature itself.
--
-- Shape follows 20260802000000_ai_conversations.sql: RLS is the boundary, membership
-- is a row in workspace_memberships (via is_workspace_member, defined in
-- 20260727_command_center_workspaces.sql), and authorization never reads editable JWT
-- metadata. workspace_id is re-checked in every WITH CHECK rather than trusted from a
-- default, because the caller (an API route) derives it from the session and passes it
-- explicitly — same reasoning as leads.workspace_id.
--
-- Token custody: this table never holds a usable secret. `credential_ciphertext` is
-- AES-256-GCM output from lib/integrations/crypto.ts, keyed by a server-only env var
-- (INTEGRATION_TOKEN_ENCRYPTION_KEY) that never reaches Postgres. A leaked row or a
-- leaked SELECT * is undecryptable without the process environment; column-level grants
-- below additionally stop `authenticated` from ever reading the column back, so the
-- database itself enforces "no token in a normal API response" independent of
-- application code getting it right.
--
-- Providers: only 'local_test' has a working adapter this phase (Master Goal Phase 2 =
-- "local/test providers"). 'google_calendar' and 'gmail' are reserved identifiers so
-- Phase 3/4 add an adapter module and a registry line, not a migration.

begin;

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.integration_provider as enum ('local_test', 'google_calendar', 'gmail');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.integration_connection_status as enum
    ('connected', 'disconnected', 'expired', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.integration_connection_event_type as enum
    ('connected', 'reconnected', 'refreshed', 'error', 'disconnected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.integration_connections (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.workspaces(id) on delete cascade,
  provider                public.integration_provider not null,
  status                  public.integration_connection_status not null default 'connected',

  -- The provider's own identifier for the connected account (e.g. a Google user id or
  -- a local/test fixture id) — never the workspace's own user id, which lives in
  -- created_by below.
  provider_account_id     text not null,
  -- Shown in a settings UI ("Connected as ada@example.com"); not treated as a secret,
  -- but never required — some providers/tests don't have one.
  provider_account_email  text,
  granted_scopes          text[] not null default '{}',

  -- Opaque. See header — decryptable only by the server process holding
  -- INTEGRATION_TOKEN_ENCRYPTION_KEY. Null once disconnected/revoked: revocation clears
  -- it rather than leaving a stale ciphertext no code path will ever use again.
  credential_ciphertext   text,
  credential_version      smallint not null default 1,

  connected_at            timestamptz not null default now(),
  refreshed_at            timestamptz,
  disconnected_at         timestamptz,
  -- Safe, human-readable only — never a raw provider error body, which can echo back
  -- request parameters. See lib/integrations/store.ts's toSafeError().
  last_error              text,

  created_by              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint integration_connections_account_present
    check (length(btrim(provider_account_id)) > 0),
  -- Disconnected means no usable credential — enforced in schema, not just in
  -- application code, so a bug can't leave a "disconnected" row a refresh call would
  -- still succeed against.
  constraint integration_connections_disconnected_has_no_credential
    check (status <> 'disconnected' or credential_ciphertext is null),
  constraint integration_connections_disconnected_has_timestamp
    check ((status = 'disconnected') = (disconnected_at is not null)),

  -- One row per (workspace, provider, external account). Reconnecting the same
  -- account is an upsert (see lib/integrations/store.ts), not a second row — the
  -- "deterministic duplicate" requirement lives here, not in application logic that
  -- could be bypassed by a second caller.
  unique (workspace_id, provider, provider_account_id)
);

create index if not exists integration_connections_workspace_provider_idx
  on public.integration_connections(workspace_id, provider);
create index if not exists integration_connections_workspace_status_idx
  on public.integration_connections(workspace_id, status);

-- Append-only audit trail. No token material ever — event rows describe what
-- happened, never with what secret.
create table if not exists public.integration_connection_events (
  id             uuid primary key default gen_random_uuid(),
  connection_id  uuid not null references public.integration_connections(id) on delete cascade,
  -- Denormalized for a single-table RLS check on this row (see policy below), but
  -- never client-trusted: the trigger in section 3 overwrites whatever the caller
  -- sent with the parent connection's actual workspace_id.
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  event_type     public.integration_connection_event_type not null,
  detail         text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists integration_connection_events_connection_idx
  on public.integration_connection_events(connection_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------------
create or replace function public.integration_connections_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists integration_connections_touch_updated_at on public.integration_connections;
create trigger integration_connections_touch_updated_at
  before update on public.integration_connections
  for each row execute function public.integration_connections_touch_updated_at();

-- Sets workspace_id from the parent connection rather than trusting the value a
-- caller inserted — the same "don't trust a denormalized identity column" rule
-- 20260812020000_leads_workspace_ingestion_fix.sql applied to leads.workspace_id.
create or replace function public.integration_connection_events_set_workspace()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  select workspace_id into new.workspace_id
    from public.integration_connections where id = new.connection_id;
  return new;
end;
$$;

drop trigger if exists integration_connection_events_set_workspace on public.integration_connection_events;
create trigger integration_connection_events_set_workspace
  before insert on public.integration_connection_events
  for each row execute function public.integration_connection_events_set_workspace();

-- ---------------------------------------------------------------------------
-- 4. Authorization helper
-- ---------------------------------------------------------------------------
create or replace function public.can_use_integration_connection(p_connection uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (
    select 1 from public.integration_connections c
    where c.id = p_connection and public.is_workspace_member(c.workspace_id)
  );
$$;

revoke all on function public.can_use_integration_connection(uuid) from public, anon;
grant execute on function public.can_use_integration_connection(uuid) to authenticated, service_role;
revoke all on function public.integration_connections_touch_updated_at() from public, anon, authenticated;
revoke all on function public.integration_connection_events_set_workspace() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS and grants — hardened explicitly per SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING;
--    every privilege below is stated, none assumed from a schema default.
-- ---------------------------------------------------------------------------
alter table public.integration_connections     enable row level security;
alter table public.integration_connection_events enable row level security;

-- Table-level revoke must include `authenticated`, not just public/anon: this
-- project's schema-level default ACLs (see the SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING
-- backlog item / the lead_stage_history incident) grant `authenticated` broad
-- inherited table privileges (INSERT/UPDATE/DELETE/TRUNCATE, all columns) on every new
-- table by default. A column-scoped GRANT below is additive — it does not remove that
-- inherited grant — so without this explicit revoke first, authenticated would still
-- be able to DELETE/TRUNCATE either table and UPDATE/INSERT columns never listed below.
revoke all on public.integration_connections     from public, anon, authenticated;
revoke all on public.integration_connection_events from public, anon, authenticated;

-- Column-scoped: `authenticated` can never SELECT credential_ciphertext, at the
-- database layer, independent of what any route handler returns.
grant select (
  id, workspace_id, provider, status, provider_account_id, provider_account_email,
  granted_scopes, connected_at, refreshed_at, disconnected_at, last_error,
  credential_version, created_by, created_at, updated_at
) on public.integration_connections to authenticated;

-- created_by, id, created_at, updated_at are never in this list: the row's identity
-- and audit columns are server/trigger/default-derived only, never caller-supplied.
grant insert (
  workspace_id, provider, status, provider_account_id, provider_account_email,
  granted_scopes, credential_ciphertext, credential_version, connected_at
) on public.integration_connections to authenticated;

-- workspace_id, provider, provider_account_id, created_by are absent: a connection
-- cannot be moved to another workspace, reassigned to another provider/account, or
-- have its audit owner rewritten by any UPDATE an authenticated caller can issue.
grant update (
  status, provider_account_email, granted_scopes, credential_ciphertext,
  credential_version, refreshed_at, disconnected_at, last_error
) on public.integration_connections to authenticated;

grant select, insert on public.integration_connection_events to authenticated;

drop policy if exists integration_connections_select on public.integration_connections;
create policy integration_connections_select on public.integration_connections
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists integration_connections_insert on public.integration_connections;
create policy integration_connections_insert on public.integration_connections
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = (select auth.uid()));

drop policy if exists integration_connections_update on public.integration_connections;
create policy integration_connections_update on public.integration_connections
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists integration_connection_events_select on public.integration_connection_events;
create policy integration_connection_events_select on public.integration_connection_events
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists integration_connection_events_insert on public.integration_connection_events;
create policy integration_connection_events_insert on public.integration_connection_events
  for insert to authenticated
  with check (public.can_use_integration_connection(connection_id));

commit;

-- Rollback (local only):
--   drop policy integration_connection_events_insert on public.integration_connection_events;
--   drop policy integration_connection_events_select on public.integration_connection_events;
--   drop policy integration_connections_update on public.integration_connections;
--   drop policy integration_connections_insert on public.integration_connections;
--   drop policy integration_connections_select on public.integration_connections;
--   revoke all on public.integration_connection_events from authenticated;
--   revoke all on public.integration_connections from authenticated;
--   drop function public.can_use_integration_connection(uuid);
--   drop trigger integration_connection_events_set_workspace on public.integration_connection_events;
--   drop function public.integration_connection_events_set_workspace();
--   drop trigger integration_connections_touch_updated_at on public.integration_connections;
--   drop function public.integration_connections_touch_updated_at();
--   drop table public.integration_connection_events;
--   drop table public.integration_connections;
--   drop type public.integration_connection_event_type;
--   drop type public.integration_connection_status;
--   drop type public.integration_provider;
