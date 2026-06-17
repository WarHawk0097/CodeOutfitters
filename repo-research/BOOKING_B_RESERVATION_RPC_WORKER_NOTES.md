# Booking B — Reservation RPC + Booking Worker Notes (2026-06-16)

**Phase:** Booking B (A0 future phase #9; D-019b robust transactional reservation; the booking write path that pairs with Booking A's read path).
**Status (2026-06-16; runtime state record):** Booking B is **applied and verified at runtime by the owner (2026-06-16).** SQL migration written (629 lines, post-quote-`"time"`-Repair-1 form), Booking Worker source written (`.ts`), dashboard JS copy written (`.dashboard.js`, Booking B Repair 1), frontend `createBooking` replaced, frontend `handleSubmit` updated, `.env.local.example` updated with `NEXT_PUBLIC_BOOKING_WORKER_URL`. **SQL was applied by the owner** via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). **Worker was deployed by the owner** via the Cloudflare dashboard paste of `workers/booking-reservation-worker.dashboard.js` (the dashboard editor rejected the `.ts` source with a strict-mode syntax error; the JS dashboard copy is the dashboard-paste form). The owner's account workers subdomain is `samuel` (per the deployed URL the owner used; the `.ts` in the URL is a copy-paste artifact of the source filename). Required Worker env vars were configured: `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. n8n vars (`N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET`) were intentionally left for later. Worker smoke test passed: the owner called the Worker and received `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row exists in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`. Supabase verification confirmed `available_slots.is_booked = true` for `2026-06-17` / `10:00 AM`. A duplicate booking test returned `slot_already_booked` (`P0001`), which confirms the row lock + UNIQUE constraint defense in depth is working as designed. **A0 is approved by ChatGPT Control Room as of the Security 4 phase (2026-06-16); the carry-forward is recorded in `PROJECT_CONTROL_LOG.md` and `ai/AI_CONTEXT_RULES.md`.** **Security 3 RLS migration was applied and verified at runtime by the owner on 2026-06-16.** **Booking A was applied and verified at runtime by the owner on 2026-06-16 after Booking A Repair 1.** R-003 is **closed end-to-end**. R-005 is **fully closed at the runtime level** (read path closed by Booking A; write path closed by Booking B; both verified at runtime by the owner on 2026-06-16). F-004 is **fully closed at the runtime level** (read path closed by Booking A; write path closed by Booking B; both verified at runtime by the owner on 2026-06-16). The booking UI is end-to-end honest: the calendar shows only available slots, and the submit path persists the booking through a single transactional RPC. Direct browser writes to `bookings` and `available_slots` remain blocked by RLS. The browser never calls `reserve_slot` directly. **Known non-blocking issue (carried from Booking A):** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking-B-adjacent cleanup; do not start that repair unless explicitly approved. **Remaining deployment gap (informational, not a Booking B defect):** the Cloudflare Pages project is connected to GitHub; the current Pages deployment is still old GitHub code (pre-Booking-B frontend). The booking form's `handleSubmit` on the deployed Pages is the pre-Booking-B form (which posts to the n8n forms Worker; not the new `createBooking` flow). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed. **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy). **No git add, no git commit, no git push, no git remote add, no git fetch, no git pull.** **No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`.** **No `wrangler deploy`.** **No `psql`.** **No Supabase CLI.** No database command. No package-manager command. No deploy command. No Cloudflare dashboard command. No Supabase dashboard command. No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
**Author:** BOOKING-B-AGENT.

---

## 1. Current problem after Security 3 and Booking A

The Security 3 RLS migration (`supabase/migrations/20260616_security3_rls.sql`, 2026-06-16) enables RLS on `bookings` and `available_slots` and denies all access to anon on both tables (`USING (false)` on a `FOR ALL` policy). The Booking A read path was fixed: the calendar now reads through the `get_available_slots` RPC (anon `EXECUTE`, `SECURITY DEFINER`) and disables dates / times that are not in the response. The write path was **not** fixed in Booking A.

The previous direct-table write in `lib/booking-actions.ts:97` `createBooking` did:

```ts
await supabase.from('bookings').insert({ name, email, ... })
await supabase.from('available_slots').update({ is_booked: true }).eq('date', ...).eq('time', ...)
```

After Security 3 RLS is applied, **both** calls fail with 403 / RLS violations because anon cannot write to either table. The booking form's submit handler still posted to the n8n forms Worker (Security 4) so the operator got a notification, but no `bookings` row was created and no `available_slots.is_booked` flip happened. The booking flow was non-functional at the write path by design.

Two further problems existed with the old direct-write pattern (independent of RLS):

1. **Double-booking risk (R-005).** The two statements were not in a single transaction. Two concurrent submissions for the same `(date, time)` could both pass the `is_booked` check and both INSERT, leaving two `bookings` rows for the same slot and the flag flipped by the second.
2. **Direct write in the browser.** Even if RLS were relaxed, the browser would be the writer, which is the wrong place to do a transactional write. The fix is to put the write behind a server-side boundary that holds the `service_role` key.

Booking B fixes both. It introduces a `reserve_slot` RPC that does the work in a single transaction under a row lock, holds the `UNIQUE (preferred_date, preferred_time)` constraint as a last-line defense, and is called server-side from a new Cloudflare Worker (`workers/booking-reservation-worker.ts`) that holds the `service_role` key. Anon is never granted EXECUTE on `reserve_slot`. The browser can never call `reserve_slot` directly. The Worker is the boundary.

## 2. SQL file created

- **Path:** `supabase/migrations/20260616_booking_b_reserve_slot.sql`
- **Function:** `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid`
- **Returns:** `uuid` — the new `bookings.id` on success. Raises exceptions on conflict.
- **Security:** `SECURITY DEFINER`, `VOLATILE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`.
- **Grants:** `service_role` `EXECUTE` only. No anon `EXECUTE`. No `authenticated` `EXECUTE`. No anon `SELECT` on `bookings` or `available_slots`. The forward-compatible Security 3 grant on `reserve_slot` (`service_role`) is honored; anon keeps EXECUTE on the read RPC (`get_available_slots`) and ONLY on the read RPC.
- **Inputs:** `p_date` validated to a non-null `date`; `p_time` validated to a non-empty trimmed `text`; `p_booking` validated as a non-null `jsonb` object with required `name` and `email` (trimmed, non-empty), optional `company` / `phone` / `message` (each length-capped, treated as null if empty), and a `timezone` (defaults to `'America/New_York'` if missing or empty). The JSON's `preferredDate` and `preferredTime` are cross-checked against `p_date` and `p_time` (mismatch raises 22023).
- **Behavior:**
  1. Validate inputs (p_date, p_time, p_booking shape, name, email, optional fields, timezone, JSON-vs-top-level cross-check). Bad inputs raise `22023` (`invalid_parameter_value`). The transaction rolls back; no row is inserted.
  2. `SELECT s.id, s.is_booked INTO v_slot_id, v_slot_is_booked FROM public.available_slots AS s WHERE s."date" = p_date AND s."time" = p_time FOR UPDATE;` — row-level lock on the matching `available_slots` row.
  3. If the row is missing → raise `'slot_not_found'` (`P0001`). Transaction rolls back; no row is inserted.
  4. If `is_booked = true` → raise `'slot_already_booked'` (`P0001`). Transaction rolls back; no row is inserted.
  5. `INSERT INTO public.bookings (name, email, company, phone, message, preferred_date, preferred_time, timezone, status) VALUES (..., p_date, p_time, v_timezone, 'pending') RETURNING id INTO v_booking_id;` — the new row. The `id` is generated by the table default (`gen_random_uuid()`). The `status` is set explicitly to `'pending'`.
  6. `UPDATE public.available_slots AS s SET is_booked = true WHERE s."date" = p_date AND s."time" = p_time;` — flip the slot. Under the same row lock.
  7. `RETURN v_booking_id;` — the new `bookings.id`.
- **Defenses in depth:**
  - The row lock (`SELECT ... FOR UPDATE`) is the primary guarantee. It serializes the check and the update under a `FOR UPDATE` lock on the same row.
  - The `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is the last-line defense. Added in an idempotent `DO $$ ... $$` block in the same migration. A concurrent caller that slipped past the row lock and committed first will cause the INSERT to raise `23505` (`unique_violation`); the transaction rolls back; no row is inserted.
  - The function is `SECURITY DEFINER` and runs in the function owner's context (in Supabase, the `postgres` role, a superuser that bypasses RLS). Anon never sees the function body; anon cannot run the function (no `EXECUTE` grant).
