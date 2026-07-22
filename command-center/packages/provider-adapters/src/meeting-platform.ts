// MeetingPlatformProvider — work/PROVIDER-ADAPTER-PLAN.md row 3
// Shape: createMeeting, getJoinUrl, session lifecycle. Mock strategy: fixture-based fake meeting session.
import type { ProviderStatus } from "./types";

export type MeetingSessionState = "scheduled" | "live" | "ended";

export interface MeetingSession {
  meetingId: string;
  state: MeetingSessionState;
}

export interface MeetingPlatformProvider {
  status: ProviderStatus;
  createMeeting(title: string): Promise<MeetingSession>;
  getJoinUrl(meetingId: string): Promise<string>;
  endSession(meetingId: string): Promise<MeetingSession>;
}

export class MockMeetingPlatformProvider implements MeetingPlatformProvider {
  status: ProviderStatus = "NOT_CONFIGURED";

  async createMeeting(_title: string): Promise<MeetingSession> {
    return { meetingId: "meeting-mock-001", state: "scheduled" };
  }

  async getJoinUrl(meetingId: string): Promise<string> {
    return `https://mock.meeting.test/join/${meetingId}`;
  }

  async endSession(meetingId: string): Promise<MeetingSession> {
    return { meetingId, state: "ended" };
  }
}
