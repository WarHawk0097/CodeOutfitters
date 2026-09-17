# CodeOutfitters Meeting Copilot P0 Design

## Goal

Deliver a clean-room CodeOutfitters Meeting Copilot P0 for Google Meet: extension-owned authentication, durable local caption retention, restart-safe synchronization, persistent in-meeting controls, and a persisted transcript page.

## Scope

This milestone covers Google Meet only. Teams, Zoom, Webex, generic audio, AI, notes, chat, highlights, library search, workflows, integrations, and MCP remain outside P0 until the Google Meet lifecycle is automated and manually accepted.

## Architecture

The extension will authenticate through a browser authorization page using `chrome.identity.launchWebAuthFlow()` when available, with a controlled tab redirect fallback for local Chromium environments. The server authorization endpoint uses the normal CodeOutfitters browser session only at the authorization boundary, issues a one-time PKCE-bound code, and exchanges it for an opaque, short-lived, revocable extension session. The extension never receives a Supabase token, cookie, or service credential and never injects into the dashboard for authentication.

The background service worker will own a durable capture coordinator. Google Meet content code emits normalized caption events; the coordinator assigns deterministic session and sequence identifiers, writes events to extension-owned IndexedDB before reporting capture success, and synchronizes ordered batches with an idempotent server endpoint. Startup recovery reloads active sessions and unsynced events from IndexedDB. Popup lifecycle is not part of capture state.

The content script owns a persistent, original CodeOutfitters widget. It subscribes to worker state, renders LIVE controls and the live transcript, and can be collapsed and reopened without ending capture. `CAPTURING` is only shown after the first caption event is durably written locally.

## Server contract

- Extension auth: authorize, token exchange, refresh/revoke endpoints with state, PKCE verifier/challenge, one-time code expiry, and redirect allowlisting.
- Capture start: authenticated only by the scoped extension session; workspace and user are server-derived.
- Capture entries: ordered sequence batches keyed by server session plus client event/session identifiers; retries are idempotent.
- Stop: flushes accepted entries and transitions the server session exactly once.
- Transcript retrieval: existing meeting detail route remains the post-meeting source of truth.
- Lead and provider connection remain optional for browser captions.

## Security and privacy

Opaque extension credentials are stored only in extension storage, never page storage or dashboard storage. IndexedDB contains only bounded meeting metadata and caption data needed for recovery. Authorization and ingestion responses use no secrets in diagnostics. Every route validates input and enforces the session’s workspace. Logout revokes the extension session and clears local credential state.

## Acceptance

Automated tests must prove login persistence across popup close, no dashboard injection during capture, normalized Meet events, local-first durability, worker restart recovery, duplicate-start protection, ordered retry, outage retention, stop flush, idempotent server retry, browser-caption/audio separation, revocation, and workspace isolation. Full Vitest, TypeScript, changed-file ESLint, Next build, and secure-check must pass or have pre-existing scoped findings documented before the single human P0 test.
