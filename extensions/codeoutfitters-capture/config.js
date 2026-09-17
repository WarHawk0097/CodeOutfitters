// CodeOutfitters Meeting Capture — API origin configuration.
//
// The capture API is NOT on the Chrome extension's own origin, and the extension is
// loaded unpacked (no build step), so the target origin is a code constant rather than an
// environment variable. This file is the ONLY place an origin is chosen, and it is drawn
// from a fixed allowlist below — an arbitrary user-entered origin is never accepted.
//
// QA workflow:
//   1. Run the local production build (next build && next start --port 3005).
//   2. Set CAPTURE_API_ORIGIN = CAPTURE_API_ORIGINS.local.
//   3. Reload the extension.
//   4. Set it back to CAPTURE_API_ORIGINS.production before any real use.
//
// Do NOT add arbitrary origins here; keep the allowlist as small as the use cases.

const CAPTURE_API_ORIGINS = Object.freeze({
  production: "https://codeoutfitters.vercel.app",
  local: "http://localhost:3005",
});

// These two globals are consumed by background.js via importScripts("config.js"); ESLint
// runs per-file so it cannot see the cross-file use — they are deliberate module-scope
// exports, not dead code.
/* exported CAPTURE_API_ORIGIN, isAllowedCaptureOrigin */
const CAPTURE_API_ORIGIN = CAPTURE_API_ORIGINS.local;

function isAllowedCaptureOrigin(origin) {
  return Object.values(CAPTURE_API_ORIGINS).includes(origin);
}