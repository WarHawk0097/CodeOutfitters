import type { CaptureSource } from "./types";

// The transcript-source label shown in the meeting detail screen. Kept here so the
// wording lives next to the domain types and is testable without rendering a page.

export function transcriptSourceLabel(captureSource: CaptureSource | undefined): string {
  switch (captureSource) {
    case "browser_captions":
      return "CodeOutfitters Live Capture";
    case "browser_audio":
      return "CodeOutfitters Audio Capture";
    default:
      return "Google Meet transcript";
  }
}

export function captureStateSuffix(state: string | null | undefined): string {
  switch (state) {
    case "capture_active":
      return "Capture active";
    case "capture_paused":
      return "Capture paused";
    case "capture_complete":
      return "Capture complete";
    default:
      return "";
  }
}