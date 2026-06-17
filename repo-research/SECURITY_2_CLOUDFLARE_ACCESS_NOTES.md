# SECURITY 2 — Cloudflare Access Setup Notes (Admin Boundary)

**Phase:** Security 2 (A0 future phase #5; D-020a Cloudflare Access for fast internal admin protection).
**Status (2026-06-16):** Repo changes shipped. The local client-side password gate in `app/admin/layout.tsx` is downgraded to convenience-only and is explicitly labeled as such in the UI. `NEXT_PUBLIC_ADMIN_PASSWORD` is deprecated as a real security boundary. **No Cloudflare Access app has been created in this phase.** The owner creates the Cloudflare Access app in the Cloudflare Zero Trust dashboard before any non-internal launch. Setup steps are below.
**Author:** SECURITY-2-AUTH-AGENT.

---

## 1. Why Cloudflare Access (and not a new auth library)

This is a static-export site (`output: 'export'` in `next.config.mjs`). There is no server runtime, no Next.js API route, no middleware, no server function. Real auth must be enforced at the network edge, not in the bundle.

D-020a LOCKED DEFAULT (per `docs/PD1_DECISION_LOCK.md` and `repo-research/SECURITY_HARDENING_BRIEF.md`): **Cloudflare Access** for fast internal admin protection. Supabase Auth / magic link is the future option only if the admin tool becomes productized (it is currently internal-only per D-017).

Cloudflare Access is the right fit because:

- It is enforced at the Cloudflare edge, in front of the static export, with no code change to the bundle.
- It integrates with the operator's email identity (one-time pin or IdP) without adding a runtime dependency.
- It is free for the size of this site.
- It works with both the Pages deployment and the Cloudflare Worker route.

A new auth library (Auth.js, Supabase Auth, etc.) would require either a server runtime (which the static export does not have) or a Supabase Auth signup flow (which is productized, not internal-only). Neither fits the current model. Cloudflare Access is the right boundary.

---

## 2. What changed in the repo (Security 2)

### 2.1 Source changes

- `app/admin/layout.tsx` — the client-side password gate is **kept as a convenience gate** and **explicitly labeled as such** in the UI. The login form now shows a `ShieldCheck` notice ("Convenience gate only. Real admin protection is Cloudflare Access in front of `/admin/*` on the deployed site. This local check is not security."). The logout / dashboard header now shows a small chip ("Local gate · Cloudflare Access = primary"). A doc comment at the top of the file records the rule: this file is not real auth; do not promote it to real auth; do not introduce Supabase Auth, Auth.js, a server route, or any auth library.
- `workers/anthropic-proposal-proxy.ts` — a Security 2 doc comment was added to the header. The Worker source itself is **not** changed. The Worker is still gated to CORS / `ALLOWED_ORIGIN`. The comment records that Cloudflare Access in front of the Worker's route is the owner-side configuration that closes the Worker's auth boundary, and that a Worker-level session-token / Cloudflare Access JWT check is a future hardening step (intentionally not shipped in Security 2 because it requires deployment-time Access configuration the owner must verify before enabling).

### 2.2 Environment / docs changes

- `.env.local.example` — `NEXT_PUBLIC_ADMIN_PASSWORD` removed from the encouraged block. The line is preserved in a `DEPRECATED` block with a comment: "DEPRECATED as security; convenience-only if set."
- `docs/ENVIRONMENT.md` — `NEXT_PUBLIC_ADMIN_PASSWORD` row updated to "no (convenience only)" with a note that Cloudflare Access is the real boundary. "Deprecated / forbidden" section extended with R-001. "Security implications" section updated.
- `docs/SECURITY.md` — Security 2 status banner added. R-001 moved to a "Closed risks" section with a Security 2 resolution. F-002 marked implemented. R-007 CSP description updated to reflect the new `connect-src` (no more `api.anthropic.com`; `*.workers.dev` for the Worker).
- `docs/DEPLOYMENT.md` — new "Cloudflare Access (Security 2) — admin boundary" section with the owner-side setup steps and the post-deploy Access verification check. "What is not part of the deploy" section updated to mention Access.
- `INTEGRATION_NOTES.md` — see §4 below.
- `repo-research/SECURITY_1_WORKER_PROXY_NOTES.md` — the Security 2 dependency section was rewritten to reflect that admin auth (D-020a) is now Cloudflare Access, and that Worker-level session-token / Cloudflare Access JWT verification is a follow-up (owner-side deployment prerequisite). The Security 2 follow-up checklist was updated to mark admin auth as done for the admin path and to leave Worker-level JWT verification as a future hardening step.

### 2.3 Not changed (out of Security 2 scope)

- `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, eslint / tailwind configs — **not** modified.
- `app/admin/page.tsx`, `app/admin/onboarding/page.tsx`, `app/admin/proposal/page.tsx` — **not** modified. The page-level components rely on `app/admin/layout.tsx` for the convenience gate; they did not need to change.
- `lib/` (other than the Worker source doc comment), `components/`, `hooks/`, `public/`, `styles/` — **not** modified. No real `.env*` change (only the example).
- `tests/`, `.github/`, CI config — **not** modified.
- `.mcp.json`, `.opencode/`, `.codex/`, `.claude/` — **not** modified.
- Supabase Auth / Auth.js / any auth library — **not** added. **Not** installed. No npm install.
- Cloudflare Access application in the Cloudflare dashboard — **not** created in this phase. The owner creates it.

---

## 3. Owner-side Cloudflare Access setup steps

The repo does not create the Access app. The owner creates it in the Cloudflare dashboard. These steps are the minimal correct setup for a single-operator internal admin tool.

### 3.1 Create the Access application

1. Open the Cloudflare Zero Trust dashboard: <https://one.dash.cloudflare.com/>.
2. Go to **Access → Applications**.
3. Click **Add an application → Self-hosted**.
4. Fill in:
   - **Application name:** `codeoutfitters-admin` (or any name you prefer).
   - **Application domain:** the site hostname. For example:
     - `codeoutfitters.com` (apex)
     - `www.codeoutfitters.com` (www subdomain) — only if you serve the site from both
   - **Path:** `/admin/*`
5. Click **Next**.

### 3.2 Configure identity

6. **Identity providers:** enable the providers that match your IdP. For a single-operator internal tool, the simplest is **One-time PIN** (Cloudflare sends a 6-digit PIN to the operator's email). If you already have an IdP (Google Workspace, Okta, Azure AD), enable the matching provider and disable the others.
7. Click **Next**.

### 3.3 Configure the policy

8. **Policy name:** `admin-allowlist` (or any name you prefer).
9. **Action:** `Allow`.
10. **Session duration:** keep short. **1 hour** is a reasonable default. Re-auth on sensitive actions.
11. **Assign a group or person:** enter the operator's email address (e.g. `tayyab@codeoutfitters.com`) and any other approved operator emails. **Do not** add a wildcard or a wide group; the admin path is internal-only (D-017).
12. Click **Next → Save**.

### 3.4 Optional: protect the Worker route (recommended)

If the Worker is reachable on a separate subdomain (e.g. `https://anthropic-proposal-proxy.<account>.workers.dev`), the Worker route is **not** protected by the Pages-route Access application. Add a **second** Access application in front of the Worker route.

1. **Add an application → Self-hosted**.
2. **Application domain:** the Worker subdomain (e.g. `anthropic-proposal-proxy.<account>.workers.dev`).
3. **Path:** `/*` (the Worker has a single route at `/`).
4. **Identity providers:** same as the admin app.
5. **Policy:** `Allow` for the same operator email(s). Same session duration.
6. Save and test.

If the Worker is reachable only via the Pages route (i.e. the same hostname as the site), the Pages-route Access application is sufficient and this step can be skipped.

### 3.5 Test the Access boundary

From a private / incognito browser window:

1. Visit `https://codeoutfitters.com/admin` without an Access session.
   - Expect: the Cloudflare Access login page (or a 403). **Not** the admin password gate.
2. Complete the Access login with the approved operator email.
3. Expect: the admin password-gate UI (the local convenience gate). The local gate is convenience-only; the Access session is the boundary.
4. Enter `NEXT_PUBLIC_ADMIN_PASSWORD` (or whatever the local gate expects) and unlock the dashboard.
5. Verify: `/admin/onboarding` and `/admin/proposal` are also accessible behind the same Access session.

In a second incognito window, verify:

6. Visit `https://codeoutfitters.com/` (home), `/services`, `/pricing`, `/portfolio`, `/about`, `/contact`, `/book`, `/privacy`, `/terms` — all accessible without Access.
7. Visit `https://codeoutfitters.com/admin` without Access — Access login (or 403).
8. If the Worker has a separate subdomain, visit `${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/` without Access — Access login (or 403). With Access, expect a Worker response (POST to that endpoint without a valid `Origin` still returns `403 origin_not_allowed`; the Worker's CORS gate is independent of Access).

### 3.6 Verify `localStorage` data is not the boundary

9. Open DevTools → Application → Local Storage. Confirm `co_admin_auth` is empty (or contains the value only after the user submits the convenience gate).
10. Confirm that clearing the local convenience gate's stored password does **not** bypass the Access boundary. The Access session is a cookie set by the Cloudflare edge; it is not stored in the app's `localStorage`. Clearing `co_admin_auth` should only force the user back through the convenience gate UI, not bypass Access.
11. Confirm that an attacker who can set `co_admin_auth` to the right value in their own browser still gets blocked by Cloudflare Access at the edge. The Access login page is the first thing the attacker sees.

---

## 4. Rollback plan

If Cloudflare Access causes a regression in production:

1. **Temporarily disable the Access application** in the Cloudflare Zero Trust dashboard (set the policy to `Bypass` or unblock the path). This restores the local-convenience-gate-only state and the broken-build / broken-deploy risk is gone.
2. **Re-enable Access** once the regression is identified and fixed.
3. **If Access is misconfigured for a long time:** the repo changes are still in place. The convenience gate in `app/admin/layout.tsx` is still labeled as convenience-only. `NEXT_PUBLIC_ADMIN_PASSWORD` is still deprecated as security. The site is not in a worse state than before Security 2.

There is no destructive repo rollback. The owner can `git revert` the Security 2 commit (when / if the owner decides to commit) and the convenience gate will return to its pre-Security-2 form, with the security warning in `docs/SECURITY.md` and the post-deploy check still flagging Access as mandatory.

---

## 5. Known remaining risks (post-Security 2)

- **Cloudflare Access still needs owner-side setup / deployment.** Security 2 ships repo changes; the Access app must be created in the Cloudflare dashboard. See §3.
- **Supabase RLS still blocked.** R-003 (anon key has full read/write on `bookings` and `available_slots`) is open. Security 3 is the next gate. Not in Security 2 scope.
- **n8n secret/header still blocked.** R-005 (single shared webhook for four form types, no signing) is open. Security 4 is the next gate. Not in Security 2 scope.
- **Worker endpoint auth may still need deployment-level Access protection.** If the Worker is reachable on a separate subdomain, the owner should add a second Access application in front of it (see §3.4). Until that is in place, the Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. The Worker source is structured to add a Worker-level session-token / Cloudflare Access JWT check (additive) as a future hardening step. The comment at the top of `workers/anthropic-proposal-proxy.ts` documents the contract.
- **`localStorage` data leakage.** The convenience gate stores the password in `localStorage.co_admin_auth`. This is convenience-only and is not security. An attacker who can read the user's `localStorage` (e.g. via a future XSS or via a shared machine) can bypass the convenience gate. Cloudflare Access is the real boundary; the convenience gate is not.
- **No tests / no build run in Security 2.** The owner runs the build and the post-deploy checks.
- **R-004 (booking double-booking) still open.** Not in Security 2 scope; addressed by Booking A.
- **R-005, R-006, R-007, R-008, R-009, R-010, R-011..R-035** still open; addressed by future phases per A0 plan.

---

## 6. Security 2 vs Security 1 — auth boundary scope

| Layer | Security 1 (Worker) | Security 2 (Access) |
|---|---|---|
| Anthropic API key protection | Server-side (`ANTHROPIC_API_KEY`); R-002 closed. | (out of scope; already closed) |
| Browser → Worker transport | CORS via `ALLOWED_ORIGIN` env var; 403 for non-allowed origins. | Cloudflare Access in front of the Worker route (if separate subdomain); otherwise Pages-route Access is sufficient. |
| Admin gate (real boundary) | (out of scope) | **Cloudflare Access in front of `/admin/*`.** R-001 addressed at the deployment level. |
| Local convenience gate | (out of scope) | Explicitly labeled convenience-only in `app/admin/layout.tsx`. `NEXT_PUBLIC_ADMIN_PASSWORD` deprecated as security. |
| Session-token verification in the Worker | (out of scope; future hardening) | Not shipped. Documented as a follow-up. The Worker's `ALLOWED_ORIGIN` is the only server-side auth check. |
| New npm dependencies | None. Native `fetch` only. | None. No Auth.js, no Supabase Auth, no auth library. |
| Deployment | Worker deploy is owner-driven. | Cloudflare Access app is owner-driven. |

---

## 7. Sign-off

Security 2 ships repo changes (downgraded convenience gate, deprecated env var, updated docs, Access setup notes). It does not create a Cloudflare Access app. The owner creates the Access app in the Cloudflare Zero Trust dashboard before any non-internal launch. The local convenience gate keeps the admin out of casual view on `localhost:3005` and on the deployed site until Access is in place; it is **not** security. The real boundary is Cloudflare Access.
