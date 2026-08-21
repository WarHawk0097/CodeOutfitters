-- Meeting Intelligence Foundation (Master Goal — Google Meet + Meeting Intelligence,
-- Session 1). Provider-neutral domain: MEETING, MEETING ARTIFACT, TRANSCRIPT,
-- TRANSCRIPT ENTRY, AI MEETING INSIGHT. Google Meet is the first provider
-- (lib/meetings/providers/google-meet.ts); Zoom/Teams are future rows in
-- meeting_provider, not future migrations.
--
-- Linkage model: a meeting is created by a user linking an existing Google Meet space
-- to a Lead (no Calendar write scope exists yet, so CodeOutfitters cannot create Meet
-- spaces itself this phase — see lib/meetings/provider.ts's capabilities.conferenceCreation
-- = false for google_meet). connection_id ties the meeting to the integration_connections
-- row whose Google credential is used to read it — never a second, parallel credential
-- store.
--
-- Sync-only columns (status, provider_conference_record_id, last_synced_at, last_error
-- on meetings; all of meeting_artifacts/transcripts/transcript_entries/ai_meeting_insights)
-- are written exclusively by the service-role client from a server-side sync job — the
-- same "authenticated can never write the fields it doesn't own" discipline as
-- integration_connections.credential_ciphertext. authenticated's grants below are narrowed
-- accordingly; RLS SELECT is workspace-scoped throughout.
--
-- Hardened per SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING: every table gets an explicit
-- `revoke all ... from public, anon, authenticated` before any narrower grant is added
-- back, because this project's schema-level default ACLs grant `authenticated` broad
-- inherited privileges on every new table otherwise.

begin;

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  -- zoom/microsoft_teams are declared here and nowhere else: no adapter is registered
  -- for them (lib/meetings/registry.ts) and the link API accepts only 'google_meet',
  -- so they are storage-neutral placeholders, not a claim that either provider works.
  -- Declaring them now is what makes the later provider a registry line rather than an
  -- enum migration against a table that already has rows.
  create type public.meeting_provider as enum ('google_meet', 'zoom', 'microsoft_teams');
exception when duplicate_object then null; end $$;

