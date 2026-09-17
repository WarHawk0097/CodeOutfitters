// CodeOutfitters Meeting Capture — Meet caption content script.
//
// The discovery/stabilization approach is adapted from Meet Note Taker
// (Apache-2.0): https://github.com/AI-Embedded-Open-Source/Meet-Note-Taker
// at commit ddb172fbfd72bb864facf5e8ffddc78852611698.
// See THIRD_PARTY_NOTICES.md for the attribution record.

const STABILITY_MS = 1000;
const REDISCOVER_MS = 1500;
const SEEN_TTL_MS = 10 * 60 * 1000;
const MAX_BATCH = 40;

let capturing = false;
let observer = null;
let rediscoverTimer = null;
let captionContainer = null;
let rowIdCounter = 0;
let sequence = 0;
let pending = [];
const transcriptEntries = [];
const provider = globalThis.CodeOutfittersProviders?.detectProvider?.(location.href) ?? {
  id: "google_meet",
  getMeetingIdentity: () => location.pathname,
};
const providerMeetingId = provider.getMeetingIdentity?.(location.href) || location.pathname;
const liveState = {
  provider: provider.id,
  providerMeetingId,
  meetingSpace: providerMeetingId,
  status: "idle",
  sessionId: null,
  meetingId: null,
  transcriptCount: 0,
  startedAt: null,
  lastCaptionAt: null,
  syncState: "SYNCED",
  unsyncedCount: 0,
  lastSafeError: null,
  notes: [],
  moments: [],
};
let panel = null;
let panelToggle = null;
const diagnostics = {
  observerActive: false,
  mutationsSeen: 0,
  captionCandidatesSeen: 0,
  captionTextsSeen: 0,
  entriesCommitted: 0,
  lastEvent: "CAPTION_OBSERVER_IDLE",
};
let diagnosticsTimer = null;

const nodeToKey = new WeakMap();
const pendingRows = new Map();
const seenHashes = new Map();

function renderPanel() {
  if (!panel) return;
  const state = panel.querySelector("[data-co-state]");
  const count = panel.querySelector("[data-co-count]");
  const transcript = panel.querySelector("[data-co-transcript]");
  if (state) state.textContent = `${liveState.status.toUpperCase()} · ${liveState.syncState}`;
  if (count) count.textContent = `${liveState.transcriptCount} entries`;
  if (transcript && !transcript.dataset.userScrolled) {
    transcript.textContent = transcriptEntries.map((entry) => `${entry.speakerLabel || "Unknown"} · ${entry.text}`).join("\n");
  }
  for (const button of panel.querySelectorAll("button[data-co-action]")) {
    button.disabled = button.dataset.coAction === "start" ? liveState.status !== "idle" : liveState.status === "idle";
  }
}

