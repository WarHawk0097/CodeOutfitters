# D0 ARCHITECTURE DECISIONS

> **Status:** D0 design / architecture decision package for ChatGPT Control Room. **Plan-only.** No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no A0 / UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started.
>
> **Phase:** D0 — Design / Architecture.
>
> **Source materials:** `docs/PM1_PLAN.md`, `docs/PD1_DECISION_LOCK.md`, `repo-research/PD1_OWNER_DECISION_BALLOT.md`, `repo-research/PM1_PHASE_SEQUENCE.md`, `repo-research/RISK_REGISTER.md`, `repo-research/SECURITY_HARDENING_BRIEF.md`, `repo-research/BOOKING_CORRECTNESS_BRIEF.md`, `repo-research/TOOLING_APPROVAL_BRIEF.md`, `repo-research/UIX0_MOTION0_BRIEF.md`, `repo-research/QA_STRATEGY_BRIEF.md`, `repo-research/FEATURE_TRACEABILITY_MATRIX.md`, `repo-research/AGENT_BOUNDARY_MAP.md`, `repo-research/OPEN_QUESTIONS.md`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, all `docs/`, all `memory/`, all `ai/`.
>
> **Hard rules respected:** no code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security fixes, no booking fixes, no git init, no CI config, no test file, no D0 implementation kickoff, no A0 kickoff, no UIX0 / MOTION0 implementation, no TS0 / RDG0 tooling install (including **Ponytail** and **ECC / affaan-m/ecc**).
>
> **Companion files in this D0 batch:**
> - `docs/D0_SYSTEM_DESIGN.md` — target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts.
> - `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` — what each future phase may and may not touch; file-zone per phase; integration contract list.

## Table of Contents

1. Purpose and scope
2. Approach
3. Architecture decisions (by area)
4. Architectural-path decisions reflected
5. Phase boundary decisions
6. Risk-driven decisions
7. Cross-cutting decisions
8. D0 readiness assessment (for A0)
9. Gates that remain blocked
10. Safety confirmation
11. Recommended next step
12. Appendix A — Cross-references
13. Appendix B — Files created in this batch
14. Appendix C — Files modified in this batch

---

## 1. Purpose and scope

D0 is the **design / architecture** decision phase between PM1 / PD1 and A0. D0 does not start A0. D0 does not implement. D0 does not install. D0 converts the PD1-locked defaults and the PD1-shadowed architectural-path options into a concrete target architecture that the future IMPL phases (A0, Security 1, Security 2, Security 3, Booking A, Booking B, Observability, QA, UIX0 / MOTION0) can plan against.

**In scope for D0:**

- Decide the **target architecture** for security, booking, observability, admin, QA / CI, tooling, and UIX0 / MOTION0 — without implementing any of it.
- Decide the **phase boundaries**: which future phase owns which file zones and which risks.
- Decide the **integration contracts**: which external services the public and admin surfaces depend on, and what changes when each launch gate closes.
- Decide the **rollback** and **migration** posture for each future IMPL phase.
- Reflect the approved PD1 defaults in the architecture.

**Out of scope for D0:**

- Writing any source file under `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`.
- Editing any config file (`package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, eslint / tailwind configs, either lockfile, `.env*`, `public/_headers`, `public/_redirects`).
- Installing or configuring any tooling, skill, MCP server, browser binary, or package.
- Starting A0, Security phases, Booking phases, Observability, QA / CI, UIX0 / MOTION0, IMPL, or any implementation.
- Initializing git or running any git-changing command.
- Editing `README.md`, `DEPLOY.md` (root), or any other file outside the allowed change zones.
- Evaluating, installing, cloning, or configuring **Ponytail** (candidate only; not approved).
- Evaluating, installing, cloning, configuring, or copying configs from **ECC / affaan-m/ecc** (candidate only; not approved).

## 2. Approach

D0 plans **only the architecture that the future phases will own**. D0 does not write code, but D0 does write **contracts**:

- **Trust-boundary contracts** — what the browser is allowed to call directly, what must go through a server boundary, and what must be admin-gated.
- **Data contracts** — what is read, what is written, what is idempotent, what is transactional, what is signed.
- **File-zone contracts** — what each future phase is allowed to touch, and what is off-limits without explicit approval.
- **Phase-exit contracts** — what evidence (screenshots, smoke test, doc update, risk-register move-to-Closed) each future phase must produce before stopping.

D0 reflects the **PD1 LOCKED DEFAULTS** and the **PD1-shadowed architectural-path options** as the binding plan. The D0 plan is binding against those defaults; if the owner overrides any default, the override flows through PD1 → D0 → A0.

D0 does not introduce new decisions. D0 only reflects PD1 and PM1. Where D0 needs to resolve a small choice that PM1 / PD1 left open (e.g., which Supabase RLS policy pattern, which Worker runtime, which observability wiring order), D0 records the **recommended default** and marks it as **NEEDS A0 CONFIRMATION** (the future A0 phase will lock the choice, not D0).

## 3. Architecture decisions (by area)

### 3.1 Current architecture snapshot (carried forward, not changed by D0)

| Element | Current state | Source of truth |
|---|---|---|
| App framework | Next.js 16 App Router | `package.json`, `docs/ARCHITECTURE.md` |
| Build target | `output: 'export'` → `out/` | `next.config.mjs`, `docs/ARCHITECTURE.md` |
| Deploy target | Cloudflare Pages | `docs/DEPLOYMENT.md`, `INTEGRATION_NOTES.md` |
| Public routes | `app/(public)/...` → 9 public URLs + 404 + sitemap + robots | `docs/FEATURES.md`, `app/sitemap.ts` |
| Admin routes | `app/admin/...` → 3 internal pages, client-side password gate | `docs/ARCHITECTURE.md`, `app/admin/layout.tsx` |
| Forms | 4 public forms, all POST to a shared `NEXT_PUBLIC_N8N_WEBHOOK_URL` | `INTEGRATION_NOTES.md` §1 |
| Booking data | Supabase `bookings` + `available_slots` (no RLS) | `lib/booking-schema.sql`, `lib/booking-actions.ts`, `docs/DATABASE.md` |
| Booking UI read | **Broken** — calendar does not call `getAvailableSlots` | `components/booking-calendar-custom.tsx:26-30` |
| Booking UI write | **Wired to n8n only** — does not call `createBooking` | `components/booking-calendar-custom.tsx` (per `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §1.6) |
| Proposal generation | Anthropic API direct from browser using `NEXT_PUBLIC_ANTHROPIC_API_KEY` | `lib/proposal-generator.ts:6` |
| Tawk live chat | Optional, consent-gated | `components/live-chat.tsx`, `components/consent-gated.tsx` |
| Animation stack | GSAP 3.15 + ScrollTrigger + `@gsap/react` 2.1 + Framer Motion 12 + AOS 2.3 + Lenis 1.3 + Tailwind v4 transitions | `package.json` deps |
| Animation stack risk | 3 GSAP entry points, 2 `useScrollReveal` hooks, no global reduced-motion coverage | `repo-research/RISK_REGISTER.md` R-013, R-015, R-021, R-022 |
| CSP | Tight `connect-src` (self + Supabase + n8n + Anthropic + Tawk) via `public/_headers` | `public/_headers` |
| Auth model | None. Admin gate is `localStorage` plaintext compared to `NEXT_PUBLIC_*` | `app/admin/layout.tsx:21,33`, `repo-research/SECURITY_HARDENING_BRIEF.md` §1 |
| CI / tests | None | `repo-research/QA_STRATEGY_BRIEF.md` §1 |
| Error tracking / monitoring | None | `repo-research/RISK_REGISTER.md` R-010 |
| Git repo | Not initialized at `F:\CodeOutfitters` | `repo-research/PM1_PLAN.md` §11 |

