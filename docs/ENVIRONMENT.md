# Environment Variables

The env vars this project uses, after the Security 1 phase (2026-06-16). The split is now: **frontend (browser) vars** and **Cloudflare Worker (server-side) vars**. The Anthropic API key is no longer a frontend env var.

## Frontend env vars (Cloudflare Pages)

These are `NEXT_PUBLIC_*` and are inlined into the static JS bundle at build time.

| Var | Required? | Scope | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | browser | Supabase project URL. Used by `lib/supabase.ts` for booking reads/writes. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser | Supabase anon key. Used by `lib/supabase.ts`. |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | yes | browser | Single shared webhook for quote, contact, booking, and newsletter submissions. |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | no (convenience only) | browser | Plaintext password compared client-side at `/admin` as a **convenience-only** gate. **Not a real security boundary** as of Security 2 (2026-06-16). Cloudflare Access in front of `/admin/*` is the real admin boundary. |
| `NEXT_PUBLIC_PROPOSAL_WORKER_URL` | yes | browser | Public URL of the Cloudflare Worker that proxies proposal generation. See `repo-research/SECURITY_1_WORKER_PROXY_NOTES.md`. |
| `NEXT_PUBLIC_FORMS_WORKER_URL` | yes | browser | Public URL of the Cloudflare Worker that proxies public form submissions (contact, quote, booking, newsletter) to n8n. The Worker holds the per-form n8n secrets server-side. See `repo-research/SECURITY_4_N8N_SECRET_NOTES.md`. |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | no | browser | Tawk.to property ID. Live chat only loads when this is set to a real ID. |

## Worker env vars (Cloudflare Worker)

Bound to the Worker via `wrangler secret put` or the Cloudflare dashboard. They are **server-side only** and are not visible to the browser.

### Anthropic proposal proxy (Security 1)

| Var | Required? | Scope | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Worker | Anthropic API key. Server-side only. Never exposed to the browser. |
| `ALLOWED_ORIGIN` | yes | Worker | Comma-separated list of allowed `Origin` values. The Worker only responds to requests whose `Origin` header matches an entry. Example: `https://codeoutfitters.com,https://www.codeoutfitters.com`. |
| `ANTHROPIC_MODEL` | no | Worker | Anthropic model id. Defaults to `claude-sonnet-4-6`. |

### n8n form proxy (Security 4)

| Var | Required? | Scope | Purpose |
|---|---|---|---|
| `ALLOWED_ORIGIN` | yes | Worker | Comma-separated list of allowed `Origin` values. The Worker only responds to requests whose `Origin` header matches an entry. Example: `https://codeoutfitters.com,https://www.codeoutfitters.com`. |
| `N8N_CONTACT_WEBHOOK_URL` | yes | Worker | n8n webhook URL for the contact form. Server-side only. |
| `N8N_CONTACT_SECRET` | yes | Worker | Per-form secret (long random string). Sent to n8n as `X-CodeOutfitters-Form-Secret: <secret>`. Server-side only. Never exposed to the browser. |
| `N8N_QUOTE_WEBHOOK_URL` | yes | Worker | n8n webhook URL for the quote form. Server-side only. |
| `N8N_QUOTE_SECRET` | yes | Worker | Per-form secret. Server-side only. |
| `N8N_BOOKING_WEBHOOK_URL` | yes | Worker | n8n webhook URL for the booking form. Server-side only. |
| `N8N_BOOKING_SECRET` | yes | Worker | Per-form secret. Server-side only. |
| `N8N_NEWSLETTER_WEBHOOK_URL` | yes | Worker | n8n webhook URL for the newsletter form. Server-side only. |
| `N8N_NEWSLETTER_SECRET` | yes | Worker | Per-form secret. Server-side only. |

## Deprecated / forbidden

