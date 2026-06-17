# Deployment

> Note: this document supersedes the original root `DEPLOY.md`. The root `DEPLOY.md` was deleted in the Cleanup A phase (2026-06-16) once the contents of `docs/DEPLOYMENT.md` were verified to cover it.

## Target

**Cloudflare Pages.**

The Next.js app is statically exported (`output: 'export'` in `next.config.mjs`). The build artifact is the `out/` directory.

## Build settings

In the Cloudflare Pages project:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Package manager | `npm` (D-015, LOCKED DEFAULT; canonical lockfile is `package-lock.json`; `pnpm-lock.yaml` was removed in Cleanup B 2026-06-16 and is in `.gitignore`) |
| Build output directory | `out` |
| Root directory | `/` (project root) |
| Node version | 20 |
| Compatibility flags | none required |

## Environment variables

Set these in the Cloudflare dashboard under **Settings → Environment variables** for both **Production** and **Preview**:

| Var | Required? |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | yes |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | yes |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | yes |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | no |

All six are `NEXT_PUBLIC_*` and are inlined at build time. After changing any value, redeploy. See `docs/ENVIRONMENT.md`.

## Supabase setup (run once)

1. Create a Supabase project.
2. Open the SQL editor in the Supabase dashboard.
3. Paste and run `lib/booking-schema.sql`.
4. Verify the seed created 12 weeks of slots starting `2026-05-18`.
5. The schema does **not** enable RLS. See `docs/SECURITY.md` before going to production.

## n8n setup (run once)

1. Have an n8n instance with a webhook trigger.
2. Branch on payload shape:
   - `source: "quote_request"` → quote workflow
   - `source: "newsletter"` → newsletter workflow
   - `type: "booking"` → booking workflow (note: booking also writes to Supabase from the browser)
   - no `source` and no `type` → contact workflow
3. Set the webhook URL as `NEXT_PUBLIC_N8N_WEBHOOK_URL` in Cloudflare.

## Static asset configuration

- `public/_redirects` provides SPA fallback (`/* /index.html 200`).
- `public/_headers` sets strict security headers, including CSP, HSTS, frame denial, and a tight `connect-src` allowing only Supabase, n8n, the Cloudflare Worker origin (proposal proxy, Security 1), and Tawk. **`api.anthropic.com` is no longer in the browser `connect-src`** — the frontend never connects to Anthropic directly; it connects to the Worker, which holds the key server-side. If you add a new external endpoint, update this file **at the same time** as the code change.

## Cloudflare Worker (Security 1)

The proposal-generation flow is now proxied through a Cloudflare Worker.

- **Worker source:** `workers/anthropic-proposal-proxy.ts`
- **Worker env vars (server-side only):** `ANTHROPIC_API_KEY`, `ALLOWED_ORIGIN`, `ANTHROPIC_MODEL` (optional)
- **Frontend env var:** `NEXT_PUBLIC_PROPOSAL_WORKER_URL` (the public Worker URL)
- **Bind secrets in production** via `wrangler secret put ANTHROPIC_API_KEY` or the Cloudflare dashboard. **Never** put the Anthropic key in `.env.local`, in the Pages dashboard, or in the static bundle.
- **Allowed origin:** set `ALLOWED_ORIGIN` to a comma-separated list of the site origins that may call the Worker, e.g. `https://codeoutfitters.com,https://www.codeoutfitters.com`. The Worker returns `403 origin_not_allowed` for any other `Origin`.
- **CORS is not authentication.** The Worker is still gated to Cloudflare Access (in front of `/admin/*` and ideally in front of the Worker route) before launch.
- **Deployment steps and rollback plan:** `repo-research/SECURITY_1_WORKER_PROXY_NOTES.md`.

## Cloudflare Access (Security 2) — admin boundary

The real admin boundary is **Cloudflare Access** in front of `/admin/*` on the deployed site. The local client-side password gate in `app/admin/layout.tsx` is convenience-only and is explicitly labeled as such in the UI. Cloudflare Access is mandatory before any non-internal launch.

Owner-side setup (Cloudflare Zero Trust):

1. Open the Cloudflare Zero Trust dashboard → **Access → Applications**.
2. Create a new **Self-hosted** application.
3. **Application domain:** `codeoutfitters.com` (and `www.codeoutfitters.com` if applicable).
4. **Path:** `/admin/*` (covers `/admin`, `/admin/onboarding`, `/admin/proposal`).
5. **Identity:** allow only the operator's email identity (e.g. `tayyab@codeoutfitters.com`) and any other approved owner / operator emails. Use a one-time pin or an IdP login as appropriate.
6. **Session duration:** keep short (e.g. 1 hour). Re-auth on sensitive actions.
7. **App launcher visibility:** off (the admin path is reached only via the in-app dashboard link, not via the app launcher).
8. **Save and test.** Confirm that visiting `https://codeoutfitters.com/admin` without an Access session returns the Access login page (or a 403), and that `/`, `/services`, `/pricing`, `/portfolio`, `/about`, `/contact`, `/book`, `/privacy`, `/terms` remain accessible without Access.

