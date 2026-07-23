# Work Order E — Browser QA (procedure + status)

## Status: NOT EXECUTED in this session

The full Microsoft Edge QA matrix (Step 24) was **not run** here. It is documented
below so the owner (or a follow-up session) can run it against the local stack. It
is not reported as passing.

## Why owner-gated

A faithful run needs the Next dev server pointed at the **local** Supabase stack
with the ClamAV container up, driving real file uploads through the browser. That
requires populated local env values (`.env.local` written from `supabase status`,
per the ENV-CONTRACT) which are not committed. Rather than fabricate a pass, the
matrix is left as a runnable procedure.

## Preconditions

```powershell
npm run supabase:start
docker compose -f docker/local-security.compose.yml up -d
# write .env.local from `supabase status -o json` per WORK-ORDER-E-LOCAL-SUPABASE-ENV-CONTRACT.md
npm run dev            # http://localhost:3005 --webpack
```

## Matrix

**Viewports:** 1440×900, 768×1024, 375×812, 390×844.

**Workflows (24 = 6 surfaces × 4 viewports):**
1. Contact `contact_full` Files step — upload PDF (authorize→upload→scan→Ready), submit, confirm Lead + attachment associated.
2. Contact — upload EICAR test file, confirm inline "failed the malware scan", no token, cannot submit that file.
3. Contact — upload `.exe`, confirm rejected at selection.
4. Contact — exceed 5 files / 25 MB total, confirm cap message.
5. Services `services_compact` inline CTA — "Add supporting files" disclosure, upload 2 files (max), submit.
6. Industries `industries_compact` inline CTA — same, confirm 2-file / 15 MB cap.
7. Global popup — confirm NO uploader present.
8. Case-study / security contextual CTAs — confirm NO uploader present.

## Acceptance criteria per cell

- Zero console errors, zero React hydration warnings.
- No horizontal overflow at any viewport.
- **No request to any production origin** — capture the Network panel; every
  Supabase/API call must hit a `127.0.0.1`/`localhost` origin (54521 API, signed
  Storage PUT/GET on the local Storage origin).
- Upload progress renders; terminal states (Ready / failed / rejected) render.
- Remove deletes the row (verify in Studio the object + row are gone for a
  not-yet-submitted upload).

## Evidence to capture

Per cell: a screenshot of the terminal upload state and the Network panel filtered
to show local-only origins. Store under `work/evidence/browser-qa/` (untracked).
