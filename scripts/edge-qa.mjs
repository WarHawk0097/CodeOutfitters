// Work Order E — Microsoft Edge browser QA for the local Docker Supabase upload
// platform. Drives the real /contact, /services, /industries upload workflows in
// Edge (chromium channel "msedge") against the LOCAL Next dev server + LOCAL
// Supabase Storage + LOCAL ClamAV, then verifies persistence directly in local
// Docker Postgres and Storage with a service-role client.
//
// Hard guards:
//   * every network request must target a local origin — a production/Supabase
//     cloud/Vercel origin fails the run immediately;
//   * console errors, page errors and hydration warnings are collected and gate
//     the result;
//   * expected rejections (EICAR, .exe) are classified as PASS, not failure.
//
// Usage (dev server must be running via scripts/start-local-inquiry-platform.mjs):
//   node scripts/edge-qa.mjs
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE_URL || 'http://localhost:3005'
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
]
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
// Minimal valid files (correct magic bytes).
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
const EXE = Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'binary')

// --- local Supabase service-role client (verification only) -----------------
function localEnv() {
  const raw = execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8' })
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}
const sb = localEnv()
const apiOrigin = new URL(sb.API_URL).origin
const admin = createClient(sb.API_URL, sb.SECRET_KEY || sb.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const BUCKET = 'inquiry-attachments'

// Privileged read-only verification against local Docker Postgres. The audit
// table lead_timeline_events is written by the SECURITY DEFINER submit_inquiry
// function and is intentionally NOT granted to the least-privilege service key,
// so we verify it as the postgres superuser inside the DB container rather than
// weaken the app's production grants. Superuser, local-only, verification only.
const DB_CONTAINER = process.env.QA_DB_CONTAINER || 'supabase_db_CodeOutfitters'
function dbScalar(sql) {
  return execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'postgres', '-tAc', sql], {
    encoding: 'utf8',
  }).trim()
}

// Local origins the browser is allowed to talk to.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
function isLocal(u) {
  try {
    const h = new URL(u).hostname
    return LOCAL_HOSTS.has(h)
  } catch {
    return u.startsWith('data:') || u.startsWith('blob:')
  }
}

const results = []
const record = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

// Chromium logs a console error for every non-2xx response ("Failed to load
// resource: the server responded with a status of NNN"). Our rejection tests
// (EICAR, .exe, oversized, expired) deliberately provoke 4xx upload responses,
// so those messages are EXPECTED and must not gate the run. We drop only this
// HTTP-status mirror noise; genuine app errors (React, hydration, uncaught) are
// still collected. Unexpected 5xx resource failures are kept as real errors.
const EXPECTED_RESOURCE_NOISE = /Failed to load resource:.*status of 4\d\d/i
function attachGuards(page, bag) {
  page.on('console', (m) => {
    if (m.type() === 'error' && !EXPECTED_RESOURCE_NOISE.test(m.text())) bag.console.push(m.text())
  })
  page.on('pageerror', (e) => bag.pageerror.push(String(e)))
  page.on('request', (r) => {
    const u = r.url()
    if (!isLocal(u)) bag.production.push(u)
  })
}

async function noHorizontalOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  )
}

async function fillContactToFiles(page, workEmail) {
  await page.fill('#contact-firstName', 'Ada')
  await page.fill('#contact-workEmail', workEmail)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.fill('#contact-businessName', 'Lovelace Ltd')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.fill('#contact-workflowDescription', 'Automate weekly reporting pipeline end to end for the team.')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForSelector('input[type=file]', { state: 'attached' })
}

async function setFile(page, name, buf, mime) {
  await page.setInputFiles('input[type=file]', { name, mimeType: mime, buffer: buf })
}

