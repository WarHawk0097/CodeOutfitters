# D0 SYSTEM DESIGN

> **Status:** D0 design / architecture system-design package for ChatGPT Control Room. **Plan-only.** No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no A0 / UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started.
>
> **Phase:** D0 — Design / Architecture.
>
> **Source materials:** `docs/PM1_PLAN.md`, `docs/PD1_DECISION_LOCK.md`, `repo-research/PD1_OWNER_DECISION_BALLOT.md`, `repo-research/PM1_PHASE_SEQUENCE.md`, `repo-research/RISK_REGISTER.md`, `repo-research/SECURITY_HARDENING_BRIEF.md`, `repo-research/BOOKING_CORRECTNESS_BRIEF.md`, `repo-research/TOOLING_APPROVAL_BRIEF.md`, `repo-research/UIX0_MOTION0_BRIEF.md`, `repo-research/QA_STRATEGY_BRIEF.md`, `repo-research/FEATURE_TRACEABILITY_MATRIX.md`, `repo-research/AGENT_BOUNDARY_MAP.md`, `repo-research/OPEN_QUESTIONS.md`, `docs/D0_ARCHITECTURE_DECISIONS.md`, `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, all `docs/`, all `memory/`, all `ai/`.
>
> **Hard rules respected:** no code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security fixes, no booking fixes, no git init, no CI config, no test file, no D0 implementation kickoff, no A0 kickoff, no UIX0 / MOTION0 implementation, no TS0 / RDG0 tooling install (including **Ponytail** and **ECC / affaan-m/ecc**).
>
> **Companion files in this D0 batch:**
> - `docs/D0_ARCHITECTURE_DECISIONS.md` — the area-by-area decision table.
> - `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` — file-zone per phase, integration contract list, rollback posture per phase.

## Table of Contents

1. Purpose and scope
2. Target architecture (one diagram, one sentence per box)
3. Security design
4. Booking design
5. Documentation / cleanup design
6. QA / CI design
7. Tooling design
8. UIX0 / MOTION0 design
9. Admin design
10. Observability design
11. Phase boundary design
12. D0 acceptance criteria
13. Safety confirmation
14. Appendix A — Cross-references
15. Appendix B — Files created in this batch
16. Appendix C — Files modified in this batch

---

## 1. Purpose and scope

D0 — System Design produces the **target architecture** for every future phase: security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0. D0 does not implement. D0 produces design diagrams, contracts, and acceptance criteria that the future IMPL phases (A0, Security 1, Security 2, Security 3, Booking A, Booking B, Observability, QA Slices 0/1/2/3, UIX0 / MOTION0 first slice, etc.) will plan against and execute.

This file is the **target architecture** companion to `docs/D0_ARCHITECTURE_DECISIONS.md` (the **decision table** companion) and `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (the **file-zone / phase-boundary** companion).

## 2. Target architecture (one diagram, one sentence per box)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Public visitor (untrusted, anonymous)                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Cloudflare Pages                                            │
   │  - Static HTML / JS / CSS from `out/`                        │
   │  - CSP enforced at the edge                                  │
   │  - SPA fallback via `public/_redirects`                      │
   │  - HSTS, frame denial, tight `connect-src`                   │
   └──────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Browser                                                     │
   │  - Renders public marketing site and (post-auth) admin       │
   │  - Holds no server secrets in `NEXT_PUBLIC_*` once Worker    │
   │    is in place                                               │
   │  - 4 public forms (quote, contact, booking, newsletter)      │
   │  - Reads `available_slots` via anon key + RLS or RPC         │
   └──────────────────────────────────────────────────────────────┘
        │              │             │                │
        │              │             │                │
        ▼              ▼             ▼                ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐    ┌──────────────┐
   │ n8n      │  │ Supabase │  │ Tawk     │    │ Cloudflare   │
   │ webhook  │  │ REST     │  │ (opt.)   │    │ Worker(s)    │
   │          │  │ anon key │  │ consent- │    │              │
   │ per-form │  │ (read or │  │ gated    │    │  - Anthropic │
   │ secret   │  │ RPC)     │  │          │    │  - admin auth│
   │ in       │  │          │  │          │    │  - booking   │
   │ header   │  │          │  │          │    │  - service-  │
   │          │  │          │  │          │    │    role DB   │
   └──────────┘  └──────────┘  └──────────┘    └──────────────┘
        │              │                              │
        │              │                              │
        ▼              ▼                              ▼
   ┌──────────┐  ┌──────────┐                  ┌──────────────┐
   │ Owner    │  │ Owner    │                  │ Anthropic    │
   │ inbox    │  │ n8n      │                  │ API          │
   │ (Sentry, │  │ (signed  │                  │ (server-side │
   │ UptimeR.,│  │ event)   │                  │ env var)     │
   │ email)   │  │          │                  │              │
   └──────────┘  └──────────┘                  └──────────────┘
