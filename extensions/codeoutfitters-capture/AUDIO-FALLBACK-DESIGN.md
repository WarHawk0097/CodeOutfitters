# browser_audio fallback — design (NOT built yet)

This is the Phase 11/12 design for the SECOND capture strategy: `browser_audio`.
It is deliberately **not implemented** — the caption MVP must be stable first, and
nothing here is production code. It exists so the decision is written down and the
`capture_source = 'browser_audio'` enum value has a home.

## Why it exists

Captions are unavailable in some meetings (captions not enabled, language not
supported, host disabled them). Audio capture + local transcription covers those, and it
is the path that later generalizes to Zoom / Teams (same extension, different host page,
same `meeting → transcript_entries → AI` pipeline).

## Recommended transcription engine

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **faster-whisper** (CTranslate2) | Good accuracy, realtime-factor far below 1 on CPU, pip-installable, active, no GPU required | Python runtime on the worker | **Recommended for the home server** |
| whisper.cpp | Tiny memory, great CPU speed, no Python | Slightly lower quality than faster-whisper at same size; separate build | Fine alternative; keep as fallback if a Python service is undesirable |

Decision: **faster-whisper** as primary, **whisper.cpp** as the open fallback. Neither is
a paid SaaS; no paid transcription service is added without explicit approval.

## Hardware expectations (home server)

- faster-whisper `small` or `base` model on CPU: realtime-factor ~0.1–0.3, so a
  30-minute meeting transcribes in ~3–9 minutes. Fine for post-meeting processing.
- If live/low-latency transcription is ever wanted, a modest GPU (or larger RAM for a
  bigger model) is the upgrade path; not required for the initial chunk-then-transcribe
  flow.

## Architecture

```
meet.google.com tab
   │  tabCapture / getDisplayMedia (system audio of THIS tab only)
   │  or getUserMedia (microphone) — only after explicit user action
   ▼
extension worker
   │  audio chunks → POST /api/dashboard/meetings/capture/audio  (signed, scoped)
   ▼
CodeOutfitters server → local transcription worker (faster-whisper)
   │  audio chunk → transcript chunk → normalized
   ▼
existing transcript_entries + AI pipeline (capture_source = 'browser_audio')
```

## Privacy / retention (Phase 12)

- Capture NEVER starts without an explicit user action; the UI shows **"Audio capture
  active"** while running.
- Only the active Meet tab's audio is captured (`tabCapture` on the current tabId), or
  the microphone when the user explicitly selects it. No other tabs, no system-wide audio.
- Chunks stream to the transcription worker and are **deleted after successful
  transcription** — raw audio is not stored permanently by default.
- Retention documented here: default = delete-on-transcribe; a deliberate "keep for QA"
  flag exists only in test environments, never in production.

## Speaker handling (Phase 13)

- Caption mode uses Meet's own speaker labels.
- Audio mode does NOT pretend Whisper knows identities. Whisper produces speaker
  segments but not names; default labels are **Speaker 1 / Speaker 2** until a reliable
  mapping exists (e.g. future voice-profile matching — deliberately out of scope now).

## When to build it

1. Caption MVP passes controlled QA (this milestone).
2. Preview deployment verifies the caption ingestion path end to end.
3. Security review passes.
Then `browser_audio` becomes its own milestone reusing the exact same
`meeting_artifacts → transcripts → transcript_entries` model.