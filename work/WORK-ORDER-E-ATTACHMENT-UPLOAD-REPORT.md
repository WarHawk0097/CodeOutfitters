# Work Order E — Attachment Upload Report

## What shipped (server + client, verified)

### Server platform (VERIFIED end-to-end against real Docker Supabase + ClamAV)
- Private `inquiry-attachments` Storage bucket + 4 service_role-only policies (`20260725`).
- service_role DML grants restored on `inquiry_attachments` (`20260726`).
- Single Supabase storage provider (`supabase-inquiry-storage-provider.ts`) behind
  one interface — endpoints/credentials change by env, no separate filesystem path.
- ClamAV INSTREAM scanner (`clamav-inquiry-file-scanner.ts`) + deterministic scanner
  for unit isolation.
- Two-phase upload service (`inquiry-upload-service.ts`): authorize / complete /
  delete, fail-closed on scanner unavailability.
- Three thin Route Handlers under `app/api/inquiries/uploads/` (nodejs runtime).
- Orphan cleanup (`inquiry-orphan-cleanup.ts`), idempotent, PII-free logs.
- `inquiry-submit-payload.ts` hashes tokens before the RPC; both repositories use it.

### Client UI (wired, typechecks + builds clean)
- `components/inquiry/inquiry-file-upload.tsx` — real two-phase uploader:
  picker + drag/drop, client validation (type/size/count/total), per-file state
  machine: `authorizing → uploading (XHR progress) → scanning → complete`, plus
  `rejected` / `failed` with inline recovery, and remove (DELETE for
  not-yet-submitted uploads). Emits the WO-E analytics events.
- `use-inquiry-form.ts` gained an optional `getAttachmentTokens()` the headless hook
  folds into the wire payload at submit — uploads own their lifecycle, the hook
  stays presentation-free.
- Placement wiring:
  - **Contact (`contact_full`)**: Files step now mounts the live uploader (max 5, 25 MB total).
  - **Services / Industries (`services_compact` / `industries_compact`)**: opt-in
    `enableUploads` disclosure via `ContextualInquiryCta` (max 2, 15 MB total).
  - **Global popup + contextual CTAs (`global_popup`, `case_study_contextual`,
    `security_contextual`)**: upload-free — the uploader is guarded to the three
    accepted variants regardless of props.

## Tests

- `npm test` → **91 unit tests pass** (PGlite atomic association, route, validation,
  scanner). Integration excluded from the fast sweep.
- `npm run test:integration` → **8 integration tests pass** against the real stack
  (6 upload-service + 2 orphan-cleanup).
- `npx tsc --noEmit` → **clean**.
- `npx next build` → **clean**; all three upload routes registered as dynamic.

## Analytics

`inquiry-analytics.ts` events added: `inquiry_file_rejected`,
`inquiry_upload_authorized/started/completed/failed`, `inquiry_file_removed`
(+ existing `inquiry_file_selected`). Payload props `route`, `fileCategory`,
`sizeBucket`, `failureCategory` — all privacy-safe (no filename/email/token).

## Edit / invalidation behavior (Step 18)

`submissionId` is stable across retries (idempotent replay) and regenerated only
after a fresh success. Tokens are minted under that same provisional `submissionId`,
so a submit carries only tokens valid for it. Removing a file drops its token from
the submittable set and best-effort-deletes the object. A brand-new submission
(new `submissionId`) cannot reuse a prior submission's tokens — `submit_inquiry`
rejects wrong-submission tokens and rolls back.

## Remaining / owner-gated

- **Browser QA matrix (Step 24)**: the 4-viewport × 24-workflow Microsoft Edge
  sweep was **not executed** here — see `WORK-ORDER-E-BROWSER-QA.md` for the exact
  procedure and why it is owner-gated. Not fabricated as passing.
- **Dashboard secure-download endpoint (Steps 19–21)**: **blocked, no substrate.**
  Independent verification of the tracked Command Center app shows the dashboard is
  entirely mock-backed (MSW auth returning `{userId,role,token}`, mock `fetchLeads`),
  with **no real Supabase Auth, no workspace/membership model, no `[leadId]` Lead
  detail route, and no attachments UI**. Building the authenticated download route
  as specified would require inventing that entire auth/membership subsystem, which
  is outside Work Order E. Reported as a blocker rather than fabricated.
- **Lint**: not runnable — no `eslint.config.js` (ESLint v10 flat config absent) and
  `next lint` removed in Next 16. Retained blocker; not fabricated as a pass.
