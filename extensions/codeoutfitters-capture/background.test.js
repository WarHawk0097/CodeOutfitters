import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Script } from "node:vm";

const source = readFileSync(resolve(__dirname, "background.js"), "utf8");
const manifest = readFileSync(resolve(__dirname, "manifest.json"), "utf8");

describe("extension auth ownership", () => {
  it("parses as a valid MV3 service worker script", () => {
    expect(() => new Script(source)).not.toThrow();
  });

  it("keeps sign-in and pending-auth recovery in the MV3 service worker", () => {
    expect(source).toContain("CodeOutfittersAuth.resumePendingAuth");
    expect(source).toContain('case "auth:sign-in"');
    expect(source).toContain('case "auth:resume"');
    expect(source).toContain('case "auth:status"');
    expect(source).toContain("CodeOutfittersAuth.signIn()");
    expect(source).toContain("sendResponse({ ok: true, session");
    expect(source).toContain("chrome.alarms.onAlarm.addListener");
    expect(source).toContain("AUTH_PENDING_CLEARED");
  });

  it("does not send the opaque access token through runtime diagnostics", () => {
    expect(source).not.toContain("accessToken: session.accessToken");
    expect(source).not.toContain("console.log(session");
  });

  it("registers the message and alarm listeners synchronously at worker startup", () => {
    expect(source.indexOf("chrome.runtime.onMessage.addListener")).toBeGreaterThan(-1);
    expect(source.indexOf("chrome.alarms.onAlarm.addListener")).toBeGreaterThan(-1);
    expect(manifest).toContain('"background": {\n    "service_worker": "background.js"');
  });

  it("keeps asynchronous popup auth responses alive until the worker replies", () => {
    expect(source).toMatch(/chrome\.runtime\.onMessage\.addListener\([\s\S]*?\n\s*return true;/);
  });
});
