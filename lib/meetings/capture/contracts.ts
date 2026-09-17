import type { CaptureSource } from "./types";

export const MEETING_PROVIDER_IDS = [
  "google_meet",
  "microsoft_teams",
  "zoom",
  "webex",
  "generic_browser",
] as const;

export type MeetingProviderId = (typeof MEETING_PROVIDER_IDS)[number];
export type NormalizedCaptionEvent = {
  provider: MeetingProviderId;
  providerMeetingId: string;
  speaker: string | null;
  text: string;
  observedAt: string;
  isFinal: boolean;
  source: Extract<CaptureSource, "browser_captions" | "provider_transcript">;
};

export type ExtensionSession = {
  accessToken: string;
  expiresAt: string;
  scope: "meeting_capture";
};

export function isMeetingProviderId(value: unknown): value is MeetingProviderId {
  return typeof value === "string" && (MEETING_PROVIDER_IDS as readonly string[]).includes(value);
}

export function validateNormalizedCaptionEvent(value: unknown): NormalizedCaptionEvent | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (!isMeetingProviderId(item.provider)) return null;
  if (typeof item.providerMeetingId !== "string" || item.providerMeetingId.trim().length === 0) return null;
  if (typeof item.text !== "string" || item.text.trim().length === 0) return null;
  if (typeof item.observedAt !== "string" || !Number.isFinite(Date.parse(item.observedAt))) return null;
  if (typeof item.isFinal !== "boolean") return null;
  if (item.source !== "browser_captions" && item.source !== "provider_transcript") return null;
  if (item.speaker !== null && typeof item.speaker !== "string") return null;
  return {
    provider: item.provider,
    providerMeetingId: item.providerMeetingId.trim(),
    speaker: item.speaker === null ? null : item.speaker.trim() || null,
    text: item.text.trim(),
    observedAt: item.observedAt,
    isFinal: item.isFinal,
    source: item.source,
  };
}
