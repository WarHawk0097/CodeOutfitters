# Security

This document describes the **known** security posture of CodeOutfitters. It does not propose fixes that are not already approved. Recommended future fixes are listed at the bottom for visibility.

**Status (2026-06-16, post-Security 1):** The Anthropic API key is no longer in the static bundle. The frontend calls a Cloudflare Worker that holds the key server-side. R-002 (Anthropic key exposed in static bundle) is **closed** as a runtime risk. F-001 is **implemented** (Cloudflare Worker proxy). The Worker source is in `workers/anthropic-proposal-proxy.ts`. The frontend env var is `NEXT_PUBLIC_PROPOSAL_WORKER_URL` (public by design; the Worker enforces `ALLOWED_ORIGIN` server-side). The previous `NEXT_PUBLIC_ANTHROPIC_API_KEY` is deprecated and forbidden. CORS is not authentication. The Worker is still gated to Security 2 (admin auth) before launch. See `repo-research/SECURITY_1_WORKER_PROXY_NOTES.md` for the deployment steps.

**Status (2026-06-16, post-Security 2):** The admin boundary is now **Cloudflare Access** in front of `/admin/*` on the deployed site (D-020a, LOCKED DEFAULT). The client-side admin password gate in `app/admin/layout.tsx` is no longer documented as security; it is convenience-only and is explicitly labeled as such in the UI. `NEXT_PUBLIC_ADMIN_PASSWORD` is deprecated as a real security boundary. R-001 is **addressed** at the deployment level (Cloudflare Access is the real boundary) and is **deferred** for the local dev / preview environment (the convenience gate keeps the admin out of casual view there). F-002 is **implemented** for the deployment path. The Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control; the owner's Cloudflare Access setup is what closes that. See `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md` and `docs/DEPLOYMENT.md` for the owner-side setup steps.

**Status (2026-06-16, post-Security 3; updated 2026-06-16 — runtime state record):** RLS is required before any non-internal launch (D-020 LOCKED DEFAULT). The Security 3 phase ships the SQL migration in `supabase/migrations/20260616_security3_rls.sql`. **The migration was applied and verified at runtime by the owner on 2026-06-16.** The policy model is conservative: deny all to anon on `bookings` and `available_slots`; full access to `service_role`; forward-compatible grants on the future narrow RPCs (`get_available_slots` for anon in Booking A; `reserve_slot` for `service_role` only in Booking B). Runtime state: `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`. Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. **R-003 is closed end-to-end** (no longer "deferred at the runtime level"). F-003 is **implemented at the SQL level** and **verified at the runtime level**. The migration is idempotent and reversible; rollback is in `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` §6. See `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` for the owner-side setup steps, the rollback SQL, and the verification checklist.

