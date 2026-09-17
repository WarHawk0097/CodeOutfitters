import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname);
const html = readFileSync(resolve(root, "popup.html"), "utf8");
const source = readFileSync(resolve(root, "popup.js"), "utf8");

function createElement(id) {
  return {
    id,
    listeners: {},
    className: "",
    textContent: "",
    value: id === "space" ? "ptd-tzny-zuk" : "",
    disabled: false,
    hidden: false,
    addEventListener(type, listener) { this.listeners[type] = listener; },
  };
}

async function runPopup(runtimeResponses, permissionState = { granted: true }, captureOrigin = "http://localhost:3005", session = { accessToken: "opaque", expiresAt: new Date(Date.now() + 3600000).toISOString(), scope: "meeting_capture" }, authDiagnostic = null, authError = null, authFailure = {}, activeTabUrl = "https://meet.google.com/ptd-tzny-zuk") {
  const ids = ["state", "sign-in", "sign-out", "auth-status", "space", "start", "pause", "stop", "resume", "notice", "error", "count", "count-row", "meeting-meta"];
  const elements = Object.fromEntries(ids.map((id) => [id, createElement(id)]));
  const messages = [];
  const authResumeMessages = [];
  const permissionCalls = [];
  const document = { getElementById: (id) => elements[id] };
  const chrome = {
    tabs: { query: async (query) => query?.url
      ? [{ id: 51, url: `${captureOrigin}/dashboard` }]
      : [{ id: 41, url: activeTabUrl }] },
    runtime: {
      sendMessage: async (message) => {
        if (message?.type === "auth:resume") { authResumeMessages.push(message); return { ok: true, session: session ? { expiresAt: session.expiresAt, scope: session.scope, accountName: session.accountName, workspaceName: session.workspaceName } : null, diagnostic: authDiagnostic || (session ? null : "AUTH_STATUS_PENDING"), authError, authFailure }; }
        messages.push(message);
        const response = runtimeResponses[messages.length - 1];
        if (response instanceof Error) throw response;
        return response;
      },
    },
    permissions: {
      contains: async (query) => {
        permissionCalls.push({ type: "contains", query });
        if (permissionState.throws || permissionState.containsThrows) throw new Error("permission-check-failed");
        return permissionState.containsAfterRequest === undefined || permissionCalls.filter((call) => call.type === "contains").length === 1
          ? permissionState.granted
          : permissionState.containsAfterRequest;
      },
      request: async (query) => { permissionCalls.push({ type: "request", query }); if (permissionState.requestThrows) throw new Error("permission-request-failed"); return permissionState.requested ?? false; },
      ...(permissionState.addHostAccessRequest ? { addHostAccessRequest: async (request) => permissionCalls.push({ type: "addHostAccessRequest", request }) } : {}),
    },
  };
  const globalThis = { CodeOutfittersAuth: {
    readSession: async () => session,
    getSession: async () => session,
    signOut: async () => {},
  } };
  new Function("document", "chrome", "CAPTURE_API_ORIGIN", "globalThis", source)(document, chrome, captureOrigin, globalThis);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
  return { elements, messages, authResumeMessages, permissionCalls };
}

