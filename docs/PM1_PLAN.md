# PM1 PLAN

> **Status:** Draft for ChatGPT Control Room review. This is a plan, not an implementation.
> **Phase:** PM1 — Plan.
> **Source materials:** `repo-research/PRE8_CHECKPOINT.md`, `repo-research/PM1_INPUT_BRIEF.md`, `repo-research/RISK_REGISTER.md`, `repo-research/README_REPAIR_SPEC.md`, `repo-research/LOCKFILE_DECISION_BRIEF.md`, `repo-research/SECURITY_HARDENING_BRIEF.md`, `repo-research/BOOKING_CORRECTNESS_BRIEF.md`, `repo-research/TOOLING_APPROVAL_BRIEF.md`, `repo-research/UIX0_MOTION0_BRIEF.md`, `repo-research/QA_STRATEGY_BRIEF.md`, `repo-research/FEATURE_TRACEABILITY_MATRIX.md`, `repo-research/AGENT_BOUNDARY_MAP.md`, `repo-research/OPEN_QUESTIONS.md`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, all `docs/`, all `memory/`, all `ai/`.
> **Hard rules respected:** no code, no installs, no MCP setup, no lockfile deletes, no `package.json` edits, no README edits, no security fixes, no booking fixes. Plan-only.

## Table of Contents

1. Product Stabilization Plan
2. README Repair Plan
3. Package Manager / Lockfile Plan
4. Security Hardening Plan
5. Booking Correctness Plan
6. QA / CI Plan
7. Tooling Approval Plan
8. UIX0 / MOTION0 Plan
9. Admin Roadmap Plan
10. Observability / Monitoring Plan
11. Git / Repo Root Verification Plan
12. Sequencing Plan
13. Owner Decision Register
14. Acceptance Criteria

---

## 1. Product Stabilization Plan

### 1.1 Product identity (locked)

- **Name:** CodeOutfitters.
- **Legal entity:** CodeOutfitters LLC.
- **Domain:** `https://codeoutfitters.com`.
- **Contact:** `hello@codeoutfitters.com`.
- **What the app is:** a US small-business AI automation agency website (public marketing site) plus a single-operator internal admin tool for client intake and AI-assisted proposal generation. Not a prototype, not a visual demo, not a scaffold-only repo.
- **Repo type:** real working app, production-bound static site + single-operator internal admin tool. Next.js 16 with `output: 'export'`, deployed to Cloudflare Pages.
- **Operator:** Tayyab (single human operator).

### 1.2 Target user (locked)

- Primary audience: US small-business owners / operators who want to stop doing repetitive work and are willing to pay a per-project scoped fee for custom automation.
- Secondary audience: operations managers and team leads inside those small businesses.
- Internal operator: Tayyab.

### 1.3 Current product boundary

What exists today (verified in PRE8 §4 and `docs/FEATURES.md`):

- Public marketing site at 9 URLs plus 404, sitemap, robots.
- 4 working public forms: quote, contact, booking (3-step), newsletter. All POST to a shared n8n webhook.
- Custom booking calendar with Supabase read/write (read path is broken; write path from UI is not wired; see §5).
- ROI calculator.
- Sample portfolio (3 hardcoded cards, "Sample Project" tagged).
- Cookie consent and consent-gated Tawk live chat (optional).
- SEO surface (per-page metadata, sitemap, robots, JSON-LD `ProfessionalService`).
- Static-exported, Cloudflare-ready (`public/_redirects`, `public/_headers` with CSP).
- Password-gated admin tool with 5-section intake form and Anthropic-powered proposal generator.
- Localstorage-backed admin session and proposal draft.

What is intentionally not built (PRE8 §4, `docs/FEATURES.md`):

- No published prices, no blog/CMS, no client portal, no user accounts, no analytics, no multi-language, no dark-mode toggle, no payment processing.

### 1.4 What must be stabilized before any "non-internal" launch

The following workstreams must be done, in some order, before the site is considered ready for any audience beyond Tayyab and any future internal collaborators. They are the **launch gates**.

| Launch gate | Workstream | Risk(s) closed | See |
|---|---|---|---|
| LG-1 | `NEXT_PUBLIC_ANTHROPIC_API_KEY` removed from bundle (Worker proxy or equivalent) | R-002, R-004 | §4 |
| LG-2 | `NEXT_PUBLIC_ADMIN_PASSWORD` removed from bundle (real auth flow) | R-001, R-003, R-029 | §4 |
| LG-3 | Supabase RLS enabled; anon cannot read/write `bookings` / `available_slots` directly | R-006 | §4, §5 |
| LG-4 | Booking UI reads `available_slots` and the submission path is transactional | R-005 | §5 |
| LG-5 | Per-form webhook secret (or per-form URL) for n8n | R-017 | §4 |
| LG-6 | n8n delivery monitor + error tracking + uptime monitor in place | R-010 | §10 |
| LG-7 | README accurate (port 3005, real entry, env contract, security warning) | R-001 (doc) | §2 |
| LG-8 | Lockfile resolution (one manager, the other deleted) | R-002 (config) | §3 |
| LG-9 | CSP checklist (must be updated whenever a new external endpoint is added) | R-020 | §4 |
| LG-10 | Manual QA pass completed for the launch slice | R-008, R-009 (manual) | §6 |

### 1.5 What is out of scope for PM1 and for stabilization

Out of scope for stabilization (revisit only if scope is re-approved by the owner):

- New public-facing pages (require a written brief per `docs/ROADMAP.md`).
- New integrations (Slack, Stripe, HubSpot, etc.) without a plan-first phase.
- Paid tools (Clerk, WorkOS, Auth0, etc.) — D-009: free/open-source only by default.
- Impeccable / Emil Kowalski install — D-012, gated to UIX0 / MOTION0.
- Any animation library additions — D-011, gated to UIX0 / MOTION0.
- Copying / scraping / cloning `befluence.pro` or any other reference site — D-011, reference only.
- Multi-language, dark mode toggle, payment processing, blog / CMS, client portal — not in the MVP boundary.

### 1.6 Confirmation

PM1 confirms the product identity, target user, current boundary, launch gates, and out-of-scope list above. PM1 does not change the boundary. PM1 only plans how to enforce and improve it.

---

## 2. README Repair Plan

### 2.1 Status

- Current `README.md` is v0 boilerplate: title `v0-codeoutfitters-website-build`, port 3000 (wrong, should be 3005), points at `app/page.tsx` (wrong, real entry is `app/(public)/page.tsx`), offers `npm` / `yarn` / `pnpm` interchangeably, contains the v0 Kiro badge, and has no mention of the admin tool, the booking calendar, n8n, Supabase, Anthropic, or the security model.
- Source of truth for the repair: `repo-research/README_REPAIR_SPEC.md` (sections 1–10).

### 2.2 What PM1 will plan (not execute)

The README repair is **planned here, executed in a later cleanup phase** (R-0.2 in `docs/ROADMAP.md`). The repair must:

1. **Correct the title and one-paragraph description** (spec §2).
2. **Drop the v0 boilerplate** (spec §9).
3. **Correct the local port and entry file** (spec §3, §4): port 3005; entry `app/(public)/page.tsx`.
4. **Match the chosen package manager** (spec §3): see §3 of this plan. Default recommendation: `npm`.
5. **List the six env vars with required/optional** (spec §5).
6. **Add admin tool warning** (spec §7).
7. **Add security warning** (spec §8).
8. **Correct deployment summary** (spec §6): Cloudflare Pages, build output `out/`, Node 20.
9. **Drop the legacy `DEPLOY.md`** at the repo root (defer to cleanup phase; see §2.4 below).
10. **Link to foundation docs** (spec §9).
11. **Be ≤ ~150 lines of markdown** (spec §10).
12. **Not over-promise.**

### 2.3 Future README structure (spec §9)

The post-repair README should follow this section order (section names mandatory; order can be adjusted):

- Title + one-line tagline.
- "What this is" — one paragraph.
- "Local development" — three-step quick start.
- "Available scripts" — `dev`, `build`, `start`, `lint` with port 3005 and the ESLint config gap noted.
- "Environment" — six env vars, required/optional, link to `docs/ENVIRONMENT.md`.
- "Deployment" — three-line Cloudflare summary, link to `docs/DEPLOYMENT.md`.
- "Admin tool" — short paragraph, link to `docs/ARCHITECTURE.md`, security warning below.
- "Security" — two-paragraph warning, link to `docs/SECURITY.md`.
- "Documentation" — short list of links to `docs/`, `memory/`, `ai/`, `repo-research/`.
- "License / owner" — CodeOutfitters LLC, internal-first, not open-source.
- "Contributing" — out of scope, single operator.
- "Acknowledgments" — optional.

### 2.4 What happens to the legacy `DEPLOY.md`?

- It is superseded by `docs/DEPLOYMENT.md`.
- Keep it in place for now to avoid surprising existing readers.
- Delete in a future cleanup phase (after README repair, or together with it). Owner decision required: see Q-13 in `repo-research/OPEN_QUESTIONS.md`.