**Status (2026-06-16, post-Security 4):** The n8n webhook submission path is now protected by a Cloudflare Worker proxy. The browser no longer holds the n8n webhook URL or any n8n secret. All public forms (contact, quote, booking, newsletter) post to a Cloudflare Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`), which adds the per-form secret header server-side (`X-CodeOutfitters-Form-Secret`) and forwards to the correct n8n webhook URL. The n8n URLs and the per-form secrets are server-side only. R-005 (single shared webhook for four form types, no signing) and R-017 are **addressed at the deployment level** as of Security 4 — the browser no longer has direct access to the n8n webhook and the per-form secret is held server-side. R-005 / R-017 are **deferred at the runtime level** until the owner deploys the forms Worker and configures the n8n workflow to verify the header. **A0 is approved by ChatGPT Control Room as of this phase.** See `repo-research/SECURITY_4_N8N_SECRET_NOTES.md` for the owner-side setup steps, the rollback plan, and the verification checklist.

**Status (2026-06-16, post-Booking A; updated 2026-06-16 — runtime state record):** The booking read path is wired through a narrow RPC, `public.get_available_slots(p_month int, p_year int)`, that anon can invoke under Security 3 RLS. The RPC is `SECURITY DEFINER`, filters `is_booked = false` server-side, and returns only the columns the calendar needs (`id`, `date`, `"time"`). Anon is granted `EXECUTE` on the function; anon is **not** granted `SELECT` on the underlying `available_slots` table. The frontend `lib/booking-actions.ts` `getAvailableSlots(month, year)` calls the RPC; the frontend `components/booking-calendar-custom.tsx` uses the response to disable dates and times that are not actually available. **The Booking A SQL migration was applied and verified at runtime by the owner on 2026-06-16** after the on-disk migration was repaired to quote `"time"` (Booking A Repair 1, 2026-06-16). **The Booking A live grant repair was also applied and verified at runtime by the owner on 2026-06-16**: the owner revoked any broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings`; revoked `authenticated` `EXECUTE` on `public.get_available_slots`; restored the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants. The write path (`createBooking` in `lib/booking-actions.ts` → direct `INSERT` into `bookings` + direct `UPDATE` on `available_slots.is_booked`) is intentionally unchanged in Booking A and remains blocked until Booking B (the `reserve_slot` RPC, called server-side from a Cloudflare Worker that holds the `service_role` key; anon is **never** granted `EXECUTE` on `reserve_slot`). After Security 3 RLS is in place, the direct `INSERT` into `bookings` and the direct `UPDATE` on `available_slots.is_booked` now fail with 403 / RLS violations. R-005 is **partially closed at the read path level** and **verified at the runtime level**; R-005 is **fully closed** only when Booking B ships. F-004 is **implemented for the read path** and **verified at the runtime level**; F-004 is **fully closed** only when Booking B ships. No new `NEXT_PUBLIC_*_SECRET` env var was added. No new env var of any kind was added. No `package.json` change. No `next.config.*` change. No `public/_headers` change. No Worker change. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`); recorded for a future minor repair or Booking B-adjacent cleanup; do not start that repair unless explicitly approved. Owner-side setup steps, RPC contract, verification queries, and a rollback plan are in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`. **Booking B = next eligible implementation phase, but NOT started.** Blocked until ChatGPT Control Room issues the exact Booking B prompt.

## Threat model (assumed)

- The site is a marketing site with a single-operator internal admin tool.
- The operator is a known individual (Tayyab) using a private machine.
- Visitors are anonymous and untrusted.
- A small number of public form submissions are expected per day.
- No payment, no PII beyond name/email/phone, no regulated data.

## Known risks (documented, not fixed)

### R-004 — Booking double-booking

- Documented in `docs/DATABASE.md`. Not a confidentiality or integrity breach, but it is a data integrity bug.

### R-006 — No error tracking or rate limiting

- When the webhook is unreachable, the user sees a generic "Email hello@codeoutfitters.com" message. The team is not auto-notified.
- No rate limit on form submissions. A determined attacker can flood the n8n instance and the Supabase tables.

### R-007 — Static export CSP is strict but the dev server has no equivalent

- `public/_headers` sets a strong CSP: `connect-src` is limited to `self`, `*.supabase.co`, `*.n8n.io`, and `*.workers.dev` (the Cloudflare Worker origin for the proposal proxy, Security 1). The browser no longer connects to `api.anthropic.com` directly.
- This is only enforced when the static output is served by Cloudflare. Local dev runs without these headers and without the same origin constraints.
- Dev-only footguns: if you add a new external endpoint, the production CSP will block it. Add it to `_headers` and `next.config.mjs` (if relevant) at the same time.

### R-008 — Honeypot-only bot protection on public forms

- Every public form has a hidden `website` / `honeypot` field. When filled, the form short-circuits to "success".
- This blocks dumb bots and accidents. It does not block a determined attacker. There is no captcha, no Turnstile, no rate limit.

### R-009 — Third-party CDN for tool logos

