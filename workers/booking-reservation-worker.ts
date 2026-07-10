/**
 * Cloudflare Worker: booking reservation (Booking B).
 *
 * Purpose
 * -------
 * Accept a booking submission from the CodeOutfitters marketing site
 * (`/book`), call the Supabase RPC `public.reserve_slot(p_date date,
 * p_time text, p_booking jsonb) returns uuid` with the `service_role` key
 * server-side, and (optionally) forward the same payload to the n8n
 * booking webhook for the operator notification that the Security 4
 * forms Worker used to handle. The booking RPC is the only path that
 * writes to `bookings` and `available_slots.is_booked` after Security 3
 * RLS is in place. The browser can never call `reserve_slot` directly
 * — the anon key has no EXECUTE grant on the function.
 *
 * Booking B (2026-06-16) is the transactional write path that pairs
 * with Booking A's read path (`public.get_available_slots`). The
 * `reserve_slot` function body is in
 * `supabase/migrations/20260616_booking_b_reserve_slot.sql`. Anon is
 * NOT granted EXECUTE on `reserve_slot`. Only `service_role` is granted
 * EXECUTE. The function is `SECURITY DEFINER`, holds a `SELECT ...
 * FOR UPDATE` row lock on the matching `available_slots` row, and
 * raises `slot_already_booked` (`P0001`) or `slot_not_found` (`P0001`)
 * on conflict. A `UNIQUE (preferred_date, preferred_time)` constraint
 * on `bookings` is the last-line defense against double-booking. The
 * function is idempotent across re-runs.
 *
 * This Worker is a thin proxy plus a strict CORS gate. It does not
 * authenticate end users. The booking form is public by design; CORS
 * / `ALLOWED_ORIGIN` is a defense-in-depth, not a security boundary.
 * The real auth (Cloudflare Access) is in front of `/admin/*` and does
 * not apply to `/book`.
 *
 * The browser does not need to know the Supabase URL, the
 * `service_role` key, the `reserve_slot` RPC, the n8n webhook URL, or
 * the n8n secret. The browser only knows `NEXT_PUBLIC_BOOKING_WORKER_URL`.
 * All of those values are server-side only.
 *
 * Environment variables (bound via `wrangler secret put` / dashboard)
 * --------------------------------------------------------------------------
 * Frontend (browser) public:
 *   - `NEXT_PUBLIC_BOOKING_WORKER_URL` is NOT bound to this Worker; it
 *     is a Cloudflare Pages env var (browser) that points at this
 *     Worker's public URL. The Worker URL is
 *     `https://<worker-subdomain>.<account>.workers.dev`.
 *
 * Worker (server-side) secrets and vars:
 *   - `ALLOWED_ORIGIN`             Required. Comma-separated list of allowed
 *                                  `Origin` values for CORS preflight and
 *                                  actual requests. Example:
 *                                  `https://codeoutfitters.com,https://www.codeoutfitters.com`.
 *   - `SUPABASE_URL`               Required. The Supabase project URL.
 *                                  Example: `https://your-project.supabase.co`.
 *                                  Used as the base for
 *                                  `${SUPABASE_URL}/rest/v1/rpc/reserve_slot`.
 *   - `SUPABASE_SERVICE_ROLE_KEY`  Required. The Supabase `service_role`
 *                                  key. Server-side only. NEVER shipped to
 *                                  the browser, NEVER inlined into the
 *                                  static bundle, NEVER returned in a
 *                                  response body or header. The Worker
 *                                  sends it as the `apikey` and
 *                                  `Authorization: Bearer ...` header to
 *                                  the Supabase REST API. The Supabase
 *                                  REST API honors the role of the
 *                                  supplied key, so the call runs as
 *                                  `service_role` (which has EXECUTE on
 *                                  `reserve_slot`).
 *   - `N8N_BOOKING_WEBHOOK_URL`    Optional. n8n webhook URL for the
 *                                  booking form. If bound (with
 *                                  `N8N_BOOKING_SECRET`), the Worker
 *                                  forwards the same payload to n8n
 *                                  with the per-form secret header so
 *                                  the operator gets the notification
 *                                  the Security 4 forms Worker used to
 *                                  handle. If not bound, the Worker
 *                                  only does the RPC and skips n8n.
 *   - `N8N_BOOKING_SECRET`         Optional. Per-form secret (long random
 *                                  string). Sent to n8n as
 *                                  `X-CodeOutfitters-Form-Secret: <secret>`.
 *
 * What this Worker does NOT do
 * ----------------------------
 * - It does NOT call the `reserve_slot` RPC from the browser. The
 *   browser only knows the Worker URL. The Worker holds the
 *   `service_role` key and calls the RPC server-side.
 * - It does NOT expose the `service_role` key in any response body or
 *   header. The key is only used as the `apikey` and `Authorization`
 *   header to the Supabase REST API.
 * - It does NOT grant `anon` EXECUTE on `reserve_slot`. Anon is never
 *   granted EXECUTE on `reserve_slot`. The grant is `service_role`
 *   only. The booking form is public; the reservation RPC is not.
 * - It does NOT log request bodies or response bodies. Cloudflare
 *   Workers log request metadata by default; that is fine.
 * - It does NOT call the n8n forms Worker (`workers/n8n-form-proxy.ts`).
 *   The forms Worker is for the other three public forms (contact,
 *   quote, newsletter) and for booking in the pre-Booking-B flow. As
 *   of Booking B, the booking form posts here instead, and this Worker
 *   optionally forwards to n8n directly. The forms Worker is unchanged.
 * - It does NOT write to `bookings` or `available_slots` directly. All
 *   writes go through `supabase.rpc('reserve_slot', ...)` so the
 *   transaction is atomic and the row lock + UNIQUE constraint are
 *   honored.
 *
 * Request contract
 * ----------------
 * Method: POST (or OPTIONS for CORS preflight).
 * Path:   /  (the Worker is mounted at the Worker URL; the frontend
 *             posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/`).
 * Headers:
 *   Origin: required; must match an entry in `ALLOWED_ORIGIN`.
 *   Content-Type: required; must be `application/json`.
 * Body:
 *   {
 *     "date":            "yyyy-MM-dd",   // required
 *     "time":            "string",       // required; matches
 *                                         //   available_slots.time
 *                                         //   (e.g. "10:00 AM")
 *     "name":            "string",       // required; <= 100 chars
 *     "email":           "string",       // required; <= 100 chars
 *     "company":         "string|null",  // optional; <= 100 chars
 *     "phone":           "string|null",  // optional; <= 20 chars
 *     "message":         "string|null",  // optional; <= 2000 chars
 *     "timezone":        "string"        // optional; defaults to
 *                                         //   "America/New_York" in
 *                                         //   the RPC if missing
 *   }
 *
 *   The `date` and `time` fields are echoed back in the RPC as
 *   `preferredDate` and `preferredTime` inside the `p_booking` jsonb.
 *   The top-level `p_date` and `p_time` args are authoritative for the
 *   slot lookup. The Worker sends them both: top-level as `p_date` /
 *   `p_time` and as `preferredDate` / `preferredTime` inside
 *   `p_booking`. The RPC cross-checks them and raises 22023 on
 *   mismatch.
 *
 * Response contract
 * ------------------
 * 200 OK
 *   { "bookingId": "<uuid>" }
 *   The Worker returns the new `bookings.id` returned by the RPC.
 *
 * 400 Bad Request
 *   { "error": "<short tag>", "message": "<human-readable>" }
 *   Cases: invalid JSON, missing required field, invalid date / time
 *   / email format, field length over the cap, RPC raised 22023
 *   (input validation).
 *
 * 403 Forbidden
 *   { "error": "origin_not_allowed" }
 *   Case: Origin header missing or not in `ALLOWED_ORIGIN`.
 *
 * 405 Method Not Allowed
 *   { "error": "method_not_allowed" }
 *   Case: non-POST request (except OPTIONS, which is handled as CORS).
 *
 * 409 Conflict
 *   { "error": "slot_already_booked" | "slot_not_found" |
 *              "slot_taken" }
 *   Case: the RPC raised P0001 (slot_already_booked / slot_not_found)
 *   or 23505 (unique_violation on the UNIQUE constraint). The booking
 *   could not be made; the slot is taken or missing. The frontend
 *   should refetch the calendar and ask the user to pick another time.
 *
 * 500 Internal Server Error
 *   { "error": "config_error" | "upstream_error" |
 *              "internal_error", "message": "..." }
 *   Cases: missing required env var, Supabase upstream failure,
 *   Supabase upstream timeout, internal exception, n8n upstream
 *   failure (if `N8N_BOOKING_WEBHOOK_URL` is bound; the booking still
 *   succeeds even if n8n fails, but the n8n error is logged in the
 *   response with a `notification` field).
 *
 * The Worker never returns the `service_role` key, the Supabase URL,
 * the n8n webhook URL, the n8n secret, the `ALLOWED_ORIGIN` value, or
 * any other secret in the response body or header.
 */

