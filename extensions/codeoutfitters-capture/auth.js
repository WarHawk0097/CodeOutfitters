const EXTENSION_SESSION_KEY = "codeoutfitters.extensionSession";
const EXTENSION_PENDING_AUTH_KEY = "codeoutfitters.pendingExtensionAuth";
const EXTENSION_AUTH_DIAGNOSTIC_KEY = "codeoutfitters.authDiagnostic";
const EXTENSION_AUTH_ERROR_KEY = "codeoutfitters.authError";
const EXTENSION_AUTH_HTTP_STATUS_KEY = "codeoutfitters.authHttpStatus";
const EXTENSION_AUTH_SERVER_CODE_KEY = "codeoutfitters.authServerCode";
const EXTENSION_AUTH_PATH = "/api/extension/auth";
const LOCAL_AUTH_PAGE_PATH = "/extension-auth";
const LOCAL_AUTH_TIMEOUT_MS = 3 * 60 * 1000;
const EXTENSION_AUTH_STAGES = Object.freeze([
  "EXT_AUTH_BEGIN", "EXT_AUTH_AUTHORIZE_URL_BUILT", "EXT_AUTH_PAGE_OPEN_FAILED",
  "EXT_AUTH_PAGE_HTTP_ERROR", "EXT_AUTH_CALLBACK_NOT_REACHED", "EXT_AUTH_CALLBACK_INVALID",
  "EXT_AUTH_STATE_MISMATCH", "EXT_AUTH_CODE_MISSING", "EXT_AUTH_CODE_EXCHANGE_FAILED",
  "EXT_AUTH_SESSION_INVALID", "EXT_AUTH_POLL_AUTHORIZED", "EXT_AUTH_EXCHANGE_BEGIN",
  "EXT_AUTH_EXCHANGE_HTTP_ERROR", "EXT_AUTH_EXCHANGE_REJECTED", "EXT_AUTH_SESSION_SAVE_FAILED",
  "EXT_AUTH_SESSION_SAVED", "EXT_AUTH_COMPLETE", "EXT_AUTH_SUCCESS",
]);
const AUTH_SAFE_STAGES = Object.freeze([
  "AUTH_PENDING_FOUND", "AUTH_STATUS_REQUEST", "AUTH_STATUS_PENDING", "AUTH_STATUS_AUTHORIZED",
  "AUTH_EXCHANGE_BEGIN", "AUTH_EXCHANGE_200", "AUTH_SESSION_STORED", "AUTH_PENDING_CLEARED",
  "AUTH_CONNECTED", "AUTH_EXCHANGE_FAILED",
]);
const AUTH_SAFE_ERRORS = Object.freeze([
  "SESSION_WRITE_FAILED", "SESSION_READBACK_MISSING", "SESSION_SCHEMA_INVALID", "SESSION_EXPIRED",
  "SESSION_VALIDATION_FAILED", "EXCHANGE_FAILED", "EXCHANGE_RESPONSE_INVALID", "AUTH_DENIED", "EXCHANGE_NETWORK_FAILED",
  "EXCHANGE_REQUEST_NOT_FOUND", "EXCHANGE_NOT_AUTHORIZED", "EXCHANGE_ALREADY_CONSUMED", "EXCHANGE_EXPIRED",
  "EXCHANGE_STATE_MISMATCH", "EXCHANGE_PKCE_MISMATCH", "EXCHANGE_SESSION_CREATE_FAILED",
]);

