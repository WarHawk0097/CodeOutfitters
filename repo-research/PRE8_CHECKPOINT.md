# PRE8 CHECKPOINT

## 1. Status

**Passed**

PRE8 is a planning-lock gate. It verifies that the foundation is solid enough for PM1 input materials to be prepared. It does **not** start PM1.

## 2. Product Identity Lock

- **Project name:** CodeOutfitters
- **Legal entity:** CodeOutfitters LLC
- **Domain:** `https://codeoutfitters.com`
- **Contact email:** `hello@codeoutfitters.com`
- **What the app is:** a US small-business AI automation agency website, with an internal admin tool for client intake and AI proposal generation.
- **What business it serves:** US small businesses that need custom AI automations (WhatsApp lead automation, email workflows, AI chatbots, appointment booking, invoice automation, custom workflow builds).
- **Repo type:** real working app, production-bound static site + single-operator internal admin tool. Built on Next.js 16 with `output: 'export'`, deployed to Cloudflare Pages. Not a prototype, not a visual demo, not a scaffold-only repo.

## 3. Target User Lock

- **Primary audience:** US small-business owners / operators who want to stop doing repetitive work and are willing to pay a per-project scoped fee for custom automation.
- **Secondary audience:** operations managers and team leads inside those small businesses; they fill out forms and help evaluate the work.
- **Internal operator:** Tayyab (single human operator). Runs the marketing site, answers leads, runs discovery calls, completes the admin intake, generates proposals.
- **Business buyer profile:** US small business, 1–50 employees, currently doing ≥ 5 hours/week of automatable manual work, budget ≥ $500 for a one-time scoped engagement. See `docs/FEATURES.md` and the `pricing-faq.tsx` for the published floor.

## 4. MVP / Current Product Boundary

### What currently exists

- Full public marketing site at 9 URLs plus 404, sitemap, robots.
- 4 working public forms: quote, contact, booking (3-step), newsletter. All POST to a shared n8n webhook.
- Custom booking calendar with Supabase read/write.
- ROI calculator.
- Sample portfolio (3 hardcoded cards, "Sample Project" tagged).
- Cookie consent and consent-gated Tawk live chat (optional).
- SEO surface (per-page metadata, sitemap, robots, JSON-LD `ProfessionalService`).
- Static-exported, Cloudflare-ready (`public/_redirects`, `public/_headers` with CSP).
- Password-gated admin tool with 5-section intake form and Anthropic-powered proposal generator.
- Localstorage-backed admin session and proposal draft.

### What is working

- Marketing pages render and are responsive.
- Forms validate client-side, include honeypot, and submit to the webhook.
- Booking inserts to Supabase and flips `available_slots.is_booked`.
- Admin password gate works for the intended single operator.
- Admin intake form saves drafts and finalizes to `localStorage`.
- Anthropic call returns and renders an 11-section proposal.
- Reduced-motion is respected by the GSAP hooks.

### What is incomplete

- Booking UI does not call `getAvailableSlots` — does not block already-booked slots.
- "Recent Proposals" tile is marked "Coming soon".
- Testimonials carousel is built but not rendered.
- Supabase schema has no RLS.
- Supabase slot seed is 12 weeks from `2026-05-18` and will exhaust.
- No error tracking, no monitoring, no CI, no tests.
- `package.json` has an `npm run lint` script but no eslint config file.

### What is out of scope

- No published prices anywhere.
- No blog, CMS, or content management.
- No client portal.
- No user accounts, no login, no email verification.
- No analytics, A/B testing, or heatmaps.
- No multi-language.
- No dark mode toggle.
- No payment processing.

### What must not be built yet

- No new public-facing pages without a written brief.
- No new integrations (Slack, Stripe, HubSpot) without a plan-first phase.
- No paid tools. No MCP setup. No Impeccable / Emil Kowalski install. No animation-library additions.
- No copy of `befluence.pro` or any other site — motion reference only (D-011).
- No code until A0 passes; no PM1 until Control Room approves; no D0 / A0 / UIX0 / MOTION0 in this batch.

## 5. Runtime Memory Decision

- **Runtime / product memory is NOT required** for this app right now.
- **Development memory IS required and IS present** (the `memory/`, `ai/`, `docs/`, `repo-research/` trees).
- **Why runtime memory is not required:** there is no multi-tenant state, no in-app user accounts, no conversation history, no personalization engine. All product-state persistence is supplied by external services: Supabase (bookings, available_slots) and n8n (form ingestion). The admin tool's `localStorage` is intentional for a single-operator context.
- **Reopen the runtime memory decision if:** the admin tool grows multi-user, or if a chat / agent / in-app personalization feature is added.

## 6. Development Memory Verification