- **Idempotent:** `CREATE OR REPLACE FUNCTION` preceded by `DROP FUNCTION IF EXISTS`. Grants are revoked and re-granted. The UNIQUE constraint is added in a `DO $$ ... $$` block that checks `pg_constraint` for existence first.
- **Reversible:** rollback is in §11 below.
- **Not created:** `get_available_slots` (Booking A, already applied). Any new column, index, or constraint on `available_slots`. Any non-`ADD CONSTRAINT` change to `bookings`. No `package.json`, no `tsconfig.json`, no env var changes.
- **Applied:** **NO.** This phase did not connect to Supabase, did not run the Supabase CLI, did not run `psql`, and did not apply any SQL. The owner applies the SQL manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative).

## 3. RPC contract

```sql
public.reserve_slot(p_date date, p_time text, p_booking jsonb)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
```

| Direction | Name | Type | Notes |
|---|---|---|---|
| in | `p_date` | `date` | Non-null. Anything else raises `22023`. |
| in | `p_time` | `text` | Non-null, non-empty (trimmed). Anything else raises `22023`. Matches `available_slots."time"` (e.g. `'10:00 AM'`). |
| in | `p_booking` | `jsonb` | Non-null object. Required keys: `name` (non-empty, ≤ 100 chars), `email` (non-empty, ≤ 100 chars, loose email validation: contains exactly one `@` and a non-empty local part and a non-empty domain part that contains a `.`). Optional keys: `company` (≤ 100 chars), `phone` (≤ 20 chars), `message` (≤ 2000 chars), `timezone` (defaults to `'America/New_York'`), `preferredDate` (must match `p_date` if present), `preferredTime` (must match `p_time` if present). |
| out | (return) | `uuid` | The new `bookings.id` on success. On failure the function raises an exception; no value is returned. |

Errors and how the Worker maps them to HTTP status:

| Postgres SQLSTATE | Postgres `code` | Message starts with | Worker HTTP | Worker `error` tag | Frontend UX |
|---|---|---|---|---|---|
| `22023` | `22023` | (validation) | 400 | `invalid_input` | Surface the error message to the user. |
| `P0001` | `P0001` | `slot_already_booked` | 409 | `slot_already_booked` | "This time slot is no longer available." Refetch the calendar. |
| `P0001` | `P0001` | `slot_not_found` | 409 | `slot_not_found` | "This time slot is no longer available." Refetch the calendar. |
| `23505` | `23505` | (unique violation) | 409 | `slot_taken` | "This time slot is no longer available." Refetch the calendar. |
| (other) | (other) | (other) | 500 | `upstream_error` | Generic "Failed to create booking." |

Behavior:

- The function returns exactly one value on success (the new `bookings.id`).
- Rows are not returned. The function writes one row to `bookings` and updates one row in `available_slots` (the matching `(date, time)` row).
- The function runs in the function owner's context (`SECURITY DEFINER`). In Supabase, the owner is `postgres` (a superuser), which bypasses RLS. The function then locks the matching row, checks `is_booked`, inserts the booking, and flips the slot, all in a single transaction.
- The function is `VOLATILE` (it writes; the default category is correct; explicit is clearer).
- The function does not return `is_booked`, `created_at`, or any other column. The frontend does not need them; minimizing the column list minimizes the data exposure.
- The function does not return any data about the `available_slots` row it modified. The frontend does not need it; the booking id is enough.

## 4. Worker contract

```ts
// workers/booking-reservation-worker.ts (Cloudflare Worker)
interface Env {
  ALLOWED_ORIGIN: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  N8N_BOOKING_WEBHOOK_URL?: string
  N8N_BOOKING_SECRET?: string
}
```

