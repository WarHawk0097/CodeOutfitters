# Database

CodeOutfitters uses Supabase for the booking flow. There is no other database. All access is REST, browser-side, with the Supabase anon key.

**Status (2026-06-16, post-Security 3; updated 2026-06-16 — runtime state record):** RLS is required before any non-internal launch. The Security 3 phase ships the SQL migration in `supabase/migrations/20260616_security3_rls.sql`. **The migration was applied and verified at runtime by the owner on 2026-06-16.** Runtime state: `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`. Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. Base schema in place; `public.available_slots` was seeded with 840 slots. **R-003 is closed end-to-end.** F-003 verified at the runtime level. Owner-side setup steps, rollback SQL, and a verification checklist are in `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md`.

**Status (2026-06-16, post-Booking A; updated 2026-06-16 — runtime state record):** The booking read path is wired through a narrow RPC, `public.get_available_slots(p_month int, p_year int)`. The RPC is created in `supabase/migrations/20260616_booking_a_get_available_slots.sql` (post-Repair 1 form; quotes `"time"` in `RETURNS TABLE`, in the inner `SELECT`, and in `ORDER BY`). **The migration was applied and verified at runtime by the owner on 2026-06-16 after Booking A Repair 1.** The **Booking A live grant repair** was also applied and verified at runtime by the owner: broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` were revoked; `authenticated` `EXECUTE` on `public.get_available_slots` was revoked; the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants were restored. Anon is granted `EXECUTE` on the function; anon is NOT granted `SELECT` on the underlying `available_slots` table. The booking calendar in `components/booking-calendar-custom.tsx` calls `getAvailableSlots(month, year)` for the displayed month and disables dates and times that are not in the response. The write path (`createBooking` in `lib/booking-actions.ts`) is intentionally unchanged and remains blocked until Booking B (the direct `INSERT` into `bookings` and the direct `UPDATE` on `available_slots.is_booked` now fail with 403 / RLS violations because Security 3 is in place). R-005 is **partially closed at the read path level** and **verified at the runtime level**; R-005 is fully closed only when Booking B ships. F-004 is **implemented for the read path** and **verified at the runtime level**; F-004 is fully closed only when Booking B ships. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking B-adjacent cleanup; do not start that repair unless explicitly approved. Owner-side setup steps, RPC contract, verification queries, and a rollback plan are in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`. **Booking B = next eligible implementation phase, but NOT started.** Blocked until ChatGPT Control Room issues the exact Booking B prompt.

## Tables

Source of truth: `lib/booking-schema.sql`. Run that file in the Supabase SQL editor against your project.

### `bookings`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK, default `gen_random_uuid()` | |
| `name` | TEXT, NOT NULL | |
| `email` | TEXT, NOT NULL | |
| `company` | TEXT, nullable | |
| `phone` | TEXT, nullable | |
| `message` | TEXT, nullable | |
| `preferred_date` | DATE, NOT NULL | |
| `preferred_time` | TEXT, NOT NULL | Free text (e.g. `9:00 AM`). Not a TIMESTAMP. |
| `timezone` | TEXT, default `'America/New_York'` | |
| `status` | TEXT, default `'pending'`, CHECK in `('pending','confirmed','cancelled')` | |
| `created_at` | TIMESTAMPTZ, default `now()` | |
| `updated_at` | TIMESTAMPTZ, default `now()` | |

### `available_slots`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK, default `gen_random_uuid()` | |
| `date` | DATE, NOT NULL | |
| `time` | TEXT, NOT NULL | e.g. `9:00 AM` |
| `is_booked` | BOOLEAN, default `false` | |
| (unique) | `(date, time)` | |

## Seed

The SQL file ships with a DO block that seeds 12 weeks of slots starting from `2026-05-18` (Monday), Mon–Fri only, 9:00 AM – 4:30 PM in 30-minute increments. The seed is idempotent (`ON CONFLICT (date, time) DO NOTHING`).

**The seed will exhaust.** There is no rotation script. To keep the calendar populated, re-run the seed (with a fresh start date) or build a rotation job. See `docs/ROADMAP.md`.

## Row Level Security

**Status (2026-06-16, post-Security 3):** RLS is required before any non-internal launch. The Security 3 phase ships the SQL migration in `supabase/migrations/20260616_security3_rls.sql`. **The migration was NOT applied in this phase.** The owner applies it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). Owner-side setup steps, rollback SQL, and a verification checklist are in `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md`.

**Policy model (target):**

- Anon: deny all (SELECT, INSERT, UPDATE, DELETE) on `bookings` and `available_slots`. The browser cannot touch the tables directly, even with the anon key in the bundle.
- Service role: full access. Used by the Cloudflare Worker (Security 1), the seed script, and future DB admin tasks. Must NEVER be in a `NEXT_PUBLIC_*` env var or in the static bundle.
- Authenticated: not granted. This project has no authenticated user flow today. If/when Supabase Auth is added, an explicit policy for `authenticated` is required.
- Forward-compatible grants: anon `EXECUTE` on the future `get_available_slots` RPC (created in Booking A); `service_role` `EXECUTE` on the future `reserve_slot` RPC (created in Booking B). The anon key is NEVER granted EXECUTE on `reserve_slot`. The reservation must happen server-side via the Worker, which holds the service_role key.