function authError(stage, detail = "") { return new Error(`${stage}${detail ? `:${detail}` : ""}`); }
async function reportAuthDiagnostic(stage) {
  if (!AUTH_SAFE_STAGES.includes(stage)) return;
  await chrome.storage.local.set({ [EXTENSION_AUTH_DIAGNOSTIC_KEY]: stage }).catch(() => {});
  try { await chrome.runtime?.sendMessage?.({ type: "auth:diagnostic", stage }).catch(() => {}); } catch {}
}
async function reportAuthError(error) {
  if (!AUTH_SAFE_ERRORS.includes(error)) return;
  await chrome.storage.local.set({ [EXTENSION_AUTH_ERROR_KEY]: error }).catch(() => {});
  try { await chrome.runtime?.sendMessage?.({ type: "auth:error", error }).catch(() => {}); } catch {}
}
async function reportAuthFailure(httpStatus, serverCode, error = serverCode) {
  await reportAuthError(error);
  await chrome.storage.local.set({
    [EXTENSION_AUTH_HTTP_STATUS_KEY]: Number.isInteger(httpStatus) ? httpStatus : null,
    [EXTENSION_AUTH_SERVER_CODE_KEY]: AUTH_SAFE_ERRORS.includes(serverCode) ? serverCode : null,
  }).catch(() => {});
  try { await chrome.runtime?.sendMessage?.({ type: "auth:failure", httpStatus: Number.isInteger(httpStatus) ? httpStatus : null, serverCode }).catch(() => {}); } catch {}
}
function randomBytes(size = 32) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return bytes; }
function base64Url(bytes) { let value = ""; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
async function sha256Base64Url(value) { return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))); }
function redirectUri() { return chrome.identity?.getRedirectURL ? chrome.identity.getRedirectURL("extension-auth") : `${CAPTURE_API_ORIGIN}/extension-auth/callback`; }
function isLocalAuthTransport() { const origin = new URL(CAPTURE_API_ORIGIN); return origin.protocol === "http:" && origin.hostname === "localhost"; }
function isProductionAuthTransport() { return new URL(CAPTURE_API_ORIGIN).protocol === "https:"; }
function authEndpoint(name) { return `${CAPTURE_API_ORIGIN}${EXTENSION_AUTH_PATH}/${name}`; }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function ensureLocalApiAccess() {
  if (!isLocalAuthTransport() || !chrome.permissions?.contains || !chrome.permissions?.request) return;
  const origin = `${new URL(CAPTURE_API_ORIGIN).origin}/*`;
  if (await chrome.permissions.contains({ origins: [origin] })) return;
  if (!(await chrome.permissions.request({ origins: [origin] }))) throw authError("EXT_AUTH_PAGE_OPEN_FAILED", "local_api_access_denied");
}

function expiryMilliseconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value < 1e12 ? value * 1000 : value;
  if (typeof value === "string") return Date.parse(value);
  return Number.NaN;
}
function safeSession(body) {
  const expiry = expiryMilliseconds(body?.expiresAt);
  if (!body?.accessToken || !Number.isFinite(expiry) || expiry <= 0 || expiry > 8.64e15 || body.scope !== "meeting_capture") return null;
  return { accessToken: body.accessToken, expiresAt: new Date(expiry).toISOString(), scope: body.scope, ...(body.accountName ? { accountName: body.accountName } : {}), ...(body.workspaceName ? { workspaceName: body.workspaceName } : {}), authDiagnostic: "EXT_AUTH_SUCCESS" };
}

async function readSession() {
  const stored = await chrome.storage.local.get(EXTENSION_SESSION_KEY);
  const session = stored?.[EXTENSION_SESSION_KEY];
  if (!session) return null;
  const valid = safeSession(session);
  if (!valid) { await reportAuthError("SESSION_SCHEMA_INVALID"); return null; }
  if (Date.parse(valid.expiresAt) <= Date.now() + 30_000) { await reportAuthError("SESSION_EXPIRED"); return null; }
  return { ...session, expiresAt: valid.expiresAt };
}

async function saveSession(body) {
  const session = safeSession(body);
  if (!session) { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthFailure(null, "EXCHANGE_RESPONSE_INVALID"); throw authError("EXT_AUTH_SESSION_INVALID", "scope_or_expiry"); }
  try {
    await chrome.storage.local.set({ [EXTENSION_SESSION_KEY]: session });
  } catch {
    await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED");
    await reportAuthFailure(null, "SESSION_WRITE_FAILED");
    throw authError("EXT_AUTH_SESSION_INVALID", "storage");
  }
  const stored = await chrome.storage.local.get(EXTENSION_SESSION_KEY).catch(() => null);
  const saved = stored?.[EXTENSION_SESSION_KEY];
  if (!saved) { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthFailure(null, "SESSION_READBACK_MISSING"); throw authError("EXT_AUTH_SESSION_INVALID", "readback"); }
  const verified = safeSession(saved);
  if (!verified) { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthFailure(null, "SESSION_SCHEMA_INVALID"); throw authError("EXT_AUTH_SESSION_INVALID", "schema"); }
  if (Date.parse(verified.expiresAt) <= Date.now() + 30_000) { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthFailure(null, "SESSION_EXPIRED"); throw authError("EXT_AUTH_SESSION_INVALID", "expiry"); }
  if (verified.accessToken !== session.accessToken || verified.scope !== "meeting_capture") { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthFailure(null, "SESSION_VALIDATION_FAILED"); throw authError("EXT_AUTH_SESSION_INVALID", "readback"); }
  await reportAuthDiagnostic("AUTH_SESSION_STORED");
  return verified;
}

