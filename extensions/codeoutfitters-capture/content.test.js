import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "content.js"), "utf8");

describe("Meet caption observer contract", () => {
  it("uses the live captions region and resilient semantic fallbacks", () => {
    expect(source).toContain('[role="region"][aria-label="Captions"]');
    expect(source).toContain('[role="paragraph"]');
    expect(source).toContain('[aria-live]');
    expect(source).toContain("MutationObserver");
    expect(source).toContain("characterData: true");
  });

  it("commits stable rows while the Meet row is still visible", () => {
    expect(source).toContain("STABILITY_MS = 1000");
    expect(source).toContain("previous.committed");
    expect(source).toContain('type: "capture:entries"');
  });

  it("reports safe observer diagnostics without DOM contents", () => {
    for (const event of [
      "CAPTION_OBSERVER_STARTED",
      "CAPTION_ROOT_FOUND",
      "CAPTION_ROOT_NOT_FOUND",
      "CAPTION_MUTATION_SEEN",
      "CAPTION_CANDIDATE_FOUND",
      "CAPTION_TEXT_FOUND",
      "CAPTION_TEXT_EMPTY",
      "CAPTION_ENTRY_COMMITTED",
    ]) {
      expect(source).toContain(event);
    }
    expect(source).toContain("mutationsSeen");
    expect(source).toContain("captionCandidatesSeen");
    expect(source).toContain("captionTextsSeen");
    expect(source).toContain("entriesCommitted");
    expect(source).not.toContain("outerHTML");
    expect(source).not.toContain("innerHTML");
  });

  it("mounts an independent original widget with P0 controls and survives minimize/reopen", () => {
    expect(source).toContain('id = "codeoutfitters-copilot"');
    expect(source).toContain('id = "codeoutfitters-copilot-reopen"');
    for (const tab of ["LIVE", "NOTES", "AI", "INSIGHTS"]) expect(source).toContain(`"${tab}"`);
    expect(source).toContain('textContent = "Minimize"');
    expect(source).toContain("transcriptEntries");
  });
});