- `components/tools-strip.tsx` loads logo images from `https://cdn.simpleicons.org`. This is a third-party CDN.
- Not a code-execution risk (images only), but the marketing site will be visually broken if the CDN is unreachable.
- The CDN is in the CSP via `img-src` but not in any other directive.

### R-010 — Admin form data persisted in browser only

- The intake form saves to `localStorage` (`co_onboarding_data`). The last generated proposal is saved to `localStorage` (`co_last_proposal`).
- If the browser is shared, the data is shared.
- There is no server-side persistence of proposals. If the operator clears their browser, history is lost.

## Closed risks

### R-005 — ~~Single shared webhook for four form types, no signing / no per-form secret~~ (ADDRESSED at the deployment level in Security 4, 2026-06-16; runtime-level deferred)

- **Original risk:** Quote, contact, booking, and newsletter all POSTed to the same `NEXT_PUBLIC_N8N_WEBHOOK_URL`. The only discrimination was payload shape. A misconfigured n8n workflow could misroute data. There was no payload signing, no per-form secret. The webhook URL was shipped in the static bundle; the anon key was not, but the URL itself was public.
- **Resolution:** Security 4 (2026-06-16) ships a Cloudflare Worker proxy at `workers/n8n-form-proxy.ts`. The browser no longer holds the n8n webhook URL or any n8n secret. All public forms (contact, quote, booking, newsletter) post to a Cloudflare Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`). The Worker adds a per-form secret header server-side (`X-CodeOutfitters-Form-Secret: <per-form secret>`) and forwards to the correct n8n webhook URL. The per-form secrets are held server-side in the Worker (one secret per form: `N8N_CONTACT_SECRET`, `N8N_QUOTE_SECRET`, `N8N_BOOKING_SECRET`, `N8N_NEWSLETTER_SECRET`). n8n must verify the header against its own workflow-level secret/env var. R-005 is **addressed at the deployment level** as of Security 4; R-005 is **deferred at the runtime level** until the owner deploys the forms Worker and configures the n8n workflow to verify the header. After the owner deploys and configures, R-005 is fully closed. R-017 (per-form webhook secret, header, verify in n8n) is also addressed at the deployment level as of Security 4. See `repo-research/SECURITY_4_N8N_SECRET_NOTES.md` for the owner-side setup steps, the rollback plan, and the verification checklist.
- **Remaining caveat:** until the forms Worker is deployed and the n8n workflow is configured to verify the header, the browser can still POST to the forms Worker URL but the n8n workflow will reject the request (no `X-CodeOutfitters-Form-Secret` header). The forms will surface a generic error to the visitor until both the Worker and the n8n workflow are configured. CORS / `ALLOWED_ORIGIN` is the only auth until then. CORS is not authentication; the Worker's `ALLOWED_ORIGIN` is a defense-in-depth, not a security boundary. The Worker source is structured to make a Worker-level session-token / Cloudflare Access JWT check additive (a single check at the top of `fetch(request, env)` after the CORS gate) as a future hardening step.

### R-003 — ~~Supabase RLS not enabled~~ (CLOSED end-to-end in Security 3, 2026-06-16; applied and verified at runtime by owner on 2026-06-16)

- **Original risk:** `lib/booking-schema.sql` did not enable Row Level Security on `bookings` or `available_slots`. The anon key had full read/write on both tables. An attacker who read the anon key from the static bundle could read every booking and write arbitrary rows. The anon key was rotated by Supabase, but it was also re-shipped on every deploy.
- **Resolution:** the Security 3 phase ships a SQL migration in `supabase/migrations/20260616_security3_rls.sql`. The migration enables RLS on both tables, force-RLSes both tables, denies all to anon on both tables, grants full access to `service_role`, and grants forward-compatible EXECUTE on the future `get_available_slots` and `reserve_slot` RPCs. **The migration was applied and verified at runtime by the owner on 2026-06-16.** Runtime state: `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`. Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. **R-003 is closed end-to-end** as of 2026-06-16 (no longer "deferred at the runtime level"). See `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` for the owner-side setup steps, the rollback SQL, and the verification checklist.
- **Remaining caveat:** until Booking B ships, the booking flow is non-functional by design at the write path. The direct-table read/write path in `lib/booking-actions.ts` now fails with 403 / RLS violations. The booking read path is wired through the `get_available_slots` RPC (Booking A, applied and verified at runtime 2026-06-16 after Booking A Repair 1). The booking write path (`reserve_slot` RPC, called server-side from a Cloudflare Worker that holds the `service_role` key) is gated to **Booking B** (A0 future phase #9). The booking flow is non-functional at the write path, which is **safer** than a silently-broken booking flow that exposes the anon key to write.

### R-001 — ~~Admin password exposed in static bundle~~ (ADDRESSED in Security 2, 2026-06-16; deployment-level)

- **Original risk:** `NEXT_PUBLIC_ADMIN_PASSWORD` was inlined into the static JS bundle at build time. `app/admin/layout.tsx` compared the visitor's `localStorage.co_admin_auth` to the env var; if they matched, the admin UI rendered. An attacker could read the source, set the same `localStorage` key, and bypass the gate. The "Recent Proposals" tile showed the last generated proposal in `localStorage.co_last_proposal` — accessible to the same attacker. Effective security: keeps the admin out of casual view only. Not a real access control.
- **Resolution:** Cloudflare Access in front of `/admin/*` is now the real admin boundary (D-020a, LOCKED DEFAULT). The local client-side gate in `app/admin/layout.tsx` is convenience-only and is explicitly labeled as such in the UI. `NEXT_PUBLIC_ADMIN_PASSWORD` is deprecated as a real security boundary. The Cloudflare Access application must be configured by the owner before any non-internal deploy. See `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md` and `docs/DEPLOYMENT.md` for the owner-side setup.
- **Remaining caveat (local dev / preview only):** without Cloudflare Access in front of `/admin/*` (e.g. on `localhost:3005`), the convenience gate still runs. It keeps the admin out of casual view but is not security. Cloudflare Access in front of `/admin/*` on the deployed site is mandatory before any non-internal launch. R-001 is **addressed at the deployment level** and **deferred** for the local dev / preview environment.

### R-002 — ~~Anthropic API key exposed in static bundle~~ (CLOSED in Security 1, 2026-06-16)

- **Original risk:** `NEXT_PUBLIC_ANTHROPIC_API_KEY` was inlined into the static JS bundle at build time. `lib/proposal-generator.ts` called the Anthropic API directly from the browser. Anyone could read the key from the source and use it; usage was billed to the owner.
- **Resolution:** the Anthropic call is now proxied through a Cloudflare Worker (`workers/anthropic-proposal-proxy.ts`). The Worker holds the API key server-side as `ANTHROPIC_API_KEY`. The frontend holds only the public Worker URL (`NEXT_PUBLIC_PROPOSAL_WORKER_URL`). The previous `NEXT_PUBLIC_ANTHROPIC_API_KEY` is deprecated and forbidden; do not reintroduce it. R-002 is closed as a runtime risk.
- **Remaining caveat:** CORS is not authentication. The Worker enforces `ALLOWED_ORIGIN` server-side, but anyone who can set a matching `Origin` header can request a proposal. The Worker is still gated to Cloudflare Access for the admin path (and ideally in front of the Worker route itself) before launch. See `repo-research/SECURITY_1_WORKER_PROXY_NOTES.md` and `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.

## Recommended future fixes (not yet approved)

- **F-001:** ~~Move the Anthropic call behind a server function or a Cloudflare Worker. Hold the API key as a server-side env var. Stop shipping the key in the bundle.~~ **Implemented in Security 1 (2026-06-16).** The Cloudflare Worker is in `workers/anthropic-proposal-proxy.ts`. The key is bound server-side as `ANTHROPIC_API_KEY`. The frontend uses `NEXT_PUBLIC_PROPOSAL_WORKER_URL`. The previous `NEXT_PUBLIC_ANTHROPIC_API_KEY` is deprecated. The Worker enforces `ALLOWED_ORIGIN` server-side. CORS is not authentication; the Worker is still gated to Security 2.
- **F-002:** ~~Replace the client-side admin gate with a real auth flow (e.g. Cloudflare Access, Auth.js, or a Tailscale-style private tunnel).~~ **Implemented in Security 2 (2026-06-16).** Cloudflare Access in front of `/admin/*` is the real admin boundary (D-020a, LOCKED DEFAULT). The local client-side gate in `app/admin/layout.tsx` is convenience-only and is explicitly labeled as such in the UI. `NEXT_PUBLIC_ADMIN_PASSWORD` is deprecated as a real security boundary. R-001 is **addressed** at the deployment level. F-002 is **implemented** for the deployed path. See `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md` and `docs/DEPLOYMENT.md` for the owner-side Cloudflare Access setup.
- **F-003:** ~~Enable Supabase RLS. Deny all to anon by default. Allow inserts to `bookings` only via a server-side endpoint.~~ **Implemented at the SQL level in Security 3 (2026-06-16).** The migration is in `supabase/migrations/20260616_security3_rls.sql`. Anon is denied on both tables; `service_role` retains full access; forward-compatible grants on `get_available_slots` (Booking A) and `reserve_slot` (Booking B, `service_role` only). The migration is on disk and ready to apply; F-003 is **deferred at the runtime level** until the owner applies the migration. See `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md`. R-003 closed at the SQL level; deferred at the runtime level.
- **F-004:** Fix the booking UI to read `available_slots` and only offer actually-available slots.
- **F-005:** Add Turnstile (free) to public forms.
- **F-006:** ~~Add a per-form webhook secret. Include it as a header. Verify in n8n.~~ **Implemented in Security 4 (2026-06-16).** Quote, contact, booking, and newsletter no longer POST to a single shared n8n webhook URL from the browser. They POST to a Cloudflare Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`), which adds a per-form secret header server-side (`X-CodeOutfitters-Form-Secret`) and forwards to the correct n8n webhook URL. The per-form secret is held server-side in the Worker (one secret per form: `N8N_CONTACT_SECRET`, `N8N_QUOTE_SECRET`, `N8N_BOOKING_SECRET`, `N8N_NEWSLETTER_SECRET`). n8n must verify the header against its own workflow-level secret/env var. The Worker is in `workers/n8n-form-proxy.ts`. R-005 / R-017 are **addressed at the deployment level** as of Security 4 (the browser no longer has direct access to the n8n webhook and the per-form secret is held server-side); R-005 / R-017 are **deferred at the runtime level** until the owner deploys the forms Worker and configures the n8n workflow to verify the header. See `repo-research/SECURITY_4_N8N_SECRET_NOTES.md` for the owner-side setup steps.
- **F-007:** Add error tracking (free: Sentry, GlitchTip). Add uptime monitoring (free: UptimeRobot, Better Stack free tier).
- **F-008:** Rotate the Anthropic and Supabase keys immediately after any public deploy that ships a static bundle.

None of F-001 through F-008 are implemented in DOC-MEMORY-REPAIR. They are listed for visibility and for the next planning phase to scope.

## What is acceptable in the current model

- The site has no payment, no PII beyond name/email/phone, no regulated data.
- The admin tool is single-operator. Compromise requires a deliberate attacker, not a casual visitor.
- The marketing copy does not over-promise. The site's own description matches its actual capabilities.
- The CSP is a real, deliberate security boundary at the production edge.
- Cloudflare Access in front of `/admin/*` is the real admin boundary on the deployed site. The local client-side password gate is convenience-only and is labeled as such.

## What is not acceptable in any model

- Storing customer card data, government IDs, or health data without RLS and a server endpoint.
- Using a single secret across multiple production environments.
- Committing real keys to the repo.
