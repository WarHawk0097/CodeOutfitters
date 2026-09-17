# CodeOutfitters Meeting Capture — Chrome extension

Captures Google Meet **live captions** and sends them to CodeOutfitters as a transcript.
Does NOT use Google's premium transcription, does NOT record audio, does NOT read chat or
other tabs, and never starts without an explicit user action.

## Why this exists

Google Workspace's native "Transcribe" feature is unavailable on some plans. CodeOutfitters
does not depend on it: this extension captures the same **live captions** the user already
sees on screen and turns them into normalized transcript entries that feed the existing
Meeting Intelligence pipeline.

## Two transcript strategies, one pipeline

| Strategy | Source | When |
|---|---|---|
| Provider transcript | Google Meet API transcript artifact | Workspace plan provides it |
| **CodeOutfitters capture** | This extension (live captions) | Provider transcript unavailable |

Both normalize into the same `meeting → meeting_artifacts → transcripts →
transcript_entries → AI` model. This extension implements the second.

## Architecture

```
meet.google.com tab
   │  content.js (caption DOM observer + caption assembler)
   │  chrome.runtime messages
   ▼
background.js (service worker)
   │  localhost: opens /extension-auth in a normal browser tab, polls a one-time transaction
   │  HTTPS production: uses chrome.identity.launchWebAuthFlow()
   │  Authorization: Bearer <extension_session>
   ▼
POST /api/dashboard/meetings/capture          (start)
POST /api/dashboard/meetings/capture/entries  (batched, idempotent)
POST /api/dashboard/meetings/capture/stop     (finalize)
```

- **Captions are deduplicated.** Meet re-renders the same sentence many times
  ("we need" → "we need an offline" → "we need an offline application"). The assembler
  collapses those into one statement per utterance, honoring corrections and pauses.
- **Idempotent by construction.** Each entry carries a deterministic id
  (`codeoutfitters-capture:<sessionId>:<sequence>`), so retried batches never duplicate.
- **Consent is mandatory.** Capture starts only when you click **Start capture** in the
  popup. A notice reminds you to inform participants where required. Nothing is captured
  automatically.
- **Nothing service-level is stored.** The extension stores only an opaque, revocable,
  expiring meeting-capture session and local caption recovery data. It never receives
  Supabase refresh tokens, service credentials, or Google credentials.

## Permissions (and why)

- Identity, tabs, and storage permissions support the dedicated browser authorization flow and
  restart-safe local caption queue. The normal Supabase session remains inside the web
  authorization page and is never sent to the extension.
- Required host permissions are limited to meeting-provider content-script hosts. The
  CodeOutfitters API origins remain explicit and narrow for API transport only; no
  dashboard content script is installed and no `*.supabase.co` permission exists.

## Install locally (Load unpacked)

1. `git clone` / open this repository.
2. Open Chrome → `chrome://extensions`.
3. Toggle **Developer mode** (top-right).
4. Click **Load unpacked**.
5. Select the folder `extensions/codeoutfitters-capture/`.
6. The extension appears as **CodeOutfitters Meeting Capture**.

When `manifest.json` changes, reload the unpacked extension before testing. If Edge
retains stale site-access state after a permission-model change, remove the unpacked
extension once and load it again from the canonical Windows path
`L:\CodeOutfitters-worktrees\leads-foundation\extensions\codeoutfitters-capture`.
Do not use a Downloads copy.

## Use

1. Click **Sign in to CodeOutfitters** in the extension. Local QA opens a normal `http://localhost:3005/extension-auth` tab; HTTPS production uses the browser identity flow.
2. Approve the extension connection in the CodeOutfitters page, then close the page if it remains open.
3. Open (or join) a Google Meet call.
4. Turn **on** Meet's live captions (Meet → Activities/… → Captions, or the CC button).
5. Click the extension icon → **Start capture**.
6. Speak normally. The popup shows the live entry count.
7. When the meeting ends, click **Stop**. The transcript is saved to the meeting.

## Security notes

- The extension reads ONLY the caption panel of the active Meet tab. It never reads chat,
  reactions, sidebars, other tabs, or system audio.
- All server-side writes are workspace-scoped and authenticated; a browser-supplied
  workspace/user id is never trusted.
- Do not publish this to the Chrome Web Store yet — local unpacked → controlled QA →
  Preview → security review first.

## Files

- `manifest.json` — Manifest V3.
- `content.js` — caption DOM observer + incremental caption assembler (see
  `lib/meetings/capture/assembler.ts` for the tested reference implementation).
- `background.js` — service worker: extension auth, durable queue, ordered sync, and capture lifecycle.
- `auth.js` — localhost normal-tab transaction auth, HTTPS browser authorization-code exchange, and revocable scoped session storage.
- `local-store.js` — bounded IndexedDB recovery queue for local caption data.
- `popup.html` / `popup.js` — UI: states, controls, consent notice.
- `icons/` — extension icons.
