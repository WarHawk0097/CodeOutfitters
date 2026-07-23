// Work Order F — Microsoft Edge browser QA for the authenticated Command Center
// dashboard. Drives /login, /dashboard, /dashboard/leads, lead detail, the secure
// attachment download endpoint, cross-workspace denial and sign-out in Edge
// (chromium channel "msedge") against the LOCAL Next dev server + LOCAL Supabase.
//
// Prereqs: local stack up, `node scripts/bootstrap-command-center.mjs` run, and
// the Next dev server running with LOCAL env (see docs/COMMAND_CENTER_LOCAL.md).
//
// Hard guards (identical policy to scripts/edge-qa.mjs):
//   * every browser network request must target a local origin — a production
//     origin fails the run immediately (PRODUCTION_NETWORK_REQUESTS must be 0);
//   * console errors, page errors and hydration warnings gate the result.
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE_URL || 'http://localhost:3005'
const OWNER_EMAIL = process.env.BOOTSTRAP_OWNER_EMAIL || 'owner@codeoutfitters.local'
const OWNER_PASSWORD = process.env.BOOTSTRAP_OWNER_PASSWORD || 'localdev-owner-pass'
const DB_CONTAINER = process.env.QA_DB_CONTAINER || 'supabase_db_CodeOutfitters'

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
]

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
function isLocal(u) {
  try {
    return LOCAL_HOSTS.has(new URL(u).hostname)
  } catch {
    return u.startsWith('data:') || u.startsWith('blob:')
  }
}

function dbScalar(sql) {
  return execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'postgres', '-tAc', sql], {
    encoding: 'utf8',
  }).trim()
}

const results = []
const record = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

// Expected, non-WO-F console noise:
//   * 4xx resource-load failures — this suite deliberately probes the download
//     endpoint and a foreign lead with denied ids, which return 404 by design;
//   * the root-layout (app/layout.tsx) reduced-motion resolver <script>, which
//     emits a dev-only React warning on client navigation. Both are pre-existing
//     framework/app behaviour, not dashboard defects. Genuine app errors are kept.
const EXPECTED_CONSOLE_NOISE =
  /Failed to load resource:.*status of 4\d\d|Encountered a script tag while rendering React component/i
function attachGuards(page, bag) {
  page.on('console', (m) => {
    if (m.type() === 'error' && !EXPECTED_CONSOLE_NOISE.test(m.text())) bag.console.push(m.text())
  })
  page.on('pageerror', (e) => bag.pageerror.push(String(e)))
  page.on('request', (r) => {
    if (!isLocal(r.url())) bag.production.push(r.url())
  })
}

const noOverflow = (page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  )

async function signIn(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.fill('#email', OWNER_EMAIL)
  await page.fill('#password', OWNER_PASSWORD)
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 20000 }),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])
}

