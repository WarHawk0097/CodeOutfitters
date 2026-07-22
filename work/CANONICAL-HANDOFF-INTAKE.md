# CANONICAL HANDOFF INTAKE (remediated)
Supersedes the verification caveat in F:\CodeOutfitters\INTAKE-AND-ARCHITECTURE-ANALYSIS.md (that report stays in place, unmodified, as the original doc-based pass).
This doc = doc-based intake + direct .dc.html inspection + F:\CodeOutfitters repo audit, reconciled.

## 1. Canonical authority — CONFIRMED, now including direct markup read
- Command Center Final.dc.html, SHA-256 758c8ae303cb89747e9835b658dc5ce05132fd3c30a072416961e6d0bcf9f522, re-verified.
- Direct inspection (work/CANONICAL-DC-DIRECT-INSPECTION.md): 49 data-screen-label frames confirmed, viewports (390/820/1440) confirmed, canonical tokens confirmed, all 9 rejected patterns confirmed absent (2 verified by direct frame read, not just grep), "Live Pitch" presence confirmed (was previously unverified), consent-visibility and REQUIRES-PROVIDER UI states confirmed present in markup.
- No conflict found between .dc.html, integration-layer JSON, and docs at all sampled points.

## 2. Product scope — unchanged from original intake
13 modules, 22 routes, component architecture, Row 6 Kanban override, design tokens, state machines/approval gates — all as stated in INTAKE-AND-ARCHITECTURE-ANALYSIS.md §2-6. Not re-litigated here.

## 3. Target repo reality — CORRECTED (was wrong in original intake §10.2)
F:\CodeOutfitters is NOT "unrelated in structure." It is a live Next.js 16 app (public site + a nascent `app/admin/` internal tools stub). See work/REPO-AUDIT.md for full detail, work/ADR-COMMAND-CENTER-LOCATION.md for the location decision this creates.
`POST /api/leads` (named in docs as the integration surface) does not exist yet in this repo — confirmed by directory search, no `app/api/` anywhere.

## 4. Backend/provider status — unchanged, confirmed
REQUIRES_BACKEND, REQUIRES_PROVIDER (email/calendar/transcription/AI/e-signature) — all placeholders, none connected. Confirmed both by docs (PRODUCTION-READINESS-CHECKLIST.md) and by direct markup (M-D18 "AI provider unavailable" state rendered explicitly in the .dc.html itself, not just described in docs).

## 5. Consolidated open questions (supersedes original intake §10)
1. **Location (new, material):** app/admin/ extend-and-replace vs separate app — see ADR. Blocks Phase 1+ file placement.
2. **Backend/providers (carried over):** target backend framework/DB, and which of email (Resend vs Postmark)/calendar/transcription/AI/e-signature are actually contracted. Blocks provider-adapter phases.
3. **Stack confirmation (carried over, now sharper):** Next.js App Router + Tailwind + shadcn was assumed generically; now that we know the actual repo, the real question is "same Next.js 16/React 19/Tailwind 4 versions as the existing app, reused in-place" (if ADR decision = A) vs "fresh install, own versions" (if decision = B).
4. **Existing app/admin/ stub disposition:** confirmed disposable-looking (localStorage-only, no shared design system) but not confirmed zero-traffic/unused — user should confirm before deletion.

## 6. Status
DESIGN COMPLETE (per original docs), verified at markup level. Nothing implemented. No dependencies installed for Command Center. No migrations. No deploy config touched by this session. This session's only filesystem changes: files under F:\CodeOutfitters\work\ (new directory, new docs) — nothing under F:\CodeOutfitters\Dashboard\ or the app code was modified.
