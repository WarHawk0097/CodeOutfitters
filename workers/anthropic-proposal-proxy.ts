/**
 * Cloudflare Worker: Anthropic proposal proxy (Security 1).
 *
 * Security 2 (2026-06-16) note on the auth boundary
 * -------------------------------------------------
 * This Worker enforces `ALLOWED_ORIGIN` server-side (CORS gate). CORS is
 * not authentication. The real admin protection is **Cloudflare Access**
 * in front of `/admin/*` on the deployed site, AND, ideally, in front of
 * this Worker's route as well. Cloudflare Access is a deployment concern;
 * it is configured at the Cloudflare dashboard, not in this file.
 *
 * If the owner wants the Worker to additionally verify a session token or
 * a Cloudflare Access JWT before serving a proposal, the natural
 * place to add that check is at the top of `fetch(request, env)`,
 * right after the CORS / origin gate. The check would inspect the
 * `Cf-Access-Jwt-Assertion` header (when the route is fronted by
 * Access) or a session cookie. The Worker's Worker env vars do NOT
 * need a new secret for this: Access public keys are published and
 * verifiable with `jose` or a small custom JWKS fetch. Adding that
 * check is a future hardening step and is intentionally NOT shipped in
 * Security 2 (it requires deployment-time configuration that the
 * owner must verify before enabling). Security 2 documents the
 * contract; the implementation lands when the owner confirms the
 * Access config.
 *
 * Until Cloudflare Access is in front of this Worker's route (either
 * via a Cloudflare Access application on the Worker's subdomain, or
 * via the Pages route that fronts the Worker), the Worker is exposed
 * to anyone who can match an `ALLOWED_ORIGIN` entry from a browser
 * they control. That is the same posture as Security 1; Security 2
 * does not change it. The owner's Cloudflare Access setup is what
 * closes it. See `docs/DEPLOYMENT.md` and
 * `repo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md`.
 *
 * Purpose
 * -------
 * Accept proposal-generation requests from the CodeOutfitters admin UI
 * (running in the browser as a static Next.js export) and forward them
 * to the Anthropic API server-side. The Anthropic API key is held only
 * as a server-side secret (`ANTHROPIC_API_KEY`) bound to the Worker.
 * It is never shipped to the browser, never inlined into the static
 * bundle, and never returned in a response body or header.
 *
 * This Worker is a thin proxy plus a strict CORS gate. It does not
 * authenticate the caller. Admin auth (Security 2) is a separate
 * concern and is the next gate after Security 1.
 *
 * Environment variables (bound via `wrangler secret put` / dashboard)
 * -------------------------------------------------------------------
 * - `ANTHROPIC_API_KEY`    Required. Anthropic API key. Server-side only.
 * - `ALLOWED_ORIGIN`       Required. Comma-separated list of allowed
 *                          site origins. The Worker only responds to
 *                          CORS preflight and actual requests whose
 *                          `Origin` header matches an allowed origin.
 *                          Example: `https://codeoutfitters.com,https://www.codeoutfitters.com`
 * - `ANTHROPIC_MODEL`      Optional. Defaults to `claude-sonnet-4-6`.
 *
 * What this Worker does NOT do
 * ----------------------------
 * - It does not authenticate the user. Any caller with a valid
 *   `Origin` header (matching ALLOWED_ORIGIN) can request a proposal.
 *   Admin auth (Cloudflare Access, Supabase Auth, or similar) is the
 *   job of Security 2.
 * - It does not call n8n, Supabase, Tawk, or any other downstream.
 *   Its only outbound call is to `https://api.anthropic.com`.
 * - It does not log request bodies or response bodies. Cloudflare
 *   Workers log request metadata by default; that is fine.
 *
 * Request contract
 * ----------------
 * Method: POST
 * Path:   /  (the Worker is mounted at the Worker URL; the frontend
 *             posts to `${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/`)
 * Headers:
 *   Origin: required; must match an entry in ALLOWED_ORIGIN
 *   Content-Type: required; must be application/json
 * Body:
 *   {
 *     "intakeData": { ...OnboardingFormData... }   // see lib/admin-types.ts
 *   }
 *
 * Response contract
 * ------------------
 * 200 OK
 *   {
 *     "executiveSummary": "...",
 *     "challenge": "...",
 *     "recommendation": "...",
 *     "practicalLook": "...",
 *     "technicalApproach": "...",
 *     "requirements": ["..."],
 *     "timeline": [{ "week": "...", "deliverable": "..." }],
 *     "investment": "...",
 *     "whyUs": ["..."],
 *     "nextSteps": ["..."],
 *     "futureOpportunities": "..."
 *   }
 *
 * 400 Bad Request
 *   { "error": "<short tag>", "message": "<human-readable>" }
 *   Cases: invalid JSON, missing `intakeData`, missing required fields
 *
 * 403 Forbidden
 *   { "error": "origin_not_allowed" }
 *   Case: Origin header missing or not in ALLOWED_ORIGIN
 *
 * 405 Method Not Allowed
 *   { "error": "method_not_allowed" }
 *   Case: non-POST request (except OPTIONS, which is handled as CORS)
 *
 * 500 Internal Server Error
 *   { "error": "upstream_error" | "config_error" | "internal_error", "message": "..." }
 *   Cases: missing ANTHROPIC_API_KEY, Anthropic upstream failure,
 *   malformed upstream response, internal exception
 *
 * The Worker never returns the Anthropic API key, the ALLOWED_ORIGIN
 * value, or any other secret in the response body.
 */

