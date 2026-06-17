# Project Context Pack — CodeOutfitters

One-page orientation. Read this first when resuming work.

## What this is
CodeOutfitters is a US small-business AI automation agency. The repo is its marketing website and a single-operator internal admin tool, all in one Next.js 16 app with `output: 'export'` for Cloudflare Pages.

## What the user sees
- Marketing pages: home, services, pricing/quote, portfolio, about, contact, book, privacy, terms, 404.
- Three conversion paths: quote form, contact form, 3-step booking calendar.
- A ROI calculator, sample case studies, FAQs, a testimonials carousel (carousel exists in code but is not currently rendered on the home page).

## What the operator sees
- `/admin` is gated by a password compared client-side against `NEXT_PUBLIC_ADMIN_PASSWORD`. Stored in `localStorage` after success.
- `/admin/onboarding` is a 5-section intake form (Prospect, Pain, Tech, Vision, Internal Notes). Saves to `localStorage` (`co_onboarding_data`).
- `/admin/proposal` reads that intake and calls Anthropic's `claude-sonnet-4-6` directly from the browser. Renders an 11-section proposal with copy/print/email actions.
- "Recent Proposals" tile on the admin dashboard is marked **Coming soon**.

## How data flows
- Quote / contact / newsletter → single shared `NEXT_PUBLIC_N8N_WEBHOOK_URL`.
- Booking → same webhook **and** Supabase `bookings` + `available_slots` tables.
- Proposal → Anthropic API in the browser.
- Optional Tawk.to live chat, gated behind cookie consent.

## Constraints to remember
- Static export means **all `NEXT_PUBLIC_*` env vars end up in the shipped JS bundle**.
- No server functions, no middleware, no API routes — the repo has no `app/api/`.
- Lockfiles: both `package-lock.json` and `pnpm-lock.yaml` are committed.
- No test framework installed.
## Tone and brand

- Emerald green (`#2A6B5A`) + warm gold accent (`#C8A96E`) on warm off-white (`#FAFAF7`).
- Inter font. Tasteful. No AI-slop patterns. Hand-tuned copy.
- Voice: warm, direct, anti-hype, US small-business focused.

## Design and motion posture (owner-stated, not yet implemented)

- **Premium agency feel.** More animated than a typical SaaS site. Smooth scroll-driven storytelling. Bold, high-energy, but professional for US small-business clients.
- **Motion direction (D-011)** — inspired by `befluence.pro` (reference only, do not copy). Hero entrance, animated headline, scroll-triggered reveals, parallax, floating cards, magnetic buttons, marquees, stat counters, portfolio motion depth, ROI micro-interactions, form transitions.
- **Taste direction (D-012)** — guided by Impeccable (frontend review) and Emil Kowalski / Agents with Taste (motion taste). Avoid generic AI-SaaS looks. Prefer strong typography, clear hierarchy, purposeful animation.
- **Constraints still apply:** GPU-friendly transforms, no layout shift, no bundle bloat, mobile-friendly, `prefers-reduced-motion` respected, visually tested before approval.
- **Future tool loop (not approved):** Playwright MCP + Chrome DevTools MCP, browser-based review.

## Phase we are in

**DOC-MEMORY-REPAIR.** No code. No installs. No deletes. No design implementation. Just docs, memory, and AI context. The motion and taste direction is captured for a future **UIX0 / MOTION0** phase, gated behind ChatGPT Control Room approval.