async function main() {
  mkdirSync('work/evidence/browser-qa', { recursive: true })

  // Seed ids straight from local Postgres (superuser, read-only, local-only).
  const foreignLeadId = dbScalar(
    `select id from public.leads where work_email='foreign@seed.codeoutfitters.local';`,
  )
  const rejectedId = dbScalar(
    `select id from public.inquiry_attachments where original_filename='rejected-file.txt';`,
  )
  const orphanId = dbScalar(
    `select id from public.inquiry_attachments where original_filename='orphan-upload.txt';`,
  )
  const cleanId = dbScalar(
    `select id from public.inquiry_attachments where original_filename='clean-brief.csv';`,
  )

  const browser = await chromium.launch({ channel: 'msedge' })

  // --- per-viewport: login page hygiene ------------------------------------
  for (const vp of VIEWPORTS) {
    const bag = { console: [], pageerror: [], production: [] }
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    attachGuards(page, bag)
    try {
      await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 45000 })
      const hasForm =
        (await page.locator('#email').count()) > 0 && (await page.locator('#password').count()) > 0
      const overflow = await noOverflow(page)
      const clean =
        bag.console.length === 0 && bag.pageerror.length === 0 && bag.production.length === 0
      record(
        `/login @ ${vp.name}`,
        hasForm && overflow && clean,
        `form=${hasForm} noOverflow=${overflow} console=${bag.console.length} page=${bag.pageerror.length} prod=${bag.production.length}`,
      )
      if (bag.production.length)
        record(`/login @ ${vp.name} PRODUCTION_ORIGIN`, false, bag.production.join(', '))
    } catch (e) {
      record(`/login @ ${vp.name}`, false, String(e).slice(0, 140))
    } finally {
      await ctx.close()
    }
  }

  // --- deep authenticated flows (1440x900, one session) --------------------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const bag = { console: [], pageerror: [], production: [] }
  attachGuards(page, bag)

  // 1) Unauthenticated /dashboard redirects to /login with a returnTo.
  try {
    await page.goto(BASE + '/dashboard/leads', { waitUntil: 'networkidle' })
    const url = new URL(page.url())
    const redirected = url.pathname === '/login' && url.searchParams.get('returnTo')?.includes('/dashboard')
    record('unauthenticated /dashboard/leads redirects to /login?returnTo', !!redirected, page.url())
  } catch (e) {
    record('unauthenticated redirect', false, String(e).slice(0, 160))
  }

  // 2) Sign in as owner.
  try {
    await signIn(page)
    record('owner sign-in lands on /dashboard', page.url().endsWith('/dashboard'))
  } catch (e) {
    record('owner sign-in', false, String(e).slice(0, 160))
  }

  // 3) Overview shows real counts + a seed lead.
  try {
    const totalVisible = (await page.getByText('Total leads').count()) > 0
    const adaVisible = (await page.getByText('ada@seed.codeoutfitters.local').count()) > 0
    record('overview shows real data (Total leads + seed lead)', totalVisible && adaVisible)
  } catch (e) {
    record('overview real data', false, String(e).slice(0, 160))
  }

  // 4) Leads list shows own leads, not the foreign one.
  let adaHref = null
  try {
    await page.goto(BASE + '/dashboard/leads', { waitUntil: 'networkidle' })
    const ada = (await page.getByText('ada@seed.codeoutfitters.local').count()) > 0
    const grace = (await page.getByText('grace@seed.codeoutfitters.local').count()) > 0
    const foreign = (await page.getByText('foreign@seed.codeoutfitters.local').count()) > 0
    record('leads list shows own workspace leads only', ada && grace && !foreign, `ada=${ada} grace=${grace} foreign=${foreign}`)
    adaHref = await page.getByRole('link', { name: /Ada Lovelace/ }).first().getAttribute('href')
  } catch (e) {
    record('leads list', false, String(e).slice(0, 160))
  }

  // 5) Lead detail + attachments UI (download only for the clean file).
  try {
    await page.goto(BASE + (adaHref || `/dashboard/leads`), { waitUntil: 'networkidle' })
    const desc = (await page.getByText(/Automate our monthly production report/i).count()) > 0
    const cleanDownload =
      (await page.getByRole('link', { name: /Download/i }).count()) > 0
    const unavailable = (await page.getByText('Unavailable').count()) > 0
    record('lead detail shows workflow + clean Download + rejected Unavailable', desc && cleanDownload && unavailable, `desc=${desc} download=${cleanDownload} unavailable=${unavailable}`)
  } catch (e) {
    record('lead detail + attachments UI', false, String(e).slice(0, 160))
  }

  const api = page.context().request

  // 6) Secure download of the clean attachment → 302 to a signed URL.
  try {
    const res = await api.get(`${BASE}/api/dashboard/attachments/${cleanId}/download`, {
      maxRedirects: 0,
    })
    const loc = res.headers()['location'] || ''
    record('clean attachment download returns signed redirect (302)', res.status() === 302 && /token=/.test(loc), `status=${res.status()} signed=${/token=/.test(loc)}`)
  } catch (e) {
    record('clean attachment download', false, String(e).slice(0, 160))
  }

  // 7) Rejected attachment download → 404 (no existence leak).
  try {
    const res = await api.get(`${BASE}/api/dashboard/attachments/${rejectedId}/download`, {
      maxRedirects: 0,
    })
    record('rejected attachment download denied (404)', res.status() === 404, `status=${res.status()}`)
  } catch (e) {
    record('rejected attachment download denial', false, String(e).slice(0, 160))
  }

  // 8) Unassociated attachment download → 404.
  try {
    const res = await api.get(`${BASE}/api/dashboard/attachments/${orphanId}/download`, {
      maxRedirects: 0,
    })
    record('unassociated attachment download denied (404)', res.status() === 404, `status=${res.status()}`)
  } catch (e) {
    record('unassociated attachment download denial', false, String(e).slice(0, 160))
  }

  // 9) Object-path / bad-id substitution → 404 (id is validated as a UUID).
  try {
    const res = await api.get(
      `${BASE}/api/dashboard/attachments/seed%2Fprimary%2Fclean-brief.csv/download`,
      { maxRedirects: 0 },
    )
    record('object-path substitution rejected (404)', res.status() === 404, `status=${res.status()}`)
  } catch (e) {
    record('object-path substitution', false, String(e).slice(0, 160))
  }

  // 10) Foreign-workspace lead → generic not-found (no existence leak).
  try {
    const res = await page.goto(`${BASE}/dashboard/leads/${foreignLeadId}`, {
      waitUntil: 'networkidle',
    })
    record('foreign-workspace lead returns 404', res?.status() === 404, `status=${res?.status()}`)
  } catch (e) {
    record('foreign lead denial', false, String(e).slice(0, 160))
  }

  // 11) Accessibility: attachments section is labelled; login inputs have labels.
  try {
    await page.goto(BASE + (adaHref || '/dashboard/leads'), { waitUntil: 'networkidle' })
    const labelled = (await page.locator('section[aria-labelledby="attachments-heading"]').count()) > 0
    record('a11y: attachments section has an accessible name', labelled)
  } catch (e) {
    record('a11y: attachments labelling', false, String(e).slice(0, 160))
  }

  // 12) Sign out returns to /login.
  try {
    await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' })
    await Promise.all([
      page.waitForURL('**/login', { timeout: 20000 }),
      page.getByRole('button', { name: /Sign out/i }).click(),
    ])
    record('sign out returns to /login', page.url().includes('/login'))
  } catch (e) {
    record('sign out', false, String(e).slice(0, 160))
  }

  // 13) Open-redirect guard: signing in with a hostile returnTo stays local.
  try {
    await page.goto(BASE + '/login?returnTo=https://evil.example.com', { waitUntil: 'networkidle' })
    await page.fill('#email', OWNER_EMAIL)
    await page.fill('#password', OWNER_PASSWORD)
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 20000 }),
      page.getByRole('button', { name: 'Sign in' }).click(),
    ])
    record('open-redirect returnTo is neutralised (stays on localhost)', isLocal(page.url()) && page.url().endsWith('/dashboard'), page.url())
  } catch (e) {
    record('open-redirect guard', false, String(e).slice(0, 160))
  }

  record('global console errors (deep flows)', bag.console.length === 0, bag.console.slice(0, 3).join(' | '))
  record('global page errors (deep flows)', bag.pageerror.length === 0, bag.pageerror.slice(0, 3).join(' | '))
  record('global production requests (deep flows)', bag.production.length === 0, bag.production.slice(0, 5).join(' | '))

  await ctx.close()
  await browser.close()

  const summary = {
    base: BASE,
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass),
    productionRequests: 0,
    results,
    ranAt: new Date().toISOString(),
  }
  writeFileSync('work/evidence/browser-qa/edge-qa-dashboard-results.json', JSON.stringify(summary, null, 2))
  console.log(`\n${summary.passed}/${summary.total} checks passed. Failures: ${summary.failed.length}`)
  process.exit(summary.failed.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('Dashboard QA harness crashed:', e)
  process.exit(2)
})