### 3.2 Target architecture direction (D0 plan, not implementation)

| Area | D0 target | Why | Closes / enables |
|---|---|---|---|
| Deployment model | **Keep static export**; do not drop `output: 'export'` | Lowest cost. Cloudflare Pages default `npm run build` works unchanged. Migration to a server runtime is a future-only decision if a hard requirement emerges. | Preserves D-015, D-002. |
| Server boundary for secrets | **Cloudflare Worker proxy** for Anthropic call (and optionally for Supabase service-role writes and the admin gate) | Only way to keep static export + remove `NEXT_PUBLIC_ANTHROPIC_API_KEY` from the bundle without changing the host model. Cloudflare Workers free tier covers the volume. | R-002, R-004 (LG-1). |
| Admin auth path | **Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized** | Cloudflare Access is the smallest change for a single operator behind Cloudflare Pages. Supabase Auth pairs with the future RLS work and the booking correctness work. D-009: no paid vendor. | R-001, R-003, R-029 (LG-2). |
| Database access path | **Worker-mediated service-role writes** for `bookings` and `available_slots`; anon key gets read-only or RPC-only | Anon key cannot write directly once Worker is in place. RLS is then defense-in-depth, not the only barrier. | R-006 (LG-3). |
| Booking correctness | **UI reads `available_slots` (MVP fix A) → Wire to transactional reservation via Worker (robust fix D) with a `reserve_slot` RPC (B) and `UNIQUE (preferred_date, preferred_time)` constraint** | A is the smallest honest UI change. B + D prevent double-booking at the database level. Defense in depth. | R-005, R-007, R-031 (LG-4). |
| Form webhook | **Per-form webhook secret + signed header**; n8n verifies | Removes single-webhook contract risk without forcing four URLs. Header check is a small n8n workflow. | R-017. |
| CSP / endpoint drift | **CI guard** that fails the build if `public/_headers` is missing a new external endpoint | Prevents silent CSP regressions when new endpoints are added. | R-020. |
| Observability | **Sentry (errors, free tier) + UptimeRobot (uptime, free) + email alerts to `hello@codeoutfitters.com`** | D-009 prefers free / open-source. Single-operator volume fits free tier. Email is the default owner channel; Discord webhook is a free fallback. | R-010. |
| QA / CI baseline | **`tsc --noEmit` + `npm run lint` + GitHub Actions on every PR** as Slice 0 (no new tooling). **Real Playwright test runner** as Slice 1 (gated on TS0 / RDG0). **Playwright MCP + Chrome DevTools MCP** for the visual QA loop (gated on TS0 / RDG0). | Catches regressions before merge. Lays the foundation for browser-based motion QA. | R-008, R-009. |
| Tooling | **Per TS0 / RDG0 order: Repomix → Graphify → Context7 MCP → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil Kowalski → Tree-sitter / codebase-memory (last two optional).** **Ponytail** stays candidate-only. | Cheapest, broadest, most-generally-useful first. | D-021, D-023, D-024. R-011. |
| UIX0 / MOTION0 priority | **High priority after** security, booking, RLS, observability baseline, and tooling approvals. First slice ships together. | D-011 motion + D-012 taste must be held against the same budget. D-022 reaffirms BeFluence reference only. | R-012, R-013, R-014, R-015. |
| Runtime memory | **Out of scope** for the product | Single operator. No multi-tenant state, no in-app personalization, no user accounts. | D-001. |
| Development memory | **Mandatory** repo infrastructure | Already in place. Continue to maintain. | D-001. |
| Recent proposals | **Later admin phase** after auth and proposal-persistence decisions. A first (surface `localStorage.co_last_proposal`), B later (persist to Supabase / Worker + KV). | Smallest honest improvement now; post-Worker for full persistence. | D-025. |
| Git / repo root | **`git init` at `F:\CodeOutfitters`** in Setup phase only if owner confirms it is the real root. PM1 / D0 do not run `git init`. | Future PR-style review requires git. Lockfile deletion in Cleanup B requires a clean `git status`. | D-027, Q-21. |
| Contact form `source` field | **Add `source: "contact"` in Cleanup A** (Q-14). | Symmetry with quote and newsletter. | R-027. |
| Legacy `DEPLOY.md` | **Delete in Cleanup A** (Q-13). | Superseded by `docs/DEPLOYMENT.md`. | R-001 (doc). |

### 3.3 Why keep static export

- The Cloudflare Pages free tier covers the volume; no need to pay a server host.
- The build is fast (`next build` → `out/`). Deploys are atomic.
- Every public form already speaks to a managed backend (n8n, Supabase, Anthropic, Tawk). The browser doing the work is a feature, not a bug, for a marketing site.
- A Cloudflare Worker is the smallest possible server surface and lives in the same account as the Pages deploy. No new vendor.

Dropping static export is **not** the right move now. The right move is to add a small server boundary only where secrets require it (Anthropic, optionally Supabase service-role writes, optionally admin auth). Everything else stays static.

### 3.4 Trust-boundary contract (D0 plan)

```
Public visitor (untrusted)
    │
    ▼  HTTPS
Cloudflare Pages (CDN, CSP enforced)
    │
    │ static HTML / JS / CSS
    ▼
Browser
    │
    ├──►  Supabase REST (anon key) — read `available_slots` only when RLS denies anon-write is on;
    │                                  if anon read is also denied, use an RPC.
    ├──►  n8n webhook (per-form secret in header) — public form submissions.
    ├──►  Cloudflare Worker (proxied Anthropic) — `claude-sonnet-4-6` for admin proposal gen.
    ├──►  Cloudflare Worker (admin auth + service-role Supabase write) — booking submit.
    └──►  Tawk.to (optional, consent-gated) — live chat.
                                       │
                                       ▼
                                  Cloudflare Worker(s)
                                       │
                                       ├──►  Anthropic API (server-side env var)
                                       ├──►  Supabase REST (service-role key)
                                       └──►  n8n webhook (signed event)
                                                │
                                                ▼
                                        Owner email (Sentry / UptimeRobot / n8n monitor)
```

**Rules:**

