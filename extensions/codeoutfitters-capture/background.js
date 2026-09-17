// CodeOutfitters Meeting Capture — background service worker.
//
// Owns the authenticated, cross-origin API calls. The worker:
//   1. obtains a scoped extension session through browser authorization,
//   2. sends that opaque session as Authorization: Bearer to the capture API,
//   3. batches finalized caption entries and retries transient failures.
//
// The capture credential is NEVER persisted, logged, printed, or sent to a content script.

importScripts("config.js");
importScripts("bridge-utils.js", "contracts.js", "local-store.js", "auth.js");

// API_BASE is built from the allowlisted origin in config.js. The worker refuses to
// fetch anything outside that allowlist, so a compromised or misconfigured extension
// cannot exfiltrate to an arbitrary host.
const API_BASE = `${CAPTURE_API_ORIGIN}/api/dashboard/meetings`;
const BACKGROUND_INIT_DIAGNOSTIC = "BACKGROUND_INIT_OK";

let activeSession = null; // { sessionId, meetingId, artifactId }
let localCapture = null; // { tabId, entries, entrySequences, audioQueue, syncError }
let durableStore = null;
let captureDiagnostics = null;
let captureToken = null;
let captureTokenExpiresAt = 0;
let syncRetryTimer = null;
let extensionAuthPromise = null;
let extensionAuthDiagnostic = null;
let extensionAuthError = null;
let extensionAuthFailure = { httpStatus: null, serverCode: null };
const AUTH_RESUME_ALARM = "codeoutfitters-auth-resume";
function isBrowserAudioCapture() { return localCapture?.acquisitionStrategy === "browser_audio"; }

function safeAuthSummary(session) {
  if (!session) return null;
  return {
    expiresAt: session.expiresAt,
    scope: session.scope,
    ...(session.accountName ? { accountName: session.accountName } : {}),
    ...(session.workspaceName ? { workspaceName: session.workspaceName } : {}),
  };
}

async function runExtensionAuth() {
  if (!extensionAuthPromise) extensionAuthPromise = CodeOutfittersAuth.signIn().finally(() => { extensionAuthPromise = null; });
  return extensionAuthPromise;
}

async function scheduleAuthResume() {
  if (chrome.alarms?.create) await chrome.alarms.create(AUTH_RESUME_ALARM, { delayInMinutes: 1, periodInMinutes: 1 });
}

async function clearAuthResumeAlarm() {
  if (chrome.alarms?.clear) await chrome.alarms.clear(AUTH_RESUME_ALARM);
}

void CodeOutfittersAuth.resumePendingAuth().then((session) => session ? clearAuthResumeAlarm() : undefined).catch(() => {});

if (chrome.alarms?.onAlarm?.addListener) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== AUTH_RESUME_ALARM) return;
    void CodeOutfittersAuth.resumePendingAuth().then((session) => session ? clearAuthResumeAlarm() : undefined).catch(() => {});
  });
}

function getDurableStore() {
  if (!durableStore) durableStore = CodeOutfittersLocalStore.createIndexedDbCaptureStore();
  return durableStore;
}

async function flushDurablePending() {
  if (!activeSession || !localCapture) return;
  const pending = await getDurableStore().listPendingEvents(activeSession.sessionId);
  if (!pending.length) return;
  await api("/capture/entries", { sessionId: activeSession.sessionId, meetingId: activeSession.meetingId, entries: pending });
  await getDurableStore().markSynced(activeSession.sessionId, pending.map((entry) => entry.sequence));
  localCapture.state = "capture_active";
}

function scheduleSyncRetry(delayMs = 5000) {
  if (syncRetryTimer || !activeSession) return;
  syncRetryTimer = setTimeout(async () => {
    syncRetryTimer = null;
    try { await flushDurablePending(); }
    catch (error) { if (localCapture) localCapture.syncError = error.message ?? "sync-unavailable"; scheduleSyncRetry(Math.min(delayMs * 2, 60_000)); }
  }, delayMs);
}

async function restoreDurableSession() {
  if (localCapture || activeSession) return;
  const sessions = await getDurableStore().listRecoverableSessions();
  const session = sessions.sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt))[0];
  if (!session) return;
  const tabs = await chrome.tabs.query({ url: ["https://meet.google.com/*"] }).catch(() => []);
  const tab = tabs.find((candidate) => candidate.url?.includes(session.providerMeetingId));
  if (!tab?.id) return;
  activeSession = { sessionId: session.serverSessionId, meetingId: session.meetingId, artifactId: session.artifactId };
  const entries = await getDurableStore().listEvents(session.id);
  localCapture = { tabId: tab.id, acquisitionStrategy: session.acquisitionStrategy, state: session.status, entries, entrySequences: new Set(entries.map((entry) => String(entry.sequence))), audioQueue: [], syncError: null, providerSpaceId: session.providerMeetingId };
  try {
    const pending = await getDurableStore().listPendingEvents(session.id);
    if (pending.length) {
      await api("/capture/entries", { sessionId: activeSession.sessionId, meetingId: activeSession.meetingId, entries: pending });
      await getDurableStore().markSynced(session.id, pending.map((entry) => entry.sequence));
    }
  } catch (error) {
    localCapture.syncError = error.message ?? "sync-unavailable";
  }
}

