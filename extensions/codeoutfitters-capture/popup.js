// Popup is a short-lived controller/view. The background service worker owns
// capture state; reopening this document must never create or lose a session.
const $ = (id) => document.getElementById(id);
const stateEl = $("state");
const spaceInput = $("space");
const startBtn = $("start");
const pauseBtn = $("pause");
const stopBtn = $("stop");
const resumeBtn = $("resume");
const noticeEl = $("notice");
const errorEl = $("error");
const countEl = $("count");
const countRow = $("count-row");
const meetingMeta = $("meeting-meta");
const signInBtn = $("sign-in");
const signOutBtn = $("sign-out");
const authStatusEl = $("auth-status");

let meetTab = null;
let entryCount = 0;
let authSession = null;

function safeErrorMessage(error) {
  return String(error?.message ?? error ?? "unknown-error")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
    .replace(/(token|cookie|session)[=:][^\s]+/gi, "$1=[redacted]")
    .slice(0, 240);
}

function showDiagnostic(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function showAuthDiagnostic(stage, authError, authFailure = {}) {
  if (!stage && !authError) return;
  showDiagnostic(`AUTH_STAGE=${stage ?? "UNKNOWN"}${authError ? ` AUTH_ERROR=${authError}` : ""}${Number.isInteger(authFailure.httpStatus) ? ` AUTH_HTTP_STATUS=${authFailure.httpStatus}` : ""}${authFailure.serverCode ? ` AUTH_SERVER_CODE=${authFailure.serverCode}` : ""}`);
}

function describeError(code) {
  switch (code) {
    case "not-authenticated": return "Sign in to CodeOutfitters in your browser, then try again.";
    case "no-session": return "No active capture session. Start capture first.";
    case "CAPTURE_ALREADY_ACTIVE": return "Capture is already active.";
    case "tab-audio-stream-id-missing": return "Edge did not provide audio for the selected Meet tab.";
    case "transcription-unavailable": return "Local transcription unavailable; audio was not retained.";
    default: return "Upload failed. Try again.";
  }
}

function safeServerCode(code) {
  return typeof code === "string" && /^CAPTURE_START_[A-Z0-9_]{1,80}$/.test(code) ? code : null;
}

function parseMeetCode(url) {
  const match = url.match(/meet\.google\.com\/([a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3})/i);
  return match ? match[1] : null;
}

function showCaptureDiagnostics(diagnostics) {
  if (!diagnostics) return;
  showDiagnostic(
    `OBSERVER ${diagnostics.observerActive ? "ACTIVE" : "INACTIVE"} · ` +
    `TEXT ${diagnostics.captionTextsSeen ?? 0} · ENTRIES ${diagnostics.entriesCommitted ?? 0} · ` +
    `${diagnostics.lastEvent ?? "NO_EVENT"}`,
  );
}

function renderState(state, extra = {}) {
  stateEl.className = `state ${state}`;
  const count = extra.entryCount ?? entryCount;
  entryCount = count;
  countEl.textContent = String(count);
  countRow.hidden = state === "idle" || state === "starting";
  noticeEl.hidden = state !== "capture_active" && state !== "capture_paused";
  startBtn.disabled = state !== "idle";
  spaceInput.disabled = state !== "idle";
  pauseBtn.disabled = state !== "capture_active";
  resumeBtn.hidden = state !== "capture_paused";
  stopBtn.disabled = !["starting", "capture_active", "capture_paused", "stopping"].includes(state);
  switch (state) {
    case "starting": stateEl.textContent = "STARTING…"; break;
    case "capture_active": stateEl.textContent = "CAPTURING"; break;
    case "capture_paused": stateEl.textContent = "CAPTURE PAUSED"; break;
    case "stopping": stateEl.textContent = "STOPPING…"; break;
    case "capture_complete": stateEl.textContent = "MEETING COMPLETE"; break;
    case "upload_error": stateEl.textContent = "UPLOAD ERROR"; break;
    case "not_connected": stateEl.textContent = "NOT CONNECTED"; break;
    default: stateEl.textContent = "READY";
  }
}

async function queryState() {
  const status = await chrome.runtime.sendMessage({ type: "capture:status" });
  const state = status?.state ?? (status?.active ? "capture_active" : "idle");
  renderState(state, { entryCount: status?.entryCount ?? 0 });
  if (status?.session?.meetingId) meetingMeta.textContent = `Meeting: ${status.session.meetingId.slice(0, 8)}…`;
  if (status?.diagnostics) showCaptureDiagnostics(status.diagnostics);
  else if (status?.localOnly) showDiagnostic("CAPTURING LOCALLY — SYNC UNAVAILABLE");
  else if (state === "idle" || state === "capture_complete") errorEl.hidden = true;
  return status;
}

async function init() {
  showDiagnostic("POPUP_INIT_STARTED");
  try {
    const authResume = await chrome.runtime.sendMessage({ type: "auth:resume" }).catch(() => null);
    authSession = authResume?.session ?? null;
    const authStage = authResume?.diagnostic || null;
    const authError = authResume?.authError || null;
    const authFailure = authResume?.authFailure || {};
    if (signInBtn) signInBtn.hidden = Boolean(authSession);
    if (signOutBtn) signOutBtn.hidden = !authSession;
    if (authStatusEl) {
      authStatusEl.hidden = !authSession;
      authStatusEl.textContent = authSession ? `CONNECTED${authSession.accountName ? ` · ${authSession.accountName}` : ""}${authSession.workspaceName ? ` · ${authSession.workspaceName}` : ""}` : "";
    }
    [meetTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!meetTab?.url?.startsWith("https://meet.google.com/")) {
      // Authentication and capture readiness are separate states. An authenticated
      // user without a Meet tab is connected and ready to choose a Meet tab, not
      // disconnected.
      renderState(authSession ? "idle" : "not_connected");
      if (!authSession && (authStage || authError)) showAuthDiagnostic(authStage, authError, authFailure);
      else showDiagnostic("Open a Google Meet tab to start capture.");
      return;
    }
    const code = parseMeetCode(meetTab.url);
    if (code) spaceInput.value = code;
    await queryState();
    if (!authSession && (authStage || authError)) showAuthDiagnostic(authStage, authError, authFailure);
    else if (!authSession) showDiagnostic("Open a Google Meet tab to start capture.");
  } catch (error) {
    renderState("upload_error");
    showDiagnostic(`POPUP_INIT_FAILED:${safeErrorMessage(error)}`);
  }
}

startBtn.addEventListener("click", async () => {
  showDiagnostic("START_CLICK_RECEIVED");
  renderState("starting");
  const providerSpaceId = parseMeetCode(spaceInput.value.trim()) ?? spaceInput.value.trim();
  if (!providerSpaceId) {
    renderState("upload_error");
    showDiagnostic("START_RESPONSE_INVALID:Enter Meet space code or URL.");
    return;
  }
  try {
    if (!authSession) throw new Error("not-authenticated");
    const res = await chrome.runtime.sendMessage({
      type: "capture:start",
      providerSpaceId,
      tabId: meetTab?.id,
      acquisitionStrategy: "browser_captions",
    });
    if (!res?.ok) {
      renderState(res?.state ?? "upload_error", { entryCount: res?.entryCount ?? entryCount });
      const trace = Array.isArray(res?.bridgeTrace)
        ? ` · ${res.bridgeTrace.slice(-6).map((item) => typeof item === "string" ? item : `${item.stage}${item.detail ? `:${item.detail}` : ""}`).join(" → ")}`
        : "";
      const detail = res?.bridgeDetail ? ` — ${res.bridgeDetail}${trace}` : trace;
      const serverCode = safeServerCode(res?.serverCode ?? res?.error);
      const startDiagnostic = serverCode
        ? `${res?.authDiag ?? "CAPTURE_START_FAILED"}:${serverCode}`
        : res?.authDiag;
      showDiagnostic(`START_RESPONSE_RECEIVED: ${serverCode ? startDiagnostic : describeError(res?.error)}${startDiagnostic && !serverCode ? ` [${startDiagnostic}]` : ""}${detail}`);
      return;
    }
    renderState(res.state ?? "capture_active", { entryCount: res.entryCount ?? 0 });
    if (res.session?.meetingId) meetingMeta.textContent = `Meeting: ${res.session.meetingId.slice(0, 8)}…`;
    errorEl.hidden = true;
  } catch (error) {
    renderState("upload_error");
    showDiagnostic(`START_MESSAGE_SEND_FAILED:${safeErrorMessage(error)}`);
  }
});

signInBtn?.addEventListener("click", async () => {
  try {
    const result = await chrome.runtime.sendMessage({ type: "auth:sign-in" });
    if (!result?.ok) {
      if (result?.diagnostic || result?.authError) showAuthDiagnostic(result.diagnostic, result.authError, result.authFailure);
      throw new Error(result?.error || "EXTENSION_AUTH_FAILED");
    }
    authSession = result.session;
    if (!authSession) throw new Error("EXT_AUTH_SESSION_SAVE_FAILED:readback");
    signInBtn.hidden = true;
    signOutBtn.hidden = false;
    if (authStatusEl) { authStatusEl.hidden = false; authStatusEl.textContent = `CONNECTED${authSession.accountName ? ` · ${authSession.accountName}` : ""}${authSession.workspaceName ? ` · ${authSession.workspaceName}` : ""}`; }
    showDiagnostic("SIGNED_IN");
  } catch (error) {
    const detail = safeErrorMessage(error);
    // Show safe diagnostics from background instead of generic failure
    showDiagnostic(detail);
  }
});

signOutBtn?.addEventListener("click", async () => {
  const result = await chrome.runtime.sendMessage({ type: "auth:sign-out" });
  if (!result?.ok) { showDiagnostic("EXTENSION_SIGN_OUT_FAILED"); return; }
  authSession = null;
  signInBtn.hidden = false;
  signOutBtn.hidden = true;
  if (authStatusEl) { authStatusEl.hidden = true; authStatusEl.textContent = ""; }
  showDiagnostic("SIGNED_OUT");
});

pauseBtn.addEventListener("click", async () => {
  const res = await chrome.runtime.sendMessage({ type: "capture:pause", tabId: meetTab?.id });
  if (res?.ok) renderState(res.state ?? "capture_paused", { entryCount: res.entryCount ?? entryCount });
  else showDiagnostic(describeError(res?.error));
});

resumeBtn.addEventListener("click", async () => {
  const res = await chrome.runtime.sendMessage({ type: "capture:resume", tabId: meetTab?.id, acquisitionStrategy: "browser_captions" });
  if (res?.ok) renderState(res.state ?? "capture_active", { entryCount: res.entryCount ?? entryCount });
  else showDiagnostic(describeError(res?.error));
});

stopBtn.addEventListener("click", async () => {
  renderState("stopping");
  const res = await chrome.runtime.sendMessage({ type: "capture:stop", tabId: meetTab?.id }).catch(() => null);
  if (res?.ok) {
    renderState(res.state ?? "idle", { entryCount: res.entryCount ?? entryCount });
    meetingMeta.textContent = res.localOnly || res.syncError ? "Capture complete — local transcript retained; sync unavailable." : "Capture complete — transcript saved.";
  } else {
    renderState("upload_error");
    showDiagnostic(describeError(res?.error));
  }
});

init();
