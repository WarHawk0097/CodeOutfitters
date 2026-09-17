import { describe, it, expect } from "vitest";
import { CaptionAssembler } from "./assembler";

// Phase 4 spec cases: incremental updates, speaker changes, corrections, pauses,
// duplicate updates, caption disappearance, multilingual text.

describe("CaptionAssembler", () => {
  it("accumulates a single speaker's incremental caption into one utterance", () => {
    const a = new CaptionAssembler();
    let r = a.feed({ speakerLabel: "Alice", text: "we need" }, 100);
    expect(r.finalized).toBeNull();
    expect(r.current).toEqual({ speakerLabel: "Alice", text: "we need" });

    r = a.feed({ speakerLabel: "Alice", text: "we need an offline" }, 200);
    expect(r.finalized).toBeNull();
    expect(r.current!.text).toBe("we need an offline");

    r = a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 300);
    expect(r.finalized).toBeNull();
    expect(r.current!.text).toBe("we need an offline application");
  });

  it("finalizes the previous utterance when the speaker changes", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 100);
    const r = a.feed({ speakerLabel: "Bob", text: "agreed" }, 200);
    expect(r.finalized).toEqual({ speakerLabel: "Alice", text: "we need an offline application" });
    expect(r.current).toEqual({ speakerLabel: "Bob", text: "agreed" });
  });

  it("finalizes when the caption disappears from the DOM", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 100);
    const r = a.captionGone(200);
    expect(r.finalized).toEqual({ speakerLabel: "Alice", text: "we need an offline application" });
    expect(r.current).toBeNull();
  });

  it("finalizes a settled caption after the timeout", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 100);
    const r = a.settleCheck(100 + 2000, 1500);
    expect(r.finalized).toEqual({ speakerLabel: "Alice", text: "we need an offline application" });
  });

  it("does not finalize before the settle timeout", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "we need" }, 100);
    const r = a.settleCheck(500, 1500);
    expect(r.finalized).toBeNull();
    expect(r.current!.text).toBe("we need");
  });

  it("honours a correction: the final corrected text wins, no premature statement", () => {
    const a = new CaptionAssembler();
    let r = a.feed({ speakerLabel: "Alice", text: "to the off-line portal" }, 100);
    expect(r.finalized).toBeNull();
    // A transient shorter re-render ("to the offline") never finalizes as a statement.
    r = a.feed({ speakerLabel: "Alice", text: "to the offline" }, 200);
    expect(r.finalized).toBeNull();
    // The corrected, complete form lands and is what would be stored on settle.
    r = a.feed({ speakerLabel: "Alice", text: "to the offline portal" }, 300);
    expect(r.finalized).toBeNull();
    expect(r.current!.text).toBe("to the offline portal");
    // Only ONE statement ever comes out of this correction sequence.
    const settled = a.settleCheck(300 + 2000, 1500);
    expect(settled.finalized).toEqual({ speakerLabel: "Alice", text: "to the offline portal" });
  });

  it("ignores a duplicate update of the exact same text (no duplicate statement)", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 100);
    const r = a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 110);
    expect(r.finalized).toBeNull();
    expect(r.current!.text).toBe("we need an offline application");
  });

  it("handles a long pause: text stays, flush forces it out", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 100);
    // A long pause with no new feed — settleCheck after the timeout finalizes it.
    const r = a.settleCheck(100 + 10_000, 1500);
    expect(r.finalized!.text).toBe("we need an offline application");
  });

  it("flush() emits the in-flight utterance (Stop flow)", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "we need an offline application" }, 100);
    const r = a.flush(500);
    expect(r.finalized).toEqual({ speakerLabel: "Alice", text: "we need an offline application" });
    expect(a.active).toBeNull();
  });

  it("handles multilingual text without loss", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: "Alice", text: "nous avons besoin" }, 100);
    const r = a.feed({ speakerLabel: "Alice", text: "nous avons besoin d'une application hors ligne" }, 200);
    expect(r.finalized).toBeNull();
    expect(r.current!.text).toBe("nous avons besoin d'une application hors ligne");
  });

  it("speaker with no attribution stays null-label, one active slot at a time", () => {
    const a = new CaptionAssembler();
    a.feed({ speakerLabel: null, text: "first statement" }, 100);
    const r = a.feed({ speakerLabel: null, text: "second statement" }, 200);
    expect(r.finalized!.speakerLabel).toBeNull();
    expect(r.finalized!.text).toBe("first statement");
    expect(r.current!.text).toBe("second statement");
  });

  it("does not emit empty text as an utterance", () => {
    const a = new CaptionAssembler();
    expect(a.feed({ speakerLabel: "Alice", text: "" }, 100).finalized).toBeNull();
    expect(a.captionGone(200).finalized).toBeNull();
    expect(a.flush(300).finalized).toBeNull();
  });
});