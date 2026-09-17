import { describe, it, expect } from "vitest";
import { captureStateSuffix, transcriptSourceLabel } from "./label";

describe("transcript source label", () => {
  it("labels browser captions as CodeOutfitters Live Capture", () => {
    expect(transcriptSourceLabel("browser_captions")).toBe("CodeOutfitters Live Capture");
  });

  it("labels provider transcripts as Google Meet transcript", () => {
    expect(transcriptSourceLabel("provider_transcript")).toBe("Google Meet transcript");
  });

  it("labels future audio mode distinctly", () => {
    expect(transcriptSourceLabel("browser_audio")).toBe("CodeOutfitters Audio Capture");
  });

  it("defaults unknown/undefined to Google Meet transcript", () => {
    expect(transcriptSourceLabel(undefined)).toBe("Google Meet transcript");
  });

  it("capture state suffix renders only real capture states", () => {
    expect(captureStateSuffix("capture_active")).toBe("Capture active");
    expect(captureStateSuffix("capture_paused")).toBe("Capture paused");
    expect(captureStateSuffix("capture_complete")).toBe("Capture complete");
    expect(captureStateSuffix("FILE_GENERATED")).toBe("");
    expect(captureStateSuffix(null)).toBe("");
  });
});