async function readPendingAuth() {
  const stored = await chrome.storage.local.get(EXTENSION_PENDING_AUTH_KEY);
  return stored?.[EXTENSION_PENDING_AUTH_KEY] ?? null;
}
async function writePendingAuth(pending) { await chrome.storage.local.set({ [EXTENSION_PENDING_AUTH_KEY]: pending }); }
async function clearPendingAuth() { await chrome.storage.local.remove(EXTENSION_PENDING_AUTH_KEY); await reportAuthDiagnostic("AUTH_PENDING_CLEARED"); }
async function readAuthDiagnostic() {
  const stored = await chrome.storage.local.get(EXTENSION_AUTH_DIAGNOSTIC_KEY);
  return AUTH_SAFE_STAGES.includes(stored?.[EXTENSION_AUTH_DIAGNOSTIC_KEY]) ? stored[EXTENSION_AUTH_DIAGNOSTIC_KEY] : null;
}
async function readAuthError() {
  const stored = await chrome.storage.local.get(EXTENSION_AUTH_ERROR_KEY);
  return AUTH_SAFE_ERRORS.includes(stored?.[EXTENSION_AUTH_ERROR_KEY]) ? stored[EXTENSION_AUTH_ERROR_KEY] : null;
}
async function readAuthFailure() {
  const stored = await chrome.storage.local.get([EXTENSION_AUTH_HTTP_STATUS_KEY, EXTENSION_AUTH_SERVER_CODE_KEY]);
  return {
    httpStatus: Number.isInteger(stored?.[EXTENSION_AUTH_HTTP_STATUS_KEY]) ? stored[EXTENSION_AUTH_HTTP_STATUS_KEY] : null,
    serverCode: AUTH_SAFE_ERRORS.includes(stored?.[EXTENSION_AUTH_SERVER_CODE_KEY]) ? stored[EXTENSION_AUTH_SERVER_CODE_KEY] : null,
  };
}
async function setAuthDiagnostic(stage) { await reportAuthDiagnostic(stage); }

async function exchangeLocalRequest(requestId, verifier) {
  reportAuthDiagnostic("AUTH_EXCHANGE_BEGIN");
  let response;
  try { response = await fetch(authEndpoint("exchange"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId, verifier }) }); }
  catch { reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); reportAuthFailure(null, "EXCHANGE_NETWORK_FAILED"); throw authError("EXT_AUTH_CODE_EXCHANGE_FAILED", "network"); }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const serverCode = body?.error?.code && AUTH_SAFE_ERRORS.includes(body.error.code) ? body.error.code : "EXCHANGE_FAILED";
    reportAuthDiagnostic("AUTH_EXCHANGE_FAILED");
    reportAuthFailure(response.status, serverCode);
    throw authError("EXT_AUTH_CODE_EXCHANGE_FAILED", `http_${response.status}`);
  }
  reportAuthDiagnostic("AUTH_EXCHANGE_200");
  return body;
}

