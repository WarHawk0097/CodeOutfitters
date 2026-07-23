# Work Order E — Browser QA (Microsoft Edge, local stack)

## Status: EXECUTED — 35/35 checks pass

Ran against the **local** Docker Supabase + ClamAV stack driving real file
uploads through Microsoft Edge. Harness: `scripts/edge-qa.mjs` using Playwright
`chromium.launch({ channel: "msedge" })` (system Edge, no download). No
production origin was contacted.

## How to run

```powershell
npm run supabase:start
docker compose -f docker/local-security.compose.yml up -d   # ClamAV :3310
node scripts/start-local-inquiry-platform.mjs               # launcher -> Next :3005
node scripts/edge-qa.mjs                                     # Edge QA matrix
```

The launcher reads local endpoints/keys from `supabase status -o env` **in
memory** and passes them to the Next child via the process environment only. It
never writes `.env.local`, never prints full secret values, never commits keys,
fails when the local stack is down, and refuses any Supabase URL that is not
`127.0.0.1`/`localhost`. The QA harness reads back-end verification through the
privileged local `psql` (`docker exec supabase_db_CodeOutfitters`) so the
least-privilege `service_role` grants are not weakened.

## Results

**Per-viewport presence + hygiene** (12 cells = /contact, /services, /industries
× 1440×900, 768×1024, 375×812, 390×844): PASS. Upload control present, no
horizontal overflow, console=0, page errors=0, production requests=0 in every
cell.

**Contact `contact_full`:**
- PDF reaches Ready-to-send (authorize → signed PUT → ClamAV scan) — PASS
- Review step lists the completed file — PASS
- Inquiry persists (success state) — PASS
- Local Postgres has the associated attachment row — PASS
- Local Storage contains the object — PASS
- Lead timeline has an `attachment_associated` event (verified via psql) — PASS
- EICAR test file rejected by ClamAV, never reaches Ready — PASS
- `.exe` rejected at selection — PASS
- No-file inquiry still succeeds — PASS

**Services / Industries compact (`services_compact` / `industries_compact`):**
- "Add supporting files" disclosure opens, upload completes, inquiry persists — PASS
- Stored `form_variant` matches the surface (verified via psql) — PASS

**Popups:** global / case-study / security popup (`WorkflowAuditPopup`) renders
**no upload control** — file inputs = 0 — PASS.

**Accessibility (upload UI + disclosure):**
- File input has an accessible name — PASS
- Keyboard-focusable file trigger present and receives focus — PASS
- Status is a polite live region (`role="status" aria-live="polite"`) — PASS
- Remove control has an accessible name — PASS
- Disclosure opens via keyboard (Enter) under `prefers-reduced-motion` — PASS

**Global browser gates (deep flows):** console errors = 0, page errors = 0,
production requests = 0. Deliberate rejection responses (EICAR, `.exe`) are
classified separately from unexpected failures via an expected-noise filter, so
they are not counted as errors.

## Defects found and fixed

1. **React setState-in-render** — `InquiryFileUpload` called the parent
   token/completed-files callbacks inside a `setItems` updater ("Cannot update a
   component while rendering a different component"). Moved to a post-commit
   `useEffect` keyed on `items`, callbacks held in refs. Real product bug.
2. **Missing upload a11y** — added `role="status" aria-live="polite"` to the
   per-file status and `role="progressbar"` + `aria-valuenow/min/max` to the
   progress bar. Real fixes, not test workarounds.
3. **Engagement popup race** — the timed `WorkflowAuditPopup` auto-opened during
   the ~40s ClamAV wait, and its full-screen backdrop covered the consent
   checkbox. The QA seeds the popup's own suppression key
   (`co_workflow_audit_popup`, simulating an already-shown visitor) so the
   automated flow is deterministic. This touches only the marketing popup, never
   the upload path; the popup's absence of an upload control is asserted
   separately.
4. **Harness robustness (not product defects):** the native `<details>`
   disclosure is opened via keyboard (focus + Enter) because a pointer click at
   the full-width `<summary>`'s centre lands on a sibling field; back-end
   verification (timeline event, `form_variant`) reads through privileged psql
   because `service_role` has least-privilege grants and cannot `SELECT` those
   tables.

## Static gates (run after repairs)

| Gate | Command | Result |
|------|---------|--------|
| Unit | `npx vitest run` | 91/91 pass (13 files) |
| Docker integration | `npx vitest run --config vitest.integration.config.ts` | 8/8 pass |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Lint | `npm run lint` (`eslint .`) | **blocked** — `eslint` binary not installed and no `eslint.config.*`/`.eslintrc*`; pre-existing tooling gap, not fabricated as passing |

Integration gate env (local, in-memory only, never written to disk):
`NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SECRET_KEY`,
`INQUIRY_STORAGE_MODE=supabase`, `INQUIRY_STORAGE_BUCKET=inquiry-attachments`,
`INQUIRY_FILE_SCANNER_MODE=clamav`, `INQUIRY_CLAMAV_HOST=127.0.0.1`,
`INQUIRY_CLAMAV_PORT=3310`.

## Out of scope (transferred to Work Order F)

Authenticated Command Center dashboard auth and the secure dashboard download
endpoint are **not** part of Work Order E. Recorded as
`TRANSFERRED_TO_WORK_ORDER_F_COMMAND_CENTER_DATA_FOUNDATION`, not a waiver.

## Evidence

Screenshots and any per-cell captures live under `work/evidence/browser-qa/`
(untracked). Local Supabase data, Docker volumes, credentials, uploaded QA
files, ClamAV runtime data, and browser profiles are never committed.