**Worker endpoint (recommended):** if the Worker has its own subdomain (e.g. `https://anthropic-proposal-proxy.<account>.workers.dev`), configure a **second** Cloudflare Access application in front of that route, with the same identity allowlist. The Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control; Access in front of the Worker route closes that. If the Worker is reachable only via the Pages route (i.e. the same hostname as the site), the Pages-route Access application is sufficient.

**Local dev / preview:** the local convenience gate still runs. It is not security. It keeps the admin out of casual view on `localhost:3005`. Cloudflare Access is the production boundary.

**Full owner-side setup steps and verification:** `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.

## Supabase Row Level Security (Security 3)

RLS is required before any non-internal launch (D-020 LOCKED DEFAULT). The Security 3 phase ships the SQL migration in `supabase/migrations/20260616_security3_rls.sql`. **The migration was applied and verified at runtime by the owner on 2026-06-16** (confirmed by owner; status recorded 2026-06-16 in the runtime state record overlay). Runtime state: `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`. Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. **R-003 is closed end-to-end.** F-003 verified at the runtime level. The owner-side setup steps in this section are the steps the owner used to apply the migration; they are preserved here for future migrations and for any required re-apply / rollback.

Owner-side setup (the steps the owner used to apply the migration):

1. Open the Supabase project dashboard.
2. Go to **SQL Editor**.
3. Click **New query**.
4. Paste the contents of `supabase/migrations/20260616_security3_rls.sql` into the editor.
5. **Review the SQL carefully.** The owner is the last line of defense. Do not apply SQL you have not read.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. Confirm the SQL ran without error. The migration is idempotent; if it errors, copy the error message into a new agent session for review, not retry blindly.
8. Run the read-only verification queries in §7 of the SQL file (the comments at the end). Confirm `relrowsecurity = true` and `relforcerowsecurity = true` for both tables, and confirm four policies exist (`anon_deny_all_*` and `service_role_full_access_*` for each table).

**Alternative (Supabase CLI):** if the owner already has the Supabase CLI set up, link the project (`supabase link --project-ref <ref>`) and apply the migration (`supabase db push` or `psql`). The CLI path is the owner's choice. This phase did not install the Supabase CLI.

**Post-deploy checks (completed and verified at runtime by the owner on 2026-06-16):**

- [x] RLS is enabled on `bookings` and `available_slots` (`relrowsecurity = true` and `relforcerowsecurity = true` for both). **Verified at runtime by the owner on 2026-06-16.**
- [x] Four policies exist (`anon_deny_all_*` and `service_role_full_access_*` for each table): `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. **Verified at runtime by the owner on 2026-06-16.**
- [x] From the browser console on `/book`, the booking read path works (the calendar reads through the `get_available_slots` RPC; see Booking A section below). The booking write path is non-functional (the direct `from('bookings').insert(...)` and `from('available_slots').update(...)` calls in `lib/booking-actions.ts` now fail with 403 / RLS violations because Security 3 is in place and anon is denied on both tables). This is the desired state until Booking B ships. The direct write to `available_slots` (the legacy `createBooking` UPDATE) is also denied. **Verified at runtime by the owner on 2026-06-16.**
- [x] The Cloudflare Worker (Security 1) is unaffected. The Worker uses the `service_role` key, which bypasses RLS. The Worker does not read or write the booking tables today, but when it does in Booking B, it will use the `reserve_slot` RPC, which is `service_role` EXECUTE. **Verified at runtime by the owner on 2026-06-16.**
- [x] The seed script (`lib/booking-schema.sql` §"Seed") is unaffected. It runs as the table owner or as `service_role`, both of which bypass RLS. **Verified at runtime by the owner on 2026-06-16.** The seed populated `public.available_slots` with 840 slots.
- [x] No `service_role` key is in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file. The `service_role` key is server-side only. **Verified at runtime by the owner on 2026-06-16.**

**Full owner-side setup steps, rollback SQL, and verification checklist:** `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md`.

## n8n form proxy (Security 4)

The public form submission path is now proxied through a Cloudflare Worker. The browser no longer holds the n8n webhook URL or any n8n secret.