| Concern | Behavior |
|---|---|
| Method | `POST` (or `OPTIONS` for CORS preflight). |
| Path | `/` — the Worker is mounted at the Worker URL; the frontend posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/`. |
| `Origin` | Required; must match an entry in `ALLOWED_ORIGIN`. Mismatch → `403 origin_not_allowed`. |
| `Content-Type` | Required; must be `application/json`. |
| Body | `{ date: "yyyy-MM-dd", time: "string", name: "string", email: "string", company?: "string|null", phone?: "string|null", message?: "string|null", timezone?: "string" }`. |
| Success | `200 { "bookingId": "<uuid>", "notification": "sent" \| "skipped" \| "failed" }`. The Worker returns the RPC's `uuid` and the n8n notification outcome. |
| Validation error | `400 { "error": "<short tag>", "message": "..." }` (invalid JSON, missing required field, RPC raised 22023). |
| Origin denied | `403 { "error": "origin_not_allowed" }`. |
| Method denied | `405 { "error": "method_not_allowed" }`. |
| Slot taken | `409 { "error": "slot_already_booked" \| "slot_not_found" \| "slot_taken" }`. |
| Config / upstream | `500 { "error": "config_error" \| "upstream_error" \| "internal_error", "message": "..." }`. |

What the Worker does:

1. CORS preflight (`OPTIONS`) → `204` with the CORS headers if the `Origin` is allowed; `403 origin_not_allowed` otherwise.
2. Method check → `405 method_not_allowed` for non-`POST` (after `OPTIONS`).
3. `ALLOWED_ORIGIN` gate → `403 origin_not_allowed` for any other `Origin`.
4. Config check → `500 config_error` if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing.
5. JSON parse → `400 invalid_json` if the body is not valid JSON.
6. Payload validation (Worker-side, defense in depth) → `400 <short tag>` if any required field is missing or any cap is exceeded. The same checks are repeated in the SQL; the Worker is the first line.
7. RPC call → `POST ${SUPABASE_URL}/rest/v1/rpc/reserve_slot` with `apikey` and `Authorization: Bearer` headers set to `SUPABASE_SERVICE_ROLE_KEY` and `Content-Type: application/json`. Body: `{ p_date, p_time, p_booking }`. The function runs as `service_role` (which has EXECUTE on `reserve_slot`).
8. RPC success → `200 { "bookingId": "<uuid>" }`. The Worker validates the response is a valid uuid before returning.
9. RPC error → mapped per the table in §3.
10. n8n forward (optional) → if `N8N_BOOKING_WEBHOOK_URL` and `N8N_BOOKING_SECRET` are bound, the Worker forwards the same payload to the n8n booking webhook with the per-form secret header (`X-CodeOutfitters-Form-Secret`). The forward is best-effort; a failure does not fail the booking. The forward's outcome is reported in the response body as `notification: "sent" | "failed" | "skipped"`. If the env vars are not bound, the forward is `skipped`.

What the Worker does NOT do:

- It does NOT expose the `service_role` key in any response body or header. The key is only used as the `apikey` and `Authorization` header to the Supabase REST API.
- It does NOT grant anon EXECUTE on `reserve_slot`. Anon is never granted EXECUTE on `reserve_slot`. The reservation RPC is server-side only.
- It does NOT call the `reserve_slot` RPC from the browser. The browser only knows the Worker URL. The Worker is the boundary.
- It does NOT write to `bookings` or `available_slots` directly. All writes go through the RPC.
- It does NOT log request bodies or response bodies. Cloudflare Workers log request metadata by default; that is fine.
- It does NOT call the Security 4 forms Worker (`workers/n8n-form-proxy.ts`). The forms Worker is for the other three public forms (contact, quote, newsletter). As of Booking B, the booking form posts here instead, and this Worker optionally forwards to n8n directly. The forms Worker is unchanged.

## 5. Frontend files changed

| File | Change |
|---|---|

`lib/booking-actions.ts`

`createBooking` was **replaced wholesale** per its own Booking A docstring. The new body is a thin client-side wrapper that:

- Reads `NEXT_PUBLIC_BOOKING_WORKER_URL` (the new env var). If missing, returns a "booking is temporarily unavailable" error.
- Builds the Worker payload: `{ date, time, name, email, company, phone, message, timezone }`. `company`, `phone`, and `message` are `null` if empty. `timezone` defaults to the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`, falling back to `'America/New_York'`.
- `POST`s the payload to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with `Content-Type: application/json` and `credentials: 'omit'`.
- On `200`: returns `{ data: null, error: null }`.
- On `409`: returns a "this time slot is no longer available" message. The frontend refetches the calendar.
- On `400`: surfaces the Worker's error message.
- On other errors: returns a generic "Failed to create booking" message.

`getAvailableSlots` is unchanged. It still calls `supabase.rpc('get_available_slots', ...)`. The `getSupabase` import is preserved (still used by `getAvailableSlots`).

`components/booking-calendar-custom.tsx`

`handleSubmit` was **replaced** to call `createBooking(formData)` instead of posting to `${NEXT_PUBLIC_FORMS_WORKER_URL}/` directly. The form's local `formData` state (name / email / company / phone / message) is augmented with `preferredDate` (from the selected date), `preferredTime` (from the selected time), and `timezone` (from `Intl.DateTimeFormat().resolvedOptions().timeZone`, falling back to `'America/New_York'`) to build the `BookingFormData` payload.

Imports updated: `import { getAvailableSlots, createBooking } from '@/lib/booking-actions'` and `import type { SlotRecord, BookingFormData } from '@/lib/booking-types'`.

UI design unchanged: step indicator, form fields, placeholder text, validation, honeypot, type field, success state, error state, the "No spam, ever." footer, the booking summary card, the back buttons. The form's `maxLength` caps (100 / 100 / 100 / 20 / 500) are unchanged and match the Worker's stricter caps (100 / 100 / 100 / 20 / 2000).

The `SlotRecord` type in `lib/booking-types.ts` is unchanged. The `BookingFormData` type in `lib/booking-types.ts` is unchanged.

`workers/booking-reservation-worker.ts`

New file. The Cloudflare Worker. CORS gate, payload validation, RPC call, optional n8n forward. No npm dependencies. No package.json change. No `package-lock.json` change. The Worker source is in the repo; deployment is owner-driven.

`supabase/migrations/20260616_booking_b_reserve_slot.sql`

Already on disk (pre-Booking-B; written 629 lines in a prior session). No change in this phase. The migration creates the `reserve_slot` function, adds the `UNIQUE (preferred_date, preferred_time)` constraint on `bookings`, and grants EXECUTE to `service_role` only. Idempotent. Reversible. NOT APPLIED.

`.env.local.example`

Added `NEXT_PUBLIC_BOOKING_WORKER_URL` with a comment block explaining the security model (the Worker holds the `service_role` key server-side; the browser never calls `reserve_slot` directly). No real `.env` or `.env.local` is modified.

`repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md`

New file. This document.

`repo-research/RISK_REGISTER.md`

R-005 row updated to reflect the new state. R-005 added to the "Closed risks" section (closure at code level; full runtime closure pending owner SQL apply + Worker deploy).

`memory/IMPORTANT_DECISIONS.md`

Booking B reflection appended (no new D-IDs).

`PROJECT_CONTROL_LOG.md`

