import { getSupabase } from './supabase'
import type { BookingFormData, SlotRecord, ActionResult } from './booking-types'

/**
 * Read available (unbooked) slots for a given month / year.
 *
 * Booking A (2026-06-16): replaced the direct
 *   `supabase.from('available_slots').select('*').gte('date', ...).lte(...).eq('is_booked', false).order(...).order(...)`
 * query with a call to the new RPC `public.get_available_slots(p_month int, p_year int)`.
 *
 * Why the RPC:
 *   The Security 3 migration (supabase/migrations/20260616_security3_rls.sql)
 *   enables RLS on `public.available_slots` and denies all to anon. The
 *   direct table SELECT the previous implementation used now fails with a
 *   403 / RLS violation. The fix is the Booking A RPC created in
 *   supabase/migrations/20260616_booking_a_get_available_slots.sql.
 *
 * Contract:
 *   - Input: month and year are strings (e.g. "6", "2026") to match the
 *     existing frontend call sites. The RPC accepts integers; we parse
 *     and validate here.
 *   - Returns the same SlotRecord shape the previous implementation
 *     returned (id, date, time). is_booked is intentionally not returned:
 *     the RPC filters for `is_booked = false` server-side, so every
 *     returned row is by definition unbooked.
 *   - On RPC error (4xx / 5xx / network / permissions), the function
 *     returns the Supabase error message in the `error` field. The
 *     frontend surfaces the error to the user.
 *   - The RPC is `SECURITY DEFINER` and grants `anon` `EXECUTE` only.
 *     No broad table SELECT is granted to anon.
 */
export async function getAvailableSlots(
  month: string,
  year: string
): Promise<ActionResult<SlotRecord[]>> {
  const m = parseInt(month, 10)
  const y = parseInt(year, 10)

  if (!Number.isFinite(m) || m < 1 || m > 12) {
    return { data: null, error: 'Invalid month. Expected 1..12.' }
  }
  if (!Number.isFinite(y) || y < 1970 || y > 2100) {
    return { data: null, error: 'Invalid year. Expected 1970..2100.' }
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_month: m,
      p_year: y,
    })

    if (error) return { data: null, error: error.message }

    const rows = (data ?? []) as Array<{ id: string; date: string; time: string }>

    return {
      data: rows.map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        is_booked: false,
      })),
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to load available slots',
    }
  }
}

/**
 * Create a booking (write path).
 *
 * Booking B (2026-06-16): this function was REPLACED WHOLESALE.
 *   - The previous implementation did a direct INSERT into `bookings`
 *     and a direct UPDATE on `available_slots` from the browser using
 *     the anon key. After Security 3 RLS is in place, both calls fail
 *     with 403 / RLS violations because anon cannot write to either
 *     table. The function is now a thin client-side wrapper that POSTs
 *     the booking payload to the Booking Worker
 *     (`workers/booking-reservation-worker.ts`).
 *   - The Worker holds the `service_role` key server-side and calls
 *     `supabase.rpc('reserve_slot', ...)` against the
 *     `public.reserve_slot(p_date date, p_time text, p_booking jsonb)
 *     returns uuid` RPC. The RPC is `SECURITY DEFINER`, holds a
 *     `SELECT ... FOR UPDATE` row lock on the matching
 *     `available_slots` row, and raises `slot_already_booked`
 *     (`P0001`), `slot_not_found` (`P0001`), or `23505` on conflict.
 *     A `UNIQUE (preferred_date, preferred_time)` constraint on
 *     `bookings` is the last-line defense against double-booking.
 *   - Anon is NEVER granted EXECUTE on `reserve_slot`. The browser
 *     cannot call `reserve_slot` directly. The browser only knows
 *     `NEXT_PUBLIC_BOOKING_WORKER_URL`. The Worker is the boundary.
 *   - The Worker optionally forwards the same payload to the n8n
 *     booking webhook (with the per-form secret) so the operator
 *     still gets the notification the Security 4 forms Worker used to
 *     handle. If `N8N_BOOKING_WEBHOOK_URL` is not bound to the
 *     Worker, the notification step is skipped (the booking still
 *     succeeds).
 *   - The function preserves the `ActionResult<null>` contract.
 *     - On 200: `{ data: null, error: null }`.
 *     - On 409 (`slot_already_booked` / `slot_not_found` /
 *       `slot_taken`): a human-readable "this slot is no longer
 *       available" message. The frontend should refetch the calendar
 *       and ask the user to pick another time.
 *     - On 400 (input validation / RPC 22023): the Worker's error
 *       message. The frontend surfaces it to the user.
 *     - On other errors: a generic "Failed to create booking" message.
 *
 * Do NOT add a direct path that bypasses the Worker. Do NOT call
 * `supabase.rpc('reserve_slot', ...)` from the browser. Do NOT
 * reintroduce the direct INSERT / UPDATE. The Worker is the only
 * path that touches `bookings` and `available_slots.is_booked` after
 * Security 3 RLS is in place.
 */
export async function createBooking(
  formData: BookingFormData
): Promise<ActionResult<null>> {
  const workerUrl = process.env.NEXT_PUBLIC_BOOKING_WORKER_URL
  if (!workerUrl) {
    return {
      data: null,
      error:
        'Booking is temporarily unavailable. Please email hello@codeoutfitters.com.',
    }
  }

  const timezone =
    formData.timezone ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : '') ||
    'America/New_York'

  const payload = {
    date: formData.preferredDate,
    time: formData.preferredTime,
    name: formData.name.trim(),
    email: formData.email.trim(),
    company: formData.company?.trim() || null,
    phone: formData.phone?.trim() || null,
    message: formData.message?.trim() || null,
    timezone,
  }

  let res: Response
  try {
    res = await fetch(workerUrl.replace(/\/+$/, '') + '/', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return {
      data: null,
      error:
        'Could not reach the booking service. Please email hello@codeoutfitters.com.',
    }
  }

  if (res.ok) {
    return { data: null, error: null }
  }

  let errBody: { error?: string; message?: string } | null = null
  try {
    errBody = (await res.json()) as { error?: string; message?: string }
  } catch {
    // fall through to status-based messaging
  }

  if (res.status === 409) {
    return {
      data: null,
      error:
        'This time slot is no longer available. Please pick another date or time.',
    }
  }
  if (res.status === 400) {
    return {
      data: null,
      error: errBody?.message || 'The booking form has invalid fields. Please review and try again.',
    }
  }
  return {
    data: null,
    error: 'Failed to create booking. Please try again or email hello@codeoutfitters.com.',
  }
}
