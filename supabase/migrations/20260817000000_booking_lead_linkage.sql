-- Booking -> Lead ingestion linkage.
--
-- Closes the Phase 1 gap: a successful booking never touched public.leads.
-- bookings/available_slots predate the workspace/CRM model entirely (no
-- lead_id, no workspace_id, no dedup) — confirmed by reading every migration
-- that has ever touched `bookings` (20260615 base schema through 20260617
-- reserve_slot; none reference `leads`). Absence is proven, not assumed.
--
-- Fix: extend reserve_slot()'s existing transactional boundary (it already
-- runs as one PL/pgSQL function = one transaction, service_role-only,
-- SECURITY DEFINER) to also resolve-or-create the Lead and link the booking
-- to it, atomically with the slot reservation. This mirrors submit_inquiry()
-- (20260814000000_leads_ingestion_workspace_fail_closed.sql) exactly:
-- fail-closed workspace lookup, row-locked email dedup, non-destructive
-- merge on match, plain insert on no-match, lead_timeline_events audit row.
-- submit_inquiry is the correct template (not createLead()'s naive insert)
-- because booking, like inquiry, is a public/anonymous/repeatable entry
-- point, not an authenticated dashboard action.
--
-- Dedup is deliberately global-by-email, same as submit_inquiry and the same
-- leads_work_email_key unique index — this replicates the documented,
-- accepted LEADS_DEDUP_WORKSPACE_SCOPE limitation rather than inventing a
-- different (and inconsistent) scope for booking. Not fixed here; out of
-- scope for this milestone.
--
-- No phone dedup: no canonical precedent exists anywhere in this codebase
-- (submit_inquiry only dedupes by email). Not invented here.
--
-- The external contract (reserve_slot's signature, return type, and the
-- Worker's request/response shape) is unchanged, so
-- workers/booking-reservation-worker.ts and its .dashboard.js mirror need
-- no edits and no redeploy.

-- ----------------------------------------------------------------------------
-- Step 1: bookings.lead_id — additive, nullable. Not backfilled: existing
-- rows (if any) predate this linkage and are left as-is, same caution
-- 20260812020000_leads_workspace_ingestion_fix.sql took for workspace_id.
-- New rows (below) always set it.
-- ----------------------------------------------------------------------------

alter table public.bookings
  add column if not exists lead_id uuid references public.leads(id) on delete restrict;

create index if not exists bookings_lead_id_idx on public.bookings (lead_id);

-- ----------------------------------------------------------------------------
-- Step 2: reserve_slot() — same signature/return type, extended body.
-- Ordering: slot lock/validate FIRST (unchanged), so a failed booking
-- (slot_not_found / slot_already_booked) never touches leads at all — no
-- orphan lead from a failed reservation attempt.
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

  v_workspace_id  uuid;
  v_lead_email    citext;
  v_lead_id       uuid;
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
  -- Resolve the Lead. Same shape as submit_inquiry(): fail-closed workspace
  -- lookup, row-locked email dedup, non-destructive merge on match, plain
  -- insert on no-match. Only reached once the slot is confirmed available,
  -- so a failed reservation never creates or touches a lead.
  -- -------------------------------------------------------------------------

  select id into v_workspace_id from public.workspaces where slug = 'codeoutfitters';

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'booking_workspace_missing'
      USING ERRCODE = 'P0001',
            DETAIL  = 'no workspace found for slug ''codeoutfitters''';
  END IF;

  v_lead_email := lower(btrim(v_email))::citext;

  SELECT id INTO v_lead_id
    FROM public.leads
   WHERE work_email = v_lead_email
   FOR UPDATE;

  IF v_lead_id IS NOT NULL THEN
    -- Existing lead: fill only blank fields, never touch status,
    -- assigned_owner, internal_notes, or pipeline stage.
    UPDATE public.leads l SET
      phone        = coalesce(l.phone, v_phone),
      workspace_id = coalesce(l.workspace_id, v_workspace_id),
      updated_at   = now()
    WHERE l.id = v_lead_id;
  ELSE
    -- New lead. Booking's single `name` field has no first/last split in
    -- the form; the whole name goes to first_name rather than guessing a
    -- split. business_name and workflow_description are NOT NULL on
    -- leads but optional on the booking form, so they get honest
    -- placeholders (matching createLead()'s `notes || ""` pattern for
    -- workflow_description).
    INSERT INTO public.leads (
      first_name, business_name, work_email, phone,
      workflow_description, source_page, workspace_id
    ) VALUES (
      v_name, coalesce(v_company, 'Not provided'), v_lead_email, v_phone,
      coalesce(v_message, ''), 'Booking', v_workspace_id
    )
    RETURNING id INTO v_lead_id;
  END IF;

  -- -------------------------------------------------------------------------
  -- INSERT the booking row, linked to the resolved lead. The
  -- `UNIQUE (preferred_date, preferred_time)` constraint is the last-line
  -- defense against double-booking; if a concurrent caller slipped past the
  -- row lock and committed first, the INSERT will raise 23505 and the
  -- transaction will roll back (including the lead insert/update above).
  -- -------------------------------------------------------------------------

  INSERT INTO public.bookings (
    name, email, company, phone, message,
    preferred_date, preferred_time, timezone, status, lead_id
  ) VALUES (
    v_name, v_email, v_company, v_phone, v_message,
    p_date, p_time, v_timezone, 'pending', v_lead_id
  )
  RETURNING id INTO v_booking_id;

  -- -------------------------------------------------------------------------
  -- Flip the slot. Inside the same transaction; the row lock is still
  -- held by `FOR UPDATE` above.
  -- -------------------------------------------------------------------------

  UPDATE public.available_slots AS s
     SET is_booked = true
   WHERE s."date" = p_date
     AND s."time" = p_time;

  -- Source attribution / provenance. Same audit-trail convention
  -- submit_inquiry() uses (lead_timeline_events, written in-transaction by
  -- the SECURITY DEFINER RPC) — the Cloudflare Worker has no Next.js
  -- context and cannot call recordActivity()/activity_events.
  INSERT INTO public.lead_timeline_events (lead_id, event_type, summary, actor, metadata)
  VALUES (
    v_lead_id,
    'booking_received',
    'Booking requested for ' || p_date || ' ' || p_time,
    'system',
    jsonb_build_object('booking_id', v_booking_id)
  );

  -- Return the new booking id. Contract unchanged — the Worker's response
  -- parsing needs no changes.
  RETURN v_booking_id;
END;
$$;

-- Grants unchanged from 20260617_booking_b_reserve_slot.sql — restated
-- idempotently since CREATE OR REPLACE does not reset them.

REVOKE ALL ON FUNCTION public.reserve_slot(date, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) TO service_role;