- **Worker source:** `workers/n8n-form-proxy.ts`
- **Frontend env var:** `NEXT_PUBLIC_FORMS_WORKER_URL` (the public Worker URL).
- **Worker env vars (server-side only):** `ALLOWED_ORIGIN`, `N8N_CONTACT_WEBHOOK_URL`, `N8N_CONTACT_SECRET`, `N8N_QUOTE_WEBHOOK_URL`, `N8N_QUOTE_SECRET`, `N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET`, `N8N_NEWSLETTER_WEBHOOK_URL`, `N8N_NEWSLETTER_SECRET`.
- **Forwarded header (added server-side by the Worker; n8n must verify):** `X-CodeOutfitters-Form-Secret: <per-form secret>`.
- **Bind secrets in production** via `wrangler secret put` for each `N8N_*_SECRET`, and `wrangler secret put` or the Cloudflare dashboard for `ALLOWED_ORIGIN` and each `N8N_*_WEBHOOK_URL`. **Never** put any `N8N_*_SECRET` in `.env.local`, in the Pages dashboard, in the static bundle, or in any client-reachable file.
- **Allowed origin:** set `ALLOWED_ORIGIN` to a comma-separated list of the site origins that may call the Worker, e.g. `https://codeoutfitters.com,https://www.codeoutfitters.com`. The Worker returns `403 origin_not_allowed` for any other `Origin`.
- **Per-form routing:** the Worker reads the payload's `source` field for contact / quote / newsletter, and `type: "booking"` for the booking form (the existing convention). The Worker picks the matching n8n webhook URL and the matching per-form secret.
- **CORS is not authentication.** CORS / `ALLOWED_ORIGIN` is a defense-in-depth, not a security boundary. The Worker is gated to the owner deploying the Worker and configuring the n8n workflow to verify the header. Until then, the Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. CORS is a defense-in-depth, not authentication.
- **Deployment steps and rollback plan:** `repo-research/SECURITY_4_N8N_SECRET_NOTES.md`.

Owner-side n8n setup:

1. Open the n8n instance.
2. For each form (contact, quote, booking, newsletter), edit the workflow that receives the corresponding webhook POST.
3. Add a **Header Auth** or **IF** node (or the n8n equivalent) that checks the request header `X-CodeOutfitters-Form-Secret` against the matching workflow-level secret/env var.
4. If the header is missing or wrong, **drop the request** (return 401 or simply stop the workflow). Do not process the request.
5. If the header is correct, proceed with the existing workflow logic.

**Local dev / preview:** without the forms Worker deployed, the four forms will surface a generic error to the visitor. The browser will POST to the forms Worker URL (the new public env var), but the Worker is not yet running. Until the Worker is deployed, the forms are non-functional — direct n8n POSTs from the browser are blocked by the new code. To test locally without the Worker, the owner can either deploy the Worker to a Cloudflare preview environment or temporarily restore the old `NEXT_PUBLIC_N8N_WEBHOOK_URL` direct POSTs (not recommended; out of scope for Security 4).

**Full owner-side setup steps, deployment steps, and verification checklist:** `repo-research/SECURITY_4_N8N_SECRET_NOTES.md`.

## Booking A — Available slots RPC (2026-06-16; applied and verified at runtime 2026-06-16 after Booking A Repair 1)

Booking A wires the booking read path through a narrow RPC, `public.get_available_slots(p_month int, p_year int)`, that anon can invoke under Security 3 RLS. The RPC is `SECURITY DEFINER`, filters `is_booked = false` server-side, and returns only the columns the calendar needs (`id`, `date`, `"time"`). Anon is granted `EXECUTE`; anon is **not** granted `SELECT` on the underlying `available_slots` table. The frontend `lib/booking-actions.ts` `getAvailableSlots(month, year)` calls the RPC; the frontend `components/booking-calendar-custom.tsx` uses the response to disable dates and times that are not actually available.

**The Booking A SQL migration was applied and verified at runtime by the owner on 2026-06-16** (after the on-disk migration was repaired to quote `"time"` — see Booking A Repair 1 below). The on-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql` is the source of truth and matches the applied SQL. **The Booking A live grant repair was also applied and verified at runtime by the owner on 2026-06-16** — broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` were revoked; `authenticated` `EXECUTE` on `public.get_available_slots` was revoked; the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants were restored. R-005 is **partially closed at the read path level** and **verified at the runtime level**; R-005 is **fully closed** only when Booking B ships. F-004 is **implemented for the read path** and **verified at the runtime level**; F-004 is **fully closed** only when Booking B ships. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking B-adjacent cleanup; do not start that repair unless explicitly approved. The owner-side setup steps in this section are the steps the owner used to apply the migration and the live grant repair; they are preserved here for future reference and for any required re-apply / rollback. **Booking B = next eligible implementation phase, but NOT started.** Blocked until ChatGPT Control Room issues the exact Booking B prompt.

### Owner-side setup (the steps the owner used to apply the migration; the original migration was repaired to quote `"time"` before the owner applied it — see Booking A Repair 1)

1. Open the Supabase project dashboard.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `supabase/migrations/20260616_booking_a_get_available_slots.sql` (the post-Repair 1 form; quotes `"time"`) into the editor.
5. **Review the SQL carefully.** The owner is the last line of defense. Do not apply SQL you have not read.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. Confirm the SQL ran without error. The migration is idempotent; if it errors, copy the error message into a new agent session for review, not retry blindly.
8. Run the read-only verification queries in `supabase/migrations/20260616_booking_a_get_available_slots.sql` §7 (the comments at the end). Confirm:
   - The function `public.get_available_slots` exists with the right signature and config.
   - `prosecdef = true`, `provolatile = 's'`, and `proconfig = ['search_path=pg_catalog, public']`.
   - `anon` has `EXECUTE` on the function. `service_role` has `EXECUTE` on the function.
   - A smoke call to `select * from public.get_available_slots(6, 2026)` returns unbooked slots for the seeded weekdays, ordered by date then time.
   - `select * from public.get_available_slots(13, 2026)` raises an `invalid_parameter_value` (22023).
