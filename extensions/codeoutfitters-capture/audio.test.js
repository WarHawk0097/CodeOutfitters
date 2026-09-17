import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname);
const manifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8"));
const background = readFileSync(resolve(root, "background.js"), "utf8");
const offscreen = readFileSync(resolve(root, "offscreen.js"), "utf8");
const popup = readFileSync(resolve(root, "popup.js"), "utf8");
const content = readFileSync(resolve(root, "content.js"), "utf8");

describe("browser audio capture path", () => {
  it("declares the offscreen permission without an invalid manifest object", () => {
    expect(manifest.permissions).toEqual(expect.arrayContaining(["tabCapture", "offscreen"]));
    expect(manifest).not.toHaveProperty("offscreen");
    expect(manifest.host_permissions).toEqual(expect.arrayContaining(["https://meet.google.com/*"]));
    expect(manifest.optional_host_permissions).toEqual(
      expect.arrayContaining(["http://localhost:3005/*", "https://codeoutfitters.vercel.app/*"]),
    );
    expect(manifest.permissions).not.toContain("cookies");
  });

  it("creates the offscreen document at runtime", () => {
    expect(background).toContain("chrome.offscreen.createDocument");
    expect(background).toContain('url: "offscreen.html"');
    expect(background).toContain('reasons: ["USER_MEDIA"]');
  });

  it("requires an active Meet tab and explicit Start gesture", () => {
    expect(background).toContain("sendAudioControl");
    expect(background).toContain('acquisitionStrategy === "browser_audio"');
    expect(popup).toContain('acquisitionStrategy: "browser_captions"');
    expect(background).toContain('provider: "google_meet"');
    expect(background).toContain('acquisitionStrategy');
    expect(background).toContain('"browser_audio"');
  });

  it("keeps browser-caption capture independent from offscreen audio", () => {
    expect(content).toContain('type: "capture:entries"');
    expect(content).not.toContain("chrome.offscreen");
  });

  it("records short in-memory chunks and stops tracks", () => {
    expect(offscreen).toContain("MediaRecorder");
    expect(offscreen).toContain("recorder.start(5000)");
    expect(offscreen).toContain("event.data.arrayBuffer()");
    expect(offscreen).toContain("track.stop()");
    expect(offscreen).not.toContain("localStorage");
    expect(offscreen).not.toContain("chrome.storage");
  });
});