interface Env {
  ALLOWED_ORIGIN: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  N8N_BOOKING_WEBHOOK_URL?: string
  N8N_BOOKING_SECRET?: string
}

interface BookingRequest {
  date?: unknown
  time?: unknown
  name?: unknown
  email?: unknown
  company?: unknown
  phone?: unknown
  message?: unknown
  timezone?: unknown
  [key: string]: unknown
}

interface RpcOk {
  bookingId: string
}

interface RpcUpstreamError {
  error: 'upstream_error' | 'internal_error' | 'config_error'
  message: string
  notification?: 'sent' | 'failed' | 'skipped'
}

interface NotificationOutcome {
  attempted: boolean
  sent: boolean
  reason?: string
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
}

const FORWARDED_HEADER_NAME = 'X-CodeOutfitters-Form-Secret'

const NAME_MAX = 100
const EMAIL_MAX = 100
const COMPANY_MAX = 100
const PHONE_MAX = 20
const MESSAGE_MAX = 2000

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
  }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return new Response(JSON.stringify(body), { status, headers })
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

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function trimToNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length === 0 ? null : t
}

function validateBookingRequest(value: unknown): { ok: true; data: BookingRequest } | { ok: false; error: string } {
  if (!value || typeof value !== 'object') {
    return { ok: false, error: 'invalid_payload' }
  }
  const v = value as Record<string, unknown>

  if (typeof v.date !== 'string' || !ISO_DATE_RE.test(v.date)) {
    return { ok: false, error: 'invalid_date' }
  }
  if (typeof v.time !== 'string' || v.time.trim().length === 0) {
    return { ok: false, error: 'invalid_time' }
  }
  const name = trimToNull(v.name)
  if (name === null) {
    return { ok: false, error: 'name_required' }
  }
  if (name.length > NAME_MAX) {
    return { ok: false, error: 'name_too_long' }
  }
  const email = trimToNull(v.email)
  if (email === null) {
    return { ok: false, error: 'email_required' }
  }
  if (email.length > EMAIL_MAX) {
    return { ok: false, error: 'email_too_long' }
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'email_invalid' }
  }
  const company = trimToNull(v.company)
  if (company !== null && company.length > COMPANY_MAX) {
    return { ok: false, error: 'company_too_long' }
  }
  const phone = trimToNull(v.phone)
  if (phone !== null && phone.length > PHONE_MAX) {
    return { ok: false, error: 'phone_too_long' }
  }
  const message = trimToNull(v.message)
  if (message !== null && message.length > MESSAGE_MAX) {
    return { ok: false, error: 'message_too_long' }
  }

  return { ok: true, data: v as BookingRequest }
}