### 2.5 Acceptance criteria for the future README repair

Per `repo-research/README_REPAIR_SPEC.md` §10:

1. Title is `CodeOutfitters`; one-paragraph description is from spec §2.
2. Port is 3005.
3. Real entry file is `app/(public)/page.tsx`.
4. Package manager matches the lockfile decision (§3).
5. Six env vars listed, required/optional indicated.
6. Admin tool, security warning, Supabase schema mentioned.
7. Links to `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `docs/ENVIRONMENT.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`.
8. v0 Kiro badge and v0 "Built with v0" dropped or moved to Acknowledgments.
9. README reflects what the code actually does.
10. ≤ ~150 lines.

### 2.6 What PM1 does not do

- PM1 does not edit `README.md`.
- PM1 does not delete `DEPLOY.md`.
- PM1 only writes this plan and updates the required state files.

---

## 3. Package Manager / Lockfile Plan

### 3.1 Current state

- `package-lock.json` (npm lockfileVersion 3) — committed.
- `pnpm-lock.yaml` (pnpm v9 format) — committed.
- `package.json` has no `packageManager` field.
- `package.json` scripts use `next`, `eslint`, etc. — manager-agnostic syntax.
- `docs/SETUP.md` already recommends `npm` until the owner decides.
- `docs/DEPLOYMENT.md` uses `npm run build`.
- `README.md` offers all three (npm / yarn / pnpm) without preferring one.

### 3.2 Why dual lockfiles are a risk (spec `repo-research/LOCKFILE_DECISION_BRIEF.md` §2)

- Install-time drift if a contributor uses the wrong manager.
- CI confusion (no `.npmrc` / `.pnpmrc` / `packageManager` to assert which is canonical).
- Repo bloat (two lockfiles double the diff surface for dependency changes).
- Review noise (an update to one lockfile is ambiguous).
- Future tool compatibility (some tools assume exactly one format).

### 3.3 npm vs pnpm — pros / cons

| Dimension | npm | pnpm |
|---|---|---|
| Most common format | yes | smaller pool |
| Matches `package.json` scripts | yes | yes |
| Cloudflare Pages default `npm run build` | yes | needs `pnpm run build` |
| `docs/DEPLOYMENT.md` already assumes | yes | needs update |
| Resolver strictness | lower | higher |
| Hoisting rules | npm default | stricter (no phantom deps) |
| CI install speed | baseline | faster |
| Migration cost (drop the other) | delete `pnpm-lock.yaml` | delete `package-lock.json`, add `packageManager` field |
| Contributor friction | lowest | slightly higher |

### 3.4 Recommendation

**Recommended canonical package manager: `npm`.** Rationale:

- `package-lock.json` is present and current.
- `package.json` scripts and `docs/DEPLOYMENT.md` already assume `npm`.
- `docs/SETUP.md` already recommends `npm` until the owner decides.
- Lowest contributor friction.
- No `package.json` change required.
- Cloudflare Pages default `npm run build` works unchanged.

This is a recommendation, not a decision. The owner must confirm. If the owner prefers pnpm, the symmetric plan applies (see `repo-research/LOCKFILE_DECISION_BRIEF.md` §4).

### 3.5 What to do with the other lockfile later

The dropped lockfile is deleted in a dedicated cleanup phase (gated). The plan:

1. **Pre-flight.** `git status` clean (see §11 for the git status concern). Branch off main. Open a PR titled "chore: drop `pnpm-lock.yaml`, keep `npm` as canonical" (or the symmetric pnpm-chosen title).
2. **Delete.** `git rm pnpm-lock.yaml`.
3. **Verify.** `npm install` to ensure `package-lock.json` reflects current `package.json`. Commit any incidental changes.
4. **Update docs.** `docs/SETUP.md`, `docs/DEPLOYMENT.md`, and the future repaired `README.md`.
5. **Update `.gitignore`.** Add `pnpm-lock.yaml` so it does not sneak back in. This is a config change — gated per `repo-research/AGENT_BOUNDARY_MAP.md`.
6. **Add CI guard** (in a tooling-approved phase): a CI step that fails the build if `pnpm-lock.yaml` reappears.
7. **Deploy** via the normal Cloudflare Pages flow.

If pnpm is chosen instead: delete `package-lock.json`, add `"packageManager": "pnpm@<version>"` to `package.json`, regenerate, update docs, add `package-lock.json` to `.gitignore`, add the CI guard.

### 3.6 Validation steps (post-migration)

- `npm run dev` (or `pnpm run dev`) starts the dev server on port 3005.
- `npm run build` (or `pnpm run build`) produces a clean `out/` directory with no errors.
- `npm run lint` (or `pnpm run lint`) runs (with the ESLint config gap noted; R-026).
- A fresh clone installs with the chosen manager without errors.
- The Cloudflare Pages build with the chosen command succeeds end-to-end.
- The dual-lockfile re-entry guard (CI) is in place.

### 3.7 Acceptance criteria for the future lockfile-cleanup phase

1. Exactly one lockfile present at the repo root.
2. The chosen manager's install command is documented in `README.md`, `docs/SETUP.md`, `docs/DEPLOYMENT.md`.
3. The dropped lockfile is listed in `.gitignore` (config change, gated).
4. CI asserts the dropped lockfile is absent.
5. Cloudflare Pages is configured to use the chosen manager's build command.
6. `repo-research/RISK_REGISTER.md` R-002 is moved to "Closed" with a date.

### 3.8 What PM1 does not do

- PM1 does not delete either lockfile.
- PM1 does not edit `package.json`.
- PM1 does not add a CI guard.
- PM1 does not touch `.gitignore`.

---

## 4. Security Hardening Plan

### 4.1 Current security posture

- **Deployment model:** Next.js 16 with `output: 'export'`. Build artifact `out/`, deployed to Cloudflare Pages.
- **Trust boundary:** every `NEXT_PUBLIC_*` env var is inlined into the static JS bundle at build time. No server runtime, no middleware, no API routes, no edge functions, no server actions in the repo.
- **Auth model:** none. Admin is gated by a client-side `localStorage` flag compared to a `NEXT_PUBLIC_*` env var.
- **Persistence:** n8n (forms), Supabase `bookings` + `available_slots` (booking), `localStorage` (admin intake + proposal).
- **Outbound calls:** Supabase REST, Anthropic `api.anthropic.com`, n8n webhook, Tawk (optional). `public/_headers` enforces a tight CSP at the production edge.

### 4.2 Risks in scope (from `repo-research/RISK_REGISTER.md` and `docs/SECURITY.md`)

| Risk ID | Summary | Severity × Likelihood | Stage |
|---|---|---|---|
| R-001 / R-003 | `NEXT_PUBLIC_ADMIN_PASSWORD` in bundle; client-side `localStorage` compare; not a real auth boundary | 4 × 5 | MVP |
| R-002 / R-004 | `NEXT_PUBLIC_ANTHROPIC_API_KEY` in bundle; direct browser call | 5 × 5 | MVP |
| R-006 | Supabase RLS not enabled; anon has full read/write on both tables | 4 × 5 | MVP |
| R-016 | Static export limitations; no server functions, all secrets in bundle | 3 × 5 | Architecture |
| R-017 | n8n single-webhook contract risk; payload-shape discrimination only; no signing | 3 × 4 | MVP |
| R-018 | Admin `localStorage` persistence; shared browser = shared data; data lost on browser reset | 3 × 4 | Later (post-auth) |
| R-020 | CSP must be updated when new endpoints are added | 2 × 4 | Continuous |
| R-029 | `localStorage.co_admin_auth` holds the password itself; not a hash, not a token | 3 × 5 | MVP (rolled into R-003) |

### 4.3 Recommended future architecture options (from `repo-research/SECURITY_HARDENING_BRIEF.md` §3)

| Option | What | Cost | Pros | Cons |
|---|---|---|---|---|
| A | Keep static export, accept risks, admin internal-only | $0 | zero change | R-001..R-004 remain; R-002 is a billing risk if anyone finds the bundle |
| B | Cloudflare Worker proxy for Anthropic + admin protection | $0 (CF free tier) | minimal change; key off the bundle; auth at edge | needs a Worker; custom auth still needed |
| C | Drop static export; use a Next.js server route | new host bill | standard Next.js model | bigger infra change; loses cheapest hosting |
| D | Supabase Auth / magic link for admin | $0 (free tier) | no custom auth code; battle-tested; pairs with B for the Anthropic call | adds Supabase dependency for auth |
| E | External paid auth (Clerk, WorkOS, Auth0) | paid | no auth code to write | D-009: paid tools not approved by default; vendor lock-in |

### 4.4 Recommended staged approach

**Recommendation: B + D combined, in that order, with E off the table and C only if a future phase requires it.**

#### Stage 1 — Worker proxy for Anthropic (Option B, slice 1)

- Stand up a Cloudflare Worker.
- The admin UI calls the Worker (not `api.anthropic.com` directly).
- The Worker holds the Anthropic key as a server-side secret.
- The Worker streams or returns the response to the browser.
- Removes R-002 / R-004.
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` is removed from the build output.
- Cost: Cloudflare Workers free tier.

