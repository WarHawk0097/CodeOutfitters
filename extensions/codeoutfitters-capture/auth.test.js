import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = readFileSync(resolve(__dirname, "auth.js"), "utf8");

function loadAuth({ callback, launchError, origin = "https://codeoutfitters.vercel.app", onTabCreate, initialStorage = {}, sessionResponse, failSessionWrite = false, dropSessionReadback = false } = {}) {
  const storage = { ...initialStorage };
  const requests = [];
  const tabs = [];
  const context = {
    CAPTURE_API_ORIGIN: origin,
    crypto: webcrypto,
    TextEncoder,
    URL,
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (origin.startsWith("http://") && url.endsWith("/request")) return { ok: true, status: 200, json: async () => ({ requestId: "opaque-request", expiresAt: new Date(Date.now() + 180000).toISOString() }) };
      if (origin.startsWith("http://") && url.includes("/status?")) return { ok: true, status: 200, json: async () => ({ status: "authorized" }) };
      return { ok: true, status: 200, json: async () => (sessionResponse ?? { accessToken: "opaque-session", expiresAt: new Date(Date.now() + 3600000).toISOString(), scope: "meeting_capture" }) };
    },
    setTimeout: (callback) => { callback(); return 1; },
    chrome: {
      identity: {
        getRedirectURL: () => "https://extension-id.chromiumapp.org/extension-auth",
        launchWebAuthFlow: async ({ url }) => {
          if (launchError) throw new Error(launchError);
          const parsed = new URL(url);
          const returned = new URL(callback ?? "https://extension-id.chromiumapp.org/extension-auth");
          if (!callback) returned.searchParams.set("state", parsed.searchParams.get("state"));
          if (!returned.searchParams.get("code")) returned.searchParams.set("code", "one-time-code");
          return returned.toString();
        },
      },
      tabs: {
        create: async (input) => { const tab = { id: 73, ...input }; tabs.push(tab); await onTabCreate?.(tab, storage); return tab; },
        remove: async (id) => { tabs.push({ removed: id }); },
      },
      storage: { local: {
        get: async (key) => Array.isArray(key)
          ? Object.fromEntries(key.map((item) => [item, storage[item]]))
          : ({ [key]: dropSessionReadback && key === "codeoutfitters.extensionSession" ? undefined : storage[key] }),
        set: async (value) => { if (failSessionWrite && Object.hasOwn(value, "codeoutfitters.extensionSession")) throw new Error("storage-write-failed"); Object.assign(storage, value); },
        remove: async (key) => { const keys = Array.isArray(key) ? key : [key]; keys.forEach((k) => { delete storage[k]; }); },
      } },
    },
    globalThis: null,
  };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return { auth: context.CodeOutfittersAuth, storage, requests, tabs };
}