Booking B batch overlay appended.

`ai/AI_TASK_CAPSULE.md`

"Phase we are in" updated; Booking B never-do rules added.

`ai/AI_CONTEXT_RULES.md`

Booking B hard rule added.

`docs/51_AGENT_HANDOFF_LOG.md`

Booking B handoff entry appended.

`memory/CURRENT_STATE.md`

Current state updated.

`memory/WORKING_MEMORY.md`

No new open questions; the file is acknowledged but not changed if there are no new open questions.

Files **not** changed: `package.json`, `package-lock.json`, `pnpm-lock.yaml` (in `.gitignore`; not present), `yarn.lock`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint / tailwind configs, `public/_headers` (no CSP change; the Worker is reachable on `https://*.workers.dev` which is already in the CSP from Security 1 / Security 4), `app/`, `hooks/`, `lib/` (except `lib/booking-actions.ts`), `styles/`, `.mcp.json`, `.opencode/`, `.codex/`, `.claude/`, `tests/`, `.github/`, the four form components (except `components/booking-calendar-custom.tsx`), `lib/supabase.ts`, `lib/booking-schema.sql` (the schema is preserved; the migration only adds one `UNIQUE` constraint), `lib/booking-types.ts`. The forms Worker (`workers/n8n-form-proxy.ts`) is unchanged. The Security 1 Worker (`workers/anthropic-proposal-proxy.ts`) is unchanged.

## 6. Owner-side SQL application steps

The owner applies the Booking B SQL migration after applying the Security 3 RLS migration and the Booking A migration. Recommended order: **Security 3 → Booking A → Booking B → Observability.** The Booking B RPC works in either order (it does not depend on the Booking A RPC), but the full design is coherent only when Security 3 and Booking A are in place.

### 6.1 Recommended: Supabase SQL editor

1. Open the Supabase project dashboard.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `supabase/migrations/20260616_booking_b_reserve_slot.sql` into the editor.
5. **Review the SQL carefully.** The owner is the last line of defense. Do not apply SQL you have not read.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. Confirm the SQL ran without error. The migration is idempotent; if it errors, the safest action is to copy the error message into a new agent session for review, not to retry blindly.
8. Run the read-only verification queries in §9.1 below.

### 6.2 Alternative: Supabase CLI (if the owner already has it set up)

1. From the repo root, ensure `supabase` is installed (out of scope for this phase).
2. Link the project: `supabase link --project-ref <ref>`.
3. Apply the migration: `supabase db push` (if the file is in the standard `supabase/migrations/` location) or `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260616_booking_b_reserve_slot.sql`.
4. Run the same verification queries as in §6.1.

The CLI path is the owner's choice. This phase did not install the Supabase CLI.

### 6.3 Recommended: read the SQL before applying

The owner should read the SQL file end-to-end before applying. The file is heavily commented (629 lines). The function body, the grants, the UNIQUE constraint, and the verification queries are all inline. Any change to the function should be made in the SQL file and re-reviewed.

## 7. Owner-side Worker deployment steps

The owner deploys the Booking Worker to Cloudflare after applying the SQL and after the booking form's frontend is deployed to Cloudflare Pages. The Worker source is `workers/booking-reservation-worker.ts`.

### 7.1 Recommended: `wrangler deploy`

1. From the repo root, ensure `wrangler` is installed (out of scope for this phase; the Cloudflare docs cover install).
2. Create a `wrangler.toml` (or extend the existing one) with the Worker name and the entry point. Example:
   ```toml
   name = "booking-reservation-worker"
   main = "workers/booking-reservation-worker.ts"
   compatibility_date = "2026-06-16"
   ```
3. Bind the env vars via `wrangler secret put`:
   - `wrangler secret put ALLOWED_ORIGIN` → `https://codeoutfitters.com,https://www.codeoutfitters.com`
   - `wrangler secret put SUPABASE_URL` → `https://your-project.supabase.co`
   - `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` → `<the service_role key from the Supabase project settings>`
   - `wrangler secret put N8N_BOOKING_WEBHOOK_URL` → `<the n8n booking webhook URL>` (optional; if not bound, the Worker only does the RPC and skips n8n)
   - `wrangler secret put N8N_BOOKING_SECRET` → `<the booking per-form secret>` (optional; paired with the URL)
4. Deploy: `wrangler deploy`.
5. Note the Worker URL (`https://booking-reservation-worker.<account>.workers.dev`).
6. Set `NEXT_PUBLIC_BOOKING_WORKER_URL` in the Cloudflare Pages dashboard to the Worker URL.
7. Run the read-only verification queries in §9.2 below.

### 7.2 Alternative: Cloudflare dashboard

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages** → **Create** → **Worker**.
3. Paste the contents of `workers/booking-reservation-worker.ts` into the editor.
4. Bind the env vars in **Settings** → **Variables**.
5. **Save and deploy.**
6. Note the Worker URL.
7. Set `NEXT_PUBLIC_BOOKING_WORKER_URL` in the Cloudflare Pages dashboard to the Worker URL.
8. Run the same verification queries as in §7.1.

The dashboard path is the owner's choice. This phase did not run `wrangler deploy` and did not run any Cloudflare dashboard command.

### 7.3 Recommended: read the Worker before deploying

The owner should read the Worker source end-to-end before deploying. The file is heavily commented (~440 lines). The request contract, the response contract, the env vars, the CORS gate, the payload validation, the RPC call, the optional n8n forward, and the error mapping are all inline. Any change to the Worker should be made in the source file and re-reviewed.

### 7.4 n8n workflow update (optional)

If the owner binds `N8N_BOOKING_WEBHOOK_URL` and `N8N_BOOKING_SECRET` to the Booking Worker, the Worker will forward the same payload to the n8n booking webhook with the `X-CodeOutfitters-Form-Secret` header. The n8n workflow should verify the header against the same `N8N_BOOKING_SECRET` env var it uses today. The Security 4 forms Worker is unchanged; it still handles the contact, quote, and newsletter forms.

If the owner does not bind these env vars, the Worker only does the RPC and the n8n booking notification is skipped. The booking still succeeds.

The choice is the owner's. The recommended path is to bind them so the operator still gets a notification; the system tolerates the unbound path because the booking itself is the source of truth.

## 8. Verification queries

### 8.1 SQL-level verification (after applying the migration)

Read-only. The owner runs these after applying the migration.

