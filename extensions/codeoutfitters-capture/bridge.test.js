import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname);
const manifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8"));
const background = readFileSync(resolve(root, "background.js"), "utf8");
const auth = readFileSync(resolve(root, "auth.js"), "utf8");

describe("Meeting Capture extension authentication boundary", () => {
  it("uses dedicated browser auth and does not inject a dashboard bridge", () => {
    expect(manifest.permissions).toEqual(expect.arrayContaining(["identity", "storage"]));
    expect(manifest.content_scripts.flatMap((entry) => entry.js)).not.toContain("codeoutfitters-bridge.js");
    expect(background).toContain("CodeOutfittersAuth.getSession");
    expect(background).toContain("createIndexedDbCaptureStore");
    expect(background).toContain("async function requestCaptureToken");
    expect(background).toContain("const session = await CodeOutfittersAuth.getSession()");
    expect(background).toContain('status: "starting"');
    expect(background).toContain('localCapture.state = "capture_active"');
    expect(auth).toContain("chrome.identity.launchWebAuthFlow");
    expect(auth).not.toContain("chrome.cookies");
  });

  it("keeps API origins narrow and never requests broad or Supabase access", () => {
    const hosts = [...(manifest.host_permissions || []), ...(manifest.optional_host_permissions || [])];
    expect(hosts).not.toContain("<all_urls>");
    expect(hosts.some((host) => host.includes("supabase.co"))).toBe(false);
    expect(manifest.host_permissions).not.toContain("http://localhost:3005/*");
    expect(manifest.optional_host_permissions).toContain("http://localhost:3005/*");
  });

  it("keeps old bridge files outside the runtime manifest during migration", () => {
    expect(readFileSync(resolve(root, "codeoutfitters-bridge.js"), "utf8")).toContain("capture-auth:ping");
    expect(manifest.content_scripts.some((entry) => entry.js.includes("codeoutfitters-bridge.js"))).toBe(false);
  });
});