describe("extension auth", () => {
  it("uses browser authorization and never dashboard injection or cookie scraping", () => {
    expect(source).toContain("chrome.identity.launchWebAuthFlow");
    expect(source).toContain("code_challenge");
    expect(source).toContain("verifier");
    expect(source).toContain("chrome.storage.local");
    expect(source).not.toContain("chrome.cookies");
    expect(source).not.toContain("credentials: \"include\"");
  });

  it("scopes exchanged sessions to meeting capture", () => {
    expect(source).toContain('body.scope !== "meeting_capture"');
    expect(source).toContain('EXTENSION_AUTH_PATH}/token');
    expect(source).toContain('EXTENSION_AUTH_PATH}/revoke');
  });

  it("exposes safe stage diagnostics without credential material", () => {
    for (const stage of [
      "EXT_AUTH_BEGIN", "EXT_AUTH_AUTHORIZE_URL_BUILT", "EXT_AUTH_PAGE_OPEN_FAILED",
      "EXT_AUTH_PAGE_HTTP_ERROR", "EXT_AUTH_CALLBACK_NOT_REACHED", "EXT_AUTH_CALLBACK_INVALID",
      "EXT_AUTH_STATE_MISMATCH", "EXT_AUTH_CODE_MISSING", "EXT_AUTH_CODE_EXCHANGE_FAILED",
      "EXT_AUTH_SESSION_INVALID", "EXT_AUTH_SUCCESS",
    ]) expect(source).toContain(stage);
    expect(source).not.toContain("console.log(code");
    expect(source).not.toContain("console.log(verifier");
    expect(source).not.toContain("console.log(accessToken");
    for (const stage of ["AUTH_PENDING_FOUND", "AUTH_STATUS_REQUEST", "AUTH_STATUS_PENDING", "AUTH_STATUS_AUTHORIZED", "AUTH_EXCHANGE_BEGIN", "AUTH_EXCHANGE_200", "AUTH_SESSION_STORED", "AUTH_PENDING_CLEARED", "AUTH_CONNECTED", "AUTH_EXCHANGE_FAILED"]) expect(source).toContain(stage);
  });

  it("uses the browser redirect URI as the PKCE binding", () => {
    expect(source).toContain('chrome.identity.getRedirectURL("extension-auth")');
    expect(source).toContain('redirectUri: callbackUrl');
    expect(source).toContain('returned.origin !== expected.origin');
  });

  it("completes a callback and stores only the scoped opaque session", async () => {
    const { auth, storage, requests } = loadAuth();
    const session = await auth.signIn();
    expect(session.scope).toBe("meeting_capture");
    expect(storage[auth.EXTENSION_SESSION_KEY].accessToken).toBe("opaque-session");
    expect(requests[0].options.body).toContain("one-time-code");
    expect(requests[0].options.body).toContain("redirectUri");
  });

  it("rejects callback state mismatch without exchanging a code", async () => {
    const { auth, requests } = loadAuth({ callback: "https://extension-id.chromiumapp.org/extension-auth?state=wrong" });
    await expect(auth.signIn()).rejects.toThrow("EXT_AUTH_STATE_MISMATCH");
    expect(requests).toHaveLength(0);
  });

  it("maps browser page failures to a safe stage and local route", async () => {
    const { auth } = loadAuth({ launchError: "Authorization page could not be loaded." });
    await expect(auth.signIn()).rejects.toThrow("EXT_AUTH_PAGE_OPEN_FAILED:origin=https://codeoutfitters.vercel.app;path=/api/extension/auth/authorize");
  });

  it("uses a normal localhost tab and never puts the verifier in its URL", async () => {
    const opened = [];
    const { auth, requests } = loadAuth();
    const originalTabs = globalThis.__unused;
    void originalTabs;
    expect(source).toContain('origin.protocol === "http:"');
    expect(source).toContain('chrome.tabs.create({ url: authPageUrl.toString() })');
    expect(source).toContain('authEndpoint("request")');
    expect(source).toContain('authEndpoint("status")');
    expect(source).toContain('authEndpoint("exchange")');
    expect(source).not.toContain('authPageUrl.searchParams.set("verifier"');
    void opened;
    void auth;
    void requests;
  });

  it("keeps HTTPS production on launchWebAuthFlow", () => {
    expect(source).toContain('new URL(CAPTURE_API_ORIGIN).protocol === "https:"');
    expect(source).toContain('chrome.identity.launchWebAuthFlow');
  });

  it("completes localhost authorization through a normal browser tab and polling", async () => {
    const { auth, requests, tabs } = loadAuth({ origin: "http://localhost:3005" });
    const session = await auth.signIn();
    expect(session.scope).toBe("meeting_capture");
    const pageTab = tabs.find((tab) => tab.url);
    expect(new URL(pageTab.url).pathname).toBe("/extension-auth");
    expect(pageTab.url).not.toContain("verifier");
    expect(requests.some((request) => request.url.endsWith("/status?requestId=opaque-request"))).toBe(true);
    expect(tabs).toContainEqual({ removed: 73 });
  });

  it("persists the pending verifier before opening the localhost authorization tab and clears it after exchange", async () => {
    let pendingAtTabOpen;
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", onTabCreate: async (_tab, currentStorage) => {
      pendingAtTabOpen = structuredClone(currentStorage["codeoutfitters.pendingExtensionAuth"]);
    } });
    await auth.signIn();
    expect(pendingAtTabOpen).toMatchObject({ requestId: "opaque-request", state: expect.any(String), verifier: expect.any(String), challenge: expect.any(String) });
    const digest = new Uint8Array(await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(pendingAtTabOpen.verifier)));
    const expectedChallenge = Buffer.from(digest).toString("base64url");
    expect(pendingAtTabOpen.challenge).toBe(expectedChallenge);
    expect(storage["codeoutfitters.pendingExtensionAuth"]).toBeUndefined();
  });

  it("saves a session that can be read back with the scoped safe schema", async () => {
    const { auth, storage } = loadAuth();
    const session = await auth.signIn();
    const saved = storage[auth.EXTENSION_SESSION_KEY];
    expect(saved).toMatchObject({ accessToken: "opaque-session", expiresAt: expect.any(String), scope: "meeting_capture" });
    expect(session.accountName).toBeUndefined();
    expect(saved).not.toHaveProperty("verifier");
  });

  it("resumes a pending localhost transaction after service-worker restart and removes the short-lived verifier", async () => {
    const { auth, storage } = loadAuth({
      origin: "http://localhost:3005",
      initialStorage: {
        "codeoutfitters.pendingExtensionAuth": {
          requestId: "opaque-request", state: "state", verifier: "verifier", challenge: "challenge",
          expiresAt: new Date(Date.now() + 180000).toISOString(), authTabId: null,
        },
      },
    });
    const session = await auth.resumePendingAuth();
    expect(session.scope).toBe("meeting_capture");
    expect(storage["codeoutfitters.pendingExtensionAuth"]).toBeUndefined();
    expect(storage[auth.EXTENSION_SESSION_KEY]).not.toHaveProperty("verifier");
  });

  it("rejects an expired stored session instead of hydrating it", async () => {
    const { auth } = loadAuth({ initialStorage: { "codeoutfitters.extensionSession": { accessToken: "opaque", expiresAt: new Date(Date.now() - 1000).toISOString(), scope: "meeting_capture" } } });
    await expect(auth.readSession()).resolves.toBeNull();
  });

  it("persists only the latest allowlisted diagnostic stage and never credential material", async () => {
    const { auth, storage } = loadAuth();
    await auth.setAuthDiagnostic("AUTH_STATUS_AUTHORIZED");
    expect(storage[auth.EXTENSION_AUTH_DIAGNOSTIC_KEY]).toBe("AUTH_STATUS_AUTHORIZED");
    await expect(auth.setAuthDiagnostic("verifier-secret")).resolves.toBeUndefined();
    expect(storage[auth.EXTENSION_AUTH_DIAGNOSTIC_KEY]).toBe("AUTH_STATUS_AUTHORIZED");
  });

  it("clears pending auth only after exchange, session storage, and readback", async () => {
    const order = [];
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", onTabCreate: async () => order.push("pending-persisted") });
    const originalSet = auth.setAuthDiagnostic;
    auth.setAuthDiagnostic = async (stage) => { order.push(stage); return originalSet(stage); };
    await auth.signIn();
    expect(storage[auth.EXTENSION_SESSION_KEY]).toMatchObject({ scope: "meeting_capture" });
    expect(storage[auth.EXTENSION_PENDING_AUTH_KEY]).toBeUndefined();
    expect(source.indexOf("const session = await saveSession(body)")).toBeLessThan(source.indexOf("await clearPendingAuth();", source.indexOf("const session = await saveSession(body)")));
    expect(source.slice(source.indexOf("} catch (error) {", source.indexOf("async function completePendingLocalAuth")), source.indexOf("} finally {", source.indexOf("async function completePendingLocalAuth")))).not.toContain("clearPendingAuth");
  });

  it("retains resumable pending auth when session storage fails", async () => {
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", failSessionWrite: true, initialStorage: { "codeoutfitters.pendingExtensionAuth": { requestId: "opaque-request", state: "state", verifier: "verifier", challenge: "challenge", expiresAt: new Date(Date.now() + 180000).toISOString(), authTabId: null } } });
    await expect(auth.resumePendingAuth()).rejects.toThrow("EXT_AUTH_SESSION_INVALID");
    expect(storage[auth.EXTENSION_PENDING_AUTH_KEY]).toMatchObject({ requestId: "opaque-request" });
    expect(storage[auth.EXTENSION_AUTH_DIAGNOSTIC_KEY]).toBe("AUTH_EXCHANGE_FAILED");
    expect(storage["codeoutfitters.authError"]).toBe("SESSION_WRITE_FAILED");
  });

  it("retains pending auth and reports readback failure", async () => {
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", dropSessionReadback: true, initialStorage: { "codeoutfitters.pendingExtensionAuth": { requestId: "opaque-request", state: "state", verifier: "verifier", challenge: "challenge", expiresAt: new Date(Date.now() + 180000).toISOString(), authTabId: null } } });
    await expect(auth.resumePendingAuth()).rejects.toThrow("EXT_AUTH_SESSION_INVALID");
    expect(storage[auth.EXTENSION_PENDING_AUTH_KEY]).toMatchObject({ requestId: "opaque-request" });
    expect(storage["codeoutfitters.authError"]).toBe("SESSION_READBACK_MISSING");
  });

  it("rejects malformed exchange sessions without clearing pending auth", async () => {
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", sessionResponse: { token: "wrong-field", expires_at: "2026-08-24T00:00:00.000Z", scope: "meeting_capture" }, initialStorage: { "codeoutfitters.pendingExtensionAuth": { requestId: "opaque-request", state: "state", verifier: "verifier", challenge: "challenge", expiresAt: new Date(Date.now() + 180000).toISOString(), authTabId: null } } });
    await expect(auth.resumePendingAuth()).rejects.toThrow("EXT_AUTH_SESSION_INVALID");
    expect(storage[auth.EXTENSION_PENDING_AUTH_KEY]).toMatchObject({ requestId: "opaque-request" });
    expect(storage["codeoutfitters.authError"]).toBe("EXCHANGE_RESPONSE_INVALID");
  });

  it("normalizes numeric expiry in seconds and milliseconds without accepting an expired session", async () => {
    const seconds = Math.floor(Date.now() / 1000) + 3600;
    const millis = Date.now() + 3600000;
    for (const expiresAt of [seconds, millis]) {
      const { auth, storage } = loadAuth({ sessionResponse: { accessToken: "opaque-session", expiresAt, scope: "meeting_capture" } });
      await auth.signIn();
      expect(Date.parse(storage[auth.EXTENSION_SESSION_KEY].expiresAt)).toBeGreaterThan(Date.now());
    }
  });

  it("persists the exchange HTTP status and safe server code without sensitive data", async () => {
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", sessionResponse: { token: "wrong-field", expires_at: "2026-08-24T00:00:00.000Z", scope: "meeting_capture" }, initialStorage: { "codeoutfitters.pendingExtensionAuth": { requestId: "opaque-request", state: "state", verifier: "verifier", challenge: "challenge", expiresAt: new Date(Date.now() + 180000).toISOString(), authTabId: null } } });
    await expect(auth.resumePendingAuth()).rejects.toThrow("EXT_AUTH_SESSION_INVALID");
    expect(storage[auth.EXTENSION_AUTH_ERROR_KEY]).toBe("EXCHANGE_RESPONSE_INVALID");
    expect(storage[auth.EXTENSION_AUTH_HTTP_STATUS_KEY]).toBeNull();
    expect(storage[auth.EXTENSION_AUTH_SERVER_CODE_KEY]).toBe("EXCHANGE_RESPONSE_INVALID");
    expect(JSON.stringify({ error: storage[auth.EXTENSION_AUTH_ERROR_KEY], httpStatus: storage[auth.EXTENSION_AUTH_HTTP_STATUS_KEY], serverCode: storage[auth.EXTENSION_AUTH_SERVER_CODE_KEY] })).not.toContain("verifier");
  });

  it("readSession returns null for expired session and clears invalid session on browser restart", async () => {
    const { auth } = loadAuth({ initialStorage: { "codeoutfitters.extensionSession": { accessToken: "opaque", expiresAt: new Date(Date.now() - 1000).toISOString(), scope: "meeting_capture" } } });
    await expect(auth.readSession()).resolves.toBeNull();
  });

  it("resumePendingAuth clears expired pending auth on browser restart", async () => {
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", initialStorage: { "codeoutfitters.pendingExtensionAuth": { requestId: "opaque-request", state: "state", verifier: "verifier", challenge: "challenge", expiresAt: new Date(Date.now() - 1000).toISOString(), authTabId: null } } });
    await expect(auth.resumePendingAuth()).resolves.toBeNull();
    expect(storage["codeoutfitters.pendingExtensionAuth"]).toBeUndefined();
  });

  it("fresh signIn clears stale auth diagnostics before starting new flow", async () => {
    const { auth, storage } = loadAuth({ origin: "http://localhost:3005", initialStorage: { "codeoutfitters.authDiagnostic": "AUTH_EXCHANGE_FAILED", "codeoutfitters.authError": "EXCHANGE_SESSION_CREATE_FAILED", "codeoutfitters.authHttpStatus": 503, "codeoutfitters.authServerCode": "EXCHANGE_SESSION_CREATE_FAILED" } });
    await auth.signIn();
    expect(storage[auth.EXTENSION_AUTH_DIAGNOSTIC_KEY]).not.toBe("AUTH_EXCHANGE_FAILED");
    expect(storage[auth.EXTENSION_AUTH_ERROR_KEY]).not.toBe("EXCHANGE_SESSION_CREATE_FAILED");
  });

  it("readAuthDiagnostic returns only safe stages after browser restart", async () => {
    const { auth, storage } = loadAuth({ initialStorage: { "codeoutfitters.authDiagnostic": "VERIFIER_SECRET" } });
    const diag = await auth.readAuthDiagnostic();
    expect(diag).toBeNull();
  });

  it("readAuthError returns only safe errors after browser restart", async () => {
    const { auth, storage } = loadAuth({ initialStorage: { "codeoutfitters.authError": "SECRET_VERIFIER" } });
    const err = await auth.readAuthError();
    expect(err).toBeNull();
  });

  it("readAuthFailure returns sanitized serverCode and passes through integer httpStatus after browser restart", async () => {
    const { auth } = loadAuth({ initialStorage: { "codeoutfitters.authHttpStatus": 401, "codeoutfitters.authServerCode": "INVALID_CODE" } });
    const failure = await auth.readAuthFailure();
    expect(failure.httpStatus).toBe(401);
    expect(failure.serverCode).toBeNull();
  });
});
