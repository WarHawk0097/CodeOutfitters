// Runs only in the authenticated CodeOutfitters page origin. The service worker
// asks this isolated content script to make the same-origin request; the token
// response is returned to the worker and is never placed in page JavaScript.
const BRIDGE_ORIGINS = new Set([
  "http://localhost:3005",
  "https://codeoutfitters.vercel.app",
]);
const CAPTURE_TOKEN_PATH = "/api/dashboard/meetings/capture/token";
const BRIDGE_VERSION = "capture-auth-bridge-v3";

const bridgeState = globalThis.__codeoutfittersCaptureBridgeState ?? { listener: null, version: null, installCount: 0 };
globalThis.__codeoutfittersCaptureBridgeState = bridgeState;

if (BRIDGE_ORIGINS.has(location.origin)) {
  try {
    // Extension reloads can leave this isolated-world object behind while the old
    // runtime listener is already invalid. Replace it on every execution; a stale
    // marker must never suppress registration for the current extension context.
    const replacedStaleInstall = Boolean(bridgeState.listener);
    if (replacedStaleInstall) chrome.runtime.onMessage.removeListener(bridgeState.listener);
    bridgeState.listener = (message, _sender, sendResponse) => {
      if (message?.type === "capture-auth:ping") {
        sendResponse({
          ready: true,
          bridgeVersion: BRIDGE_VERSION,
          listenerRegistered: true,
          reinstalled: replacedStaleInstall,
        });
        return false;
      }
      if (message?.type !== "capture-auth:request") return false;
      fetch(new URL(CAPTURE_TOKEN_PATH, `${location.origin}/`).toString(), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "content-type": "application/json", "x-codeoutfitters-capture-bridge": "1" },
        body: "{}",
      })
        .then(async (response) => ({ status: response.status, body: await response.json().catch(() => null) }))
        .then((result) => sendResponse({ ...result, nonce: message.nonce }))
        .catch(() => sendResponse({ status: 0, body: null, nonce: message.nonce }));
      return true;
    };
    chrome.runtime.onMessage.addListener(bridgeState.listener);
    bridgeState.version = BRIDGE_VERSION;
    bridgeState.installCount += 1;
  } catch {
    bridgeState.listener = null;
    bridgeState.version = "BRIDGE_INIT_ERROR";
  }
}
