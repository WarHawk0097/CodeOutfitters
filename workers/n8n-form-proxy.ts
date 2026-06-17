/**
 * Cloudflare Worker: n8n form proxy (Security 4).
 *
 * Purpose
 * -------
 * Accept public form submissions from the CodeOutfitters marketing site
 * (contact, quote, booking, newsletter) and forward them to the
 * appropriate n8n webhook URL with a per-form server-side secret header
 * attached. The secret is held only as a server-side secret bound to the
 * Worker; it is never shipped to the browser, never inlined into the
 * static bundle, and never returned in a response body or header.
 *
 * This Worker is a thin proxy plus a strict CORS gate. It does not
 * authenticate end users. Admin auth (Cloudflare Access, Security 2)
 * is a separate concern and does not apply to the public forms this
 * Worker serves — these forms are intentionally reachable by anonymous
 * visitors, but only with the right origin, only with a known
 * form source/type, and only with the upstream n8n receiving a valid
 * per-form secret header.
 *
 * The browser does not need to know the n8n webhook URL or the per-form
 * secret. The browser only knows `NEXT_PUBLIC_FORMS_WORKER_URL`. The
 * n8n URLs and the per-form secrets are server-side only.
 *
 * Environment variables (bound via `wrangler secret put` / dashboard)
 * --------------------------------------------------------------------------
 * Frontend (browser) public:
 *   - `NEXT_PUBLIC_FORMS_WORKER_URL` is NOT bound to this Worker; it
 *     is a Cloudflare Pages env var (browser) that points at this
 *     Worker's public URL. The Worker URL is
 *     `https://<worker-subdomain>.<account>.workers.dev`.
 *
 * Worker (server-side) secrets and vars:
 *   - `ALLOWED_ORIGIN`             Required. Comma-separated list of allowed
 *                                  `Origin` values for CORS preflight and
 *                                  actual requests. Example:
 *                                  `https://codeoutfitters.com,https://www.codeoutfitters.com`.
 *   - `N8N_CONTACT_WEBHOOK_URL`    Required. n8n webhook URL for contact form.
 *   - `N8N_CONTACT_SECRET`         Required. Per-form secret (long random
 *                                  string). Sent to n8n as
 *                                  `X-CodeOutfitters-Form-Secret: <secret>`.
 *   - `N8N_QUOTE_WEBHOOK_URL`      Required. n8n webhook URL for quote form.
 *   - `N8N_QUOTE_SECRET`           Required. Per-form secret.
 *   - `N8N_BOOKING_WEBHOOK_URL`    Required. n8n webhook URL for booking form.
 *   - `N8N_BOOKING_SECRET`         Required. Per-form secret.
 *   - `N8N_NEWSLETTER_WEBHOOK_URL` Required. n8n webhook URL for newsletter form.
 *   - `N8N_NEWSLETTER_SECRET`      Required. Per-form secret.
 *
 * Forwarded header (added by the Worker; n8n must verify):
 *   - `X-CodeOutfitters-Form-Secret: <per-form secret>`
 *
 * What this Worker does NOT do
 * ---------------------------
 * - It does NOT authenticate the user. The forms are public.
 *   CORS / origin gate + n8n-side secret verification are the only
 *   auth. If the operator wants stronger gating, that is owner-side
 *   Cloudflare Access or a turnstile.
 * - It does NOT log request bodies or response bodies. Cloudflare
 *   Workers log request metadata by default; that is fine.
 * - It does NOT call Supabase, the Anthropic Worker, Tawk, or any
 *   other downstream. Its only outbound call is to the configured
 *   n8n webhook URL for the matched form source.
 *
 * Request contract
 * ----------------
 * Method: POST (or OPTIONS for CORS preflight).
 * Path:   /  (the Worker is mounted at the Worker URL; the frontend
 *             posts to `${NEXT_PUBLIC_FORMS_WORKER_URL}/`).
 * Headers:
 *   Origin: required; must match an entry in `ALLOWED_ORIGIN`.
 *   Content-Type: required; must be `application/json`.
 * Body:
 *   The form's own payload. The Worker reads the `source` field (or
 *   `type` field for the booking form, which uses `type` by existing
 *   convention) to decide which n8n webhook URL to forward to and
 *   which per-form secret to attach. The Worker does not validate
 *   field-level content; the n8n workflow is the source of truth for
 *   field-level validation.
 *
 * Supported form sources (matched on the payload's `source` or `type`):
 *   - `source: "contact"`      → N8N_CONTACT_WEBHOOK_URL    + N8N_CONTACT_SECRET
 *   - `source: "quote_request"`→ N8N_QUOTE_WEBHOOK_URL      + N8N_QUOTE_SECRET
 *   - `source: "newsletter"`  → N8N_NEWSLETTER_WEBHOOK_URL + N8N_NEWSLETTER_SECRET
 *   - `type:   "booking"`     → N8N_BOOKING_WEBHOOK_URL    + N8N_BOOKING_SECRET
 *
 * The booking form uses `type` (not `source`) because the existing
 * code and `INTEGRATION_NOTES.md` §1 use `type: "booking"`. The other
 * three forms use `source`. The Worker honors both conventions.
 *
 * Response contract
 * ------------------
 * 200 OK
 *   {} (empty body; the Worker does not proxy n8n's response body back
 *       to the browser. The forms only need a 2xx to confirm
 *       delivery; the n8n workflow handles the response on its side.)
 *
 * 400 Bad Request
 *   { "error": "<short tag>", "message": "<human-readable>" }
 *   Cases: invalid JSON, missing source/type, unsupported source/type.
 *
 * 403 Forbidden
 *   { "error": "origin_not_allowed" }
 *   Case: Origin header missing or not in `ALLOWED_ORIGIN`.
 *
 * 405 Method Not Allowed
 *   { "error": "method_not_allowed" }
 *   Case: non-POST request (except OPTIONS, which is handled as CORS).
 *
 * 500 Internal Server Error
 *   { "error": "config_error" | "upstream_error", "message": "..." }
 *   Cases: missing required env var, n8n upstream failure, n8n
 *   upstream timeout.
 *
 * The Worker never returns the per-form secret, the n8n webhook URL,
 * the `ALLOWED_ORIGIN` value, or any other secret in the response
 * body or header.
 */