Acceptance: `NEXT_PUBLIC_ANTHROPIC_API_KEY` is not present in `out/`. Worker can be reached by the deployed admin UI. Anthropic key is not in any client-reachable file.

#### Stage 2 — Supabase Auth / magic link for admin (Option D)

- Add Supabase Auth.
- Replace the `localStorage` password gate with a Supabase magic-link sign-in at `/admin`.
- The admin layout reads the Supabase session.
- Removes R-001 / R-003 / R-029.
- `NEXT_PUBLIC_ADMIN_PASSWORD` is removed from the build output.
- Cost: Supabase free tier.

Acceptance: `/admin` cannot be reached without a valid Supabase session. The static bundle does not contain `NEXT_PUBLIC_ADMIN_PASSWORD`. `localStorage.co_admin_auth` is not consulted.

#### Stage 3 — Supabase RLS

- Enable RLS on `bookings` and `available_slots`.
- `anon` role gets `USING (false)` for both.
- Inserts go through a controlled path: an RPC the anon role can call with strict validation, **or** a server endpoint (the same Worker from Stage 1) that holds a service-role key.
- Removes R-006.

Acceptance: anon cannot read or write `bookings` / `available_slots` directly from the browser. A controlled insert path exists. A post-deploy smoke test verifies the deny.

#### Stage 4 — Booking correctness (cross-link §5)

- UI reads `available_slots`.
- Transactional reservation path (RPC + Worker or RPC + anon with validation).
- Removes R-005.

Acceptance: see §5.7.

#### Stage 5 — n8n signing / per-form secrets

- Generate a per-form secret.
- Each form POSTs with a header containing the secret.
- n8n verifies.
- Removes R-017.

Acceptance: an unsigned request to the n8n webhook is rejected or dropped. n8n workflow has a verification node.

#### Stage 6 — CSP / endpoint-change guardrail

- Add a CI guard (in a tooling-approved phase) that fails the build if `public/_headers` does not include every external endpoint the app calls.
- Removes R-020.

Acceptance: a CI run that adds a new external endpoint without updating CSP fails.

#### Stage 7 — Admin persistence improvement (optional, after Stage 2)

- If the owner wants to keep history beyond the current browser: persist proposals to Supabase and list them on `/admin`.
- Removes R-018 (only partially — `localStorage` may still be used as a write-through cache).
- See §9 for the admin roadmap.

#### Stage 8 — Observability (cross-link §10)

- Error tracking, webhook delivery monitor, uptime monitor.
- Removes R-010.

### 4.5 What PM1 does not do

- PM1 does not implement any stage above.
- PM1 does not run any `npx` or package install.
- PM1 does not configure any MCP server.
- PM1 does not touch `lib/proposal-generator.ts`, `app/admin/layout.tsx`, `lib/booking-schema.sql`, or `public/_headers`.

### 4.6 Acceptance criteria for the future security phase

1. `NEXT_PUBLIC_ANTHROPIC_API_KEY` is not in the static bundle.
2. `NEXT_PUBLIC_ADMIN_PASSWORD` is not in the static bundle.
3. `/admin` is protected by Supabase Auth (or whatever the owner-confirmed path is).
4. RLS is enabled; anon cannot read or write `bookings` / `available_slots` directly.
5. Booking correctness is in place (cross-link §5).
6. n8n webhook is signed or per-form.
7. CI guard for CSP endpoint drift is in place.
8. `docs/SECURITY.md` is updated to reflect the new posture. Closed risks move to "Closed" in `repo-research/RISK_REGISTER.md`.
9. A post-deploy smoke test verifies the new auth path, the Worker proxy, and the RLS-denied anon read.

---

## 5. Booking Correctness Plan

### 5.1 Current state (the actual gap, larger than first described)

- `app/(public)/book/page.tsx` renders a 3-step wizard via `components/booking-calendar-custom.tsx`.
- **Step 1 — date picker.** `isAvailable(day)` returns `true` for any future weekday. It does **not** call `getAvailableSlots` and does **not** read `available_slots.is_booked`.
- **Step 2 — time picker.** 14 hard-coded `TIME_SLOTS` (9:00 AM – 4:30 PM, 30 min, Mon–Fri). No time is marked unavailable based on `available_slots`.
- **Step 3 — details.** Validates client-side. Includes a honeypot.
- **Submit.** POSTs to `NEXT_PUBLIC_N8N_WEBHOOK_URL` with `type: "booking"`. The Supabase write is **not** triggered by this component.
- **The Supabase write path (`createBooking` in `lib/booking-actions.ts`) is wired but unused.** A future agent should re-verify this finding before implementing any fix; the original DOC-DISCOVERY finding assumed the UI called `createBooking`; on closer read it does not.

### 5.2 Why this matters more than just "double-book"

- The double-book risk is real, but in the **current** code, the UI does not write to Supabase at all. The data goes only to n8n. The Supabase tables are populated by whoever runs the SQL seed, not by user submissions.
- So the "double-book" risk is partly masked by a bigger gap: **booking submissions are not persisted to Supabase from the UI today.** Fixing the double-book risk therefore also requires wiring the UI to `createBooking` (or to a successor), not just adding a UI-level read of `available_slots`.

### 5.3 Risks in scope

| Risk ID | Summary | Severity × Likelihood |
|---|---|---|
| R-005 | UI does not read `available_slots.is_booked`; double-book possible (when write path is wired) | 4 × 4 |
| R-006 | Supabase RLS not enabled | 4 × 5 |
| R-007 | 12-week seed from 2026-05-18 will exhaust around 2026-08-10 | 3 × 5 |
| R-031 | Hard-coded seed start in `lib/booking-schema.sql` | 3 × 5 |

### 5.4 Fix options (from `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §7)

| Option | What | Pros | Cons |
|---|---|---|---|
| A | Client reads `available_slots` and visually blocks booked slots | smallest change; honest UI | no transactional guarantee; two tabs can race |
| B | Supabase RPC reserves slot transactionally (`reserve_slot(p_date, p_time, p_booking)`) | atomic; honest data integrity | needs SQL + RPC + RLS-aware grants |
| C | n8n handles booking validation; UI waits for n8n's response | keeps anon key out of booking path; reuses existing infra | extra hop; couples n8n to DB; UI must wait |
| D | Server / Worker holds service-role Supabase key and does the reservation | cleanest; anon key never touches `bookings`; Worker can sign events to n8n | needs a Worker (paired with §4 Stage 1) |
| E | Manual review only | zero code change | does not scale; defeats self-service |

### 5.5 Recommended MVP fix

**Recommendation: A + C combined, in priority order.**

- **A first.** `components/booking-calendar-custom.tsx` calls `getAvailableSlots` for the displayed month. Days with no remaining slots are visually disabled. Times with `is_booked = true` are removed from the picker. This is the smallest change that gives the operator an honest UI.
- **Then wire the write path to `createBooking` (or to a successor in Stage B).** The booking submission must persist to `bookings` and update `available_slots.is_booked`. The UI must wait for the result and reflect success / failure. The current "instant success" UI is not honest.
- **C as the eventual write path if the Worker is in place.** n8n talks to Supabase with a service-role key (or, preferred, the Worker talks to Supabase). This removes the anon-key write path and gets us a step closer to the future robust fix.

This is a recommendation, not a decision. The owner must confirm.

### 5.6 Recommended future robust fix

**Recommendation: B + D combined.**

- **B.** Define a transactional `reserve_slot` Postgres RPC. In one transaction: check `is_booked = false`, insert into `bookings`, update `available_slots`. Add a `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` as a defense-in-depth.
- **D.** Put the call behind the Cloudflare Worker (from §4 Stage 1). The Worker holds a service-role key. The UI calls the Worker, which calls the RPC. The Worker can notify n8n via a signed event for downstream workflows.
- This removes the anon-key write path, prevents double-booking at the database level, and keeps the operator's Supabase service key off the static bundle.

### 5.7 Acceptance criteria for the booking-correctness phase

