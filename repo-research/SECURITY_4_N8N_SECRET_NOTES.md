# SECURITY 4 — n8n Form Proxy Notes (2026-06-16)

**Phase:** Security 4 (A0 future phase #7; bundled Q-19 / D-022 / R-005 / R-017; n8n per-form secret + header).
**Status (2026-06-16):** Worker source shipped. Frontend updated. CSP updated. Documentation updated. **No deploy was performed in this phase.** The Worker needs to be deployed to Cloudflare by the owner, and the n8n workflow must be configured to verify the header, before any non-internal launch. Steps are below. **A0 is approved by ChatGPT Control Room as of this phase.**
**Author:** SECURITY-4-N8N-AGENT.

---

## 1. Current risk (pre-Security-4)

The four public forms (contact, quote, booking, newsletter) all POST directly to the same `NEXT_PUBLIC_N8N_WEBHOOK_URL` from the browser. Because the project uses `output: 'export'`, every `NEXT_PUBLIC_*` env var is inlined into the static JS bundle and shipped to every visitor. The n8n webhook URL was therefore public. The n8n workflow was the only thing protecting the webhook. There was no payload signing and no per-form secret — the only discrimination was payload shape (`source` for contact/quote/newsletter, `type` for booking). R-005 documents this. R-017 documents the missing per-form secret + header. The owner's n8n workflow was the only place to enforce any per-form rule, and the webhook was wide open to anyone who knew the URL (which was public).

## 2. New Worker proxy model (post-Security-4)

The browser no longer holds the n8n webhook URL or any n8n secret. All public forms POST to a Cloudflare Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`), which:

- Accepts `POST` (with `OPTIONS` handled as CORS preflight).
- Validates the `Origin` header against a comma-separated `ALLOWED_ORIGIN` env var; returns `403 origin_not_allowed` for any other `Origin`.
- Parses the request body as JSON.
- Reads the payload's `source` field (or `type` for booking) to decide which n8n webhook URL to forward to and which per-form secret to attach.
- Adds the `X-CodeOutfitters-Form-Secret` header server-side with the matching per-form secret.
- Forwards the request to the configured n8n webhook URL.
- Returns a generic 200 on success; never returns the secret, the n8n URL, or the `ALLOWED_ORIGIN` value in the response.

The browser does not need to know the n8n webhook URL or the per-form secret. The n8n URLs and the per-form secrets are server-side only.

## 3. Required Worker env vars

Bind these in the Worker (Cloudflare dashboard → Worker → Settings → Variables, or `wrangler secret put` for secrets).

| Var | Required? | Type | Purpose |
|---|---|---|---|
| `ALLOWED_ORIGIN` | yes | var | Comma-separated list of allowed `Origin` values. The Worker only responds to CORS preflight and actual requests whose `Origin` header matches an entry. Example: `https://codeoutfitters.com,https://www.codeoutfitters.com`. |
| `N8N_CONTACT_WEBHOOK_URL` | yes | var (URL) | n8n webhook URL for the contact form. Server-side only. |
| `N8N_CONTACT_SECRET` | yes | secret | Per-form secret for contact (long random string). Sent to n8n as `X-CodeOutfitters-Form-Secret: <secret>`. Server-side only. Never exposed to the browser. |
| `N8N_QUOTE_WEBHOOK_URL` | yes | var (URL) | n8n webhook URL for the quote form. Server-side only. |
| `N8N_QUOTE_SECRET` | yes | secret | Per-form secret for quote. Server-side only. |
| `N8N_BOOKING_WEBHOOK_URL` | yes | var (URL) | n8n webhook URL for the booking form. Server-side only. |
| `N8N_BOOKING_SECRET` | yes | secret | Per-form secret for booking. Server-side only. |
| `N8N_NEWSLETTER_WEBHOOK_URL` | yes | var (URL) | n8n webhook URL for the newsletter form. Server-side only. |
| `N8N_NEWSLETTER_SECRET` | yes | secret | Per-form secret for newsletter. Server-side only. |

**Per-form routing model (in the Worker):**

- `source: "contact"` → `N8N_CONTACT_WEBHOOK_URL` + `N8N_CONTACT_SECRET`
- `source: "quote_request"` → `N8N_QUOTE_WEBHOOK_URL` + `N8N_QUOTE_SECRET`
- `source: "newsletter"` → `N8N_NEWSLETTER_WEBHOOK_URL` + `N8N_NEWSLETTER_SECRET`
- `type: "booking"` → `N8N_BOOKING_WEBHOOK_URL` + `N8N_BOOKING_SECRET`

The booking form uses `type` (not `source`) because the existing code and `INTEGRATION_NOTES.md` §1 use `type: "booking"`. The other three forms use `source`. The Worker honors both conventions. Adding a new form means adding a new entry to the routing model in the Worker AND adding the matching env vars.

**Forwarded header:** `X-CodeOutfitters-Form-Secret: <per-form secret>`. n8n must verify it.

**Local Worker dev (`wrangler dev`):** use a `.dev.vars` file (gitignored) with the same vars. Cloudflare reads it automatically during `wrangler dev`.

**Never** put any `N8N_*_SECRET` in `.env.local`, in the Cloudflare Pages dashboard, in the static bundle, or in any client-reachable file. The secrets are server-side only.

## 4. Required n8n workflow env vars / secrets

For each form (contact, quote, booking, newsletter), the corresponding n8n workflow must have a workflow-level env var or credential that stores the matching per-form secret. The name is the owner's choice, but the canonical pattern is:

| Form | n8n workflow env var (or credential) name | Matching Worker secret |
|---|---|---|
| contact | `N8N_CONTACT_SECRET` (or whatever the operator chooses) | `N8N_CONTACT_SECRET` |
| quote | `N8N_QUOTE_SECRET` (or whatever the operator chooses) | `N8N_QUOTE_SECRET` |
| booking | `N8N_BOOKING_SECRET` (or whatever the operator chooses) | `N8N_BOOKING_SECRET` |
| newsletter | `N8N_NEWSLETTER_SECRET` (or whatever the operator chooses) | `N8N_NEWSLETTER_SECRET` |

The value of each n8n workflow env var MUST match the value of the corresponding Worker secret. The values are generated by the operator (`openssl rand -base64 48` is a reasonable default for a 48-byte secret). The owner stores the same value in both places; rotation is owner-driven.

## 5. Header name n8n must check

n8n must verify the request header `X-CodeOutfitters-Form-Secret`. The Worker adds this header server-side; n8n must check that the header is present and that its value matches the corresponding workflow-level secret.

The check is n8n-side. The Worker does NOT verify the header — the Worker forwards as-is. n8n is the source of truth for the secret check. If the header is missing or wrong, n8n drops the request (returns 401 or simply stops the workflow). Do not process the request.

## 6. Per-form routing model

| Form | Browser payload `source` or `type` | Worker route | n8n webhook URL | n8n secret to verify |
|---|---|---|---|---|
| contact | `source: "contact"` | `N8N_CONTACT_WEBHOOK_URL` | n8n contact workflow | `N8N_CONTACT_SECRET` |
| quote | `source: "quote_request"` | `N8N_QUOTE_WEBHOOK_URL` | n8n quote workflow | `N8N_QUOTE_SECRET` |
| booking | `type: "booking"` | `N8N_BOOKING_WEBHOOK_URL` | n8n booking workflow | `N8N_BOOKING_SECRET` |
| newsletter | `source: "newsletter"` | `N8N_NEWSLETTER_WEBHOOK_URL` | n8n newsletter workflow | `N8N_NEWSLETTER_SECRET` |

If a single shared n8n webhook is currently used for multiple forms, the owner may still route all supported forms to the same URL, but the Worker must add the appropriate per-form secret and preserve the `source` / `type` field. The n8n workflow can then branch on `source` / `type` as before, but it now also verifies the matching per-form secret.

## 7. Owner setup steps

The repo does not create the Worker or configure n8n. The owner does both. The steps are the minimal correct setup for a single-operator project.

### 7.1 Generate the per-form secrets

For each form (contact, quote, booking, newsletter), generate a long random secret:

```bash
openssl rand -base64 48
```

Record each value. You will need the same value in both the Worker env and the n8n workflow env.

### 7.2 Bind Worker env vars

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages → <your-forms-worker>** → **Settings → Variables**.
3. Add each var from §3 above. For each secret (`N8N_*_SECRET` and `ALLOWED_ORIGIN`), use **Type: Secret** so it is encrypted at rest. For the URLs, **Type: Plaintext** is fine (URLs are not secrets; the secrets are the headers).
4. Save.

Alternatively, use `wrangler secret put N8N_CONTACT_SECRET` for each secret, and `wrangler secret put ALLOWED_ORIGIN` for the origin. URLs go in `wrangler.toml` or the dashboard.

### 7.3 Deploy the Worker

1. From the repo root, ensure `wrangler` is installed (out of scope for Security 4; the Worker source itself is dependency-free).
2. Bind secrets and vars in the Cloudflare dashboard (§7.2) or via `wrangler`.
3. Deploy the Worker (`wrangler deploy` or via the Cloudflare dashboard). Capture the Worker URL — it looks like `https://n8n-form-proxy.<account>.workers.dev`.

### 7.4 Set the frontend env var

1. Open the Cloudflare Pages project.
2. Go to **Settings → Environment variables**.
3. Set `NEXT_PUBLIC_FORMS_WORKER_URL` to the Worker URL from §7.3 (Production and Preview).
4. Trigger a new Pages build.

### 7.5 Configure the n8n workflows

For each form's n8n workflow:

1. Add a node that checks the request header `X-CodeOutfitters-Form-Secret` against the corresponding workflow-level secret env var. In n8n, this is typically a **Header Auth** credential or an **IF** node that compares the header value to a workflow variable.
2. If the header is missing or wrong, **drop the request** (return 401 or stop the workflow). Do not process the request.
3. If the header is correct, proceed with the existing workflow logic.
4. Test by submitting the form in the browser with the Worker deployed. The browser POSTs to the Worker URL; the Worker adds the header; the n8n workflow receives the request and verifies the header.

## 8. Rollback plan

If the forms Worker causes a regression in production:

1. **Temporarily disable the forms Worker** in the Cloudflare dashboard (unbind the vars or set them to empty strings). This causes all four forms to surface a generic error to the visitor. The site returns to a partially-broken form state until the Worker is fixed or restored.
2. **Re-deploy the Worker** once the regression is identified and fixed.
3. **If the Worker must be taken offline entirely:** delete the Worker in the Cloudflare dashboard. Note: this is a destructive action; prefer disabling the route first.

If the n8n workflow must be rolled back, the owner can remove the header check temporarily. The Worker will continue to add the header; n8n will accept requests that do not have the header (because the check is removed). The n8n workflow is owner-controlled.

If a single form is broken, the owner can disable just that form's n8n webhook URL in the Worker env (`N8N_<FORM>_WEBHOOK_URL = ""`). The Worker returns 502 for that form; the other forms continue to work.

There is no destructive repo rollback. The owner can `git revert` the Security 4 commit (when / if the owner decides to commit) and the four forms will return to the pre-Security-4 direct n8n POSTs.

## 9. Verification checklist (owner-driven, post-deploy)

Frontend:

- [ ] `next build` succeeds with the new env vars.
- [ ] `out/` does not contain any `N8N_*_SECRET` value. Grep the static bundle.
- [ ] `out/_headers` `connect-src` does not include `https://*.n8n.io`. (The browser no longer needs to call the n8n domain directly.)
- [ ] DevTools → Network → submit the contact form: the request goes to the forms Worker URL (e.g. `https://n8n-form-proxy.<account>.workers.dev/`), not to the n8n webhook URL.
- [ ] DevTools → Network → inspect the request: the `X-CodeOutfitters-Form-Secret` header is NOT present (the browser does not add it; the Worker adds it server-side).
- [ ] DevTools → Network → inspect the Worker's response: the response body is empty or a small JSON `{}`. The response does not contain any `N8N_*_SECRET` value.
- [ ] DevTools → Console: no CSP violation when the browser POSTs to the Worker.

Worker:

- [ ] `curl -i -X POST -H 'Origin: https://codeoutfitters.com' -H 'Content-Type: application/json' --data '{"source":"contact","firstName":"x","lastName":"y","email":"a@b.com","businessType":"Other","message":"test"}' ${FORMS_WORKER_URL}/` returns 200 (or 204) with the CORS headers.
- [ ] A request with a non-allowed `Origin` returns `403 {"error":"origin_not_allowed"}`.
- [ ] A `GET` request returns `405 {"error":"method_not_allowed"}`.
- [ ] A request with malformed JSON returns `400 {"error":"invalid_json", ...}`.
- [ ] A request with an unsupported `source` (e.g. `"source": "spam"`) returns `400 {"error":"unsupported_source", ...}`.
- [ ] A request with `type: "booking"` (the existing booking convention) is routed to `N8N_BOOKING_WEBHOOK_URL` and signed with `N8N_BOOKING_SECRET`.
- [ ] A request with `source: "quote_request"` (the existing quote convention) is routed to `N8N_QUOTE_WEBHOOK_URL` and signed with `N8N_QUOTE_SECRET`.
- [ ] The response body never contains any `N8N_*_SECRET` value.
- [ ] The response body never contains any n8n webhook URL.
- [ ] The response body never contains the value of `ALLOWED_ORIGIN` or any other secret.
- [ ] When a Worker secret is missing or empty (e.g. remove the secret in the dashboard), the Worker returns `500 {"error":"config_error", ...}` and does not echo the missing value.

n8n:

- [ ] Each form's n8n workflow checks `X-CodeOutfitters-Form-Secret` against the corresponding workflow-level secret env var.
- [ ] A request with the correct header is processed normally.
- [ ] A request with a missing or wrong header is dropped (401 or workflow stop). It is NOT processed.
- [ ] The four forms (contact, quote, booking, newsletter) all work end-to-end via the forms Worker.

End-to-end:

- [ ] Submit the contact form in the browser. Expect 200 (or 204) from the Worker, success UI in the browser, and a row in the n8n contact workflow.
- [ ] Submit the quote form in the browser. Expect 200 (or 204) from the Worker, success UI in the browser, and a row in the n8n quote workflow.
- [ ] Submit the booking form in the browser. Expect 200 (or 204) from the Worker, success UI in the browser, and a row in the n8n booking workflow. (Note: the booking form also writes to Supabase directly; that is the existing flow, unaffected by Security 4. Security 3 RLS is still not applied unless the owner applied it separately.)
- [ ] Submit the newsletter form in the browser. Expect 200 (or 204) from the Worker, success UI in the browser, and a row in the n8n newsletter workflow.

## 10. Known remaining risks

- **n8n workflow must still be configured by owner to verify the header.** The Worker is the source of truth for the per-form routing and secret header. n8n is the source of truth for the secret check. Until the n8n workflow is configured, the Worker forwards requests without verification; the n8n workflow accepts any request. The owner-side setup is in §7.5.
- **Worker deployment is owner-side.** Security 4 ships the Worker source only. The owner deploys it to Cloudflare. Steps are in §7.
- **Security 3 SQL is still not applied unless owner applied it separately.** The Security 3 migration is in `supabase/migrations/20260616_security3_rls.sql`. The booking form still POSTs to n8n for the form notification (after Security 4) and writes to Supabase directly (the existing flow, unaffected by Security 4). If the Security 3 RLS migration is applied, the Supabase write will fail; the fix is Booking B (RPC write path via the Worker). Security 3 is gated to ChatGPT Control Room approval (already approved at SQL/documentation level) and the owner applying the migration.
- **Booking A/B still required.** The booking form's Supabase write path is unchanged by Security 4. Booking A (RPC read path) and Booking B (RPC write path) are still blocked and required before any non-internal launch.
- **Observability still blocked.** R-006 (no error tracking), R-010 (admin form data persisted in browser only), R-035 (static "All systems operational" badge) are still open. Not in Security 4 scope.
- **CORS is not authentication.** CORS / `ALLOWED_ORIGIN` is a defense-in-depth, not a security boundary. The forms Worker is gated to the owner deploying it and configuring the n8n workflow to verify the header. Until then, the Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. CORS is a defense-in-depth, not authentication.
- **No tests/build run in this phase.** Validation was static-only: read the source, verify the Worker source uses server-side `X-CodeOutfitters-Form-Secret` header, verify the four forms POST to the Worker URL, verify the docs explain the n8n-side check, verify the grep returns no `N8N_*_SECRET` in the frontend code. The owner runs the build and the post-deploy checks.
- **R-001, R-002, R-003, R-004, R-006, R-007, R-008, R-009, R-010, R-011..R-035** still open or addressed at the deployment level; addressed by future phases per A0 plan.

## 11. Sign-off

Security 4 ships the Worker source at `workers/n8n-form-proxy.ts` and updates the four forms to POST to the Worker. The browser no longer holds the n8n webhook URL or any n8n secret. The n8n URLs and the per-form secrets are server-side only. R-005 and R-017 are addressed at the deployment level; deferred at the runtime level until the owner deploys the Worker and configures the n8n workflow. Security 4 does not deploy. Security 4 does not start Booking A, Booking B, Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA.