| File | Exists | Status |
|---|---|---|
| `PROJECT_CONTROL_LOG.md` | yes | current — phase ledger updated for overnight batch |
| `INTEGRATION_NOTES.md` | yes | current — covers n8n, Supabase, Anthropic, Tawk |
| `docs/51_AGENT_HANDOFF_LOG.md` | yes | current — append-only, includes addendum |
| `docs/ARCHITECTURE.md` | yes | current — includes D-011 / D-012 motion architecture constraints |
| `docs/SETUP.md` | yes | current — corrects README's port and command errors |
| `docs/ENVIRONMENT.md` | yes | current — all 6 env vars documented |
| `docs/DATABASE.md` | yes | current — schema, RLS gap, seed lifecycle, double-book risk |
| `docs/SECURITY.md` | yes | current — 10 risks (R-001 to R-010), 8 future fixes (F-001 to F-008) |
| `docs/FEATURES.md` | yes | current — public + admin inventory, design/motion target section |
| `docs/DEPLOYMENT.md` | yes | current — supersedes root `DEPLOY.md` |
| `docs/ROADMAP.md` | yes | current — Phase 0 to 5, includes new Phase 3.5 (UIX0 / MOTION0) |
| `docs/QA_CHECKLIST.md` | yes | current — manual QA + motion + taste checklists |
| `memory/PROJECT_CONTEXT_PACK.md` | yes | current — one-page orientation |
| `memory/WORKING_MEMORY.md` | yes | current — open questions list |
| `memory/SEMANTIC_MEMORY.md` | yes | current — stable project facts |
| `memory/EPISODIC_MEMORY.md` | yes | current — event log |
| `memory/PROCEDURAL_MEMORY.md` | yes | current — phase discipline, state sync, repair procedure |
| `memory/AGENT_IDENTITY_MEMORY.md` | yes | current — agent role taxonomy |
| `memory/ACTIVE_TASK_CONTEXT.md` | yes | current — overnight batch overlay |
| `memory/CURRENT_STATE.md` | yes | current — overnight batch overlay |
| `memory/IMPORTANT_DECISIONS.md` | yes | current — D-001 to D-012 |
| `ai/AI_TASK_CAPSULE.md` | yes | current — overnight phase line |
| `ai/AI_REPO_MAP.md` | yes | current |
| `ai/AI_FILE_OWNERSHIP.md` | yes | current |
| `ai/AI_CONTEXT_RULES.md` | yes | current |
| `ai/AI_CONTRACTS.md` | yes | current |
| `repo-research/README.md` | yes | current |

All required files are present. PRE8 development-memory verification **passes**.

## 7. Known Risks Carried Forward

- R-001 README inaccurate (port 3000 vs 3005; v0 boilerplate).
- R-002 Dual lockfiles (`package-lock.json` + `pnpm-lock.yaml`).
- R-003 Client-side admin password (`NEXT_PUBLIC_ADMIN_PASSWORD`).
- R-004 Client-side Anthropic API key (`NEXT_PUBLIC_ANTHROPIC_API_KEY`).
- R-005 Booking double-booking risk.
- R-006 Missing Supabase RLS.
- R-007 Supabase slot seed exhaustion (12 weeks from 2026-05-18).
- R-008 No tests.
- R-009 No CI.
- R-010 No monitoring (no error tracking, no uptime, no form delivery).
- R-011 MCP / developer tooling not approved.
- R-012 D-011 / D-012 (premium motion + design taste) captured but not implemented.
- R-013 Animation performance risk (Lenis + GSAP + Framer Motion + AOS already in stack; future additions may bloat).
- R-014 Mobile performance risk.
- R-015 Accessibility / reduced-motion risk (AOS does not auto-handle).
- R-016 Static export limitations (no server functions, no middleware, all secrets in bundle).
- R-017 n8n single-webhook contract risk (one URL for 4 form types, payload shape discrimination only).
- R-018 Admin `localStorage` persistence limitation (shared browser = shared data).
- R-019 Portfolio truth gap — "Sample Project" badge on cards vs metadata "Real case studies".
- R-020 CSP must be updated whenever a new external endpoint is added.
- R-021 Three GSAP entry points + duplicate `useScrollReveal` names (refactor candidate).

Full table in `repo-research/RISK_REGISTER.md` (this batch).

## 8. Tooling Candidates Carried Forward

| Tool | Type | Approval | Use case |
|---|---|---|---|
| Playwright MCP | external / MCP | not approved | visual / smoke / motion QA in browser |
| Chrome DevTools MCP | external / MCP | not approved | in-browser debug + perf |
| Graphify | external | not approved | code → knowledge graph |
| Repomix | external | not approved | code → packed context for LLMs |
| Context7 MCP | external / MCP | not approved | library / framework docs lookup |
| Tree-sitter | external | not approved | structural code parsing |
| codebase-memory MCP | external / MCP | not approved | persistent code memory |
| Impeccable | design / skill | not approved | frontend design review layer |
| Emil Kowalski / Agents with Taste | design / skill | not approved | motion taste reference |

All require TS0 / RDG0 approval before install. See `repo-research/TOOLING_APPROVAL_BRIEF.md` (this batch).

## 9. UIX0 / MOTION0 Carry-Forward