function safeBridgeDetail(error) {
  const message = String(error?.message ?? error ?? "unknown-error")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
    .replace(/(token|cookie|session)[=:][^\s]+/gi, "$1=[redacted]")
    .slice(0, 240);
  return message || "unknown-error";
}

function bridgeFailure(message, bridgeDiag, bridgeDetail, bridgeTrace = []) {
  return Object.assign(new Error(message), { bridgeDiag, bridgeDetail: safeBridgeDetail({ message: bridgeDetail }), bridgeTrace });
}

function bridgeTracePush(trace, stage, detail = null) {
  trace.push({ stage, ...(detail ? { detail: safeBridgeDetail({ message: detail }) } : {}) });
}

function pingFailure(error) {
  const detail = safeBridgeDetail(error);
  if (/context invalidated/i.test(detail)) return ["BRIDGE_PING_CONTEXT_INVALIDATED", detail];
  if (/receiving end does not exist|could not establish connection/i.test(detail)) return ["BRIDGE_PING_NO_RECEIVER", detail];
  if (/bridge-timeout/i.test(detail)) return ["BRIDGE_PING_TIMEOUT", detail];
  return ["BRIDGE_PING_OTHER_ERROR", detail];
}

function sendBridgeRequest(tabId, message, timeoutMs = 5000) {
  return Promise.race([
    chrome.tabs.sendMessage(tabId, message),
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("bridge-timeout"), { bridgeDiag: "BRIDGE_PING_TIMEOUT" })), timeoutMs)),
  ]);
}

async function runtimeBridgeProbe(expectedOrigin) {
  const manifest = typeof chrome.runtime?.getManifest === "function" ? chrome.runtime.getManifest() : {};
  const manifestFlags = captureBridgeUtils.runtimeManifestFlags(manifest, expectedOrigin);
  const permissions = chrome.permissions;
  const all = permissions?.getAll ? await permissions.getAll().catch(() => null) : null;
  const hostPermission = permissions?.contains
    ? await permissions.contains({ origins: [`${expectedOrigin}/*`] }).catch(() => false)
    : false;
  const scriptingPermission = permissions?.contains
    ? await permissions.contains({ permissions: ["scripting"] }).catch(() => false)
    : false;
  return {
    runtimeManifestScripting: manifestFlags.scripting,
    runtimeManifestLocalhost: manifestFlags.localhost,
    runtimeStaticBridge: manifestFlags.staticBridge,
    runtimeLocalhostHostPermission: hostPermission,
    runtimeScriptingPermission: scriptingPermission,
    runtimePermissionsApi: Boolean(permissions),
    runtimePermissionsRead: Boolean(all),
  };
}

