import { describe, expect, it } from "vitest";
import { validateNormalizedCaptionEvent } from "./contracts";

describe("capture contracts", () => {
  it("accepts the canonical normalized caption event", () => {
    expect(validateNormalizedCaptionEvent({
      provider: "google_meet",
      providerMeetingId: "abc-defg-hij",
      speaker: "Speaker 1",
      text: "Hello",
      observedAt: "2026-08-23T00:00:00.000Z",
      isFinal: true,
      source: "browser_captions",
    })).toMatchObject({ providerMeetingId: "abc-defg-hij", text: "Hello" });
  });

  it("rejects stale identity fields and unsupported providers", () => {
    expect(validateNormalizedCaptionEvent({ meetingId: "abc-defg-hij", text: "Hello" })).toBeNull();
    expect(validateNormalizedCaptionEvent({ provider: "supabase", providerMeetingId: "x", text: "Hello", observedAt: new Date().toISOString(), isFinal: true, source: "browser_captions" })).toBeNull();
  });
});
