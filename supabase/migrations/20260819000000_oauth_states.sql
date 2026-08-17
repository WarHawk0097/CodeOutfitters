-- CSRF/state storage for real OAuth providers (Master Goal Phase 2.5, Google OAuth
-- Foundation). integration_connections has no concept of an in-flight authorization
-- request — this table is that missing piece: one short-lived, single-use nonce per
-- connect attempt, bound to the CodeOutfitters user + workspace + provider that started
-- it, so the callback route can prove a redirect actually belongs to the session that
-- initiated it rather than trusting a client-supplied workspace_id.
--
-- No token material lives here — a nonce is not a secret credential, and even if a row
-- leaked it grants nothing beyond one already-expired authorization attempt.
--
-- Access model: unlike integration_connections, this table has no RLS policies at all.
-- It is written and read exclusively by server-side route handlers using the
-- service-role client (see lib/integrations/oauth-state.ts) — no session-bound client
-- ever touches it, so there is no per-user SELECT/INSERT a policy would need to grant.
-- RLS is still enabled per SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING discipline (defense in
-- depth if a future caller ever uses the authenticated client here by mistake), and the
-- explicit revoke below closes the same default-ACL hole documented in
-- 20260818000000_integration_connections.sql — authenticated's inherited default table
-- privileges are removed rather than assumed absent.

begin;

create table if not exists public.oauth_states (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      public.integration_provider not null,
  -- Cryptographically random, unguessable. Transmitted to the provider as the OAuth
  -- `state` parameter and echoed back verbatim on the redirect — the lookup itself is
  -- the tamper check: no matching row means "reject", there is no signature to verify.
  nonce         text not null unique,
  expires_at    timestamptz not null,
  -- Set atomically on first (and only) use — see consumeOAuthState's
  -- `where nonce = $1 and consumed_at is null` update, which makes a second use of the
  -- same nonce find no row rather than a race.
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.oauth_states enable row level security;

-- See header: authenticated's inherited default privileges are revoked, and no grant
-- (nor any policy) is added back — every access to this table goes through the
-- service-role client, which bypasses RLS and grants entirely.
revoke all on public.oauth_states from public, anon, authenticated;

commit;

-- Rollback (local only):
--   drop table public.oauth_states;