-- Every value here must be a state a caller can act on honestly — no "unknown" catch-all
-- that hides which of insufficient_scope/revoked/provider_error/not_found actually
-- happened. See lib/meetings/sync.ts, which is the only writer of this column.
do $$ begin
  create type public.meeting_status as enum (
    'pending_sync',        -- linked, not yet synced against the provider
    'no_transcript',        -- conference record found, but no transcript artifact exists
                             -- (transcription was never started, or is not enabled for
                             -- this Workspace — the Meet API does not distinguish those
                             -- two causes, so this status does not either)
    'transcript_ready',     -- at least one transcript artifact reached FILE_GENERATED
                             -- and its entries have been fetched
    'not_found',             -- the provider has no conference record for this space
                             -- (never met, or past the ~30-day retention window)
    'insufficient_scope',    -- the owning connection lacks a granted scope this call needs
    'revoked',                -- the owning connection's credential no longer works and
                               -- cannot be refreshed
    'provider_error'          -- any other provider-side failure
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.meeting_artifact_type as enum ('transcript', 'recording');
exception when duplicate_object then null; end $$;

-- One row per distinct extraction the AI foundation produces for a meeting. Both
-- Phase 7 (Meeting Intelligence) and Phase 8 (Next Presentation Intelligence) are
-- 'insight_type' values on this one table rather than two near-identical tables — same
-- traceability/evidence shape, same RLS, same lifecycle.
do $$ begin
  create type public.ai_meeting_insight_type as enum ('meeting_intelligence', 'presentation_intelligence');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.meetings (
  id                            uuid primary key default gen_random_uuid(),
  workspace_id                  uuid not null references public.workspaces(id) on delete cascade,
  lead_id                       uuid references public.leads(id) on delete set null,
  provider                      public.meeting_provider not null,
  -- The integration_connections row whose credential reads this meeting. Never a
  -- second credential store — see header.
  connection_id                 uuid not null references public.integration_connections(id) on delete cascade,

  -- What the user supplied when linking (e.g. a Meet space id like "spaces/abc123",
  -- parsed from a pasted Meet link). Provider-opaque, never assumed to be a URL.
  provider_space_id             text not null,
  -- Resolved by sync, once a conference record is found for the space. Null until then.
  provider_conference_record_id text,

  title                         text,
  scheduled_start                timestamptz,

  status                        public.meeting_status not null default 'pending_sync',
  last_synced_at                 timestamptz,
  -- Safe, human-readable only — never a raw provider error body. See lib/meetings/sync.ts.
  last_error                    text,

  created_by                    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  constraint meetings_space_id_present check (length(btrim(provider_space_id)) > 0),
  -- One link per (workspace, provider, space) — relinking the same space is an update
  -- to the existing row, not a duplicate meeting.
  unique (workspace_id, provider, provider_space_id)
);

create index if not exists meetings_workspace_idx on public.meetings(workspace_id);
create index if not exists meetings_lead_idx on public.meetings(lead_id) where lead_id is not null;
create index if not exists meetings_connection_idx on public.meetings(connection_id);

create table if not exists public.meeting_artifacts (
  id                  uuid primary key default gen_random_uuid(),
  meeting_id          uuid not null references public.meetings(id) on delete cascade,
  -- Denormalized from the parent meeting by trigger (section 3) — never client-trusted.
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  artifact_type       public.meeting_artifact_type not null,
  -- The provider's resource name for this artifact (e.g. a Meet transcript resource
  -- name) — the dedupe key on re-sync.
  provider_artifact_id text not null,
  -- Provider-reported lifecycle text (e.g. Meet's STARTED/ENDED/FILE_GENERATED). Stored
  -- as free text, not an enum, so a new provider value never requires a migration.
  state               text,
  docs_url            text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (meeting_id, provider_artifact_id)
);

create index if not exists meeting_artifacts_meeting_idx on public.meeting_artifacts(meeting_id);
create index if not exists meeting_artifacts_workspace_idx on public.meeting_artifacts(workspace_id);

create table if not exists public.transcripts (
  id                  uuid primary key default gen_random_uuid(),
  meeting_artifact_id uuid not null unique references public.meeting_artifacts(id) on delete cascade,
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  state               text,
  transcript_start     timestamptz,
  transcript_end       timestamptz,
  fetched_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists transcripts_workspace_idx on public.transcripts(workspace_id);

create table if not exists public.transcript_entries (
  id                 uuid primary key default gen_random_uuid(),
  transcript_id      uuid not null references public.transcripts(id) on delete cascade,
  workspace_id       uuid not null references public.workspaces(id) on delete cascade,
  -- The provider's resource name for this entry — the dedupe key on re-sync (a
  -- transcript can be re-fetched; entries must not duplicate).
  provider_entry_id  text not null,
  -- Resolved from the provider's participant reference where possible; null (never
  -- fabricated) when the participant could not be resolved.
  speaker_label      text,
  sequence           integer not null,
  start_time         timestamptz,
  end_time           timestamptz,
  language_code      text,
  text               text not null,
  created_at         timestamptz not null default now(),
  unique (transcript_id, provider_entry_id)
);

create index if not exists transcript_entries_transcript_idx
  on public.transcript_entries(transcript_id, sequence);
create index if not exists transcript_entries_workspace_idx on public.transcript_entries(workspace_id);