1. The booking UI calls `getAvailableSlots` for the displayed month and visually disables unavailable dates and times.
2. The booking submission persists to `bookings` and updates `available_slots.is_booked` through a single transactional path.
3. Two concurrent submissions for the same slot cannot both succeed.
4. The Supabase anon key cannot write to `bookings` or `available_slots` directly.
5. The booking flow degrades gracefully when Supabase is unreachable (the UI shows an error and tells the user to email).
6. `components/booking-calendar-custom.tsx` and `lib/booking-actions.ts` are updated and the changes are reflected in `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, and `repo-research/RISK_REGISTER.md`.
7. A manual test confirms: two simulated rapid submissions for the same slot result in exactly one `bookings` row and one `is_booked = true`.
8. The seed lifecycle is solved (re-seed script or scheduled function), removing R-007 / R-031.

### 5.8 What PM1 does not do

- PM1 does not modify any booking code.
- PM1 does not modify `lib/booking-schema.sql`.
- PM1 does not wire the UI to `createBooking`.
- PM1 does not deploy a Worker.
- PM1 only writes this plan and updates the required state files.

### 5.9 Cross-link to security

The booking-correctness MVP fix (A + C) depends on the Worker from §4 Stage 1 only if the owner chooses the Worker-mediated path. If the owner chooses to keep the anon-key write path with strict input validation, the booking fix can ship ahead of the Worker. If the owner prefers the RPC-with-anon-grants path, the booking fix depends on the RLS plan (Stage 3) more than on the Worker. PM1 recommends sequencing the Worker (Stage 1) first, because the booking fix and the booking-validate path both benefit from it.

---

## 6. QA / CI Plan

### 6.1 Current QA state

- No tests in the repo. No `*.test.*` or `*.spec.*` files. `@playwright/test` is transitive in both lockfiles, not a direct dep.
- No CI. No `.github/`, no `.gitlab-ci.yml`, no other CI config.
- No `typecheck` script. `tsc` has been run locally (the `tsconfig.tsbuildinfo` artifact is committed) but there is no `npm run typecheck` script.
- `npm run lint` exists, but no ESLint config file is in the repo (R-026).
- `docs/QA_CHECKLIST.md` is a thorough manual checklist.
- No visual regression.
- No monitoring.
- No reduced-motion coverage today (AOS does not opt out; GSAP hooks do, but coverage is partial).

### 6.2 Manual QA required now (no tooling needed)

The full manual checklist is in `docs/QA_CHECKLIST.md`. The minimum bar for any release:

- Home page renders.
- `/pricing`, `/contact`, `/book` all load and submit (or surface the email fallback when the webhook is unreachable).
- `/admin` gate works for the intended single operator.
- Reduced-motion variant does not break the layout.
- No console errors on any public page.
- Mobile responsive at 375 / 768 / 1024 / 1440.
- Cloudflare CSP is in effect on the deployed site (check response headers).
- `robots.txt` disallows `/admin`.

### 6.3 Future automated QA candidates (from `repo-research/QA_STRATEGY_BRIEF.md` §3)

| Candidate | Purpose | Cost | Gate required | Notes |
|---|---|---|---|---|
| `tsc --noEmit` as a CI step | Type errors fail the build | $0 | none | Add a `typecheck` script |
| `npm run lint` with a real ESLint config | Lint errors fail the build | $0 | none | First add a config (R-026) |
| Playwright MCP smoke flows | Reproduce the manual checklist in a browser | $0 | TS0 / RDG0 | MCP form, not local install |
| Playwright as a real test runner | `npx playwright test` in CI | $0 | TS0 / RDG0 | Better for CI than MCP-only |
| Chrome DevTools MCP | Performance, console, network introspection | $0 | TS0 / RDG0 | Pairs with Playwright |
| Lighthouse CI | LCP, CLS, INP, TBT budgets | $0 | none | Add to CI in a tooling-approved phase |
| Visual regression (Playwright screenshots) | Detect pixel-level changes | $0 | TS0 / RDG0 | Same approval as Playwright MCP |
| Form contract tests | Verify n8n payload shape per form | $0 | none | Unit test, no browser needed |
| Booking flow tests | Verify slot reservation correctness | $0 | none | Needs the booking fix first |
| Admin proposal flow tests | Mock Anthropic, verify 11 sections | $0 | none | Needs a test-friendly proposal module |
| Accessibility (axe-core) | WCAG 2.1 AA scan | $0 | none | Can run via Playwright |
| Mobile / responsive | Device emulation in Playwright | $0 | TS0 / RDG0 | Same approval |
| Bundle size guard | Fails the build if JS / CSS grows past budget | $0 | none | Add `size-limit` or similar |

### 6.4 Recommended QA sequencing

#### Slice 0 — config-only, no new tooling

This slice requires no TS0 / RDG0 approval.

1. Add a `typecheck` script to `package.json` (`tsc --noEmit`). Zero new deps.
2. Add a minimal `eslint.config.mjs` (flat config) that extends `next/core-web-vitals`. Zero new deps beyond what `next` already provides.
3. Add a CI workflow (`.github/workflows/ci.yml`) that runs `npm run typecheck` and `npm run lint` on every PR. Catches regressions before merge.

This slice closes R-008 (partially) and R-009.

#### Slice 1 — Playwright (real test runner, not MCP)

Gated on TS0 / RDG0 approval.

1. Install Playwright as a real test runner in `devDependencies`.
2. Add `tests/smoke.spec.ts` that covers: home, services, pricing, contact, book (each step), admin gate, admin onboarding (each section), admin proposal (mocked).
3. CI runs the smoke spec on every PR and on every deploy.

This slice closes the rest of R-008.

#### Slice 2 — Chrome DevTools MCP + Playwright MCP for visual + perf

Gated on TS0 / RDG0 approval.

1. Add Lighthouse CI for LCP, CLS, INP, TBT budgets.
2. Add Playwright visual regression (screenshots at 375 / 768 / 1024 / 1440) with a 1% pixel-delta gate.
3. Add Chrome DevTools MCP integration for the visual review loop (see §8.6).

#### Slice 3 — Form / booking / admin / a11y tests

Gated on the respective feature work.

1. Form contract tests: n8n payload shape per form (no browser needed).
2. Booking flow tests: simulate concurrent submissions; assert exactly one `bookings` row.
3. Admin proposal flow tests: mock Anthropic; assert 11 sections render.
4. Accessibility scan with axe-core via Playwright.
5. Bundle size guard (size-limit or similar).

### 6.5 QA gates for each feature phase

Each future feature phase must pass the following before being marked "shipped":

- `npm run typecheck` passes.
- `npm run lint` passes.
- Manual QA checklist item(s) for the feature pass.
- If browser tooling is approved: Playwright smoke for the feature passes.
- Reduced-motion variant does not break the feature.
- Mobile (375 / 768) does not break the feature.
- No console errors on any public page affected.
- Accessibility scan (if added) does not regress.
- Bundle size does not exceed the agreed budget (if added).

### 6.6 Reduced-motion and accessibility checks (always-on)

- All non-essential motion must opt out when `prefers-reduced-motion: reduce` is set. AOS, GSAP, Framer Motion all need explicit opt-out paths (R-015).
- Focus state must be visible at all times.
- Keyboard navigation must not be broken by enter/exit animations.
- `aria-live` regions unaffected by motion.
- Color contrast unaffected by motion.

### 6.7 Mobile checks (always-on)

- 375 / 768 / 1024 / 1440.
- Tap targets ≥ 44px.
- No horizontal scroll.
- Calendar fits.
- Footer columns stack on mobile.

### 6.8 Booking flow checks (always-on, and a launch-gate check)

- Date picker respects `available_slots.is_booked`.
- Submission is transactional.
- Concurrent submissions cannot both succeed.
- Graceful degradation when Supabase is unreachable.
- See §5.7 for the full booking acceptance.

### 6.9 Form webhook checks (always-on)

- Quote: `source: "quote_request"` in payload.
- Contact: payload includes the contact fields; optionally add `source: "contact"` (Q-14).
- Booking: `type: "booking"` in payload.
- Newsletter: `source: "newsletter"` in payload.
- Honeypot silently succeeds when filled.

### 6.10 Admin proposal checks (always-on)

- 11 sections render.
- "Regenerate" replaces the proposal.
- "Copy All", "Print / PDF", "Send to Client" actions work.
- Internal notes panel hidden when printing.

### 6.11 What PM1 does not do

- PM1 does not add `typecheck` to `package.json`.
- PM1 does not add an ESLint config.
- PM1 does not add a CI workflow.
- PM1 does not install Playwright.
- PM1 does not write any test file.

---

## 7. Tooling Approval Plan

### 7.1 Scope

PM1 plans the future TS0 / RDG0 submission for the developer / AI tooling the owner has asked about. PM1 does not submit; the owner must approve each step.

### 7.2 Tool-by-tool plan

For each tool: purpose, dev or runtime, install needed, gate, risk, install order.

#### 1. Repomix

- **Purpose:** pack the repo into a single LLM-friendly bundle. Helps every other step.
- **Dev or runtime:** dev only.
- **Install needed:** yes (`npx` once or a global install; both options exist).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Pure dev surface. May transmit repo contents off-machine if used in cloud mode — prefer local mode.
- **Install order:** 1 (first).

#### 2. Graphify

- **Purpose:** turn any input (code, docs, papers, images) into a knowledge graph with god nodes, community detection, and query tools.
- **Dev or runtime:** dev only.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Pure dev surface.
- **Install order:** 2.

#### 3. Context7 MCP

- **Purpose:** up-to-date library / framework docs lookup; avoids hallucinated framework APIs.
- **Dev or runtime:** dev only.
- **Install needed:** yes (MCP server).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Read-only.
- **Install order:** 3.

#### 4. Playwright MCP

- **Purpose:** drive a real browser from the agent for visual / smoke / motion QA. Clicks, screenshots, accessibility tree, network log.
- **Dev or runtime:** dev only.
- **Install needed:** yes (MCP server). May pull Playwright browser binaries on first use.
- **Gate:** TS0 / RDG0.
- **Risk:** low for read-only smoke. Mutating when used for dogfooding — gate the use.
- **Install order:** 4.

#### 5. Chrome DevTools MCP

- **Purpose:** lower-level browser introspection. Performance, console, DOM, network.
- **Dev or runtime:** dev only.
- **Install needed:** yes (MCP server).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Read-only by default.
- **Install order:** 5.

#### 6. Impeccable

- **Purpose:** frontend design review. Avoids generic AI UI.
- **Dev or runtime:** dev / skill.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Skill is a prompt and checklist.
- **Install order:** 6.

#### 7. Emil Kowalski / Agents with Taste

- **Purpose:** motion / animation taste reference. Keeps motion purposeful.
- **Dev or runtime:** dev / skill.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Skill is a prompt and checklist.
- **Install order:** 7.

#### 8. Tree-sitter

- **Purpose:** structural code parsing.
- **Dev or runtime:** dev only.
- **Install needed:** yes (per project).
- **Gate:** TS0 / RDG0.
- **Risk:** low. Pure dev surface.
- **Install order:** 8 (only if a future phase needs it; nice-to-have).

#### 9. codebase-memory MCP

- **Purpose:** persistent memory of the codebase across sessions.
- **Dev or runtime:** dev only.
- **Install needed:** yes (MCP server).
- **Gate:** TS0 / RDG0.
- **Risk:** low-medium. The "memory of record" for the agent. Must be careful not to write secrets.
- **Install order:** 9 (only if a future phase needs it; nice-to-have).

### 7.3 Free / open-source first rule (D-009)

- All nine are free or open-source today.
- If any becomes paid: do not upgrade; find a free alternative.
- If a paid tool is the only viable option: surface cost to the owner before installing.

### 7.4 What must not happen in any pre-approval phase

- No `npm install` / `pnpm install` / `yarn install` for any of these.
- No `npx` of any kind.
- No `npx skills add`.
- No `npx impeccable install`.
- No MCP server configuration in any file.
- No `package.json` `devDependencies` change for these tools.
- No adding browser binaries (Playwright install) until the MCP server is approved.
- No scraping / cloning / copying of `befluence.pro` or any reference site.

### 7.5 TS0 / RDG0 submission questions (per `repo-research/TOOLING_APPROVAL_BRIEF.md` §6)

For each tool the owner approves, the future TS0 / RDG0 request will answer:

- Tool, version, scope (global vs per-project).
- Use case with a concrete scenario in this repo.
- Cost (must be $0 today).
- New entry points created (config files, scripts, env vars).
- Rollback path.
- Whether it touches the deployed app (default: no).
- Whether it writes to disk outside the project (default: no).
- Whether it transmits repo contents off-machine (Repomix and codebase-memory MCP can; document destination and trust model).

### 7.6 Acceptance criteria for the future tooling-setup phase

1. Each tool the owner approved is installed in a separate, small PR.
2. Each PR updates `package.json` `devDependencies` (or the equivalent MCP / skill config) with a pinned version.
3. Each PR adds a smoke test or a documented manual verification step.
4. Each PR updates `INTEGRATION_NOTES.md` (if integration), `ai/AI_CONTEXT_RULES.md` (if behavior change), and the relevant `docs/`.
5. No production config file (`public/_headers`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, lockfiles) is changed for the sake of the tool unless strictly required and documented.
6. Free / open-source-first rule is preserved.

### 7.7 What PM1 does not do

- PM1 does not install any tool.
- PM1 does not submit TS0 / RDG0.
- PM1 does not configure any MCP server.
- PM1 does not edit `package.json`.

---

## 8. UIX0 / MOTION0 Plan

### 8.1 Carry-forward

- Owner direction is captured in D-011 (premium motion) and D-012 (design taste skills) in `memory/IMPORTANT_DECISIONS.md`.
- Implementation belongs in a future **UIX0 / MOTION0** phase.
- Brief is in `repo-research/UIX0_MOTION0_BRIEF.md`.
- Hard rules: no `npx skills add`, no `npx impeccable install`, no MCP setup, no animation-library adds, no `package.json` edits, no code in the current batch.
- BeFluence is reference only. Do not copy. Do not scrape. Do not clone assets.

### 8.2 Desired feel

- Premium AI automation agency. Modern, bold, high-energy.
- Smooth scroll-driven storytelling.
- More animated than a typical SaaS site, but not childish.
- Professional enough for US small-business clients.
- Cool enough to feel like a high-end AI agency.
- Animations have purpose. No decorative-only motion. No random parallax. No "showy" easing curves that delay the user.

### 8.3 Animation inventory candidate list

Public site (carried forward from D-011):

- Hero entrance animation
- Animated headline reveal
- Scroll-triggered section reveals
- Smooth parallax layers
- Floating cards
- Animated service cards
- Horizontal marquee / moving logo strips (partially in place via `components/tools-strip.tsx`)
- Animated statistics counters
- Interactive hover / magnetic buttons
- Smooth page transitions (partially in place via `components/page-transition.tsx`)
- Portfolio cards with motion depth
- Process timeline animation
- ROI calculator micro-interactions
- Contact / booking form transitions

Admin:

- Lighter and faster than the public site.
- No parallax, no floating cards, no marquees.
- Page transitions ≤ 200ms.
- Form sections do not have entrance animations that delay the user.

### 8.4 Existing animation stack (verified)

- GSAP 3.15
- ScrollTrigger (from `gsap/ScrollTrigger`)
- `@gsap/react` 2.1
- Framer Motion 12
- AOS 2.3
- Lenis 1.3 (smooth scroll)
- Tailwind v4 transitions (used implicitly via classes)

**Refactor candidates:**

- Three GSAP entry points (`lib/gsap.ts`, `lib/animations/gsap-setup.ts`, `lib/animations/gsap-config.ts`).
- Two `useScrollReveal` hooks (`hooks/useScrollReveal.ts`, `lib/animations/useScrollReveal.ts`).

### 8.5 First motion slice recommendation

**Recommendation: a small, deliberate slice that proves the model without ballooning.**

First slice (ships together in one PR):

1. **Hero entrance + animated headline reveal.** Single component, owned by the home page. GSAP for the timeline, or AOS if AOS is the chosen primary for that section.
2. **Scroll-triggered section reveals.** One canonical hook. Replaces `useScrollReveal` duplicates. Respects `prefers-reduced-motion`.
3. **ROI calculator micro-interactions.** Sliders already work; add value-update animation and a subtle "settle" on stop.
4. **Reduced-motion coverage.** AOS opt-out, GSAP opt-out, Framer Motion opt-out. The site must pass the media-query test.

Defer to a later slice (each is a separate PR):

- Smooth parallax layers (mobile performance risk; needs a separate benchmark).
- Magnetic buttons (small but additive; better as part of the design-taste pass).
- Portfolio cards with motion depth (refactor of `components/portfolio.tsx`).
- Process timeline animation (refactor of `components/process.tsx`).
- Contact / booking form transitions (refactor of multiple forms).
- Marquee polish (already exists; needs design pass).
- Animated statistics counters (separate micro-PR).
- Admin motion discipline (cross-link §9; lighter than the public site).

This is a recommendation, not a decision. The owner must confirm the slice and the budget.

### 8.6 Browser visual QA loop (gated, post-tooling)

After tooling approval, the desired loop is:

1. AI generates motion / UI change.
2. AI opens the page in browser using Playwright MCP and / or Chrome DevTools MCP.
3. AI visually critiques the result using Impeccable + Emil Kowalski rules.
4. AI improves weak sections.
5. AI repeats until the page feels premium and polished.

In parallel:

- Lighthouse mobile audit (LCP, CLS, INP, TBT).
- Real-device test on at least one mid-tier Android.
- Reduced-motion variant capture (AOS, GSAP, Framer Motion opt-outs visible).

### 8.7 Performance budget proposal (recommendation; owner-confirmed)

- **LCP:** unchanged or improved after motion is added. Hero must not be slowed by its own entrance.
- **CLS:** 0. No layout-shifting animations. Use transform / opacity only.
- **INP:** stays in the "good" range on a Moto G Power class device.
- **JS bundle:** +0 KB net from new libraries. The first slice reuses existing libraries.
- **CSS:** no new CSS framework. Use Tailwind transitions where applicable.
- **Network:** no new external assets. The first slice does not load new fonts, scripts, or images.
- **Verification:** Lighthouse mobile audit before and after, in the Playwright MCP + Chrome DevTools MCP loop.

### 8.8 Mobile performance rules

- Test on Moto G Power class devices.
- Smooth scroll is gated to non-reduced-motion and a "good CPU" profile.
- Parallax layers may need to be disabled on low-end mobile.
- AOS `disable` flag for low-end mobile (heuristic: `navigator.deviceMemory < 4`).
- `prefers-reduced-motion: reduce` is honored at all times.

### 8.9 Accessibility / `prefers-reduced-motion` requirement (hard)

- All non-essential motion must opt out when `prefers-reduced-motion: reduce` is set.
- Focus state must be visible at all times, even during transitions.
- Keyboard navigation must not be broken by enter/exit animations.
- Animations must not delay interaction. Hero entrance can be 600-1000ms, but must not block scroll or click.
- `aria-live` regions are unaffected by motion.
- Color contrast is unaffected by motion.
- `motion` + `vestibular` accessibility is a hard requirement.

### 8.10 "Not generic AI SaaS" taste rubric (from D-012)

**Avoid:**

- Generic purple/blue SaaS gradients.
- Same-looking rounded cards everywhere.
- Weak typography hierarchy.
- Random icons above every heading.
- Unmotivated animations.
- Slow heavy motion that damages usability.
- Overdone effects that feel childish.

**Prefer:**

- Premium AI automation agency feel.
- Strong typography.
- Clear hierarchy.
- Confident spacing.
- Smooth purposeful animation.
- Fast interaction feedback.
- Scroll-based storytelling.
- Professional US small-business trust.
- Beautiful but operational UI.

The brand palette is emerald `#2A6B5A`, gold `#C8A96E`, off-white `#FAFAF7`, sand `#F5F0EB`. These are the brand tokens, not a free-for-all.

