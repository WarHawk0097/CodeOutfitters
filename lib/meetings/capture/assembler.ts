// Incremental caption assembler — the heart of CodeOutfitters Meeting Capture.
//
// Google Meet live captions arrive as rapidly-changing partial text in the DOM, not as
// finalized sentences. The same utterance surfaces repeatedly as it is re-transcribed:
//
//     "we need"
//     "we need an offline"
//     "we need an offline application"
//
// Storing all three as separate transcript statements would duplicate the same thought
// three times. This assembler collapses those updates into ONE utterance, finalizing it
// only when it has stabilised — which is what makes the resulting transcript_entries
// clean, ordered and idempotent.
//
// Contract:
//   - feed(update) with the same (speaker, partial text) slot ACCUMULATES, replacing the
//     in-progress text rather than appending.
//   - a NEW speaker or a caption that disappears finalizes the previous utterance.
//   - a caption that stops changing for `settleTimeoutMs` finalizes too (a complete
//     sentence left on screen is a complete sentence).
//   - corrections are honoured: Google re-renders a caption that changes mid-utterance
//     ("...to the off-line portal" → "...to the offline portal"); the newest text wins.
//
// This module is framework-free and pure (no timers, no DOM): it returns actions the
// caller applies, so tests are deterministic and the content script owns the wall clock.

export type AssemblerUpdate = {
  /** Speaker attribution label as surfaced by Google's captions DOM, if present. */
  speakerLabel: string | null;
  /** The caption text at this instant, before any settle logic. */
  text: string;
};

export type AssembledUtterance = {
  speakerLabel: string | null;
  text: string;
};

export type AssemblerResult = {
  /** A newly finalized utterance, if one was produced by this feed. */
  finalized: AssembledUtterance | null;
  /** The utterance currently being accumulated (may be the update just fed). */
  current: AssembledUtterance | null;
};

export class CaptionAssembler {
  private activeSpeaker: string | null = null;
  private activeText = "";
  private activeStartedAt = 0;

  /** Feed one caption DOM snapshot. `nowMs` is caller-supplied so tests stay
   *  deterministic and the content script passes performance.now()/Date.now(). */
  feed(update: AssemblerUpdate, nowMs: number): AssemblerResult {
    const speaker = update.speakerLabel ?? null;

    // Same speaker, same accumulated slot → decide accumulate vs. new turn.
    if (speaker === this.activeSpeaker) {
      // Unknown-speaker turns cannot be boundary-told by attribution: a completely
      // different text is a NEW utterance, not a correction of the old one.
      if (speaker === null && this.activeText && !isRelated(update.text, this.activeText)) {
        return this.startNew(update, nowMs);
      }
      return this.accumulateOrKeep(update);
    }

    // Different speaker (or first speaker) → finalize whatever was being accumulated.
    return this.startNew(update, nowMs);
  }

  /** Same speaker: accept the newest text unless it is a transient artifact. An artifact
   *  is either a strict prefix-shortening of the held form ("we need" flashing under
   *  "we need an offline application") or a shorter re-render of the same utterance that
   *  still shares most of it ("to the offline" under "to the off-line portal"). A genuine
   *  correction replaces the held form. */
  private accumulateOrKeep(update: AssemblerUpdate): AssemblerResult {
    if (isTransientArtifact(update.text, this.activeText)) {
      // Keep the longer stable form; a later feed with the corrected, longer text wins.
      return { finalized: null, current: this.utterance() };
    }
    this.activeText = update.text;
    return { finalized: null, current: this.utterance() };
  }

  /** Called when the caption for the active speaker disappears from the DOM (or the
   *  meeting page signals a caption gap). Finalizes the active utterance. */
  captionGone(nowMs: number): AssemblerResult {
    const finalized = this.finalizeActive(nowMs);
    return { finalized, current: null };
  }

  /** Called when the active caption has not changed for `settleTimeoutMs`. Finalizes it
   *  as a complete utterance and resets the slot. */
  settleCheck(nowMs: number, settleTimeoutMs: number): AssemblerResult {
    if (this.activeText && nowMs - this.activeStartedAt >= settleTimeoutMs) {
      return this.captionGone(nowMs);
    }
    return { finalized: null, current: this.utterance() };
  }

  /** Force-finalize whatever is in flight, regardless of settle state. Used on Stop. */
  flush(nowMs: number): AssemblerResult {
    return this.captionGone(nowMs);
  }

  private finalizeActive(nowMs: number): AssembledUtterance | null {
    if (!this.activeText) return null;
    const finalized = this.utterance();
    this.activeSpeaker = null;
    this.activeText = "";
    // maxUtteranceMs is a caller-side guard; this module only reports the utterance.
    void nowMs;
    return finalized;
  }

  private startNew(update: AssemblerUpdate, nowMs: number): AssemblerResult {
    const finalized = this.finalizeActive(nowMs);
    this.activeSpeaker = update.speakerLabel ?? null;
    this.activeText = update.text;
    this.activeStartedAt = nowMs;
    return { finalized, current: this.utterance() };
  }

  private utterance(): AssembledUtterance {
    return { speakerLabel: this.activeSpeaker, text: this.activeText };
  }

  get active(): AssembledUtterance | null {
    return this.activeText ? this.utterance() : null;
  }
}

/** Are two caption texts the same thought in progress? True when one extends the other
 *  or they differ only by plausible correction characters (the same "shape"). Used only
 *  for the unknown-speaker boundary, where attribution cannot tell turns apart. */
function isRelated(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  // Corrections: same length-class, sharing a large common prefix. "to the offline
  // portal" vs "to the off-line portal" share ~19 of 22 chars.
  if (Math.abs(a.length - b.length) > 4) return false;
  const common = commonPrefixLength(a, b);
  return common >= Math.max(a.length, b.length) * 0.6;
}

/** A shorter re-render of the held utterance that is still recognizably the same text —
 *  either a strict prefix of it or a shorter variant sharing most of it. A genuine
 *  correction (different wording, low common prefix) is NOT an artifact and replaces. */
function isTransientArtifact(next: string, held: string): boolean {
  if (next.length >= held.length) return false;
  if (held.startsWith(next)) return true;
  const common = commonPrefixLength(next, held);
  return common >= held.length * 0.6;
}

function commonPrefixLength(a: string, b: string): number {
  let i = 0;
  const max = Math.min(a.length, b.length);
  while (i < max && a[i] === b[i]) i += 1;
  return i;
}