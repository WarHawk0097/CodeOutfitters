# BOOKING CORRECTNESS BRIEF

> The booking flow has a known data-integrity gap (R-005). This brief is input for PM1. **Do not change any booking code in the current batch.**

## 1. Current Booking Flow

1. Visitor opens `/book` (`app/(public)/book/page.tsx`).
2. `components/booking-calendar-custom.tsx` renders a 3-step wizard: Date → Time → Details.
3. **Step 1 — date picker.** `isAvailable(day)` returns `true` for any future weekday. **It does not call `getAvailableSlots` and does not read `available_slots.is_booked`.**
4. **Step 2 — time picker.** Renders 14 hard-coded `TIME_SLOTS` (9:00 AM through 4:30 PM, 30-min, Mon–Fri). No time is marked unavailable based on `available_slots`.
5. **Step 3 — details form.** Collects name, email, company, phone, message. Includes a honeypot. Validates client-side.
6. **Submit.** If honeypot is empty, POSTs to `NEXT_PUBLIC_N8N_WEBHOOK_URL` with `type: "booking"`. The Supabase write is **not** triggered by this component — see §2.
7. **Success state.** UI shows a confirmation. No retry, no error tracking.

## 2. Current Data Sources

- **Read:** none from Supabase. The UI does not call `lib/booking-actions.ts` at all.
- **Write (intended):** the submit handler only calls the n8n webhook. It does **not** insert into `bookings` or update `available_slots`.
- **Actual write path (the source of the gap):** the canonical write lives in `lib/booking-actions.ts` `createBooking`, but the UI never calls it. The UI calls the webhook, not the Supabase client.

> **This is a bigger gap than the docs previously stated.** The double-booking risk is real, but the booking data is not actually being written to Supabase from the UI in the current code. The Supabase path is wired but unused. A future agent should re-verify this — the original DOC-DISCOVERY finding assumed the UI called `createBooking`; on closer read it does not.

## 3. Double-Booking Risk

If the UI were wired to `createBooking`:

- The `INSERT` into `bookings` has no unique constraint on `(preferred_date, preferred_time)`. Two concurrent inserts succeed.
- The subsequent `UPDATE available_slots SET is_booked = true WHERE date = $date AND time = $time` is unconditional. Two concurrent updates both succeed; the flag is set to `true` regardless of prior value.
- Result: two rows in `bookings` for the same slot, and `is_booked` flipped by the second.

In the current code, this risk is partly masked by the fact that the UI does not call `createBooking` at all. The data goes only to n8n. The Supabase tables are populated by whoever runs the SQL seed, not by user submissions. This is a separate problem: bookings submitted via the UI are not persisted to Supabase at all.

## 4. available_slots.is_booked Gap

- `is_booked` exists in the schema.
- `getAvailableSlots(month, year)` exists in `lib/booking-actions.ts` and would return only un-booked slots.
- The UI calendar does not call it.
- Therefore, the calendar cannot represent the "this slot is already taken" state.

## 5. Supabase Insert Behavior

- `lib/booking-actions.ts createBooking` does:
  1. `INSERT INTO bookings (...)`.
  2. `UPDATE available_slots SET is_booked = true WHERE date = $date AND time = $time`.
- The `INSERT` has no constraint that prevents duplicates.
- The `UPDATE` is not conditional on the prior `is_booked` value.
- There is no transaction wrapper.

## 6. RLS Gap

- RLS is not enabled (R-006).
- Even if RLS were enabled, the current `createBooking` runs with the anon key from the browser. The anon role would need explicit INSERT / UPDATE grants.
- The seed SQL also does not grant anything to anon, but anon has full access today because RLS is off.

## 7. Future Fix Options

### A. Client reads `available_slots` and blocks booked slots

