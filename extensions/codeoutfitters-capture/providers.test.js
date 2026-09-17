import { describe, expect, it } from "vitest";
import "./providers.js";

const { detectProvider, normalizedCaptionEvent, PROVIDER_IDS } = globalThis.CodeOutfittersProviders;

describe("provider-neutral capture adapters", () => {
  it.each([
    ["https://meet.google.com/abc-defg-hij", PROVIDER_IDS.GOOGLE_MEET],
    ["https://teams.microsoft.com/l/meetup-join/x", PROVIDER_IDS.MICROSOFT_TEAMS],
    ["https://zoom.us/wc/123/join", PROVIDER_IDS.ZOOM],
    ["https://company.webex.com/meet/alex", PROVIDER_IDS.WEBEX],
    ["https://example.test/meeting", PROVIDER_IDS.GENERIC_BROWSER],
  ])("detects %s as %s", (url, expected) => expect(detectProvider(url).id).toBe(expected));

  it("normalizes captions without inventing speaker identity", () => {
    expect(normalizedCaptionEvent("zoom", "room-1", { text: "Hello" })).toMatchObject({
      provider: "zoom", providerMeetingId: "room-1", speaker: null, text: "Hello", isFinal: false, source: "browser_captions",
    });
  });
});