- `NEXT_PUBLIC_ANTHROPIC_API_KEY` is removed from the bundle once the Worker is in place. The browser calls the Worker, never Anthropic directly.
- `NEXT_PUBLIC_ADMIN_PASSWORD` is removed from the bundle once real auth is in place. The admin gate is enforced at the Worker (or by Cloudflare Access before the Worker is reached).
- The anon Supabase key stays in the bundle (it must, to read public `available_slots`) but is limited to read or RPC-by-RPC; writes go through the Worker with a service-role key.
- The n8n webhook receives a per-form secret in a header. Unsigned requests are dropped by n8n.

### 3.5 Decision-by-decision reflection

| # | Area | D0 decision | PD1 source | Reflected? |
|---|---|---|---|---|
| 1 | Package manager | `npm` is canonical. `pnpm-lock.yaml` to be dropped in Cleanup B. Add `pnpm-lock.yaml` to `.gitignore` in Cleanup B. Add a CI guard in Cleanup B / TS0 setup. | D-015 LOCKED DEFAULT; BLOCKS D0 | yes |
| 2 | Real business launch | Real business site first; portfolio-safe language until real case studies exist. | D-016 LOCKED DEFAULT; BLOCKS D0 | yes |
| 3 | Admin scope | Internal-only admin for the foreseeable future. Client-facing only via a future scope expansion. | D-017 LOCKED DEFAULT; BLOCKS D0 | yes |
| 4 | Security as launch gate | Required before any non-internal launch. | D-018 LOCKED DEFAULT; BLOCKS D0 | yes |
| 5 | Booking correctness as launch gate | Required before any non-internal launch. | D-019 LOCKED DEFAULT; BLOCKS D0 | yes |
| 6 | Supabase RLS as launch gate | Required if Supabase remains writable from client. | D-020 LOCKED DEFAULT; BLOCKS D0 | yes |
| 7 | Tooling order | Repomix → Graphify → Context7 MCP → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil Kowalski → Tree-sitter / codebase-memory. **Ponytail stays candidate-only.** | D-021 LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | yes |
| 8 | UIX0 / MOTION0 priority | High priority after security, booking, RLS, observability baseline, and tooling approvals. | D-022 LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | yes |
| 9 | BeFluence usage | Reference only. No copying, scraping, or cloning. | D-023 LOCKED DEFAULT | yes |
| 10 | Impeccable / Emil scope | Per-project, only after TS0 / RDG0 approval. Default to "do not install now." | D-024 LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | yes |
| 11 | Recent proposals | Later admin phase after auth and proposal-persistence decisions. | D-025 LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | yes |
| 12 | Observability vendor | Sentry (errors) + UptimeRobot (uptime) + email alerts to `hello@codeoutfitters.com`. | D-026 LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | yes |
| 13 | Git / repo root | `git init` at `F:\CodeOutfitters` in Setup phase only if owner confirms the root. | D-027 LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | yes |
| 14 | Anthropic protection path | Cloudflare Worker proxy. | D-019a NEEDS OWNER APPROVAL; default = B | yes |
| 15 | Admin auth path | Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized. | D-020a NEEDS OWNER APPROVAL; default = Cloudflare Access → Supabase Auth | yes |
| 16 | Booking MVP write path | A first (UI reads `available_slots`, visually disable booked slots), then C (n8n handles booking validation). | D-019b NEEDS OWNER APPROVAL; default = A then C | yes |
| 17 | Performance budget specifics | LCP unchanged or improved; CLS = 0; INP in "good" range on a Moto G Power class device; +0 KB JS net from new libraries; no new CSS framework; no new external assets. | D-022a NEEDS OWNER APPROVAL; default = accept §8.7 | yes |
| 18 | Test runner form | Both: real Playwright test runner in CI + Playwright MCP / Chrome DevTools MCP for the visual QA loop. | D-021a NEEDS OWNER APPROVAL; default = both | yes |
| 19 | Observability vendor specifics | Sentry + UptimeRobot. GlitchTip / Better Stack as fallback. | D-021b NEEDS OWNER APPROVAL; default = Sentry + UptimeRobot | yes |
| 20 | DEPLOY.md cleanup | Delete in Cleanup A. | Q-13 DEFERRED to Cleanup A | yes |
| 21 | Contact form `source` field | Add `source: "contact"` in Cleanup A. | Q-14 DEFERRED to Cleanup A | yes |
| 22 | Auth model | Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized. | Q-15 → D-020a | yes |
| 23 | Performance budget | See #17. | Q-16 → D-022a | yes |
| 24 | Taste rubric | D-012 avoid / prefer list + Impeccable + Emil Kowalski review at the end of the first slice. | Q-17 LOCKED DEFAULT (rubric exists) | yes |
| 25 | Test runner form | See #18. | Q-18 → D-021a | yes |
| 26 | Observability vendor | See #19. | Q-19 → D-021b | yes |
| 27 | Brand status footer | Keep static in MVP. Document as known limitation (R-035). Replace with a live badge when the observability phase ships. | Q-20 DEFERRED to observability phase | yes |
| 28 | Repo root | See #13. | Q-21 → D-027 | yes |
| 29 | Ponytail | **NOT APPROVED.** Candidate only. Gated to TS0 / RDG0. Owner must provide exact official GitHub repo URL, pinned version, and scope (default: reference-only) before TS0 / RDG0 evaluation. | PD1 §6.1 | yes (carried as candidate; not approved) |
| 30 | ECC / affaan-m/ecc | **NOT APPROVED.** Candidate only. Gated to TS0 / RDG0. Owner-asked during D0 review. Multi-agent harness tooling. Must be evaluated before adoption; may overlap with Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, codebase-memory. Recommended default: research during future TS0 / RDG0 only; do not install now. See D0 ECC addendum. | D0 ECC addendum | yes (carried as candidate; not approved) |

### 3.6 Security architecture decisions (D0 plan)

**Per `repo-research/SECURITY_HARDENING_BRIEF.md` §3 and PD1 D-019a, D-020a, D-018, D-020:**

| Decision | D0 plan | Locks | Owner-confirmation |
|---|---|---|---|
| Anthropic protection | Cloudflare Worker proxy. Worker holds the key as a server-side env var. The browser calls the Worker. `NEXT_PUBLIC_ANTHROPIC_API_KEY` is removed from the build output. CSP must include the Worker origin. | R-002, R-004 (LG-1) | Owner approval recommended (D-019a) |
| Admin auth (fast path) | Cloudflare Access: protected application in front of the `/admin/*` routes. Access-policy = owner email (and any future internal collaborators). No app code change required. | R-001, R-003, R-029 (LG-2 partial) | Owner approval recommended (D-020a) |
| Admin auth (productized) | Supabase Auth / magic link for `/admin`. The admin layout reads the Supabase session. `NEXT_PUBLIC_ADMIN_PASSWORD` is removed from the build output. | R-001, R-003, R-029 (LG-2 full) | Triggered only if admin becomes productized |
| Supabase RLS | Enable RLS on `bookings` and `available_slots`. Anon role: `USING (false)` on both. Inserts go through a controlled path (RPC the anon role can call with strict input validation, **or** the Worker with a service-role key). RLS is defense-in-depth, not the only barrier. | R-006 (LG-3) | Owner approval recommended (D-020) |
| n8n webhook signing | Per-form secret. Header on every POST. n8n verifies. | R-017 | Owner confirmation optional |
| CSP endpoint drift | CI guard fails the build if `public/_headers` does not include every external endpoint the app calls. | R-020 | Owner confirmation optional |
| `localStorage` data risk | Document limits. With Cloudflare Access in front of `/admin`, `localStorage` is acceptable for a single operator. If admin becomes productized, move proposal / intake persistence to Supabase or Worker + KV. | R-018 | Owner confirmation optional (D-017) |
| Admin proposal data risk | Proposal data never leaves the operator's browser until a real persistence layer ships. R-018 partially closed by Cloudflare Access; full close requires persistence work. | R-018 (partial) | Owner confirmation optional |
| Launch-readiness requirements | All four launch gates (LG-1 Worker proxy, LG-2 admin auth, LG-3 RLS, LG-4 booking correctness) must be green before any non-internal launch. | LG-1..LG-4 | Owner approval (D-018, D-019, D-020) |