async function ensureBridgeReady(tab) {
  const trace = ["BRIDGE_TAB_FOUND"];
  const expectedOrigin = captureBridgeUtils.captureOrigin(CAPTURE_API_ORIGIN);
  const target = captureBridgeUtils.bridgeTargetInfo(tab, expectedOrigin);
  const tabState = `BRIDGE_TARGET_TAB_ID=${tab.id ?? "unknown"},BRIDGE_TARGET_URL=${target.origin ?? "unknown"}${target.path ?? ""},BRIDGE_TARGET_STATUS=${target.status},BRIDGE_TARGET_DISCARDED=${target.discarded},BRIDGE_TARGET_INCOGNITO=${target.incognito},BRIDGE_TARGET_ORIGIN=${target.origin ?? "unknown"},BRIDGE_TARGET_TAB_FOUND=${target.tabFound},BRIDGE_TAB_ID_VALID=${target.tabIdValid},BRIDGE_SCRIPT_FILE=${target.scriptFile}`;
  bridgeTracePush(trace, "BRIDGE_TAB_STATE", tabState);
  if (!target.tabIdValid || !target.originMatches || target.isEdgeInternal || target.isMeet || target.discarded) {
    throw bridgeFailure("bridge-target-invalid", "BRIDGE_TARGET_INVALID", tabState, trace);
  }
  const runtime = await runtimeBridgeProbe(expectedOrigin);
  bridgeTracePush(trace, "RUNTIME_MANIFEST_SCRIPTING", String(runtime.runtimeManifestScripting));
  bridgeTracePush(trace, "RUNTIME_MANIFEST_LOCALHOST", String(runtime.runtimeManifestLocalhost));
  bridgeTracePush(trace, "RUNTIME_MANIFEST_STATIC_BRIDGE", String(runtime.runtimeStaticBridge));
  bridgeTracePush(trace, "RUNTIME_LOCALHOST_HOST_PERMISSION", String(runtime.runtimeLocalhostHostPermission));
  bridgeTracePush(trace, "RUNTIME_SCRIPTING_PERMISSION", String(runtime.runtimeScriptingPermission));
  const runtimeSummary = `RUNTIME_MANIFEST_SCRIPTING=${runtime.runtimeManifestScripting},RUNTIME_MANIFEST_LOCALHOST=${runtime.runtimeManifestLocalhost},RUNTIME_LOCALHOST_HOST_PERMISSION=${runtime.runtimeLocalhostHostPermission},RUNTIME_SCRIPTING_PERMISSION=${runtime.runtimeScriptingPermission}`;
  if (!runtime.runtimeManifestScripting || !runtime.runtimeManifestLocalhost) throw bridgeFailure("runtime-manifest-mismatch", "RUNTIME_MANIFEST_MISMATCH", `${runtimeSummary} | ${tabState}`, trace);
  if (!runtime.runtimeLocalhostHostPermission) throw bridgeFailure("host-permission-missing", "HOST_PERMISSION_MISSING", `${runtimeSummary} | ${tabState}`, trace);
  if (!runtime.runtimeScriptingPermission) throw bridgeFailure("scripting-permission-missing", "SCRIPTING_PERMISSION_MISSING", `${runtimeSummary} | ${tabState}`, trace);
  let needsInjection = false;
  try {
    const response = await sendBridgeRequest(tab.id, { type: "capture-auth:ping" }, 750);
    if (response?.ready === true && response.bridgeVersion === "capture-auth-bridge-v3") {
      trace.push("STATIC_BRIDGE_PING=success", "STATIC_BRIDGE_RESPONSE=ready");
      if (response.listenerRegistered === true) trace.push("BRIDGE_LISTENER_REGISTERED");
      if (response.reinstalled === true) trace.push("BRIDGE_REINSTALL_FORCED");
      bridgeTracePush(trace, "BRIDGE_PING_OK");
      return { ready: true, bridgeDiag: "BRIDGE_PING_OK", bridgeTrace: trace };
    }
    trace.push("STATIC_BRIDGE_PING=failure", "STATIC_BRIDGE_RESPONSE=missing");
    bridgeTracePush(trace, "BRIDGE_PING_OTHER_ERROR", "invalid bridge readiness response");
    needsInjection = true;
  } catch (error) {
    const [stage, detail] = pingFailure(error);
    bridgeTracePush(trace, stage, detail);
    trace.push("STATIC_BRIDGE_PING=failure", "STATIC_BRIDGE_RESPONSE=missing");
    needsInjection = stage === "BRIDGE_PING_NO_RECEIVER" || stage === "BRIDGE_PING_CONTEXT_INVALIDATED" || stage === "BRIDGE_PING_TIMEOUT";
  }

  if (!needsInjection) throw bridgeFailure("bridge-not-ready", "BRIDGE_PING_OTHER_ERROR", tabState, trace);

  if (!chrome.scripting?.executeScript) {
    bridgeTracePush(trace, "BRIDGE_SCRIPTING_API_MISSING");
    throw bridgeFailure("bridge-scripting-api-missing", "BRIDGE_SCRIPTING_API_MISSING", "chrome.scripting.executeScript is unavailable", trace);
  }
  bridgeTracePush(trace, "BRIDGE_SCRIPTING_API_AVAILABLE");
  bridgeTracePush(trace, "MINIMAL_EXECUTE_SCRIPT=begin");
  try {
    const minimal = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => true });
    if (!Array.isArray(minimal) || minimal[0]?.result !== true) throw new Error("minimal executeScript returned no true result");
    trace.push("MINIMAL_EXECUTE_SCRIPT=success");
  } catch (error) {
    const detail = `MINIMAL_EXECUTE_SCRIPT=failure: ${captureBridgeUtils.safeBridgeError(error)} | ${tabState}`;
    bridgeTracePush(trace, "MINIMAL_SCRIPT_INJECTION_DENIED", detail);
    throw bridgeFailure("minimal-script-injection-denied", "MINIMAL_SCRIPT_INJECTION_DENIED", detail, trace);
  }
  bridgeTracePush(trace, "BRIDGE_INJECT_BEGIN");
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [target.scriptFile],
      world: "ISOLATED",
    });
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("executeScript returned no frame result");
    }
    bridgeTracePush(trace, "BRIDGE_INJECT_OK");
    bridgeTracePush(trace, "BRIDGE_SCRIPT_EXECUTED");
  } catch (error) {
    const detail = `BRIDGE_INJECT_ERROR: ${captureBridgeUtils.safeBridgeError(error)} | BRIDGE_EXECUTE_SCRIPT=failure | ${tabState}`;
    bridgeTracePush(trace, "BRIDGE_INJECT_ERROR", detail);
    throw bridgeFailure("bridge-injection-failed", "BRIDGE_INJECT_ERROR", detail, trace);
  }

  for (const delayMs of [50, 100, 200, 400, 800]) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      const response = await sendBridgeRequest(tab.id, { type: "capture-auth:ping" }, 750);
      if (response?.ready === true && response.bridgeVersion === "capture-auth-bridge-v3") {
        if (response.listenerRegistered === true) bridgeTracePush(trace, "BRIDGE_LISTENER_REGISTERED");
        if (response.reinstalled === true) bridgeTracePush(trace, "BRIDGE_REINSTALL_FORCED");
        bridgeTracePush(trace, "BRIDGE_PING_OK");
        return { ready: true, bridgeDiag: "BRIDGE_PING_OK", bridgeTrace: trace };
      }
      bridgeTracePush(trace, "BRIDGE_PING_OTHER_ERROR", "invalid bridge readiness response");
    } catch (error) {
      const [stage, detail] = pingFailure(error);
      bridgeTracePush(trace, stage, detail);
    }
  }
  const last = trace[trace.length - 1];
  throw bridgeFailure("bridge-readiness-timeout", last?.stage ?? "BRIDGE_PING_TIMEOUT", last?.detail ?? "bridge readiness failed", trace);
}

