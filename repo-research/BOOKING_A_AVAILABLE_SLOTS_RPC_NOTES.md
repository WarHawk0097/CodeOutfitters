# Booking A — Available Slots RPC Notes (2026-06-16)

**Phase:** Booking A (A0 future phase #8; D-019b MVP read path).
**Status (2026-06-16; updated 2026-06-16 — runtime state record):** SQL migration written and frontend code updated. **SQL was applied and verified at runtime by the owner on 2026-06-16 after Booking A Repair 1 (quote `"time"`).** OpenCode did **not** apply the SQL; the owner did. **Booking A live grant repair was also applied and verified at runtime by the owner on 2026-06-16.** **A0 is approved by ChatGPT Control Room as of this phase (carried forward from Security 4, 2026-06-16).** **Security 3 RLS migration was also applied and verified at runtime by the owner on 2026-06-16.** R-003 is **closed end-to-end**; R-005 is **partially closed at the read path level** and **verified at the runtime level**; F-004 is **implemented for the read path** and **verified at the runtime level**. The booking UI is honest about availability for the first time. The write path (`createBooking` → `reserve_slot` RPC) is gated to **Booking B**. Direct browser writes remain blocked. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking B-adjacent cleanup; do not start that repair unless explicitly approved. **Booking B = next eligible implementation phase, but NOT started.** Blocked until ChatGPT Control Room issues the exact Booking B prompt.
**Author:** BOOKING-A-AGENT.

---

## 1. Current problem after Security 3

The Security 3 RLS migration (`supabase/migrations/20260616_security3_rls.sql`, 2026-06-16) enables RLS on `bookings` and `available_slots` and denies all access to anon on both tables. The previous direct-table read in `lib/booking-actions.ts`:

```ts
supabase
  .from('available_slots')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDate)
  .eq('is_booked', false)
  .order('date', { ascending: true })
  .order('time', { ascending: true })
```

will return a 403 / RLS violation once the Security 3 migration is applied. The booking calendar will not be able to read any availability rows from the browser. The fix is Booking A: replace the direct SELECT with a call to a narrow RPC, `get_available_slots`, that anon is allowed to invoke but that filters server-side and returns only the columns the calendar needs.

Before Security 3 RLS is applied, the previous code path works because RLS is off. The Booking A RPC works in both states (with or without RLS), because it is `SECURITY DEFINER` and runs in the function owner's context. The recommended order is: apply Security 3, then apply Booking A. If the owner prefers to apply Booking A first, the calendar will continue to work; applying Security 3 after Booking A is the correct handoff.

The forward-compatible Security 3 grant on `get_available_slots` (anon `EXECUTE`) is a no-op until the function body is created in Booking A. After Booking A ships and Security 3 is applied, the calendar reads through the RPC. Until Security 3 is applied, the calendar reads through the RPC and RLS is off, so the result is the same as before for the anon role.

## 2. SQL file created

- **Path:** `supabase/migrations/20260616_booking_a_get_available_slots.sql`
- **Function:** `public.get_available_slots(p_month int, p_year int)`
- **Returns:** `TABLE(id uuid, date date, time text)` — unbooked slots only, ordered by date then time.
- **Security:** `SECURITY DEFINER`, `STABLE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`.
- **Grants:** anon `EXECUTE`, service_role `EXECUTE`. No anon `SELECT` on `available_slots`. No anon `EXECUTE` on `reserve_slot` (which does not exist yet).
- **Inputs:** `p_month` validated to 1..12; `p_year` validated to 1970..2100.
- **Behavior:** computes the first and last day of the requested month, then `RETURN QUERY` selects from `public.available_slots` where `is_booked = false` and `date` is in the month range, ordered by `date ASC, time ASC`.
- **Idempotent:** uses `CREATE OR REPLACE FUNCTION` (preceded by a `DROP FUNCTION IF EXISTS`). Re-running replaces the function body in place.
- **Reversible:** rollback is in §10 below.
- **Not created:** `reserve_slot` (Booking B). `bookings` table. Any new column, index, or constraint on `available_slots`. No `package.json`, no `tsconfig.json`, no env var changes.
- **Applied:** **NO.** This phase did not connect to Supabase, did not run the Supabase CLI, did not run `psql`, and did not apply any SQL. The owner applies the SQL manually.

## 3. RPC contract

```sql
public.get_available_slots(p_month int, p_year int)
RETURNS TABLE (id uuid, date date, time text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
```

| Direction | Name | Type | Notes |
|---|---|---|---|
| in | `p_month` | `int` | 1..12. Anything else raises `22023` (invalid datetime / numeric). |
| in | `p_year` | `int` | 1970..2100. Anything else raises `22023`. |
| out | `id` | `uuid` | The row id. Matches the previous `SlotRecord.id`. |
| out | `date` | `date` | The slot date in `yyyy-MM-dd` form. Matches the previous `SlotRecord.date`. |
| out | `time` | `text` | The slot time as a free-form string (`'9:00 AM'`, etc.). Matches the previous `SlotRecord.time`. |

Behavior:

- The function returns zero or more rows. An empty result set is valid (no slots in the requested month).
- Rows are ordered `date ASC, time ASC` (matches the previous frontend ordering).
- `is_booked` is **not** returned. Every row is by definition unbooked (filtered server-side). The previous `SlotRecord` type still has `is_booked` for the frontend's compatibility; `lib/booking-actions.ts` fills it as `false` on the response.
- The function runs in the function owner's context (`SECURITY DEFINER`). In Supabase, the owner is `postgres` (a superuser), which bypasses RLS. The function then filters and returns only the rows the calendar needs.
- The function does **not** write. It is `STABLE`. It does not call any volatile functions.
- The function does **not** return `is_booked`, `created_at`, or any other column from the underlying table. The frontend does not need them; minimizing the column list minimizes the data exposure.

## 4. Frontend files changed

| File | Change |
|---|---|
| `lib/booking-actions.ts` | `getAvailableSlots(month, year)` rewritten to call `supabase.rpc('get_available_slots', { p_month: m, p_year: y })`. Same input shape, same return shape, same error shape. `createBooking` is **intentionally unchanged** and remains blocked until Booking B (the function is gated to a future phase; its docstring records the gate). |
| `components/booking-calendar-custom.tsx` | The calendar now calls `getAvailableSlots(month, year)` whenever the user navigates to a new month. The result is a `SlotRecord[]`. The date picker disables days with zero slots. The time picker renders only the times actually returned for the selected date. A loading state and an error state are added. The submit handler (n8n forms Worker) is unchanged. The UI design / layout / step indicator / form fields are unchanged. The placeholder phone number is unchanged. |
| `supabase/migrations/20260616_booking_a_get_available_slots.sql` | New file. The RPC. |
| `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` | New file. This document. |

Files **not** changed: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint / tailwind configs, `public/_headers`, `app/`, `hooks/`, `styles/`, `workers/`, `.env*`, `.mcp.json`, `.opencode/`, `.codex/`, `.claude/`, `tests/`, `.github/`, the four form components, `lib/supabase.ts`, `lib/booking-schema.sql`, `lib/booking-types.ts`. The schema file (`lib/booking-schema.sql`) is not changed: the Booking A RPC reads from the existing `available_slots` table; the table shape is preserved.

## 5. Owner-side SQL application steps

The owner applies the Booking A SQL migration after applying the Security 3 RLS migration. Recommended order: Security 3 first, then Booking A, then Booking B, then Observability. The order is owner-driven; the Booking A SQL works in either order, but the full design is coherent only when Security 3 is in place.

### 5.1 Recommended: Supabase SQL editor

1. Open the Supabase project dashboard.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `supabase/migrations/20260616_booking_a_get_available_slots.sql` into the editor.
5. **Review the SQL carefully.** The owner is the last line of defense. Do not apply SQL you have not read.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. Confirm the SQL ran without error. The migration is idempotent; if it errors, the safest action is to copy the error message into a new agent session for review, not to retry blindly.
8. Run the read-only verification queries in §7 of the SQL file (the comments at the end). Confirm:
   - The function `public.get_available_slots` exists with the right signature and config.
   - The function has `prosecdef = true`, `provolatile = 's'`, and `proconfig = ['search_path=pg_catalog, public']`.
   - The `anon` role has `EXECUTE` on the function. The `service_role` role has `EXECUTE` on the function. No other role is granted.
   - A smoke call to `select * from public.get_available_slots(6, 2026)` returns unbooked slots for the seeded weekdays, ordered by date then time.

### 5.2 Alternative: Supabase CLI (if the owner already has it set up)

1. From the repo root, ensure `supabase` is installed (out of scope for this phase).
2. Link the project: `supabase link --project-ref <ref>`.
3. Apply the migration: `supabase db push` (if the file is in the standard `supabase/migrations/` location) or `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260616_booking_a_get_available_slots.sql`.
4. Run the same verification queries as in §5.1.

The CLI path is the owner's choice. This phase did not install the Supabase CLI.

### 5.3 Recommended: read the SQL before applying

The owner should read the SQL file end-to-end before applying. The file is heavily commented. The function body, the grants, and the verification queries are all inline. Any change to the function should be made in the SQL file and re-reviewed.

## 6. Verification queries

Read-only. The owner runs these after applying the migration.

```sql
-- 1. Function exists with the right shape and config.
SELECT
  p.proname                                AS function_name,
  pg_get_function_arguments(p.oid)         AS arguments,
  pg_get_function_result(p.oid)            AS returns,
  p.prosecdef                              AS security_definer,
  p.provolatile                            AS volatility,
  p.proconfig                              AS config
FROM pg_proc p
WHERE p.proname = 'get_available_slots'
  AND p.pronamespace = 'public'::regnamespace;
-- Expect: one row; security_definer = true; volatility = 's';
--         config = ['search_path=pg_catalog, public'].

-- 2. Grants are in place.
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name   = 'get_available_slots';
-- Expect: (anon, EXECUTE), (service_role, EXECUTE).

-- 3. Anon is NOT granted SELECT on available_slots (carried over from Security 3).
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name   = 'available_slots'
  AND grantee      = 'anon';
-- Expect: zero rows.

-- 4. Smoke test: call the RPC for a seeded month and confirm only
--    unbooked slots come back, ordered by date then time.
SELECT date, time
FROM public.get_available_slots(6, 2026)
ORDER BY date, time
LIMIT 20;
-- Expect: rows for the seeded weekdays in 2026-06 (Mon-Fri, 9:00 AM
-- through 4:30 PM, 30-minute increments). No rows for past dates.

-- 5. Input validation: invalid month / year raises 22023.
SELECT * FROM public.get_available_slots(13, 2026);
-- Expect: ERROR invalid_parameter_value (SQLSTATE 22023).
```

## 7. Frontend integration summary

The frontend integration is the minimal change needed to switch the read path to the RPC. No new dependencies. No new components. No design changes.

- `lib/booking-actions.ts:35` — `getAvailableSlots(month, year)` now does:
  - Input validation (parses month / year to integers, validates the ranges, returns a clean error if the input is bad).
  - `supabase.rpc('get_available_slots', { p_month: m, p_year: y })`.
  - Maps the response to the `SlotRecord` shape the frontend already uses (`is_booked` is set to `false` because the RPC only returns unbooked rows).
  - Error handling unchanged: the `ActionResult<SlotRecord[]>` shape is preserved; errors are surfaced as `{ data: null, error: <message> }`.
- `lib/booking-actions.ts:107` — `createBooking` is **unchanged**. The function still does the direct INSERT into `bookings` and the direct UPDATE on `available_slots`. After Security 3 RLS is applied, both calls will fail with 403 / RLS violations. The fix is Booking B (the `reserve_slot` RPC, called server-side from a Cloudflare Worker that holds the `service_role` key). The function's docstring records this gate explicitly.
- `components/booking-calendar-custom.tsx` — The calendar adds a `useEffect` that calls `getAvailableSlots(month, year)` whenever the displayed month changes. A loading state and an error state are added. The date picker disables days with zero available slots (`isDateSelectable(day)`). The time picker renders only the times actually returned for the selected date (a derived `availableTimesForSelectedDate`). The submit handler (n8n forms Worker) is unchanged. The UI design, the step indicator, the form fields, the placeholder text, the validation, the honeypot, the type field, the success state, the error state are unchanged.
- The `SlotRecord` type in `lib/booking-types.ts` is unchanged.

## 8. Known remaining risks

- **R-004 (booking double-booking)** — Booking A fixes the read path: the calendar now only offers dates and times that are actually unbooked. Booking A does **not** fix the write path. The `createBooking` function still does an unconditional `UPDATE available_slots SET is_booked = true WHERE date = ? AND time = ?`, with no transaction wrapper and no `is_booked = false` predicate. After Security 3 RLS is applied, the direct write will fail. The full transactional reservation path is Booking B. Until Booking B ships, two concurrent submissions for the same slot could in principle still race on the booking form's Supabase write (it does not race today because the write fails with RLS; but if the owner accidentally rolls back the Security 3 RLS migration, the race returns). The calendar UI is honest; the data path is not.
- **R-031 (seed exhaustion)** — unchanged. The seed populates 12 weeks from `2026-05-18`. The Booking A RPC returns whatever the seed has. The operator must re-seed before the window closes.
- **R-007 (CSP is enforced only at the production edge)** — unchanged. The dev server has no CSP. The Booking A RPC runs through the same Supabase endpoint as before. No new `connect-src` entries are needed.
- **R-008 (honeypot-only bot protection)** — unchanged. The form still has a honeypot. The RPC is not a new bot vector (it returns zero rows for a hostile call after validation, and the validation rejects bad inputs).
- **R-005 (single shared webhook / per-form secret)** — already addressed at the deployment level by Security 4. The booking form still posts to the n8n forms Worker with the per-form secret header. Booking A does not touch the Worker.
- **The Booking A RPC is callable by anon only via the Supabase REST API with the anon key** — this is the design. Anon cannot SELECT from `available_slots`; anon can only invoke the function. The function returns a bounded result set (one month of slots, max ~22 weekdays × 14 slots = ~308 rows). The input is validated. The function does not write. The function does not return any column the calendar does not need. The risk surface is narrow.
- **No `service_role` key in the static bundle, in the repo, or in any `NEXT_PUBLIC_*` env var.** The RPC is `SECURITY DEFINER`, but it runs in the function owner's context (`postgres`), not in a `service_role` context. The RPC does not need the `service_role` key to read from `available_slots`; it reads in the `postgres` context. The `service_role` key is still server-side only.
- **No tests run in this phase.** No build, no lint, no `npm run`, no `pnpm run`, no `yarn run`. Static inspection only.

## 9. Booking B dependency

Booking A is the read path. Booking B is the write path. Booking B (A0 future phase #9) creates the `reserve_slot` RPC and the Worker-side orchestration. Booking B does the following (Booking B's scope; **not** in this Booking A phase):

- Creates a `reserve_slot(p_date date, p_time time, p_booking jsonb) returns uuid` function in a single transaction: check `is_booked = false`, insert into `bookings`, update `available_slots.is_booked = true`.
- Adds a `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` as defense in depth.
- Puts the call behind a Cloudflare Worker that holds the `service_role` key.
- Anon is **never** granted EXECUTE on `reserve_slot` (per the Security 3 forward-compatible grant model). The reservation must happen server-side via the Worker.
- The booking form's submit handler changes from "POST to n8n forms Worker only" to "POST to the Worker; the Worker calls `reserve_slot` and also notifies n8n via a signed event."

Booking A does not start Booking B. The state files record the gate. The recommended order is Booking A → ChatGPT Control Room approval of Booking A → owner applies Booking A SQL (and Security 3 SQL if not already applied) → Booking B.

## 10. Rollback plan

If the owner applies the migration and a regression occurs, the owner can roll back. The rollback is owner-driven. The migration is forward-only; the rollback is here.

```sql
-- Rollback: drop the function and revoke the grants.
-- The Security 3 RLS policies and the forward-compatible anon EXECUTE
-- grant remain. The anon role is still denied on `available_slots`
-- (Security 3). The booking flow returns to being non-functional by
-- design: the browser cannot read availability, the browser cannot
-- write a booking. Run the Security 3 rollback (§6 of
-- repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md) if you also want
-- to re-enable direct table access.

REVOKE EXECUTE ON FUNCTION public.get_available_slots(int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_available_slots(int, int) FROM service_role;
DROP FUNCTION IF EXISTS public.get_available_slots(int, int);
```

The frontend `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx` will fail at runtime after the rollback (the RPC no longer exists). The frontend code can be reverted by `git checkout` of the previous `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx`. The repo's git history is the source of truth for the frontend code; this phase does not commit, so the owner decides when to commit and when to revert.

## 11. Testing checklist

Static inspection only in this phase. The owner runs the runtime checks below after applying the migration.

### 11.1 Owner-side runtime checks (after applying the SQL)

- [ ] The Supabase SQL editor shows the function `public.get_available_slots(int, int)` with `prosecdef = true`, `provolatile = 's'`, and `proconfig = ['search_path=pg_catalog, public']`.
- [ ] `select * from public.get_available_slots(6, 2026)` returns unbooked slots for the seeded weekdays in 2026-06, ordered by date then time.
- [ ] `select * from public.get_available_slots(13, 2026)` raises an `invalid_parameter_value` (22023).
- [ ] `select * from public.get_available_slots(6, 99999)` raises an `invalid_parameter_value` (22023).
- [ ] From the browser console on `/book`, the calendar shows only the dates that have at least one available slot, and the time picker shows only the times actually available for the selected date. (Requires Security 3 RLS to be applied first; if Security 3 is not yet applied, the calendar still works but the broader RLS guarantees are not in place.)
- [ ] From the browser console, a direct `supabase.from('available_slots').select('*')` call returns a 403 / RLS violation (requires Security 3 RLS to be applied). Without Security 3, the direct call still works.
- [ ] The booking form's n8n submission still works (unchanged).
- [ ] The booking form's Supabase write fails with a 403 / RLS violation (requires Security 3 RLS to be applied; the form will surface the n8n success to the user, but the Supabase row will not be created until Booking B ships). The operator is notified via the n8n workflow.

### 11.2 OpenCode-side static checks (this phase)

- [x] `lib/booking-actions.ts` does **not** call `supabase.from('available_slots').select(...)` anywhere. The only `available_slots` references in the file are the legacy `createBooking` UPDATE path (gated to Booking B) and the new `supabase.rpc('get_available_slots', ...)` call. The legacy path is documented as blocked and will be replaced in Booking B.
- [x] `components/booking-calendar-custom.tsx` calls `getAvailableSlots(month, year)` from `lib/booking-actions.ts` and disables dates / times that are not returned by the RPC. The submit handler still posts to the n8n forms Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`). The placeholder phone number is unchanged.
- [x] `supabase/migrations/20260616_booking_a_get_available_slots.sql` exists, is heavily commented, is idempotent, and creates only the `get_available_slots` function. No `reserve_slot`. No table shape changes. No env var changes. No `package.json` changes.
- [x] `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint / tailwind configs are unchanged. `public/_headers` is unchanged. `app/` is unchanged (except no source edit at all; the brief did not require any `app/**` change). `hooks/` is unchanged. `styles/` is unchanged. `workers/` is unchanged. `.env*` is unchanged. `.mcp.json` is unchanged. `.opencode/`, `.codex/`, `.claude/` are unchanged. `tests/` is unchanged. `.github/` is unchanged.
- [x] No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`. No `wrangler deploy`. No `psql`. No Supabase CLI. No database command. No package-manager command. No deploy command. No Cloudflare dashboard command. No Supabase dashboard command. No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- [x] No `package.json` change, no lockfile change, no `tsconfig.json` change, no `next.config.*` change, no `postcss.config.*` change, no eslint config change, no tailwind config change, no real `.env*` change.
- [x] No `Booking B` work started. No `reserve_slot` SQL written. No Worker changes. No transactional reservation code.
- [x] No `Observability` work started. No `QA Slice` work started. No `TS0 / RDG0` work started. No `UIX0 / MOTION0` work started. No `Admin future` work started. No `Final QA / delivery` work started.

### 11.3 What is intentionally NOT tested in this phase

- [ ] No automated tests were run (no test suite exists; QA Slice 1+ is the future home for booking tests).
- [ ] No build was run (`npm run build` would be a future phase).
- [ ] No lint was run (ESLint config is deferred; R-026).
- [ ] No deploy was performed.
- [ ] No Supabase command was run. The owner applies the migration manually.
- [x] No SQL was applied by OpenCode. The SQL is on disk; the owner applied it manually on 2026-06-16 after Booking A Repair 1. Runtime verification (function shape, grants, smoke test, live grant repair) passed. See §12.

## 12. Sign-off

Booking A ships the SQL migration in `supabase/migrations/20260616_booking_a_get_available_slots.sql` (post-Repair 1 form; quotes `"time"` in `RETURNS TABLE`, in the inner `SELECT`, and in `ORDER BY`) and the frontend code changes in `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx`. The migration was **applied and verified at runtime by the owner on 2026-06-16** after Booking A Repair 1. **Booking A live grant repair was applied and verified at runtime by the owner on 2026-06-16.** OpenCode did **not** apply the SQL; the owner did. The migration is idempotent and reversible. The booking UI is honest about availability for the first time. The write path (`createBooking` → `reserve_slot` RPC) is gated to **Booking B**. Direct browser writes remain blocked. The booking UI is still not honest about persistence (R-005 write path, Booking B). **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking B-adjacent cleanup; do not start that repair unless explicitly approved. **Booking B = next eligible implementation phase, but NOT started.** Blocked until ChatGPT Control Room issues the exact Booking B prompt.