**D0 does not implement any of the above. D0 only plans.**

### 3.7 Booking architecture decisions (D0 plan)

**Per `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §7, §8, §9 and PD1 D-019, D-019b, D-020:**

| Decision | D0 plan | Locks | Owner-confirmation |
|---|---|---|---|
| Current booking read | **UI does not read `available_slots`.** The fix is a precondition for any honest UI. | R-005 (state today) | n/a (describes state) |
| Current booking write | **UI does not call `createBooking`.** The fix is a precondition for any honest data path. | R-005 (state today) | n/a (describes state) |
| MVP fix A (UI reads slots) | `components/booking-calendar-custom.tsx` calls `getAvailableSlots` for the displayed month. Days with no remaining slots are visually disabled. Times with `is_booked = true` are removed from the picker. | R-005 (UI honesty) | Recommended (D-019b) |
| MVP fix C (n8n handles validation) | UI POSTs to n8n; n8n holds a service-role key (or the Worker does); n8n returns success only if the reservation succeeded. | R-005 (data integrity, partial) | Recommended (D-019b) |
| Robust fix B (transactional RPC) | `reserve_slot(p_date, p_time, p_booking)` Postgres function. In one transaction: check `is_booked = false`, insert into `bookings`, update `available_slots`. | R-005 (data integrity) | Recommended (post Worker) |
| Robust fix D (Worker-mediated) | UI calls the Worker; Worker calls the RPC. Worker can sign events to n8n. | R-005 (data integrity + anon key off path) | Recommended (post Worker) |
| Defense in depth | `UNIQUE (preferred_date, preferred_time)` constraint on `bookings`. | R-005 (defense in depth) | Recommended |
| RLS requirements | RLS on `bookings` and `available_slots`. Anon: `USING (false)` for both. RPC grants to anon: explicit and narrow. Service-role writes go through the Worker. | R-006 | Recommended (D-020) |
| Seed lifecycle | Re-seed script (manual or scheduled function) removes the hard-coded `2026-05-18` start. R-007 / R-031 closed by the re-seed script. | R-007, R-031 | Recommended |
| Validation | Client-side: regex email, length caps, honeypot. Server-side: re-validate in n8n or the Worker. The schema is the source of truth. | R-027 (input) | Recommended |
| Graceful degradation | When Supabase is unreachable, the UI shows an error and tells the user to email `hello@codeoutfitters.com`. Already in place in spirit; codify in the booking-correctness phase. | (R-006) | Recommended |
| Acceptance criteria (carried) | Per `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §10 and `docs/PM1_PLAN.md` §5.7. | n/a | n/a |

**D0 does not implement any of the above. D0 only plans.**

### 3.8 Documentation / cleanup architecture decisions (D0 plan)

| Decision | D0 plan | Locks | Owner-confirmation |
|---|---|---|---|
| README repair boundary | Surgical repair per `repo-research/README_REPAIR_SPEC.md`. Title, tagline, port 3005, entry `app/(public)/page.tsx`, env vars, admin warning, security warning, links to foundation docs. ≤ ~150 lines. | R-001 (doc) | Q-13 owner |
| DEPLOY.md cleanup boundary | Delete `DEPLOY.md` (root) in Cleanup A together with the README repair. | R-001 (doc) | Q-13 owner |
| Contact form `source` field | Add `source: "contact"` in Cleanup A for symmetry. | R-027 | Q-14 owner |
| Lockfile cleanup boundary | Cleanup B drops the chosen lockfile. Add to `.gitignore`. Add CI guard. | R-002 (config) | D-015 owner |
| Git / repo root setup boundary | Setup phase: confirm root, `git init`, review `.gitignore`, first commit. PM1 / D0 / A0 do not run `git init`. | (deferred) | Q-21 / D-027 owner |

**D0 does not implement any of the above. D0 only plans the boundaries.**

### 3.9 QA / CI architecture decisions (D0 plan)

**Per `repo-research/QA_STRATEGY_BRIEF.md` §3, §7 and PD1 D-021a, D-022a:**

| Decision | D0 plan | Locks | Owner-confirmation |
|---|---|---|---|
| Typecheck baseline | `tsc --noEmit` as a CI step. Add `typecheck` script to `package.json` (script field only; no new dep). | R-008 (partial) | n/a (config-only) |
| Lint baseline | Minimal `eslint.config.mjs` (flat config) extending `next/core-web-vitals`. Add CI step. | R-009 (partial), R-026 | n/a (config-only) |
| Manual QA baseline | `docs/QA_CHECKLIST.md` minimum bar: home renders; pricing, contact, book load and submit; admin gate works; reduced-motion variant OK; no console errors; mobile 375/768/1024/1440; Cloudflare CSP active; `robots.txt` disallows `/admin`. | n/a | n/a |
| Future test runner (Slice 1) | Real Playwright test runner in `devDependencies`. `tests/smoke.spec.ts` covers home, services, pricing, contact, book (each step), admin gate, admin onboarding (each section), admin proposal (mocked). CI runs on every PR and every deploy. | R-008 (full) | D-021a owner |
| Future browser QA loop (Slice 2) | Playwright MCP + Chrome DevTools MCP for the visual QA loop. Used in UIX0 / MOTION0 first slice for taste review. | n/a (R-012) | D-021a owner |
| Accessibility | axe-core via Playwright. R-015 reduced-motion coverage is always-on. | R-015 | n/a |
| Motion performance | Lighthouse CI budgets for LCP, CLS, INP, TBT. Captured in `repo-research/MOTION_QA_LOG.md`. | R-013, R-014 | D-022a owner |
| No test files yet | D0 does not create any test file. | n/a | n/a |

**D0 does not implement any of the above. D0 only plans the architecture and the phase boundaries.**

### 3.10 Tooling architecture decisions (D0 plan)

**Per `repo-research/TOOLING_APPROVAL_BRIEF.md` and PD1 D-021, D-023, D-024:**