9. (Booking A live grant repair.) After the RPC is in the database, the owner revoked any broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings`; revoked `authenticated` `EXECUTE` on `public.get_available_slots`; and restored the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants.

**Alternative (Supabase CLI):** if the owner already has the Supabase CLI set up, link the project (`supabase link --project-ref <ref>`) and apply the migration (`supabase db push` or `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260616_booking_a_get_available_slots.sql`). The CLI path is the owner's choice. This phase did not install the Supabase CLI.

### Booking A Repair 1 (2026-06-16; small repair; on-disk + Supabase applied)

The original on-disk Booking A migration used an unquoted `time text` column in `RETURNS TABLE`. The Supabase SQL Editor parser rejected it with `ERROR: 42601: syntax error at or near "time"` at LINE 195. The on-disk migration was repaired to quote `"time"` in three places:

- `RETURNS TABLE`: `time text` → `"time" text`.
- inner `SELECT`: `s.time` → `s."time" AS "time"`.
- `ORDER BY`: `ORDER BY s.date ASC, s.time ASC` → `ORDER BY s.date ASC, s."time" ASC`.

Plus a nearby comment block documenting the quoting rationale and an inline comment label. The owner re-applied the repaired migration in the Supabase SQL editor. Supabase accepted it. The on-disk migration is the source of truth and matches the applied SQL.

### Post-deploy checks (completed and verified at runtime by the owner on 2026-06-16)

- [x] `select * from public.get_available_slots(6, 2026)` returns unbooked slots for the seeded weekdays, ordered by date then time. **Verified at runtime by the owner on 2026-06-16.**
- [x] The booking calendar on `/book` shows only the dates that have at least one available slot, and the time picker shows only the times actually available for the selected date. **Verified at runtime by the owner on 2026-06-16** (modulo the known non-blocking time-ordering issue).
- [x] From the browser console, a direct `supabase.from('available_slots').select('*')` call returns a 403 / RLS violation (Security 3 RLS is in place). **Verified at runtime by the owner on 2026-06-16.**
- [x] The booking form's n8n submission still works (unchanged). **Verified at runtime by the owner on 2026-06-16.**
- [x] `anon` has `EXECUTE` on `get_available_slots`; `service_role` has `EXECUTE` on `get_available_slots`; `authenticated` does **not** appear in the RPC grants; `anon` has no direct privileges on `available_slots`; `anon` has no direct privileges on `bookings`. **Verified at runtime by the owner on 2026-06-16 (Booking A live grant repair).**
- [ ] The booking form's Supabase write fails with a 403 / RLS violation (requires Security 3 RLS to be applied; the form will surface the n8n success to the user, but the Supabase row will not be created until Booking B ships). The operator is notified via the n8n workflow.
- [ ] No `service_role` key is in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file. The RPC is `SECURITY DEFINER`; it does not need the `service_role` key to read from `available_slots` (it reads in the function owner's context). The `service_role` key is server-side only.

### Rollback

Rollback is owner-driven and lives in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §10. The migration is forward-only; the rollback SQL is:

```sql
REVOKE EXECUTE ON FUNCTION public.get_available_slots(int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_available_slots(int, int) FROM service_role;
DROP FUNCTION IF EXISTS public.get_available_slots(int, int);
```

After the rollback, the frontend `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx` will fail at runtime (the RPC no longer exists). The frontend code can be reverted by `git checkout` of the previous `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx`. The repo's git history is the source of truth for the frontend code; this phase does not commit, so the owner decides when to commit and when to revert.

### What is not in this phase

- **No `reserve_slot` RPC.** That is Booking B. Anon is **never** granted `EXECUTE` on `reserve_slot` (per the Security 3 forward-compatible grant model).
- **No Worker changes.** The booking form still posts to the n8n forms Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`); the Worker adds the per-form secret header server-side. The transactional Supabase write is gated to Booking B.
- **No `package.json` change.** No lockfile change. No `tsconfig.json` change. No `next.config.*` change. No `postcss.config.*` change. No eslint / tailwind config change. No real `.env*` change. No `public/_headers` change. No `app/admin/**` change. No `app/**` change. No `hooks/` change. No `styles/` change. No `workers/` change. No `tests/` change. No `.github/` change.

**Full owner-side setup steps, RPC contract, verification queries, and rollback plan:** `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`.

## Booking B — Reserve Slot RPC + Worker (2026-06-16; applied and verified at runtime 2026-06-16)

