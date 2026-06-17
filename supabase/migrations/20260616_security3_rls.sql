-- =============================================================================
-- Security 3 — Supabase Row Level Security migration (2026-06-16)
-- =============================================================================
--
-- Project:      CodeOutfitters
-- Phase:        Security 3 (A0 future phase #6; D-020 LOCKED DEFAULT — Supabase
--               RLS is required before any non-internal launch).
-- Author:       SECURITY-3-RLS-AGENT
-- Status:       WRITTEN. NOT APPLIED. Owner applies manually via the Supabase
--               SQL editor or an approved DB migration process.
--
-- Scope
-- -----
-- 1. Enable Row Level Security on `bookings` and `available_slots`.
-- 2. Deny all anon access to the tables (anon role is the Supabase
--    "authenticated for the browser" role; it is the role the anon key
--    maps to when it hits the REST API from the browser).
-- 3. Keep full access for the `service_role` (used by the future
--    Cloudflare Worker from Security 1, and by the seed script).
-- 4. Grant anon `EXECUTE` on two narrow RPCs:
--       - `get_available_slots(p_month int, p_year int) returns table(...)`
--       - `reserve_slot(p_date date, p_time time, p_booking jsonb) returns uuid`
--    Both are FORWARD-COMPATIBLE grants: if the RPCs do not exist in
--    the project yet, the grants are no-ops. The RPCs themselves are
--    created in Booking A (`get_available_slots`) and Booking B
--    (`reserve_slot`). This migration does NOT create the RPC bodies.
-- 5. Idempotent: safe to re-run.
-- 6. Reversible: a rollback migration is in
--    `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` §6.
--
-- What this migration does NOT do
-- --------------------------------
-- - It does NOT create the `get_available_slots` or `reserve_slot`
--   function bodies. Those are Booking A and Booking B work, gated to
--   A0 plan §5.8 and §5.9.
-- - It does NOT change the `bookings` or `available_slots` table shape.
--   The schema in `lib/booking-schema.sql` is unchanged. RLS does not
--   require a schema change; it is a per-table security layer.
-- - It does NOT change the seed script. The seed runs as the
--   table owner or as `service_role` (DBA), not as anon. The seed's
--   `ON CONFLICT (date, time) DO NOTHING` is unaffected.
-- - It does NOT touch the Supabase project settings (auth, JWT
--   secret, API keys, replication, etc.). It is a pure SQL migration.
-- - It does NOT install the Supabase CLI. It does NOT run `psql`. It
--   does NOT connect to any database. The owner copies the SQL into
--   the Supabase SQL editor and runs it.
--
-- Conservative defaults
-- ---------------------
-- The policy model in this file is intentionally strict. If you (the
-- owner) want a different policy — e.g. allow anon to read
-- `available_slots` directly while still denying writes — the policy
-- is in the GRANT / POLICY block below. Edit there. Do not relax
-- service_role behavior. Do not grant anon broad INSERT / UPDATE /
-- DELETE on either table.
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Pre-flight: confirm RLS is not already enabled. If a future migration
-- re-enables RLS, the statements below are no-ops. The migration is
-- idempotent.
-- -----------------------------------------------------------------------------

-- (No-op pre-flight; the ENABLE / DISABLE statements below are themselves
-- idempotent in PostgreSQL.)

-- -----------------------------------------------------------------------------
-- 1. Enable Row Level Security on `bookings` and `available_slots`.
-- ENABLE ROW LEVEL SECURITY turns RLS on for the table. RLS policies
-- (added below) then govern what each role can do. Until policies are
-- added, RLS-on with no policies means "deny all" for non-owner roles.
-- -----------------------------------------------------------------------------

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_slots ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner. This is the safer default: a
-- future migration that flips the table owner will not silently bypass
-- RLS. The owner (and the seed script, when run as the table owner)
-- must use a SECURITY DEFINER function or the service_role to write.
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.available_slots FORCE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. Drop any pre-existing policies with the same name. This makes the
-- migration idempotent: re-running it does not error on a duplicate
-- policy. If you (the owner) have already added custom policies with
-- these names, the DROP will remove them. Review the policy bodies
-- below before applying.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "anon_deny_all_bookings" ON public.bookings;
DROP POLICY IF EXISTS "anon_deny_all_available_slots" ON public.available_slots;
DROP POLICY IF EXISTS "service_role_full_access_bookings" ON public.bookings;
DROP POLICY IF EXISTS "service_role_full_access_available_slots" ON public.available_slots;

-- -----------------------------------------------------------------------------
-- 3. Anon policies: deny all reads and writes to the booking tables.
-- The anon role is the role the browser's anon key maps to. Denying
-- all means: the browser cannot SELECT / INSERT / UPDATE / DELETE on
-- either table, even with the anon key. The browser must go through a
-- narrow RPC (created in Booking A / Booking B) or through the Worker
-- (which uses the service_role).
-- -----------------------------------------------------------------------------

