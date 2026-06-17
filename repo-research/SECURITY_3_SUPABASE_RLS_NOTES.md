# SECURITY 3 — Supabase Row Level Security Notes (2026-06-16)

**Phase:** Security 3 (A0 future phase #6; D-020 LOCKED DEFAULT — Supabase RLS is required before any non-internal launch).
**Status (2026-06-16; updated 2026-06-16 — runtime state record):** SQL migration written. **SQL was applied and verified at runtime by the owner on 2026-06-16.** Runtime state: `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`. Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. Base schema in place; `public.available_slots` was seeded with 840 slots. **R-003 is closed end-to-end.** F-003 verified at the runtime level. The on-disk migration at `supabase/migrations/20260616_security3_rls.sql` is unchanged in this overlay (already in its final form from the Security 3 phase; runtime changes were applied by the owner in Supabase). Repo changes shipped.
**Author:** SECURITY-3-RLS-AGENT.

---

## 1. Current risk

The Supabase project has the anon key shipped in the static bundle (`NEXT_PUBLIC_SUPABASE_ANON_KEY` is in `app/`, `lib/`, and `public/`). The booking tables — `bookings` and `available_slots` — have **Row Level Security disabled**. The anon role has full read and write access to both tables from the browser. Anyone with the anon key can read every booking and write arbitrary rows. R-003 in `docs/SECURITY.md` documents this. F-003 in `docs/SECURITY.md` lists the fix: "Enable Supabase RLS. Deny all to anon by default. Allow inserts to `bookings` only via a server-side endpoint." This phase ships that fix.

**Why it matters now:** the booking flow is already broken in a different way (R-005 / booking double-book) — `components/booking-calendar-custom.tsx` does not call `getAvailableSlots`, so the calendar only blocks past dates and weekends. The moment Booking A fixes the UI to actually fetch slots, the anon key will be used to read `available_slots` and to write `bookings`. Without RLS, that path is wide open. Security 3 must land first (or simultaneously with Booking A) so the moment the UI starts working, the read/write path is gated.

---

## 2. Tables affected

- `public.bookings` — booking requests. Columns: `id` (UUID PK), `name` (TEXT NOT NULL), `email` (TEXT NOT NULL), `company` (TEXT NULL), `phone` (TEXT NULL), `message` (TEXT NULL), `preferred_date` (DATE NOT NULL), `preferred_time` (TEXT NOT NULL), `timezone` (TEXT default 'America/New_York'), `status` (TEXT default 'pending', CHECK in `('pending','confirmed','cancelled')`), `created_at` (TIMESTAMPTZ default now()), `updated_at` (TIMESTAMPTZ default now()).
- `public.available_slots` — bookable time slots. Columns: `id` (UUID PK), `date` (DATE NOT NULL), `time` (TEXT NOT NULL), `is_booked` (BOOLEAN default false), `UNIQUE (date, time)`.

Source of truth: `lib/booking-schema.sql`. The migration does not change the table shape. RLS is a per-table security layer; it does not require a schema change.

No other tables exist. The Supabase project uses only these two tables for the booking flow. Proposals live in admin `localStorage`. Leads flow through n8n. There is no `users`, `accounts`, `roles`, `proposals`, `leads`, or analytics table.

---

## 3. Proposed RLS model

The model is intentionally strict and forward-compatible. It is the policy the brief calls out: deny all to anon; full access to service_role; forward-compatible grants on the future narrow RPCs.

### 3.1 Anon role: deny all

- `bookings`: anon cannot SELECT, INSERT, UPDATE, or DELETE.
- `available_slots`: anon cannot SELECT, INSERT, UPDATE, or DELETE.
- Implementation: a single `FOR ALL` policy per table, with `USING (false)` and `WITH CHECK (false)`. The role cannot read existing rows and cannot write new rows.

The anon role is the role the browser's anon key maps to when it hits the Supabase REST API. Denying all to anon means the browser cannot touch the tables directly, even with the anon key in the bundle.

### 3.2 Service role: full access (explicit)

- `bookings`: service_role can SELECT, INSERT, UPDATE, DELETE.
- `available_slots`: service_role can SELECT, INSERT, UPDATE, DELETE.
- Implementation: a single `FOR ALL` policy per table, with `USING (true)` and `WITH CHECK (true)`.

This is technically redundant (Supabase grants the service_role `BYPASSRLS` by default), but it is explicit and self-documenting. The service_role is server-side only. It must NEVER be in a `NEXT_PUBLIC_*` env var or in the static bundle. It is used by the Cloudflare Worker (Security 1) and by the seed script. The `service_role` policy in this migration is the documentation that the server-side path is the intended path.

### 3.3 Authenticated role: not granted

The `authenticated` role is the role for signed-in Supabase users. This project has no authenticated user flow today. The migration does not add a policy for `authenticated`. If/when Supabase Auth is added (e.g. for a client portal), the owner should add an explicit policy for `authenticated` at that time. Today, an authenticated user would inherit the anon deny (because no `authenticated` policy exists, the default is deny for non-owner roles when RLS is on).

### 3.4 Forward-compatible grants on the future narrow RPCs

- `get_available_slots(p_month int, p_year int) returns table(...)` — anon `EXECUTE` is granted, but only if the function exists. The function is created in Booking A. The GRANT is a no-op until then.
- `reserve_slot(p_date date, p_time time, p_booking jsonb) returns uuid` — `service_role` `EXECUTE` is granted, but only if the function exists. The function is created in Booking B. The GRANT is a no-op until then. **Anon is NOT granted EXECUTE on `reserve_slot`.** The reservation must happen server-side via the Worker, which holds the service_role key. The anon key is never used to reserve a slot.

The RPC shapes above are the planned shape from `INTEGRATION_NOTES.md` §8.3 and `docs/A0_ACTION_PLAN.md` §5.8 / §5.9. They are not yet created in the schema. The migration does NOT create the function bodies. The bodies are Booking A and Booking B work, gated to A0 plan §5.8 and §5.9.

### 3.5 Force RLS even for the table owner

The migration includes `ALTER TABLE ... FORCE ROW LEVEL SECURITY;` for both tables. This is the safer default: a future migration that flips the table owner will not silently bypass RLS. The owner (and the seed script, when run as the table owner) must use a SECURITY DEFINER function or the service_role to write.

### 3.6 Default privileges backstop

The migration revokes the `PUBLIC` default privileges on the two tables. Supabase ships with broad default privileges for the `anon` and `authenticated` roles on new tables. The policies above are the source of truth for access; the default privileges are a belt-and-suspenders backstop so a future migration that creates a column or a constraint does not silently re-enable broad access.

---

## 4. SQL file created

- **Path:** `supabase/migrations/20260616_security3_rls.sql`
- **Contents:** §1–§6 of this file are encoded as SQL. The file is heavily commented. The policy bodies are explicit and named. The migration is idempotent (safe to re-run; the `DROP POLICY IF EXISTS` block removes any pre-existing policy with the same name). The migration is reversible (rollback is in §6 below).
- **Applied:** **NO.** This phase did not connect to Supabase, did not run the Supabase CLI, did not run `psql`, and did not apply any SQL. The owner applies the migration manually per §5.

---

## 5. Owner application steps

The owner applies the migration manually. The Supabase dashboard is the recommended path for a single-operator project. The Supabase CLI is also acceptable but is not required and is not installed in this phase.

### 5.1 Recommended: Supabase SQL editor

1. Open the Supabase project dashboard.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `supabase/migrations/20260616_security3_rls.sql` into the editor.
5. **Review the SQL carefully.** The owner is the last line of defense. Do not apply SQL you have not read.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. Confirm the SQL ran without error. The migration is idempotent; if it errors, the safest action is to copy the error message into a new agent session for review, not to retry blindly.
8. Run the read-only verification queries in §7 of the SQL file (the comments at the end). Confirm:
   - `relrowsesecurity = true` and `relforcerowsecurity = true` for both tables.
   - Four policies exist: `anon_deny_all_bookings`, `anon_deny_all_available_slots`, `service_role_full_access_bookings`, `service_role_full_access_available_slots`.

### 5.2 Alternative: Supabase CLI (if the owner already has it set up)

1. From the repo root, ensure `supabase` is installed (out of scope for this phase).
2. Link the project: `supabase link --project-ref <ref>`.
3. Apply the migration: `supabase db push` (if the file is in the standard `supabase/migrations/` location) or `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260616_security3_rls.sql`.
4. Run the same verification queries as in §5.1.

The CLI path is the owner's choice. This phase did not install the Supabase CLI.

### 5.3 Recommended: read the SQL before applying

The owner should read the SQL file end-to-end before applying. The file is heavily commented. The policy model in §3 of this file matches the policy bodies in the SQL exactly. Any change to the policy should be made in the SQL file and re-reviewed.

---

## 6. Rollback SQL

If the owner applies the migration and a regression occurs (for example, a future phase expected direct table access that the anon deny now blocks), the owner can roll back. The rollback is **not** in the migration file (the migration is forward-only). The rollback is here.

```sql
-- Rollback: disable RLS, drop the policies, restore Supabase defaults.
-- This is destructive: it re-enables the pre-Security-3 model where the
-- anon key has full read/write on the booking tables. Do not run this
-- unless you understand the implications.

-- Drop the policies.
DROP POLICY IF EXISTS "anon_deny_all_bookings" ON public.bookings;
DROP POLICY IF EXISTS "anon_deny_all_available_slots" ON public.available_slots;
DROP POLICY IF EXISTS "service_role_full_access_bookings" ON public.bookings;
DROP POLICY IF EXISTS "service_role_full_access_available_slots" ON public.available_slots;

-- Disable RLS.
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.available_slots NO FORCE ROW LEVEL SECURITY;

-- Restore the Supabase default privileges.
GRANT ALL ON public.bookings TO PUBLIC;
GRANT ALL ON public.available_slots TO PUBLIC;

-- After running the rollback, the anon key has full read/write on both
-- tables again. The site returns to the pre-Security-3 model. R-003
-- re-opens. Re-applying the migration is the fix.
```

The rollback is owner-driven. This phase did not run any of it. The owner pastes the rollback into the Supabase SQL editor only if a regression requires it.

---

## 7. Verification checklist (owner-driven, post-apply)

The owner runs these after applying the migration. They are read-only.

- [ ] `SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname IN ('bookings', 'available_slots') AND relnamespace = 'public'::regnamespace;` returns two rows, both with `relrowsecurity = true` and `relforcerowsecurity = true`.
- [ ] `SELECT polname, polpermissive, polroles, polcmd FROM pg_policy WHERE polrelid IN ('public.bookings'::regclass, 'public.available_slots'::regclass) ORDER BY polrelid::regclass::text, polname;` returns four rows (two per table: `anon_deny_all_*` and `service_role_full_access_*`).
- [ ] From the browser console on `/book`, the existing booking flow is non-functional (it errors on the direct `from('available_slots').select(...)` call in `lib/booking-actions.ts`). This is expected. The fix is Booking A (replace the direct call with a `get_available_slots` RPC). The booking UI was already broken (R-005); RLS does not introduce a new breakage, it makes the existing breakage explicit and gated.
- [ ] The Cloudflare Worker (Security 1) is unaffected. The Worker uses the service_role key, which bypasses RLS. The Worker does not read or write the booking tables today, but when it does in Booking B, it will use `reserve_slot`, which is `service_role` EXECUTE.
- [ ] The seed script (`lib/booking-schema.sql` §"Seed") is unaffected. It runs as the table owner or as `service_role`, both of which bypass RLS. Re-running the seed (with a fresh start date) does not error.
- [ ] Admin `localStorage` data is unaffected. RLS only affects the booking tables. Admin proposal persistence is browser-only and is not a Supabase concern.
- [ ] The Supabase project settings (auth, JWT secret, API keys, replication) are unchanged. The migration is a pure SQL migration; it does not touch project settings.
- [ ] No service_role key is in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file. The service_role key is server-side only (Worker, seed, future DB admin).

---

## 8. Known impact on current booking flow

This is the section the brief asked for: "Known impact on current booking flow."

**Short answer:** applying the migration will break the existing direct-table read path in `lib/booking-actions.ts`. The booking UI was already broken in a different way (R-005: the calendar does not call `getAvailableSlots`). The migration does not introduce a new breakage; it makes the existing breakage explicit and gates it. The fix is Booking A (replace the direct call with a `get_available_slots` RPC) and Booking B (replace the direct insert/update with a `reserve_slot` RPC). Until then, the booking flow is non-functional, which is **safer** than a silently-broken booking flow that exposes the anon key to write.

**Long answer:**

- `lib/booking-actions.ts` has two functions: `getAvailableSlots` and `createBooking`. Both call Supabase directly from the browser using the anon key.
  - `getAvailableSlots` does `supabase.from('available_slots').select('*').gte('date', startDate).lte('date', endDate).eq('is_booked', false).order('date', ...).order('time', ...)`. After the migration, this query will fail with a 403 / RLS violation because anon cannot SELECT from `available_slots`.
  - `createBooking` does `supabase.from('bookings').insert({...})` and then `supabase.from('available_slots').update({ is_booked: true }).eq('date', ...).eq('time', ...)`. After the migration, both calls will fail with RLS violations because anon cannot INSERT into `bookings` and cannot UPDATE `available_slots`.
- `components/booking-calendar-custom.tsx` does **not** call `getAvailableSlots` (R-005). It only blocks past dates and weekends via a client-side `isAvailable(day)` check. So the booking calendar UI does not actually depend on the read path. It only depends on the write path (`createBooking`).
- After the migration, the booking flow is non-functional. The owner can verify this by applying the migration and trying to submit a booking in the browser. The booking form will fail with a 403 / RLS violation from Supabase. The failure is logged in the browser console.
- The fix is Booking A: replace `getAvailableSlots` with a call to a new `get_available_slots` RPC. The RPC is `SECURITY DEFINER` and reads from `available_slots` with `is_booked = false` filtered and a date range, returning the same shape `lib/booking-actions.ts` already returns. The frontend code changes from a direct table select to a `supabase.rpc('get_available_slots', { p_month, p_year })` call.
- The fix for the write path is Booking B: replace `createBooking` with a call to a new `reserve_slot` RPC. The RPC is `SECURITY DEFINER` and runs in a single transaction: check `is_booked = false`, insert into `bookings`, update `available_slots.is_booked = true`. The frontend code changes from a direct insert + update to a `supabase.rpc('reserve_slot', { ... })` call. The Worker is the only caller of `reserve_slot`; the anon key is never used to reserve a slot.
- Until Booking A and Booking B ship, the booking UI is non-functional. **That is the desired state for now** — the brief says: "Direct browser writes are not trusted. Service role must only live server-side / Worker-side." The migration enforces that.

**Why this is the right call:**

- The brief is explicit: "Direct browser writes are not trusted." A migration that left the booking flow working with the anon key would defeat the purpose of the migration.
- The booking UI is already broken in a different way (R-005). The migration does not introduce a new bug; it makes the existing bug explicit and gates it.
- The Cloudflare Worker (Security 1) and the admin tool (Security 2) are unaffected. The Worker holds the service_role key, which bypasses RLS. The admin tool is gated by Cloudflare Access.
- The migration is reversible. The owner can apply the rollback in §6 if a regression requires it.

**Recommended pre-apply order:**

1. **Apply this migration (Security 3) before any non-internal launch.** The brief is explicit: "RLS is required before any non-internal launch."
2. **Booking A** then wires the read path through `get_available_slots`. The frontend code change is small; the RPC body is the main work.
3. **Booking B** then wires the write path through `reserve_slot`, called from the Worker. The frontend code change is small; the RPC body and the Worker change are the main work.
4. The owner should apply the Security 3 migration before or simultaneously with Booking A. If the owner wants to land Booking A first and Security 3 second, that is a temporary regression: the booking flow will be working with the anon key, and Security 3 will then break it. The recommended order is Security 3 first, then Booking A, then Booking B.

---

## 9. Dependencies on Booking A and Booking B

- **Booking A** (A0 future phase #8; D-019b) creates the `get_available_slots` RPC. The RPC body is the work. The frontend change in `lib/booking-actions.ts` is a small swap from `supabase.from('available_slots').select(...)` to `supabase.rpc('get_available_slots', { p_month, p_year })`. The forward-compatible GRANT in this migration activates when the function is created.
- **Booking B** (A0 future phase #9; D-019b robust path) creates the `reserve_slot` RPC. The RPC body is the work. The Worker calls the RPC with the service_role key. The frontend code change in `lib/booking-actions.ts` is a small swap from direct insert + update to a single `supabase.rpc('reserve_slot', { ... })` call from the Worker context (the anon key is never used to reserve). The forward-compatible GRANT in this migration activates when the function is created.
- **Until Booking A and Booking B ship**, the booking UI is non-functional. The owner can either ship a "Booking temporarily unavailable" message in the UI (a small UI change) or accept that the UI is non-functional until Booking A. The migration does not change the UI; that is Booking A's job.

---

## 10. What remains blocked

- **Security 4 (n8n per-form secret)** — partially addressed at the deployment level (2026-06-16; forms Worker source shipped; per-form secret header added server-side; R-005 / R-017 addressed at the deployment level; F-006 implemented at the deployment level). Deferred at the runtime level until the owner deploys the forms Worker and configures the n8n workflow to verify the header. Not in Security 3 scope.
- **Booking A** — **applied and verified at runtime by the owner (2026-06-16) after Booking A Repair 1**. The `get_available_slots` RPC is in the database. The frontend `lib/booking-actions.ts:35` `getAvailableSlots` calls the RPC. The frontend `components/booking-calendar-custom.tsx` uses the response. The Booking A live grant repair is applied and verified. R-005 is partially closed at the read path level and verified at the runtime level. F-004 implemented for the read path and verified at the runtime level. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking B-adjacent cleanup; do not start that repair unless explicitly approved.
- **Booking B** — **next eligible implementation phase, but NOT started.** Blocked until ChatGPT Control Room issues the exact Booking B prompt. No `reserve_slot` SQL written. No `bookings` table changes. No Worker changes.
- **Observability** — blocked. R-006 / R-010 / R-035 are open.
- **QA Slice 0..3** — blocked.
- **TS0 / RDG0 tooling approval** — blocked.
- **UIX0 / MOTION0** — blocked.
- **Admin future** — blocked. R-018 (proposal persistence) is open.
- **Final QA / delivery** — blocked.
- **Worker deploy** — owner-side. Steps in `repo-research/SECURITY_1_WORKER_PROXY_NOTES.md` §5. Not done in this overlay.
- **Cloudflare Access app creation** — owner-side. Steps in `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md` §3. Not done in this overlay.
- **Supabase migration apply (Security 3)** — **applied and verified at runtime by the owner (2026-06-16).** The migration is on disk at `supabase/migrations/20260616_security3_rls.sql` and is also in the database. Owner-side steps in §5 of this file were used to apply the migration.
- **Ponytail install / clone / configure / evaluate** — blocked; gated to TS0 / RDG0.
- **ECC / affaan-m/ecc install / clone / configure / evaluate** — blocked; gated to TS0 / RDG0.

---

## 11. Sign-off

Security 3 ships the SQL migration in `supabase/migrations/20260616_security3_rls.sql` and the owner-side notes in this file. **The migration was applied and verified at runtime by the owner on 2026-06-16.** The migration is idempotent and reversible. **Booking A has shipped (A0 future phase #8; SQL applied and verified at runtime 2026-06-16 after Booking A Repair 1).** The booking flow now reads availability through the `get_available_slots` RPC. **The write path (`createBooking` in `lib/booking-actions.ts`) is still blocked** — the direct `INSERT` into `bookings` and the direct `UPDATE` on `available_slots.is_booked` now fail with 403 / RLS violations because Security 3 is in place. The transactional reservation path (`reserve_slot` RPC, called server-side from a Cloudflare Worker that holds the `service_role` key) is gated to **Booking B** (A0 future phase #9). Until Booking B ships, the booking flow is non-functional by design at the write path — direct browser writes are not trusted. **Booking A live grant repair was applied and verified at runtime by the owner on 2026-06-16** — broad direct table privileges from `anon` and `authenticated` were revoked; `authenticated` `EXECUTE` on `get_available_slots` was revoked; intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants were restored.
