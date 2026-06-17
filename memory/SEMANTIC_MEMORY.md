# Semantic Memory

Stable, project-wide facts. Slow-changing. Update only when the underlying fact changes, not on every task.

## Identity

- **Project name:** CodeOutfitters
- **Legal entity:** CodeOutfitters LLC (per `app/(public)/terms/page.tsx`)
- **Domain:** `https://codeoutfitters.com` (per `app/layout.tsx`, `app/sitemap.ts`, `app/(public)/layout.tsx` JSON-LD)
- **Contact email:** `hello@codeoutfitters.com`
- **Geographic focus:** US small businesses
- **Service area:** US (per JSON-LD `areaServed: 'US'`)
- **Owner / operator:** Tayyab (referenced in `.env.local.example:3`, `components/admin/proposal-output.tsx:179`)

## Business model

- AI automation agency. Custom builds delivered in 7 days (14 days for complex multi-system builds).
- Pricing is per-project, scoped upfront. No published price list — `pricing` page hosts the quote request form.
- Typical engagement: discovery call → custom scope → build → ongoing support.
- Workflow tools advertised: WhatsApp automation, email workflows, AI chatbots, booking bots, invoice automation, custom builds.
- Voice: results-first, anti-hype, ownership-promised ("you own 100% of every workflow, credential, and connection").

## Tech identity

- **Framework:** Next.js 16.2.6, App Router
- **Build target:** static export (`next.config.mjs: output: 'export'`)
- **Runtime:** browser-only. No `app/api/` directory. No serverless functions. No middleware.
- **Language:** TypeScript 5.7.3, strict
- **UI library:** Tailwind v4 + shadcn/ui config (new-york style, neutral base) + framer-motion + lucide-react
- **Animation stack:** GSAP 3 + ScrollTrigger + Lenis (smooth scroll) + AOS
- **Database:** Supabase (Postgres, REST)
- **Form workflow:** n8n (single shared webhook)
- **AI:** Anthropic API (claude-sonnet-4-6) called directly from the browser
- **Live chat (optional):** Tawk.to
- **Deployment target:** Cloudflare Pages (per `DEPLOY.md` and `public/_headers`, `public/_redirects`)

## Project shape

- Single package, single Next.js app, no monorepo.
- Public routes live in `app/(public)/...` (route group, no URL impact).
- Admin routes live in `app/admin/...` (no route group; URL is `/admin/...`).
- All admin state is `localStorage`-backed. No admin database.
- No test directory. No CI configuration. No lint configuration file in repo (script exists in `package.json` only).

## Color and brand tokens

- Primary: `#2A6B5A` (emerald)
- Accent: `#C8A96E` (warm gold)
- Background: `#FAFAF7` (warm off-white)
- Surface: `#F5F0EB` (sand)
- Text: `#1C1612` / `#6B6155` / `#9B9088`
- Font: Inter, weights 400/500/600/700/800/900
- Tokens are defined in `app/globals.css` `:root` and consumed throughout.

## Delivery commitments (publicly stated)

- 7-day delivery for standard projects.
- 14-day upper bound for complex multi-system builds.
- 30-day support included.
- "You own everything" — no lock-in.
- Free workflow audit with every discovery call.
- 4-hour response guarantee on business days.

## Design and motion direction (owner-stated, not yet implemented)

- **Brand posture:** premium AI automation agency. Modern, bold, high-energy. More animated than a typical SaaS site. Professional for US small-business clients; cool enough to feel high-end.
- **Motion direction (D-011):** inspired by `befluence.pro` as a motion/interaction reference. Not a copy. Hero entrance, animated headline reveal, scroll-triggered section reveals, smooth parallax, floating cards, animated service cards, horizontal marquees, animated stat counters, magnetic hover buttons, smooth page transitions, portfolio cards with motion depth, process timeline animation, ROI micro-interactions, contact/booking form transitions. Admin motion stays lighter and faster.
- **Design taste (D-012):** guided by Impeccable (frontend review) and Emil Kowalski / Agents with Taste (motion taste). Non-AI-slop target. See `memory/IMPORTANT_DECISIONS.md` for full avoid/prefer list.
- **Performance rules (motion must obey):** GPU-friendly transforms, no layout-shifting animation, no bundle bloat, mobile-friendly, respect `prefers-reduced-motion`, visually tested before approval.
- **Animation libraries on the table (no new ones yet):** GSAP, ScrollTrigger, `@gsap/react`, Framer Motion, AOS, Lenis. All already in `package.json`.
- **Future tooling loop (not approved):** Playwright MCP + Chrome DevTools MCP for browser-based motion review. Create → open in browser → critique with Impeccable + taste rules → improve → repeat.