- **What:** `components/booking-calendar-custom.tsx` calls `getAvailableSlots` for the displayed month. Days with no remaining slots are visually disabled. Times with `is_booked = true` are removed from the picker.
- **Pros:** smallest change. No server work. UX is honest.
- **Cons:** still no transactional guarantee. A user could open two tabs and book the same slot between the read and the write.

### B. Supabase RPC reserves slot transactionally

- **What:** define a Postgres function `reserve_slot(p_date, p_time, p_booking)` that, in a single transaction, checks `is_booked = false`, inserts into `bookings`, and updates `available_slots`. Call it from the browser via `supabase.rpc('reserve_slot', ...)`.
- **Pros:** atomic. Single round trip. Honest data integrity.
- **Cons:** requires writing SQL and an RPC; requires RLS-aware grants; the anon key still has to be permitted to call the RPC (or the call must go through a server).

### C. n8n handles booking validation

- **What:** the UI posts to n8n; n8n calls Supabase via its own credentials; n8n returns success only if the reservation succeeded.
- **Pros:** keeps the anon key out of the booking path. n8n already owns form workflows.
- **Cons:** adds a network hop. n8n becomes a source of truth for booking state, which couples it tightly to the database. The UI now must wait for n8n's response.

### D. Server / Worker handles reservation

- **What:** the UI calls a Cloudflare Worker (or a server route) that holds a service-role Supabase key. The Worker performs the transactional reservation.
- **Pros:** cleanest. Anon key never touches `bookings`. The Worker can sign webhook events to n8n.
- **Cons:** requires a Worker / server. This is the same path recommended in `repo-research/SECURITY_HARDENING_BRIEF.md`.

### E. Manual review only

- **What:** the UI submits to n8n. The owner manually confirms each booking before flipping `is_booked` in Supabase.
- **Pros:** zero code change.
- **Cons:** does not scale. Defeats the purpose of a self-service calendar. Not acceptable for a paid funnel.

## 8. Recommended MVP Fix

**Recommendation: A + C combined.**

- A is the smallest change that gives the operator an honest UI. Days with no remaining slots are visually disabled. Times with `is_booked = true` are removed from the picker.
- C routes the actual write through n8n, which talks to Supabase with a service-role key. This removes the anon-key write path and gets us a step closer to the future robust fix.
- The UI now must wait for n8n's response and reflect success/failure. The current "instant success" UI is not honest.

This is a recommendation, not a decision.

## 9. Future Robust Fix

**Recommendation: B + D combined.**

- B defines a transactional `reserve_slot` RPC.
- D puts the call behind a Cloudflare Worker that holds a service-role key.
- The UI calls the Worker, which calls the RPC. The Worker can also notify n8n via a signed event for downstream workflows.
- This removes the anon-key write path, prevents double-booking at the database level, and keeps the operator's Supabase service key off the static bundle.

## 10. Acceptance Criteria

A future booking-correctness phase is complete when:

1. The booking UI calls `getAvailableSlots` for the displayed month and visually disables unavailable dates and times.
2. The booking submission persists to `bookings` and updates `available_slots.is_booked` through a single transactional path.
3. Two concurrent submissions for the same slot cannot both succeed.
4. The Supabase anon key cannot write to `bookings` or `available_slots` directly.
5. The booking flow degrades gracefully when Supabase is unreachable (the UI shows an error and tells the user to email).
6. `components/booking-calendar-custom.tsx` and `lib/booking-actions.ts` are updated and the changes are reflected in `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, and `repo-research/RISK_REGISTER.md`.
7. A manual test confirms: two simulated rapid submissions for the same slot result in exactly one `bookings` row and one `is_booked = true`.

## 11. Required Gate Before Implementation

- PM1 to recommend the path (MVP fix vs robust fix).
- ChatGPT Control Room to approve the path.
- A dedicated booking-correctness phase (post-PM1, post-approval).
- The fix must ship together with R-006 (RLS) and R-005 (R-002/R-004 if the Worker proxy is used).

**No booking code change in this batch.**
