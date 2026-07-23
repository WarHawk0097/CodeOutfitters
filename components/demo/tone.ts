// The two ways a canonical semantic tone reaches the screen: as a solid square/dot, and as
// chip text. Shared so a "green" square on one route can't be a different green from the
// one beside it on another.
import type { Tone } from "../../lib/demo/types";

export const TONE_BASE: Record<Tone, string> = {
  green: "var(--cc-green)",
  amber: "var(--cc-amber)",
  red: "var(--cc-red)",
  blue: "var(--cc-blue)",
  neutral: "var(--cc-neutral)",
};

export const TONE_INK: Record<Tone, string> = {
  green: "var(--cc-green-ink)",
  amber: "var(--cc-amber-ink)",
  red: "var(--cc-red-ink)",
  blue: "var(--cc-blue-ink)",
  neutral: "var(--cc-neutral)",
};