function captureStartDiag(status, serverCode = null) {
  if (status === 400) return "CAPTURE_START_400";
  if (status === 401) return "CAPTURE_START_401";
  if (status === 403) return "CAPTURE_START_403";
  if (status === 404) return "CAPTURE_START_404";
  if (status === 409) return "CAPTURE_START_409";
  if (status === 422) return /^CAPTURE_START_[A-Z0-9_]{1,80}$/.test(serverCode || "")
    ? "CAPTURE_START_VALIDATION_FAILED"
    : "CAPTURE_START_422";
  if (status === 429) return "CAPTURE_START_429";
  if (status >= 500) return "CAPTURE_START_5XX";
  return "CAPTURE_START_OTHER_4XX";
}

async function requestCaptureToken() {
  const session = await CodeOutfittersAuth.getSession();
  captureToken = session.accessToken;
  captureTokenExpiresAt = Date.parse(session.expiresAt);
  return captureToken;
  /* Legacy dashboard bridge code retained below only while old migration tests run. */
  /*
  const expectedOrigin = captureBridgeUtils.captureOrigin(CAPTURE_API_ORIGIN);
  const tabs = captureBridgeUtils.matchingCaptureTabs(
    await chrome.tabs.query({ url: [`${expectedOrigin}/*`] }),
    CAPTURE_API_ORIGIN,
  );
  if (tabs.length === 0) {
    throw Object.assign(new Error("no-codeoutfitters-tab"), {
      authDiag: "BRIDGE_TAB_NOT_FOUND",
    });
  }
  const nonce = crypto.randomUUID();
  let sawBridgeResponse = false;
  let sawBridgeFailure = false;
  let lastBridgeDiag = "BRIDGE_PING_OTHER_ERROR";
  let lastBridgeDetail = "bridge handoff failed";
  let lastBridgeTrace = [];
  for (const tab of tabs) {
    if (!tab.id || !tab.url || new URL(tab.url).origin !== expectedOrigin) continue;
    try {
      const ready = await ensureBridgeReady(tab);
      lastBridgeTrace = ready.bridgeTrace ?? [];
    } catch (error) {
      sawBridgeFailure = true;
      lastBridgeDiag = error.bridgeDiag ?? lastBridgeDiag;
      lastBridgeDetail = error.bridgeDetail ?? lastBridgeDetail;
      lastBridgeTrace = error.bridgeTrace ?? lastBridgeTrace;
      continue;
    }
    let response = null;
    try {
      response = await sendBridgeRequest(tab.id, { type: "capture-auth:request", nonce });
    } catch (error) {
      sawBridgeFailure = true;
      const [stage, detail] = pingFailure(error);
      lastBridgeDiag = stage;
      lastBridgeDetail = detail;
      continue;
    }
    if (response?.nonce !== nonce) continue;
    sawBridgeResponse = true;
    if (response.status >= 200 && response.status < 300 && typeof response.body?.token === "string") {
      const expiresAt = Date.parse(response.body.expiresAt);
      if (!Number.isFinite(expiresAt)) {
        throw Object.assign(new Error("capture-auth-bad-response"), { authDiag: "CAPTURE_AUTH_TOKEN_BAD_RESPONSE" });
      }
      captureToken = response.body.token;
      captureTokenExpiresAt = expiresAt;
      return captureToken;
    }
    if (response.status === 401) {
      throw Object.assign(new Error("capture-auth-token-401"), { authDiag: "CAPTURE_AUTH_TOKEN_FETCH_401" });
    }
    if (response.status === 403) {
      throw Object.assign(new Error("capture-auth-token-403"), { authDiag: "CAPTURE_AUTH_TOKEN_FETCH_403" });
    }
    if (response.status === 404) {
      throw Object.assign(new Error("capture-auth-token-404"), { authDiag: "CAPTURE_AUTH_TOKEN_FETCH_404" });
    }
    if (response.status >= 500) {
      throw Object.assign(new Error("capture-auth-token-5xx"), { authDiag: "CAPTURE_AUTH_TOKEN_FETCH_5XX" });
    }
    if (response.status >= 200 && response.status < 300) {
      throw Object.assign(new Error("capture-auth-token-missing"), { authDiag: "CAPTURE_AUTH_TOKEN_MISSING" });
    }
  }
  captureToken = null;
  captureTokenExpiresAt = 0;
  const authDiag = sawBridgeResponse
    ? "CAPTURE_AUTH_TOKEN_BAD_RESPONSE"
    : sawBridgeFailure
      ? lastBridgeDiag
      : "BRIDGE_TAB_NOT_FOUND";
  throw Object.assign(new Error("capture-auth-handoff-failed"), {
    authDiag,
    bridgeDiag: authDiag,
    bridgeDetail: lastBridgeDetail,
    bridgeTrace: lastBridgeTrace,
  });
  */
}

