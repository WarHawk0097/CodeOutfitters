-- ============================================================================
-- BOOKING A RPC: get_available_slots(p_month int, p_year int)
-- ============================================================================
--
-- Phase:      Booking A (A0 future phase #8; D-019b MVP read path).
-- Date:       2026-06-16
-- Author:     BOOKING-A-AGENT
-- Status:     WRITTEN. NOT APPLIED. Owner applies manually via the Supabase
--            SQL editor (recommended) or the Supabase CLI (alternative).
--
-- ----------------------------------------------------------------------------
-- Purpose
-- ----------------------------------------------------------------------------
--
-- This migration creates a single RPC, `public.get_available_slots`, that the
-- browser calls to read the booking availability calendar. The RPC is the only
-- allowed read path into `public.available_slots` for the anon role after the
-- Security 3 RLS migration is applied.
--
-- The Security 3 migration (`supabase/migrations/20260616_security3_rls.sql`)
-- denies all access to anon on `public.available_slots` (`USING (false)` on a
-- `FOR ALL` policy). It also grants anon `EXECUTE` on this function as a
-- forward-compatible grant, but the function body is created in this
-- migration. The migration is idempotent and reversible.
--
-- ----------------------------------------------------------------------------
-- Why this RPC exists (and not a direct SELECT)
-- ----------------------------------------------------------------------------
--
-- The previous code path in `lib/booking-actions.ts` did:
--
--   supabase
--     .from('available_slots')
--     .select('*')
--     .gte('date', startDate)
--     .lte('date', endDate)
--     .eq('is_booked', false)
--     .order('date', { ascending: true })
--     .order('time', { ascending: true })
--
-- After Security 3 is applied, anon cannot SELECT from `available_slots`
-- directly. The browser would receive an RLS / 403 error. The fix is to
-- replace the direct SELECT with a call to this RPC:
--
--   supabase.rpc('get_available_slots', { p_month, p_year })
--
-- The RPC is `SECURITY DEFINER` and runs in the function owner's context
-- (the role that created the function; in Supabase that is the `postgres`
-- role, which is a superuser and bypasses RLS). The function body filters
-- by `is_booked = false` and returns only the rows the calendar needs.
--
-- The function is granted `EXECUTE` to `anon` only. Anon cannot SELECT from
-- the underlying table; anon can only invoke the function. The function
-- returns a bounded result set (one month of slots, max 14 slots per
-- weekday x ~22 weekdays = ~308 rows).
--
-- ----------------------------------------------------------------------------
-- Function contract
-- ----------------------------------------------------------------------------
--
-- Schema:    public
-- Name:      get_available_slots
-- Args:      p_month int   -- 1..12
--            p_year  int   -- 1970..2100 (sanity bound; protects the table
--                            from a typo)
-- Returns:   TABLE(
--              id    uuid,
--              date  date,
--              time  text
--            )
-- Security:  SECURITY DEFINER
-- search_path: pg_catalog, public
-- Volatile:  STABLE (no writes; the function reads from a table that may
--            be appended to by the seed script or by future phases).
-- Language:  plpgsql
--
-- Ordering:  date ASC, time ASC. Matches the previous `lib/booking-actions.ts`
--            ordering. The frontend iterates by date then time.
--
-- Time column: text. Matches the `available_slots.time` column type. The
-- frontend formats it for display. The text is free-form (`'9:00 AM'`,
-- `'4:30 PM'`, etc.) per the existing seed script. No parsing in the RPC.
--
-- The column is named "time" and is **double-quoted everywhere it is
-- referenced** (`RETURNS TABLE`, the inner `SELECT`, the `ORDER BY`). The
-- bare identifier `time` is a reserved type name in PostgreSQL, and the
-- Supabase SQL Editor parser rejects an unquoted `time text` in a
-- `RETURNS TABLE` clause with `ERROR: 42601: syntax error at or near
-- "time"`. Quoting is the safe, portable form; it does not change the
-- returned column name (the response column is still `time` for the
-- client) but it does make the parser unambiguous in Supabase and
-- standard Postgres contexts. The same quoting is applied to the
-- selected column (`s."time" AS "time"`) and to the ORDER BY
-- (`s."time"`) so the function body parses consistently.
--
-- ----------------------------------------------------------------------------
-- Hard rules respected by this migration
-- ----------------------------------------------------------------------------
--
-- - No CREATE / DROP of `reserve_slot`. That is Booking B work.
-- - No ALTER on `bookings` or `available_slots`. The function reads only.
--   No new columns, no new constraints, no new indexes. Default: no table
--   shape changes.
-- - No GRANT of anon SELECT on `available_slots`. The anon role is denied
--   on the table (carried over from Security 3). Anon can only call this
--   function.
-- - No GRANT of anon EXECUTE on `reserve_slot`. Anon must never be able
--   to call `reserve_slot`. That is a future `service_role`-only RPC.
-- - No environment variable changes. No `service_role` key in any
--   `NEXT_PUBLIC_*` env var. No service_role key in the static bundle.
-- - No Supabase project setting changes (auth, JWT secret, API keys,
--   replication). The migration is pure SQL.
--
-- ----------------------------------------------------------------------------
-- Idempotency
-- ----------------------------------------------------------------------------
--
-- The migration is idempotent. It uses `CREATE OR REPLACE FUNCTION`, which
-- replaces the function body in place. Re-running the migration updates the
-- function body to match the current source. Grants are revoked and
-- re-granted to ensure the final state matches the migration regardless of
-- prior state.
--
-- ----------------------------------------------------------------------------
-- Rollback
-- ----------------------------------------------------------------------------
--
-- Rollback is owner-driven. If the owner needs to roll back Booking A,
-- the rollback is:
--
--   REVOKE EXECUTE ON FUNCTION public.get_available_slots(int, int) FROM anon;
--   DROP FUNCTION IF EXISTS public.get_available_slots(int, int);
--
-- The Security 3 RLS policies and the forward-compatible anon EXECUTE grant
-- remain. The anon role is still denied on `available_slots` (Security 3).
-- The booking flow returns to being non-functional by design.
--
-- The rollback is NOT included in this migration. The migration is
-- forward-only. The rollback lives in
-- `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §10.
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop the function first so CREATE OR REPLACE can be re-run idempotently
-- without warnings.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_available_slots(int, int);

-- ----------------------------------------------------------------------------
-- Create the function.
-- ----------------------------------------------------------------------------
--
-- Why SECURITY DEFINER:
--   The anon role is denied on `public.available_slots` by Security 3 RLS.
--   The function runs in the function owner's context. In Supabase, the
--   function is created by the `postgres` role (or the role running the
--   migration in the SQL editor), which bypasses RLS. The function then
--   filters rows by `is_booked = false` and returns only the columns the
--   frontend needs. Anon never sees `is_booked` directly; anon cannot run
--   arbitrary SELECTs on the table; anon can only call this function.
--
-- Why a fixed search_path:
--   search_path mutability is a known Postgres attack surface. Setting
--   `SET search_path = pg_catalog, public` inside the function body pins
--   the function to a known schema resolution and prevents search_path
--   hijacking. This is the standard hardening for SECURITY DEFINER
--   functions.
--
-- Why STABLE:
--   The function reads from `available_slots` but does not write. It does
--   not call any volatile functions. STABLE is the correct volatility
--   category. It allows the Postgres planner to call the function once per
--   query block if needed.
--
-- Why input validation:
--   `p_month` must be 1..12. `p_year` must be a sane calendar year
--   (1970..2100). Without validation, a typo or a hostile call could
--   scan the whole table (a date range that does not match any seeded
--   rows is fine; the date range `p_year - 9999` would also be fine
--   because it just returns zero rows). Validation is defense-in-depth.
--
-- Why a bounded date range:
--   The function filters by `date` between the first and last day of the
--   requested month. The calendar only ever asks for a single month. The
--   frontend never asks for "all slots." Bounding the date range is
--   defense-in-depth and matches the previous `lib/booking-actions.ts`
--   query shape.
--
-- Why returning only id, date, "time":
--   `is_booked` is always `false` (the function filters for that). The
--   frontend does not need `is_booked` in the response; the absence of
--   a slot in the response IS the "this slot is booked" signal. Returning
--   the same shape the previous `getAvailableSlots` returned (the same
--   columns the SlotRecord TypeScript type expects) is the cleanest
--   frontend integration.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_month int,
  p_year  int
)
RETURNS TABLE (
  id    uuid,
  date  date,
  "time" text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_first_day date;
  v_last_day  date;
BEGIN
  -- Input validation. Defense-in-depth. The function is callable by anon
  -- (per the forward-compatible Security 3 grant) and must not be a vector
  -- for unbounded scans or abuse.
  IF p_month IS NULL OR p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'p_month must be between 1 and 12 (got %)', p_month
      USING ERRCODE = '22023';
  END IF;

  IF p_year IS NULL OR p_year < 1970 OR p_year > 2100 THEN
    RAISE EXCEPTION 'p_year must be between 1970 and 2100 (got %)', p_year
      USING ERRCODE = '22023';
  END IF;

  -- Compute the first and last day of the requested month in UTC. Using
  -- date arithmetic on the integer month/year avoids timezone surprises.
  v_first_day := make_date(p_year, p_month, 1);
  v_last_day  := (v_first_day + interval '1 month - 1 day')::date;

  RETURN QUERY
  SELECT
    s.id,
    s.date,
    s."time" AS "time"
  FROM public.available_slots AS s
  WHERE s.is_booked = false
    AND s.date >= v_first_day
    AND s.date <= v_last_day
  ORDER BY s.date ASC, s."time" ASC;
END;
$$;

-- ----------------------------------------------------------------------------
-- Grants.
-- ----------------------------------------------------------------------------
--
-- Anon is granted EXECUTE. The function is the only path anon has to read
-- the availability calendar after Security 3. The function body filters
-- by `is_booked = false` and returns only the columns the frontend needs.
--
-- `service_role` is granted EXECUTE for parity. The service_role bypasses
-- RLS anyway, but the explicit grant documents the contract.
--
-- No GRANT to `authenticated`. The project has no authenticated user flow
-- today (D-017: admin is internal-only; no Supabase Auth). If Supabase
-- Auth is added later, an explicit grant for `authenticated` is required.
--
-- CRITICAL: anon is NOT granted EXECUTE on `reserve_slot` (which does not
-- exist yet — Booking B work). This is a hard rule. The reservation path
-- runs server-side via the Worker, which holds the `service_role` key.
-- ----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.get_available_slots(int, int) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_available_slots(int, int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_available_slots(int, int) TO service_role;

-- ----------------------------------------------------------------------------
-- Verification comments.
-- ----------------------------------------------------------------------------
--
-- The owner runs these read-only queries after applying the migration to
-- confirm the function exists, the grants are in place, and the function
-- returns unbooked slots for the requested month.
--
--   -- 1. Confirm the function exists with the right signature and config.
--   SELECT
--     p.proname AS function_name,
--     pg_get_function_arguments(p.oid) AS arguments,
--     pg_get_function_result(p.oid)    AS returns,
--     p.prosecdef                       AS security_definer,
--     p.provolatile                     AS volatility,
--     p.proconfig                       AS config
--   FROM pg_proc p
--   WHERE p.proname = 'get_available_slots'
--     AND p.pronamespace = 'public'::regnamespace;
--   -- Expect: one row, security_definer = true, volatility = 's',
--   --         config = ['search_path=pg_catalog, public'].
--
--   -- 2. Confirm the anon grant exists.
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name   = 'get_available_slots';
--   -- Expect: two rows: (anon, EXECUTE), (service_role, EXECUTE).
--
--   -- 3. Confirm anon has no direct SELECT on the table (carried over
--   --    from Security 3; should still be true).
--   SELECT grantee, privilege_type
--   FROM information_schema.table_privileges
--   WHERE table_schema = 'public'
--     AND table_name   = 'available_slots'
--     AND grantee      = 'anon';
--   -- Expect: zero rows.
--
--   -- 4. Smoke test: call the function for a seeded month and confirm
--   --    only unbooked slots come back, ordered by date then time.
--   SELECT date, time
--   FROM public.get_available_slots(6, 2026)
--   ORDER BY date, time
--   LIMIT 20;
--   -- Expect: rows for the seeded weekdays in 2026-06 (Mon-Fri, 9:00 AM
--   -- through 4:30 PM, 30-minute increments). No rows for past dates.
--
-- ============================================================================
-- End of Booking A migration.
-- ============================================================================
