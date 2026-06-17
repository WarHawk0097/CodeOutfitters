# AI Repo Map

Authoritative map of the repository. Update when files are added, renamed, or removed.

## Top level

| Path | Role |
|---|---|
| `app/` | Next.js App Router. Public pages under `app/(public)/...`; admin pages under `app/admin/...`. |
| `components/` | React components. `components/admin/` holds the admin-only subcomponents. |
| `hooks/` | Three hook variants (see overlap note below). |
| `lib/` | Non-UI code: Supabase client, booking actions, admin types, proposal generator, GSAP. |
| `lib/animations/` | Client-only animation setup and GSAP variants. |
| `public/` | Static assets and Cloudflare config (`_headers`, `_redirects`). |
| `docs/` | Project documentation (prose). |
| `memory/` | Development memory files. |
| `ai/` | AI context and contract files. |
| `repo-research/` | Repo research scratchpad. |
| `PROJECT_CONTROL_LOG.md` | Phase ledger. |
| `INTEGRATION_NOTES.md` | External integration contracts and risks. |
| `README.md` | Operator entry. **Currently weak/wrong.** |
| `DEPLOY.md` | Original Cloudflare deploy checklist. Superseded by `docs/DEPLOYMENT.md`. |
| `package.json` / `package-lock.json` / `pnpm-lock.yaml` | Dependencies. **Dual lockfiles.** |
| `next.config.mjs` | `output: 'export'`, image config. |
| `tsconfig.json` | TS strict, path alias `@/*`. |
| `postcss.config.mjs` | Tailwind v4 via `@tailwindcss/postcss`. |
| `components.json` | shadcn/ui config. No `components/ui/` generated yet. |
| `.env.local.example` | Env var template with security warnings. |
| `.gitignore` | Standard Next ignores plus v0 / `.opencode` / `out/`. |
| `.claude/settings.json`, `.claude/settings.local.json` | Local Claude Code settings. |

## Routes (App Router)

Public (route group `(public)` — no URL segment):

| URL | File |
|---|---|
| `/` | `app/(public)/page.tsx` |
| `/services` | `app/(public)/services/page.tsx` |
| `/pricing` | `app/(public)/pricing/page.tsx` |
| `/portfolio` | `app/(public)/portfolio/page.tsx` |
| `/about` | `app/(public)/about/page.tsx` |
| `/contact` | `app/(public)/contact/page.tsx` |
| `/book` | `app/(public)/book/page.tsx` |
| `/privacy` | `app/(public)/privacy/page.tsx` |
| `/terms` | `app/(public)/terms/page.tsx` |

Admin (no route group):

| URL | File |
|---|---|
| `/admin` | `app/admin/page.tsx` (gated by `app/admin/layout.tsx`) |
| `/admin/onboarding` | `app/admin/onboarding/page.tsx` |
| `/admin/proposal` | `app/admin/proposal/page.tsx` |

Special:

| URL | File |
|---|---|
| `/sitemap.xml` | `app/sitemap.ts` |
| `/robots.txt` | `app/robots.ts` |
| 404 | `app/not-found.tsx` |

There is no `app/api/`. There is no middleware. There are no server actions.

## Components

Public surface (rendered on the public layout):

- `navbar.tsx` — top nav with scroll-hide and mobile drawer
- `footer.tsx` — site footer with link columns
- `hero.tsx` — home hero
- `tools-strip.tsx` — scrolling logo strip (uses `cdn.simpleicons.org`)
- `services.tsx` — six-service grid (with `preview` mode for home)
- `process.tsx` — 4-step process
- `roi-calculator.tsx` — sliders → $/year
- `portfolio.tsx` — 3 hardcoded case-study cards
- `portfolio-placeholder.tsx` — "more coming soon" panel
- `testimonials.tsx` — carousel (defined but **not currently rendered**)
- `cta-banner.tsx` — generic dark CTA
- `quote-form.tsx` — `/pricing` form
- `contact.tsx` — `/contact` form
- `booking-calendar-custom.tsx` — 3-step calendar used on `/book`
- `newsletter.tsx` — homepage newsletter form
- `pricing-faq.tsx` — `/pricing` FAQ
- `about-values.tsx` — `/about` values
- `page-hero.tsx` — reusable page header
- `page-transition.tsx` — route change animation
- `gradient-canvas.tsx` — fixed background canvas blobs
- `error-boundary.tsx` — class component error boundary
- `cookie-consent.tsx` — bottom-left consent banner
- `consent-gated.tsx` — wrapper that renders children only after consent
- `live-chat.tsx` — Tawk lazy-injector
- `floating-cta.tsx` — mobile-only floating "Book Free Call"
- `back-to-top.tsx` — scroll-aware top button
- `scroll-progress.tsx` — top progress bar
- `announcement-bar.tsx` — dismissible top banner
- `animated-text.tsx` — word/char reveal text
- `animated-bg.tsx` — large blurred blobs
- `aos-provider.tsx` — AOS initializer
- `gsap-provider.tsx` — Lenis + GSAP ticker wiring
- `section-divider.tsx` — horizontal rule
- `trust-bar.tsx` — `< 7 Days / 24/7 / 100%` strip