async function main() {
  mkdirSync('work/evidence/browser-qa', { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge' })

  // --- per-viewport presence + hygiene -------------------------------------
  for (const vp of VIEWPORTS) {
    for (const [route, sel] of [
      ['/contact', 'input[type=file]'],
      ['/services', 'summary'],
      ['/industries', 'summary'],
    ]) {
      const bag = { console: [], pageerror: [], production: [] }
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
      const page = await ctx.newPage()
      attachGuards(page, bag)
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 })
        // Reach the uploader control on Contact (Files step) / disclosure elsewhere.
        if (route === '/contact') {
          await fillContactToFiles(page, `qa+${randomUUID().slice(0, 8)}@example.com`)
        }
        const present = (await page.locator(sel).count()) > 0
        const overflow = await noHorizontalOverflow(page)
        const clean = bag.console.length === 0 && bag.pageerror.length === 0 && bag.production.length === 0
        record(
          `${route} @ ${vp.name}`,
          present && overflow && clean,
          `control=${present} noOverflow=${overflow} console=${bag.console.length} page=${bag.pageerror.length} prod=${bag.production.length}`,
        )
        if (bag.production.length) record(`${route} @ ${vp.name} PRODUCTION_ORIGIN`, false, bag.production.join(', '))
      } catch (e) {
        record(`${route} @ ${vp.name}`, false, String(e).slice(0, 140))
      } finally {
        await ctx.close()
      }
    }
  }

  // --- deep upload workflows (1440x900) ------------------------------------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const bag = { console: [], pageerror: [], production: [] }
  attachGuards(page, bag)

  // Capture the inquiry POST response for association verification.
  let lastInquiry = null
  page.on('response', async (res) => {
    if (res.url().endsWith('/api/inquiries') && res.request().method() === 'POST' && res.ok()) {
      try {
        lastInquiry = await res.json()
      } catch {}
    }
  })

  // 1) Contact happy path — PDF -> Ready -> Review lists it -> submit -> persist.
  try {
    lastInquiry = null
    const email = `qa+${randomUUID().slice(0, 8)}@example.com`
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
    await fillContactToFiles(page, email)
    await setFile(page, 'brief.pdf', PDF, 'application/pdf')
    await page.getByText('Ready to send', { exact: false }).waitFor({ timeout: 40000 })
    record('contact: PDF reaches Ready-to-send (authorize→upload→scan)', true)
    await page.getByRole('button', { name: 'Continue' }).click() // to Review
    const reviewHasFile = (await page.getByText('brief.pdf').count()) > 0
    record('contact: Review lists the completed file', reviewHasFile)
    await page.locator('#contact-privacy').check()
    await page.getByRole('button', { name: 'Send my request' }).click()
    await page.getByRole('heading', { name: /request is in/i }).waitFor({ timeout: 20000 })
    record('contact: inquiry persists (success state)', !!lastInquiry, lastInquiry ? `lead=${lastInquiry.leadId?.slice(0, 8)}` : 'no response captured')

    if (lastInquiry?.leadId) {
      const { data: att } = await admin
        .from('inquiry_attachments')
        .select('id, storage_key, submission_id, lead_id, token_consumed_at, upload_status, scan_status')
        .eq('lead_id', lastInquiry.leadId)
      const row = att?.[0]
      record('contact: local Postgres has associated attachment', !!row && row.token_consumed_at != null && row.scan_status === 'clean')
      if (row) {
        const { data: obj } = await admin.storage.from(BUCKET).list(row.storage_key.split('/').slice(0, -1).join('/'))
        record('contact: local Storage contains the object', (obj?.length ?? 0) > 0)
      }
      const attachEvents = dbScalar(
        `select count(*) from public.lead_timeline_events where lead_id = '${lastInquiry.leadId}' and event_type like '%attach%';`,
      )
      record('contact: Lead timeline has an attachment event', Number(attachEvents) > 0, `attach events=${attachEvents}`)
    }
  } catch (e) {
    record('contact: happy path', false, String(e).slice(0, 200))
  }

  // 2) Contact EICAR -> rejected, no success for the file.
  try {
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
    await fillContactToFiles(page, `qa+${randomUUID().slice(0, 8)}@example.com`)
    await setFile(page, 'threat.csv', Buffer.from(EICAR), 'text/csv')
    await page.getByText(/malware scan|failed|could not/i).waitFor({ timeout: 40000 })
    const hasReady = (await page.getByText('Ready to send').count()) > 0
    record('contact: EICAR rejected by ClamAV, never Ready', !hasReady)
  } catch (e) {
    record('contact: EICAR rejection', false, String(e).slice(0, 160))
  }

  // 3) Contact .exe -> rejected at selection.
  try {
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
    await fillContactToFiles(page, `qa+${randomUUID().slice(0, 8)}@example.com`)
    await setFile(page, 'malware.exe', EXE, 'application/octet-stream')
    await page.getByText(/not a supported file type/i).waitFor({ timeout: 8000 })
    record('contact: .exe rejected at selection', true)
  } catch (e) {
    record('contact: .exe rejection', false, String(e).slice(0, 160))
  }

  // 4) Contact no-file submission still succeeds.
  try {
    lastInquiry = null
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
    await fillContactToFiles(page, `qa+${randomUUID().slice(0, 8)}@example.com`)
    await page.getByRole('button', { name: 'Continue' }).click() // Files -> Review
    await page.locator('#contact-privacy').check()
    await page.getByRole('button', { name: 'Send my request' }).click()
    await page.getByRole('heading', { name: /request is in/i }).waitFor({ timeout: 20000 })
    record('contact: no-file inquiry succeeds', !!lastInquiry)
  } catch (e) {
    record('contact: no-file submission', false, String(e).slice(0, 160))
  }

  // 5+6) Services / Industries compact upload via disclosure.
  // Seed the popup's own suppression key so the timed engagement popup does not
  // auto-open mid-flow (it otherwise fires during the long ClamAV wait and its
  // full-screen backdrop covers the form). This simulates a visitor who already
  // saw it — it does NOT touch the upload path. Applied before every navigation.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('co_workflow_audit_popup', JSON.stringify({ version: 1, submitted: true }))
    } catch {}
  })
  for (const [route, variant] of [
    ['/services', 'services_compact'],
    ['/industries', 'industries_compact'],
  ]) {
    try {
      lastInquiry = null
      await page.goto(BASE + route, { waitUntil: 'networkidle' })
      await page.locator(`#${variant}-firstName`).fill('Ada')
      await page.locator(`#${variant}-workEmail`).fill(`qa+${randomUUID().slice(0, 8)}@example.com`)
      await page.locator(`#${variant}-businessName`).fill('Lovelace Ltd')
      await page.locator(`#${variant}-workflowDescription`).fill('Automate the manual booking-to-invoice handoff for us.')
      // Open the native <details> disclosure via the keyboard. The summary is
      // full-width, so its geometric centre overlaps a sibling field and a
      // pointer click (even forced) lands on the field instead of toggling. A
      // real user opens it by clicking the label or, as here, focusing the
      // summary and pressing Enter — the accessible path we also assert below.
      const disclosure = page.locator('summary').filter({ hasText: 'Add supporting files' })
      await disclosure.scrollIntoViewIfNeeded()
      await disclosure.focus()
      await page.keyboard.press('Enter')
      await page
        .locator('details')
        .filter({ has: disclosure })
        .first()
        .waitFor({ state: 'attached' })
      await setFile(page, 'brief.pdf', PDF, 'application/pdf')
      await page.getByText('Ready to send', { exact: false }).waitFor({ timeout: 40000 })
      await page.locator(`#${variant}-privacy`).check()
      await page.locator('button[type=submit]').click()
      await page.getByRole('heading', { name: /request is in/i }).waitFor({ timeout: 20000 })
      const ok = !!lastInquiry && lastInquiry.leadId
      record(`${route}: compact upload persists (${variant})`, !!ok, lastInquiry ? `lead=${lastInquiry.leadId?.slice(0, 8)}` : 'no response')
      if (lastInquiry?.leadId) {
        // service_role has least-privilege grants (no SELECT on submissions), so
        // read the stored variant with the privileged local psql, same as the
        // timeline check above.
        const stored = dbScalar(`select string_agg(form_variant, ',') from public.lead_form_submissions where lead_id = '${lastInquiry.leadId}';`)
        record(`${route}: submission form_variant is ${variant}`, stored.split(',').includes(variant), stored)
      }
    } catch (e) {
      record(`${route}: compact upload`, false, String(e).slice(0, 200))
    }
  }

  // 7) Global / case-study / security popup carries NO upload control (spec).
  // The audit popup is the single global/contextual popup; manual open bypasses
  // suppression. Assert it renders and contains zero file inputs.
  try {
    await page.goto(BASE + '/services', { waitUntil: 'networkidle' })
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-workflow-audit')))
    const popup = page.locator('[class*="z-[1000]"]').first()
    await popup.waitFor({ state: 'visible', timeout: 5000 })
    const uploadsInPopup = await popup.locator('input[type=file]').count()
    record('popup: global/case-study/security popup has no upload control', uploadsInPopup === 0, `file inputs=${uploadsInPopup}`)
    await page.keyboard.press('Escape')
  } catch (e) {
    record('popup: no upload control', false, String(e).slice(0, 160))
  }

  // --- accessibility (upload UI + disclosure) ------------------------------
  try {
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
    await fillContactToFiles(page, `qa+${randomUUID().slice(0, 8)}@example.com`)
    const fileInput = page.locator('input[type=file]')
    const inputName = await fileInput.evaluate((el) => {
      const lbl = el.labels && el.labels[0]
      return (el.getAttribute('aria-label') || (lbl && lbl.textContent) || '').trim()
    })
    record('a11y: file input has an accessible name', inputName.length > 0, inputName.slice(0, 40))
    const chooser = page.getByRole('button', { name: /choose files/i })
    record('a11y: keyboard-focusable file trigger present', (await chooser.count()) > 0)
    await chooser.focus()
    record('a11y: file trigger receives focus', await chooser.evaluate((el) => el === document.activeElement))
    await setFile(page, 'brief.pdf', PDF, 'application/pdf')
    record('a11y: status is a polite live region', (await page.locator('[role=status][aria-live=polite]').count()) > 0)
    await page.getByText('Ready to send', { exact: false }).waitFor({ timeout: 40000 })
    record('a11y: remove control has an accessible name', (await page.getByRole('button', { name: /remove brief\.pdf/i }).count()) > 0)
  } catch (e) {
    record('a11y: contact upload accessibility', false, String(e).slice(0, 160))
  }

  // Disclosure must be operable with the keyboard (Enter), not pointer-only,
  // and still work when the user prefers reduced motion.
  try {
    const rmCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    })
    const rmPage = await rmCtx.newPage()
    await rmPage.goto(BASE + '/services', { waitUntil: 'networkidle' })
    const summary = rmPage.locator('summary').filter({ hasText: 'Add supporting files' })
    await summary.scrollIntoViewIfNeeded()
    await summary.focus()
    await rmPage.keyboard.press('Enter')
    const opened = await rmPage
      .locator('details')
      .filter({ has: summary })
      .first()
      .evaluate((d) => d.open)
    record('a11y: disclosure opens via keyboard under reduced-motion', opened === true)
    await rmCtx.close()
  } catch (e) {
    record('a11y: disclosure keyboard operability', false, String(e).slice(0, 160))
  }

  record('global console errors (deep flows)', bag.console.length === 0, bag.console.slice(0, 3).join(' | '))
  record('global page errors (deep flows)', bag.pageerror.length === 0, bag.pageerror.slice(0, 3).join(' | '))
  record('global production requests (deep flows)', bag.production.length === 0, bag.production.slice(0, 5).join(' | '))

  await ctx.close()
  await browser.close()

  const summary = {
    base: BASE,
    localApiOrigin: apiOrigin,
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass),
    results,
    ranAt: new Date().toISOString(),
  }
  writeFileSync('work/evidence/browser-qa/edge-qa-results.json', JSON.stringify(summary, null, 2))
  console.log(`\n${summary.passed}/${summary.total} checks passed. Failures: ${summary.failed.length}`)
  process.exit(summary.failed.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('QA harness crashed:', e)
  process.exit(2)
})