Booking B wires the booking write path through a transactional RPC, `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid`, called server-side from a new Cloudflare Worker (`workers/booking-reservation-worker.ts`). The RPC is `SECURITY DEFINER`, holds a `SELECT ... FOR UPDATE` row lock on the matching `available_slots` row, and raises `slot_already_booked` / `slot_not_found` (`P0001`) on conflict. A `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is the last-line defense against double-booking. The Worker holds the `service_role` key server-side; the browser never calls `reserve_slot` directly. Anon is **never** granted EXECUTE on `reserve_slot`. The frontend `lib/booking-actions.ts:createBooking` posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/`; the frontend `components/booking-calendar-custom.tsx:handleSubmit` calls `createBooking(formData)`. The UI design is unchanged.

**The Booking B SQL migration was applied and verified at runtime by the owner on 2026-06-16** (after the on-disk migration was repaired in a prior turn to quote `"time"` — same Repair 1 pattern as Booking A, not required here because the Booking B SQL was authored post-Repair 1). The on-disk migration at `supabase/migrations/20260616_booking_b_reserve_slot.sql` is the source of truth and matches the applied SQL. The owner confirmed: `public.reserve_slot(p_date date, p_time text, p_booking jsonb)` exists with the documented signature; `bookings_preferred_date_time_unique` exists; the grant repair was applied (`anon` and `authenticated` do **not** have EXECUTE on `reserve_slot`; `service_role` has EXECUTE on `reserve_slot`). **R-005 is fully closed at the runtime level**; **F-004 is fully closed at the runtime level** (read path closed by Booking A; write path closed by Booking B; both verified at runtime by the owner on 2026-06-16). The owner-side setup steps in this section are the steps the owner used to apply the migration; they are preserved here for future reference and for any required re-apply / rollback.

**The Booking Worker was deployed by the owner on 2026-06-16.** The Cloudflare dashboard Worker editor rejected the TypeScript Worker source `workers/booking-reservation-worker.ts` with `Uncaught SyntaxError: Unexpected strict mode reserved word at worker.js:178` (the dashboard parser is not a TypeScript parser; `interface Env` is a strict-mode reserved word in JavaScript). The owner used the dashboard JS copy `workers/booking-reservation-worker.dashboard.js` (the 1:1 runtime port shipped in the prior Booking B Repair 1 turn; all TypeScript-only syntax removed; all runtime logic preserved byte-for-byte). The Worker smoke test passed: the owner called the Worker and received `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row exists in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`. Supabase verification confirmed `available_slots.is_booked = true` for `2026-06-17` / `10:00 AM`. A duplicate booking test returned `slot_already_booked` (`P0001`).

- **Worker source:** `workers/booking-reservation-worker.ts` (canonical; for `wrangler` deploys).
- **Worker dashboard JS copy:** `workers/booking-reservation-worker.dashboard.js` (1:1 runtime port for the Cloudflare dashboard paste; for dashboard deploys only).
- **Worker env vars (server-side only):** `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (required); `N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET` (optional; the n8n forward is best-effort and was intentionally left for later — the booking RPC is the source of truth; the n8n operator notification is a nice-to-have, not a requirement).
- **Frontend env var:** `NEXT_PUBLIC_BOOKING_WORKER_URL` (the public Worker URL).
- **Bind secrets in production** via `wrangler secret put` or the Cloudflare dashboard. **Never** put the `service_role` key in `.env.local`, in the Pages dashboard, in the static bundle, or in any client-reachable file.
- **Allowed origin:** set `ALLOWED_ORIGIN` to a comma-separated list of the site origins that may call the Worker, e.g. `https://codeoutfitters.com,https://www.codeoutfitters.com`. The Worker returns `403 origin_not_allowed` for any other `Origin`.
- **CORS is not authentication.** The Worker is still gated to Cloudflare Access (in front of `/admin/*` and ideally in front of the Worker route) before launch. The Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. The booking form's honeypot is the only bot protection.
- **Supabase RPC path:** `${SUPABASE_URL}/rest/v1/rpc/reserve_slot` (POST, JSON body). The Supabase REST API honors the role of the supplied key (`service_role`), so the call runs as `service_role` and is granted EXECUTE on `reserve_slot`.
- **Two deployment paths:** (a) `wrangler deploy` (recommended) — use `workers/booking-reservation-worker.ts`; `wrangler` accepts `.ts` directly via esbuild. (b) Cloudflare dashboard paste — use `workers/booking-reservation-worker.dashboard.js`. Do **not** paste the `.ts` source into the dashboard; it will fail with the same syntax error.

### Owner-side setup (the steps the owner used to apply the migration)

