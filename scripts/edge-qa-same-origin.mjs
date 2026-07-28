// Same-origin journey QA in Microsoft Edge.
//
// Drives the whole loop the owner cares about — public site -> Sign in ->
// /login -> demo credentials -> /dashboard -> View website -> public site —
// and fails if any hop leaves the origin it started on. That is the actual
// regression being guarded: the repaired dashboard previously lived on a
// separate hostname from the public site and the sign-in page.
//
// Usage: node scripts/edge-qa-same-origin.mjs <baseUrl>
//   e.g. node scripts/edge-qa-same-origin.mjs https://codeoutfitters.vercel.app
//
// The base URL is always an argument — never baked in — so the same harness
// runs against a local server and against production.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.argv[2]
if (!BASE) {
  console.error('Usage: node scripts/edge-qa-same-origin.mjs <baseUrl>')
  process.exit(2)
}
const ORIGIN = new URL(BASE).origin

const DEMO_EMAIL = 'marc@gmail.com'
const DEMO_PASSWORD = '123'

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900, mobileNav: false },
  { name: '1366x768', width: 1366, height: 768, mobileNav: false },
  { name: '768x1024', width: 768, height: 1024, mobileNav: true },
  { name: '390x844', width: 390, height: 844, mobileNav: true },
  { name: '375x812', width: 375, height: 812, mobileNav: true },
]

// Pre-existing, non-routing console noise. Kept deliberately narrow so a real
// app error can never be swallowed by the filter.
const EXPECTED_CONSOLE_NOISE =
  /Encountered a script tag while rendering React component|Download the React DevTools/i

