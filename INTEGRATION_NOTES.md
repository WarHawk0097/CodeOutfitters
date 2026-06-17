# INTEGRATION_NOTES

**Project:** CodeOutfitters
**Scope:** External service integrations and the contracts the public app depends on.

This file documents **what talks to what** and **how**. It does not propose changes. Fixes are gated behind ChatGPT Control Room approval.

---

## 1. n8n Webhook (form ingestion)

**Env var:** `NEXT_PUBLIC_N8N_WEBHOOK_URL`

**Used by:** every public form on the site. The same single webhook URL is shared by four distinct sources, distinguished only by a `source` or `type` field in the payload.

| Source | File | Payload fields |
|---|---|---|
| Quote request | `components/quote-form.tsx` | `source: "quote_request"`, `fullName`, `email`, `company`, `businessType`, `automationGoal`, `currentTools`, `timeline` |
| Contact form | `components/contact.tsx` | `source: "contact"`, `firstName`, `lastName`, `email`, `businessType`, `message` (added in Cleanup A, 2026-06-16) |
| Booking form | `components/booking-calendar-custom.tsx` | `type: "booking"`, `name`, `email`, `company?`, `phone?`, `message?`, `date` (yyyy-MM-dd), `time` |
| Newsletter | `components/newsletter.tsx` | `source: "newsletter"`, `email` |

**Client-side enforcement:**
- Honeypot field on every form (`website` / `honeypot`) — short-circuits to success when filled.
- Client-side regex email validation, length caps (name 100, email 100, phone 20, message 500/2000).

**Known risk:** when the webhook is unreachable, forms surface a generic "Email hello@codeoutfitters.com" message. The team is not auto-notified. No retry, no DLQ, no error tracking.

---

## 2. Supabase (booking persistence)

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Client:** `lib/supabase.ts` — `getSupabase()` lazy-singleton, throws if env missing.