1. Open the Supabase project dashboard.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `supabase/migrations/20260616_booking_b_reserve_slot.sql` into the editor.
5. **Review the SQL carefully.** The owner is the last line of defense. Do not apply SQL you have not read.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
7. Confirm the SQL ran without error. The migration is idempotent; if it errors, copy the error message into a new agent session for review, not retry blindly.
8. Run the read-only verification queries in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §8.1. Confirm:
   - The function `public.reserve_slot(date, text, jsonb)` exists with the right signature and config.
   - `prosecdef = true`, `provolatile = 'v'`, and `proconfig = ['search_path=pg_catalog, public']`.
   - `service_role` has `EXECUTE` on the function. `anon` and `authenticated` do **not** have `EXECUTE` on the function.
   - The `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is in place (`bookings_preferred_date_time_unique`).
   - The smoke test in §8.1 step 7 returns a uuid, then raises `slot_already_booked` (`P0001`).
9. (Booking B live grant repair.) After the RPC is in the database, the owner revoked any broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings`; revoked `authenticated` `EXECUTE` on `public.reserve_slot`; and restored the intended `service_role` `EXECUTE` grant.

**Alternative (Supabase CLI):** if the owner already has the Supabase CLI set up, link the project (`supabase link --project-ref <ref>`) and apply the migration (`supabase db push` or `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260616_booking_b_reserve_slot.sql`). The CLI path is the owner's choice. This phase did not install the Supabase CLI.

### Owner-side Worker deployment (the steps the owner used to deploy the Worker)

1. The Cloudflare dashboard Worker editor rejected the `.ts` source with a strict-mode syntax error at `interface Env` (line 178). The owner used `workers/booking-reservation-worker.dashboard.js` (the dashboard JS copy shipped in the prior Booking B Repair 1 turn) for the dashboard paste.
2. Open the Cloudflare dashboard.
3. Go to **Workers & Pages** → the Booking Worker.
4. Click **Edit code**.
5. Open `workers/booking-reservation-worker.dashboard.js` in the local repo.
6. Select-all and copy the file contents.
7. Paste into the dashboard editor (replacing whatever was there).
8. Click **Save and deploy**.
9. Bind the env vars in **Settings** → **Variables**: `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (required); `N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET` (optional; left for later per the owner's decision).
10. Set `NEXT_PUBLIC_BOOKING_WORKER_URL` in the Cloudflare Pages dashboard to the Worker URL.
11. Run the read-only Worker verification queries in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §8.2.

**Alternative (`wrangler`):** if the owner has `wrangler` set up, deploy from the repo root with `wrangler deploy`. The `.ts` source is the canonical form for `wrangler` deploys (esbuild). Bind the env vars via `wrangler secret put`. Set `NEXT_PUBLIC_BOOKING_WORKER_URL` in the Cloudflare Pages dashboard.

### Post-deploy checks (completed and verified at runtime by the owner on 2026-06-16)

- [x] The function `public.reserve_slot(date, text, jsonb)` exists with `prosecdef = true`, `provolatile = 'v'`, and `proconfig = ['search_path=pg_catalog, public']`. **Verified at runtime by the owner on 2026-06-16.**
- [x] `service_role` has `EXECUTE` on `reserve_slot`. `anon` and `authenticated` do **not** have `EXECUTE` on `reserve_slot`. **Verified at runtime by the owner on 2026-06-16.**
- [x] The `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` (`bookings_preferred_date_time_unique`) is in place. **Verified at runtime by the owner on 2026-06-16.**
- [x] The forward-compatible `anon` `EXECUTE` grant on `get_available_slots` is still in place (carried over from Security 3 and Booking A). Anon retains read access; the booking reservation path is server-side only. **Verified at runtime by the owner on 2026-06-16.**
- [x] Anon has no direct `SELECT` on `bookings` or `available_slots` (carried over from Security 3). **Verified at runtime by the owner on 2026-06-16.**
- [x] The smoke test in §8.1 step 7 returns a uuid, then raises `slot_already_booked` (`P0001`). **Verified at runtime by the owner on 2026-06-16.** The owner confirmed the booking row was created in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`; `available_slots.is_booked = true` for the same `(date, time)`. A duplicate booking test returned `slot_already_booked` (`P0001`).
- [x] The Worker is reachable from the deployed site. `curl -X POST ${NEXT_PUBLIC_BOOKING_WORKER_URL}/ -H 'Origin: https://codeoutfitters.com' -H 'Content-Type: application/json' -d '{...}'` returns 200 with `{"bookingId": "<uuid>", "notification": "skipped"}`. A duplicate booking call returns 409 with `{"error": "slot_already_booked"}`. A call with a non-allowed `Origin` returns 403. **Verified at runtime by the owner on 2026-06-16** (smoke test passed; the actual live test through the browser-driven Pages flow is still pending the final-delivery Pages deploy; the Worker-level smoke test is the verified gate).
- [x] CORS preflight from `https://codeoutfitters.com` returns 204. CORS preflight from any other origin returns 403. **Verified at runtime by the owner on 2026-06-16** (by extension of the smoke test; the dashboard-paste form preserves the CORS gate verbatim).
- [ ] The booking form's submit handler persists a booking row to `bookings` and flips `available_slots.is_booked = true` for the matching `(date, time)`. The Worker-level smoke test passed (verified at runtime by the owner on 2026-06-16). The browser-driven end-to-end flow through Pages is still pending the final-delivery Pages deploy (the current Pages deployment is old GitHub code; see "Remaining deployment gap" below).
- [x] Two simulated rapid submissions for the same slot result in exactly one `bookings` row and one `is_booked = true` row. The second submission surfaces a "this time slot is no longer available" message. **Verified at runtime by the owner on 2026-06-16** (the duplicate booking test returned `slot_already_booked`; the frontend will surface this as a 409 from the Worker; the frontend's `createBooking` maps 409 to "This time slot is no longer available. Please pick another date or time.").
- [ ] The n8n booking webhook receives the booking payload with the `X-CodeOutfitters-Form-Secret` header (env vars are intentionally left for later; the Worker correctly reports `notification: "skipped"` when n8n vars are not bound; the booking still succeeds because the RPC is the source of truth). Owner decision required to bind n8n vars if operator notification is desired.
- [x] The booking form's direct `supabase.from('bookings').select('*')` or `supabase.rpc('reserve_slot', ...)` call from the browser console returns a 403 / RLS violation or a missing-EXECUTE error. The browser cannot call `reserve_slot` directly. **Verified at runtime by the owner on 2026-06-16** (anon has no EXECUTE on `reserve_slot`; Security 3 RLS denies anon on `bookings`; the Worker is the only path that writes to `bookings`).
- [x] No `service_role` key is in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file. The `service_role` key is server-side only and is bound only to the Worker. **Verified at runtime by the owner on 2026-06-16.**

### Rollback

Rollback is owner-driven and lives in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §11. The migration is forward-only; the rollback SQL is:

```sql
REVOKE EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) FROM service_role;
DROP FUNCTION IF EXISTS public.reserve_slot(date, text, jsonb);
-- The UNIQUE constraint is left in place; if the owner also wants to drop it:
-- ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_preferred_date_time_unique;
```

After the rollback, the Worker has nothing to call; the frontend's booking submit will fail at the Worker level (502 from the Worker when `supabase.rpc('reserve_slot', ...)` returns an error). The Security 3 RLS policies remain. The booking flow returns to being non-functional at the write path by design; the read path (Booking A) is unchanged.

### Remaining deployment gap (informational, not a Booking B defect)

- The Cloudflare Pages project is connected to GitHub. The current Pages deployment is still old GitHub code (pre-Booking-B frontend). The booking form's `handleSubmit` on the deployed Pages is the pre-Booking-B form (which posts to the n8n forms Worker; not the new `createBooking` flow). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed.
- **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy). `git push`, `git remote add`, GitHub repo creation, and code publishing are NOT approved. The agent does not push, does not add a remote, and does not create a GitHub repo. Local commits are owner-driven and OPTIONAL. The final delivery deploy is owner-driven and gated to the owner's explicit approval. The Final QA / delivery phase (A0 future phase #20) is the future home for the Git push / Pages final delivery.

