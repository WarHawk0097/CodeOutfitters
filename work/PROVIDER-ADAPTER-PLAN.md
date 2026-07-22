# PROVIDER ADAPTER PLAN (Phase 0 decision closure — 8 adapters)
All providers DEFERRED_PENDING_SELECTION (none connected, none contracted, per PHASE0-DECISION-CLOSURE.md DECISION 3). This plan defines the adapter boundary so mock-first implementation (PHASE 2 of the phased plan) can later be swapped to real providers without rewriting UI/state-machine code. Adapters live in `command-center/packages/provider-adapters` (per ADR-COMMAND-CENTER-LOCATION.md).

## Adapter boundary principle
Every provider integration sits behind a narrow interface matching the shape state-machines.json/api-contracts.json already expect. UI and state machines call the interface, never a vendor SDK directly. Swapping mock -> real provider = swap the adapter implementation only, never the caller.

## Provider interfaces (8, per DECISION 3)
| Interface | Shape (from api-contracts.json / state-machines.json) | Candidate vendors (unconfirmed — user must select) | Mock strategy |
|---|---|---|---|
| EmailProvider | `sendEmail(to, template, data) -> {id, status}` | Resend vs Postmark | Fixture handler returning fixed success/failure per test case |
| CalendarProvider | `createEvent`, `getAvailability` | Google Calendar, Microsoft Graph | Fixture-based static availability |
| MeetingPlatformProvider | `createMeeting`, `getJoinUrl`, session lifecycle | Google Meet, Microsoft Teams, Zoom | Fixture-based fake meeting session |
| TranscriptionProvider | `startSession(consent: boolean)`, streaming transcript events (segments, speaker separation, timestamps, confidence) | not named — vendor TBD | Canned transcript fixture; consent-gate enforced client-side regardless of mock/real |
| LanguageModelProvider | `generateInsight(context) -> {output, requiresApproval: true}` | Anthropic, OpenAI | Fixture responses matching AI-SAFETY-AND-REVIEW-SPEC.md constraints (no invented pricing/case studies/sentiment %), baked in so UI is built against realistic-shaped output from day one |
| ObjectStorageProvider | `putObject`, `getObject`, `getSignedUrl` | S3-compatible (vendor TBD) | Local filesystem or in-memory fake store |
| PdfRenderingProvider | `renderProposalPdf(sections) -> {url/bytes}` | Server-side Chromium/Playwright rendering, or dedicated PDF service | Fixture-based canned PDF bytes/URL |
| ProposalAcceptanceProvider | `sendForSignature`, `getStatus` | Internal acceptance record initially; third-party e-signature optional/deferred | Fixture-based signed/pending/declined states |

Note: an internal acknowledgement record must never be represented as a full legal e-signature platform until a real ProposalAcceptanceProvider vendor is contracted and confirmed.

## Mandatory constraints on every adapter (from state-machines.json + AI-SAFETY-AND-REVIEW-SPEC.md)
- Every mutation-capable adapter call is wrapped by the relevant state machine's `humanApproval` gate — never auto-applies (e.g. `STATE_CRM_RECOMMENDATION_REVIEW`, `STATE_PROPOSAL_DELIVERY`).
- Consent enforcement (`STATE_MEETING_SESSION`) applies identically whether TranscriptionProvider is mock or real.
- Client-facing AI surfaces (e.g. "Live Pitch — client-safe") never expose AI provenance or unapproved assumptions, regardless of LanguageModelProvider being mock or real.
- 409/422 responses roll the UI state back with a toast, never silently swallowed (`STATE_PIPELINE_MOVE` pattern, generalized to all adapters).

## Explicit states required alongside mocks
- `NOT_CONFIGURED` — no vendor selected yet for this category.
- `CONFIGURED_UNVERIFIED` — vendor selected/credentials present but not yet confirmed live.
- Provider failure simulations for each adapter, so UI degraded-states (e.g. M-D18 AI-provider-unavailable) are exercised before any real provider exists.

## Sequencing
Mock-first (msw or equivalent against api-contracts.json shapes) precedes real provider work — PHASE 2 through PHASE 9 of the phased plan build entirely against mocks. Real provider wiring is deliberately deferred to PHASE 15, one provider at a time, each gated on the user confirming that vendor is actually contracted (per DECISION 3: no SDKs installed, no accounts created, no API keys entered, no secrets created, no live calls, no connectivity claims until that gate is passed).
