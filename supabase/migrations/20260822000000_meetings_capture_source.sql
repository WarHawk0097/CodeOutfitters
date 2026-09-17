-- CodeOutfitters Meeting Capture — free transcription fallback.
--
-- Two transcript acquisition strategies, one canonical transcript model:
--   A. PROVIDER TRANSCRIPT  (existing — Google Meet API transcript artifact)
--   B. CODEOUTFITTERS CAPTURE (new — browser extension captures live captions)
--
-- Both normalize into the SAME meetings/meeting_artifacts/transcripts/
-- transcript_entries/AI pipeline. This migration is the smallest safe extension:
--
--   1. meetings.connection_id becomes nullable. A capture meeting has NO Google
--      connection (the browser extension captures captions directly; nothing is read
--      through a provider credential). The column keeps its meaning — "the connection
--      whose credential reads this meeting" — and is simply absent for capture meetings.
--      Every existing provider-linked row is untouched (was NOT NULL, stays populated).
--
--   2. meeting_artifacts gains capture_source, an enum distinguishing HOW the
--      transcript was acquired, orthogonal to meetings.provider (the meeting HOST:
--      google_meet) and artifact_type (transcript|recording). provider_transcript is the
--      default so every existing provider-synced artifact keeps its meaning with no
--      backfill. 'browser_audio' is declared now (storage-neutral, same convention as the
--      zoom/microsoft_teams meeting_provider values) so a later audio mode is a UI/logic
--      change, not another enum migration.
--
-- Deliberately NOT added:
--   * no meeting_capture_sessions table — the meeting_artifact row IS the durable capture
--     session: its state column holds active/paused/stopped, its id is the deterministic
--     session id, created_at/updated_at are started/stopped times, and transcript_entries
--     max(sequence) is the last-accepted watermark. A parallel session table would just be
--     a second source of truth for the same lifecycle.
--   * no new transcript tables — capture feeds the existing transcript_entries.
--   * no RLS/policy changes — meeting_artifacts RLS is already workspace-scoped; capture
--     writes go through the service-role client exactly like provider sync (the same
--     "authenticated can never write what it does not own" discipline as credential_
--     ciphertext). authenticated merely gains SELECT on the new column via the existing
--     table-level SELECT grant.
--   * no function/trigger changes — nothing here needs a new SECURITY DEFINER object.
--
-- Hardened per SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING: no new table means no new default
-- ACL surface; the only changed object is a column on a table whose grants are already
-- narrowed, and a NOT NULL relaxation (a constraint drop, not a privilege grant).

begin;

alter table public.meetings
  alter column connection_id drop not null;

do $$ begin
  create type public.meeting_capture_source as enum (
    'provider_transcript',
    'browser_captions',
    'browser_audio'
  );
exception when duplicate_object then null; end $$;

alter table public.meeting_artifacts
  add column capture_source public.meeting_capture_source not null default 'provider_transcript';

-- The new column inherits the table's existing SELECT grant to authenticated; nothing
-- extra is granted. No RLS change: meeting_artifacts_select already scopes by
-- is_workspace_member(workspace_id), which covers the new column.

commit;

-- Rollback (local only):
--   alter table public.meeting_artifacts drop column capture_source;
--   drop type public.meeting_capture_source;
--   alter table public.meetings alter column connection_id set not null;