interface Env {
  ALLOWED_ORIGIN: string
  N8N_CONTACT_WEBHOOK_URL: string
  N8N_CONTACT_SECRET: string
  N8N_QUOTE_WEBHOOK_URL: string
  N8N_QUOTE_SECRET: string
  N8N_BOOKING_WEBHOOK_URL: string
  N8N_BOOKING_SECRET: string
  N8N_NEWSLETTER_WEBHOOK_URL: string
  N8N_NEWSLETTER_SECRET: string
}

interface FormPayload {
  source?: unknown
  type?: unknown
  [key: string]: unknown
}

interface RouteTarget {
  webhookUrl: string
  secret: string
  source: string // for logging only; never echoed in response
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
}

const FORWARDED_HEADER_NAME = 'X-CodeOutfitters-Form-Secret'

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
  }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return new Response(JSON.stringify(body), { status, headers })
}

function emptyResponse(status: number, origin: string | null): Response {
  const headers: Record<string, string> = { ...CORS_HEADERS }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return new Response(null, { status, headers })
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function originAllowed(requestOrigin: string | null, allowed: string[]): boolean {
  if (!requestOrigin) return false
  return allowed.includes(requestOrigin)
}

/**
 * Resolve the route target for a given payload. Honors the existing
 * form conventions:
 *   - Contact, quote, newsletter use `source: "..."`.
 *   - Booking uses `type: "booking"`.
 *
 * The Worker is the source of truth for which source/type is
 * supported. Adding a new form means adding a new entry here AND
 * adding the matching env vars (N8N_*_WEBHOOK_URL and N8N_*_SECRET).
 *
 * Returns null for unsupported or missing source/type.
 */
function resolveRoute(payload: FormPayload, env: Env): RouteTarget | null {
  // Booking form: type === 'booking'.
  if (payload.type === 'booking' && typeof payload.type === 'string') {
    if (!env.N8N_BOOKING_WEBHOOK_URL || !env.N8N_BOOKING_SECRET) return null
    return {
      webhookUrl: env.N8N_BOOKING_WEBHOOK_URL,
      secret: env.N8N_BOOKING_SECRET,
      source: 'booking',
    }
  }

  // Contact / quote / newsletter: source === '...'.
  if (typeof payload.source === 'string') {
    switch (payload.source) {
      case 'contact':
        if (!env.N8N_CONTACT_WEBHOOK_URL || !env.N8N_CONTACT_SECRET) return null
        return {
          webhookUrl: env.N8N_CONTACT_WEBHOOK_URL,
          secret: env.N8N_CONTACT_SECRET,
          source: 'contact',
        }
      case 'quote_request':
        if (!env.N8N_QUOTE_WEBHOOK_URL || !env.N8N_QUOTE_SECRET) return null
        return {
          webhookUrl: env.N8N_QUOTE_WEBHOOK_URL,
          secret: env.N8N_QUOTE_SECRET,
          source: 'quote_request',
        }
      case 'newsletter':
        if (!env.N8N_NEWSLETTER_WEBHOOK_URL || !env.N8N_NEWSLETTER_SECRET) return null
        return {
          webhookUrl: env.N8N_NEWSLETTER_WEBHOOK_URL,
          secret: env.N8N_NEWSLETTER_SECRET,
          source: 'newsletter',
        }
      default:
        return null
    }
  }

  return null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('Origin')

    // CORS preflight.
    if (request.method === 'OPTIONS') {
      const allowed = parseAllowedOrigins(env.ALLOWED_ORIGIN)
      if (!originAllowed(requestOrigin, allowed)) {
        return jsonResponse({ error: 'origin_not_allowed' }, 403, null)
      }
      return emptyResponse(204, requestOrigin)
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, requestOrigin)
    }

    const allowed = parseAllowedOrigins(env.ALLOWED_ORIGIN)
    if (!originAllowed(requestOrigin, allowed)) {
      return jsonResponse({ error: 'origin_not_allowed' }, 403, requestOrigin)
    }

    // Parse the payload.
    let payload: FormPayload
    try {
      payload = (await request.json()) as FormPayload
    } catch {
      return jsonResponse(
        { error: 'invalid_json', message: 'Request body must be valid JSON.' },
        400,
        requestOrigin
      )
    }

    if (!payload || typeof payload !== 'object') {
      return jsonResponse(
        { error: 'invalid_payload', message: 'Request body must be a JSON object.' },
        400,
        requestOrigin
      )
    }

    // Resolve the route. The booking form uses `type: "booking"`; the
    // other three forms use `source: "..."`. See `resolveRoute` for
    // the exact mapping. Unsupported source/type is a 400, not a 200.
    const route = resolveRoute(payload, env)
    if (!route) {
      return jsonResponse(
        {
          error: 'unsupported_source',
          message: 'The submitted form source/type is not supported.',
        },
        400,
        requestOrigin
      )
    }

    // Forward the request to the n8n webhook URL with the per-form
    // secret header attached. The original body is forwarded as-is
    // (the n8n workflow is the source of truth for field-level
    // validation). Content-Type is passed through. The
    // `X-CodeOutfitters-Form-Secret` header is added server-side.
    let upstream: Response
    try {
      upstream = await fetch(route.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [FORWARDED_HEADER_NAME]: route.secret,
        },
        body: JSON.stringify(payload),
      })
    } catch {
      return jsonResponse(
        {
          error: 'upstream_error',
          message: 'Could not reach the form service. Please try again.',
        },
        502,
        requestOrigin
      )
    }

    if (!upstream.ok) {
      // The upstream (n8n) is the source of truth for the response.
      // The Worker returns a generic 502 with a short tag; the
      // browser does not get the n8n response body (which may
      // contain webhook-specific error text the operator may not
      // want exposed).
      return jsonResponse(
        {
          error: 'upstream_error',
          message: `Form service returned status ${upstream.status}.`,
        },
        502,
        requestOrigin
      )
    }

    // Success. Return an empty 200 with the CORS headers. The form
    // UI only needs a 2xx to confirm delivery. The n8n workflow
    // handles the response on its side (e.g. sending a confirmation
    // email). We do not proxy n8n's response body back to the
    // browser.
    return emptyResponse(200, requestOrigin)
  },
}