- **`NEXT_PUBLIC_ANTHROPIC_API_KEY` is DEPRECATED and FORBIDDEN as of Security 1 (2026-06-16).** The static export would inline it into every visitor's bundle. The frontend no longer holds the Anthropic API key. The Cloudflare Worker holds it server-side. Do not reintroduce this env var. The line is left commented in `.env.local.example` for migration clarity.
- **`NEXT_PUBLIC_ADMIN_PASSWORD` is DEPRECATED as a real security boundary as of Security 2 (2026-06-16).** The static export would inline it into every visitor's bundle, and the `localStorage.co_admin_auth` check is trivially bypassable. Cloudflare Access in front of `/admin/*` is the real admin boundary. The local client-side gate is convenience-only and is explicitly labeled as such in `app/admin/layout.tsx`. The line is left commented in `.env.local.example` for migration clarity. If you have not set up Cloudflare Access yet, you may keep this var set so the local convenience gate still works; it just does not provide security.
- **`NEXT_PUBLIC_N8N_WEBHOOK_URL` is DEPRECATED and FORBIDDEN as of Security 4 (2026-06-16).** The static export would inline it into every visitor's bundle. The browser no longer holds the n8n webhook URL or any n8n secret. All public forms (contact, quote, booking, newsletter) post to a Cloudflare Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`), which adds the per-form secret header server-side and forwards to the correct n8n webhook URL. The n8n URLs and the per-form secrets are server-side only. The line is left commented in `.env.local.example` for migration clarity.

## Security implications

- Every frontend var is `NEXT_PUBLIC_*` and is inlined into the static JS bundle at build time. See `docs/SECURITY.md`. After Security 1 the only sensitive var that was previously in this category is the Anthropic API key, which is now server-side only. After Security 2 `NEXT_PUBLIC_ADMIN_PASSWORD` is no longer a real security boundary (Cloudflare Access is).
- `NEXT_PUBLIC_ADMIN_PASSWORD` is **not** a real password. It is a static value in the bundle. It only keeps the admin out of casual view. Cloudflare Access is the real admin boundary. See `docs/DEPLOYMENT.md` and `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.
- `NEXT_PUBLIC_PROPOSAL_WORKER_URL` is public by design. The Worker enforces `ALLOWED_ORIGIN` server-side. CORS is not authentication; the Worker is still gated to Cloudflare Access (in front of `/admin/*` and ideally in front of the Worker route) before launch.

## Local development

`.env.local.example` is the template. Copy it to `.env.local` and fill in real values. `.env.local` is gitignored.

The Worker env vars (`ANTHROPIC_API_KEY`, `ALLOWED_ORIGIN`, `ANTHROPIC_MODEL`) are **not** in `.env.local`. They are bound to the Worker via `wrangler secret put` or the Cloudflare dashboard. For local Worker development, use `wrangler dev` and a `.dev.vars` file (gitignored).

## Production / Cloudflare

Set frontend env vars in the Cloudflare Pages dashboard under **Settings → Environment variables**. Both Production and Preview environments need them. After changing any `NEXT_PUBLIC_*` value, redeploy — the value is baked at build time.

Set Worker env vars in the Cloudflare Worker dashboard under **Settings → Variables** (or via `wrangler secret put` for secrets). The Worker URL is `https://<worker-subdomain>.<account>.workers.dev`. The frontend's `NEXT_PUBLIC_PROPOSAL_WORKER_URL` must point at this URL.

## Per-form payload contracts

The four public forms (contact, quote, booking, newsletter) no longer POST directly to n8n. They POST to the Cloudflare Worker at `NEXT_PUBLIC_FORMS_WORKER_URL`. The Worker reads the payload's `source` or `type` field to decide which n8n webhook URL to forward to and which per-form secret to attach. The Worker adds the `X-CodeOutfitters-Form-Secret` header server-side. n8n must verify the header against its own workflow-level secret/env var.

Payload shape by form (preserved from the pre-Security-4 contract):

- `source: "quote_request"` — quote form
- `source: "contact"` — contact form
- `source: "newsletter"` — newsletter form
- `type: "booking"` — booking form (also writes to Supabase separately)

See `INTEGRATION_NOTES.md` for full payload shapes. The Worker is the source of truth for the per-form routing and secret header. Owner-side n8n setup steps are in `repo-research/SECURITY_4_N8N_SECRET_NOTES.md`.

## What this app does not need

- No `STRIPE_*` keys. No payment processing.
- No `DATABASE_URL`. All DB access is via the Supabase REST API with the anon key.
- No `JWT_SECRET` or session secret. There is no auth flow (Security 2 will add one).
- No `SMTP_*`. Email is delegated to n8n.
- No `OPENAI_API_KEY` or other model keys. The only model is Anthropic, and it is now server-side only.
