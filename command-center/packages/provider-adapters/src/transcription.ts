// TranscriptionProvider — work/PROVIDER-ADAPTER-PLAN.md row 4
// Shape: startSession(consent: boolean), streaming transcript events (segments, speaker, timestamps, confidence).
// Mock strategy: canned transcript fixture; consent-gate enforced client-side regardless of mock/real.
// Constraint (PROVIDER-ADAPTER-PLAN.md mandatory constraints): consent enforcement (STATE_MEETING_SESSION)
// applies identically whether mock or real — adapter refuses to start without consent.
import type { ProviderStatus } from "./types";

export interface TranscriptEvent {
  segmentId: string;
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export type TranscriptionProviderError = "delayed" | "reconnecting" | "failed";

export interface TranscriptionProvider {
  status: ProviderStatus;
  startSession(meetingId: string, consent: boolean): Promise<TranscriptEvent[] | { error: TranscriptionProviderError }>;
}

const FIXTURE_TRANSCRIPT: TranscriptEvent[] = [
  { segmentId: "seg-mock-001", speaker: "Rep", text: "Thanks for joining today.", startMs: 0, endMs: 2500, confidence: 0.97 },
  { segmentId: "seg-mock-002", speaker: "Client", text: "Happy to be here.", startMs: 2600, endMs: 4200, confidence: 0.94 },
];

export class MockTranscriptionProvider implements TranscriptionProvider {
  status: ProviderStatus = "NOT_CONFIGURED";

  async startSession(
    meetingId: string,
    consent: boolean,
  ): Promise<TranscriptEvent[] | { error: TranscriptionProviderError }> {
    if (!consent) {
      return { error: "failed" };
    }
    if (meetingId === "meeting-provider-unavailable") {
      return { error: "reconnecting" };
    }
    return FIXTURE_TRANSCRIPT;
  }
}
