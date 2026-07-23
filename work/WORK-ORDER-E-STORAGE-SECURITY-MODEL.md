# Work Order E — Storage Security Model

## Trust boundaries

1. **Browser → app API** (`/api/inquiries/uploads/*`): untrusted. Zod-validated;
   only `contact_full`, `services_compact`, `industries_compact` may authorize
   uploads. Client-side validation is UX only — the server re-validates every byte.
2. **App server → Supabase** (service-role): trusted, RLS-bypassing, server-only.
   The service-role key never reaches the browser. All storage/DB orchestration
   lives in `lib/inquiry/server/storage/inquiry-upload-service.ts`; route handlers
   are thin validate→service→map shells.
3. **Anonymous → Storage**: denied. The `inquiry-attachments` bucket is private
   (`public=false`) with four `service_role`-only policies (select/insert/update/
   delete scoped to `bucket_id`, no `USING(true)`). Verified: an anon client gets
   an error downloading a stored object.

## Two-phase upload

**Authorize** (`POST …/authorize`) → validates extension/MIME/size, enforces
per-form file count + total-byte caps, generates `attachmentId` and an object key
`inquiries/{submissionId}/{attachmentId}/{sanitizedFilename}`, inserts an
`authorized` row, and returns a short-lived **signed PUT** URL (`createSignedUploadUrl`,
`upsert:false`). The browser PUTs bytes straight to Storage — they never transit
the app server.

**Complete** (`POST …/complete`) → downloads the stored bytes, re-runs magic-byte /
MIME / extension validation, then streams them to **ClamAV** (`INSTREAM`, port 3310).
- **clean** → mints a single opaque 256-bit token, stores only its **SHA-256 hash**
  on the row, returns the raw token once. This token is the *only* thing that lets
  the file associate to a Lead.
- **rejected** (malware) → deletes the object, marks the row `failed`/`rejected`,
  returns no token.
- **scanner unavailable / fails open** → no token minted; the file cannot be
  submitted. Fail closed for association.

**Associate** happens inside the `submit_inquiry` SECURITY DEFINER function: the
payload carries `attachmentTokenHashes` (raw tokens are hashed server-side in
`inquiry-submit-payload.ts` before the RPC — raw tokens never reach Postgres). The
function raises on unknown / wrong-submission / already-consumed / incomplete /
expired tokens (errcode P0001) and rolls back the whole inquiry atomically.

## Token properties

- Opaque, 256-bit, single-use, provisional-submission-scoped, TTL-bounded.
- Only the SHA-256 hash is persisted. A leaked DB row cannot reconstruct the token.
- The idempotency fingerprint **excludes** attachment tokens, so a retry is a
  replay (never a re-consume, never a duplicate Lead).

## Download

Downloads use **short-lived signed URLs** (`createSignedUrl`, TTL-bounded) minted
by a trusted server path — never the service-role key handed to a client, never a
permanent/public URL. The private bucket makes an unsigned request fail.

## Filename & content safety

- Filenames sanitized before they become object keys (no traversal, no control
  chars); the object key is server-generated, not client-controlled.
- Allow-list: PDF, DOC, DOCX, XLSX, CSV, PNG, JPG/JPEG. Enforced by extension +
  declared MIME + magic-byte signature at complete time. `.exe` is rejected at
  authorize.
- Hard cap 10 MB/file; per-form total caps (25 MB contact, 15 MB compact).

## Least privilege

`service_role` holds exactly the four DML verbs on `inquiry_attachments`
(`20260726`); `anon`/`authenticated` hold nothing. Storage policies grant nothing
to PUBLIC. The scanner and bucket credentials change by environment via env vars —
one Supabase-based storage path, no separate filesystem implementation.

## Verified vs. not

- **Verified** (8 integration tests, real stack): authorize→PUT→verify→clean scan→
  token→atomic associate→signed download; EICAR rejected + object deleted; anon
  download denied; remove deletes object; `.exe` rejected; orphan cleanup removes
  expired/associated-preserving.
- **Not applicable here**: production Storage, production Auth, production secrets —
  all forbidden by the work order and untouched.

## Browser-verified (Work Order E QA)

The Edge QA sweep (`WORK-ORDER-E-BROWSER-QA.md`, 35/35) exercised the full path
through the real local stack from the browser: signed authorize → PUT → ClamAV
scan → opaque token → atomic association, EICAR/`.exe` rejection, and confirmed
the public popups expose no upload control. `service_role`'s least-privilege
grants are preserved — QA reads verification tables via privileged local psql
rather than the anon/service client.