| Tool | Role | Dev / runtime | Install gate | D0 plan |
|---|---|---|---|---|
| Repomix | Pack the repo into a single LLM-friendly bundle | dev | TS0 / RDG0 | Install 1st. Pin a version. Each tool in its own PR. Local mode preferred (no cloud transmission). |
| Graphify | Knowledge graph over the repo with god nodes and community detection | dev | TS0 / RDG0 | Install 2nd. Pure dev surface. |
| Context7 MCP | Up-to-date library / framework docs lookup | dev | TS0 / RDG0 | Install 3rd. MCP server config in a versioned file. |
| Playwright MCP | Drive a real browser from the agent (clicks, screenshots, a11y tree, network log) | dev | TS0 / RDG0 | Install 4th. MCP server config. Read-only by default. |
| Chrome DevTools MCP | Performance, console, DOM, network introspection | dev | TS0 / RDG0 | Install 5th. Pairs with Playwright MCP. |
| Impeccable | Frontend design review skill | dev / skill | TS0 / RDG0 | Install 6th. Per-project. Gated to UIX0 / MOTION0 first slice. |
| Emil Kowalski / Agents with Taste | Motion / animation taste reference | dev / skill | TS0 / RDG0 | Install 7th. Per-project. Gated to UIX0 / MOTION0 first slice. |
| Tree-sitter | Structural code parsing | dev | TS0 / RDG0 (optional) | Install 8th. Only if a future phase needs it. |
| codebase-memory MCP | Persistent memory of the codebase across sessions | dev | TS0 / RDG0 (optional) | Install 9th. Only if a future phase needs it. |
| **Ponytail** | Third-party dev / AI tool, candidate only | dev (if approved) | **TS0 / RDG0 (NOT APPROVED)** | **Candidate only.** Owner must provide the exact official GitHub repo URL, a pinned version, and a scope (default: reference-only) before TS0 / RDG0 evaluation. The future TS0 / RDG0 submission must answer the seven evaluation questions in `docs/PD1_DECISION_LOCK.md` §6.1. Hard rules: no install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase. |
| **ECC / affaan-m/ecc** | Third-party developer / AI agent harness tooling, candidate only | dev (if approved) | **TS0 / RDG0 (NOT APPROVED)** | **Candidate only.** Not approved, not installed, not cloned, not configured, not copied, not added to `package.json`, not added to `devDependencies`, not evaluated. The future TS0 / RDG0 submission must answer the ten evaluation questions in this D0 addendum. ECC may be relevant because the owner uses Codex, OpenCode, Claude Code, and multiple agents; ECC may overlap with Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, and codebase-memory. ECC must be evaluated before adoption. ECC should not be blindly stacked with other agent harness tools. Recommended default: research during future TS0 / RDG0 only; do not install now. See D0 ECC addendum. |
| Sentry (errors) | Error tracking | dev / runtime (free tier) | Observability phase | Use Sentry free tier. Wire to `components/error-boundary.tsx`. |
| UptimeRobot (uptime) | Uptime monitoring | dev / runtime (free) | Observability phase | Watch `/`, `/contact`, `/book`. Email on 5xx. |
| Discord webhook (fallback) | Owner notification channel | dev / runtime (free) | Observability phase | Optional fallback if email is too noisy. |

**Global vs external workspace vs per-project guidance (D0 plan):**

- **Default scope is per-project** for the design skills (Impeccable, Emil Kowalski) and **per-project or external workspace** for the dev tools (Repomix, Graphify, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Tree-sitter, codebase-memory MCP). D0 recommends per-project.
- **Global install is discouraged** for any of these. Global install pollutes other projects and complicates rollback.
- **Reference-only** is the safest fallback. A skill that is referenced but not installed still informs the agent's output through the prompt context.
- **Dev tooling must not become a runtime dependency by default.** Each tool is added to `devDependencies` (not `dependencies`) and is excluded from the production Cloudflare Pages build.

**Free / open-source first rule (D-009).** If any tool becomes paid in the future, do not upgrade. Find a free alternative.

### 3.11 UIX0 / MOTION0 architecture decisions (D0 plan)

**Per `repo-research/UIX0_MOTION0_BRIEF.md` and PD1 D-022, D-022a, D-023, D-024:**

| Decision | D0 plan | Locks | Owner-confirmation |
|---|---|---|---|
| Heavy premium motion direction | Premium AI automation agency. Modern, bold, high-energy. Smooth scroll-driven storytelling. More animated than a typical SaaS, but not childish. | n/a (direction) | D-011 already captured |
| BeFluence usage | Reference only. No copying, scraping, or cloning. | n/a (rule) | D-022 reaffirmed |
| First motion slice boundaries | Hero entrance + animated headline reveal + scroll-triggered section reveals + ROI micro-interactions + reduced-motion coverage. Ships in one PR. | R-012, R-015 | D-022a owner |
| Existing animation stack risk | GSAP, ScrollTrigger, `@gsap/react`, Framer Motion, AOS, Lenis. 3 GSAP entry points and 2 `useScrollReveal` hooks. Refactor candidate. | R-013, R-021 | n/a |
| Duplicate animation entry point risk | Collapse to one canonical GSAP setup. Drop or keep the unused `useScrollReveal` hooks. | R-021 | n/a |
| Performance budget | LCP unchanged or improved; CLS = 0; INP in "good" range on Moto G Power class; +0 KB JS net from new libraries for the first slice; no new CSS framework; no new external assets. | R-013, R-014 | D-022a owner |
| Mobile performance rules | Test on Moto G Power class. Smooth scroll gated to non-reduced-motion and a "good CPU" profile. Parallax may be disabled on low-end mobile. AOS `disable` flag for `navigator.deviceMemory < 4`. `prefers-reduced-motion: reduce` always honored. | R-014, R-015 | n/a |
| Reduced-motion requirement | All non-essential motion opts out when `prefers-reduced-motion: reduce`. Focus state must remain visible. Keyboard navigation must not be broken. Animations must not delay interaction. Hero entrance can be 600-1000ms but must not block scroll or click. `aria-live` and color contrast unaffected. | R-015 | n/a |
| Taste rubric | D-012 avoid / prefer list (no generic purple/blue SaaS gradients, no same-y cards, no weak hierarchy, no random icons, no unmotivated animation, no childish over-effects; prefer strong typography, clear hierarchy, confident spacing, purposeful motion, fast feedback, scroll-based storytelling, US small-business trust, beautiful-but-operational UI). | n/a (rubric) | Q-17 LOCKED |
| Browser review loop later | Generate → Playwright MCP / Chrome DevTools MCP → Impeccable + Emil critique → improve → repeat. Lighthouse mobile audit in parallel. Reduced-motion variant captured. | n/a (loop) | D-021a owner |
| Admin lighter-motion rule | Admin motion is lighter and faster than the public site. Page transitions ≤ 200ms. No parallax, no floating cards, no marquees. Form sections do not have entrance animations that delay the user. | n/a (rule) | n/a |

**D0 does not implement any of the above. D0 only plans the architecture and the slice boundaries.**