**Wrapper:** `lib/booking-actions.ts` exposes:
- `getAvailableSlots(month, year)` — **Booking A (2026-06-16; applied and verified at runtime by owner 2026-06-16 after Booking A Repair 1)**: calls `supabase.rpc('get_available_slots', { p_month, p_year })` against `public.get_available_slots`. The RPC is `SECURITY DEFINER`, filters `is_booked = false` server-side, and returns only `id`, `date`, `"time"` ordered by date then time. Anon is granted `EXECUTE`; anon is not granted `SELECT` on `available_slots`. Same input shape, same return shape, same error shape as the previous direct-table implementation. The booking calendar (`components/booking-calendar-custom.tsx`) uses this for the displayed month and disables dates / times that are not in the response. The SQL is in `supabase/migrations/20260616_booking_a_get_available_slots.sql` (post-Repair 1 form; quotes `"time"`). The owner applied the SQL on 2026-06-16; the RPC is in the database; the calendar works. **Booking A live grant repair was also applied and verified at runtime by the owner on 2026-06-16**: broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` were revoked; `authenticated` `EXECUTE` on `public.get_available_slots` was revoked; the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants were restored. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking B-adjacent cleanup; do not start that repair unless explicitly approved.
- `createBooking(formData)` — **Booking B (2026-06-16; applied and verified at runtime by the owner 2026-06-16)**: the previous Booking A implementation (direct INSERT + direct UPDATE) was replaced wholesale per its own Booking A docstring. The new body is a thin client-side wrapper that posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with `credentials: 'omit'` and `Content-Type: application/json`. The function preserves the `ActionResult<null>` contract: `200` → success; `409` → "this slot is no longer available"; `400` → validation error surfaced; other → generic message. The Worker at `workers/booking-reservation-worker.ts` (~440 lines; canonical TypeScript source; `wrangler` deploys use this) holds the `service_role` key server-side and calls `supabase.rpc('reserve_slot', ...)` against `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid`. The Worker is a 1:1 JS copy at `workers/booking-reservation-worker.dashboard.js` (~400 lines; Cloudflare dashboard paste form; the dashboard editor rejected the `.ts` source with a strict-mode syntax error, hence the JS dashboard copy — Booking B Repair 1, 2026-06-16). Anon is **never** granted EXECUTE on `reserve_slot`; only `service_role` is granted EXECUTE. The `reserve_slot` function is `SECURITY DEFINER`, holds a `SELECT ... FOR UPDATE` row lock on the matching `available_slots` row, and raises `'slot_already_booked'` / `'slot_not_found'` (`P0001`) on conflict. A `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is the last-line defense against double-booking. The SQL is in `supabase/migrations/20260616_booking_b_reserve_slot.sql`. The owner applied the SQL on 2026-06-16. The owner deployed the Worker on 2026-06-16 via the Cloudflare dashboard paste of `workers/booking-reservation-worker.dashboard.js`. The Worker smoke test passed: `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row was created; `available_slots.is_booked` was flipped; a duplicate booking test returned `slot_already_booked` (`P0001`). **R-005 is fully closed at the runtime level**; **F-004 is fully closed at the runtime level**. The Worker optionally forwards the same payload to the n8n booking webhook (with the per-form secret) so the operator still gets a notification; the n8n env vars are intentionally left for later, and the Worker correctly reports `notification: "skipped"` when they are not bound. The booking form's `handleSubmit` in `components/booking-calendar-custom.tsx` calls `createBooking(formData)`. The UI design is unchanged. **Remaining deployment gap (informational, not a Booking B defect):** the Cloudflare Pages project is connected to GitHub; the current Pages deployment is still old GitHub code (pre-Booking-B frontend). The booking form's `handleSubmit` on the deployed Pages is the pre-Booking-B form (which posts to the n8n forms Worker; not the new `createBooking` flow). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed. **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy).

**Schema source:** `lib/booking-schema.sql`. Two tables:
- `bookings` — UUID PK, name, email, company, phone, message, preferred_date, preferred_time, timezone, status (`pending` | `confirmed` | `cancelled`), timestamps.
- `available_slots` — UUID PK, date, time, `is_booked` default false, `UNIQUE(date, time)`.

**Seed:** 12 weeks × 14 weekday slots starting `2026-05-18` (Mon–Fri, 9:00 AM – 4:30 PM EST). Seed is idempotent (`ON CONFLICT DO NOTHING`).

**Known risk — booking double-booking:** the UI calendar in `components/booking-calendar-custom.tsx` does **not** call `getAvailableSlots()`. Its `isAvailable(day)` function only blocks past dates and weekends. It does **not** check `is_booked`. Two visitors can select the same `(date, time)` and both will succeed at the Supabase `UPDATE` level only if their selects don't race; the `UPDATE` is unconditional on `is_booked`, so the slot will be marked booked twice. This is a documented risk, **not a fix in this phase**.

**Known risk — seed exhaustion:** the seed populates 12 weeks from `2026-05-18`. No rotation script exists. Will need re-seed before the window closes.

**Known risk — no RLS:** the SQL file does not enable Row Level Security. Anyone with the anon key can read/write both tables. The anon key is shipped in the static bundle.

---

## 3. Anthropic API (proposal generation)

**Env var:** `NEXT_PUBLIC_ANTHROPIC_API_KEY`

**Caller:** `lib/proposal-generator.ts` — `generateProposal(intakeData)` calls `https://api.anthropic.com/v1/messages` directly from the browser.

**Model:** `claude-sonnet-4-6`, `max_tokens: 8192`.

**System prompt:** role is "expert AI automation consultant and proposal writer" for the agency CodeOutfitters.

**User prompt:** formats the full `OnboardingFormData` and asks for a 11-field JSON object (`executiveSummary`, `challenge`, `recommendation`, `practicalLook`, `technicalApproach`, `requirements[]`, `timeline[]`, `investment`, `whyUs[]`, `nextSteps[]`, `futureOpportunities`).

**Response parsing:** regex match for the first `{...}` block, then `JSON.parse`. No schema validation; if the model returns prose, parsing fails loudly.

**Stored after generation:** `localStorage.setItem('co_last_proposal', JSON.stringify(result))`. There is no server-side persistence of proposals.

**Known risk — key exposure:** the key is referenced as `NEXT_PUBLIC_*` and the project uses `output: 'export'`, so the key is baked into the static JS bundle. This is acknowledged in two comments (`.env.local.example:1` and `lib/proposal-generator.ts:3`). The admin tool is intended for a single operator (Tayyab) on a private machine; this is a known security gap, **not fixed in this phase**.