```sql
-- 1. Confirm the function exists with the right signature and config.
SELECT
  p.proname                                AS function_name,
  pg_get_function_arguments(p.oid)         AS arguments,
  pg_get_function_result(p.oid)            AS returns,
  p.prosecdef                              AS security_definer,
  p.provolatile                            AS volatility,
  p.proconfig                              AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'reserve_slot';
-- Expect: one row; arguments = "p_date date, p_time text, p_booking jsonb";
--         returns = "uuid"; security_definer = true; volatility = 'v';
--         config = ['search_path=pg_catalog, public'].

-- 2. Confirm the grants: only service_role is granted EXECUTE.
--    anon MUST NOT appear. authenticated MUST NOT appear.
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name   = 'reserve_slot';
-- Expect: one row: (service_role, EXECUTE).

-- 3. Confirm the UNIQUE constraint is in place on bookings.
SELECT conname, contype
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'bookings'
  AND conname = 'bookings_preferred_date_time_unique';
-- Expect: one row; conname = 'bookings_preferred_date_time_unique';
--         contype = 'u' (unique).

-- 4. Confirm the Booking A forward-compatible anon EXECUTE grant on
--    get_available_slots is still in place (carried over from
--    Security 3 and Booking A). Anon retains read access.
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name   = 'get_available_slots';
-- Expect: at least (anon, EXECUTE). (service_role, EXECUTE) is
-- also present. authenticated MUST NOT appear.

-- 5. Confirm anon is NOT granted EXECUTE on reserve_slot (the
--    reservation must happen server-side via the Worker).
--    The query in step 2 already covers this: anon MUST NOT
--    appear in routine_privileges for reserve_slot.

-- 6. Confirm anon has no direct SELECT on bookings or available_slots
--    (carried over from Security 3; should still be true).
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('bookings', 'available_slots')
  AND grantee = 'anon';
-- Expect: zero rows.

-- 7. Smoke test: reserve a slot, then try to reserve it again. The
--    first call returns a uuid; the second raises
--    'slot_already_booked' (P0001). Then verify the slot is
--    is_booked = true and the booking row exists.
--    This requires a slot that is currently unbooked; pick one
--    from the seeded weekdays.
--
--    a) Find an unbooked slot.
SELECT id, "date", "time"
FROM public.available_slots
WHERE is_booked = false
ORDER BY "date", "time"
LIMIT 1;
--    b) Reserve it (replace the date / time with the slot you picked).
SELECT public.reserve_slot(
  '2026-08-03'::date,
  '10:00 AM',
  '{"name":"Smoke Test","email":"smoke@example.com","timezone":"America/New_York"}'::jsonb
);
--    Expect: a uuid.
--    c) Try to reserve it again.
SELECT public.reserve_slot(
  '2026-08-03'::date,
  '10:00 AM',
  '{"name":"Smoke Test","email":"smoke@example.com"}'::jsonb
);
--    Expect: ERROR slot_already_booked (SQLSTATE P0001).
--    d) Verify the slot is is_booked = true and the booking row
--       exists with status = 'pending'.
SELECT is_booked FROM public.available_slots
  WHERE "date" = '2026-08-03' AND "time" = '10:00 AM';
--    Expect: true.
SELECT id, name, email, status FROM public.bookings
  WHERE preferred_date = '2026-08-03' AND preferred_time = '10:00 AM';
--    Expect: one row; name = 'Smoke Test'; status = 'pending'.
--    e) Restore the slot to is_booked = false (manual cleanup).
```

### 8.2 Worker-level verification (after deploying the Worker)

Read-only. The owner runs these after deploying the Worker.

```bash
# 1. Smoke test: reserve a slot via the Worker. Replace the URL.
curl -sS -X POST 'https://booking-reservation-worker.<account>.workers.dev/' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://codeoutfitters.com' \
  -d '{
    "date": "2026-08-03",
    "time": "11:00 AM",
    "name": "Worker Smoke",
    "email": "worker-smoke@example.com",
    "timezone": "America/New_York"
  }'
# Expect: HTTP 200 with { "bookingId": "<uuid>", "notification": "sent" | "skipped" | "failed" }.

# 2. CORS preflight:
curl -sS -i -X OPTIONS 'https://booking-reservation-worker.<account>.workers.dev/' \
  -H 'Origin: https://codeoutfitters.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
# Expect: HTTP 204 with the CORS headers.

# 3. Origin denied:
curl -sS -X POST 'https://booking-reservation-worker.<account>.workers.dev/' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://evil.example.com' \
  -d '{ "date": "2026-08-03", "time": "11:00 AM", "name": "X", "email": "x@y.com" }'
# Expect: HTTP 403 with { "error": "origin_not_allowed" }.

# 4. Method denied:
curl -sS -i 'https://booking-reservation-worker.<account>.workers.dev/' \
  -H 'Origin: https://codeoutfitters.com'
# Expect: HTTP 405 with { "error": "method_not_allowed" }.

# 5. Slot already booked: try to reserve the same slot from step 1.
curl -sS -X POST 'https://booking-reservation-worker.<account>.workers.dev/' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://codeoutfitters.com' \
  -d '{
    "date": "2026-08-03",
    "time": "11:00 AM",
    "name": "Worker Smoke 2",
    "email": "worker-smoke-2@example.com"
  }'
# Expect: HTTP 409 with { "error": "slot_already_booked" }.

# 6. Validation error: missing name.
curl -sS -X POST 'https://booking-reservation-worker.<account>.workers.dev/' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://codeoutfitters.com' \
  -d '{ "date": "2026-08-03", "time": "11:00 AM", "email": "x@y.com" }'
# Expect: HTTP 400 with { "error": "name_required" }.

# 7. Validation error: invalid date.
curl -sS -X POST 'https://booking-reservation-worker.<account>.workers.dev/' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://codeoutfitters.com' \
  -d '{ "date": "not-a-date", "time": "11:00 AM", "name": "X", "email": "x@y.com" }'
# Expect: HTTP 400 with { "error": "invalid_date" }.
```

## 9. Frontend integration summary

The frontend integration is the minimal change needed to switch the booking write path to the Booking Worker. No new dependencies. No new components. No design changes. No CSP change (the Worker is reachable on `https://*.workers.dev` which is already in the CSP from Security 1 / Security 4).