### 8.11 Admin motion discipline (cross-link §9)

- Admin motion is **lighter and faster** than the public site. Page transitions ≤ 200ms.
- No parallax, no floating cards, no marquees.
- Form sections do not have entrance animations that delay the user.
- The "Recent Proposals" tile (when built) uses a simple fade-in, not a parallax reveal.

### 8.12 BeFluence reference-only confirmation

- Yes. `befluence.pro` is motion/interaction inspiration only. Do not copy assets. Do not scrape. Do not clone.
- D-011 already states this. PM1 reaffirms it.

### 8.13 Acceptance criteria for the future UIX0 / MOTION0 first-slice phase

1. The hero entrance, animated headline, scroll-triggered section reveals, ROI micro-interactions, and reduced-motion coverage ship together in one PR.
2. LCP, CLS, and INP are within the agreed budget on a real device.
3. The site passes `prefers-reduced-motion: reduce` testing in Chrome DevTools.
4. Impeccable + Emil Kowalski review has been run, and the team can point to specific before / after.
5. The duplicate GSAP and `useScrollReveal` paths are removed (or at least the unused ones are).
6. A `repo-research/MOTION_QA_LOG.md` captures the Lighthouse + reduced-motion + taste review.
7. `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/QA_CHECKLIST.md`, and `repo-research/RISK_REGISTER.md` are updated to reflect what shipped.

