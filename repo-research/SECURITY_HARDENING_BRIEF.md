# SECURITY HARDENING BRIEF

> The repo currently has 10 documented security risks (R-001 to R-010) plus additional related risks (R-011, R-016, R-018, R-029). This brief is input for PM1. **Do not implement any security change in the current batch.**

## 1. Current Security Model

- **Deployment model:** Next.js 16 with `output: 'export'`. Build artifact is `out/`, deployed to Cloudflare Pages.
- **Trust boundary:** every `NEXT_PUBLIC_*` env var is inlined into the static JS bundle at build time. There is no server runtime, no middleware, no API routes, no edge functions, no server actions in the repo.
- **Auth model:** none. The admin tool is gated by a client-side `localStorage` flag compared to a `NEXT_PUBLIC_*` env var.
- **Data persistence:**
  - Public form submissions: `n8n` webhook (single URL shared by 4 forms).
  - Bookings: `Supabase` `bookings` + `available_slots` tables.
  - Admin intake and proposal drafts: browser `localStorage`.
- **Outbound calls:** Supabase REST, Anthropic `api.anthropic.com`, n8n webhook, Tawk embed (optional). `public/_headers` enforces a tight CSP at the production edge only.

## 2. Known Security Risks

This section restates the documented risks and points at the canonical place. Full text is in `docs/SECURITY.md` and `repo-research/RISK_REGISTER.md`.

- **R-001 / R-003 — `NEXT_PUBLIC_ADMIN_PASSWORD` is in the bundle.** `app/admin/layout.tsx:21,33` compares the visitor's `localStorage.co_admin_auth` to the env var. Anyone can read the source and bypass the gate. Effective security: zero.
- **R-002 / R-004 — `NEXT_PUBLIC_ANTHROPIC_API_KEY` is in the bundle.** `lib/proposal-generator.ts:6` uses it for a direct browser call. Key is public. Usage is billed to the owner.
- **R-005 — Booking double-book.** Not a confidentiality breach, but a data-integrity bug.
- **R-006 — Supabase RLS not enabled.** Anon key has full read/write on `bookings` and `available_slots`.
- **R-016 — Static export limitations.** No server functions, no middleware, all secrets in bundle.
- **R-017 — n8n single-webhook contract risk.** No signing, no per-form secret, payload shape discrimination only.
- **R-018 — Admin `localStorage` persistence limitation.** Shared browser = shared data; data lost on browser reset.
- **R-029 — Admin `localStorage` value is the password itself.** Not a hash, not a token.

The project also has the following related but not security-first risks:

- **R-007 — Seed exhaustion.**
- **R-008 / R-009 — No tests / no CI.**
- **R-010 — No monitoring.**
- **R-020 — CSP must be updated when new endpoints are added.**

## 3. Recommended Future Architecture Options

### A. Keep static export, accept risks for internal-only demo

- **What:** ship as-is, document the risk, restrict admin to a private machine.
- **Pros:** zero code change, zero infra cost.
- **Cons:** R-001 to R-004 remain. R-002 (Anthropic key) is a billing risk if anyone finds the bundle. Not safe to expose to a non-internal audience.
- **Cost:** zero engineering. Possible ongoing cost from key abuse.

### B. Use Cloudflare Worker proxy for Anthropic / admin protection

- **What:** keep static export. Add a small Cloudflare Worker. The admin UI POSTs the proposal request to the Worker; the Worker holds the Anthropic key as a server-side secret and forwards to Anthropic. Optionally the Worker also serves an auth check.
- **Pros:** minimal change to the static app. Key is no longer in the bundle. Auth can be added at the Worker edge (Cloudflare Access or a simple shared secret + IP allow-list).
- **Cons:** requires owning a Worker; new operational surface. Still a custom auth model; need to choose.
- **Cost:** Cloudflare Workers free tier is enough for current volume.

### C. Drop static-only export; use a Next.js server route

- **What:** remove `output: 'export'` from `next.config.mjs`. Add `app/api/...` server routes for the Anthropic call and the admin gate. Deploy to a Next.js host (Vercel, Cloudflare Pages with `runtime: 'nodejs'`, or Node on Fly.io).
- **Pros:** standard Next.js model. Server-side secrets stay on the server. Auth is straightforward.
- **Cons:** bigger infra change. Loses the cheapest hosting. Existing CSP / `public/_headers` model is partially redundant.
- **Cost:** new host bill, more moving parts.