async function api(path, body, retried = false) {
  const token = captureToken && captureTokenExpiresAt > Date.now() + 5000 ? captureToken : await requestCaptureToken();
  const url = `${API_BASE}${path}`;
  if (!isAllowedCaptureOrigin(new URL(url).origin)) {
    throw new Error("origin-not-allowed");
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (res.status === 401 && !retried) {
    captureToken = null;
    return api(path, body, true);
  }
  if (path !== "/capture" && res.status === 409) {
    return { ok: true, status: 409, body: await res.json().catch(() => null) };
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const serverCode = typeof err?.error?.code === "string" ? err.error.code : null;
    throw Object.assign(new Error(serverCode ?? `http-${res.status}`), {
      authDiag: path === "/capture" ? captureStartDiag(res.status, serverCode) : null,
      serverCode,
    });
  }
  return { ok: true, status: res.status, body: await res.json() };
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen?.createDocument) throw new Error("offscreen-api-unavailable");
  if (chrome.offscreen.hasDocument && await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record short in-memory audio chunks from the explicitly selected Google Meet tab for local transcription.",
  });
}

async function sendAudioControl(message) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || "audio-control-failed");
  return response;
}

async function audioApi(path, formData, retried = false) {
  const token = captureToken && captureTokenExpiresAt > Date.now() + 5000 ? captureToken : await requestCaptureToken();
  const url = `${API_BASE}${path}`;
  if (!isAllowedCaptureOrigin(new URL(url).origin)) throw new Error("origin-not-allowed");
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: formData,
  });
  if (res.status === 401 && !retried) {
    captureToken = null;
    return audioApi(path, formData, true);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw Object.assign(new Error(err?.error?.message || `http-${res.status}`), {
      authDiag: res.status === 401 ? "CAPTURE_AUDIO_401" : res.status >= 500 ? "CAPTURE_AUDIO_5XX" : "CAPTURE_AUDIO_FAILED",
    });
  }
  return { ok: true, status: res.status, body: await res.json() };
}

async function transcribeChunk(sequence, buffer, mimeType) {
  if (!activeSession || !localCapture) {
    if (localCapture && localCapture.audioQueue.length < 8) localCapture.audioQueue.push({ sequence, buffer, mimeType });
    return { ok: true, localOnly: true };
  }
  const form = new FormData();
  form.append("sessionId", activeSession.sessionId);
  form.append("meetingId", activeSession.meetingId);
  form.append("sequence", String(sequence));
  form.append("mimeType", mimeType || "audio/webm");
  form.append("audio", new Blob([buffer], { type: mimeType || "audio/webm" }), `chunk-${sequence}.webm`);
  const response = await audioApi("/capture/audio", form);
  const entry = response.body?.entry;
  if (entry && !localCapture.entrySequences.has(String(entry.sequence))) {
    localCapture.entrySequences.add(String(entry.sequence));
    localCapture.entries.push(entry);
  }
  return response;
}