### 8.14 What PM1 does not do

- PM1 does not implement any animation.
- PM1 does not add any animation library.
- PM1 does not install Impeccable or Emil Kowalski.
- PM1 does not install Playwright MCP or Chrome DevTools MCP.
- PM1 does not edit `package.json`.

---

## 9. Admin Roadmap Plan

### 9.1 Current admin surface

- `/admin` — password-gated dashboard. Two tiles: "New Client Intake" (active) and "Recent Proposals" (coming soon).
- `/admin/onboarding` — 5-section intake form, saves to `localStorage.co_onboarding_data`.
- `/admin/proposal` — reads the intake, calls Anthropic, renders 11 sections. Last proposal saved to `localStorage.co_last_proposal`.
- The "Recent Proposals" tile is marked "Coming soon". The last proposal is in `localStorage` and accessible to anyone with admin access, but there is no list view.

### 9.2 Internal-only current boundary (locked)

- Admin is **internal-only** for now. Single operator (Tayyab).
- The client does not log in to the admin tool. Engagements are managed outside the site.
- See `docs/ROADMAP.md` and `memory/SEMANTIC_MEMORY.md` for the current boundary.

### 9.3 Client-facing future possibility

- A future version could let a client view their own proposal via a signed link. This is **out of scope** for now and would require:
  - Server-side persistence of proposals (Supabase or Worker + KV).
  - A real auth model for the client view (Supabase magic link or signed URL).
  - A separate "client" route group, not a route under `/admin`.
  - A scope expansion approved by the owner.
- PM1 does not commit to this; PM1 only notes it as a future possibility.

### 9.4 Roadmap items (from `docs/ROADMAP.md` R-4.1 through R-4.3)

#### R-4.1 — Recent Proposals viewer

**Decision needed (Q-12):** part of MVP stabilization, or deferred?

- **Option A (MVP):** surface `localStorage.co_last_proposal` in the existing tile. Remove the "Coming soon" tag. No new persistence.
- **Option B (deferred):** persist proposals to Supabase (or Worker + KV). List them on the dashboard with click-through. Larger work item; depends on §4 Stage 1 or Stage 2.

**Recommendation:** Option A is the smallest honest improvement. Option B is a separate, post-Worker phase.

#### R-4.2 — Admin motion discipline

- Per D-011: admin motion stays lighter and faster than the public site. Lighter transitions, no parallax, no floating cards, no marquees.
- Codify the admin motion budget in the UIX0 / MOTION0 plan (§8.11).
- Page transitions ≤ 200ms.

#### R-4.3 — Testimonials carousel wiring

- `components/testimonials.tsx` exists. Render it on the home page.
- Reconcile with the marketing copy. The page already shows "Sample Project" tags on portfolio cards; the testimonials would also be presented as real.
- Recommendation: defer to UIX0 / MOTION0 phase so the carousel is shipped with the rest of the motion / taste work.

#### R-4.4 — Portfolio copy honesty (R-019 in `repo-research/RISK_REGISTER.md`)

- Either rename "Sample Project" tags to real client names (if real) or update the metadata description to say "Sample work."
- The current contradiction is visible to SEO crawlers and to visitors.
- Recommendation: fix in the same cleanup phase as the README repair (copy fix only, no functional change).

#### R-4.5 — Better admin auth (cross-link §4 Stage 2)

- Replace the `localStorage` password gate with Supabase Auth / magic link.
- Removes R-001, R-003, R-029.

#### R-4.6 — Better admin persistence (cross-link §4 Stage 7)

- Persist proposals and intake to Supabase (or Worker + KV).
- Removes R-018 (partially).
- Post-Worker; depends on §4 Stage 1.

### 9.5 Sequencing for the admin roadmap

1. **Phase 1 (cleanup):** R-4.4 portfolio copy fix.
2. **Phase 2 (security):** R-4.5 better admin auth.
3. **Phase 3 (security, post-Worker):** R-4.6 better admin persistence.
4. **Phase 4 (admin features):** R-4.1 Recent Proposals viewer (Option A first, Option B later).
5. **Phase 5 (UIX0 / MOTION0):** R-4.2 admin motion discipline; R-4.3 testimonials carousel.

### 9.6 What PM1 does not do

- PM1 does not implement any admin feature.
- PM1 does not persist proposals.
- PM1 does not wire the testimonials carousel.
- PM1 does not fix the portfolio copy.

---

## 10. Observability / Monitoring Plan

### 10.1 Current state

- No error tracking. No uptime monitoring. No form delivery monitor.
- When the webhook is unreachable, forms surface a generic "Email hello@codeoutfitters.com" message. The team is not auto-notified.
- No retries. Forms do not retry on transient failure.
- No rate limiting.

### 10.2 What observability must cover

- **Error tracking** (R-010): catch client-side errors and report them somewhere the owner can see.
- **Webhook failure visibility**: see when a form submission to n8n fails, before a lead is lost.
- **Booking failure visibility**: see when a booking submission to Supabase fails.
- **Analytics** (out of scope for now per `docs/ROADMAP.md`).
- **Uptime monitoring**: see when the deployed site is down.
- **Owner notification path**: a single channel the owner checks (email, Discord, Slack — chosen by the owner; D-009 free / open-source-first).

### 10.3 Tooling candidates (free / open-source only per D-009)

| Need | Free candidate | Notes |
|---|---|---|
| Error tracking | Sentry (free tier), GlitchTip (self-host) | Sentry's free tier covers a single-operator app |
| Uptime monitoring | UptimeRobot (free), Better Stack (free tier) | Watch `/`, `/contact`, `/book` |
| Form delivery monitor | n8n-side error workflow (free; n8n already in stack) | n8n workflow that catches and forwards failed form submissions |
| Booking failure visibility | Sentry + a thin wrapper in `lib/booking-actions.ts` | Same as error tracking |
| Owner notification | Email (default), Discord webhook (free), Slack (free tier), Telegram (free) | Owner picks one channel |

### 10.4 Recommended staged approach

#### Stage 1 — Sentry (or GlitchTip) for error tracking

- Add a thin client-side error reporter.
- Wire to the existing global `ErrorBoundary` (`components/error-boundary.tsx`).
- Capture: unhandled errors, console errors, network errors to Supabase / n8n / Anthropic.
- Owner channel: email (default) or Discord webhook.

Acceptance: a forced client-side error on the deployed site is reported to the chosen channel within 5 minutes.

#### Stage 2 — Uptime monitoring

- Add UptimeRobot (or Better Stack free tier) checks for `/`, `/contact`, `/book`.
- Alert on 5xx or timeout.

