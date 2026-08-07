-- Fix two lints on public.reserve_slot(date,text,jsonb):
--
-- 1. v_pref_date was declared `date` but assigned the raw text expression
--    from p_booking ->> 'preferredDate' directly. PL/pgSQL's implicit
--    assignment cast made this "work" for valid dates, but a malformed
--    preferredDate (e.g. "not-a-date") raised Postgres's raw
--    "invalid input syntax for type date" (22007) instead of the
--    controlled 22023 error every other validation in this function
--    raises. Fixed by capturing the raw text in v_pref_date_raw, casting
--    explicitly inside a BEGIN/EXCEPTION block, and mapping a cast
--    failure to the same RAISE EXCEPTION ... USING ERRCODE = '22023'
--    contract as the rest of the function.
--
-- 2. v_slot_id was declared and assigned from the FOR UPDATE lock read,
--    but never read again — the later UPDATE keys off s."date" = p_date
--    AND s."time" = p_time (the same predicate as the lock), not the id.
--    Confirmed dead via `grep -n v_slot_id` on the prior definition
--    (only the declaration and the INTO assignment matched). Removed;
--    the row lock is unaffected since FOR UPDATE locks the row matched
--    by the WHERE clause regardless of which columns are selected.
--
-- Everything else — signature, return type, SECURITY DEFINER,
-- SET search_path, locking, INSERT/UPDATE targets, exception contract,
-- and the service_role-only EXECUTE grant — is unchanged.

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
  v_slot_is_booked boolean;
  v_booking_id     uuid;

  v_name     text;
  v_email    text;
  v_company  text;
  v_phone    text;
  v_message  text;
  v_timezone text;
  v_pref_date_raw text;
  v_pref_date     date;
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
  v_pref_date_raw := nullif(btrim(coalesce(p_booking ->> 'preferredDate', '')), '');
  IF v_pref_date_raw IS NOT NULL THEN
    BEGIN
      v_pref_date := v_pref_date_raw::date;
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
      RAISE EXCEPTION
        'p_booking.preferredDate (%) is not a valid date',
        v_pref_date_raw
        USING ERRCODE = '22023';
    END;

    IF v_pref_date <> p_date THEN
      RAISE EXCEPTION
        'p_booking.preferredDate (%) does not match p_date (%)',
        v_pref_date, p_date
        USING ERRCODE = '22023';
    END IF;
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

  SELECT s.is_booked
    INTO v_slot_is_booked
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

-- Grants are unaffected by CREATE OR REPLACE FUNCTION (signature is
-- unchanged), but re-stated defensively to match this repo's convention
-- of an explicit, idempotent grant beside every function definition.
GRANT EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) TO service_role;
