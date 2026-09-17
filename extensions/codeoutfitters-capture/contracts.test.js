import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(__dirname, "contracts.js"), "utf8");
const context = {};
new Function("globalThis", source)(context);

describe("extension capture contracts", () => {
  it("normalizes the canonical providerMeetingId event", () => {
    expect(context.CodeOutfittersContracts.normalizeCaptionEvent({
      provider: "google_meet", providerMeetingId: "abc-defg-hij", speaker: "A",
      text: " Hello ", observedAt: "2026-08-23T00:00:00.000Z", isFinal: true, source: "browser_captions",
    })).toMatchObject({ providerMeetingId: "abc-defg-hij", text: "Hello" });
  });

  it("does not accept the stale meetingId field", () => {
    expect(context.CodeOutfittersContracts.normalizeCaptionEvent({
      provider: "google_meet", meetingId: "abc-defg-hij", text: "Hello",
      observedAt: new Date().toISOString(), isFinal: true, source: "browser_captions",
    })).toBeNull();
  });
});