Acceptance: a forced 5xx is reported within 5 minutes.

#### Stage 3 — n8n delivery monitor

- Add an n8n workflow that catches and forwards failed form submissions to the owner channel.
- n8n already owns the form workflows; this is a small addition.

Acceptance: a forced webhook failure is reported within 5 minutes.

#### Stage 4 — Booking failure visibility

- Wrap `lib/booking-actions.ts` calls in a Sentry capture.
- Alert on any booking write failure.

Acceptance: a forced Supabase write failure is reported within 5 minutes.

### 10.5 Owner notification path

- **Default:** email to `hello@codeoutfitters.com`.
- **Optional:** Discord webhook (free; one-message-per-event).
- The owner must pick one before Stage 1 ships.

### 10.6 Acceptance criteria for the observability phase

1. Client-side errors are reported to the chosen channel.
2. Uptime checks run for `/`, `/contact`, `/book`. A 5xx is alerted.
3. n8n delivery failures are reported.
4. Booking write failures are reported.
5. Owner channel receives the alerts.
6. `docs/SECURITY.md` and `INTEGRATION_NOTES.md` are updated to reflect the new observability surface.
7. `repo-research/RISK_REGISTER.md` R-010 is moved to "Closed" with a date.

### 10.7 What PM1 does not do

- PM1 does not install Sentry / UptimeRobot / n8n-side monitor.
- PM1 does not wire any error reporter.
- PM1 does not pick the owner channel.

---

## 11. Git / Repo Root Verification Plan

### 11.1 The observation

- The overnight batch reported that `git status` failed because the workspace was not a git repository at the time of the run.
- Verified now: `F:\CodeOutfitters` is not a git repo (no `.git` directory at the root, per the directory listing).
- This is a planning concern, not an immediate blocker for PM1.

### 11.2 What the overnight batch actually saw

- The `OVERNIGHT-SAFE-PRE8-AND-PM1-PREP` batch ran in a non-git workspace.
- The "no source files modified" safety check was performed by timestamp comparison, not by `git status`.
- All allowed change zones are populated; no source/runtime files were modified.

### 11.3 Risks of a non-git state

- No change tracking for the work done in DOC-MEMORY-REPAIR and the overnight batch.
- No diff surface for future review.
- No branch protection, no PR review, no CI hooks (CI is also unconfigured; see §6).
- No way to roll back if a future agent makes a mistake.
- The lockfile decision (§3) explicitly relies on `git status` being clean before deletion. This is currently impossible.

### 11.4 Possible causes

- The repo was never initialized (`git init` was never run).
- The `.git` directory was lost (e.g., a wipe, a bad clone, an editor clean-up).
- The repo lives in a different location and the OpenCode session was opened at the wrong root.

### 11.5 PM1's recommended next action (planning only, do not execute)

**Recommendation:**

1. Confirm the real repo root with the owner. Is `F:\CodeOutfitters` the right place?
2. If yes, initialize the repo (`git init`), add a `.gitignore` (already present, but should be reviewed against current contents), and create the first commit with the current state.
3. If no, find the real repo root and re-run PM1 there. PM1 only writes files inside allowed zones; if the real root is elsewhere, the plan still applies.
4. This is a **setup phase concern**, not a PM1 implementation concern. PM1 does not initialize git. PM1 only documents the risk.

### 11.6 Open question for the owner

- **Q-21:** Confirm whether `F:\CodeOutfitters` is the real repo root, and whether the project should be initialized as a git repository in a future setup phase.

### 11.7 What PM1 does not do

- PM1 does not run `git init`.
- PM1 does not run `git status` (and indeed cannot verify it from this state).
- PM1 does not add or remove any git-related files.
- PM1 only documents the risk and the recommended next action.

---

## 12. Sequencing Plan

### 12.1 Recommended phase order

| Order | Phase | Status | Depends on | Notes |
|---|---|---|---|---|
| 1 | PM1 (this plan) | in progress | — | Plan-only. Output: `docs/PM1_PLAN.md` + state updates. |
| 2 | PM1 review by ChatGPT Control Room | gated | PM1 | Approve, repair, or reject the plan. |
| 3 | PD1 — Product / design decisions (if needed) | blocked | PM1 review | Only if any of the 13 owner decisions are undecided and need a deeper product frame. |
| 4 | Setup phase (git init, .gitignore review) | blocked | PM1 review | Includes Q-21 git status resolution. |
| 5 | Cleanup phase A (low-risk, no architecture change) | blocked | Setup | README repair, `DEPLOY.md` delete (Q-13), portfolio copy fix (R-019), `source: "contact"` symmetry (Q-14), `tsconfig.tsbuildinfo` to `.gitignore` (R-025), `ESLint config` addition (R-026, requires config-only). |
| 6 | Cleanup phase B (lockfile resolution) | blocked | Cleanup A, owner decision on npm vs pnpm | Delete one lockfile, update `.gitignore`, update docs. |
| 7 | TS0 / RDG0 — tooling approval | blocked | Cleanup A | Submits the 9-tool list (§7) in 9 small PRs, in the recommended order. |
| 8 | TS0 setup — install approved tools | blocked | TS0 / RDG0 approval | Each tool in its own small PR per §7.6. |
| 9 | QA slice 0 (config-only) | blocked | Cleanup A | Add `typecheck` script + `eslint.config.mjs` + GitHub Actions CI. No new tooling. |
| 10 | D0 — Design / architecture | blocked | PM1 review, PD1 if needed | Architecture decisions for security, booking, RLS, Worker. |
| 11 | A0 — Action / build plan | blocked | D0 | Concrete plan for the security and booking phases. |
| 12 | Security phase 1 (Worker proxy for Anthropic) | blocked | A0, Setup | Stage 1 of §4. |
| 13 | Security phase 2 (Supabase Auth / magic link) | blocked | Security 1 | Stage 2 of §4. |
| 14 | Security phase 3 (Supabase RLS) | blocked | Security 1 or 2 | Stage 3 of §4. RLS works either way. |
| 15 | Booking phase A (MVP: UI reads slots + wire to `createBooking`) | blocked | D0, A0 | §5.5. May run ahead of Security 2 if the owner approves keeping the anon-key write path. |
| 16 | Booking phase B (robust: RPC + Worker) | blocked | Booking A, Security 1 | §5.6. |
| 17 | Security phase 4 (n8n signing) | blocked | Security 1 or 2 | Stage 5 of §4. |
| 18 | Security phase 5 (CSP CI guard) | blocked | TS0 setup (CI) | Stage 6 of §4. |
| 19 | Admin auth + persistence (R-4.5, R-4.6) | blocked | Security 2, Booking A | §9.4. |
| 20 | Observability phase (Sentry + UptimeRobot + n8n monitor) | blocked | Cleanup A | §10.4. |
| 21 | QA slice 1 (Playwright test runner) | blocked | TS0 setup, QA slice 0 | §6.4. |
| 22 | QA slice 2 (Lighthouse + visual regression) | blocked | QA slice 1, TS0 setup | §6.4. |
| 23 | QA slice 3 (form / booking / admin / a11y tests) | blocked | QA slice 1, the feature phases | §6.4. |
| 24 | UIX0 / MOTION0 — first slice | blocked | QA slice 2, TS0 setup | §8.5. Hero + headline + reveals + ROI + reduced-motion. |
| 25 | UIX0 / MOTION0 — later slices | blocked | UIX0 first slice | Each slice in its own PR. |
| 26 | Admin motion discipline + testimonials | blocked | UIX0 first slice | §9.4. |
| 27 | Final QA + delivery | blocked | All above | Full manual checklist + automated smoke. |

### 12.2 Hard rules (enforced by sequencing)

- **No D0 before PM1 and PD1 (if required).** D0 depends on PM1 (and possibly PD1).
- **No A0 before D0.** A0 depends on D0.
- **No feature agents before A0.** IMPL phases depend on A0.
- **No package installs before TS0 / RDG0 approval.** TS0 setup is its own gated phase.
- **No UIX0 / MOTION0 implementation before PM1, D0, A0, and tooling decisions.** UIX0 / MOTION0 depends on PM1, D0, A0, and TS0 setup.
- **No lockfile deletion before Cleanup B.** Cleanup B is its own gated phase.
- **No README edits before Cleanup A.** Cleanup A is its own gated phase.
- **No security or booking fix before their respective gated phases.** Each is a separate phase with its own gate.

### 12.3 Parallelism (when team grows)

- Cleanup A and Cleanup B can run in parallel (they touch different files).
- TS0 / RDG0 submission and Cleanup A can run in parallel.
- D0 and PD1 can run in parallel with Cleanup A.
- Security phases and Booking phases can run in parallel after A0 if the team grows.
- UIX0 / MOTION0 and Observability can run in parallel after TS0 setup.

PM1 is single-agent. The future phases may parallelize.

### 12.4 What PM1 does not do

- PM1 does not start D0, A0, UIX0 / MOTION0, IMPL, or any implementation.
- PM1 does not approve tooling installs.
- PM1 does not delete lockfiles.
- PM1 only writes this plan and updates the required state files.