async function completePendingLocalAuth(pending) {
  const deadline = Math.min(Date.parse(pending.expiresAt), Date.now() + LOCAL_AUTH_TIMEOUT_MS);
  try {
    while (Date.now() < deadline) {
      await reportAuthDiagnostic("AUTH_STATUS_REQUEST");
      let statusResponse;
      try { statusResponse = await fetch(`${authEndpoint("status")}?requestId=${encodeURIComponent(pending.requestId)}`); }
      catch { continue; }
      const statusBody = await statusResponse.json().catch(() => null);
      if (!statusResponse.ok) throw authError("EXT_AUTH_PAGE_HTTP_ERROR", `http_${statusResponse.status}`);
      if (statusBody?.status === "denied") { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthError("AUTH_DENIED"); await clearPendingAuth(); throw authError("EXT_AUTH_CALLBACK_INVALID", "denied"); }
      if (statusBody?.status === "expired") { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthError("SESSION_EXPIRED"); await clearPendingAuth(); throw authError("EXT_AUTH_CALLBACK_NOT_REACHED", "expired"); }
      if (statusBody?.status !== "authorized") {
        await reportAuthDiagnostic("AUTH_STATUS_PENDING");
        await sleep(1000);
        continue;
      }
      await reportAuthDiagnostic("AUTH_STATUS_AUTHORIZED");
      const body = await exchangeLocalRequest(pending.requestId, pending.verifier);
      const session = await saveSession(body);
      await clearPendingAuth();
      await reportAuthDiagnostic("AUTH_CONNECTED");
      return session;
    }
    reportAuthDiagnostic("AUTH_EXCHANGE_FAILED");
    reportAuthError("EXCHANGE_FAILED");
    throw authError("EXT_AUTH_CALLBACK_NOT_REACHED", "timeout");
  } catch (error) {
    if (!await readAuthError()) { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); await reportAuthFailure(null, "EXCHANGE_FAILED"); }
    throw error;
  } finally {
    if (pending.authTabId != null && chrome.tabs?.remove) await chrome.tabs.remove(pending.authTabId).catch(() => {});
  }
}

async function signInLocal(state, verifier, challenge) {
  let requestResponse;
  try { requestResponse = await fetch(authEndpoint("request"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ state, codeChallenge: challenge }) }); }
  catch { throw authError("EXT_AUTH_PAGE_OPEN_FAILED", "request_network"); }
  const requestBody = await requestResponse.json().catch(() => null);
  if (!requestResponse.ok || !requestBody?.requestId || !requestBody?.expiresAt) throw authError("EXT_AUTH_PAGE_HTTP_ERROR", `http_${requestResponse.status}`);
  const pending = { requestId: requestBody.requestId, state, verifier, challenge, expiresAt: requestBody.expiresAt, authTabId: null };
  await writePendingAuth(pending);
  await reportAuthDiagnostic("AUTH_PENDING_FOUND");
  const authPageUrl = new URL(`${CAPTURE_API_ORIGIN}${LOCAL_AUTH_PAGE_PATH}`);
  authPageUrl.searchParams.set("requestId", requestBody.requestId);
  authPageUrl.searchParams.set("state", state);
  authPageUrl.searchParams.set("code_challenge", challenge);
  await reportAuthDiagnostic("EXT_AUTH_AUTHORIZE_URL_BUILT");
  let authTab;
  try { authTab = await chrome.tabs.create({ url: authPageUrl.toString() }); }
  catch { await clearPendingAuth(); throw authError("EXT_AUTH_PAGE_OPEN_FAILED", `origin=${authPageUrl.origin};path=${authPageUrl.pathname}`); }
  const storedPending = { ...pending, authTabId: authTab?.id ?? null };
  await writePendingAuth(storedPending);
  return completePendingLocalAuth(storedPending);
}

async function signInProduction(state, verifier, challenge) {
  const callbackUrl = redirectUri();
  const authUrl = new URL(`${CAPTURE_API_ORIGIN}${EXTENSION_AUTH_PATH}/authorize`);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("code_challenge", challenge);
  await reportAuthDiagnostic("EXT_AUTH_AUTHORIZE_URL_BUILT");
  try {
    const callback = await chrome.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive: true });
    if (typeof callback !== "string" || !callback) throw authError("EXT_AUTH_CALLBACK_NOT_REACHED");
    const returned = new URL(callback);
    const expected = new URL(callbackUrl);
    if (returned.origin !== expected.origin || returned.pathname !== expected.pathname) throw authError("EXT_AUTH_CALLBACK_INVALID", "callback_path_mismatch");
    if (returned.searchParams.get("state") !== state) throw authError("EXT_AUTH_STATE_MISMATCH", "state=false");
    if (returned.searchParams.get("error")) throw authError("EXT_AUTH_CALLBACK_INVALID", "authorization_denied");