Admin surface:

- `components/admin/onboarding-form.tsx` — 5-section intake form
- `components/admin/proposal-output.tsx` — proposal render + actions
- `components/admin/proposal-sections.tsx` — 11 section cards

## Hooks

| File | Use |
|---|---|
| `hooks/useGSAP.ts` | Stagger scroll-in animation via GSAP |
| `hooks/useScrollReveal.ts` | Reveal `[data-reveal]` children on scroll |
| `hooks/useParallaxFloat.ts` | Mouse-driven parallax on a ref |

**Overlap note:** `lib/animations/useScrollReveal.ts` is a different implementation of the same name used by `components/animated-text.tsx` and `components/testimonials.tsx`. The `hooks/useScrollReveal.ts` and `hooks/useGSAP.ts` variants appear to be unused by current components.

## lib/

- `lib/supabase.ts` — lazy Supabase client
- `lib/booking-actions.ts` — `getAvailableSlots`, `createBooking`
- `lib/booking-types.ts` — types for booking flow
- `lib/booking-schema.sql` — DDL + 12-week seed
- `lib/admin-types.ts` — intake form types and option lists
- `lib/proposal-generator.ts` — Anthropic call + JSON parse
- `lib/gsap.ts` — server-safe GSAP re-export
- `lib/animations/gsap-setup.ts` — client GSAP setup (no reduced-motion handling)
- `lib/animations/gsap-config.ts` — client GSAP setup with reduced-motion handling
- `lib/animations/useScrollReveal.ts` — default `useScrollReveal` export
- `lib/animations/useNavScroll.ts` — scroll-direction hook for navbar

## Public config

- `public/_headers` — security headers + CSP
- `public/_redirects` — `/* /index.html 200`
- `public/hero-fallback.jpg` — open graph image (1200×630)
- `public/portfolio-*.jpg` — case study card images
- `public/icon.svg`, `public/favicon.svg`, `public/apple-icon.png`, `public/icon-{light,dark}-32x32.png` — favicons
- `public/placeholder*.{svg,png,jpg}` — generic placeholders

## docs/ (this phase)

| File | Purpose |
|---|---|
| `docs/51_AGENT_HANDOFF_LOG.md` | Append-only phase log |
| `docs/ARCHITECTURE.md` | Static-export architecture, route group, admin gate, data flow |
| `docs/SETUP.md` | Local dev, scripts, env, common pitfalls |
| `docs/ENVIRONMENT.md` | Every env var, required vs optional, security impact |
| `docs/DATABASE.md` | Supabase tables, RLS status, seed lifecycle |
| `docs/SECURITY.md` | Documented risks only — no fixes |
| `docs/FEATURES.md` | Public and admin feature inventory |
| `docs/DEPLOYMENT.md` | Cloudflare Pages deploy + post-deploy checks |
| `docs/ROADMAP.md` | Sequenced list of future work |
| `docs/QA_CHECKLIST.md` | Manual QA + future Playwright MCP candidate workflow |

## memory/ (this phase)

| File | Purpose |
|---|---|
| `memory/PROJECT_CONTEXT_PACK.md` | One-page orientation |
| `memory/WORKING_MEMORY.md` | Live scratchpad for the current session |
| `memory/SEMANTIC_MEMORY.md` | Stable project facts |
| `memory/EPISODIC_MEMORY.md` | Time-ordered event log |
| `memory/PROCEDURAL_MEMORY.md` | How we do things here |
| `memory/AGENT_IDENTITY_MEMORY.md` | How agents identify themselves |
| `memory/ACTIVE_TASK_CONTEXT.md` | The single in-flight task |
| `memory/CURRENT_STATE.md` | Snapshot of project state |
| `memory/IMPORTANT_DECISIONS.md` | Decision ledger |

## ai/ (this phase)

| File | Purpose |
|---|---|
| `ai/AI_TASK_CAPSULE.md` | Compressed briefing |
| `ai/AI_REPO_MAP.md` | This file |
| `ai/AI_FILE_OWNERSHIP.md` | Who owns what |
| `ai/AI_CONTEXT_RULES.md` | Do / don't rules |
| `ai/AI_CONTRACTS.md` | Contracts between agents, phases, and the human |

## repo-research/ (this phase)

- `repo-research/README.md` — scratchpad conventions

## Integrations (summary)

- **n8n** — single shared webhook for quote / contact / booking / newsletter
- **Supabase** — `bookings`, `available_slots`
- **Anthropic** — `claude-sonnet-4-6` from the browser
- **Tawk.to** — optional live chat, consent-gated
- **Cloudflare Pages** — deployment target