---

## 13. Owner Decision Register

PM1 surfaces 13 owner decisions. Each must be resolved before the next phase that depends on it.

| ID | Decision | Options | Recommended default | Required before |
|---|---|---|---|---|
| D-15 | npm vs pnpm as canonical package manager | npm / pnpm | npm (per §3.4) | Cleanup B |
| D-16 | Real business launch vs portfolio demo first | real business / portfolio demo | real business (the site is built for it) | Phase 1 of any security or observability work |
| D-17 | Admin internal-only vs client-facing later | internal-only / client-facing later | internal-only now; client-facing only if a future scope expansion is approved | Security phase 2 (admin auth) |
| D-18 | Security before any non-internal launch | yes / no | yes (LG-1, LG-2) | Any phase that targets a non-internal audience |
| D-19 | Booking fix before any non-internal launch | yes / no | yes (LG-4) | Any phase that targets a non-internal audience |
| D-20 | Supabase RLS before any non-internal launch | yes / no | yes (LG-3) | Any phase that targets a non-internal audience |
| D-21 | Motion priority vs performance budget | motion first / perf first / balanced | balanced (D-011 direction with §8.7 budget) | UIX0 / MOTION0 first slice |
| D-22 | BeFluence reference-only confirmation | yes / no | yes (D-011 already states this) | UIX0 / MOTION0 first slice |
| D-23 | Tooling order | Repomix → Graphify → Context7 → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil → Tree-sitter / codebase-memory | per §7.2 | TS0 / RDG0 submission |
| D-24 | Impeccable / Emil install scope | global / per-project / reference only | per-project, only after TS0 / RDG0 approval (D-012) | UIX0 / MOTION0 first slice |
| D-25 | Recent Proposals viewer scope | MVP now / deferred | Option A (surface `localStorage`) now; Option B (Supabase persistence) later | Cleanup A or Admin features phase |
| D-26 | Observability vendor | Sentry vs GlitchTip / UptimeRobot vs Better Stack / Discord vs email | Sentry (errors) + UptimeRobot (uptime) + email (alerts) | Observability phase |
| D-27 | Git / repo root status | initialize git at `F:\CodeOutfitters` / find a different root / defer | initialize at `F:\CodeOutfitters` if confirmed as the real root; otherwise find the real root | Setup phase |

Cross-reference: Q-01..Q-20 in `repo-research/OPEN_QUESTIONS.md` map to most of these.

### 13.1 What PM1 does not do

- PM1 does not make any of these decisions.
- PM1 only lists them and recommends defaults.
- The owner (or ChatGPT Control Room) must confirm.

---

## 14. Acceptance Criteria

PM1 passes only if **all** of the following are true:

### 14.1 Deliverables

- [x] `docs/PM1_PLAN.md` exists, covers all 14 workstreams above, and is well-structured.
- [x] Optional supporting files (`repo-research/PM1_DECISION_MATRIX.md`, `repo-research/PM1_PHASE_SEQUENCE.md`) exist if useful.
- [x] `PROJECT_CONTROL_LOG.md` is updated with the PM1 batch overlay.
- [x] `memory/CURRENT_STATE.md` is updated to reflect PM1 completion.
- [x] `memory/ACTIVE_TASK_CONTEXT.md` is updated for the PM1 phase.
- [x] `memory/WORKING_MEMORY.md` is updated with PM1 outcomes and any new open questions.
- [x] `memory/EPISODIC_MEMORY.md` is updated with the PM1 event.
- [x] `memory/IMPORTANT_DECISIONS.md` is updated with new PM1 decisions (D-015+).
- [x] `ai/AI_TASK_CAPSULE.md` is updated with the PM1 line.
- [x] `ai/AI_CONTEXT_RULES.md` is updated if needed.
- [x] `docs/51_AGENT_HANDOFF_LOG.md` is appended to (not rewritten).
- [x] `INTEGRATION_NOTES.md` is updated only if integration notes changed (in this batch: not required).

### 14.2 Constraints

- [x] No source files in `app/`, `components/`, `hooks/`, `lib/`, `public/` were modified.
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

### 14.3 Plan quality

- [x] The plan synthesizes PRE8, all overnight briefs, all risk-register entries, and all state files.
- [x] Every workstream A–J from `repo-research/PM1_INPUT_BRIEF.md` is covered.
- [x] The 13 owner decisions are listed with recommended defaults.
- [x] The phase sequence is explicit and respects the hard rules.
- [x] Git / repo root concern is documented as a planning concern, not acted on.
- [x] The next gate is clearly recommended: ChatGPT Control Room review of PM1.

### 14.4 Stop rule

- PM1 stops. It does not start D0, A0, UIX0 / MOTION0, IMPL, or any implementation.
- PM1 does not install anything.
- PM1 does not configure anything.
- PM1 waits for ChatGPT Control Room.

---

## Appendix A — Cross-references

- `repo-research/PRE8_CHECKPOINT.md` — PRE8 passed.
- `repo-research/PM1_INPUT_BRIEF.md` — workstreams A–J, dependencies, sequencing.
- `repo-research/RISK_REGISTER.md` — R-001..R-035.
- `repo-research/README_REPAIR_SPEC.md` — §2 of PM1.
- `repo-research/LOCKFILE_DECISION_BRIEF.md` — §3 of PM1.
- `repo-research/SECURITY_HARDENING_BRIEF.md` — §4 of PM1.
- `repo-research/BOOKING_CORRECTNESS_BRIEF.md` — §5 of PM1.
- `repo-research/TOOLING_APPROVAL_BRIEF.md` — §7 of PM1.
- `repo-research/UIX0_MOTION0_BRIEF.md` — §8 of PM1.
- `repo-research/QA_STRATEGY_BRIEF.md` — §6 of PM1.
- `repo-research/FEATURE_TRACEABILITY_MATRIX.md` — cross-references.
- `repo-research/AGENT_BOUNDARY_MAP.md` — allowed change zones.
- `repo-research/OPEN_QUESTIONS.md` — Q-01..Q-20.
- `PROJECT_CONTROL_LOG.md` — phase ledger.
- `INTEGRATION_NOTES.md` — external service contracts.
- `docs/ROADMAP.md` — Phase 0..5 + 3.5.
- `docs/SECURITY.md` — R-001..R-010 prose.
- `docs/DATABASE.md` — booking schema and RLS gap.
- `docs/FEATURES.md` — public + admin feature inventory.
- `docs/ARCHITECTURE.md` — static-export architecture.
- `docs/QA_CHECKLIST.md` — manual QA + future motion / taste QA.
- `memory/IMPORTANT_DECISIONS.md` — D-001..D-012.
- `ai/AI_CONTEXT_RULES.md` — never-do list.
- `ai/AI_FILE_OWNERSHIP.md` — file ownership rules.

## Appendix B — New decisions captured by PM1

PM1 captures the following new decisions. These are added to `memory/IMPORTANT_DECISIONS.md` in this batch, not in a future phase.

- **D-015** — Lockfile recommendation is `npm`. Owner must confirm.
- **D-016** — Real business launch is the default. Owner must confirm portfolio-demo intent if it differs.
- **D-017** — Admin is internal-only now. Client-facing is a future scope expansion, not a current commitment.
- **D-018** — Security (Worker proxy + auth + RLS) is a launch gate for any non-internal audience.
- **D-019** — Booking correctness is a launch gate for any non-internal audience.
- **D-020** — Supabase RLS is a launch gate for any non-internal audience.
- **D-021** — Motion priority is balanced with the §8.7 performance budget. Owner must confirm.
- **D-022** — BeFluence is reference only. Reaffirmed from D-011.
- **D-023** — Tooling order is per §7.2.
- **D-024** — Impeccable / Emil install scope is per-project, only after TS0 / RDG0 approval (from D-012).
- **D-025** — Recent Proposals viewer Option A (localStorage surface) is the small, honest improvement; Option B (Supabase persistence) is post-Worker.
- **D-026** — Observability vendor defaults: Sentry (errors), UptimeRobot (uptime), email (alerts). Owner must confirm.
- **D-027** — Git / repo root status: confirm `F:\CodeOutfitters` is the real root; if yes, `git init` is part of a future Setup phase.

These are recommendations. The owner confirms.

## Appendix C — Safety confirmation (PM1 batch)

This PM1 batch:

- Did not modify any source file under `app/`, `components/`, `hooks/`, `lib/`, `public/`.
- Did not modify `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`.
- Did not modify either lockfile (`package-lock.json`, `pnpm-lock.yaml`).
- Did not modify `.env*`, `.gitignore`, `README.md`, or `DEPLOY.md`.
- Did not run `npm install`, `pnpm install`, `yarn install`, or `npx` of any kind.
- Did not configure any MCP server.
- Did not install any tooling or skill.
- Did not initialize git or run any git-changing command.
- Did not create a CI config file.
- Did not create any test file.
- Did not start D0, A0, UIX0 / MOTION0, IMPL, or any implementation.
- Only created / modified files in the allowed change zones: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`.