interface Env {
  ANTHROPIC_API_KEY: string
  ALLOWED_ORIGIN: string
  ANTHROPIC_MODEL?: string
}

interface IntakeData {
  fullName: string
  companyName: string
  businessType: string
  biggestHeadache: string
  manualTasks: string
  hoursPerWeek: string
  crm: string[]
  communicationTools: string[]
  marketingTools: string[]
  schedulingTools: string[]
  projectManagement: string[]
  ecommerce: string[]
  otherSoftware: string
  currentlyUsingAutomation: string
  automationDetails: string
  dreamScenario: string
  keyMetric: string
  budgetRange: string
  decisionTimeline: string
  recommendedAutomation: string
}

interface ProposalRequest {
  intakeData: IntakeData
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_MODEL = 'claude-sonnet-4-6'

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

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

function validateIntakeData(value: unknown): { ok: true; data: IntakeData } | { ok: false; missing: string[] } {
  if (!value || typeof value !== 'object') {
    return { ok: false, missing: ['<root>'] }
  }
  const v = value as Record<string, unknown>
  const requiredStrings: Array<keyof IntakeData> = [
    'fullName', 'companyName', 'businessType', 'biggestHeadache', 'manualTasks',
    'hoursPerWeek', 'otherSoftware', 'currentlyUsingAutomation', 'automationDetails',
    'dreamScenario', 'keyMetric', 'budgetRange', 'decisionTimeline', 'recommendedAutomation',
  ]
  const requiredArrays: Array<keyof IntakeData> = [
    'crm', 'communicationTools', 'marketingTools', 'schedulingTools',
    'projectManagement', 'ecommerce',
  ]
  const missing: string[] = []
  for (const k of requiredStrings) {
    if (!isString(v[k])) missing.push(k)
  }
  for (const k of requiredArrays) {
    if (!isStringArray(v[k])) missing.push(k)
  }
  if (missing.length > 0) {
    return { ok: false, missing }
  }
  return { ok: true, data: v as unknown as IntakeData }
}

function buildSystemPrompt(): string {
  return `You are an expert AI automation consultant and proposal writer. You help agencies write compelling, specific, honest project proposals. You write in a warm, professional, direct style — no jargon, no fluff. You always lead with the client's pain, not your capabilities.`
}

function buildUserPrompt(d: IntakeData): string {
  return `Generate a complete client proposal based on this intake data. The proposing agency is CodeOutfitters — an AI automation agency.

CLIENT DATA:
Name: ${d.fullName}
Company: ${d.companyName}
Business Type: ${d.businessType}
Pain points: ${d.biggestHeadache}
Manual tasks: ${d.manualTasks}
Hours wasted/week: ${d.hoursPerWeek}
Tech stack: CRM=${d.crm.join(', ')} | Communication=${d.communicationTools.join(', ')} | Marketing=${d.marketingTools.join(', ')} | Scheduling=${d.schedulingTools.join(', ')} | Project Mgmt=${d.projectManagement.join(', ')} | E-commerce=${d.ecommerce.join(', ')} | Other=${d.otherSoftware}
Currently using automation: ${d.currentlyUsingAutomation} — ${d.automationDetails}
Dream scenario: ${d.dreamScenario}
Key metric: ${d.keyMetric}
Budget: ${d.budgetRange}
Timeline: ${d.decisionTimeline}
Recommended automation (internal): ${d.recommendedAutomation}

Generate a proposal with these exact sections. Output ONLY valid JSON with these keys:

{
  "executiveSummary": "2-3 sentences, lead with their pain, end with the outcome we deliver",
  "challenge": "Empathetic restatement of their problem using their words — 1 paragraph",
  "recommendation": "Specific automation recommendation — what gets built, how it works, why it fits their tech stack",
  "practicalLook": "Concrete day-in-the-life before vs after — how their workflow changes",
  "technicalApproach": "What tools from their stack we use, what we integrate, estimated workflow steps",
  "requirements": ["List of 3-5 items the client needs to provide — access to tools, data, time for onboarding"],
  "timeline": [
    {"week": "Week 1: Discovery", "deliverable": "..."},
    {"week": "Week 2-3: Build", "deliverable": "..."},
    {"week": "Week 4: Test + Launch", "deliverable": "..."},
    {"week": "Ongoing: Support", "deliverable": "..."}
  ],
  "investment": "Do NOT include specific prices. Write: 'We will send a detailed quote within 24 hours based on this scope. Typical range for this type of project: ${d.budgetRange}.'",
  "whyUs": ["3 bullet points specific to their situation — not generic"],
  "nextSteps": ["3 clear action items — what we do, what they do, when we reconnect"],
  "futureOpportunities": "1 paragraph suggesting 2-3 additional automation ideas for future projects — plant a seed, don't pitch"
}`
}

function extractJsonBlock(text: string): string | null {
  const m = text.match(/\{[\s\S]*\}/)
  return m ? m[0] : null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      const allowed = parseAllowedOrigins(env.ALLOWED_ORIGIN)
      if (!originAllowed(requestOrigin, allowed)) {
        return jsonResponse({ error: 'origin_not_allowed' }, 403, null)
      }
      return jsonResponse({}, 204, requestOrigin)
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, requestOrigin)
    }

    const allowed = parseAllowedOrigins(env.ALLOWED_ORIGIN)
    if (!originAllowed(requestOrigin, allowed)) {
      return jsonResponse({ error: 'origin_not_allowed' }, 403, null)
    }

    if (!env.ANTHROPIC_API_KEY) {
      return jsonResponse(
        { error: 'config_error', message: 'Server is not configured for proposal generation.' },
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

    if (!payload || typeof payload !== 'object' || !('intakeData' in payload)) {
      return jsonResponse(
        { error: 'invalid_payload', message: 'Body must include an `intakeData` object.' },
        400,
        requestOrigin
      )
    }

    const validation = validateIntakeData((payload as ProposalRequest).intakeData)
    if (!validation.ok) {
      return jsonResponse(
        {
          error: 'invalid_intake_data',
          message: 'intakeData is missing required fields.',
          missing: validation.missing,
        },
        400,
        requestOrigin
      )
    }
    const intakeData = validation.data

    const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL

    let upstream: Response
    try {
      upstream = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          system: buildSystemPrompt(),
          messages: [{ role: 'user', content: buildUserPrompt(intakeData) }],
        }),
      })
    } catch {
      return jsonResponse(
        { error: 'upstream_error', message: 'Could not reach the proposal service. Please try again.' },
        500,
        requestOrigin
      )
    }

    if (!upstream.ok) {
      return jsonResponse(
        {
          error: 'upstream_error',
          message: `Proposal service returned status ${upstream.status}.`,
        },
        502,
        requestOrigin
      )
    }

    let upstreamJson: unknown
    try {
      upstreamJson = await upstream.json()
    } catch {
      return jsonResponse(
        { error: 'upstream_error', message: 'Proposal service returned an invalid response.' },
        502,
        requestOrigin
      )
    }

    const text = (upstreamJson as { content?: Array<{ text?: string }> })?.content?.[0]?.text
    if (typeof text !== 'string' || text.length === 0) {
      return jsonResponse(
        { error: 'upstream_error', message: 'Proposal service returned an empty response.' },
        502,
        requestOrigin
      )
    }

    const jsonBlock = extractJsonBlock(text)
    if (!jsonBlock) {
      return jsonResponse(
        { error: 'parse_error', message: 'Could not parse proposal JSON from upstream response.' },
        502,
        requestOrigin
      )
    }

    let proposal: unknown
    try {
      proposal = JSON.parse(jsonBlock)
    } catch {
      return jsonResponse(
        { error: 'parse_error', message: 'Proposal JSON was malformed.' },
        502,
        requestOrigin
      )
    }

    return jsonResponse(proposal, 200, requestOrigin)
  },
}