function mountPanel() {
  if (panel || !document.body) return;
  panelToggle?.remove();
  panelToggle = null;
  panel = document.createElement("aside");
  panel.id = "codeoutfitters-copilot";
  panel.setAttribute("aria-label", "CodeOutfitters Copilot");
  panel.style.cssText = "position:fixed;top:72px;right:16px;z-index:2147483647;width:320px;max-height:70vh;background:#101828;color:#f8fafc;border:1px solid #344054;border-radius:12px;box-shadow:0 12px 32px #0006;font:13px system-ui;padding:14px;display:flex;flex-direction:column;gap:10px";
  const title = document.createElement("div"); title.textContent = `CodeOutfitters Copilot · ${liveState.provider}`; title.style.fontWeight = "700";
  const tabs = document.createElement("nav"); tabs.setAttribute("aria-label", "Copilot sections"); tabs.style.cssText = "display:flex;gap:4px";
  for (const label of ["LIVE", "NOTES", "AI", "INSIGHTS"]) { const tab = document.createElement("button"); tab.textContent = label; tab.dataset.coTab = label.toLowerCase(); tab.style.cssText = "padding:4px 6px;border:0;border-radius:5px;cursor:pointer"; tabs.append(tab); }
  const state = document.createElement("div"); state.dataset.coState = ""; state.setAttribute("role", "status");
  const count = document.createElement("div"); count.dataset.coCount = "";
  const transcript = document.createElement("pre"); transcript.dataset.coTranscript = ""; transcript.style.cssText = "white-space:pre-wrap;overflow:auto;max-height:220px;background:#1d2939;padding:8px;border-radius:8px";
  transcript.addEventListener("scroll", () => { transcript.dataset.userScrolled = "true"; });
  const controls = document.createElement("div"); controls.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
  for (const [action, label] of [["start", "Start"], ["pause", "Pause"], ["resume", "Resume"], ["stop", "Stop"]]) {
    const button = document.createElement("button"); button.dataset.coAction = action; button.textContent = label; button.style.cssText = "padding:6px 8px;border:0;border-radius:6px;cursor:pointer";
    button.addEventListener("click", () => chrome.runtime.sendMessage({ type: `capture:${action}`, tabId: null, providerSpaceId: liveState.meetingSpace, acquisitionStrategy: "browser_captions" }).catch(() => {}));
    controls.append(button);
  }
  const note = document.createElement("input"); note.placeholder = "Quick note…"; note.setAttribute("aria-label", "Quick note"); note.style.cssText = "padding:7px;border-radius:6px;border:1px solid #475467";
  note.addEventListener("keydown", (event) => { if (event.key === "Enter" && note.value.trim()) { liveState.notes.push({ text: note.value.trim(), capturedAt: new Date().toISOString(), transcriptCount: liveState.transcriptCount }); note.value = ""; } });
  const close = document.createElement("button"); close.textContent = "Minimize"; close.addEventListener("click", () => { panel.remove(); panel = null; showPanelToggle(); });
  panel.append(title, tabs, state, count, transcript, controls, note, close); document.body.append(panel); renderPanel();
}

function showPanelToggle() {
  if (panelToggle || !document.body) return;
  panelToggle = document.createElement("button");
  panelToggle.id = "codeoutfitters-copilot-reopen";
  panelToggle.textContent = "Open Copilot";
  panelToggle.setAttribute("aria-label", "Open CodeOutfitters Copilot");
  panelToggle.style.cssText = "position:fixed;top:72px;right:16px;z-index:2147483647;padding:8px 10px;border:0;border-radius:8px;background:#101828;color:#f8fafc;box-shadow:0 8px 20px #0006;cursor:pointer;font:12px system-ui";
  panelToggle.addEventListener("click", () => { panelToggle.remove(); panelToggle = null; mountPanel(); });
  document.body.append(panelToggle);
}

function updateLiveState(patch) { Object.assign(liveState, patch); renderPanel(); }

function reportDiagnostics() {
  if (diagnosticsTimer) return;
  diagnosticsTimer = setTimeout(() => {
    diagnosticsTimer = null;
    chrome.runtime.sendMessage({ type: "capture:diagnostics", diagnostics: { ...diagnostics } }).catch(() => {});
  }, 100);
}

function diagnostic(name, increment = 1) {
  diagnostics[name] = (diagnostics[name] || 0) + increment;
  reportDiagnostics();
}

function event(name) {
  diagnostics.lastEvent = name;
  reportDiagnostics();
}

function rowKey(node) {
  let key = nodeToKey.get(node);
  if (!key) {
    key = `meet-caption-${++rowIdCounter}`;
    nodeToKey.set(node, key);
  }
  return key;
}

function hashLine(speakerLabel, text) {
  return `${speakerLabel || ""}\n${text || ""}`;
}

function isSeen(speakerLabel, text) {
  const hash = hashLine(speakerLabel, text);
  const seenAt = seenHashes.get(hash);
  if (seenAt == null) return false;
  if (Date.now() - seenAt > SEEN_TTL_MS) {
    seenHashes.delete(hash);
    return false;
  }
  return true;
}

function markSeen(speakerLabel, text) {
  seenHashes.set(hashLine(speakerLabel, text), Date.now());
}

function pruneSeen() {
  const now = Date.now();
  for (const [hash, seenAt] of seenHashes) {
    if (now - seenAt > SEEN_TTL_MS) seenHashes.delete(hash);
  }
}

function isProfileImage(image) {
  if (!image || image.tagName !== "IMG") return false;
  const src = (image.getAttribute("src") || "").trim();
  return src.startsWith("http") || src.startsWith("data:");
}