- `lib/booking-actions.ts:97` `createBooking(formData)` is the new write path. It posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with the booking payload and preserves the `ActionResult<null>` contract.
- `components/booking-calendar-custom.tsx:16` import updated to include `createBooking`.
- `components/booking-calendar-custom.tsx:17` import updated to include `BookingFormData`.
- `components/booking-calendar-custom.tsx:169` `handleSubmit` is the new submit handler. It validates the form fields (unchanged), builds the `BookingFormData` payload (with `preferredDate`, `preferredTime`, `timezone`), calls `createBooking`, and surfaces the error to the user. The UI design, the step indicator, the form fields, the placeholder text, the validation, the honeypot, the type field, the success state, the error state are unchanged.
- The `SlotRecord` type in `lib/booking-types.ts` is unchanged. The `BookingFormData` type in `lib/booking-types.ts` is unchanged.
- `getAvailableSlots` in `lib/booking-actions.ts:32` is unchanged. It still calls `supabase.rpc('get_available_slots', ...)`.

## 10. Known remaining risks

- **R-005 (booking double-booking) — fully closed at the runtime level (2026-06-16).** Two concurrent submissions for the same slot cannot both succeed. The `reserve_slot` function holds a `SELECT ... FOR UPDATE` row lock on the matching `available_slots` row, and the `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is the last-line defense. R-005 is **fully closed** as of 2026-06-16: the owner confirmed the Worker smoke test passed (bookingId returned), the booking row was created, `available_slots.is_booked` was flipped, and the duplicate booking test returned `slot_already_booked` (`P0001`). The row lock + UNIQUE constraint defense in depth is working as designed. **F-004 is also fully closed at the runtime level** (read path closed by Booking A; write path closed by Booking B; both verified at runtime by the owner on 2026-06-16).
- **R-006 (Supabase no RLS) — closed end-to-end at the SQL level (Security 3, applied and verified at runtime by the owner on 2026-06-16).** RLS is in place. Anon cannot read or write `bookings` or `available_slots` directly. The reservation path is server-side only. The browser never calls `reserve_slot` directly.
- **R-007 / R-031 (seed exhaustion)** — unchanged. The seed populates 12 weeks from `2026-05-18`. The Booking B RPC returns whatever the seed has. The operator must re-seed before the window closes.
- **R-008 (honeypot-only bot protection)** — unchanged. The form still has a honeypot. The Worker is not a new bot vector (it returns 400 for bad payloads after validation, and the validation rejects bad inputs).
- **R-005 (time column ordering)** — carried from Booking A. The `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). The frontend `booking-calendar-custom.tsx` sorts the times for the selected date using a hard-coded `TIME_SLOTS` array, so the order is correct in the UI even when the RPC's order is not. The data is correct; only the RPC's `ORDER BY` is non-chronological. Recorded for a future minor repair; do not start that repair unless explicitly approved.
- **The Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control.** This is the same posture as the Security 1 Worker and the Security 4 forms Worker. CORS is a defense-in-depth, not authentication. The booking form is intentionally public. There is no rate limit on the Worker. The booking form's honeypot is the only bot protection.
- **The Worker holds the `service_role` key.** The key is bound via `wrangler secret put` (or the Cloudflare dashboard). The Worker never returns the key in a response body or header. The key is only used as the `apikey` and `Authorization` header to the Supabase REST API. The key is server-side only.
- **The n8n forward is best-effort.** If the n8n webhook is unreachable, the Worker logs the failure in the response body (`notification: "failed"`) but does not fail the booking. The booking is the source of truth. The operator can refetch the calendar or query the `bookings` table to confirm.
- **The Worker is a single point of failure.** If the Worker is down, the booking form will surface a "Could not reach the booking service" message. There is no retry. There is no DLQ. There is no error tracking. Observability is the future home for this.
- **No `service_role` key in the static bundle, in the repo, in any `NEXT_PUBLIC_*` env var, in the Cloudflare Pages dashboard, or in any client-reachable file.** The key is bound only to the Worker.
- **No tests run in this phase.** No build, no lint, no `npm run`, no `pnpm run`, no `yarn run`. Static inspection only.

## 11. Rollback plan

If the owner applies the migration or deploys the Worker and a regression occurs, the owner can roll back. The rollback is owner-driven. The migration is forward-only; the rollback is here. The Worker is forward-only; the rollback is here.

### 11.1 SQL rollback

```sql
-- Rollback: drop the function and revoke the grants.
-- The UNIQUE constraint is left in place; if the owner also wants
-- to drop it (to restore the pre-Booking-B schema exactly):
-- ALTER TABLE public.bookings
--   DROP CONSTRAINT IF EXISTS bookings_preferred_date_time_unique;
REVOKE EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) FROM service_role;
DROP FUNCTION IF EXISTS public.reserve_slot(date, text, jsonb);
```

After the SQL rollback, the Worker has nothing to call; the frontend's booking submit will fail at the Worker level (502 from the Worker when `supabase.rpc('reserve_slot', ...)` returns an error). The Security 3 RLS policies and the forward-compatible `service_role` grant remain. The booking flow returns to being non-functional at the write path by design; the read path (Booking A) is unchanged.

### 11.2 Worker rollback

The Worker is forward-only. To "roll back" the Worker:

1. Revert `lib/booking-actions.ts` to the Booking A implementation (the direct `supabase.from('bookings').insert(...)` and `supabase.from('available_slots').update(...)` calls). This is owner-driven; the prior version is in the repo history (uncommitted; the owner can recreate the Booking A implementation from `BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §4).
2. Revert `components/booking-calendar-custom.tsx:handleSubmit` to the Booking A implementation (the inline `fetch(NEXT_PUBLIC_FORMS_WORKER_URL, ...)` call). This is owner-driven; the prior version is in the repo history.
3. Delete the `workers/booking-reservation-worker.ts` file.
4. Revert `.env.local.example` to remove `NEXT_PUBLIC_BOOKING_WORKER_URL`. This is optional; the env var is harmless if unused.
5. Optionally delete the Worker from the Cloudflare dashboard or `wrangler delete` it.

After the Worker rollback, the booking form posts to the n8n forms Worker (Security 4) and the n8n operator notification still works. The Supabase write is the part that is gated to Booking B. The booking flow returns to being non-functional at the write path by design.

### 11.3 Frontend rollback

The frontend changes are in `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx`. The owner can revert either file from the repo history (uncommitted; the owner can recreate the prior versions from `BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §4 and §7).

The repo's git history is the source of truth for the frontend code. This phase does not commit, so the owner decides when to commit and when to revert.

## 12. Testing checklist

Static inspection only in this phase. The owner runs the runtime checks below after applying the migration and deploying the Worker.

### 12.1 Owner-side runtime checks (after applying the SQL and deploying the Worker)