async function flushAudioQueue() {
  if (!localCapture?.audioQueue?.length || !activeSession) return;
  const queued = localCapture.audioQueue.splice(0);
  for (const item of queued) {
    try {
      await transcribeChunk(item.sequence, item.buffer, item.mimeType);
    } catch (error) {
      localCapture.syncError = error.message ?? "transcription-unavailable";
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "auth:sign-in": {
        try {
          const session = await runExtensionAuth();
          const diagnostic = await CodeOutfittersAuth.readAuthDiagnostic();
          const authError = await CodeOutfittersAuth.readAuthError();
          const authFailure = await CodeOutfittersAuth.readAuthFailure();
          sendResponse({ ok: true, session: safeAuthSummary(session), diagnostic, authError, authFailure });
        } catch (error) {
          const diagnostic = await CodeOutfittersAuth.readAuthDiagnostic();
          const authError = await CodeOutfittersAuth.readAuthError();
          const authFailure = await CodeOutfittersAuth.readAuthFailure();
          sendResponse({ ok: false, diagnostic, authError, authFailure, error: error?.message?.startsWith("EXT_AUTH_") ? error.message : "EXTENSION_AUTH_FAILED" });
        }
        break;
      }
case "auth:resume": {
        try {
          const resumed = await CodeOutfittersAuth.resumePendingAuth();
          const session = resumed || await CodeOutfittersAuth.readSession();
          const diagnostic = await CodeOutfittersAuth.readAuthDiagnostic();
          const authError = await CodeOutfittersAuth.readAuthError();
          const authFailure = await CodeOutfittersAuth.readAuthFailure();
          sendResponse({ ok: true, session: safeAuthSummary(session), diagnostic, authError, authFailure });
        } catch (error) {
          const diagnostic = await CodeOutfittersAuth.readAuthDiagnostic();
          const authError = await CodeOutfittersAuth.readAuthError();
          const authFailure = await CodeOutfittersAuth.readAuthFailure();
          sendResponse({ ok: false, session: null, diagnostic, authError, authFailure, error: error?.message?.startsWith("EXT_AUTH_") ? error.message : "EXTENSION_AUTH_FAILED" });
        }
        break;
      }
      case "auth:status": {
        const session = await CodeOutfittersAuth.readSession();
        const diagnostic = await CodeOutfittersAuth.readAuthDiagnostic();
        const authError = await CodeOutfittersAuth.readAuthError();
        const authFailure = await CodeOutfittersAuth.readAuthFailure();
        sendResponse({ ok: true, session: safeAuthSummary(session), pending: Boolean(await chrome.storage.local.get(CodeOutfittersAuth.EXTENSION_PENDING_AUTH_KEY).then((value) => value?.[CodeOutfittersAuth.EXTENSION_PENDING_AUTH_KEY])), diagnostic, authError, authFailure });
        break;
      }
      case "auth:error": {
        if (typeof message.error === "string" && /^[A-Z][A-Z0-9_]{1,80}$/.test(message.error)) extensionAuthError = message.error;
        sendResponse({ ok: true });
        break;
      }
      case "auth:failure": {
        extensionAuthFailure = {
          httpStatus: Number.isInteger(message.httpStatus) ? message.httpStatus : null,
          serverCode: typeof message.serverCode === "string" && /^EXCHANGE_[A-Z0-9_]{1,80}$/.test(message.serverCode) ? message.serverCode : null,
        };
        sendResponse({ ok: true });
        break;
      }
      case "auth:sign-out": {
        try {
          await CodeOutfittersAuth.signOut();
          sendResponse({ ok: true });
        } catch {
          sendResponse({ ok: false, error: "EXTENSION_SIGN_OUT_FAILED" });
        }
        break;
      }
      case "auth:diagnostic": {
        if (typeof message.stage === "string" && /^AUTH_[A-Z0-9_]{1,80}$/.test(message.stage)) {
          extensionAuthDiagnostic = message.stage;
          if (message.stage === "AUTH_PENDING_CLEARED") void clearAuthResumeAlarm();
          if (message.stage === "AUTH_PENDING_FOUND") void scheduleAuthResume();
        }
        sendResponse({ ok: true });
        break;
      }
      case "capture:start": {
        const startMessageDiagnostic = "BACKGROUND_START_MESSAGE_RECEIVED";
        const acquisitionStrategy = message.acquisitionStrategy === "browser_audio" ? "browser_audio" : "browser_captions";
        if (localCapture || activeSession) {
          sendResponse({ ok: false, error: "CAPTURE_ALREADY_ACTIVE", state: "capture_active", entryCount: localCapture?.entries.length ?? 0, session: activeSession });
          break;
        }
        if (acquisitionStrategy === "browser_audio" && !message.streamId) {
          sendResponse({ ok: false, error: "tab-audio-stream-id-missing", diagnostic: startMessageDiagnostic });
          break;
        }
        const tabId = message.tabId ?? sender.tab?.id;
        if (!tabId) {
          sendResponse({ ok: false, error: "CAPTURE_TAB_NOT_FOUND", diagnostic: startMessageDiagnostic });
          break;
        }
        localCapture = { tabId, acquisitionStrategy, state: "starting", entries: [], entrySequences: new Set(), audioQueue: [], syncError: null, providerSpaceId: message.providerSpaceId };
        if (acquisitionStrategy === "browser_audio") {
          try {
            await sendAudioControl({ type: "audio:start", streamId: message.streamId });
          } catch {
            localCapture = null;
            sendResponse({ ok: false, error: "meet-capture-unavailable", diagnostic: startMessageDiagnostic });
            break;
          }
        }
        try {
           const res = await api("/capture", {
             provider: "google_meet",
             providerSpaceId: message.providerSpaceId,
            ...(message.title ? { title: message.title } : {}),
            ...(message.leadId ? { leadId: message.leadId } : {}),
           acquisitionStrategy,
            ...(activeSession?.sessionId ? { resumeSessionId: activeSession.sessionId } : {}),
          });
        activeSession = {
          sessionId: res.body.sessionId,
          meetingId: res.body.meetingId,
          artifactId: res.body.artifactId,
        };
        await getDurableStore().saveSession({
          id: activeSession.sessionId,
          serverSessionId: activeSession.sessionId,
          meetingId: activeSession.meetingId,
          artifactId: activeSession.artifactId,
          providerMeetingId: message.providerSpaceId,
          acquisitionStrategy,
          status: "active",
          createdAt: new Date().toISOString(),
        });
        localCapture.state = "starting";
          await chrome.tabs.sendMessage(tabId, { type: "capture:set-state", capturing: true, status: "starting", session: activeSession, syncState: "SYNCING" }).catch(() => {});
          if (localCapture.entries.length > 0) {
            try {
              await api("/capture/entries", {
                sessionId: activeSession.sessionId,
                meetingId: activeSession.meetingId,
                entries: localCapture.entries,
              });
            } catch (syncError) {
              localCapture.syncError = syncError.message ?? "sync-unavailable";
            }
          }
          await flushAudioQueue();
          sendResponse({
            ok: true,
          status: "starting",
          state: "starting",
          acquisitionStrategy,
          entryCount: localCapture.entries.length,
            session: activeSession,
            diagnostic: startMessageDiagnostic,
            backgroundDiagnostic: BACKGROUND_INIT_DIAGNOSTIC,
          });
        } catch (error) {
          localCapture.syncError = error.authDiag ?? error.message ?? "capture-start-failed";
          await chrome.tabs.sendMessage(tabId, { type: "capture:set-state", capturing: false, status: "idle", syncState: "ERROR", lastSafeError: localCapture.syncError }).catch(() => {});
          if (isBrowserAudioCapture()) await sendAudioControl({ type: "audio:stop" }).catch(() => {});
          localCapture = null;
          sendResponse({ ok: false, status: "idle", error: error.message, authDiag: error.authDiag ?? null, bridgeDiag: error.bridgeDiag ?? null, bridgeDetail: error.bridgeDetail ?? null, bridgeTrace: error.bridgeTrace ?? null, diagnostic: startMessageDiagnostic, backgroundDiagnostic: BACKGROUND_INIT_DIAGNOSTIC, serverCode: error.serverCode ?? null });
        }
        break;
      }
      case "capture:entries": {
        if (!localCapture) {
          sendResponse({ ok: false, error: "no-session" });
          break;
        }
        for (const entry of Array.isArray(message.entries) ? message.entries : []) {
          const key = String(entry?.sequence ?? localCapture.entries.length);
          if (localCapture.entrySequences.has(key)) continue;
          localCapture.entrySequences.add(key);
          localCapture.entries.push(entry);
        }
        if (!activeSession) {
          sendResponse({ ok: true, localOnly: true, lastSequence: localCapture.entries.at(-1)?.sequence ?? 0 });
          break;
        }
        const store = getDurableStore();
        for (const entry of message.entries || []) await store.enqueueEvent(activeSession.sessionId, entry);
        localCapture.state = "capture_active";
        await chrome.tabs.sendMessage(localCapture.tabId, { type: "capture:set-state", capturing: true, status: "capture_active", session: activeSession, syncState: "SYNCING" }).catch(() => {});
        try {
          const res = await api("/capture/entries", {
            sessionId: activeSession.sessionId,
            meetingId: activeSession.meetingId,
            entries: message.entries,
          });
          await store.markSynced(activeSession.sessionId, (message.entries || []).map((entry) => entry.sequence));
          await chrome.tabs.sendMessage(localCapture.tabId, { type: "capture:set-state", capturing: true, status: "capture_active", session: activeSession, syncState: "SYNCED" }).catch(() => {});
          sendResponse({ ok: true, lastSequence: res.body?.lastSequence ?? 0 });
        } catch (error) {
          localCapture.syncError = error.message ?? "sync-unavailable";
          localCapture.state = "retrying";
          scheduleSyncRetry();
          sendResponse({ ok: false, error: error.message });
        }
        break;
      }
      case "capture:audio-chunk": {
        if (!localCapture) {
          sendResponse({ ok: false, error: "no-session" });
          break;
        }
        try {
          const result = await transcribeChunk(message.sequence, message.buffer, message.mimeType);
          sendResponse({ ok: true, localOnly: result.localOnly === true, entryCount: localCapture.entries.length });
        } catch (error) {
          localCapture.syncError = error.authDiag ?? error.message ?? "transcription-unavailable";
          sendResponse({ ok: false, error: "transcription-unavailable" });
        }
        break;
      }
      case "capture:audio-error": {
        if (localCapture) localCapture.syncError = "audio-recorder-error";
        sendResponse({ ok: true });
        break;
      }
      case "capture:diagnostics": {
        captureDiagnostics = message.diagnostics && typeof message.diagnostics === "object"
          ? { ...message.diagnostics }
          : null;
        sendResponse({ ok: true });
        break;
      }
      case "capture:pause": {
        // Pause finalizes in-flight captions and stops the content observer but does NOT
        // close the server session — resume continues the SAME session.
        if (isBrowserAudioCapture()) await sendAudioControl({ type: "audio:stop" });
        localCapture.state = "capture_paused";
        await chrome.tabs.sendMessage(localCapture.tabId, { type: "capture:set-state", capturing: false }).catch(() => {});
        sendResponse({ ok: true, status: "capture_paused", state: "capture_paused", entryCount: localCapture.entries.length, session: activeSession });
        break;
      }
      case "capture:resume": {
        if (!localCapture && !activeSession) {
          sendResponse({ ok: false, error: "no-session" });
          break;
        }
        if (isBrowserAudioCapture() && !message.streamId) {
          sendResponse({ ok: false, error: "tab-audio-stream-id-missing" });
          break;
        }
        if (isBrowserAudioCapture()) await sendAudioControl({ type: "audio:start", streamId: message.streamId });
        localCapture.state = "capture_active";
        await chrome.tabs.sendMessage(localCapture.tabId, { type: "capture:set-state", capturing: true }).catch(() => {});
        sendResponse({ ok: true, status: "capture_active", state: "capture_active", entryCount: localCapture?.entries.length ?? 0, session: activeSession });
        break;
      }
      case "capture:stop": {
        if (!localCapture && !activeSession) {
          sendResponse({ ok: false, error: "no-session" });
          break;
        }
        const capturedCount = localCapture?.entries.length ?? 0;
        const syncError = localCapture?.syncError ?? null;
        if (!activeSession) {
          if (isBrowserAudioCapture()) await sendAudioControl({ type: "audio:stop" }).catch(() => {});
          await chrome.tabs.sendMessage(localCapture.tabId, { type: "capture:set-state", capturing: false }).catch(() => {});
          localCapture = null;
          sendResponse({ ok: true, status: "capture_complete", state: "idle", localOnly: true, entryCount: capturedCount, syncError });
          break;
        }
        try {
          if (isBrowserAudioCapture()) await sendAudioControl({ type: "audio:stop" });
          await chrome.tabs.sendMessage(localCapture.tabId, { type: "capture:set-state", capturing: false }).catch(() => {});
          await flushAudioQueue();
          await flushDurablePending();
          const res = await api("/capture/stop", {
            sessionId: activeSession.sessionId,
            meetingId: activeSession.meetingId,
          });
          const stopped = activeSession;
          await getDurableStore().saveSession({ id: stopped.sessionId, serverSessionId: stopped.sessionId, meetingId: stopped.meetingId, artifactId: stopped.artifactId, providerMeetingId: localCapture.providerSpaceId, acquisitionStrategy: localCapture.acquisitionStrategy, status: "complete", createdAt: new Date().toISOString() });
          activeSession = null;
          localCapture = null;
          await getDurableStore().removeSession(stopped.sessionId);
          sendResponse({ ok: true, status: "capture_complete", state: "idle", session: stopped, entryCount: res.body?.entryCount ?? capturedCount, syncError });
        } catch (error) {
          localCapture.syncError = error.message ?? "sync-unavailable";
          sendResponse({ ok: false, error: error.message });
        }
        break;
      }
      case "capture:status": {
        await restoreDurableSession();
        if (!localCapture && !activeSession) {
          const tabs = await chrome.tabs.query({ url: ["https://meet.google.com/*", "https://teams.microsoft.com/*", "https://teams.live.com/*", "https://*.zoom.us/*", "https://*.webex.com/*"] }).catch(() => []);
          for (const tab of tabs) {
            if (!tab.id) continue;
            const remote = await chrome.tabs.sendMessage(tab.id, { type: "capture:status" }).catch(() => null);
            if (!remote?.active || !remote.sessionId || !remote.meetingId) continue;
            activeSession = { sessionId: remote.sessionId, meetingId: remote.meetingId, artifactId: remote.artifactId ?? null };
            localCapture = { tabId: tab.id, acquisitionStrategy: remote.acquisitionStrategy || "browser_captions", state: remote.status || "capture_active", entries: [], entrySequences: new Set(), audioQueue: [], syncError: remote.lastSafeError || null };
            break;
          }
        }
        sendResponse({
          ok: true,
          active: Boolean(localCapture || activeSession),
          state: localCapture?.state ?? (activeSession ? "capture_active" : "idle"),
          acquisitionStrategy: localCapture?.acquisitionStrategy ?? null,
          session: activeSession,
          entryCount: localCapture?.entries.length ?? 0,
          localOnly: Boolean(localCapture && !activeSession),
          syncError: localCapture?.syncError ?? null,
          diagnostics: captureDiagnostics,
        });
        break;
      }
      default:
        sendResponse({ ok: false, error: "unknown" });
    }
  })();
  return true; // keep the message channel open for async sendResponse
});