create table if not exists public.ai_meeting_insights (
  id             uuid primary key default gen_random_uuid(),
  meeting_id     uuid not null references public.meetings(id) on delete cascade,
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  -- The transcript this extraction was grounded in. Null only if a future insight type
  -- is ever grounded in something other than a transcript — every current insight type
  -- requires one (enforced in lib/meetings/ai/*, not here, to keep the constraint
  -- reviewable in one place per Postgres convention already used in this schema).
  transcript_id  uuid references public.transcripts(id) on delete set null,
  insight_type   public.ai_meeting_insight_type not null,
  -- Which model produced this — never blank; every insight is attributable.
  model          text not null,
  -- The structured extraction itself. Every field inside is one of
  -- {value, confidence: 'confirmed'|'inferred'|'unknown', evidence: [...]} — shape
  -- owned and validated by lib/meetings/ai/schema.ts (zod), not by a DB constraint, so
  -- adding a field to the schema is an application change, not a migration.
  payload        jsonb not null,
  generated_at   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists ai_meeting_insights_meeting_idx
  on public.ai_meeting_insights(meeting_id, insight_type, generated_at desc);
create index if not exists ai_meeting_insights_workspace_idx on public.ai_meeting_insights(workspace_id);

-- ---------------------------------------------------------------------------
-- 3. Triggers — updated_at touch + workspace_id denormalization, same shape as
--    20260818000000_integration_connections.sql.
-- ---------------------------------------------------------------------------
create or replace function public.meetings_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meetings_touch_updated_at on public.meetings;
create trigger meetings_touch_updated_at
  before update on public.meetings
  for each row execute function public.meetings_touch_updated_at();

drop trigger if exists meeting_artifacts_touch_updated_at on public.meeting_artifacts;
create trigger meeting_artifacts_touch_updated_at
  before update on public.meeting_artifacts
  for each row execute function public.meetings_touch_updated_at();

create or replace function public.meeting_artifacts_set_workspace()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  select workspace_id into new.workspace_id from public.meetings where id = new.meeting_id;
  return new;
end;
$$;

drop trigger if exists meeting_artifacts_set_workspace on public.meeting_artifacts;
create trigger meeting_artifacts_set_workspace
  before insert on public.meeting_artifacts
  for each row execute function public.meeting_artifacts_set_workspace();

create or replace function public.transcripts_set_workspace()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  select workspace_id into new.workspace_id
    from public.meeting_artifacts where id = new.meeting_artifact_id;
  return new;
end;
$$;

drop trigger if exists transcripts_set_workspace on public.transcripts;
create trigger transcripts_set_workspace
  before insert on public.transcripts
  for each row execute function public.transcripts_set_workspace();

create or replace function public.transcript_entries_set_workspace()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  select workspace_id into new.workspace_id from public.transcripts where id = new.transcript_id;
  return new;
end;
$$;

drop trigger if exists transcript_entries_set_workspace on public.transcript_entries;
create trigger transcript_entries_set_workspace
  before insert on public.transcript_entries
  for each row execute function public.transcript_entries_set_workspace();

create or replace function public.ai_meeting_insights_set_workspace()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  select workspace_id into new.workspace_id from public.meetings where id = new.meeting_id;
  return new;
end;
$$;

drop trigger if exists ai_meeting_insights_set_workspace on public.ai_meeting_insights;
create trigger ai_meeting_insights_set_workspace
  before insert on public.ai_meeting_insights
  for each row execute function public.ai_meeting_insights_set_workspace();

revoke all on function public.meetings_touch_updated_at() from public, anon, authenticated;
revoke all on function public.meeting_artifacts_set_workspace() from public, anon, authenticated;
revoke all on function public.transcripts_set_workspace() from public, anon, authenticated;
revoke all on function public.transcript_entries_set_workspace() from public, anon, authenticated;
revoke all on function public.ai_meeting_insights_set_workspace() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS and grants
-- ---------------------------------------------------------------------------
alter table public.meetings             enable row level security;
alter table public.meeting_artifacts    enable row level security;
alter table public.transcripts          enable row level security;
alter table public.transcript_entries   enable row level security;
alter table public.ai_meeting_insights  enable row level security;

revoke all on public.meetings            from public, anon, authenticated;
revoke all on public.meeting_artifacts   from public, anon, authenticated;
revoke all on public.transcripts         from public, anon, authenticated;
revoke all on public.transcript_entries  from public, anon, authenticated;
revoke all on public.ai_meeting_insights from public, anon, authenticated;

-- meetings: authenticated may read everything, create a link, and edit the two fields
-- it owns (title, lead re-link). Every sync-derived column (status,
-- provider_conference_record_id, last_synced_at, last_error) is deliberately absent from
-- the update grant — only the service-role sync job (lib/meetings/sync.ts) may write
-- those, the same way credential_ciphertext is withheld from integration_connections.
grant select (
  id, workspace_id, lead_id, provider, connection_id, provider_space_id,
  provider_conference_record_id, title, scheduled_start, status, last_synced_at,
  last_error, created_by, created_at, updated_at
) on public.meetings to authenticated;

grant insert (
  workspace_id, lead_id, provider, connection_id, provider_space_id, title, scheduled_start
) on public.meetings to authenticated;

grant update (title, lead_id) on public.meetings to authenticated;

-- meeting_artifacts / transcripts / transcript_entries / ai_meeting_insights: read-only
-- for authenticated. Every row is produced by the service-role sync/AI job, never by a
-- direct client write.
grant select on public.meeting_artifacts   to authenticated;
grant select on public.transcripts         to authenticated;
grant select on public.transcript_entries  to authenticated;
grant select on public.ai_meeting_insights to authenticated;

drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings
  for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = (select auth.uid()));

drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists meeting_artifacts_select on public.meeting_artifacts;
create policy meeting_artifacts_select on public.meeting_artifacts
  for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists transcripts_select on public.transcripts;
create policy transcripts_select on public.transcripts
  for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists transcript_entries_select on public.transcript_entries;
create policy transcript_entries_select on public.transcript_entries
  for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists ai_meeting_insights_select on public.ai_meeting_insights;
create policy ai_meeting_insights_select on public.ai_meeting_insights
  for select to authenticated using (public.is_workspace_member(workspace_id));

commit;

-- Rollback (local only):
--   drop policy ai_meeting_insights_select on public.ai_meeting_insights;
--   drop policy transcript_entries_select on public.transcript_entries;
--   drop policy transcripts_select on public.transcripts;
--   drop policy meeting_artifacts_select on public.meeting_artifacts;
--   drop policy meetings_update on public.meetings;
--   drop policy meetings_insert on public.meetings;
--   drop policy meetings_select on public.meetings;
--   revoke all on public.ai_meeting_insights from authenticated;
--   revoke all on public.transcript_entries from authenticated;
--   revoke all on public.transcripts from authenticated;
--   revoke all on public.meeting_artifacts from authenticated;
--   revoke all on public.meetings from authenticated;
--   drop trigger ai_meeting_insights_set_workspace on public.ai_meeting_insights;
--   drop function public.ai_meeting_insights_set_workspace();
--   drop trigger transcript_entries_set_workspace on public.transcript_entries;
--   drop function public.transcript_entries_set_workspace();
--   drop trigger transcripts_set_workspace on public.transcripts;
--   drop function public.transcripts_set_workspace();
--   drop trigger meeting_artifacts_set_workspace on public.meeting_artifacts;
--   drop function public.meeting_artifacts_set_workspace();
--   drop trigger meeting_artifacts_touch_updated_at on public.meeting_artifacts;
--   drop trigger meetings_touch_updated_at on public.meetings;
--   drop function public.meetings_touch_updated_at();
--   drop table public.ai_meeting_insights;
--   drop table public.transcript_entries;
--   drop table public.transcripts;
--   drop table public.meeting_artifacts;
--   drop table public.meetings;
--   drop type public.ai_meeting_insight_type;
--   drop type public.meeting_artifact_type;
--   drop type public.meeting_status;
--   drop type public.meeting_provider;