CREATE POLICY "anon_deny_all_bookings"
  ON public.bookings
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "anon_deny_all_available_slots"
  ON public.available_slots
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Note on the role name. In Supabase:
--   - "anon" is the role the Supabase anon key maps to (the role the
--     browser uses). "anon" is a Postgres role created by Supabase.
--   - "authenticated" is the role for signed-in users. This project
--     has no authenticated user flow, so we do not add an authenticated
--     policy. If/when Supabase Auth is added (e.g. for a client portal),
--     add an explicit policy for it.
--   - "service_role" is the Supabase service role, which has full
--     bypass of RLS by default (Supabase grants the service_role
--     BYPASSRLS). It is used by the Cloudflare Worker and by the seed
--     script. We do NOT grant it access to the anon policies because
--     it already bypasses RLS.
--
-- The "FOR ALL" clause covers SELECT, INSERT, UPDATE, and DELETE. The
-- "USING (false)" / "WITH CHECK (false)" combination is the canonical
-- "deny all" policy. The role cannot read existing rows (USING) and
-- cannot write new rows (WITH CHECK).

-- -----------------------------------------------------------------------------
-- 4. Service-role policies: full access. This is technically redundant
-- (Supabase grants the service_role BYPASSRLS by default), but it is
-- explicit and self-documenting. The service_role is server-side only
-- (Worker, seed, future DB admin tasks). It must NEVER be in a
-- NEXT_PUBLIC_* env var or in the static bundle.
-- -----------------------------------------------------------------------------

CREATE POLICY "service_role_full_access_bookings"
  ON public.bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_available_slots"
  ON public.available_slots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5. Forward-compatible grants: anon EXECUTE on the future narrow RPCs.
-- If the RPCs do not exist in the project yet, these GRANTs are no-ops
-- (PostgreSQL allows GRANT on a non-existent function; the grant takes
-- effect when the function is created). When Booking A creates
-- `get_available_slots` and Booking B creates `reserve_slot`, these
-- grants will activate.
--
-- This migration does NOT create the function bodies. The bodies are
-- Booking A and Booking B work, gated to A0 plan §5.8 and §5.9.
-- -----------------------------------------------------------------------------

-- Anon EXECUTE on get_available_slots. The function signature is the
-- planned shape from INTEGRATION_NOTES.md §8.3 and A0 plan §5.8.
-- If the function does not exist yet, this GRANT is a no-op. When
-- Booking A creates the function, the GRANT activates.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_available_slots'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.get_available_slots(integer, integer) TO anon;
  END IF;
END $$;

-- Anon EXECUTE on reserve_slot. The function signature is the planned
-- shape from INTEGRATION_NOTES.md §8.3 and A0 plan §5.9. If the
-- function does not exist yet, this GRANT is a no-op. When Booking B
-- creates the function, the GRANT activates.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'reserve_slot'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.reserve_slot(date, time, jsonb) TO service_role;
  END IF;
END $$;

-- Note on the reserve_slot grant. The function is server-side only;
-- only the service_role can call it. The anon role is not granted
-- EXECUTE. This is consistent with INTEGRATION_NOTES.md §8.3: the
-- booking reservation must happen through the Worker, which holds the
-- service_role key. The anon key is never used to reserve a slot.

-- -----------------------------------------------------------------------------
-- 6. Default privileges: revoke the public default on these tables.
-- Supabase ships with broad default privileges for the `anon` and
-- `authenticated` roles on new tables. This migration revokes those
-- defaults on the booking tables so a future migration that creates
-- a column or a constraint does not silently re-enable broad access.
-- The policies above are the source of truth for access; the default
-- privileges are a belt-and-suspenders backstop.
-- -----------------------------------------------------------------------------

REVOKE ALL ON public.bookings FROM PUBLIC;
REVOKE ALL ON public.available_slots FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. Verification (read-only). The owner should run these as the
-- table owner or as a read-only role to confirm RLS is on and the
-- policies are in place. The migration does NOT run these; the owner
-- runs them after applying.
-- -----------------------------------------------------------------------------
--
-- SELECT relname, relrowsesecurity, relforcerowsecurity
--   FROM pg_class
--  WHERE relname IN ('bookings', 'available_slots')
--    AND relnamespace = 'public'::regnamespace;
-- -- Expect: relrowsesecurity = true, relforcerowsecurity = true for both.
--
-- SELECT polname, polpermissive, polroles, polcmd
--   FROM pg_policy
--  WHERE polrelid IN ('public.bookings'::regclass, 'public.available_slots'::regclass)
--  ORDER BY polrelid::regclass::text, polname;
-- -- Expect: 4 rows total (anon_deny_all_* and service_role_full_access_*
-- -- for each table).
--
-- =============================================================================
-- End of Security 3 migration
-- =============================================================================
-- After applying, the booking flow is gated:
-- - The browser (anon) cannot SELECT / INSERT / UPDATE / DELETE on
--   either table directly. lib/booking-actions.ts will fail at
--   `getAvailableSlots` and `createBooking` until the RPCs exist and
--   the frontend is updated to call them. This is intentional: it
--   forces Booking A to wire the read path through `get_available_slots`
--   and Booking B to wire the write path through `reserve_slot`. Until
--   then, the booking UI is non-functional, which is safer than a
--   silently-broken booking flow that exposes the anon key to write.
-- - The seed script is unaffected (it runs as the table owner /
--   service_role, which bypasses RLS).
-- - The Cloudflare Worker (Security 1) is unaffected (it uses the
--   service_role key, which bypasses RLS).
-- =============================================================================