function parseCaptionRow(row) {
  if (!row || typeof row.textContent !== "string") return null;

  const image = row.querySelector("img");
  if (image && isProfileImage(image)) {
    const speakerNode = image.nextElementSibling;
    const textNode = image.parentElement?.nextElementSibling;
    const text = (textNode?.textContent || "").replace(/\s+/g, " ").trim();
    if (text) {
      return {
        speakerLabel: (speakerNode?.textContent || "").replace(/\s+/g, " ").trim() || null,
        text,
      };
    }
  }

  const normalized = row.textContent.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const colon = normalized.indexOf(":");
  if (colon > 0 && colon < 60) {
    const speakerLabel = normalized.slice(0, colon).trim();
    const text = normalized.slice(colon + 1).trim();
    return text ? { speakerLabel, text } : null;
  }

  const first = row.firstElementChild;
  const firstText = first?.textContent?.replace(/\s+/g, " ").trim() || "";
  const rest = firstText ? normalized.replace(firstText, "").trim() : "";
  if (firstText && firstText.length < 80 && rest) return { speakerLabel: firstText, text: rest };
  return { speakerLabel: null, text: normalized };
}

function getCaptionRows(container) {
  const rows = [];
  const seen = new Set();
  for (const image of container.querySelectorAll("img")) {
    if (!isProfileImage(image)) continue;
    const textNode = image.parentElement?.nextElementSibling;
    if (!(textNode?.textContent || "").trim()) continue;
    const row = image.parentElement?.parentElement;
    if (!row || seen.has(row) || row.closest("button") || row.querySelector("button")) continue;
    seen.add(row);
    if (parseCaptionRow(row)) rows.push(row);
  }
  if (rows.length) return rows;

  for (const child of container.children || []) {
    if (parseCaptionRow(child)) rows.push(child);
    else for (const nested of child.children || []) if (parseCaptionRow(nested)) rows.push(nested);
  }
  if (!rows.length) {
    const semantic = container.querySelectorAll('[role="paragraph"], [aria-live], span, div');
    for (const element of semantic) {
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();
      const childText = Array.from(element.children || []).some((child) => (child.textContent || "").trim());
      if (text.length >= 2 && text.length <= 500 && !childText && !seen.has(element)) {
        seen.add(element);
        rows.push(element);
      }
    }
  }
  if (!rows.length && parseCaptionRow(container)) rows.push(container);
  if (rows.length) event("CAPTION_CANDIDATE_FOUND");
  diagnostic("captionCandidatesSeen", rows.length);
  return rows;
}

function findCaptionContainer() {
  const selectors = [
    '[role="region"][aria-label="Captions"]',
    '[role="region"][aria-label*="Captions" i]',
    '[aria-label="Captions"]',
  ];
  for (const selector of selectors) {
    const found = document.body?.querySelector(selector);
    if (found) {
      event("CAPTION_ROOT_FOUND");
      return found;
    }
  }
  event("CAPTION_ROOT_NOT_FOUND");
  return null;
}

function queueEntry(entry) {
  if (!entry?.text || isSeen(entry.speakerLabel, entry.text)) return;
  markSeen(entry.speakerLabel, entry.text);
  diagnostic("entriesCommitted");
  event("CAPTION_ENTRY_COMMITTED");
  pending.push({
    sequence: sequence++,
    speakerLabel: entry.speakerLabel,
    text: entry.text,
    capturedAt: new Date().toISOString(),
    provider: provider.id,
    providerMeetingId,
    observedAt: new Date().toISOString(),
    isFinal: true,
    source: "browser_captions",
  });
  transcriptEntries.push(pending.at(-1));
  updateLiveState({ transcriptCount: liveState.transcriptCount + 1, lastCaptionAt: new Date().toISOString() });
  if (pending.length >= MAX_BATCH) void flush();
}

async function flush() {
  if (!pending.length) return;
  const batch = pending;
  pending = [];
  try {
    const response = await chrome.runtime.sendMessage({ type: "capture:entries", entries: batch });
    if (response?.ok === false) pending = batch.concat(pending);
  } catch {
    pending = batch.concat(pending);
  }
}

