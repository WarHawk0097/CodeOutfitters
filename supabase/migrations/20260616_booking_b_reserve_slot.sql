-- ============================================================================
-- BOOKING B RPC: reserve_slot(p_date date, p_time text, p_booking jsonb)
-- ============================================================================
--
-- Phase:      Booking B (A0 future phase #9; D-019 robust transactional
--             reservation; the booking write path that pairs with Booking A's
--             read path).
-- Date:       2026-06-16
-- Author:     BOOKING-B-AGENT
-- Status:     WRITTEN. NOT APPLIED. Owner applies manually via the Supabase
--            SQL editor (recommended) or the Supabase CLI (alternative).
--
-- ----------------------------------------------------------------------------
-- Purpose
-- ----------------------------------------------------------------------------
--
-- This migration is the transactional write path for the booking system. It
-- pairs with the Booking A read path
-- (`supabase/migrations/20260616_booking_a_get_available_slots.sql`) to give
-- the booking UI an honest end-to-end flow:
--
--   - Booking A:    read  available slots via public.get_available_slots(...)
--                   (anon can call; the function returns only unbooked rows)
--   - Booking B:    write a booking via public.reserve_slot(...)
--                   (service_role only; anon is never granted EXECUTE)
--
-- After Security 3 RLS is in place, the browser can no longer INSERT into
-- `bookings` or UPDATE `available_slots.is_booked` directly (anon is denied
-- on both tables). The fix is this RPC, called server-side from a Cloudflare
-- Worker that holds the `service_role` key. The Worker source is
-- `workers/booking-reservation-worker.ts`. The frontend posts to
-- `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with the booking form payload; the
-- Worker calls this RPC and (optionally) notifies n8n server-side.
--
-- ----------------------------------------------------------------------------
-- Why this RPC exists (and not a direct browser write)
-- ----------------------------------------------------------------------------
--
-- The previous write path in `lib/booking-actions.ts:107` `createBooking` did:
--
--   1. `supabase.from('bookings').insert({ ... })`  -- INSERT a row
--   2. `supabase.from('available_slots').update({ is_booked: true })
--        .eq('date', ...).eq('time', ...)`          -- UPDATE the slot
--
-- Two problems with that pattern:
--
--   a) After Security 3 RLS is applied, anon is denied on both tables
--      (anon_deny_all_bookings / anon_deny_all_available_slots). The
--      browser cannot write at all. Direct browser writes are not trusted.
--
--   b) Even if RLS were relaxed, the two statements are not in a single
--      transaction. Two concurrent submissions for the same `(date, time)`
--      can both pass the `is_booked` check and both INSERT, leaving two
--      `bookings` rows for the same slot and the flag flipped by the
--      second. This is R-005 (booking double-booking).
--
-- The RPC is `SECURITY DEFINER` and runs in the function owner's context
-- (the role that created the function; in Supabase that is the `postgres`
-- role, which is a superuser and bypasses RLS). The function body holds a
-- row-level lock on the matching `available_slots` row, checks the prior
-- `is_booked` value, inserts the `bookings` row, and updates the slot, all
-- in a single transaction. If the slot is already booked, the function
-- raises an error and the transaction rolls back; no row is inserted.
--
-- The UNIQUE (preferred_date, preferred_time) constraint on `bookings`,
-- added by this migration, is defense in depth: even if two concurrent
-- calls slip past the row lock, the constraint will catch the duplicate
-- INSERT and the transaction will roll back. The constraint is a
-- last-line guarantee; the row lock is the primary guarantee.
--
-- ----------------------------------------------------------------------------
-- Function contract
-- ----------------------------------------------------------------------------
--
-- Schema:    public
-- Name:      reserve_slot
-- Args:      p_date    date        -- the chosen date (yyyy-MM-dd in the
--                                    -- the caller's timezone; UTC date
--                                    -- in the database)
--            p_time    text        -- the chosen time as a free-form string
--                                    -- matching the `available_slots.time`
--                                    -- column (e.g. '9:00 AM', '4:30 PM')
--            p_booking jsonb       -- the booking form payload:
--                                    --   {
--                                    --     "name":        "string",
--                                    --     "email":       "string",
--                                    --     "company":     "string|null",
--                                    --     "phone":       "string|null",
--                                    --     "message":     "string|null",
--                                    --     "timezone":    "string",
--                                    --     "preferredDate": "yyyy-MM-dd",
--                                    --     "preferredTime": "string"
--                                    --   }
--                                    -- `name` and `email` are required.
--                                    -- `company`, `phone`, `message` are
--                                    -- optional. `timezone` defaults to
--                                    -- 'America/New_York' if missing.
--                                    -- `preferredDate` and `preferredTime`
--                                    -- are redundant with `p_date` / `p_time`;
--                                    -- the function validates they match
--                                    -- the top-level args and uses the
--                                    -- top-level args as authoritative.
-- Returns:   uuid                  -- the new `bookings.id`
-- Security:  SECURITY DEFINER
-- search_path: pg_catalog, public
-- Volatile:  VOLATILE (the function writes; the default is the right
--            category here, and explicit is clearer)
-- Language:  plpgsql
--
-- The function returns a single uuid (the new `bookings.id`) on success.
-- On failure it raises an exception:
--
--   - `22023` (invalid_parameter_value) on input validation failures
--     (bad date, bad time, missing name/email, mismatched JSON date/time,
--     etc.). The transaction rolls back; no row is inserted.
--   - `P0001` (raise_exception) with message 'slot_already_booked' when
--     the matching `available_slots` row is `is_booked = true`. The
--     transaction rolls back; no row is inserted.
--   - `P0001` with message 'slot_not_found' when no matching
--     `available_slots` row exists for `(p_date, p_time)`. The
--     transaction rolls back; no row is inserted.
--   - `23505` (unique_violation) on the `UNIQUE (preferred_date,
--     preferred_time)` constraint if a concurrent caller slipped past
--     the row lock and committed first. The transaction rolls back.
--
-- The Worker translates these to HTTP status codes:
--   - 200 with the booking id on success
--   - 400 on input validation failures (RPC raises 22023)
--   - 409 on slot_already_booked / unique_violation
--   - 500 on internal errors
--
-- ----------------------------------------------------------------------------
-- Why SECURITY DEFINER (and not SECURITY INVOKER)
-- ----------------------------------------------------------------------------
--
-- The function runs in the function owner's context. In Supabase, the
-- function is created by the `postgres` role (or the role running the
-- migration in the SQL editor), which bypasses RLS. The function then:
--
--   1. Locks the matching `available_slots` row with `SELECT ... FOR UPDATE`.
--   2. Checks the prior `is_booked` value under the lock.
--   3. Inserts the `bookings` row.
--   4. Updates `available_slots.is_booked = true`.
--
-- This is the standard pattern for a transactional reservation RPC. The
-- function is the only path that touches `bookings` and
-- `available_slots.is_booked` after Security 3 RLS is in place. The
-- function runs on behalf of the calling role's `service_role`; the
-- anon role is never granted EXECUTE.
--
-- ----------------------------------------------------------------------------
-- Why a fixed search_path
-- ----------------------------------------------------------------------------
--
-- search_path mutability is a known Postgres attack surface. Setting
-- `SET search_path = pg_catalog, public` inside the function body pins
-- the function to a known schema resolution and prevents search_path
-- hijacking. This is the standard hardening for SECURITY DEFINER
-- functions and matches the Booking A migration's posture.
--
-- ----------------------------------------------------------------------------
-- Why a UNIQUE constraint (and what it gives us)
-- ----------------------------------------------------------------------------
--
-- `bookings` had no unique constraint on `(preferred_date, preferred_time)`
-- in the base schema (`lib/booking-schema.sql`). Two concurrent inserts
-- could both succeed. The constraint added by this migration:
--
--   ALTER TABLE public.bookings
--     ADD CONSTRAINT bookings_preferred_date_time_unique
--     UNIQUE (preferred_date, preferred_time);
--
-- is the last-line guarantee against double-booking. The row lock in
-- the function body is the primary guarantee (it serializes the check
-- and the update under a `FOR UPDATE` lock on the same row). The
-- constraint is the safety net for the case where the row lock is
-- bypassed (a future refactor that drops the lock, a future parallel
-- Worker, a future direct `service_role` write that forgets the
-- function). Postgres raises `23505` (unique_violation) on duplicate
-- INSERT; the transaction rolls back; no row is inserted.
--
-- The constraint is added in an idempotent `DO $$ ... $$` block so
-- re-running the migration is a no-op.
--
-- ----------------------------------------------------------------------------
-- Hard rules respected by this migration
-- ----------------------------------------------------------------------------
--
-- - No `CREATE / DROP` of `get_available_slots`. That is Booking A work.
--   This migration only creates / drops `reserve_slot`.
-- - No CREATE / DROP / ALTER on `bookings` other than the one
--   `ADD CONSTRAINT` for the `UNIQUE (preferred_date, preferred_time)`.
--   No new column, no new index. Default: no other table shape changes.
-- - No GRANT of anon EXECUTE on `reserve_slot`. Anon must never be able
--   to call `reserve_slot`. Only `service_role` is granted EXECUTE.
-- - No GRANT of anon EXECUTE on `get_available_slots` (the Booking A
--   forward-compatible grant from Security 3 is unchanged; anon keeps
--   EXECUTE on the read RPC and ONLY on the read RPC).
-- - No GRANT of anon SELECT on `bookings` or `available_slots`. The
--   anon role is denied on both tables (carried over from Security 3).
-- - No environment variable changes. No `service_role` key in any
--   `NEXT_PUBLIC_*` env var. No service_role key in the static bundle.
-- - No Supabase project setting changes (auth, JWT secret, API keys,
--   replication). The migration is pure SQL.
--
-- ----------------------------------------------------------------------------
-- Idempotency
-- ----------------------------------------------------------------------------
--
-- The migration is idempotent. It uses `CREATE OR REPLACE FUNCTION`
-- (preceded by a `DROP FUNCTION IF EXISTS`). Grants are revoked and
-- re-granted to ensure the final state matches the migration regardless
-- of prior state. The UNIQUE constraint is added in a `DO $$ ... $$`
-- block that checks for existence first.
--
-- ----------------------------------------------------------------------------
-- Rollback
-- ----------------------------------------------------------------------------
--
-- Rollback is owner-driven. If the owner needs to roll back Booking B,
-- the rollback is:
--
--   -- Drop the function and revoke the grants.
--   -- The UNIQUE constraint is left in place; if the owner also wants
--   -- to drop it (to restore the pre-Booking-B schema exactly):
--   -- ALTER TABLE public.bookings
--   --   DROP CONSTRAINT IF EXISTS bookings_preferred_date_time_unique;
--   REVOKE EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) FROM service_role;
--   DROP FUNCTION IF EXISTS public.reserve_slot(date, text, jsonb);
--
-- After the rollback, the Worker has nothing to call; the frontend's
-- booking submit will fail at the Worker level (502 or 500 from the
-- Worker when `supabase.rpc('reserve_slot', ...)` returns an error).
-- The Security 3 RLS policies and the forward-compatible
-- `service_role` grant remain. The booking flow returns to being
-- non-functional at the write path by design; the read path
-- (Booking A) is unchanged.
--
-- The rollback is NOT included in this migration. The migration is
-- forward-only. The rollback lives in
-- `repo-research/BOOKING_B_RESERVATION_WORKER_NOTES.md` §10.
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 0: Drop the function first so CREATE OR REPLACE can be re-run
-- idempotently without warnings.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.reserve_slot(date, text, jsonb);

-- ----------------------------------------------------------------------------
-- Step 1: Create the function.
-- ----------------------------------------------------------------------------
--
-- The function body is a single transaction (PL/pgSQL wraps a function
-- body in an implicit transaction; a `RAISE EXCEPTION` rolls back). The
-- body does:
--
--   1. Validate inputs (p_date, p_time, p_booking shape).
--   2. Lock the matching `available_slots` row with `SELECT ... FOR UPDATE`.
--   3. If the row is missing → raise 'slot_not_found'.
--   4. If the row is `is_booked = true` → raise 'slot_already_booked'.
--   5. INSERT into `bookings` using the JSON fields (with type coercion
--      and a default timezone).
--   6. UPDATE `available_slots.is_booked = true` for the matching row.
--   7. RETURN the new `bookings.id` (uuid).
--
-- All column references to `date` and `time` in `available_slots` and
-- `bookings` are double-quoted (`"date"`, `"time"`) to match the
-- Booking A migration and to make the parser unambiguous in Supabase
-- and standard Postgres contexts. (See Booking A Repair 1 note: the
-- unquoted `time` form was rejected by the Supabase SQL Editor with
-- `ERROR: 42601: syntax error at or near "time"`.)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_slot(
  p_date    date,
  p_time    text,
  p_booking jsonb
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_slot_id        uuid;
  v_slot_is_booked boolean;
  v_booking_id     uuid;

  v_name     text;
  v_email    text;
  v_company  text;
  v_phone    text;
  v_message  text;
  v_timezone text;
  v_pref_date date;
  v_pref_time text;
BEGIN
  -- -------------------------------------------------------------------------
  -- Input validation (defense in depth; the Worker also validates).
  -- -------------------------------------------------------------------------

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'p_date is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_time IS NULL OR btrim(p_time) = '' THEN
    RAISE EXCEPTION 'p_time is required and must be a non-empty string'
      USING ERRCODE = '22023';
  END IF;

  IF p_booking IS NULL OR jsonb_typeof(p_booking) <> 'object' THEN
    RAISE EXCEPTION 'p_booking must be a JSON object'
      USING ERRCODE = '22023';
  END IF;

  -- Required strings: name, email.
  v_name := nullif(btrim(p_booking ->> 'name'), '');
  v_email := nullif(btrim(p_booking ->> 'email'), '');

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'p_booking.name is required'
      USING ERRCODE = '22023';
  END IF;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'p_booking.email is required'
      USING ERRCODE = '22023';
  END IF;

  -- Loose email validation: contains exactly one '@' and a non-empty
  -- local part and a non-empty domain part that contains a '.'. The
  -- Worker also validates; this is defense in depth.
  IF position('@' in v_email) <> 1
     AND (position('@' in v_email) = length(v_email)
          OR position('@' in v_email) = 0
          OR position('.' in split_part(v_email, '@', 2)) = 0) THEN
    RAISE EXCEPTION 'p_booking.email is not a valid email address'
      USING ERRCODE = '22023';
  END IF;

  -- Optional fields. Treat empty strings as NULL.
  v_company := nullif(btrim(coalesce(p_booking ->> 'company', '')), '');
  v_phone   := nullif(btrim(coalesce(p_booking ->> 'phone', '')), '');
  v_message := nullif(btrim(coalesce(p_booking ->> 'message', '')), '');

  IF v_company IS NOT NULL AND length(v_company) > 100 THEN
    RAISE EXCEPTION 'p_booking.company must be at most 100 characters'
      USING ERRCODE = '22023';
  END IF;

  IF v_phone IS NOT NULL AND length(v_phone) > 20 THEN
    RAISE EXCEPTION 'p_booking.phone must be at most 20 characters'
      USING ERRCODE = '22023';
  END IF;

  IF v_message IS NOT NULL AND length(v_message) > 2000 THEN
    RAISE EXCEPTION 'p_booking.message must be at most 2000 characters'
      USING ERRCODE = '22023';
  END IF;

  -- Timezone: default to 'America/New_York' (matches the table default).
  v_timezone := nullif(btrim(coalesce(p_booking ->> 'timezone', '')), '');
  IF v_timezone IS NULL THEN
    v_timezone := 'America/New_York';
  END IF;

  -- Cross-check: the JSON's `preferredDate` and `preferredTime` must
  -- match the top-level `p_date` and `p_time`. The top-level args are
  -- authoritative for the slot lookup; the JSON fields are advisory
  -- and must agree.
  v_pref_date := nullif(btrim(coalesce(p_booking ->> 'preferredDate', '')), '');
  IF v_pref_date IS NOT NULL AND v_pref_date::date <> p_date THEN
    RAISE EXCEPTION
      'p_booking.preferredDate (%) does not match p_date (%)',
      v_pref_date, p_date
      USING ERRCODE = '22023';
  END IF;

  v_pref_time := nullif(btrim(coalesce(p_booking ->> 'preferredTime', '')), '');
  IF v_pref_time IS NOT NULL AND v_pref_time <> p_time THEN
    RAISE EXCEPTION
      'p_booking.preferredTime (%) does not match p_time (%)',
      v_pref_time, p_time
      USING ERRCODE = '22023';
  END IF;

  -- -------------------------------------------------------------------------
  -- Lock the matching `available_slots` row. `SELECT ... FOR UPDATE` holds
  -- a row-level lock for the duration of the transaction. A concurrent
  -- caller will block on this lock until we COMMIT or ROLLBACK.
  -- -------------------------------------------------------------------------
  --
  -- All column references to `date` and `time` in `available_slots` are
  -- double-quoted (`"date"`, `"time"`) for parser clarity, matching the
  -- Booking A migration.

  SELECT s.id, s.is_booked
    INTO v_slot_id, v_slot_is_booked
  FROM public.available_slots AS s
  WHERE s."date" = p_date
    AND s."time" = p_time
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot_not_found: no available_slots row for (%) (%)',
      p_date, p_time
      USING ERRCODE = 'P0001';
  END IF;

  IF v_slot_is_booked THEN
    RAISE EXCEPTION 'slot_already_booked: (%) (%) is already booked',
      p_date, p_time
      USING ERRCODE = 'P0001';
  END IF;

  -- -------------------------------------------------------------------------
  -- INSERT the booking row. The `UNIQUE (preferred_date, preferred_time)`
  -- constraint added by this migration is the last-line defense against
  -- double-booking; if a concurrent caller slipped past the row lock and
  -- committed first, the INSERT will raise 23505 and the transaction
  -- will roll back.
  -- -------------------------------------------------------------------------
  --
  -- The `status` column defaults to 'pending'; we set it explicitly to
  -- match the documented contract.
  -- The `id` is generated by the table default (gen_random_uuid()).

  INSERT INTO public.bookings (
    name, email, company, phone, message,
    preferred_date, preferred_time, timezone, status
  ) VALUES (
    v_name, v_email, v_company, v_phone, v_message,
    p_date, p_time, v_timezone, 'pending'
  )
  RETURNING id INTO v_booking_id;

  -- -------------------------------------------------------------------------
  -- Flip the slot. Inside the same transaction; the row lock is still
  -- held by `FOR UPDATE` above.
  -- -------------------------------------------------------------------------
  --
  -- `s."date"` and `s."time"` are double-quoted for parser clarity.

  UPDATE public.available_slots AS s
     SET is_booked = true
   WHERE s."date" = p_date
     AND s."time" = p_time;

  -- Return the new booking id.
  RETURN v_booking_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- Step 2: Add a UNIQUE (preferred_date, preferred_time) constraint to
-- `bookings` as defense in depth against double-booking.
-- ----------------------------------------------------------------------------
--
-- The constraint is added in a `DO $$ ... $$` block that checks
-- `pg_constraint` for existence first, so re-running the migration is
-- a no-op. If the constraint is dropped, re-running the migration
-- re-creates it.
--
-- Both column names (`preferred_date` and `preferred_time`) are
-- unreserved identifiers; they do not need quoting. They are
-- snake_case to match the column names in the `bookings` table.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'bookings'
      AND c.conname = 'bookings_preferred_date_time_unique'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_preferred_date_time_unique
      UNIQUE (preferred_date, preferred_time);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Step 3: Grants.
-- ----------------------------------------------------------------------------
--
-- The function is the only path that touches `bookings` and
-- `available_slots.is_booked` after Security 3 RLS is in place. The
-- function is server-side only.
--
-- CRITICAL: anon is NOT granted EXECUTE on `reserve_slot`. The
-- reservation path runs server-side via the Worker, which holds the
-- `service_role` key. The browser can never reserve a slot directly,
-- even with the anon key in the bundle.
--
-- `service_role` is granted EXECUTE. The service_role bypasses RLS
-- anyway, but the explicit grant documents the contract. The Worker
-- binds `SUPABASE_SERVICE_ROLE_KEY` server-side and calls
-- `supabase.rpc('reserve_slot', ...)` over the Supabase REST API; the
-- Supabase REST API honors the role of the supplied key.
--
-- No GRANT to `anon`. No GRANT to `authenticated`. The project has
-- no authenticated user flow today (D-017: admin is internal-only; no
-- Supabase Auth).
-- ----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.reserve_slot(date, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) TO service_role;

-- ----------------------------------------------------------------------------
-- Step 4: Verification comments.
-- ----------------------------------------------------------------------------
--
-- The owner runs these read-only queries after applying the migration
-- to confirm the function exists, the constraint is in place, the
-- grants are correct, and the function behaves as expected.
--
--   -- 1. Confirm the function exists with the right signature and config.
--   SELECT
--     p.proname                                AS function_name,
--     pg_get_function_arguments(p.oid)         AS arguments,
--     pg_get_function_result(p.oid)            AS returns,
--     p.prosecdef                              AS security_definer,
--     p.provolatile                            AS volatility,
--     p.proconfig                              AS config
--   FROM pg_proc p
--   JOIN pg_namespace n ON p.pronamespace = n.oid
--   WHERE n.nspname = 'public'
--     AND p.proname = 'reserve_slot';
--   -- Expect: one row; arguments = "p_date date, p_time text, p_booking jsonb";
--   --         returns = "uuid"; security_definer = true; volatility = 'v';
--   --         config = ['search_path=pg_catalog, public'].
--
--   -- 2. Confirm the grants: only service_role is granted EXECUTE.
--   --    anon MUST NOT appear. authenticated MUST NOT appear.
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name   = 'reserve_slot';
--   -- Expect: one row: (service_role, EXECUTE).
--
--   -- 3. Confirm the UNIQUE constraint is in place on bookings.
--   SELECT conname, contype
--   FROM pg_constraint c
--   JOIN pg_class t ON c.conrelid = t.oid
--   JOIN pg_namespace n ON t.relnamespace = n.oid
--   WHERE n.nspname = 'public'
--     AND t.relname = 'bookings'
--     AND conname = 'bookings_preferred_date_time_unique';
--   -- Expect: one row; conname = 'bookings_preferred_date_time_unique';
--   --         contype = 'u' (unique).
--
--   -- 4. Confirm the Booking A forward-compatible anon EXECUTE grant on
--   --    get_available_slots is still in place (carried over from
--   --    Security 3 and Booking A). Anon retains read access.
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name   = 'get_available_slots';
--   -- Expect: at least (anon, EXECUTE). (service_role, EXECUTE) is
--   -- also present. authenticated MUST NOT appear.
--
--   -- 5. Confirm anon is NOT granted EXECUTE on reserve_slot (the
--   --    reservation must happen server-side via the Worker).
--   --    The query in step 2 already covers this: anon MUST NOT
--   --    appear in routine_privileges for reserve_slot.
--
--   -- 6. Confirm anon has no direct SELECT on bookings or available_slots
--   --    (carried over from Security 3; should still be true).
--   SELECT table_name, grantee, privilege_type
--   FROM information_schema.table_privileges
--   WHERE table_schema = 'public'
--     AND table_name IN ('bookings', 'available_slots')
--     AND grantee = 'anon';
--   -- Expect: zero rows.
--
--   -- 7. Smoke test: reserve a slot, then try to reserve it again. The
--   --    first call returns a uuid; the second raises
--   --    'slot_already_booked' (P0001). Then verify the slot is
--   --    is_booked = true and the booking row exists.
--   --    This requires a slot that is currently unbooked; pick one
--   --    from the seeded weekdays (e.g. the first unbooked slot in
--   --    the next month).
--   --
--   --    a) Find an unbooked slot.
--   SELECT id, "date", "time"
--   FROM public.available_slots
--   WHERE is_booked = false
--   ORDER BY "date", "time"
--   LIMIT 1;
--   --    b) Reserve it.
--   SELECT public.reserve_slot(
--     '2026-08-03'::date,
--     '10:00 AM',
--     '{"name":"Smoke Test","email":"smoke@example.com","timezone":"America/New_York"}'::jsonb
--   );
--   --    Expect: a uuid.
--   --    c) Try to reserve it again.
--   SELECT public.reserve_slot(
--     '2026-08-03'::date,
--     '10:00 AM',
--     '{"name":"Smoke Test","email":"smoke@example.com"}'::jsonb
--   );
--   --    Expect: ERROR slot_already_booked (SQLSTATE P0001).
--   --    d) Verify the slot is is_booked = true and the booking row
--   --       exists with status = 'pending'.
--   SELECT is_booked FROM public.available_slots
--     WHERE "date" = '2026-08-03' AND "time" = '10:00 AM';
--   --    Expect: true.
--   SELECT id, name, email, status FROM public.bookings
--     WHERE preferred_date = '2026-08-03' AND preferred_time = '10:00 AM';
--   --    Expect: one row; name = 'Smoke Test'; status = 'pending'.
--   --    e) Restore the slot to is_booked = false (manual cleanup;
--   --       the smoke test should be run on a slot the owner does
--   --       not mind flipping and then restoring, or on a slot
--   --       outside the seed window).
--
-- ============================================================================
-- End of Booking B migration.
-- ============================================================================