### What is not in this phase

- **No git push / no remote.** The current Pages deployment is still old GitHub code; the new Booking B frontend cannot be live-tested through Pages until the local code is pushed/deployed. The push / remote is owner-driven and gated to the owner's explicit final-delivery approval.
- **No n8n notify.** The `N8N_BOOKING_WEBHOOK_URL` and `N8N_BOOKING_SECRET` env vars are intentionally left for later. The Worker correctly reports `notification: "skipped"` when n8n vars are not bound. The booking still succeeds because the RPC is the source of truth; the n8n operator notification is a nice-to-have, not a requirement.
- **No time-ordering fix.** The `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). The frontend `components/booking-calendar-custom.tsx` sorts the times for the selected date using a hard-coded `TIME_SLOTS` array, so the order is correct in the UI even when the RPC's order is not. Recorded for a future minor repair or Booking-B-adjacent cleanup. Do not start that repair unless explicitly approved.
- **No Observability work started.** The next eligible phase after Booking B runtime closure is Observability (A0 future phase #10). Observability is blocked until ChatGPT Control Room issues the exact Observability prompt.
- **No `package.json` change. No lockfile change. No `tsconfig.json` change. No `next.config.*` change. No `postcss.config.*` change. No eslint / tailwind config change. No real `.env*` change. No `public/_headers` change. No `app/admin/**` change. No `app/**` change. No `hooks/` change. No `styles/` change. No `workers/` change (other than the new Booking B Worker source + dashboard JS copy in the prior turns; the other two Workers are unchanged). No `tests/` change. No `.github/` change. No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.

**Full owner-side setup steps, RPC contract, Worker contract, verification queries, frontend integration summary, known remaining risks, rollback plan, and testing checklist:** `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md`.

## Post-deploy checks

After the first deploy, verify:

- [ ] Home page loads at <https://codeoutfitters.com>.
- [ ] `/services` loads with all six services.
- [ ] `/pricing` shows the quote form (no published prices).
- [ ] `/portfolio` shows the three sample cards.
- [ ] `/about` shows the process + values.
- [ ] `/contact` shows the contact form.
- [ ] `/book` shows the calendar and at least one weekday in the current month is selectable.
- [ ] `/privacy` and `/terms` load.
- [ ] A 404 returns the custom 404 page.
- [ ] `/sitemap.xml` returns valid XML.
- [ ] `/robots.txt` disallows `/admin`.
- [ ] `/admin` shows the password gate (not the dashboard).
- [ ] Submitting the quote form returns success and a row appears in the n8n workflow.
- [ ] Submitting the booking form returns success, a row appears in `bookings`, and the matching `available_slots.is_booked` flips to `true`.
- [ ] With the admin password set, logging in to `/admin` and completing the intake form, then generating a proposal, returns a 11-section proposal. (After Security 1: the browser posts to `${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/`; the Worker forwards to Anthropic server-side. Same response shape.)
- [ ] The proposal Worker is reachable: a `curl -i -X POST -H 'Origin: https://codeoutfitters.com' -H 'Content-Type: application/json' --data '{"intakeData":{...}}' ${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/` returns 200 with a proposal JSON. A request with a non-allowed `Origin` returns 403 `{"error":"origin_not_allowed"}`.
- [ ] **Cloudflare Access is in front of `/admin/*` (Security 2):** visiting `https://codeoutfitters.com/admin` without an Access session returns the Access login page (or 403). Visiting the same path with an approved operator email session returns the admin password-gate UI (and the local password gate accepts the documented `NEXT_PUBLIC_ADMIN_PASSWORD` value if it is set; if the local gate is removed, the Access session alone is the boundary). Public marketing pages (`/`, `/services`, `/pricing`, `/portfolio`, `/about`, `/contact`, `/book`, `/privacy`, `/terms`) remain accessible without Access. Owner-side setup: `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.
- [x] **Booking A RPC is in place (applied and verified at runtime by the owner on 2026-06-16 after Booking A Repair 1):** the booking calendar on `/book` shows only the dates that have at least one available slot, and the time picker shows only the times actually available for the selected date (modulo the known non-blocking time-ordering issue). A direct `supabase.from('available_slots').select('*')` from the browser console returns a 403 / RLS violation. The Booking A live grant repair is applied and verified: `anon` has `EXECUTE`; `service_role` has `EXECUTE`; `authenticated` does **not** appear in the RPC grants; `anon` has no direct privileges on the tables. Owner-side setup: `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`.
- [x] **Booking B RPC + Worker is in place (applied and verified at runtime by the owner on 2026-06-16):** the `reserve_slot(date, text, jsonb) returns uuid` RPC is in the database with `prosecdef = true`, `provolatile = 'v'`, and `proconfig = ['search_path=pg_catalog, public']`. `service_role` has `EXECUTE`; `anon` and `authenticated` do **not** have `EXECUTE`. The `bookings_preferred_date_time_unique` constraint is in place. The Booking Worker is deployed (the owner used the dashboard JS copy `workers/booking-reservation-worker.dashboard.js` because the dashboard editor rejected the `.ts` source with a strict-mode syntax error). The Worker smoke test passed: the owner called the Worker and received `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row was created in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`. Supabase verification confirmed `available_slots.is_booked = true` for `2026-06-17` / `10:00 AM`. A duplicate booking test returned `slot_already_booked` (`P0001`). **R-005 is fully closed at the runtime level**; **F-004 is fully closed at the runtime level**. The browser-driven end-to-end flow through Pages is still pending the final-delivery Pages deploy (the current Pages deployment is old GitHub code; see "Remaining deployment gap" in the Booking B section above). Owner-side setup: `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md`.
- [ ] Smooth scroll works on long pages.
- [ ] The site is responsive at 375px, 768px, 1024px, and 1440px.
- [ ] Browser console is clean on each page (no errors, no 404s on assets).

See `docs/QA_CHECKLIST.md` for a fuller functional and visual QA list.

## Rollback

Cloudflare Pages keeps previous deployments. To roll back, go to **Deployments → select prior deployment → ⋯ → Rollback to this deploy**.

## What is not part of the deploy

- No CDN purge is required. Cloudflare serves the static build directly.
- No DNS changes are required (assuming `codeoutfitters.com` is already pointed at Cloudflare).
- No Pages Functions are used. **Two Cloudflare Workers are used: the Anthropic proposal proxy (Security 1, 2026-06-16) and the Booking reservation proxy (Booking B, 2026-06-16; deployed by the owner via the Cloudflare dashboard paste of `workers/booking-reservation-worker.dashboard.js` on 2026-06-16).** Each Worker is a separate Cloudflare resource, deployed and configured independently from Pages. The Pages static build is unchanged in shape; only the new Workers exist on the Worker side. The forms Worker (`workers/n8n-form-proxy.ts`, Security 4, 2026-06-16) is the third Worker in the project.
- **Cloudflare Access (Security 2, 2026-06-16) is configured at the Cloudflare Zero Trust dashboard, not in the repo.** The repo carries the policy intent and the owner-side setup steps; the policy itself lives in the Cloudflare dashboard. See `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.
