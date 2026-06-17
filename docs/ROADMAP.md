# Roadmap

Sequenced list of future work. Items are ordered by suggested execution, not by priority alone. Items already addressed in DOC-MEMORY-REPAIR are noted as **done**.

## Phase 0 — Foundation stabilization

### R-0.1 — Documentation stabilization — **done (DOC-MEMORY-REPAIR)**

- Created `docs/`, `memory/`, `ai/`, `repo-research/` trees.
- Documented the architecture, integrations, security posture, environment, database, features, deployment, QA, and roadmap.
- Captured the dual-lockfile, exposed-secret, and booking-double-book issues in writing.

### R-0.2 — README repair

- Drop the v0 boilerplate.
- Document the actual dev script (`next dev --port 3005 --webpack`).
- Point to `docs/SETUP.md` instead of duplicating setup instructions.
- **Not done.** Requires PM1.

### R-0.3 — Lockfile resolution

- Pick one: `npm` or `pnpm`.
- Delete the other lockfile.
- Update `README.md`, `docs/SETUP.md`, and `docs/DEPLOYMENT.md` to match.
- **Not done.** Requires PM1.

## Phase 1 — Security hardening

### R-1.1 — Move Anthropic call behind a server boundary

- Stand up a Cloudflare Worker that holds the Anthropic key as a server-side secret.
- The admin UI calls the Worker, not Anthropic directly.
- The Worker streams the response back to the browser.
- Removes R-002 from `docs/SECURITY.md`.
- **Not done.** Requires PM1.

### R-1.2 — Replace client-side admin gate

- Pick an auth model: Cloudflare Access (preferred, no code), Auth.js, or a basic-auth-style proxy.
- Remove `NEXT_PUBLIC_ADMIN_PASSWORD` from the bundle.
- Removes R-001 from `docs/SECURITY.md`.
- **Not done.** Requires PM1.

### R-1.3 — Enable Supabase RLS

- Deny all to `anon` by default.
- Allow inserts to `bookings` only via a server-side endpoint (or via an RPC the anon role can call with strict validation).
- Removes R-003.
- **Not done.** Requires PM1.

### R-1.4 — Per-form webhook secret

- Generate a random secret per form type.
- Add a header to each form POST. Verify in n8n.
- Mitigates R-005.
- **Not done.** Requires PM1.

## Phase 2 — Booking integrity

### R-2.1 — Booking UI reads `available_slots`

- `components/booking-calendar-custom.tsx` calls `getAvailableSlots` for the displayed month.
- Days with no remaining slots are visually disabled.
- Times with `is_booked = true` are not offered.
- Removes R-004.
- **Not done.** Requires PM1.

### R-2.2 — Seed rotation

- Replace the one-shot 12-week seed with a recurring job (cron in n8n, or a Supabase scheduled function) that ensures there are always 12 weeks of future slots.
- **Not done.** Requires PM1.

## Phase 3 — Tooling and QA

### R-3.1 — Request TS0 / RDG0 approval for visual QA tooling

- Candidates: Playwright MCP, Chrome DevTools MCP.
- Use case: visual regression, smoke tests, link checks, accessibility scan.
- If approved, install in a separate, plan-first phase. Do not install directly from roadmap items.
- **Not done.** Requires Control Room approval, not just PM1.

### R-3.2 — Set up Graphify / Repomix / Context7 / Tree-sitter

- Same gate as R-3.1.
- These are developer/AI tooling, not runtime deps.
- **Not done.**

### R-3.3 — Add a smoke test harness

- Whichever tooling is approved in R-3.1, the first deliverable is a smoke test that runs on every PR and on every deploy.
- Smoke test should cover: home, services, pricing, contact, book, admin gate, admin onboarding flow, admin proposal generation (mocked).
- **Not done.**

## Phase 3.5 — UIX0 / MOTION0 (premium motion + design taste)

> Owner-stated direction captured in D-011 and D-012. This phase is **not** in scope for DOC-MEMORY-REPAIR, PM1, D0, or A0. It is its own gated phase.

### R-3.5.1 — UIX0 / MOTION0 plan