### 3.12 Admin architecture decisions (D0 plan)

| Decision | D0 plan | Locks | Owner-confirmation |
|---|---|---|---|
| Internal-only admin boundary | Single operator (Tayyab). Admin lives at `/admin/*` and is gated by a real auth flow (Cloudflare Access or Supabase Auth). | D-017, R-001, R-003 | D-017, D-020a owner |
| Proposal generation flow | Onboarding form (5 sections) → localStorage draft → Anthropic call via Worker (post-Worker) → 11-section JSON response → render. | n/a (flow) | n/a |
| Proposal persistence | Phase 1: surface `localStorage.co_last_proposal` in the existing Recent Proposals tile (remove "Coming soon" tag). Phase 2 (post-Worker): persist to Supabase / Worker + KV; list with click-through. | D-025, R-018 | D-025 owner |
| Recent proposals future phase | A now (in admin features phase), B later (post-Worker). D0 reflects the conservative default ("later admin phase"). | D-025 | D-025 owner |
| Admin auth future path | Cloudflare Access for fast internal protection. Supabase Auth / magic link if admin becomes productized. | D-020a, R-001, R-003, R-029 | D-020a owner |
| Data risk and `localStorage` limits | `localStorage` is acceptable for a single operator behind Cloudflare Access. If the admin tool grows multi-user, move persistence to a server boundary. Document the limit. | R-018 | n/a |

**D0 does not implement any of the above. D0 only plans.**

### 3.13 Observability architecture decisions (D0 plan)

**Per `docs/PM1_PLAN.md` §10 and PD1 D-026, D-021b:**

| Decision | D0 plan | Locks | Owner-confirmation |
|---|---|---|---|
| Sentry candidate | Sentry free tier. Thin client-side error reporter. Wire to `components/error-boundary.tsx`. Capture unhandled errors, console errors, network errors to Supabase / n8n / Anthropic. | R-010 | D-026, D-021b owner |
| UptimeRobot candidate | Watch `/`, `/contact`, `/book`. Alert on 5xx or timeout. | R-010 | D-026 owner |
| Email alert channel | Default to `hello@codeoutfitters.com`. Discord webhook fallback. | n/a (channel) | D-026 owner |
| Webhook failure visibility | n8n delivery monitor (free; n8n already in stack). | R-010 | n/a |
| Booking failure visibility | Sentry wrap on `lib/booking-actions.ts` calls. Alert on any booking write failure. | R-010 | n/a |
| Admin proposal failure visibility | Sentry wrap on the proposal-generation path. Alert on any Anthropic call failure or RPC error. | R-010 | n/a |
| No vendor setup yet | D0 does not configure Sentry, UptimeRobot, or any monitor. | n/a | n/a |

**D0 does not implement any of the above. D0 only plans the architecture.**

## 4. Architectural-path decisions reflected

Per PD1 §5, the following architectural-path decisions are reflected in D0 (defaults stand; owner may override):

| ID | Question | D0 reflection |
|---|---|---|
| D-019a | Anthropic protection path | Cloudflare Worker proxy. |
| D-020a | Admin auth path | Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized. |
| D-019b | Booking MVP write path | A first (UI reads `available_slots`), then C (n8n handles booking validation). |
| D-022a | Performance budget | Accept `docs/PM1_PLAN.md` §8.7 as written. |
| D-021a | Test runner form | Both (real Playwright runner in CI + Playwright MCP / Chrome DevTools MCP for visual QA loop). |
| D-021b | Observability vendor choice | Sentry + UptimeRobot. GlitchTip / Better Stack as fallback. |

## 5. Phase boundary decisions

D0 defines what each future phase owns. Detailed file-zone per phase is in `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`. Summary:

| Future phase | Purpose | Allowed file zones | Blocked until |
|---|---|---|---|
| Setup | Confirm root; `git init`; review `.gitignore`; first commit. | `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `.gitignore`, `docs/`, `memory/`, `ai/`, `repo-research/` | Q-21 / D-027 owner confirmation |
| Cleanup A | README repair, `DEPLOY.md` delete, portfolio copy fix, `source: "contact"`, `tsconfig.tsbuildinfo` to `.gitignore`, ESLint config | `README.md`, `app/(public)/portfolio/page.tsx` (copy only), `components/contact.tsx` (one field), `.gitignore`, `eslint.config.mjs`, `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` | Setup; Q-13, Q-14 |
| Cleanup B | Drop one lockfile, update `.gitignore`, update docs, add CI guard | `package.json` (config field only if pnpm), the dropped lockfile, `.gitignore`, `docs/`, `README.md`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` | Cleanup A; D-015 owner |
| TS0 / RDG0 | Tooling approval request (9 tools + Ponytail candidate) | `repo-research/TS0_RDG0_REQUEST.md` (or split into 9 PRs) | Cleanup A; PD1 + D0 + A0 pass |
| TS0 setup | Install approved tools in their own PRs | `package.json` (devDependencies only), new MCP / skill config files (if any), `docs/`, `memory/`, `ai/`, `INTEGRATION_NOTES.md`, `repo-research/`, `PROJECT_CONTROL_LOG.md` | TS0 / RDG0 approval per tool |
| QA Slice 0 | Add `typecheck` script, `eslint.config.mjs` (already in Cleanup A), GitHub Actions CI | `package.json` (script field only), `eslint.config.mjs`, `.github/workflows/ci.yml` (new), `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` | Cleanup A (parallel with #6, #7) |
| D0 | This phase | `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md` (INTEGRATION_NOTES.md only if integration architecture was clarified) | PM1 + PD1 pass |
| A0 | Concrete plan for security, booking, observability, UIX0 / MOTION0 phases | `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md` | D0 pass |
| Security 1 | Cloudflare Worker proxy for Anthropic | `lib/proposal-generator.ts`, `app/admin/proposal/page.tsx`, new Worker source, `docs/`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md` | A0; Setup |
| Security 2 | Real admin auth (Cloudflare Access or Supabase Auth) | `app/admin/layout.tsx`, `app/admin/page.tsx`, `lib/supabase.ts` (Auth), `docs/`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md` | Security 1 |
| Security 3 | Supabase RLS | `lib/booking-schema.sql`, `lib/booking-actions.ts`, `docs/`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Security 1 or 2 |
| Security 4 | n8n per-form secret + header | `components/quote-form.tsx`, `components/contact.tsx`, `components/booking-calendar-custom.tsx`, `components/newsletter.tsx`, n8n workflow, `INTEGRATION_NOTES.md`, `docs/`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Security 1 or 2 |
| Security 5 | CSP CI guard | `.github/workflows/ci.yml` (or new file), `public/_headers`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | TS0 setup (CI); Security 1 |
| Booking A | MVP fix: UI reads slots + wire to `createBooking`; n8n path | `components/booking-calendar-custom.tsx`, `lib/booking-actions.ts`, `docs/`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | A0; D0 |
| Booking B | Robust fix: `reserve_slot` RPC + Worker | `lib/booking-schema.sql` (RPC), `lib/booking-actions.ts`, Worker source, `docs/`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Booking A; Security 1 |
| Admin auth + persistence | Better admin auth (already in Security 2) + persist proposals to Supabase | `app/admin/page.tsx`, `app/admin/proposal/page.tsx`, `components/admin/`, `lib/proposal-generator.ts`, `lib/supabase.ts`, `docs/`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Security 2; Booking A |
| Observability | Sentry error tracking; UptimeRobot; n8n delivery monitor; booking failure wrap; owner channel | `components/error-boundary.tsx`, `lib/booking-actions.ts`, new monitor scripts, n8n workflow, `docs/`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Cleanup A; D-026 owner |
| QA Slice 1 | Real Playwright test runner + smoke spec | `package.json` (devDep), `playwright.config.*`, `tests/`, `.github/workflows/ci.yml`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md` | TS0 setup; QA Slice 0 |
| QA Slice 2 | Lighthouse CI + visual regression + Chrome DevTools MCP integration | `package.json` (devDeps), `tests/`, `.github/workflows/ci.yml`, `.lighthouserc.*`, `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md` | QA Slice 1; TS0 setup |
| QA Slice 3 | Form / booking / admin / a11y tests + bundle size guard | `tests/`, `package.json` (devDeps), `.github/workflows/ci.yml`, `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md` | QA Slice 1; the feature phases |
| UIX0 / MOTION0 first slice | Hero + headline + scroll reveals + ROI micro + reduced-motion coverage | `components/hero.tsx`, `components/aos-provider.tsx`, `hooks/useScrollReveal.ts`, `components/roi-calculator.tsx`, `docs/`, `repo-research/MOTION_QA_LOG.md` (new), `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | QA Slice 2; TS0 setup |
| UIX0 / MOTION0 later slices | Parallax, magnetic buttons, portfolio motion depth, process timeline, form transitions, marquee polish, stat counters | `components/`, `hooks/`, `lib/animations/`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md` | First slice |
| Admin motion + testimonials | Admin lighter motion; testimonials carousel wiring (R-4.3); R-4.4 portfolio copy if not done in Cleanup A | `components/testimonials.tsx`, `app/(public)/page.tsx` (wire), `components/admin/**`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md` | First slice |
| Final QA + delivery | Full manual checklist; full automated smoke; Cloudflare post-deploy checks | `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md` | All above |

## 6. Risk-driven decisions

D0 does not close any risks. D0 only **plans** the architecture that the future IMPL phases will use to close the risks. Carry-forward:

| Risk | D0 reflects | Closes in phase |
|---|---|---|
| R-001 (README) | README repair boundary planned in §3.8 | Cleanup A |
| R-002 (lockfile) | `npm` canonical, drop `pnpm-lock.yaml`, CI guard | Cleanup B |
| R-003, R-029 (admin password) | Cloudflare Access for fast path; Supabase Auth for productized path | Security 2 |
| R-002, R-004 (Anthropic key) | Cloudflare Worker proxy | Security 1 |
| R-005 (booking double-book) | UI reads slots (A) → transactional RPC + Worker (B + D) | Booking A, then Booking B |
| R-006 (no RLS) | Enable RLS; deny all to anon; controlled insert path | Security 3 |
| R-007, R-031 (seed exhaustion) | Re-seed script | Cleanup A or Booking A |
| R-008 (no tests) | Real Playwright runner | QA Slice 1 |
| R-009 (no CI) | GitHub Actions CI | QA Slice 0 |
| R-010 (no monitoring) | Sentry + UptimeRobot + n8n monitor + email | Observability |
| R-011 (dev tooling not approved) | TS0 / RDG0 submission with 9 tools + Ponytail candidate | TS0 / RDG0 |
| R-012 (motion not planned) | UIX0 / MOTION0 plan; first slice scope | UIX0 / MOTION0 first slice |
| R-013 (animation stack risk) | Audit + budget in UIX0 plan; remove duplicates; AOS reduced-motion opt-out | UIX0 / MOTION0 first slice |
| R-014 (mobile perf) | Performance budget; Moto G Power benchmark | UIX0 / MOTION0 first slice |
| R-015 (reduced-motion) | AOS opt-out; verify all motion respects the media query | UIX0 / MOTION0 first slice |
| R-016 (static export limits) | Keep static; add Worker for secrets | D0 plan |
| R-017 (n8n single webhook) | Per-form secret + header | Security 4 |
| R-018 (admin localStorage limit) | Phase 1: surface last proposal in tile. Phase 2: persist to Supabase / Worker + KV. | Admin features phase (post-Security 2) |
| R-019 (portfolio copy gap) | Copy fix in Cleanup A | Cleanup A |
| R-020 (CSP endpoint drift) | CI guard | Security 5 |
| R-021 (GSAP / useScrollReveal duplicates) | Collapse to one canonical setup | UIX0 / MOTION0 first slice |
| R-022 (AOS double-init risk) | Document; not urgent | Cleanup A (doc) |
| R-023 (contact page stray spaces) | Repair in Cleanup A | Cleanup A |
| R-024 (no `components/ui/`) | Document; do not generate yet | n/a |
| R-025 (tsconfig.tsbuildinfo committed) | Add to `.gitignore` in Cleanup A | Cleanup A |
| R-026 (no ESLint config) | Add minimal flat config in Cleanup A | Cleanup A |
| R-027 (contact form no source) | Add `source: "contact"` in Cleanup A | Cleanup A |
| R-028 (CDN tools strip) | Self-host icons or accept | UIX0 / MOTION0 or accept |
| R-030 (build size untracked) | Build-size report in CI | QA Slice 0 / 2 |
| R-032 (Anthropic model not pinned) | Env override (post-Worker) | Security 1 |
| R-033 (contact honeypot UX) | Document; not urgent | n/a |
| R-034 (contact page stray spaces 2) | Repair in Cleanup A | Cleanup A |
| R-035 (static "All systems operational") | Keep static in MVP; document as known limitation; replace in Observability phase | Observability |

## 7. Cross-cutting decisions

- **Memory:** development memory (the existing `memory/`, `ai/`, `docs/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` trees) is **mandatory repo infrastructure** and continues to be maintained by every phase. Runtime memory (product-level) is **out of scope** per D-001.
- **Phase discipline:** a phase does not start the next phase; it stops and waits for ChatGPT Control Room.
- **Owner confirmation:** every LOCKED DEFAULT in PD1 and every architectural-path option in PD1 §5 stands unless the owner overrides it. D0 reflects the defaults.
- **Hard rules reaffirmed:** no install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, no code, no README / DEPLOY edit, no security / booking fix, no D0 / A0 / UIX0 / MOTION0 / IMPL start, no git init. **Ponytail** and **ECC / affaan-m/ecc** stay candidate-only.
- **Reversibility:** every D0 plan is reversible. The Worker proxy is a single new function. The admin auth change swaps the gate. The booking fix is contained to the calendar component and the booking-actions module. The observability wiring is thin wrappers. UIX0 / MOTION0 changes are component-scoped.
- **Single source of truth:** `repo-research/RISK_REGISTER.md` is the canonical risk surface. `docs/PM1_PLAN.md` is the canonical PM1 plan. `docs/PD1_DECISION_LOCK.md` is the canonical PD1 deliverable. This D0 batch does not replace them; it builds on them.

## 8. D0 readiness assessment (for A0)

A0 may proceed against this D0 plan if ChatGPT Control Room approves D0. A0 does not implement; A0 only plans the next level of detail (concrete PRs, file lists, smoke tests, acceptance criteria per phase).

A0 specifically depends on:

- A confirmed D-019a (Anthropic Worker proxy). A0 will write the Worker stub, the request contract, the env-var contract, the CSP update, and the rollback plan.
- A confirmed D-020a (admin auth path). A0 will write the Access policy or the Supabase Auth integration, the session check, the redirect, the env-var contract, the smoke test, and the rollback plan.
- A confirmed D-019b (booking MVP write path). A0 will write the UI read contract, the write contract, the n8n contract, the graceful-degradation contract, and the smoke test.
- A confirmed D-021a (test runner form). A0 will write the smoke spec scope, the Playwright config, the CI workflow, and the rollback plan.
- A confirmed D-021b (observability vendor). A0 will write the Sentry config shape, the UptimeRobot checks, the n8n monitor workflow, the email alert template, and the rollback plan.

If any of these architectural-path decisions is **not confirmed** when A0 starts, A0 must surface that to ChatGPT Control Room and stop. A0 does not invent new options; A0 only plans against the locked decisions.

## 9. Gates that remain blocked

After D0, the following gates remain blocked:

- **A0** — blocked until D0 passes.
- **Setup phase (git init)** — blocked until Q-21 / D-027 is answered.
- **Cleanup A** — blocked until Setup completes; Q-13, Q-14 are still open.
- **Cleanup B** — blocked until Cleanup A completes; D-015 is still open.
- **TS0 / RDG0** — blocked until Cleanup A; the submission includes Ponytail and ECC / affaan-m/ecc as candidates only.
- **TS0 setup** — blocked until TS0 / RDG0 approval per tool.
- **QA Slice 0** — blocked until Cleanup A (config-only, parallel with Cleanup B / TS0 / RDG0).
- **QA Slice 1 / 2 / 3** — blocked until QA Slice 0 + TS0 setup.
- **UIX0 / MOTION0 first slice** — blocked until QA Slice 2 + TS0 setup.
- **UIX0 / MOTION0 later slices** — blocked until the first slice.
- **Admin motion + testimonials** — blocked until the first UIX0 / MOTION0 slice.
- **Security 1 / 2 / 3 / 4 / 5** — blocked until A0 + Setup.
- **Booking A / B** — blocked until D0 + A0.
- **Admin auth + persistence** — blocked until Security 2 + Booking A.
- **Observability** — blocked until Cleanup A; D-026, D-021b still open.
- **Final QA + delivery** — blocked until all above.
- **Coding / IMPL** — blocked until A0.
- **Package installs** — blocked.
- **Tooling installs (Playwright MCP, Chrome DevTools MCP, Graphify, Repomix, Context7 MCP, Tree-sitter, codebase-memory MCP, Impeccable, Emil Kowalski, Ponytail candidate, ECC / affaan-m/ecc candidate)** — not approved.
- **Lockfile edits** — blocked.
- **`package.json` edits** — blocked.
- **README edits** — blocked.
- **DEPLOY.md delete** — blocked.
- **Git init** — blocked.

## 10. Safety confirmation

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

## 11. D0 ECC addendum (2026-06-16)

The owner asked about **ECC / affaan-m/ecc** during D0 review. ChatGPT Control Room assessed ECC as relevant to the owner's multi-agent workflow (Codex, OpenCode, Claude Code, multiple agents) but **NOT APPROVED** for install / clone / setup / configuration. ECC is recorded as a candidate only and gated to **TS0 / RDG0**.

- **Tool:** ECC / affaan-m/ecc
- **Approval status:** **NOT APPROVED.** Candidate only.
- **Type:** Developer / AI agent harness tooling. Not a product runtime dependency by default.
- **Required gate:** **TS0 / RDG0.**
- **Recommended default:** Research during future TS0 / RDG0 only. Do not install now.
- **Notes:**
  - ECC may be relevant because the owner uses Codex, OpenCode, Claude Code, and multiple agents.
  - ECC may overlap with Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, and codebase-memory.
  - ECC must be evaluated before adoption.
  - ECC should not be blindly stacked with other agent harness tools.
- **Required evaluation (answered in a future TS0 / RDG0 submission, not in D0):**
  1. What does ECC do?
  2. Is it safe and maintained?
  3. What install paths does it require?
  4. Does it require `npm` package install, plugin install, copied config folders, MCP config, or global setup?
  5. Does it touch `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, package files, or repo config?
  6. Does it overlap with existing tooling candidates?
  7. Should it become the main agent-harness layer, reference-only, external workspace tooling, global tooling, or per-project tooling?
  8. Is it free / open-source?
  9. Does it touch production / runtime code?
  10. What rollback plan exists if it causes conflicts?
- **Hard rules reaffirmed:** no install, no clone, no `git clone`, no copy of config folders, no copy of `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs; no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase. D0 only records the candidate.

## 12. Recommended next step

ChatGPT Control Room should:

1. **Approve the D0 architecture plan** by returning Accept / Override / Defer per area. The areas are: deployment model, server boundary, admin auth, database access, booking, form webhook, CSP, observability, QA / CI, tooling, UIX0 / MOTION0, runtime vs development memory, recent proposals, git / repo root, contact form source, DEPLOY.md cleanup, **Ponytail candidate**, **ECC / affaan-m/ecc candidate**.
2. **Confirm the D-019a, D-020a, D-019b, D-022a, D-021a, D-021b defaults** if they are not already locked.
3. **Authorize A0 to start** with the accepted D0 plan, or request D0 repair.

If the owner chooses to override any default, the override must name:

- the area / decision ID,
- the new choice,
- the rationale (one line is enough),
- any downstream decisions that the override frees or imposes.

D0 does not start A0. D0 does not code. D0 does not install. D0 does not configure tooling. D0 stops and waits for ChatGPT Control Room.

---

## Appendix A — Cross-references

- `docs/PM1_PLAN.md` — PM1 plan (14 workstreams).
- `docs/PD1_DECISION_LOCK.md` — PD1 decision-lock package and D0 readiness assessment.
- `repo-research/PD1_OWNER_DECISION_BALLOT.md` — one-row-per-decision ballot.
- `repo-research/PM1_DECISION_MATRIX.md` — D-15..D-27 detail with rationale, evidence, owner question.
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

- `docs/D0_ARCHITECTURE_DECISIONS.md` (this file; primary deliverable).
- `docs/D0_SYSTEM_DESIGN.md` (target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts).
- `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (what each future phase may and may not touch; file-zone per phase; integration contract list).

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