function processCaptions() {
  if (!capturing || !captionContainer) return;
  const currentKeys = new Set();
  const now = Date.now();
  const rows = getCaptionRows(captionContainer);
  for (const row of rows) {
    const parsed = parseCaptionRow(row);
    if (!parsed) {
      event("CAPTION_TEXT_EMPTY");
      continue;
    }
    diagnostic("captionTextsSeen");
    event("CAPTION_TEXT_FOUND");
    const key = rowKey(row);
    currentKeys.add(key);
    const previous = pendingRows.get(key);
    if (!previous) {
      pendingRows.set(key, { ...parsed, lastUpdated: now, row });
      continue;
    }
    if (previous.text !== parsed.text || previous.speakerLabel !== parsed.speakerLabel) {
      previous.text = parsed.text;
      previous.speakerLabel = parsed.speakerLabel;
      previous.lastUpdated = now;
      previous.committedText = previous.committed ? previous.committedText : null;
    }
    previous.stable = now - previous.lastUpdated >= STABILITY_MS;
    if (previous.stable && (!previous.committed || previous.committedText !== previous.text)) {
      queueEntry(previous);
      previous.committed = true;
      previous.committedText = previous.text;
    }
  }
  for (const [key, row] of pendingRows) {
    if (!currentKeys.has(key)) {
      if (!row.committed) queueEntry(row);
      pendingRows.delete(key);
    }
  }
}

async function flushPendingRows() {
  for (const row of pendingRows.values()) queueEntry(row);
  pendingRows.clear();
  await flush();
}

function startObserving() {
  if (observer || !document.body) return;
  captionContainer = findCaptionContainer();
  diagnostics.observerActive = true;
  event("CAPTION_OBSERVER_STARTED");
  reportDiagnostics();
  if (captionContainer) diagnostic("captionCandidatesSeen", 0);
  observer = new MutationObserver(() => {
    if (!capturing) return;
    diagnostic("mutationsSeen");
    event("CAPTION_MUTATION_SEEN");
    if (!captionContainer || !document.contains(captionContainer)) captionContainer = findCaptionContainer();
    processCaptions();
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  rediscoverTimer = setInterval(() => {
    if (!capturing) return;
    pruneSeen();
    if (!captionContainer || !document.contains(captionContainer)) captionContainer = findCaptionContainer();
    processCaptions();
  }, REDISCOVER_MS);
  processCaptions();
}

async function stopObserving() {
  observer?.disconnect();
  observer = null;
  if (rediscoverTimer) clearInterval(rediscoverTimer);
  rediscoverTimer = null;
  captionContainer = null;
  diagnostics.observerActive = false;
  reportDiagnostics();
  await flushPendingRows();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "capture:set-state":
        capturing = message.capturing === true;
        updateLiveState({
          status: message.status || (capturing ? "capture_active" : "capture_paused"),
          sessionId: message.session?.sessionId ?? liveState.sessionId,
          meetingId: message.session?.meetingId ?? liveState.meetingId,
          startedAt: message.startedAt ?? liveState.startedAt,
          syncState: message.syncState || liveState.syncState,
          lastSafeError: message.lastSafeError ?? null,
        });
        if (capturing) startObserving();
        else await stopObserving();
        sendResponse({ ok: true, status: capturing ? "capture_active" : "capture_paused" });
        break;
      case "capture:start":
        capturing = true;
        updateLiveState({ status: "capture_active", startedAt: liveState.startedAt || new Date().toISOString() });
        sequence = 0;
        pending = [];
        startObserving();
        sendResponse({ ok: true, status: "capture_active" });
        break;
      case "capture:resume":
        capturing = true;
        updateLiveState({ status: "capture_active" });
        startObserving();
        sendResponse({ ok: true, status: "capture_active" });
        break;
      case "capture:pause":
        capturing = false;
        updateLiveState({ status: "capture_paused" });
        await stopObserving();
        sendResponse({ ok: true, status: "capture_paused" });
        break;
      case "capture:stop":
        capturing = false;
        updateLiveState({ status: "idle", sessionId: null, meetingId: null });
        await stopObserving();
        sendResponse({ ok: true, status: "capture_complete" });
        break;
      case "capture:status":
        sendResponse({ ok: true, status: capturing ? "capture_active" : "idle", ...liveState, transcriptCount: Math.max(liveState.transcriptCount, sequence) });
        break;
      case "capture:panel-open":
        mountPanel();
        sendResponse({ ok: true, provider: liveState.provider });
        break;
      default:
        sendResponse({ ok: false, error: "unknown" });
    }
  })();
  return true;
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountPanel, { once: true });
else mountPanel();