**Recommended future fix (do not implement yet):** proxy the call through a Cloudflare Worker or serverless function. Hold a server-side env var, not a `NEXT_PUBLIC_*` one.

---

## 4. Tawk.to (live chat — optional)

**Env var:** `NEXT_PUBLIC_TAWK_PROPERTY_ID`

**Component:** `components/live-chat.tsx` — lazy-injects the Tawk embed script only if the env var is set and not equal to the placeholder `REPLACE_WITH_TAWK_PROPERTY_ID`.

**Gated by:** `components/consent-gated.tsx` — only renders after the user has accepted cookies (`localStorage.cookie_consent === 'accepted'`).

**Status:** optional. Listed in `DEPLOY.md` as "optional until Tawk account ready".

**CSP impact:** `public/_headers` already includes `script-src https://embed.tawk.to` and `frame-src 'none'`. No code change required to enable.

---

## 5. Environment Variables Summary

| Var | Required? | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes (for booking) | `lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes (for booking) | `lib/supabase.ts` |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | yes (for forms) | 4 form components |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | yes (for admin) | `app/admin/layout.tsx` (client-side compare) |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | yes (for admin) | `lib/proposal-generator.ts` |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | no | `components/live-chat.tsx` |

All six are present in `.env.local.example`. None are documented elsewhere.

---

## 6. Known Integration Risks (consolidated)

1. **Anthropic key exposure** — see §3.
2. **Admin password exposure** — `NEXT_PUBLIC_ADMIN_PASSWORD` is shipped in the static bundle; admin gate is `localStorage`-only and trivially bypassable by reading the source.
3. **Supabase no RLS** — anon key has full read/write on `bookings` and `available_slots`.
4. **Booking double-booking** — see §2.
5. **Shared single webhook for 4 form types** — payload shapes are not enforced server-side; a misconfigured n8n workflow could misroute.
6. **Seed exhaustion** — see §2.
7. **No error tracking** — webhook failures are silent except for a UI message.
8. **No retries** — forms do not retry on transient failure.

---

## 7. Approved / Not Approved

- No paid tools approved.
- No new runtime dependencies approved in this phase.
- No new dev dependencies approved in this phase.
- No tooling (Playwright, MCP servers, Graphify, Repomix, Context7, Tree-sitter, codebase-memory) approved.
- **Ponytail** — candidate only. **NOT APPROVED.** Gated to **TS0 / RDG0**. Owner must provide the exact official GitHub repo URL, a pinned version, and a scope (global / per-project / reference-only; default: reference-only) before any evaluation.
- **ECC / affaan-m/ecc** — candidate only. **NOT APPROVED.** Gated to **TS0 / RDG0**. Owner must provide the exact official GitHub repo URL, a pinned version, and a scope (global / per-project / reference-only; default: reference-only) before any evaluation.

## 8. A0 integration sequencing clarifications (additive)

> A0 is the action / build plan phase. A0 does not change any current integration contract. A0 only clarifies the **sequencing** of the future integration changes the IMPL phases will make, so the public and admin surfaces can plan against the same contract. This section is additive; it does not modify §1–§7.

### 8.1 Anthropic Worker path (Security 1) — SHIPPED 2026-06-16

- The browser calls the Cloudflare Worker (not `https://api.anthropic.com/v1/messages` directly).
- The Worker holds the Anthropic key as a server-side env var (`ANTHROPIC_API_KEY`).
- The Worker enforces `ALLOWED_ORIGIN` server-side (CORS gate) and returns `403 origin_not_allowed` for any other `Origin`.
- The Worker returns the response to the browser in the same shape as the previous direct Anthropic call (11-section JSON).
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` is removed from the build output. The env var is **deprecated and forbidden**; do not reintroduce it.
- CSP `connect-src` in `public/_headers` is updated: `api.anthropic.com` is removed; the Worker origin is added (placeholder until Cloudflare Worker URL is known — see `public/_headers` comment).
- `lib/proposal-generator.ts` is a thin client that calls `${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/`.
- The Worker source is `workers/anthropic-proposal-proxy.ts`. Deployment steps are in `repo-research/SECURITY_1_WORKER_PROXY_NOTES.md`.
- **CORS is not authentication.** The Worker is still gated to Security 2 (admin auth) before launch. The Worker is only safe to expose once Security 2 is in.
- Closes: R-002 (Anthropic key in bundle), R-004 (proposal error / cost risk), LG-1.

### 8.2 n8n per-form secret + header (Security 4) — SHIPPED 2026-06-16 (code + docs + CSP; runtime deferred to owner)

- The browser no longer holds the n8n webhook URL or any n8n secret. The four forms (contact, quote, booking, newsletter) post to a Cloudflare Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`).
- The Worker source is `workers/n8n-form-proxy.ts`. The Worker adds the per-form secret header server-side: `X-CodeOutfitters-Form-Secret: <secret>`. The header name is the canonical header the Worker adds; n8n must verify it.
- The Worker reads the payload's `source` field for contact (`source: "contact"`), quote (`source: "quote_request"`), and newsletter (`source: "newsletter"`), and `type: "booking"` for the booking form. Each form has its own n8n webhook URL and its own per-form secret bound to the Worker.
- n8n verifies the header against its own workflow-level env var. Unsigned or wrong-secret requests are dropped by n8n (return 401 or stop the workflow). The Worker itself does NOT verify the header; the Worker forwards as-is. n8n is the source of truth for the secret check.
- The secrets are rotated manually by the operator (per form). Each form has its own secret: `N8N_CONTACT_SECRET`, `N8N_QUOTE_SECRET`, `N8N_BOOKING_SECRET`, `N8N_NEWSLETTER_SECRET`. The Worker env vars for the n8n webhook URLs are `N8N_CONTACT_WEBHOOK_URL`, `N8N_QUOTE_WEBHOOK_URL`, `N8N_BOOKING_WEBHOOK_URL`, `N8N_NEWSLETTER_WEBHOOK_URL`.
- CSP `connect-src` in `public/_headers` is updated: `https://*.n8n.io` is removed; the browser no longer needs to call the n8n domain directly. `https://*.workers.dev` is already in the CSP (carried over from Security 1) and covers the forms Worker.
- **CORS is not authentication.** CORS / `ALLOWED_ORIGIN` is a defense-in-depth, not a security boundary. The forms Worker is gated to the owner deploying it and configuring the n8n workflow to verify the header. Until then, the Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. CORS is a defense-in-depth, not authentication.
- The Worker is the source of truth for the per-form routing and secret header. Owner-side setup steps, deployment steps, and the rollback plan are in `repo-research/SECURITY_4_N8N_SECRET_NOTES.md`.
- Closes: R-005 (single shared webhook for four form types, no signing) and R-017 (per-form webhook secret, header, verify in n8n) at the deployment level as of Security 4. R-005 / R-017 are deferred at the runtime level until the owner deploys the forms Worker and configures the n8n workflow to verify the header. After the owner deploys and configures, R-005 and R-017 are fully closed.