- [ ] The Supabase SQL editor shows the function `public.reserve_slot(date, text, jsonb)` with `prosecdef = true`, `provolatile = 'v'`, and `proconfig = ['search_path=pg_catalog, public']`.
- [ ] The grants: only `service_role` is granted EXECUTE on `public.reserve_slot`. Anon does not appear. Authenticated does not appear.
- [ ] The `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is in place.
- [ ] The forward-compatible `anon` EXECUTE grant on `public.get_available_slots` is still in place (carried over from Security 3 and Booking A).
- [ ] Anon has no direct `SELECT` on `bookings` or `available_slots` (carried over from Security 3).
- [ ] The smoke test in §8.1 step 7 returns a uuid, then raises `slot_already_booked` (`P0001`).
- [ ] The Worker is reachable from the deployed site. `curl -X POST ${NEXT_PUBLIC_BOOKING_WORKER_URL}/ -H 'Origin: https://codeoutfitters.com' -d '...'` returns 200 with a bookingId.
- [ ] CORS preflight from `https://codeoutfitters.com` returns 204.
- [ ] CORS preflight from any other origin returns 403.
- [ ] The booking form's submit handler persists a booking row to `bookings` and flips `available_slots.is_booked = true` for the matching `(date, time)`. Verify by querying the tables.
- [ ] The booking form's submit handler returns the success state to the user on 200, and surfaces the error message on 4xx / 5xx.
- [ ] Two simulated rapid submissions for the same slot result in exactly one `bookings` row and one `is_booked = true` row. The second submission surfaces a "this time slot is no longer available" message to the user.
- [ ] The n8n booking webhook receives the booking payload with the `X-CodeOutfitters-Form-Secret` header (if the env vars are bound). The n8n workflow verifies the header.
- [ ] The booking form's direct `supabase.from('bookings').select('*')` or `supabase.rpc('reserve_slot', ...)` call from the browser console returns a 403 / RLS violation or a missing-EXECUTE error. The browser cannot call `reserve_slot` directly.

### 12.2 OpenCode-side static checks (this phase)

- [x] `lib/booking-actions.ts` does **not** call `supabase.from('bookings').insert(...)` or `supabase.from('available_slots').update(...)` anywhere. The only Supabase reference in the file is `getSupabase()` in `getAvailableSlots` (Booking A, unchanged).
- [x] `lib/booking-actions.ts` `createBooking` posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with the booking payload. It does not call `supabase.rpc('reserve_slot', ...)` from the browser.
- [x] `components/booking-calendar-custom.tsx` `handleSubmit` calls `createBooking(formData)`. It does not call the n8n forms Worker directly.
- [x] `workers/booking-reservation-worker.ts` calls `POST ${SUPABASE_URL}/rest/v1/rpc/reserve_slot` with the `service_role` key. It does not log the key. It does not return the key in a response body or header.
- [x] `supabase/migrations/20260616_booking_b_reserve_slot.sql` exists, is heavily commented (629 lines), is idempotent, creates only the `reserve_slot` function and the `UNIQUE` constraint, grants EXECUTE to `service_role` only, and does not modify `get_available_slots` (Booking A).
- [x] `package.json`, `package-lock.json`, `pnpm-lock.yaml` (in `.gitignore`), `yarn.lock`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint / tailwind configs are unchanged. `public/_headers` is unchanged. `app/` is unchanged. `hooks/` is unchanged. `styles/` is unchanged. `workers/` includes the new Worker; the other two Workers are unchanged. `.env*` is unchanged (only the example was touched). `.mcp.json` is unchanged. `.opencode/`, `.codex/`, `.claude/` are unchanged. `tests/` is unchanged. `.github/` is unchanged. The four form components (except `components/booking-calendar-custom.tsx`) are unchanged. `lib/supabase.ts` is unchanged. `lib/booking-schema.sql` is unchanged. `lib/booking-types.ts` is unchanged.
- [x] No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`. No `wrangler deploy`. No `psql`. No Supabase CLI. No database command. No package-manager command. No deploy command. No Cloudflare dashboard command. No Supabase dashboard command. No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- [x] No `package.json` change, no lockfile change, no `tsconfig.json` change, no `next.config.*` change, no `postcss.config.*` change, no eslint config change, no tailwind config change, no real `.env*` change.
- [x] No `Observability` work started. No `QA Slice` work started. No `TS0 / RDG0` work started. No `UIX0 / MOTION0` work started. No `Admin future` work started. No `Final QA / delivery` work started.

### 12.3 What is intentionally NOT tested in this phase

- [ ] No automated tests were run (no test suite exists; QA Slice 1+ is the future home for booking tests).
- [ ] No build was run (`npm run build` would be a future phase).
- [ ] No lint was run (ESLint config is deferred; R-026).
- [ ] No deploy was performed.
- [ ] No Supabase command was run. The owner applies the migration manually.
- [ ] No Worker command was run. The owner deploys the Worker manually.
- [x] No SQL was applied by OpenCode. The SQL is on disk. The owner applied the SQL manually (2026-06-16) and is **verified at runtime** (function exists with the right signature; `prosecdef = true`; `provolatile = 'v'`; `proconfig = ['search_path=pg_catalog, public']`; `service_role` has `EXECUTE`; `anon` and `authenticated` do **not** have `EXECUTE`; `bookings_preferred_date_time_unique` exists). No Worker deploy was performed by OpenCode. The Worker source is on disk; the owner deployed the Worker (2026-06-16) via the Cloudflare dashboard paste of `workers/booking-reservation-worker.dashboard.js` and is **verified at runtime** (smoke test passed; `bookingId` returned; booking row created; `available_slots.is_booked` flipped; duplicate test returned `slot_already_booked`). R-005 is **fully closed at the runtime level** as of 2026-06-16. F-004 is **fully closed at the runtime level** as of 2026-06-16.

## 13. Sign-off

Booking B ships the SQL migration in `supabase/migrations/20260616_booking_b_reserve_slot.sql` (629 lines; quotes `s."date"` and `s."time"`; `SECURITY DEFINER`, `VOLATILE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`; row lock + UNIQUE constraint; `service_role` EXECUTE only; idempotent; reversible), the Worker source in `workers/booking-reservation-worker.ts` (~440 lines; CORS gate; payload validation; RPC call; optional n8n forward; no npm dependencies; no `service_role` key in the static bundle), the dashboard JS copy in `workers/booking-reservation-worker.dashboard.js` (~400 lines; 1:1 runtime port for the Cloudflare dashboard paste; Booking B Repair 1), the frontend `createBooking` replacement in `lib/booking-actions.ts` (preserves `ActionResult<null>`; posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/`), the frontend `handleSubmit` update in `components/booking-calendar-custom.tsx` (calls `createBooking(formData)`; UI design unchanged), and the `.env.local.example` addition of `NEXT_PUBLIC_BOOKING_WORKER_URL`. **The migration was applied by the owner** via the Supabase SQL editor (recommended) or the Supabase CLI (alternative) and is verified at runtime. **The Worker was deployed by the owner** via the Cloudflare dashboard paste of the `.dashboard.js` file (the `.ts` source was rejected by the dashboard parser; the JS dashboard copy is the dashboard-paste form) and is verified at runtime. The owner confirmed the Worker smoke test passed (`bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`), the booking row was created in `public.bookings`, `available_slots.is_booked` was flipped, and the duplicate booking test returned `slot_already_booked` (`P0001`). R-005 is **fully closed at the runtime level** (read path closed by Booking A; write path closed by Booking B; both verified at runtime by the owner on 2026-06-16). F-004 is **fully closed at the runtime level** (read path closed by Booking A; write path closed by Booking B; both verified at runtime by the owner on 2026-06-16). The migration is idempotent and reversible. The booking UI is end-to-end honest: the calendar shows only available slots, and the submit path persists the booking through a single transactional RPC. **Known non-blocking issue (carried from Booking A):** the `"time"` column is `text` and the RPC returns it sorted lexicographically; recorded for a future minor repair or Booking-B-adjacent cleanup; do not start that repair unless explicitly approved. **Remaining deployment gap (informational, not a Booking B defect):** the Cloudflare Pages project is connected to GitHub; the current Pages deployment is still old GitHub code (pre-Booking-B frontend). The booking form's `handleSubmit` on the deployed Pages is the pre-Booking-B form (which posts to the n8n forms Worker; not the new `createBooking` flow). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed. **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy). **Next eligible implementation phase: Observability (A0 future phase #10).** Blocked until ChatGPT Control Room issues the exact Observability prompt.