- Produce a written plan that lists each animation type from D-011 and maps it to either an existing library (GSAP, ScrollTrigger, `@gsap/react`, Framer Motion, AOS, Lenis) or a phase-R-3.1-approved MCP tool for verification.
- Spell out performance rules: GPU-friendly transforms, no layout shift, no bundle bloat, mobile-friendly, `prefers-reduced-motion` honored.
- Spell out what the admin motion will and will not do (lighter and faster than the public site).
- **Not done.** Requires Control Room approval.

### R-3.5.2 — Design taste plan (Impeccable + Emil Kowalski)

- Decide when each skill is used: at design time, at review time, or both.
- Produce a per-page "taste checklist" derived from the avoid/prefer list in D-012.
- Do not run `npx skills add` or `npx impeccable install` until approved.
- **Not done.** Requires Control Room approval.

### R-3.5.3 — Browser-based visual review loop

- Sequence: AI generates motion/UI change → AI opens the page in browser via Playwright MCP / Chrome DevTools MCP (if approved in R-3.1) → AI critiques with Impeccable + Emil Kowalski rules → AI improves → repeat until premium feel is achieved.
- All steps are gated. None run in DOC-MEMORY-REPAIR.
- **Not done.** Requires Control Room approval.

### R-3.5.4 — Visual motion QA matrix

- Capture baseline screenshots at 375 / 768 / 1024 / 1440 for every public page and for each animation type.
- Reduced-motion variants must also be captured.
- All baseline work is downstream of the tooling approval gate.
- **Not done.**

## Phase 4 — Admin feature work

### R-4.1 — Recent Proposals viewer

- Surface `co_last_proposal` in the admin dashboard tile.
- Or, ideally, persist proposals to Supabase and list them with click-through.
- The "Coming soon" tag on the current tile should be removed once this ships.
- **Not done.** Requires PM1.

### R-4.2 — Admin motion discipline

- Per D-011: admin motion stays cleaner and faster than the public site. Lighter transitions, no parallax, no floating cards, no marquees.
- Codify the admin motion budget in the UIX0 / MOTION0 plan (R-3.5.1).
- **Not done.**

### R-4.2 — Testimonials carousel wiring

- `components/testimonials.tsx` exists. Render it on the home page.
- Reconcile with the marketing copy: the page already shows "Sample Project" tags on the portfolio cards; the testimonials are also presented as real. Either change copy or change data sourcing.
- **Not done.**

### R-4.3 — Portfolio copy honesty

- Either rename "Sample Project" tags to real client names (if real) or update the metadata description to say "Sample work."
- The current contradiction is visible to SEO crawlers and to visitors.
- **Not done.**

## Phase 5 — Observability

### R-5.1 — Error tracking

- Free: Sentry, GlitchTip.
- Add a thin client-side error reporter. Wire to the global `ErrorBoundary`.
- **Not done.**

### R-5.2 — Uptime monitoring

- Free: UptimeRobot, Better Stack free tier.
- Watch `/`, `/contact`, `/book`. Alert on 5xx or timeout.
- **Not done.**

### R-5.3 — Form delivery monitoring

- Watch the n8n webhook success rate. Alert on threshold.
- **Not done.**

## Sequencing rules

- Phase 0 must finish before any later phase.
- Phase 1 items are independent of Phase 2 items. They can be done in parallel work streams if the team grows.
- Phase 3 tooling approval must precede Phase 3 implementation.
- **Phase 3.5 (UIX0 / MOTION0) is its own gated phase.** It depends on R-3.1 / R-3.2 approvals for any browser-based tooling. It does not start before Control Room approval. It does not start before PM1.
- Phase 4 is feature work. It can be batched or split.
- Phase 5 is ongoing maintenance once the basics are in.

## What is explicitly out of scope

- No new public-facing pages without a written brief.
- No new integrations (Slack, Stripe, HubSpot, etc.) without a plan-first phase.
- No paid tools. Free / open-source only.
- No changes to the brand colors, type system, or core copy without a written brief.
- **No motion, design polish, or taste-skill install work outside an approved UIX0 / MOTION0 phase.**
- **No copying or scraping of `befluence.pro` or any other site.** Use as motion/interaction reference only.
- **No MCP server setup, no `npx skills add`, no `npx impeccable install`, no Playwright MCP / Chrome DevTools MCP / Graphify / Repomix / Context7 MCP / Tree-sitter / codebase-memory MCP install** without Control Room approval.