### 8.3 Supabase RLS (Security 3) — SHIPPED 2026-06-16 (SQL level; applied and verified at runtime by owner 2026-06-16)

- `ENABLE ROW LEVEL SECURITY` on `bookings` and `available_slots` (with `FORCE ROW LEVEL SECURITY` so a future table-owner change does not silently bypass RLS).
- Anon role: `USING (false)` on both tables. The browser cannot SELECT / INSERT / UPDATE / DELETE on either table, even with the anon key in the bundle. **Verified at runtime by the owner on 2026-06-16.**
- Reads via a specific RPC: `get_available_slots(p_month int, p_year int) returns table(id uuid, date date, "time" text)` (created in Booking A, 2026-06-16; applied and verified at runtime by the owner on 2026-06-16 after Booking A Repair 1). The Security 3 migration grants anon `EXECUTE` on this function as a forward-compatible grant; the function body is created in Booking A. The RPC is `SECURITY DEFINER`, runs in the function owner's context, filters `is_booked = false` server-side, and returns only the columns the calendar needs.
- Writes via a specific RPC: `reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid` (created in Booking B; applied and verified at runtime by the owner on 2026-06-16; called server-side from the Booking Worker at `workers/booking-reservation-worker.ts`). The Security 3 migration grants `service_role` `EXECUTE` on this function as a forward-compatible grant; the function body is created in Booking B. The function is `SECURITY DEFINER`, runs in the function owner's context, holds a `SELECT ... FOR UPDATE` row lock on the matching `available_slots` row, and raises `slot_already_booked` / `slot_not_found` (`P0001`) on conflict. A `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is the last-line defense against double-booking. **Anon is never granted EXECUTE on `reserve_slot`; only `service_role` is granted EXECUTE** (the owner confirmed the grant state at runtime on 2026-06-16). The reservation must happen server-side via the Worker, which holds the `service_role` key. (Note: §8.3 had a documentation typo `p_time time` in the prior text; the actual SQL on disk has `p_time text` per the existing `available_slots.time` text column and per the spec; the typo is a documentation reference, not a code issue. The typo is corrected here in this update.)
- Anon `EXECUTE` grant on `get_available_slots` only. No `SELECT` / `INSERT` / `UPDATE` / `DELETE` on the tables directly. **Booking A live grant repair was applied and verified at runtime by the owner on 2026-06-16:** broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` were revoked; `authenticated` `EXECUTE` on `public.get_available_slots` was revoked; the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants were restored.
- `service_role` retains full access (used by the Worker only; explicit policy added in addition to Supabase's default `BYPASSRLS`).
- `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` as defense in depth (added in Booking B; the Security 3 migration does not add this; the owner confirmed the constraint is in place at runtime on 2026-06-16).
- The seed SQL keeps its `ON CONFLICT DO NOTHING` behavior; it runs as the table owner or as `service_role` (DBA, not anon). RLS does not affect the seed.
- **Closes (SQL level):** R-003 (anon key had full read/write on `bookings` and `available_slots`). **Closes (runtime level):** R-003 is **closed end-to-end** as of 2026-06-16. The owner applied the migration and confirmed the runtime state (relrowsecurity / relforcerowsecurity = true on both tables; four policies in place; 840 seeded slots). LG-3 closed.
- **Migration status (2026-06-16; updated 2026-06-16 — runtime state record):** the SQL is in `supabase/migrations/20260616_security3_rls.sql`. **The migration was applied and verified at runtime by the owner on 2026-06-16.** The owner applied it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). Owner-side setup steps, rollback SQL, and verification checklist are in `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md`.
- **Impact on the current booking flow (now that the migrations are in place):** the direct-table read/write path in `lib/booking-actions.ts` failed with 403 / RLS violations under Security 3. The read path is wired through the `get_available_slots` RPC (Booking A, applied and verified at runtime 2026-06-16). The write path is wired through the `reserve_slot` RPC, called server-side from the Booking Worker at `workers/booking-reservation-worker.ts` (Booking B, applied and verified at runtime 2026-06-16). The frontend `createBooking` in `lib/booking-actions.ts` was replaced wholesale in Booking B; the new body posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` and preserves the `ActionResult<null>` contract. The browser never calls `reserve_slot` directly. The booking form's n8n POST to the forms Worker (Security 4) is the **legacy** path; the new path is `createBooking` → Booking Worker → Supabase RPC. The booking flow is end-to-end honest at the code level and verified at the runtime level. **Remaining deployment gap (informational, not a Booking B defect):** the Cloudflare Pages project is connected to GitHub; the current Pages deployment is still old GitHub code (pre-Booking-B frontend). The booking form's `handleSubmit` on the deployed Pages is the pre-Booking-B form. The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed. **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy).
- **Booking A delivery (2026-06-16; applied and verified at runtime 2026-06-16 after Booking A Repair 1):** the `get_available_slots` function body is in `supabase/migrations/20260616_booking_a_get_available_slots.sql` (post-Repair 1 form; quotes `"time"`). The frontend `lib/booking-actions.ts:35` `getAvailableSlots(month, year)` calls the RPC; the frontend `components/booking-calendar-custom.tsx` uses the response to disable dates / times that are not actually available. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking-B-adjacent cleanup; do not start that repair unless explicitly approved. Owner-side setup steps, RPC contract, verification queries, and rollback plan are in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`.
- **Booking B delivery (2026-06-16; applied and verified at runtime 2026-06-16):** the `reserve_slot` function body is in `supabase/migrations/20260616_booking_b_reserve_slot.sql` (629 lines; quotes `s."date"` and `s."time"`; `SECURITY DEFINER`, `VOLATILE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`; row lock + UNIQUE constraint; `service_role` EXECUTE only; idempotent; reversible). The Booking Worker is at `workers/booking-reservation-worker.ts` (canonical TypeScript source; `wrangler` deploys use this) and `workers/booking-reservation-worker.dashboard.js` (1:1 runtime port for the Cloudflare dashboard paste; the dashboard editor rejected the `.ts` source with a strict-mode syntax error, hence the JS dashboard copy — Booking B Repair 1, 2026-06-16). The frontend `lib/booking-actions.ts:createBooking` was replaced wholesale per its own Booking A docstring; the new body posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` and preserves the `ActionResult<null>` contract. The frontend `components/booking-calendar-custom.tsx:handleSubmit` calls `createBooking(formData)`. The UI design is unchanged. The owner applied the Booking B SQL on 2026-06-16; the owner deployed the Booking Worker on 2026-06-16 via the Cloudflare dashboard paste of the `.dashboard.js` file. The Worker smoke test passed: `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row was created; `available_slots.is_booked` was flipped; a duplicate booking test returned `slot_already_booked` (`P0001`). R-005 is **fully closed at the runtime level**; F-004 is **fully closed at the runtime level**. The Worker is end-to-end functional at the Worker level. The browser-driven end-to-end flow through Pages is still pending the final-delivery Pages deploy (the current Pages deployment is old GitHub code; see "Remaining deployment gap" above). **Booking B runtime state record** is in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md`. **Next eligible implementation phase: Observability (A0 future phase #10).** Blocked until ChatGPT Control Room issues the exact Observability prompt.

### 8.4 Observability alert channel (Observability)

- Sentry (errors, free tier) wires to `components/error-boundary.tsx` and wraps `lib/booking-actions.ts` and the proposal-generation path.
- UptimeRobot (uptime, free) watches `/`, `/contact`, `/book`. Alert on 5xx or timeout.
- n8n delivery monitor (free; n8n already in stack) catches and forwards failed form submissions.
- Owner channel: email to `hello@codeoutfitters.com` is the default. Discord webhook is the free fallback.
- The static "All systems operational" badge becomes a live badge (R-035).
- Closes: R-010, R-035.

### 8.5 Git / repo root setup contract (Setup)

- Q-21 / D-027 owner confirmation.
- If confirmed, `git init` at `F:\CodeOutfitters`.
- `.gitignore` is reviewed against current contents.
- The first commit is a snapshot of the current state; it does not modify source files.
- `Cleanup B` requires `git status` clean before deletion; therefore Cleanup B is gated on Setup.
- The owner channel for observability (D-026) is picked before Setup completes.

### 8.6 Ponytail / ECC candidate status (TS0 / RDG0)

- **Ponytail** is a candidate only. NOT APPROVED. Gated to TS0 / RDG0. The future TS0 / RDG0 submission must answer the seven evaluation questions in `docs/PD1_DECISION_LOCK.md` §6.1.
- **ECC / affaan-m/ecc** is a candidate only. NOT APPROVED. Gated to TS0 / RDG0. The future TS0 / RDG0 submission must answer the ten evaluation questions in `docs/D0_ARCHITECTURE_DECISIONS.md` §11.
- Both require the exact official GitHub repo URL, a pinned version, and a scope (global / per-project / reference-only; default: reference-only) before any evaluation.
- No install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install in any pre-approval phase.

### 8.7 Admin persistence contract (Admin future)

- Option A (smallest, honest improvement): surface `localStorage.co_last_proposal` in the existing Recent Proposals tile. Remove the "Coming soon" tag. No new persistence.
- Option B (post-Worker): persist proposals to Supabase (or Worker + KV). List on the dashboard with click-through.
- D-025 default: A first, B later. A0 reflects "later admin phase" per the conservative PD1 default.
- The admin tool is internal-only (D-017). Clients do not log in to the admin tool; proposals are sent via the operator's email.
- Closes: R-018 (partial).

### 8.8 UIX0 / MOTION0 first-slice contract (UIX0 / MOTION0 first slice)

- Ships in one PR.
- Includes: hero entrance + animated headline reveal (GSAP or AOS); scroll-triggered section reveals (one canonical hook, replaces `useScrollReveal` duplicates, respects `prefers-reduced-motion`); ROI calculator micro-interactions (value-update animation, subtle "settle" on stop); reduced-motion coverage (AOS opt-out, GSAP opt-out, Framer Motion opt-out).
- Performance budget per `docs/PM1_PLAN.md` §8.7: LCP unchanged or improved; CLS = 0; INP in "good" range on a Moto G Power class device; +0 KB JS net from new libraries; no new CSS framework; no new external assets.
- Impeccable + Emil Kowalski review is run at the end of the first slice. Before / after evidence is captured in `repo-research/MOTION_QA_LOG.md`.
- BeFluence is reference only (D-022 reaffirmed from D-011). No copy / scrape / clone.
- Closes: R-012, R-013 (partial), R-014, R-015, R-021.
- Admin motion discipline (cross-link §9 of `docs/D0_SYSTEM_DESIGN.md`): page transitions ≤ 200ms; no parallax, no floating cards, no marquees; form sections do not have entrance animations that delay the user.

### 8.9 Tooling installation contract (TS0 setup)

- Each approved tool is installed in its own small PR per `docs/PM1_PLAN.md` §7.6 acceptance criteria.
- Each PR updates `package.json` `devDependencies` (or the equivalent MCP / skill config) with a pinned version.
- Each PR adds a smoke test or a documented manual verification step.
- Each PR updates `INTEGRATION_NOTES.md` (if integration), `ai/AI_CONTEXT_RULES.md` (if behavior change), and the relevant `docs/`.
- No production config file (`public/_headers`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, lockfiles) is changed for the sake of the tool unless strictly required and documented.
- Free / open-source-first rule is preserved (D-009).
- **Ponytail** and **ECC / affaan-m/ecc** are NOT installed even after TS0 / RDG0 if the owner has not provided the exact official GitHub repo URL, pinned version, and scope.

### 8.10 Admin auth boundary (Security 2) — SHIPPED 2026-06-16

- The real admin boundary is **Cloudflare Access** in front of `/admin/*` on the deployed site (D-020a, LOCKED DEFAULT). Cloudflare Access is mandatory before any non-internal launch.
- The local client-side password gate in `app/admin/layout.tsx` is **convenience-only**. It is explicitly labeled as such in the UI (a `ShieldCheck` notice on the login form and a chip in the admin header). The convenience gate is not a security boundary. It keeps the admin out of casual view on `localhost:3005` and on the deployed site until Cloudflare Access is in place.
- `NEXT_PUBLIC_ADMIN_PASSWORD` is **deprecated as a real security boundary**. The line is preserved in `.env.local.example` in a `DEPRECATED` block ("convenience-only if set") for migration clarity. If the owner has not set up Cloudflare Access yet, the local convenience gate can still run by leaving the var set; it just does not provide security.
- No new auth library is added. No Auth.js, no Supabase Auth, no server route, no new npm dependency. Security 2 is a code + docs + CSP-change-only phase. The repo carries the policy intent and the owner-side setup steps; the policy itself lives in the Cloudflare Zero Trust dashboard.
- The Cloudflare Access application must be created by the owner: Self-hosted, application domain = `codeoutfitters.com` (and `www.codeoutfitters.com` if applicable), path = `/admin/*`, identity = approved operator email(s) (one-time PIN or IdP), session duration = 1 hour. Owner-side setup steps and verification: `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.
- **Worker endpoint (recommended):** if the Worker is reachable on a separate subdomain (e.g. `https://anthropic-proposal-proxy.<account>.workers.dev`), the owner should add a **second** Cloudflare Access application in front of that route, with the same identity allowlist. If the Worker is reachable only via the Pages route, the Pages-route Access application is sufficient.
- **Worker-level session-token / Cloudflare Access JWT verification** is a future hardening step, intentionally **not** shipped in Security 2. The Worker source (`workers/anthropic-proposal-proxy.ts`) is structured to make this additive (a single check at the top of `fetch(request, env)` after the CORS gate). The doc comment at the top of the Worker documents the contract. Implementation lands when the owner confirms the Access config and the JWT public-key / JWKS configuration.
- Closes: R-001 at the deployment level (admin boundary is now Cloudflare Access). R-001 is **deferred** for the local dev / preview environment (the convenience gate keeps the admin out of casual view there). F-002 implemented for the deployed path. Closes: R-001 (deployed), F-002 (deployed). Does not close: R-003 (Supabase RLS, Security 3), R-005 (n8n secret, Security 4), R-006 (error tracking, Observability), R-018 (proposal persistence, Admin future), R-029 (admin auth follow-up hardening).
