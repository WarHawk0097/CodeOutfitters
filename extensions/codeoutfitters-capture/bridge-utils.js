const CAPTURE_TOKEN_PATH = "/api/dashboard/meetings/capture/token";

function captureOrigin(apiOrigin) {
  return new URL(apiOrigin).origin;
}

function captureTokenUrl(apiOrigin) {
  return new URL(CAPTURE_TOKEN_PATH, `${captureOrigin(apiOrigin)}/`).toString();
}

function matchingCaptureTabs(tabs, apiOrigin) {
  const expectedOrigin = captureOrigin(apiOrigin);
  return tabs.filter((tab) => {
    if (typeof tab?.url !== "string") return false;
    try {
      return new URL(tab.url).origin === expectedOrigin;
    } catch {
      return false;
    }
  });
}

function bridgeTargetInfo(tab, expectedOrigin, scriptFile = "codeoutfitters-bridge.js") {
  let origin = null;
  try { origin = new URL(tab?.url || "").origin; } catch { /* safe metadata only */ }
  return {
    tabFound: Boolean(tab?.id),
    tabIdValid: Number.isInteger(tab?.id) && tab.id > 0,
    origin,
    expectedOrigin,
    path: origin ? (() => { try { return new URL(tab.url).pathname; } catch { return null; } })() : null,
    status: typeof tab?.status === "string" ? tab.status : "unknown",
    discarded: Boolean(tab?.discarded),
    incognito: Boolean(tab?.incognito),
    originMatches: origin === expectedOrigin,
    scriptFile,
    isEdgeInternal: typeof tab?.url === "string" && /^edge:\/\//i.test(tab.url),
    isMeet: typeof tab?.url === "string" && /^https:\/\/meet\.google\.com\//i.test(tab.url),
  };
}

function runtimeManifestFlags(manifest, expectedOrigin) {
  const hostPattern = `${expectedOrigin}/*`;
  const requiredHosts = Array.isArray(manifest?.host_permissions) ? manifest.host_permissions : [];
  const optionalHosts = Array.isArray(manifest?.optional_host_permissions) ? manifest.optional_host_permissions : [];
  return {
    scripting: Array.isArray(manifest?.permissions) && manifest.permissions.includes("scripting"),
    localhost: requiredHosts.includes(hostPattern) || optionalHosts.includes(hostPattern),
    optionalLocalhost: optionalHosts.includes(hostPattern),
    staticBridge: Array.isArray(manifest?.content_scripts) && manifest.content_scripts.some((entry) =>
      Array.isArray(entry?.matches) && entry.matches.includes(`${expectedOrigin}/*`) &&
      Array.isArray(entry?.js) && entry.js.includes("codeoutfitters-bridge.js"),
    ),
  };
}

function safeBridgeError(error) {
  return String(error?.message ?? error ?? "unknown-error")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
    .replace(/(token|cookie|session)[=:][^\s]+/gi, "$1=[redacted]")
    .slice(0, 240);
}

globalThis.captureBridgeUtils = Object.freeze({ captureOrigin, captureTokenUrl, matchingCaptureTabs, bridgeTargetInfo, runtimeManifestFlags, safeBridgeError });

if (typeof module !== "undefined") module.exports = globalThis.captureBridgeUtils;