const report = []
let failures = 0
const record = (viewport, name, pass, detail = '') => {
  if (!pass) failures++
  report.push({ viewport, name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  [${viewport}] ${name}${detail ? ' — ' + detail : ''}`)
}

function isSupabase(url) {
  return /supabase\.(co|in|net)|\/auth\/v1\/|\/rest\/v1\//.test(url)
}

async function runViewport(browser, vp) {
  const bag = {
    console: [],
    pageerror: [],
    hydration: [],
    failedRequests: [],
    offOrigin: [],
    supabase: [],
    overflow: [],
  }

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  })
  const page = await context.newPage()

  page.on('console', (m) => {
    const text = m.text()
    // Next/React report hydration mismatches as errors *and* warnings.
    if (/hydrat/i.test(text)) bag.hydration.push(text)
    if (m.type() === 'error' && !EXPECTED_CONSOLE_NOISE.test(text)) bag.console.push(text)
  })
  page.on('pageerror', (e) => bag.pageerror.push(String(e)))
  page.on('requestfailed', (r) => {
    // Aborted prefetches are normal navigation churn, not a broken resource.
    const err = r.failure()?.errorText ?? ''
    if (!/ERR_ABORTED|net::ERR_ABORTED/.test(err)) bag.failedRequests.push(`${r.url()} (${err})`)
  })
  page.on('request', (r) => {
    const url = r.url()
    if (isSupabase(url)) bag.supabase.push(url)
    if (/^https?:/.test(url) && new URL(url).origin !== ORIGIN) bag.offOrigin.push(url)
  })
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === ORIGIN) {
      bag.failedRequests.push(`${r.url()} (HTTP ${r.status()})`)
    }
  })

  const checkOverflow = async (label) => {
    const ok = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    )
    if (!ok) bag.overflow.push(label)
  }

  // 1. Public site.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  record(vp.name, 'public home loads on the base origin', new URL(page.url()).origin === ORIGIN, page.url())
  await checkOverflow('/')

  // 2. Sign in from the public navbar (desktop bar or mobile drawer).
  if (vp.mobileNav) {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.locator('#site-mobile-menu').waitFor({ state: 'visible' })
  }
  const signIn = vp.mobileNav
    ? page.locator('#site-mobile-menu').getByRole('link', { name: 'Sign in' })
    : page.locator('.site-nav-signin')
  const signInHref = await signIn.getAttribute('href')
  record(vp.name, 'navbar Sign in href is the relative /login path', signInHref === '/login', String(signInHref))

  await Promise.all([page.waitForURL('**/login', { timeout: 20000 }), signIn.click()])
  record(vp.name, 'Sign in lands on /login on the SAME origin', page.url() === `${ORIGIN}/login`, page.url())
  await page.waitForLoadState('networkidle')
  await checkOverflow('/login')

  // 3. The sign-in page is the repaired Command Center screen, not the old one.
  const hasWelcome = await page.getByRole('heading', { name: 'Welcome back' }).isVisible()
  record(vp.name, 'the repaired Command Center sign-in screen is served', hasWelcome)

  const demoVisible = await page.getByText('Demo access').isVisible().catch(() => false)
  record(vp.name, 'demo credentials panel is present (demo mode)', demoVisible)

  // 4. Demo credentials -> /dashboard.
  await page.getByLabel('Email address').fill(DEMO_EMAIL)
  await page.getByLabel('Password', { exact: true }).fill(DEMO_PASSWORD)
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 30000 }),
    page.getByRole('button', { name: 'Sign in', exact: true }).click(),
  ])
  record(vp.name, 'demo sign-in opens /dashboard on the SAME origin', page.url() === `${ORIGIN}/dashboard`, page.url())
  await page.waitForLoadState('networkidle')
  await checkOverflow('/dashboard')

  // 5. The dashboard's escape hatch back to the public site.
  if (vp.mobileNav) {
    await page.getByRole('button', { name: 'Open navigation menu' }).first().click()
    await page.getByRole('dialog', { name: 'Navigation menu' }).waitFor({ state: 'visible' })
  }
  const viewSite = page.getByRole('link', { name: /View website/ }).first()
  const viewHref = await viewSite.getAttribute('href')
  const viewTarget = await viewSite.getAttribute('target')
  const viewRel = await viewSite.getAttribute('rel')
  record(vp.name, 'View website href is the relative site root', viewHref === '/', String(viewHref))
  record(
    vp.name,
    'View website opens a new tab safely',
    viewTarget === '_blank' && /noopener/.test(viewRel ?? '') && /noreferrer/.test(viewRel ?? ''),
    `target=${viewTarget} rel=${viewRel}`,
  )
  // Resolve the relative href the way the browser would: it must stay here.
  const resolved = await page.evaluate((h) => new URL(h, location.href).origin, viewHref)
  record(vp.name, 'View website resolves back to the SAME origin', resolved === ORIGIN, resolved)

  if (vp.mobileNav) {
    await page.getByRole('button', { name: 'Close navigation menu' }).first().click()
  }

  // 6. Settings, the second dashboard route the owner named.
  await page.goto(BASE + '/dashboard/settings', { waitUntil: 'networkidle' })
  record(
    vp.name,
    '/dashboard/settings serves on the SAME origin',
    page.url() === `${ORIGIN}/dashboard/settings`,
    page.url(),
  )
  await checkOverflow('/dashboard/settings')

  // 7. Close the loop back to the public site.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  record(vp.name, 'returns to the public site on the SAME origin', new URL(page.url()).origin === ORIGIN)

  // Journey-wide gates.
  record(vp.name, 'CONSOLE_ERRORS = 0', bag.console.length === 0, bag.console.slice(0, 3).join(' | '))
  record(vp.name, 'PAGE_ERRORS = 0', bag.pageerror.length === 0, bag.pageerror.slice(0, 3).join(' | '))
  record(vp.name, 'HYDRATION_ERRORS = 0', bag.hydration.length === 0, bag.hydration.slice(0, 3).join(' | '))
  record(
    vp.name,
    'UNEXPECTED_FAILED_REQUESTS = 0',
    bag.failedRequests.length === 0,
    bag.failedRequests.slice(0, 3).join(' | '),
  )
  record(vp.name, 'HORIZONTAL_OVERFLOW = 0', bag.overflow.length === 0, bag.overflow.join(', '))
  record(
    vp.name,
    'SUPABASE_REQUESTS_IN_DEMO = 0',
    bag.supabase.length === 0,
    bag.supabase.slice(0, 3).join(' | '),
  )
  record(
    vp.name,
    'no request left the base origin',
    bag.offOrigin.length === 0,
    bag.offOrigin.slice(0, 3).join(' | '),
  )

  await context.close()
  return bag
}

// Every same-origin link reachable from the public site and the dashboard shell,
// fetched once. Run at one viewport — a dead link is dead at every width.
async function sweepDeadLinks(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const targets = new Set()

  for (const path of ['/', '/login', '/dashboard', '/dashboard/settings']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))
    for (const href of hrefs) {
      if (!href || href.startsWith('#') || /^(mailto:|tel:)/.test(href)) continue
      const url = new URL(href, BASE)
      if (url.origin === ORIGIN) targets.add(url.pathname + url.search)
    }
  }

  const dead = []
  for (const target of targets) {
    const res = await page.request.get(ORIGIN + target, { maxRedirects: 5 })
    if (res.status() >= 400) dead.push(`${target} (HTTP ${res.status()})`)
  }
  record('sweep', `DEAD_LINKS = 0 (${targets.size} links checked)`, dead.length === 0, dead.join(' | '))
  await context.close()
  return { checked: [...targets], dead }
}

async function main() {
  mkdirSync('work/evidence/same-origin-qa', { recursive: true })
  // channel 'msedge' — the real Microsoft Edge build, not bundled Chromium.
  const browser = await chromium.launch({ channel: 'msedge' })
  const bags = {}
  let deadLinks
  try {
    for (const vp of VIEWPORTS) {
      bags[vp.name] = await runViewport(browser, vp)
    }
    deadLinks = await sweepDeadLinks(browser)
  } finally {
    await browser.close()
  }

  const summary = { base: BASE, origin: ORIGIN, failures, report, bags, deadLinks }
  const out = `work/evidence/same-origin-qa/${new URL(BASE).hostname}.json`
  writeFileSync(out, JSON.stringify(summary, null, 2))
  console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURES'} — evidence: ${out}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('QA RUN ERROR:', e)
  process.exit(1)
})