describe("Meeting Capture popup lifecycle", () => {
  it("loads the popup and keeps browser captions independent of tab audio", () => {
    expect(html).toContain('<button id="start"');
    expect(source).not.toContain("chrome.tabCapture.getMediaStreamId");
    expect(source).toContain('acquisitionStrategy: "browser_captions"');
  });

  it("queries background state on every popup instance and renders active capture", async () => {
    const status = { ok: true, state: "capture_active", active: true, entryCount: 3, session: { meetingId: "meeting-1" } };
    const first = await runPopup([status]);
    expect(first.messages[0]).toEqual({ type: "capture:status" });
    expect(first.authResumeMessages).toHaveLength(1);
    expect(first.elements.state.textContent).toBe("CAPTURING");
    expect(first.elements.start.disabled).toBe(true);
    expect(first.elements.pause.disabled).toBe(false);
    expect(first.elements.count.textContent).toBe("3");

    const reopened = await runPopup([status]);
    expect(reopened.elements.state.textContent).toBe("CAPTURING");
    expect(reopened.elements.start.disabled).toBe(true);
    expect(reopened.elements.stop.disabled).toBe(false);
    expect(reopened.elements.count.textContent).toBe("3");
  });

  it("starts captions without requesting an audio stream", async () => {
    const { elements, messages, permissionCalls } = await runPopup([
      { ok: true, state: "idle", active: false, entryCount: 0 },
      { ok: true, state: "capture_active", active: true, entryCount: 0, session: { meetingId: "meeting-1" } },
    ]);
    await elements.start.listeners.click();
    expect(messages[1]).toMatchObject({ type: "capture:start", providerSpaceId: "ptd-tzny-zuk", tabId: 41, acquisitionStrategy: "browser_captions" });
    expect(messages[1]).not.toHaveProperty("streamId");
    expect(permissionCalls).toEqual([]);
    expect(elements.state.textContent).toBe("CAPTURING");
  });

  it("shows the safe server validation code and never reports Capturing on a 422", async () => {
    const { elements } = await runPopup([
      { ok: true, state: "idle", active: false, entryCount: 0 },
      { ok: false, state: "idle", error: "CAPTURE_START_ARTIFACT_INVALID", serverCode: "CAPTURE_START_ARTIFACT_INVALID", authDiag: "CAPTURE_START_VALIDATION_FAILED" },
    ]);
    await elements.start.listeners.click();
    expect(elements.state.textContent).toBe("READY");
    expect(elements.error.textContent).toContain("CAPTURE_START_VALIDATION_FAILED:CAPTURE_START_ARTIFACT_INVALID");
  });

  it("surfaces a safe server code even when the background maps the response to 5xx", async () => {
    const { elements } = await runPopup([
      { ok: true, state: "idle", active: false, entryCount: 0 },
      { ok: false, state: "idle", error: "CAPTURE_START_TRANSCRIPT_INSERT_FAILED", serverCode: "CAPTURE_START_TRANSCRIPT_INSERT_FAILED", authDiag: "CAPTURE_START_5XX" },
    ]);
    await elements.start.listeners.click();
    expect(elements.error.textContent).toContain("CAPTURE_START_5XX:CAPTURE_START_TRANSCRIPT_INSERT_FAILED");
    expect(elements.error.textContent).not.toBe("START_RESPONSE_RECEIVED: Upload failed. Try again.");
  });

  it("starts without locating or injecting into a dashboard tab", async () => {
    const { elements, messages, permissionCalls } = await runPopup([
      { ok: true, state: "idle", active: false, entryCount: 0 },
      { ok: true, state: "starting", active: true, entryCount: 0 },
    ], { granted: false });
    await elements.start.listeners.click();
    expect(messages[1]).toMatchObject({ type: "capture:start" });
    expect(permissionCalls).toEqual([]);
  });

  it("normalizes the observed Google Meet code for browser-caption capture", async () => {
    const { elements } = await runPopup(
      [{ ok: true, state: "idle", active: false, entryCount: 0 }],
      { granted: true },
      "http://localhost:3005",
      undefined,
      null,
      null,
      {},
      "https://meet.google.com/urb-dvdq-xxj",
    );
    expect(elements.space.value).toBe("urb-dvdq-xxj");
  });

  it("exposes dedicated sign-in controls", () => {
    expect(html).toContain('id="sign-in"');
    expect(html).toContain('id="sign-out"');
    expect(source).toContain('type: "auth:sign-in"');
    expect(source).not.toContain("extensionAuth.getSession()");
    expect(source).not.toContain("extensionAuth.readSession()");
    expect(source).not.toContain("extensionAuth.signOut()");
    expect(source).not.toContain("ensureHostAccess()" );
  });

  it("delegates sign-in to the background and hydrates safe account/workspace identity from the shared session key", async () => {
    const session = { accessToken: "opaque", expiresAt: new Date(Date.now() + 3600000).toISOString(), scope: "meeting_capture", accountName: "T. Samuel", workspaceName: "Acme" };
    const { elements, messages } = await runPopup([
      { ok: true, state: "idle", active: false, entryCount: 0 },
      { ok: true, session: { expiresAt: session.expiresAt, scope: session.scope, accountName: session.accountName, workspaceName: session.workspaceName } },
    ], { granted: true }, "http://localhost:3005", session);
    await elements["sign-in"].listeners.click();
    expect(messages[1]).toEqual({ type: "auth:sign-in" });
    expect(elements["auth-status"].textContent).toBe("CONNECTED · T. Samuel · Acme");
    expect(elements["sign-in"].hidden).toBe(true);
    expect(elements["sign-out"].hidden).toBe(false);
  });

  it("forces an immediate background auth resume before reading popup capture state", async () => {
    const result = await runPopup([{ ok: true, state: "idle", active: false, entryCount: 0 }]);
    expect(result.authResumeMessages).toEqual([{ type: "auth:resume" }]);
    expect(result.messages[0]).toEqual({ type: "capture:status" });
    expect(source).not.toContain("setInterval");
  });

  it("keeps the auth-connected state authoritative when no Meet tab is open", async () => {
    const result = await runPopup(
      [{ ok: true, state: "idle", active: false, entryCount: 0 }],
      { granted: true },
      "http://localhost:3005",
      { accessToken: "opaque", expiresAt: new Date(Date.now() + 3600000).toISOString(), scope: "meeting_capture", accountName: "Tay Samuel", workspaceName: "CodeOutfitters QA Verification" },
      null,
      null,
      {},
      "https://calendar.google.com/",
    );
    expect(result.elements["auth-status"].textContent).toBe("CONNECTED · Tay Samuel · CodeOutfitters QA Verification");
    expect(result.elements.state.textContent).toBe("READY");
    expect(result.elements.error.textContent).toBe("Open a Google Meet tab to start capture.");
  });

  it("routes sign-out through the background worker", () => {
    expect(source).toContain('{ type: "auth:sign-out" }');
  });

  it("shows the latest safe auth stage and error while disconnected", async () => {
    const result = await runPopup([{ ok: true, state: "idle", active: false, entryCount: 0 }], { granted: true }, "http://localhost:3005", null, "AUTH_EXCHANGE_FAILED", "EXCHANGE_SESSION_CREATE_FAILED", { httpStatus: 503, serverCode: "EXCHANGE_SESSION_CREATE_FAILED" });
    expect(result.elements.error.textContent).toBe("AUTH_STAGE=AUTH_EXCHANGE_FAILED AUTH_ERROR=EXCHANGE_SESSION_CREATE_FAILED AUTH_HTTP_STATUS=503 AUTH_SERVER_CODE=EXCHANGE_SESSION_CREATE_FAILED");
    expect(source).toContain("AUTH_HTTP_STATUS=");
    expect(source).toContain("AUTH_SERVER_CODE=");
  });

  it("shows CONNECTED state after browser restart with valid stored session", async () => {
    const session = { accessToken: "opaque", expiresAt: new Date(Date.now() + 3600000).toISOString(), scope: "meeting_capture", accountName: "Tay Samuel", workspaceName: "CodeOutfitters QA Verification" };
    const result = await runPopup([{ ok: true, state: "idle", active: false, entryCount: 0 }], { granted: true }, "http://localhost:3005", session, null, null, {}, "https://calendar.google.com/");
    expect(result.elements["auth-status"].textContent).toBe("CONNECTED · Tay Samuel · CodeOutfitters QA Verification");
    expect(result.elements.state.textContent).toBe("READY");
  });

  it("shows auth diagnostics after browser restart with expired session", async () => {
    const result = await runPopup([{ ok: true, state: "idle", active: false, entryCount: 0 }], { granted: true }, "http://localhost:3005", null, "AUTH_EXCHANGE_FAILED", "SESSION_EXPIRED", { httpStatus: 503, serverCode: "EXCHANGE_SESSION_CREATE_FAILED" }, "https://calendar.google.com/");
    expect(result.elements.error.textContent).toBe("AUTH_STAGE=AUTH_EXCHANGE_FAILED AUTH_ERROR=SESSION_EXPIRED AUTH_HTTP_STATUS=503 AUTH_SERVER_CODE=EXCHANGE_SESSION_CREATE_FAILED");
    expect(result.elements.state.textContent).toBe("NOT CONNECTED");
  });

  it("does not show generic EXTENSION_AUTH_FAILED when safe diagnostics available", async () => {
    const result = await runPopup([{ ok: true, state: "idle", active: false, entryCount: 0 }], { granted: true }, "http://localhost:3005", null, "AUTH_EXCHANGE_FAILED", "EXCHANGE_FAILED", { httpStatus: 409, serverCode: "EXCHANGE_ALREADY_CONSUMED" }, "https://calendar.google.com/");
    expect(result.elements.error.textContent).not.toContain("EXTENSION_AUTH_FAILED");
    expect(result.elements.error.textContent).toContain("AUTH_STAGE=AUTH_EXCHANGE_FAILED");
    expect(result.elements.error.textContent).toContain("AUTH_ERROR=EXCHANGE_FAILED");
  });

  it("preserves paused state and rejects duplicate start through background response", async () => {
    const paused = await runPopup([{ ok: true, state: "capture_paused", active: true, entryCount: 4 }]);
    expect(paused.elements.state.textContent).toBe("CAPTURE PAUSED");
    expect(paused.elements.resume.hidden).toBe(false);
    expect(paused.elements.start.disabled).toBe(true);

    const duplicate = await runPopup([
      { ok: true, state: "capture_active", active: true, entryCount: 4 },
      { ok: false, error: "CAPTURE_ALREADY_ACTIVE", state: "capture_active", entryCount: 4 },
    ]);
    await duplicate.elements.start.listeners.click();
    expect(duplicate.elements.state.textContent).toBe("CAPTURING");
    expect(duplicate.elements.count.textContent).toBe("4");
  });
});