- Owner direction is captured in D-011 and D-012 in `memory/IMPORTANT_DECISIONS.md`.
- Implementation belongs in a future **UIX0 / MOTION0** phase, gated behind PM1 and any TS0 / RDG0 approvals.
- Brief is in `repo-research/UIX0_MOTION0_BRIEF.md` (this batch).
- Hard rules: no `npx skills add`, no `npx impeccable install`, no MCP setup, no animation-library adds, no `package.json` edits, no code in the current batch. Reference only — do not copy `befluence.pro`.

## 10. PM1 Readiness Decision

**PM1 is NOT started.** PRE8 says PM1 input materials may be prepared in this batch. The actual PM1 phase requires explicit ChatGPT Control Room approval.

PM1 readiness:

- Foundation tree: present and current.
- Product identity: locked.
- Target user: locked.
- MVP boundary: locked.
- Runtime memory decision: locked (no).
- Known risks: enumerated.
- Tooling candidates: enumerated.
- UIX0 / MOTION0 carry-forward: captured.

PM1 input materials prepared in this batch:

- `repo-research/PM1_INPUT_BRIEF.md`
- `repo-research/RISK_REGISTER.md`
- `repo-research/README_REPAIR_SPEC.md`
- `repo-research/LOCKFILE_DECISION_BRIEF.md`
- `repo-research/SECURITY_HARDENING_BRIEF.md`
- `repo-research/BOOKING_CORRECTNESS_BRIEF.md`
- `repo-research/TOOLING_APPROVAL_BRIEF.md`
- `repo-research/UIX0_MOTION0_BRIEF.md`
- `repo-research/QA_STRATEGY_BRIEF.md`
- `repo-research/FEATURE_TRACEABILITY_MATRIX.md`
- `repo-research/AGENT_BOUNDARY_MAP.md`
- `repo-research/OPEN_QUESTIONS.md`
- `repo-research/DOCUMENTATION_CONSISTENCY_AUDIT.md`

## 11. Files Reviewed

- `app/layout.tsx`, `app/(public)/page.tsx`, `app/(public)/layout.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/onboarding/page.tsx`, `app/admin/proposal/page.tsx`, `app/(public)/book/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx`
- `app/(public)/services/page.tsx`, `app/(public)/pricing/page.tsx`, `app/(public)/portfolio/page.tsx`, `app/(public)/about/page.tsx`, `app/(public)/contact/page.tsx`, `app/(public)/privacy/page.tsx`, `app/(public)/terms/page.tsx`
- `components/hero.tsx`, `components/navbar.tsx`, `components/footer.tsx`, `components/contact.tsx`, `components/quote-form.tsx`, `components/booking-calendar-custom.tsx`, `components/cookie-consent.tsx`, `components/consent-gated.tsx`, `components/live-chat.tsx`, `components/gradient-canvas.tsx`, `components/gsap-provider.tsx`, `components/aos-provider.tsx`, `components/page-transition.tsx`, `components/error-boundary.tsx`, `components/announcement-bar.tsx`, `components/floating-cta.tsx`, `components/back-to-top.tsx`, `components/scroll-progress.tsx`, `components/cta-banner.tsx`, `components/section-divider.tsx`, `components/trust-bar.tsx`, `components/animated-text.tsx`, `components/animated-bg.tsx`, `components/page-hero.tsx`, `components/services.tsx`, `components/process.tsx`, `components/portfolio.tsx`, `components/portfolio-placeholder.tsx`, `components/pricing-faq.tsx`, `components/roi-calculator.tsx`, `components/about-values.tsx`, `components/newsletter.tsx`, `components/testimonials.tsx`, `components/tools-strip.tsx`
- `components/admin/onboarding-form.tsx`, `components/admin/proposal-output.tsx`, `components/admin/proposal-sections.tsx`
- `hooks/useGSAP.ts`, `hooks/useParallaxFloat.ts`, `hooks/useScrollReveal.ts`
- `lib/supabase.ts`, `lib/booking-actions.ts`, `lib/booking-types.ts`, `lib/booking-schema.sql`, `lib/admin-types.ts`, `lib/proposal-generator.ts`, `lib/gsap.ts`, `lib/animations/gsap-setup.ts`, `lib/animations/gsap-config.ts`, `lib/animations/useScrollReveal.ts`, `lib/animations/useNavScroll.ts`
- `public/_headers`, `public/_redirects`
- `package.json`, `package-lock.json` (read-only, manifest inspection), `pnpm-lock.yaml` (read-only), `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `components.json`, `.env.local.example`, `.gitignore`, `README.md`, `DEPLOY.md`
- All foundation files in `docs/`, `memory/`, `ai/`, `repo-research/`

## 12. Files Updated

In PASS 0 and PASS 1 of this batch:

- `PROJECT_CONTROL_LOG.md` — overnight batch overlay appended
- `memory/EPISODIC_MEMORY.md` — overnight batch event logged
- `memory/ACTIVE_TASK_CONTEXT.md` — phase label updated
- `memory/CURRENT_STATE.md` — phase label updated
- `ai/AI_TASK_CAPSULE.md` — phase line updated
- `docs/51_AGENT_HANDOFF_LOG.md` — overnight batch section appended

In PASS 2 onward, the remaining strategy briefs and audits will be created. All updates remain inside the allowed change zones.