```

**One sentence per box:**

- **Public visitor:** untrusted anonymous browser. Interacts only with the deployed site. CSP enforced.
- **Cloudflare Pages:** static host of `out/`. Owns the edge CSP. Provides SPA fallback. Hosts the Worker(s).
- **Browser:** renders the public site. After Security 2, only authenticated operators reach `/admin`. Holds no `NEXT_PUBLIC_*` secrets after Security 1.
- **n8n webhook:** receives public form submissions with a per-form secret in the header. Verifies the secret. Dispatches by payload shape. Posts back to the Operator channel on failure.
- **Supabase REST:** stores `bookings` and `available_slots`. RLS denies anon write; anon can read `available_slots` or call a specific RPC for the read. Worker holds the service-role key for writes.
- **Tawk (opt.):** live chat embed, loaded only after cookie consent.
- **Cloudflare Worker(s):** the new server boundary. Hosts (a) the Anthropic proxy, (b) the admin auth check (if not Cloudflare Access), (c) the booking reservation, (d) the signed event dispatcher to n8n. Holds the server-side env vars.
- **Anthropic API:** model API. Reached only via the Worker. Server-side env var.
- **Owner inbox:** receives Sentry errors, UptimeRobot alerts, n8n delivery failures, and booking failures.

## 3. Security design

### 3.1 Trust boundary

- The browser is untrusted. The browser may call: Cloudflare Pages, the Worker, Supabase REST (anon, read or RPC only), n8n (with secret in header), Tawk (consent-gated).
- The browser must not call: Anthropic API directly, Supabase REST for write, the admin gate (the Worker or Cloudflare Access enforces it).
- Secrets used by the browser are limited to non-billing, non-admission values. All `NEXT_PUBLIC_*` secrets that grant billing or admin access are removed once the Worker is in place.

### 3.2 Anthropic protection path (D-019a default: Cloudflare Worker proxy)

- **Endpoint:** a single Worker route (suggested: `POST /anthropic/v1/messages`). Authenticated by either a Cloudflare Access JWT (preferred) or a short-lived HMAC signed by the browser using a non-billing nonce.
- **Request shape (browser → Worker):** identical to the current Anthropic request (`model`, `max_tokens`, `system`, `messages`). Plus a `cf-access-jwt-assertion` header if Access is in front, or a `x-co-signature` header with the HMAC.
- **Response shape (Worker → browser):** identical to the current Anthropic response.
- **Server-side env vars (Worker):** `ANTHROPIC_API_KEY`, `WORKER_SIGNING_SECRET` (if HMAC is used), `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` (if Access is in front).
- **CSP update:** add the Worker origin to `connect-src` and `script-src` (if needed).
- **Rollback:** the Worker route is the only new endpoint. The browser can be reverted to call Anthropic directly (the `NEXT_PUBLIC_ANTHROPIC_API_KEY` returns to the bundle). Rollback is one PR.
- **Locks:** R-002, R-004, LG-1.

### 3.3 Admin auth path (D-020a default: Cloudflare Access; Supabase Auth if productized)

- **Fast path — Cloudflare Access:**
  - Protect the application in front of `/admin/*` routes.
  - Access policy: `email in {tayyab@codeoutfitters.com}` and any future internal collaborators.
  - No app code change required. The existing `app/admin/layout.tsx` password gate is removed.
  - The browser sends the `Cf-Access-Jwt-Assertion` header on every admin request. The Cloudflare edge validates the JWT and either allows or denies.
  - **Server-side env var:** the Cloudflare Pages project's `CF_ACCESS_DOMAIN` and `CF_ACCESS_AUD` (set at the edge, not in the bundle).
  - **Rollback:** re-enable the password gate. One PR.
  - **Locks:** R-001, R-003, R-029, LG-2.
- **Productized path — Supabase Auth / magic link (only if admin becomes productized):**
  - Add Supabase Auth. Admin signs in via magic link.
  - The admin layout reads the Supabase session.
  - `NEXT_PUBLIC_ADMIN_PASSWORD` is removed from the build output.
  - **Server-side env vars:** the Supabase service-role key is in the Worker only.
  - **Rollback:** re-enable the password gate. One PR.
  - **Locks:** R-001, R-003, R-029, LG-2 (full close).

### 3.4 `localStorage` risk handling

- **Single operator behind Cloudflare Access:** `localStorage` is acceptable for the operator's draft data. Document the limit.
- **Multi-operator or productized admin:** move proposal / intake persistence to Supabase or Worker + KV. The local cache becomes a write-through cache, not the source of truth.
- **Locks:** R-018.

### 3.5 Supabase RLS direction

- **Tables:** `bookings`, `available_slots`.
- **Roles:**
  - `anon` (browser): `USING (false)` for both tables. Reads via a specific RPC (e.g. `get_available_slots(month, year)`). Writes via the Worker.
  - `service_role` (Worker): full read/write. Used by the Worker only.
- **Grants:**
  - `anon`: `EXECUTE` on the `get_available_slots` RPC and (in the robust path) the `reserve_slot` RPC. No `SELECT` / `INSERT` / `UPDATE` / `DELETE` on the tables directly.
  - `service_role`: implicit full access.
- **Defense in depth:**
  - `UNIQUE (preferred_date, preferred_time)` on `bookings`.
  - The `reserve_slot` RPC checks `is_booked = false` before insert and update, in one transaction.
- **Rollback:** drop the policies. One SQL migration.
- **Locks:** R-006, LG-3.

### 3.6 n8n webhook exposure

- **Per-form secret:** one secret per form (quote, contact, booking, newsletter). The secret is rotated manually.
- **Header:** `X-CO-Form-Secret: <secret>`. n8n verifies against a workflow-level env var.
- **Unsigned requests:** dropped by n8n with a 401.
- **Rollback:** remove the secret from the request; n8n stops accepting. One PR + one n8n workflow change.
- **Locks:** R-017.

### 3.7 CSP considerations

- **Current:** `connect-src 'self' https://*.supabase.co https://*.n8n.io https://api.anthropic.com https://embed.tawk.to`; `frame-src 'none'`; `script-src 'self' 'unsafe-inline' https://embed.tawk.to`.
- **After Security 1:** add the Worker origin to `connect-src` (e.g. `https://co-proxy.codeoutfitters.workers.dev`). The `api.anthropic.com` entry can remain for backwards compatibility or be removed once the Worker is the only call site.
- **After Security 4:** no CSP change. The per-form secret is at the application layer.
- **After UIX0 / MOTION0:** if any new external endpoint is added, CSP must be updated in the same PR.
- **CI guard:** Security 5 phase adds a GitHub Actions step that fails the build if a new `fetch(` / `XMLHttpRequest` / `axios` call introduces an endpoint not in `public/_headers`. This is a static-analysis check on the source.
- **Locks:** R-020.

### 3.8 Proposal data risk

- **Today:** proposals are in `localStorage.co_last_proposal`. Accessible to anyone with admin access. If the browser is shared, the data is shared.
- **Post-Security 2 + Admin features phase:** proposals can be persisted to Supabase (or Worker + KV). R-018 partially closed.
- **Operator channel:** Sentry wraps the Anthropic call. A failed proposal generation is reported within 5 minutes (R-010 acceptance).
- **Locks:** R-018, R-010.

### 3.9 Launch-readiness requirements (LG-1..LG-10, D0 reflects PM1 §1.4)

- **LG-1** Anthropic key not in bundle — Security 1.
- **LG-2** Admin password not in bundle — Security 2.
- **LG-3** RLS on — Security 3.
- **LG-4** Booking UI reads slots + transactional — Booking A then Booking B.
- **LG-5** Per-form webhook secret — Security 4.
- **LG-6** n8n delivery monitor + error tracking + uptime — Observability.
- **LG-7** README accurate — Cleanup A.
- **LG-8** Lockfile resolved — Cleanup B.
- **LG-9** CSP checklist + CI guard — Security 5.
- **LG-10** Manual QA pass for the launch slice — Final QA phase.

## 4. Booking design

### 4.1 Current booking flow (carried forward; not changed by D0)

1. Visitor opens `/book` (`app/(public)/book/page.tsx`).
2. `components/booking-calendar-custom.tsx` renders a 3-step wizard: Date → Time → Details.
3. **Step 1 — date picker.** `isAvailable(day)` returns `true` for any future weekday. It does not call `getAvailableSlots` and does not read `available_slots.is_booked`.
4. **Step 2 — time picker.** Renders 14 hard-coded `TIME_SLOTS` (9:00 AM – 4:30 PM, 30 min, Mon–Fri). No time is marked unavailable based on `available_slots`.
5. **Step 3 — details form.** Validates client-side. Includes a honeypot.
6. **Submit.** POSTs to `NEXT_PUBLIC_N8N_WEBHOOK_URL` with `type: "booking"`. The Supabase write is **not** triggered by this component.
7. **Success state.** UI shows a confirmation. No retry, no error tracking.

### 4.2 Target booking flow (Booking A — MVP fix)

1. Visitor opens `/book`.
2. The calendar component calls `getAvailableSlots` for the displayed month. Days with no remaining slots are visually disabled. Times with `is_booked = true` are removed from the picker.
3. Visitor selects a date and a time. Step 3 captures the details (name, email, company, phone, message, honeypot).
4. On submit, the UI POSTs to the **Worker** (or to n8n, per the D-019b default of "A first, then C"). The Worker holds a service-role Supabase key.
5. The Worker calls the `reserve_slot` RPC (or, in the MVP path, a guarded insert/update) in a single transaction.
6. The Worker returns success / failure. The UI reflects the result honestly.
7. n8n receives a signed event from the Worker for downstream workflows.
8. Graceful degradation: when Supabase is unreachable, the UI shows an error and tells the user to email `hello@codeoutfitters.com`.

### 4.3 Supabase bookings / available_slots model (D0 reflects `lib/booking-schema.sql`)

**`available_slots`:**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `date` | `date` | not null |
| `time` | `time` | not null |
| `is_booked` | `boolean` | default `false` |
| `created_at` | `timestamptz` | default `now()` |
| | | `UNIQUE (date, time)` (already in the SQL) |

**`bookings`:**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `name` | `text` | not null |
| `email` | `text` | not null |
| `company` | `text` | nullable |
| `phone` | `text` | nullable |
| `message` | `text` | nullable |
| `preferred_date` | `date` | not null |
| `preferred_time` | `time` | not null |
| `timezone` | `text` | not null |
| `status` | `text` | `pending` \| `confirmed` \| `cancelled` (default `pending`) |
| `created_at` | `timestamptz` | default `now()` |
| | | **D0 recommends adding:** `UNIQUE (preferred_date, preferred_time)` (defense in depth) |

**D0-recommended RPCs (added in Booking A or Booking B):**

- `get_available_slots(p_month int, p_year int) returns table(...)` — `SECURITY DEFINER` or `SECURITY INVOKER` with `anon` `EXECUTE` grant. Returns rows where `is_booked = false` for the month.
- `reserve_slot(p_date date, p_time time, p_booking jsonb) returns uuid` — `SECURITY DEFINER`. In a single transaction: `INSERT INTO bookings (...)`; if successful, `UPDATE available_slots SET is_booked = true WHERE date = p_date AND time = p_time AND is_booked = false`; return the new booking id. If the update affected 0 rows, raise an exception (slot already booked). **Locks:** R-005.

### 4.4 Double-book prevention strategy (D0)

- **Layer 1 (UI honesty):** the calendar reads `available_slots.is_booked` and disables booked slots. Cheap. No server change.
- **Layer 2 (defense in depth — schema):** `UNIQUE (preferred_date, preferred_time)` on `bookings`. Even if the RPC fails, a second insert raises a unique-violation error.
- **Layer 3 (transactional RPC):** `reserve_slot` checks `is_booked = false` before insert and update, in one transaction. If the slot is already booked, the function raises an exception and no row is written.
- **Layer 4 (Worker mediation):** the Worker holds the service-role key. The anon key never writes. RPC grants to anon are narrow (only the `reserve_slot` RPC).
- **Rollback:** drop the RPC, drop the unique constraint, restore the anon-key path (with the same risks).

### 4.5 MVP booking correctness design (Booking A)

- **Read:** `getAvailableSlots(month, year)` from `lib/booking-actions.ts` is called by the calendar for the displayed month. The result is cached client-side.
- **Write:** the calendar calls the Worker (or n8n) on submit. The Worker calls `reserve_slot` (or, in the MVP path, a guarded insert/update). The UI shows success or failure.
- **Honesty:** the "instant success" UI is replaced with a real "we received your booking" + an honest "we'll confirm by email" state.
- **Graceful degradation:** if Supabase is unreachable, the UI shows an error and tells the user to email `hello@codeoutfitters.com`.
- **Acceptance criteria:** carried from `docs/PM1_PLAN.md` §5.7 and `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §10.

### 4.6 Future robust booking design (Booking B)

- **`reserve_slot` RPC** in Postgres. Single transaction. `UNIQUE` constraint on `bookings`.
- **Worker mediation.** UI → Worker → `reserve_slot`. Worker holds service-role key.
- **Signed event to n8n.** Worker signs a `booking.created` event for n8n to dispatch emails, calendar invites, etc.
- **Locks:** R-005, R-007 (re-seed), R-031 (re-seed), LG-4.

### 4.7 RLS requirements (D0)

- `bookings` and `available_slots`: `ENABLE ROW LEVEL SECURITY`.
- `anon`: no `SELECT` / `INSERT` / `UPDATE` / `DELETE`. `EXECUTE` on the `get_available_slots` and `reserve_slot` RPCs.
- `service_role`: implicit full access (used by the Worker).
- The seed SQL keeps its `ON CONFLICT DO NOTHING` behavior; it runs as `service_role` (DBA, not anon).
- **Locks:** R-006, LG-3.

### 4.8 Validation and acceptance criteria (D0 carries PM1 §5.7)

1. The booking UI calls `getAvailableSlots` for the displayed month and visually disables unavailable dates and times.
2. The booking submission persists to `bookings` and updates `available_slots.is_booked` through a single transactional path.
3. Two concurrent submissions for the same slot cannot both succeed.
4. The Supabase anon key cannot write to `bookings` or `available_slots` directly.
5. The booking flow degrades gracefully when Supabase is unreachable.
6. `components/booking-calendar-custom.tsx` and `lib/booking-actions.ts` are updated.
7. A manual test confirms: two simulated rapid submissions for the same slot result in exactly one `bookings` row and one `is_booked = true`.
8. The seed lifecycle is solved (re-seed script or scheduled function), removing R-007 / R-031.

## 5. Documentation / cleanup design

### 5.1 README repair boundary (Cleanup A)

- The repair is surgical. It does not redesign the README. It corrects the title, tagline, port, entry file, env vars, scripts, and links.
- It adds the admin tool warning, the security warning, and the documentation index.
- It drops the v0 Kiro badge and the v0 "Built with v0" mention (moved to Acknowledgments if at all).
- It matches the chosen package manager (D-015 default: `npm`).
- It is ≤ ~150 lines.
- The full spec is in `repo-research/README_REPAIR_SPEC.md`. The boundary D0 sets is: only the README changes; no other docs change in Cleanup A.

### 5.2 DEPLOY.md cleanup boundary (Cleanup A, Q-13)

- The legacy `DEPLOY.md` (root) is deleted in Cleanup A. `docs/DEPLOYMENT.md` is the canonical deploy doc.
- Rollback: revert the commit. The file is recoverable from git history once git is initialized.

### 5.3 Contact form `source` field (Cleanup A, Q-14)

- `components/contact.tsx` adds `source: "contact"` to the payload. One field, one line, one PR.
- Symmetry with quote (`source: "quote_request"`) and newsletter (`source: "newsletter"`).
- Rollback: revert the field. One PR.

### 5.4 Lockfile cleanup boundary (Cleanup B)

- Drop one lockfile. The other becomes canonical.
- D-015 default: drop `pnpm-lock.yaml`; keep `package-lock.json`.
- Add the dropped lockfile to `.gitignore`.
- Add a CI guard that fails the build if the dropped lockfile reappears.
- Update `docs/SETUP.md`, `docs/DEPLOYMENT.md`, and the repaired `README.md`.
- Rollback: re-create the dropped lockfile (`npm install` or `pnpm install`), remove the `.gitignore` entry, remove the CI guard. Multiple PRs but reversible.

### 5.5 Git / repo root setup boundary (Setup phase)

- Confirm `F:\CodeOutfitters` is the real repo root (Q-21 / D-027).
- If yes: `git init`; review `.gitignore`; first commit with the current state.
- If no: find the real root and re-run PM1 there. D0 does not act on the git state.
- PM1 / D0 / A0 do not run `git init`. Only the Setup phase, after owner confirmation.

## 6. QA / CI design

### 6.1 Typecheck / lint baseline (QA Slice 0, config-only)

- **Typecheck:** add `tsc --noEmit` as a CI step. Add `typecheck` script to `package.json` (script field only; no new dep).
- **Lint:** minimal `eslint.config.mjs` (flat config) extending `next/core-web-vitals`. CI step.
- **CI:** GitHub Actions workflow at `.github/workflows/ci.yml`. Runs `npm run typecheck` and `npm run lint` on every PR.
- **No new tooling.** No `devDependencies` change.
- **Locks:** R-008 (partial), R-009, R-026.

### 6.2 Manual QA baseline (always-on)

The full manual checklist is in `docs/QA_CHECKLIST.md`. The minimum bar for any release (D0 reflects PM1 §6.2):

- Home page renders.
- `/pricing`, `/contact`, `/book` all load and submit (or surface the email fallback when the webhook is unreachable).
- `/admin` gate works for the intended single operator.
- Reduced-motion variant does not break the layout.
- No console errors on any public page.
- Mobile responsive at 375 / 768 / 1024 / 1440.
- Cloudflare CSP is in effect on the deployed site (check response headers).
- `robots.txt` disallows `/admin`.

### 6.3 Future Playwright test runner (QA Slice 1, TS0 / RDG0 gated)

- Install Playwright as a real test runner in `devDependencies`.
- `tests/smoke.spec.ts` covers: home, services, pricing, contact, book (each step), admin gate, admin onboarding (each section), admin proposal (mocked).
- CI runs the smoke spec on every PR and every deploy.
- Mocks for Anthropic. Mocks for n8n. Mocks for Supabase (or a test Supabase project).
- **Locks:** R-008 (full).

### 6.4 Future Playwright MCP + Chrome DevTools MCP browser QA loop (QA Slice 2, TS0 / RDG0 gated)

- Playwright MCP for clicks, screenshots, accessibility tree, network log.
- Chrome DevTools MCP for performance, console, DOM, network.
- Used in the UIX0 / MOTION0 first slice for taste review.
- Lighthouse mobile audit in parallel.
- Reduced-motion variant capture.
- **Locks:** R-012 (taste review evidence).

### 6.5 Accessibility / reduced-motion checks (always-on)

- All non-essential motion must opt out when `prefers-reduced-motion: reduce` is set. AOS, GSAP, Framer Motion all need explicit opt-out paths.
- Focus state must be visible at all times.
- Keyboard navigation must not be broken by enter/exit animations.
- `aria-live` regions unaffected by motion.
- Color contrast unaffected by motion.
- **Locks:** R-015.

### 6.6 Motion performance checks (always-on, UIX0 / MOTION0 first slice)

- Lighthouse CI budgets for LCP, CLS, INP, TBT.
- Captured in `repo-research/MOTION_QA_LOG.md`.
- Real-device test on at least one mid-tier Android.
- **Locks:** R-013, R-014.

### 6.7 No test files yet (D0 does not create any test file)

- D0 only plans. QA Slice 0 creates the CI config. QA Slice 1 creates the smoke spec.
- D0 does not create any `*.test.*` / `*.spec.*` file.

## 7. Tooling design

### 7.1 Repomix role

- **Purpose:** pack the repo into a single LLM-friendly bundle. Helps every other step.
- **Dev or runtime:** dev only.
- **Install needed:** yes (one-shot `npx` or a local install).
- **Gate:** TS0 / RDG0.
- **Risk:** low. May transmit repo contents off-machine if used in cloud mode — prefer local mode.
- **Install order:** 1.
- **Scope:** per-project (preferred) or external workspace.
- **D0 plan:** not installed in D0. Recorded in the TS0 / RDG0 submission as the first candidate.

### 7.2 Graphify role

- **Purpose:** knowledge graph over the repo. God nodes, community detection, query tools.
- **Dev or runtime:** dev only.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Pure dev surface.
- **Install order:** 2.
- **Scope:** per-project (preferred) or external workspace.
- **D0 plan:** not installed in D0. Recorded in the TS0 / RDG0 submission as the second candidate.

### 7.3 Context7 MCP role

- **Purpose:** up-to-date library / framework docs lookup. Avoids hallucinated framework APIs.
- **Dev or runtime:** dev only.
- **Install needed:** yes (MCP server).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Read-only.
- **Install order:** 3.
- **Scope:** per-project (preferred).
- **D0 plan:** not installed in D0.

### 7.4 Playwright MCP role

- **Purpose:** drive a real browser from the agent for visual / smoke / motion QA. Clicks, screenshots, accessibility tree, network log.
- **Dev or runtime:** dev only.
- **Install needed:** yes (MCP server). May pull Playwright browser binaries on first use.
- **Gate:** TS0 / RDG0.
- **Risk:** low for read-only smoke. Mutating when used for dogfooding — gate the use.
- **Install order:** 4.
- **Scope:** per-project (preferred).
- **D0 plan:** not installed in D0. Used in QA Slice 2 + UIX0 / MOTION0 first slice.

### 7.5 Chrome DevTools MCP role

- **Purpose:** lower-level browser introspection. Performance, console, DOM, network.
- **Dev or runtime:** dev only.
- **Install needed:** yes (MCP server).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Read-only by default.
- **Install order:** 5.
- **Scope:** per-project (preferred).
- **D0 plan:** not installed in D0. Used in QA Slice 2 + UIX0 / MOTION0 first slice.

### 7.6 Impeccable role

- **Purpose:** frontend design review. Avoids generic AI UI.
- **Dev or runtime:** dev / skill.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Skill is a prompt and checklist.
- **Install order:** 6.
- **Scope:** per-project.
- **D0 plan:** not installed in D0. Used in UIX0 / MOTION0 first slice for taste review.

### 7.7 Emil Kowalski / Agents with Taste role

- **Purpose:** motion / animation taste reference. Keeps motion purposeful.
- **Dev or runtime:** dev / skill.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Skill is a prompt and checklist.
- **Install order:** 7.
- **Scope:** per-project.
- **D0 plan:** not installed in D0. Used in UIX0 / MOTION0 first slice for taste review.

### 7.8 Tree-sitter / codebase-memory role

- **Purpose:** structural code parsing (Tree-sitter); persistent memory of the codebase across sessions (codebase-memory MCP).
- **Dev or runtime:** dev only.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. codebase-memory MCP is the "memory of record" for the agent and must be careful not to write secrets.
- **Install order:** 8 (Tree-sitter) and 9 (codebase-memory MCP), only if a future phase needs them; nice-to-have.
- **Scope:** per-project (preferred).
- **D0 plan:** not installed in D0. Reserved for later if at all.

### 7.9 Ponytail candidate rule (NOT APPROVED)

- **Status:** **NOT APPROVED.** Candidate only.
- **Required gate:** **TS0 / RDG0.**
- **Required owner input (before TS0 / RDG0 evaluation):**
  - Exact official GitHub repo URL (canonical upstream).
  - Pinned version or commit SHA.
  - Scope: global / per-project / reference-only (default: reference-only).
- **Required evaluation (future TS0 / RDG0 submission, not in D0):**
  1. What does Ponytail do? Capability, intended use case, scope.
  2. Is it safe and maintained? Last commit, open-issue volume, license, supply-chain history, review process.
  3. Install footprint — `npm install` / `pnpm install` / `yarn install` (a `devDependency`), a `git clone`, an MCP server config, a global tool install, or a repo dependency?
  4. Overlap with existing candidates (Graphify, Repomix, Context7, Impeccable, Emil Kowalski skills).
  5. Scope decision — global, external workspace, per-project, or reference-only.
  6. Cost / license — free and open-source? D-009 requires free / open-source by default.
  7. Production / runtime impact — must not touch production or runtime code.
- **Hard rules reaffirmed:** no install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.

### 7.10 ECC / affaan-m/ecc candidate rule (NOT APPROVED)

- **Tool:** ECC / affaan-m/ecc.
- **Status:** **NOT APPROVED.** Candidate only.
- **Type:** Developer / AI agent harness tooling. Not a product runtime dependency by default.
- **Required gate:** **TS0 / RDG0.**
- **Recommended default:** Research during future TS0 / RDG0 only. Do not install now.
- **Why it may be relevant:** the owner uses Codex, OpenCode, Claude Code, and multiple agents. ECC may provide an agent-harness layer that overlaps with or complements the existing candidates.
- **Overlap risk:** ECC may overlap with Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, and codebase-memory. ECC must be evaluated before adoption. ECC should not be blindly stacked with other agent harness tools.
- **Required owner input (before TS0 / RDG0 evaluation):**
  - Exact official GitHub repo URL (canonical upstream).
  - Pinned version or commit SHA.
  - Scope preference: global / per-project / reference-only (default: reference-only).
- **Required evaluation (future TS0 / RDG0 submission, not in D0):**
  1. What does ECC do? Capability, intended use case, scope.
  2. Is it safe and maintained? Last commit, open-issue volume, license, supply-chain history, review process.
  3. What install paths does it require? `npm install` / `pnpm install` / `yarn install` (a `devDependency`), a `git clone`, an MCP server config, a global tool install, a copied config folder, a plugin install, or a repo dependency?
  4. Does it touch `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, package files, or repo config?
  5. Does it overlap with existing tooling candidates (Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, codebase-memory)?
  6. Should it become the main agent-harness layer, reference-only, external workspace tooling, global tooling, or per-project tooling?
  7. Cost / license — free and open-source? D-009 requires free / open-source by default.
  8. Production / runtime impact — must not touch production or runtime code.
  9. Supply-chain risk — typosquats, prior CVEs, install-footprint on the operator's machine.
  10. Rollback plan if it causes conflicts.
- **Hard rules reaffirmed:** no install, no clone, no `git clone`, no copy of config folders, no copy of `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs; no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase. D0 only records the candidate.

### 7.11 Global vs external workspace vs per-project guidance

- **Default scope is per-project** for the design skills (Impeccable, Emil Kowalski).
- **Default scope is per-project or external workspace** for the dev tools (Repomix, Graphify, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Tree-sitter, codebase-memory MCP, ECC / affaan-m/ecc if approved).
- **Global install is discouraged** for any of these. Global install pollutes other projects and complicates rollback.
- **Reference-only** is the safest fallback. A skill that is referenced but not installed still informs the agent's output through the prompt context.

### 7.12 Dev tooling must not become runtime dependency by default

- Each tool is added to `devDependencies` (not `dependencies`).
- The production Cloudflare Pages build does not include any of these tools.
- If a tool accidentally becomes a runtime dep, remove it in a follow-up PR. Document the removal in `INTEGRATION_NOTES.md` if it changes the integration surface.

## 8. UIX0 / MOTION0 design

### 8.1 Heavy premium motion direction (D-011, D-022)

- **Overall feel:** premium AI automation agency. Modern, bold, high-energy. Smooth scroll-driven storytelling. More animated than a typical SaaS site, but not childish. Professional enough for US small-business clients. Cool enough to feel like a high-end AI agency.
- **Rule:** animations have purpose. No decorative-only motion. No random parallax. No "showy" easing curves that delay the user.
- **Brand palette:** emerald `#2A6B5A`, gold `#C8A96E`, off-white `#FAFAF7`, sand `#F5F0EB`. These are the brand tokens, not a free-for-all.

### 8.2 BeFluence reference-only rule (D-022, D-023, Q-09)

- `befluence.pro` is motion / interaction inspiration only. Do not copy assets. Do not scrape. Do not clone.
- The rule is reaffirmed across D-011, D-022, D-023, Q-09, and the UIX0 / MOTION0 brief.

### 8.3 First motion slice boundaries (D0 carries PM1 §8.5)

- **In the first slice (one PR):**
  1. Hero entrance + animated headline reveal. Single component, owned by the home page.
  2. Scroll-triggered section reveals. One canonical hook. Replaces `useScrollReveal` duplicates. Respects `prefers-reduced-motion`.
  3. ROI calculator micro-interactions. Sliders already work; add value-update animation and a subtle "settle" on stop.
  4. Reduced-motion coverage. AOS opt-out, GSAP opt-out, Framer Motion opt-out. The site must pass the media-query test.
- **Deferred to later slices (each a separate PR):**
  - Smooth parallax layers (mobile performance risk; separate benchmark).
  - Magnetic buttons (better as part of the design-taste pass).
  - Portfolio cards with motion depth (refactor of `components/portfolio.tsx`).
  - Process timeline animation (refactor of `components/process.tsx`).
  - Contact / booking form transitions (refactor of multiple forms).
  - Marquee polish (already exists; design pass).
  - Animated statistics counters (separate micro-PR).
  - Admin motion discipline (cross-link §9; lighter than the public site).

### 8.4 Existing GSAP / Framer Motion / AOS / Lenis risk

- **3 GSAP entry points:** `lib/gsap.ts`, `lib/animations/gsap-setup.ts`, `lib/animations/gsap-config.ts`. Collapse to one canonical setup. R-021.
- **2 `useScrollReveal` hooks:** `hooks/useScrollReveal.ts`, `lib/animations/useScrollReveal.ts`. Replace with one canonical hook. R-021.
- **AOS does not opt out of `prefers-reduced-motion`.** R-015.
- **Bundle size:** GSAP + ScrollTrigger + `@gsap/react` + Framer Motion + AOS + Lenis ≈ 80-120 KB gzipped. No new libraries in the first slice. R-013.

### 8.5 Duplicate animation entry point risk

- The first slice collapses to one GSAP setup and one `useScrollReveal` hook. Imports are updated. Unused files are deleted.
- The AOS opt-out is added in the same PR.
- **Locks:** R-021.

### 8.6 Performance budget (D-022a default: accept §8.7)

- **LCP:** unchanged or improved after motion is added. Hero must not be slowed by its own entrance.
- **CLS:** 0. No layout-shifting animations. Use transform / opacity only.
- **INP:** stays in the "good" range on a Moto G Power class device.
- **JS bundle:** +0 KB net from new libraries. The first slice reuses existing libraries.
- **CSS:** no new CSS framework. Use Tailwind transitions where applicable.
- **Network:** no new external assets. The first slice does not load new fonts, scripts, or images.
- **Verification:** Lighthouse mobile audit before and after, in the Playwright MCP + Chrome DevTools MCP loop.

### 8.7 Mobile performance rules

- Test on Moto G Power class devices.
- Smooth scroll is gated to non-reduced-motion and a "good CPU" profile.
- Parallax layers may need to be disabled on low-end mobile.
- AOS `disable` flag for low-end mobile (heuristic: `navigator.deviceMemory < 4`).
- `prefers-reduced-motion: reduce` is honored at all times.

### 8.8 Reduced-motion requirement (hard)

- All non-essential motion opts out when `prefers-reduced-motion: reduce` is set.
- Focus state must be visible at all times, even during transitions.
- Keyboard navigation must not be broken by enter/exit animations.
- Animations must not delay interaction. Hero entrance can be 600-1000ms, but it must not block scroll or click.
- `aria-live` regions are unaffected by motion.
- Color contrast is unaffected by motion.
- **Locks:** R-015.

### 8.9 Taste rubric (D-012, Q-17)

- **Avoid:** generic purple/blue SaaS gradients, same-looking rounded cards everywhere, weak typography hierarchy, random icons above every heading, unmotivated animations, slow heavy motion that damages usability, overdone effects that feel childish.
- **Prefer:** premium AI automation agency feel, strong typography, clear hierarchy, confident spacing, smooth purposeful animation, fast interaction feedback, scroll-based storytelling, professional US small-business trust, beautiful but operational UI.
- The rubric is run at the end of the first slice by Impeccable + Emil Kowalski. Before / after evidence is captured in `repo-research/MOTION_QA_LOG.md`.

### 8.10 Browser review loop later (D0 plans; not implemented)

1. AI generates motion / UI change.
2. AI opens the page in browser using Playwright MCP and / or Chrome DevTools MCP.
3. AI visually critiques the result using Impeccable + Emil Kowalski rules.
4. AI improves weak sections.
5. AI repeats until the page feels premium and polished.

In parallel:

- Lighthouse mobile audit (LCP, CLS, INP, TBT).
- Real-device test on at least one mid-tier Android.
- Reduced-motion variant capture (AOS, GSAP, Framer Motion opt-outs visible).

### 8.11 Admin lighter-motion rule

- Admin motion is **lighter and faster** than the public site. Page transitions ≤ 200ms.
- No parallax, no floating cards, no marquees.
- Form sections do not have entrance animations that delay the user.
- The "Recent Proposals" tile (when built) uses a simple fade-in, not a parallax reveal.

## 9. Admin design

### 9.1 Internal-only admin boundary (D-017, default)

- Single operator (Tayyab). Admin lives at `/admin/*` and is gated by a real auth flow (Cloudflare Access or Supabase Auth).
- Clients do not log in to the admin tool; proposals are sent via the operator's email.
- **Locks:** R-001, R-003, R-029.

### 9.2 Proposal generation flow (D0 reflects current + post-Worker)

**Today (no change in D0):**

1. Operator completes the 5-section intake form at `/admin/onboarding`.
2. Form data is serialized to `localStorage` under `co_onboarding_data`.
3. Operator is redirected to `/admin/proposal`.
4. The proposal page reads the intake, calls `lib/proposal-generator.ts` which calls `https://api.anthropic.com/v1/messages` with `claude-sonnet-4-6`, and renders the parsed 11-section response.
5. The generated proposal is written to `localStorage` under `co_last_proposal`.

**After Security 1:**

- Step 4 changes: the proposal page calls the Worker, not Anthropic directly. The Worker holds the key. The browser no longer holds the key.
- All other steps are unchanged.

### 9.3 Proposal persistence options (D-025, default: later admin phase)

- **Option A (smallest, honest improvement):** surface `localStorage.co_last_proposal` in the existing Recent Proposals tile. Remove the "Coming soon" tag. No new persistence. (In a future admin features phase.)
- **Option B (post-Worker):** persist proposals to Supabase (or Worker + KV). List on the dashboard with click-through. Larger work item; depends on Security 1.
- **D0 recommendation:** A first, B later. PD1 default is conservative ("later admin phase"). A0 may surface a different choice.

### 9.4 Recent proposals future phase

- D0 reflects the conservative default: a later admin phase, after auth and proposal-persistence decisions.
- No recent-proposals persistence work in D0 / A0.

### 9.5 Admin auth future path

- **Fast path:** Cloudflare Access. The access policy is the operator's email (and any future internal collaborators).
- **Productized path:** Supabase Auth / magic link. Triggered only if admin becomes productized.
- **D0 plan:** the auth path is decided in A0. A0 will write the Access policy or the Supabase Auth integration. D0 only plans the boundary.

### 9.6 Data risk and `localStorage` limits

- `localStorage` is acceptable for a single operator behind Cloudflare Access.
- If the admin tool grows multi-user, move proposal / intake persistence to a server boundary.
- The limit is documented in `docs/SECURITY.md` (R-010 / R-018 acceptance).
- **Locks:** R-018.

## 10. Observability design

### 10.1 Sentry candidate

- **Tool:** Sentry (errors, free tier).
- **Trigger:** client-side errors and worker errors. Wire to `components/error-boundary.tsx`.
- **Capture:** unhandled errors, console errors, network errors to Supabase / n8n / Anthropic.
- **Owner channel:** email (default) or Discord webhook.
- **D0 plan:** not configured in D0. The Observability phase configures Sentry.

### 10.2 UptimeRobot candidate

- **Tool:** UptimeRobot (uptime, free).
- **Trigger:** watch `/`, `/contact`, `/book`.
- **Alert on:** 5xx or timeout.
- **Owner channel:** email.
- **D0 plan:** not configured in D0.

### 10.3 Email alert channel

- **Default:** `hello@codeoutfitters.com`. The operator's email.
- **Fallback:** Discord webhook (free; one-message-per-event). D0 records Discord as a fallback, not a replacement.

### 10.4 Webhook failure visibility

- **Tool:** n8n-side error workflow (free; n8n already in stack).
- **Trigger:** n8n catches and forwards failed form submissions to the owner channel.
- **D0 plan:** n8n workflow is created in the Observability phase.

### 10.5 Booking failure visibility

- **Tool:** Sentry wrap on `lib/booking-actions.ts` calls.
- **Trigger:** any booking write failure.
- **Owner channel:** email.
- **D0 plan:** the wrap is added in the Observability phase.

### 10.6 Admin proposal failure visibility

- **Tool:** Sentry wrap on the proposal-generation path.
- **Trigger:** any Anthropic call failure or RPC error.
- **Owner channel:** email.
- **D0 plan:** the wrap is added in the Observability phase.

### 10.7 No vendor setup yet (D0)

- D0 does not configure Sentry, UptimeRobot, or any monitor. The Observability phase does that.
- D0 only plans the architecture.

## 11. Phase boundary design

D0 defines what each future phase owns. Detailed file-zone per phase is in `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`. Summary of phase boundaries:

| Future phase | Purpose | Allowed file zones | Blocked until |
|---|---|---|---|
| Setup | Confirm root; `git init`; review `.gitignore`; first commit. | `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `.gitignore`, `docs/`, `memory/`, `ai/`, `repo-research/` | Q-21 / D-027 owner confirmation |
| Cleanup A | README repair, `DEPLOY.md` delete, portfolio copy fix, `source: "contact"`, `tsconfig.tsbuildinfo` to `.gitignore`, ESLint config | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Setup; Q-13, Q-14 |
| Cleanup B | Drop one lockfile, update `.gitignore`, update docs, add CI guard | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Cleanup A; D-015 owner |
| TS0 / RDG0 | Tooling approval request (9 tools + Ponytail candidate + ECC / affaan-m/ecc candidate) | `repo-research/TS0_RDG0_REQUEST.md` (or split into 9 PRs) | Cleanup A; PD1 + D0 + A0 pass |
| TS0 setup | Install approved tools in their own PRs | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | TS0 / RDG0 approval per tool |
| QA Slice 0 | `typecheck` script, `eslint.config.mjs` (already in Cleanup A), GitHub Actions CI | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Cleanup A (parallel with Cleanup B / TS0 / RDG0) |
| D0 | This phase | `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md` (INTEGRATION_NOTES.md only if integration architecture was clarified) | PM1 + PD1 pass |
| A0 | Concrete plan for security, booking, observability, UIX0 / MOTION0 phases | `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md` | D0 pass |
| Security 1 | Cloudflare Worker proxy for Anthropic | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | A0; Setup |
| Security 2 | Real admin auth (Cloudflare Access or Supabase Auth) | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Security 1 |
| Security 3 | Supabase RLS | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Security 1 or 2 |
| Security 4 | n8n per-form secret + header | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Security 1 or 2 |
| Security 5 | CSP CI guard | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | TS0 setup (CI); Security 1 |
| Booking A | MVP fix: UI reads slots + wire to `createBooking`; n8n path | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | A0; D0 |
| Booking B | Robust fix: `reserve_slot` RPC + Worker | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Booking A; Security 1 |
| Admin auth + persistence | Better admin auth (already in Security 2) + persist proposals to Supabase | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Security 2; Booking A |
| Observability | Sentry error tracking; UptimeRobot; n8n delivery monitor; booking failure wrap; owner channel | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | Cleanup A; D-026 owner |
| QA Slice 1 | Real Playwright test runner + smoke spec | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | TS0 setup; QA Slice 0 |
| QA Slice 2 | Lighthouse CI + visual regression + Chrome DevTools MCP integration | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | QA Slice 1; TS0 setup |
| QA Slice 3 | Form / booking / admin / a11y tests + bundle size guard | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | QA Slice 1; the feature phases |
| UIX0 / MOTION0 first slice | Hero + headline + scroll reveals + ROI micro + reduced-motion coverage | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | QA Slice 2; TS0 setup |
| UIX0 / MOTION0 later slices | Parallax, magnetic buttons, portfolio motion depth, process timeline, form transitions, marquee polish, stat counters | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | First slice |
| Admin motion + testimonials | Admin lighter motion; testimonials carousel wiring (R-4.3); R-4.4 portfolio copy if not done in Cleanup A | per `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` | First slice |
| Final QA + delivery | Full manual checklist; full automated smoke; Cloudflare post-deploy checks | `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md` | All above |

## 12. D0 acceptance criteria

D0 passes only if **all** of the following are true:

### 12.1 Deliverables

- [x] `docs/D0_ARCHITECTURE_DECISIONS.md` exists, covers 12 areas (snapshot, target direction, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0, phase boundaries, risks, cross-cutting), and is well-structured.
- [x] `docs/D0_SYSTEM_DESIGN.md` (this file) exists, covers the target architecture, security design, booking design, documentation / cleanup design, QA / CI design, tooling design, UIX0 / MOTION0 design, admin design, observability design, phase boundary design, and D0 acceptance criteria.
- [x] `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` exists, covers file-zone per phase, integration contract list, and rollback posture per phase.
- [x] `PROJECT_CONTROL_LOG.md` is updated with the D0 batch overlay.
- [x] `memory/CURRENT_STATE.md` is updated to reflect D0 written; pending review.
- [x] `memory/ACTIVE_TASK_CONTEXT.md` is updated for the D0 phase.
- [x] `memory/WORKING_MEMORY.md` is updated with D0 plan, architectural-path decisions, and future-phase boundaries.
- [x] `memory/EPISODIC_MEMORY.md` is updated with the D0 event.
- [x] `memory/IMPORTANT_DECISIONS.md` is updated with a D0 reflection note; no new decisions.
- [x] `ai/AI_TASK_CAPSULE.md` is updated with the D0 line and reflection note.
- [x] `ai/AI_CONTEXT_RULES.md` is updated with the D0 hard rule and future-phase boundary note.
- [x] `docs/51_AGENT_HANDOFF_LOG.md` is appended to (not rewritten).
- [x] `INTEGRATION_NOTES.md` is updated only if integration notes changed (D0 only plans integration architecture; no current integration contract changed; D0 does not modify `INTEGRATION_NOTES.md`).

### 12.2 Constraints

- [x] No source files in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/` were modified.
- [x] No `package.json` edits.
- [x] No lockfile edits (neither `package-lock.json` nor `pnpm-lock.yaml`).
- [x] No `tsconfig.json` edits.
- [x] No `next.config.mjs`, `postcss.config.mjs`, `components.json` edits.
- [x] No `.env*` edits.
- [x] No `public/_headers` or `public/_redirects` edits.
- [x] No `README.md` edits.
- [x] No `DEPLOY.md` delete.
- [x] No `npm install` / `pnpm install` / `yarn install` / `npx` of any kind.
- [x] No MCP server configuration.
- [x] No skill install (`npx skills add`, `npx impeccable install`).
- [x] No git init / no git-changing commands.
- [x] No CI config file (`.github/`, etc.) created.
- [x] No test file created.
- [x] No D0 / A0 / UIX0 / MOTION0 / IMPL work started.
- [x] No tooling installs.
- [x] No lockfile deletion.
- [x] **Ponytail** remains candidate only; not approved; not installed; not cloned; not configured; not added to `package.json`; not evaluated; not in any config file.
- [x] **ECC / affaan-m/ecc** remains candidate only; not approved; not installed; not cloned; not copied; not configured; not added to `package.json`; not added to `devDependencies`; not evaluated; not in any config file.

### 12.3 Plan quality

- [x] The D0 plan synthesizes PM1, PD1, the strategy briefs, the risk register, the state files, and the existing docs.
- [x] The D0 plan reflects every PD1 LOCKED DEFAULT and every PD1-shadowed architectural-path option.
- [x] The phase sequence is explicit and respects the hard rules.
- [x] The launch gates (LG-1..LG-10) are mapped to the future phases that close them.
- [x] The D0 plan recommends whether A0 can start (it can, if D0 is approved by ChatGPT Control Room).
- [x] Git / repo root concern is documented as a planning concern, not acted on.

### 12.4 Stop rule

- D0 stops. It does not start A0, UIX0 / MOTION0, TS0 / RDG0, IMPL, or any implementation.
- D0 does not install anything.
- D0 does not configure anything.
- D0 waits for ChatGPT Control Room.

## 13. Safety confirmation

This D0 batch:

- Did not modify any source file under `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`.
- Did not modify `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`.
- Did not modify either lockfile (`package-lock.json`, `pnpm-lock.yaml`).
- Did not modify `.env*`, `.gitignore`, `README.md`, or `DEPLOY.md` (root).
- Did not run `npm install`, `pnpm install`, `yarn install`, or `npx` of any kind.
- Did not configure any MCP server.
- Did not install any tooling or skill (`npx skills add`, `npx impeccable install`, etc.).
- Did not install, clone, configure, or evaluate **Ponytail** (candidate only; not approved; recorded for future TS0 / RDG0).
- Did not install, clone, copy configs from, configure, or evaluate **ECC / affaan-m/ecc** (candidate only; not approved; recorded for future TS0 / RDG0).
- Did not initialize git or run any git-changing command.
- Did not create a CI config file.
- Did not create any test file.
- Did not start A0, UIX0 / MOTION0, TS0 / RDG0, IMPL, or any implementation.
- Only created or modified files inside the allowed change zones: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` was not modified in this batch because no integration contract changed in D0; D0 only plans integration architecture, it does not change current integration contracts.

---

## Appendix A — Cross-references

- `docs/D0_ARCHITECTURE_DECISIONS.md` — D0 area-by-area decision table.
- `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` — D0 file-zone per phase and integration contract list.
- `docs/PM1_PLAN.md` — PM1 plan (14 workstreams).
- `docs/PD1_DECISION_LOCK.md` — PD1 decision-lock package and D0 readiness assessment.
- `repo-research/PD1_OWNER_DECISION_BALLOT.md` — one-row-per-decision ballot.
- `repo-research/PM1_DECISION_MATRIX.md` — D-15..D-27 detail with rationale.
- `repo-research/PM1_PHASE_SEQUENCE.md` — 27 phases with gates, depends-on, file-ownership rules.
- `repo-research/RISK_REGISTER.md` — R-001..R-035.
- `repo-research/SECURITY_HARDENING_BRIEF.md` — security options A..E.
- `repo-research/BOOKING_CORRECTNESS_BRIEF.md` — booking options A..E.
- `repo-research/TOOLING_APPROVAL_BRIEF.md` — 9-tool matrix.
- `repo-research/UIX0_MOTION0_BRIEF.md` — first slice and budget.
- `repo-research/QA_STRATEGY_BRIEF.md` — QA strategy.
- `repo-research/FEATURE_TRACEABILITY_MATRIX.md` — feature-by-feature trace.
- `repo-research/AGENT_BOUNDARY_MAP.md` — file-zone ownership rules.
- `repo-research/OPEN_QUESTIONS.md` — Q-01..Q-20 (Q-13..Q-21 in PD1).
- `docs/ARCHITECTURE.md` — current architecture (will be re-confirmed by D0 plan).
- `docs/SECURITY.md` — current security posture.
- `docs/DATABASE.md` — booking schema and RLS gap.
- `docs/FEATURES.md` — public + admin feature inventory.
- `docs/ROADMAP.md` — Phase 0..5 + 3.5.
- `docs/QA_CHECKLIST.md` — manual QA + future motion / taste QA.
- `docs/51_AGENT_HANDOFF_LOG.md` — phase ledger.
- `PROJECT_CONTROL_LOG.md` — phase ledger and gate status.
- `INTEGRATION_NOTES.md` — external service contracts.
- `memory/IMPORTANT_DECISIONS.md` — D-001..D-027 (D0 does not add new decisions).
- `memory/EPISODIC_MEMORY.md` — event log.
- `ai/AI_CONTEXT_RULES.md` — never-do list and phase discipline.
- `ai/AI_TASK_CAPSULE.md` — orientation.
- `ai/AI_FILE_OWNERSHIP.md` — file ownership rules.

## Appendix B — Files created in this batch

- `docs/D0_ARCHITECTURE_DECISIONS.md` (D0 area-by-area decision table; primary deliverable).
- `docs/D0_SYSTEM_DESIGN.md` (this file; D0 target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts; primary deliverable).
- `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (D0 file-zone per phase; integration contract list; rollback posture per phase; primary deliverable).

## Appendix C — Files modified in this batch

- `PROJECT_CONTROL_LOG.md` (D0 batch overlay).
- `memory/CURRENT_STATE.md` (snapshot updated to D0 written; pending review).
- `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with D0 — Design / Architecture).
- `memory/WORKING_MEMORY.md` (D0 plan; architectural-path decisions; future-phase boundaries).
- `memory/EPISODIC_MEMORY.md` (D0 event appended).
- `memory/IMPORTANT_DECISIONS.md` (D0 reflection note appended; no new decisions).
- `ai/AI_TASK_CAPSULE.md` (phase line updated to D0; D0 reflection note).
- `ai/AI_CONTEXT_RULES.md` (D0 hard rule added; future-phase boundary note).
- `docs/51_AGENT_HANDOFF_LOG.md` (D0 entry appended).
- `INTEGRATION_NOTES.md` — **not modified** (no integration contract changed in D0; D0 only plans integration architecture).