### D. Use Supabase Auth / magic link for admin

- **What:** keep static export. Add Supabase Auth. Admin signs in via magic link. The admin UI reads the Supabase session. Optionally the Supabase service role keys the Anthropic call via an Edge Function.
- **Pros:** no custom auth code. Battle-tested. Free tier covers a single operator.
- **Cons:** adds a Supabase dependency for auth. The Anthropic call still needs a server boundary, so this combines with B.
- **Cost:** Supabase free tier.

### E. Use external automation / auth service only if explicitly approved

- **What:** evaluate Clerk, WorkOS, Auth0, etc.
- **Pros:** no auth code to write.
- **Cons:** paid tools are not approved by default (D-009). Adds vendor lock-in. Probably overkill for a single-operator tool.
- **Cost:** paid.

## 4. Recommended Path For This Project

**Recommendation: B + D combined, in that order.**

1. **First move — Option B (Worker proxy).** Move the Anthropic call behind a Cloudflare Worker. Keep the static export. The admin UI changes from a direct Anthropic call to a Worker call. This removes R-002 / R-004. Cost: low.
2. **Second move — Option D (Supabase Auth).** Replace the `localStorage` password gate with a Supabase magic-link sign-in. The admin layout reads the Supabase session. This removes R-001 / R-003 / R-029. Cost: low.
3. **Third move — Supabase RLS.** Once auth is in place, enable RLS. Anon gets `USING (false)` on `bookings` and `available_slots`. Inserts are done by the browser only via an RPC the anon role can call with strict validation. This removes R-006.
4. **Fourth move — Booking correctness.** UI reads `available_slots`; later move to a transactional RPC. This removes R-005.

Option A is acceptable **only** if the admin tool is guaranteed to remain internal-only and the Anthropic key is treated as a public, rotatable secret. That is a known compromise, not a permanent posture.

Options C and E are heavier than this project needs. C is appropriate if the team expects more server-side work later. E is appropriate only if the owner approves a paid vendor.

This is a recommendation, not a decision. The owner must confirm.

## 5. Required Owner Decisions

1. Is the admin tool internal-only forever, or will it become client-facing?
2. Acceptable to add a Cloudflare Worker? (Default: yes.)
3. Acceptable to use Supabase Auth? (Default: yes.)
4. Acceptable to require magic-link sign-in for `/admin`? (Default: yes.)
5. Is a paid vendor (Clerk, WorkOS, Auth0) ever acceptable? (Default: no.)
6. Is rotating the Anthropic and Supabase keys acceptable as a short-term mitigation? (Default: yes.)

## 6. Required Gate Before Implementation

- PM1 to recommend the path.
- ChatGPT Control Room to approve the path and the budget.
- A dedicated security-hardening phase (post-PM1, post-approval) to perform the work.
- Each security change ships as its own PR with a clear before/after in `docs/SECURITY.md`.

**No security change in this batch. No new dependencies. No lockfile change. No Cloudflare Worker setup.**

## 7. Acceptance Criteria

A future security-hardening phase is complete when, in priority order:

1. R-002 / R-004 are mitigated: the Anthropic key is no longer in the static bundle. `NEXT_PUBLIC_ANTHROPIC_API_KEY` is removed from the build output.
2. R-001 / R-003 / R-029 are mitigated: the admin gate is not a `localStorage` plaintext comparison. A real auth flow is in place. `NEXT_PUBLIC_ADMIN_PASSWORD` is removed from the build output.
3. R-006 is mitigated: Supabase RLS is enabled. The anon role cannot read or write `bookings` or `available_slots` directly. Inserts go through a controlled path.
4. R-005 is mitigated: the booking UI respects `available_slots.is_booked` and a future transactional RPC prevents double-booking.
5. R-017 is mitigated: the n8n webhook is signed or replaced with per-form URLs.
6. R-020 is mitigated: a CI guard fails the build if `public/_headers` does not include every external endpoint the app calls.
7. `docs/SECURITY.md` is updated to reflect the new posture. Closed risks move to a "Closed" section in `repo-research/RISK_REGISTER.md`.
8. A post-deploy smoke test verifies the new auth path, the Worker proxy, and the RLS-denied anon read.
