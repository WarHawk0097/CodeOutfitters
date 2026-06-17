# SECURITY 1 — Cloudflare Worker Proxy Notes (Anthropic Proposal Generation)

**Phase:** Security 1 (A0 future phase #4; D-019a Cloudflare Worker proxy for Anthropic).
**Status (2026-06-16):** Worker source shipped. Frontend updated. Documentation updated. CSP updated. **No deployment was performed in this phase.** The Worker needs to be deployed to Cloudflare before the frontend can use it. Deployment is owner-driven.
**Author:** SECURITY-1-WORKER-AGENT.

---

## 1. Worker purpose

The previous architecture had the browser calling `https://api.anthropic.com/v1/messages` directly with the `x-api-key` header set to `NEXT_PUBLIC_ANTHROPIC_API_KEY`. Because the project uses `output: 'export'`, every `NEXT_PUBLIC_*` env var is inlined into the static JS bundle and shipped to every visitor. The Anthropic API key was therefore public, and anyone with the key could call Anthropic and bill the owner (R-002).

Security 1 replaces that direct call with a Cloudflare Worker proxy:

- The browser calls the Worker (`${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/`).
- The Worker holds the Anthropic API key as a server-side secret (`ANTHROPIC_API_KEY`).
- The Worker calls Anthropic server-side and returns the response to the browser.
- The browser never holds the key, and the static bundle no longer contains it.

The Worker enforces `ALLOWED_ORIGIN` server-side (CORS gate). CORS is not authentication. The Worker is still gated to Security 2 (admin auth) before launch.

---

## 2. Files changed

### Created

- `workers/anthropic-proposal-proxy.ts` — the Worker source. Native `fetch` only. No npm dependencies. No `package.json` change. Deployable as-is with `wrangler deploy`.

### Modified

- `lib/proposal-generator.ts` — replaced direct Anthropic call with a thin client that posts to `${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/`. Returns the same `ProposalOutput` shape so `components/admin/proposal-output.tsx` is unchanged.
- `.env.local.example` — added `NEXT_PUBLIC_PROPOSAL_WORKER_URL` placeholder; removed the encouraged public `NEXT_PUBLIC_ANTHROPIC_API_KEY`; left the old key as a commented "DEPRECATED; do not set" line for migration clarity.
- `docs/ENVIRONMENT.md` — split env vars into "Frontend env vars" and "Worker env vars"; added the Worker table; deprecated `NEXT_PUBLIC_ANTHROPIC_API_KEY`; added Worker dev / production notes.
- `docs/SECURITY.md` — added a Security 1 status banner; moved R-002 to a "Closed risks" section with a Security 1 resolution; marked F-001 implemented.
- `docs/DEPLOYMENT.md` — added a "Cloudflare Worker (Security 1)" section; updated the static-asset / CSP note to reflect that the browser no longer connects to `api.anthropic.com`; updated the post-deploy check to include a Worker reachability check; updated the "What is not part of the deploy" section to call out the one Cloudflare Worker.
- `INTEGRATION_NOTES.md` §8.1 — marked the Anthropic Worker path as SHIPPED 2026-06-16; kept the closure list.
- `public/_headers` — removed `https://api.anthropic.com` from `connect-src`; added `https://*.workers.dev` so the browser can reach any Cloudflare Worker subdomain.

### NOT modified

- `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, eslint / tailwind configs, `app/admin/proposal/page.tsx`, `components/admin/proposal-output.tsx`, `hooks/`, `lib/` (other than `proposal-generator.ts`), `public/` (other than `_headers`), `styles/`, `.env*` (only the example was touched, not real env files), `.mcp.json`, `.opencode/`, `.codex/`, `.claude/`, `tests/`, `.github/`, all other `app/**` and `components/**` files.

---

## 3. Env vars required in the Cloudflare Worker

Bind these in the Worker (Cloudflare dashboard → Worker → Settings → Variables, or `wrangler secret put` for secrets).

| Var | Required? | Type | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | secret | Anthropic API key. Server-side only. Never exposed to the browser. |
| `ALLOWED_ORIGIN` | yes | var | Comma-separated list of allowed `Origin` values. The Worker only responds to CORS preflight and actual requests whose `Origin` header matches an entry. Example: `https://codeoutfitters.com,https://www.codeoutfitters.com`. |
| `ANTHROPIC_MODEL` | no | var | Anthropic model id. Defaults to `claude-sonnet-4-6`. |

Local Worker dev (`wrangler dev`):

- Use a `.dev.vars` file (gitignored) with the same vars. Cloudflare reads it automatically during `wrangler dev`.

**Never** put `ANTHROPIC_API_KEY` in:

- `.env.local`
- The Cloudflare Pages dashboard
- The static bundle
- Any frontend env var (`NEXT_PUBLIC_*`)

---

## 4. Env vars required in the Cloudflare Pages frontend

Set in Cloudflare Pages → Settings → Environment variables (Production and Preview).

| Var | Required? | Value |
|---|---|---|
| `NEXT_PUBLIC_PROPOSAL_WORKER_URL` | yes | The public Worker URL, e.g. `https://anthropic-proposal-proxy.<account>.workers.dev` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | (unchanged from before Security 1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | (unchanged) |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | yes | (unchanged) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | no (convenience only) | Deprecated as a real auth boundary. Cloudflare Access in front of `/admin/*` is the real boundary. The local client-side gate is convenience-only. See `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md` and `docs/SECURITY.md` (R-001). |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | no | (unchanged) |

**`NEXT_PUBLIC_ANTHROPIC_API_KEY` is DEPRECATED.** Do not set it. The Worker holds the key.

---

## 5. Deployment steps for the owner (later, after Security 1 is approved)

These steps are not part of Security 1 — Security 1 is the code + docs + CSP phase. Deployment is owner-driven. The steps are listed here so the owner has a single reference.

### Worker

1. Install `wrangler` locally if not already (out of scope for Security 1; the Worker source itself is dependency-free).
2. From the repo root, edit or create `wrangler.toml` for the Worker (not yet present; this is a deployment concern, not a Security 1 concern). A minimal `wrangler.toml` for the Worker will be added in a future phase that handles Worker deploy. Security 1 ships the Worker source only.
3. Bind secrets in Cloudflare:
   - `wrangler secret put ANTHROPIC_API_KEY` (paste the key when prompted)
   - In the Cloudflare dashboard → Worker → Settings → Variables, add `ALLOWED_ORIGIN` with the comma-separated list of allowed origins. Add `ANTHROPIC_MODEL` only if you want a different model.
4. Deploy the Worker (`wrangler deploy` or via the Cloudflare dashboard). Capture the Worker URL — it looks like `https://anthropic-proposal-proxy.<account>.workers.dev`.
5. Verify the Worker with `curl`:
   - `curl -i -X POST -H 'Origin: https://codeoutfitters.com' -H 'Content-Type: application/json' --data '{"intakeData":{...}}' https://anthropic-proposal-proxy.<account>.workers.dev/`
   - Expect `200` with the 11-section proposal JSON.
   - A request with a non-allowed `Origin` should return `403 {"error":"origin_not_allowed"}`.

### Frontend (Cloudflare Pages)

1. Set `NEXT_PUBLIC_PROPOSAL_WORKER_URL` in Cloudflare Pages → Settings → Environment variables (Production and Preview). Value: the Worker URL from step 4 above.
2. Trigger a new Pages build (or push to main; whatever the operator's normal flow is).
3. Verify in the browser DevTools that the static bundle no longer contains `ANTHROPIC_API_KEY` (search the bundle source for that string). The bundle should reference the Worker URL only.
4. Log in to `/admin` and generate a proposal. Expect the 11-section JSON in the UI.

---

## 6. Rollback plan

If the Worker causes a regression in production:

1. Revert the Cloudflare Pages deploy to the previous successful deploy (Cloudflare Pages → Deployments → select prior deployment → ⋯ → Rollback to this deploy). This restores the previous `lib/proposal-generator.ts` shape and the previous `_headers` only if the previous build was the pre-Security-1 build.
2. If the previous successful deploy is also post-Security-1, manually set `NEXT_PUBLIC_ANTHROPIC_API_KEY` in the Pages dashboard and revert `lib/proposal-generator.ts` to call Anthropic directly. (This is the escape hatch; it is intentionally ugly because the static-bundle model is the long-term failure mode the Worker is meant to remove.)
3. Disable or delete the Worker if it must be taken offline entirely (Cloudflare dashboard → Worker → Settings → Delete). Note: this is a destructive action; prefer disabling the route first.

A future phase may add a feature flag (e.g. `NEXT_PUBLIC_PROPOSAL_MODE=worker|direct`) to make rollback a one-env-var change rather than a code change. Out of scope for Security 1.

---

## 7. Known remaining risks

- **CORS is not authentication.** The Worker enforces `ALLOWED_ORIGIN` server-side, but anyone who can set a matching `Origin` header can request a proposal. Security 2 (admin auth) is the next gate and must close this. Until Security 2 ships, the Worker is exposed to anyone who can forge an allowed `Origin` header from a browser they control.
- **No rate limiting.** The Worker does not rate-limit by IP or by request count. Anthropic upstream may rate-limit. The owner may add Cloudflare's built-in rate-limiting rules at the Worker level in a future phase.
- **No logging policy.** Cloudflare Workers log request metadata by default. The Worker does not log request or response bodies. If the owner wants to send Worker logs to a destination (Sentry, logpush, etc.), that is a future phase.
- **No request signing.** The Worker trusts the `Origin` header. A request with an allowed `Origin` is served. A future phase may add a header-based request signature (HMAC of a timestamp + payload) to harden the Worker against origin spoofing at the network level.
- **No tests / no build run in Security 1.** The Worker source was not deployed. The frontend was not built. The CSP change in `public/_headers` was not deployed. Smoke tests are listed in §9 and are owner-driven.
- **Anthropic key rotation.** The Worker holds the key. Key rotation is now an Operator action in the Cloudflare dashboard (or `wrangler secret put`). It is no longer "ship a new static bundle". This is a strict improvement over the pre-Security-1 model.
- **CSP wildcard.** `connect-src` allows `https://*.workers.dev` (any Cloudflare Worker subdomain). This is a small but real loosening of the `connect-src` directive. It is the standard practice for Cloudflare Worker integrations. The owner may tighten it to a specific Worker URL once the URL is known.

---

## 8. Security 2 dependency

Security 2 (2026-06-16) addressed the **admin boundary**: Cloudflare Access is now the real admin protection in front of `/admin/*` on the deployed site. The local client-side gate in `app/admin/layout.tsx` is now explicitly labeled convenience-only; it is no longer documented as security. See `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md` for the owner-side setup.

The Worker auth boundary is a separate, narrower concern:

- The Worker trusts the `Origin` header. Anyone with a browser who can match an `ALLOWED_ORIGIN` entry can request a proposal. The browser will block cross-origin requests via CORS, but a browser attacker controls their `Origin` header.
- The real Worker auth boundary is **Cloudflare Access in front of the Worker's route** (either as a separate Access application on the Worker subdomain, or via the Pages route that fronts the Worker). This is an **owner-side deployment configuration**, not a code change. The owner's Cloudflare Access setup is what closes it.
- The Worker source is structured to make Worker-level session-token / Cloudflare Access JWT verification additive (a single check at the top of `fetch(request, env)` after the CORS gate). The doc comment at the top of the Worker describes the contract. The implementation is intentionally **not** shipped in Security 2 because it requires deployment-time Access configuration the owner must verify before enabling.
- Until Worker-level Access protection is in place, the Worker is a "gate that is not a gate" for the proposal endpoint. The owner must treat the Worker URL as a secret-ish internal endpoint, not as a public launch surface. Cloudflare Access in front of `/admin/*` does not, by itself, protect the Worker endpoint if the Worker is reachable on a separate subdomain.

---

## 9. Testing checklist (owner-driven, post-deploy)

Frontend:

- [ ] `next build` succeeds with the new env vars.
- [ ] `out/` does not contain the string `sk-ant-` (the Anthropic key prefix). Grep the static bundle.
- [ ] `out/_headers` has `connect-src ... https://*.workers.dev` and does not have `https://api.anthropic.com`.
- [ ] DevTools → Network → generate a proposal: the request goes to the Worker URL, not to `api.anthropic.com`.
- [ ] DevTools → Console: no CSP violation when the browser POSTs to the Worker.

Worker:

- [ ] `curl -i -X POST -H 'Origin: https://codeoutfitters.com' -H 'Content-Type: application/json' --data '{"intakeData":{...valid 11-section intake...}}' ${WORKER_URL}/` returns `200` with the proposal JSON.
- [ ] A request with `Origin: https://evil.example` returns `403 {"error":"origin_not_allowed"}`.
- [ ] A `GET` request returns `405 {"error":"method_not_allowed"}`.
- [ ] A request with malformed JSON returns `400 {"error":"invalid_json", ...}`.
- [ ] A request missing `intakeData` returns `400 {"error":"invalid_payload", ...}`.
- [ ] A request with `intakeData` missing required fields returns `400 {"error":"invalid_intake_data", ...}` with the `missing` array.
- [ ] The response body never contains the string `sk-ant-`.
- [ ] The response body never contains the value of `ALLOWED_ORIGIN` or any other secret.
- [ ] An OPTIONS preflight with an allowed `Origin` returns `204` with the CORS headers.
- [ ] An OPTIONS preflight with a non-allowed `Origin` returns `403`.
- [ ] When `ANTHROPIC_API_KEY` is missing or empty (e.g. remove the secret in the dashboard), the Worker returns `500 {"error":"config_error", ...}` and does not echo the missing value.

Security 2 follow-up (out of scope for Security 1) — **addressed for admin; still open for Worker**:

- [x] **Admin auth (D-020a, Cloudflare Access for fast internal protection).** Cloudflare Access is now the real admin boundary. The local client-side gate is convenience-only. See `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.
- [ ] Add a session-token or Cloudflare Access JWT check at the top of the Worker's `fetch` handler. Reject with `401 unauthorized` for missing / invalid tokens. **Owner-side prerequisite:** Cloudflare Access must be configured in front of the Worker's route (separate Access application on the Worker subdomain, or via the Pages route that fronts the Worker). The Worker code change is additive; the deployment is owner-driven. Documented in the Worker source header.
- [ ] Add rate-limiting at the Cloudflare edge (free tier allows basic rate-limit rules).

---

## 10. Sign-off

Security 1 ships code + docs + CSP. It does not deploy. The owner deploys. Security 2 is the next gate and must land before any non-internal launch.