const code = returned.searchParams.get("code");
  if (!code) throw authError("EXT_AUTH_CODE_MISSING");
  await reportAuthDiagnostic("EXT_AUTH_EXCHANGE_BEGIN");
    let response;
    try { response = await fetch(`${CAPTURE_API_ORIGIN}${EXTENSION_AUTH_PATH}/token`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, verifier, redirectUri: callbackUrl }) }); }
  catch { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); throw authError("EXT_AUTH_CODE_EXCHANGE_FAILED", "network"); }
    const body = await response.json().catch(() => null);
    if (!response.ok) { await reportAuthDiagnostic("AUTH_EXCHANGE_FAILED"); throw authError("EXT_AUTH_CODE_EXCHANGE_FAILED", `http_${response.status}`); }
    return saveSession(body);
  } catch (error) {
    if (error?.message?.startsWith("EXT_AUTH_")) throw error;
    throw authError("EXT_AUTH_PAGE_OPEN_FAILED", `origin=${authUrl.origin};path=${authUrl.pathname}`);
  }
}

let pendingAuthPromise = null;
async function resumePendingAuth() {
  if (pendingAuthPromise) return pendingAuthPromise;
  const pending = await readPendingAuth();
  if (!pending?.requestId || !pending.verifier || !pending.expiresAt || expiryMilliseconds(pending.expiresAt) <= Date.now()) { if (pending) { await reportAuthError("SESSION_EXPIRED"); await clearPendingAuth(); } return null; }
  await reportAuthDiagnostic("AUTH_PENDING_FOUND");
  pendingAuthPromise = completePendingLocalAuth(pending).finally(() => { pendingAuthPromise = null; });
  return pendingAuthPromise;
}

async function signIn() {
  if (!crypto?.getRandomValues) throw authError("EXT_AUTH_BEGIN", "crypto_unavailable");
  if (isProductionAuthTransport() && !chrome.identity?.launchWebAuthFlow) throw authError("EXT_AUTH_PAGE_OPEN_FAILED", "identity_unavailable");
  const existing = await readPendingAuth();
  if (existing) return resumePendingAuth();
  const state = base64Url(randomBytes());
  const verifier = base64Url(randomBytes());
  const challenge = await sha256Base64Url(verifier);
  await ensureLocalApiAccess();
  await chrome.storage.local.remove([EXTENSION_AUTH_DIAGNOSTIC_KEY, EXTENSION_AUTH_ERROR_KEY, EXTENSION_AUTH_HTTP_STATUS_KEY, EXTENSION_AUTH_SERVER_CODE_KEY]).catch(() => {});
  return isLocalAuthTransport() ? signInLocal(state, verifier, challenge) : signInProduction(state, verifier, challenge);
}

async function getSession() { return (await readSession()) || signIn(); }
async function signOut() { const session = await readSession(); if (session?.accessToken) await fetch(`${CAPTURE_API_ORIGIN}${EXTENSION_AUTH_PATH}/revoke`, { method: "POST", headers: { authorization: `Bearer ${session.accessToken}` } }).catch(() => {}); await chrome.storage.local.remove(EXTENSION_SESSION_KEY); }

if (typeof globalThis !== "undefined") globalThis.CodeOutfittersAuth = { readSession, signIn, getSession, signOut, resumePendingAuth, readAuthDiagnostic, readAuthError, readAuthFailure, setAuthDiagnostic, redirectUri, isLocalAuthTransport, isProductionAuthTransport, EXTENSION_SESSION_KEY, EXTENSION_PENDING_AUTH_KEY, EXTENSION_AUTH_DIAGNOSTIC_KEY, EXTENSION_AUTH_ERROR_KEY, EXTENSION_AUTH_HTTP_STATUS_KEY, EXTENSION_AUTH_SERVER_CODE_KEY, EXTENSION_AUTH_STAGES };