## 14. Booking B Repair 1 — dashboard JS copy (2026-06-16)

The owner pasted `workers/booking-reservation-worker.ts` into the Cloudflare dashboard Worker editor and received:

```
Uncaught SyntaxError: Unexpected strict mode reserved word at worker.js:178
```

The dashboard Worker editor parses pasted code as JavaScript, not TypeScript. The `.ts` source contains TypeScript-only syntax (`interface Env`, `interface BookingRequest`, `interface RpcOk`, `interface RpcUpstreamError`, `interface NotificationOutcome`, type annotations on function parameters and return values, type predicates like `v is string`, type unions like `'sent' | 'failed' | 'skipped'`, type intersections like `RpcOk & { notification?: ... }`, and `as` casts). The Cloudflare dashboard parser is not a TypeScript parser; `interface` is a strict-mode reserved word in JavaScript, hence the syntax error at the first `interface` declaration.

**Repair:** a 1:1 runtime port of the Worker is shipped at `workers/booking-reservation-worker.dashboard.js`. The port is plain JavaScript (ES module). All TypeScript-only syntax is removed:

- `interface Env` / `interface BookingRequest` / `interface RpcOk` / `interface RpcUpstreamError` / `interface NotificationOutcome` — removed. The shapes exist at runtime; they don't need declarations.
- Type annotations on function parameters and return values — removed (e.g. `function jsonResponse(body: unknown, status: number, origin: string | null): Response` becomes `function jsonResponse(body, status, origin)`).
- Type predicates (`v is string`) — converted to plain boolean expressions.
- Type unions (`'sent' | 'failed' | 'skipped'`, `string | null`) — the runtime values are just strings; the union information is removed.
- Type intersections (`RpcOk & { notification?: ... }`) — the object shape is preserved at runtime; the type intersection is removed.
- `as Type` casts — removed; runtime checks added where necessary (e.g. `typeof message === 'string' && message.startsWith(...)`).

**Runtime logic preserved exactly.** The CORS gate, the payload validation, the Supabase REST call (path, method, headers, body), the response shape, the n8n forward (with `X-CodeOutfitters-Form-Secret` header and `type: 'booking'` body field), and the error mapping (P0001 / 23505 / 22023) are byte-for-byte the same as the `.ts` source.

**Env bindings preserved exactly:** `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET`. No env names changed; no env names added; no env names removed.

**Service-role key handling:** the `SUPABASE_SERVICE_ROLE_KEY` is used only in the `apikey` and `Authorization: Bearer` request headers to the Supabase REST API. It is not logged, not returned in the response body, not returned in any response header. The behavior is byte-for-byte the same as the `.ts` source.

**Supabase RPC path preserved exactly:** `${SUPABASE_URL}/rest/v1/rpc/reserve_slot` (POST, JSON body). No change.

**Worker module format preserved exactly:** `export default { async fetch(request, env) { ... } }`. The Cloudflare Workers dashboard Worker editor accepts the standard ES module default export.

**Deployment paths:**

- **`wrangler` CLI** (recommended for TypeScript-aware deployment): use `workers/booking-reservation-worker.ts`. `wrangler` accepts `.ts` directly (it uses esbuild internally). The TypeScript Worker is the source of truth.
- **Cloudflare dashboard** (when the owner prefers GUI paste, or when `wrangler` is not available): use `workers/booking-reservation-worker.dashboard.js`. Paste this file into the dashboard editor. Do **not** paste the `.ts` source; it will fail with the same syntax error.

**Owner instructions for the dashboard path:**

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages** → your Worker.
3. Click **Edit code**.
4. Open `workers/booking-reservation-worker.dashboard.js` in the local repo.
5. Select-all and copy the file contents.
6. Paste into the dashboard editor (replacing whatever was there).
7. Click **Save and deploy**.
8. Bind the env vars in **Settings** → **Variables** (if not already bound): `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `N8N_BOOKING_WEBHOOK_URL` + `N8N_BOOKING_SECRET`.
9. Run the read-only verification queries in §8.2.

**TypeScript Worker source:** unchanged. The `.ts` file at `workers/booking-reservation-worker.ts` is the source of truth for `wrangler` deploys. The `.dashboard.js` file is a 1:1 runtime port for dashboard paste only. Both files produce the same Worker behavior.

**Hard rules reaffirmed:** no SQL applied; no Worker deployed by OpenCode; no package commands; no `git add` / `commit` / `push`; no service-role key exposed; no Booking B SQL changed; no new phase started. The repair is documentation + a single new file (`workers/booking-reservation-worker.dashboard.js`); the TypeScript Worker is untouched.
