import { describe, expect, it } from "vitest";
import { MockCalendarProvider } from "./calendar";
import { MockMeetingPlatformProvider } from "./meeting-platform";

describe("MockCalendarProvider", () => {
  it("defaults to NOT_CONFIGURED and returns fixture availability", async () => {
    const provider = new MockCalendarProvider();
    expect(provider.status).toBe("NOT_CONFIGURED");
    const slots = await provider.getAvailability("2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z");
    expect(slots.length).toBeGreaterThan(0);
  });
});

describe("MockMeetingPlatformProvider", () => {
  it("defaults to NOT_CONFIGURED and moves through the session lifecycle", async () => {
    const provider = new MockMeetingPlatformProvider();
    expect(provider.status).toBe("NOT_CONFIGURED");
    const session = await provider.createMeeting("Discovery call");
    expect(session.state).toBe("scheduled");
    const ended = await provider.endSession(session.meetingId);
    expect(ended.state).toBe("ended");
  });
});