function buildRpcBody(req: BookingRequest): Record<string, unknown> {
  const name = trimToNull(req.name) ?? ''
  const email = trimToNull(req.email) ?? ''
  const company = trimToNull(req.company)
  const phone = trimToNull(req.phone)
  const message = trimToNull(req.message)
  const timezone = trimToNull(req.timezone) ?? 'America/New_York'
  const date = typeof req.date === 'string' ? req.date : ''
  const time = typeof req.time === 'string' ? req.time : ''

  return {
    p_date: date,
    p_time: time,
    p_booking: {
      name,
      email,
      company,
      phone,
      message,
      timezone,
      preferredDate: date,
      preferredTime: time,
    },
  }
}

function isUuidString(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

async function callReserveSlot(env: Env, body: Record<string, unknown>): Promise<
  | { ok: true; bookingId: string }
  | { ok: false; status: number; error: string; tag: string }
> {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/reserve_slot`
  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, status: 502, error: 'upstream_error', tag: 'supabase_unreachable' }
  }

  if (upstream.ok) {
    let payload: unknown
    try {
      payload = await upstream.json()
    } catch {
      return { ok: false, status: 502, error: 'upstream_error', tag: 'supabase_bad_json' }
    }
    const bookingId =
      typeof payload === 'string'
        ? payload.replace(/^"|"$/g, '')
        : (payload as { bookingId?: unknown })?.bookingId
    if (typeof bookingId !== 'string' || !isUuidString(bookingId)) {
      return { ok: false, status: 502, error: 'upstream_error', tag: 'supabase_bad_response' }
    }
    return { ok: true, bookingId }
  }

  let errPayload: { message?: string; code?: string } | null = null
  try {
    errPayload = (await upstream.json()) as { message?: string; code?: string }
  } catch {
    // ignore; fall through to generic 500
  }

  const code = errPayload?.code ?? ''
  const message = errPayload?.message ?? ''

  if (code === 'P0001' && message.startsWith('slot_already_booked')) {
    return { ok: false, status: 409, error: 'slot_already_booked', tag: 'slot_already_booked' }
  }
  if (code === 'P0001' && message.startsWith('slot_not_found')) {
    return { ok: false, status: 409, error: 'slot_not_found', tag: 'slot_not_found' }
  }
  if (code === '23505') {
    return { ok: false, status: 409, error: 'slot_taken', tag: 'unique_violation' }
  }
  if (code === '22023') {
    return { ok: false, status: 400, error: 'invalid_input', tag: 'sqlstate_22023' }
  }

  return {
    ok: false,
    status: 500,
    error: 'upstream_error',
    tag: `supabase_${upstream.status}`,
  }
}

async function forwardToN8n(
  env: Env,
  payload: BookingRequest,
  origin: string | null
): Promise<NotificationOutcome> {
  if (!env.N8N_BOOKING_WEBHOOK_URL || !env.N8N_BOOKING_SECRET) {
    return { attempted: false, sent: false, reason: 'not_configured' }
  }
  try {
    const res = await fetch(env.N8N_BOOKING_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [FORWARDED_HEADER_NAME]: env.N8N_BOOKING_SECRET,
      },
      body: JSON.stringify({ ...payload, type: 'booking' }),
    })
    if (res.ok) return { attempted: true, sent: true }
    return { attempted: true, sent: false, reason: `n8n_${res.status}` }
  } catch {
    return { attempted: true, sent: false, reason: 'n8n_unreachable' }
  }
}

function notificationToField(n: NotificationOutcome): 'sent' | 'failed' | 'skipped' {
  if (!n.attempted) return 'skipped'
  return n.sent ? 'sent' : 'failed'
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      const allowed = parseAllowedOrigins(env.ALLOWED_ORIGIN)
      if (!originAllowed(requestOrigin, allowed)) {
        return jsonResponse({ error: 'origin_not_allowed' }, 403, null)
      }
      const preflightHeaders: Record<string, string> = {
        ...CORS_HEADERS,
        'Access-Control-Allow-Origin': requestOrigin!,
      }
      return new Response(null, { status: 204, headers: preflightHeaders })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, requestOrigin)
    }

    const allowed = parseAllowedOrigins(env.ALLOWED_ORIGIN)
    if (!originAllowed(requestOrigin, allowed)) {
      return jsonResponse({ error: 'origin_not_allowed' }, 403, requestOrigin)
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(
        {
          error: 'config_error',
          message: 'Server is not configured for booking reservations.',
        },
        500,
        requestOrigin
      )
    }

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return jsonResponse(
        { error: 'invalid_json', message: 'Request body must be valid JSON.' },
        400,
        requestOrigin
      )
    }

    const validation = validateBookingRequest(payload)
    if (!validation.ok) {
      return jsonResponse(
        {
          error: validation.error,
          message: 'The booking payload is missing or invalid required fields.',
        },
        400,
        requestOrigin
      )
    }
    const req = validation.data

    const rpcBody = buildRpcBody(req)
    const rpcResult = await callReserveSlot(env, rpcBody)

    if (!rpcResult.ok) {
      return jsonResponse(
        { error: rpcResult.error, message: rpcResult.tag },
        rpcResult.status,
        requestOrigin
      )
    }

    const notification = await forwardToN8n(env, req, requestOrigin)

    const body: RpcOk & { notification?: 'sent' | 'failed' | 'skipped' } = {
      bookingId: rpcResult.bookingId,
    }
    body.notification = notificationToField(notification)

    return jsonResponse(body, 200, requestOrigin)
  },
}