**Impact on current booking flow:** applying the migration will break the existing direct-table read/write path in `lib/booking-actions.ts`. The booking UI was already broken in a different way (R-005: the calendar does not call `getAvailableSlots`). The migration does not introduce a new breakage; it makes the existing breakage explicit and gated. The fix is Booking A (replace the direct call with a `get_available_slots` RPC) and Booking B (replace the direct insert/update with a `reserve_slot` RPC, called from the Worker). Until then, the booking flow is non-functional by design — direct browser writes are not trusted.

**Pre-Security-3 (legacy):** the shipped schema did not enable Row Level Security. The anon key had full read and write access to both tables from the browser. R-003 in `docs/SECURITY.md` documents the original risk. R-003 is **closed at the SQL level** as of Security 3 (the migration is on disk and ready to apply); R-003 is **deferred at the runtime level** until the owner applies the migration. After the owner applies the migration, R-003 is closed.

## How the app reads and writes

- **Reads (current, pre-Booking A):** `lib/booking-actions.ts` `getAvailableSlots(month, year)` queries `available_slots` for a date range, filters `is_booked = false`, and orders by date then time. **The current UI does not call this function** — see "Known issue" below. **After Security 3 is applied, this direct query is denied by RLS.** The fix is Booking A: replace the direct query with a `get_available_slots` RPC. The migration grants anon `EXECUTE` on the function as a forward-compatible grant; the function body is created in Booking A.
- **Reads (current, post-Booking A; applied and verified at runtime 2026-06-16):** `lib/booking-actions.ts` `getAvailableSlots(month, year)` calls `supabase.rpc('get_available_slots', { p_month, p_year })`. The RPC is `SECURITY DEFINER`, runs in the function owner's context, filters `is_booked = false` server-side, and returns only `id`, `date`, `"time"` ordered by date then time. Anon is granted `EXECUTE`; anon is NOT granted `SELECT` on `available_slots`. The function body is in `supabase/migrations/20260616_booking_a_get_available_slots.sql` (post-Repair 1 form; quotes `"time"`). The frontend `components/booking-calendar-custom.tsx` uses this RPC for the displayed month and disables dates / times that are not in the response. **The migration was applied and verified at runtime by the owner on 2026-06-16** after the on-disk migration was repaired to quote `"time"` (Booking A Repair 1). **The Booking A live grant repair was also applied and verified at runtime by the owner on 2026-06-16** — broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` were revoked; `authenticated` `EXECUTE` on `public.get_available_slots` was revoked; the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants were restored.
- **Writes (current, pre-Booking B):** `lib/booking-actions.ts` `createBooking(formData)` inserts into `bookings`, then UPDATEs `available_slots.is_booked = true` for the chosen `(date, time)`. The UPDATE is unconditional on the prior value, so two concurrent successful inserts can both flip the flag without any consistency guarantee. **Security 3 RLS is now in place (confirmed 2026-06-16); both calls are denied by RLS** with 403 / RLS violations. The fix is Booking B: replace the direct insert + update with a single `reserve_slot` RPC, called from the Worker with the service_role key. The Security 3 migration grants `service_role` `EXECUTE` on the function as a forward-compatible grant; the function body is created in Booking B. **Anon is never granted EXECUTE on `reserve_slot`.** **Booking A does NOT change the write path.** The `createBooking` function in `lib/booking-actions.ts` is intentionally unchanged in Booking A. The write path is non-functional by design until Booking B ships — direct browser writes are not trusted. The form's n8n POST to the forms Worker (Security 4) is unchanged and still works; the operator is notified via n8n.
- **Reads (target, post-Booking A — achieved 2026-06-16):** `supabase.rpc('get_available_slots', { p_month, p_year })` returns the same shape `lib/booking-actions.ts` returns. **This is the current state of the frontend code and the database as of 2026-06-16.**
- **Writes (target, post-Booking B):** the Worker calls `supabase.rpc('reserve_slot', { ... })` with the service_role key. The RPC is `SECURITY DEFINER` and runs in a single transaction: check `is_booked = false`, insert into `bookings`, update `available_slots.is_booked = true`. The browser never has the service_role key; the browser calls the Worker (Security 1) which forwards to the RPC. **Booking B = next eligible implementation phase, but NOT started.** Blocked until ChatGPT Control Room issues the exact Booking B prompt.

## Known issue: booking double-book

`components/booking-calendar-custom.tsx` does **not** call `getAvailableSlots`. Its `isAvailable(day)` only blocks past dates and weekends. It does not check `is_booked`. As a result, two visitors can pick the same `(date, time)` and the system will accept both — the second `UPDATE` simply overwrites the flag, and both rows exist in `bookings`.

**Status (2026-06-16, post-Booking A):** The calendar now calls `getAvailableSlots(month, year)` for the displayed month (RPC, `public.get_available_slots`, gated to the Security 3 forward-compatible anon `EXECUTE` grant). The date picker disables days with zero available slots; the time picker renders only the times actually available for the selected date. The read path is honest. The write path (`createBooking` → direct `INSERT` into `bookings` + direct `UPDATE` on `available_slots.is_booked`) is still non-transactional and is gated to Booking B. After Security 3 RLS is applied, the write fails with a 403 / RLS violation (which is the desired state — direct browser writes are not trusted). The full transactional reservation path is `reserve_slot` (Booking B), called from the Worker with the `service_role` key. R-005 is **partially closed at the read path level**; R-005 is **fully closed** only when Booking B ships. Not fixed in DOC-MEMORY-REPAIR.

## What is not in the database

- No users, no accounts, no roles.
- No proposals table. Proposals live in the admin's browser `localStorage`.
- No leads table. Leads flow through n8n.
- No analytics, no event log.
