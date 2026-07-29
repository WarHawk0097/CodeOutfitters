// Palette contrast tests. The owner's report was "enabled buttons look disabled" and
// "pale mint on ivory", which is a token problem, not a component problem: every palette
// restates the same layer-1 variables, so a foreground that is too pale is too pale in one
// place and wrong in six.
//
// These tests resolve the tokens per palette out of app/globals.css and check the ratios
// that the control system actually pairs — enabled ink on its own surface, primary label
// on the primary fill, status ink on its tint. They are the guard against a palette being
// added or retuned into an unreadable enabled control.
//
// Deliberately NOT asserted: that the disabled and placeholder foregrounds reach AA. They
// are not meant to; what is asserted is that they stay clearly weaker than the enabled ink
// beside them, because a disabled control that reads as strongly as an enabled one is the
// other half of the same defect.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES } from "./theme";

const here = fileURLToPath(new URL(".", import.meta.url));
const css = readFileSync(`${here}../globals.css`, "utf8");

/** The palette blocks. The default palette has no attribute — it is the second `:root`
 *  block, the one that opens the Command Center token layer. */
const DEFAULT_SELECTOR = ":root";

function blockFor(selector: string): string {
  if (selector === DEFAULT_SELECTOR) {
    // The Command Center layer is the `:root` block that declares --cc-page-bg.
    const blocks = css.split(":root {").slice(1);
    const cc = blocks.find((block) => block.includes("--cc-page-bg:"));
    if (!cc) throw new Error("no :root block declares --cc-page-bg");
    return cc.slice(0, cc.indexOf("}"));
  }
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing palette block: ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

const SELECTORS: Record<string, string> = {
  codeoutfitters: DEFAULT_SELECTOR,
  "forest-mist": "[data-cc-theme='forest-mist']",
  "graphite-sage": "[data-cc-theme='graphite-sage']",
  "midnight-emerald": "[data-cc-theme='midnight-emerald']",
  "ocean-slate": "[data-cc-theme='ocean-slate']",
  "warm-sand": "[data-cc-theme='warm-sand']",
};

/** Reads one custom property out of a block, following `var(--other)` one hop at a time
 *  and falling back to the default palette for anything a palette does not restate. */
function token(name: string, selector: string, seen = new Set<string>()): string {
  if (seen.has(name)) throw new Error(`token cycle at ${name}`);
  seen.add(name);
  const read = (block: string) => {
    const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
    return match?.[1].trim();
  };
  const raw = read(blockFor(selector)) ?? read(blockFor(DEFAULT_SELECTOR));
  if (!raw) throw new Error(`missing token ${name} for ${selector}`);
  const indirect = raw.match(/^var\((--[a-z0-9-]+)\)$/);
  if (indirect) return token(indirect[1], selector, seen);
  return raw;
}

function rgb(hex: string): [number, number, number] {
  const value = hex.trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    throw new Error(`not a hex colour: ${hex}`);
  }
  const full =
    value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value;
  return [
    parseInt(full.slice(1, 3), 16),
    parseInt(full.slice(3, 5), 16),
    parseInt(full.slice(5, 7), 16),
  ];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** WCAG AA for normal-size text. Every enabled control label is normal-size text. */
const AA = 4.5;
/** WCAG AA for large text and for a non-text boundary such as a focus ring. */
const AA_LARGE = 3;

describe("dashboard palette contrast", () => {
  it("covers every shipped palette", () => {
    expect(Object.keys(SELECTORS).sort()).toEqual([...THEMES].sort());
  });

  for (const palette of Object.keys(SELECTORS)) {
    const selector = SELECTORS[palette];
    const get = (name: string) => token(name, selector);

    describe(palette, () => {
      it("reads enabled body ink at AA on both card surfaces", () => {
        const ink = get("--cc-text");
        expect(ratio(ink, get("--cc-surface"))).toBeGreaterThanOrEqual(AA);
        expect(ratio(ink, get("--cc-surface-muted"))).toBeGreaterThanOrEqual(AA);
      });

      it("reads the secondary and table foregrounds at AA on the card surface", () => {
        const surface = get("--cc-surface");
        expect(ratio(get("--cc-text-muted"), surface)).toBeGreaterThanOrEqual(AA);
        expect(ratio(get("--cc-t-table"), surface)).toBeGreaterThanOrEqual(AA);
        expect(ratio(get("--cc-t-header"), surface)).toBeGreaterThanOrEqual(AA);
      });

      it("reads the primary button label at AA on the primary fill", () => {
        // The primary variant is white on --cc-green-solid, which resolves to the
        // accent's hover shade rather than the brand accent: white on --cc-accent
        // measures 3.4:1 here and 3.5:1 in midnight-emerald, which is under AA for a
        // 12.5px label. The press step is darker again, so AA on the fill covers both.
        expect(ratio("#ffffff", get("--cc-green-solid"))).toBeGreaterThanOrEqual(AA);
      });

      it("reads the selected tab label at AA on the segmented fill", () => {
        // The active tab is heading ink behind white; a mid-tone fill here is the same
        // "is this on or off" confusion the accent fill caused on the primary button.
        expect(ratio("#ffffff", get("--cc-ink-strong"))).toBeGreaterThanOrEqual(AA);
      });

      it("reads accent ink at AA on the surface and on its own tint", () => {
        // This is the pale-mint defect: a tertiary action or a card row action is
        // --cc-green-ink text, and its hover moves it onto --cc-green-tint.
        const accentInk = get("--cc-accent-hover");
        expect(ratio(accentInk, get("--cc-surface"))).toBeGreaterThanOrEqual(AA);
        expect(ratio(accentInk, get("--cc-surface-muted"))).toBeGreaterThanOrEqual(AA);
        expect(ratio(accentInk, get("--cc-accent-soft"))).toBeGreaterThanOrEqual(AA);
      });

      it("reads status ink at AA on the surface and on its own tint", () => {
        for (const tone of ["red", "amber", "blue"] as const) {
          const ink = get(`--cc-${tone}-ink`);
          expect(ratio(ink, get("--cc-surface")), `${tone} on surface`).toBeGreaterThanOrEqual(AA);
          expect(ratio(ink, get(`--cc-${tone}-tint`)), `${tone} on tint`).toBeGreaterThanOrEqual(AA);
        }
      });

      it("keeps the focus ring visible against both surfaces", () => {
        const ring = get("--cc-accent");
        expect(ratio(ring, get("--cc-surface"))).toBeGreaterThanOrEqual(AA_LARGE);
        expect(ratio(ring, get("--cc-surface-muted"))).toBeGreaterThanOrEqual(AA_LARGE);
      });

      it("keeps the disabled and placeholder foregrounds weaker than enabled ink", () => {
        // Not an AA assertion — a deliberate inequality. `--cc-body-t3` is the
        // placeholder and the disabled label; it must sit clearly below the secondary
        // foreground it appears next to, or an enabled control and a disabled one become
        // the same control at a glance.
        const surface = get("--cc-surface");
        const placeholder = ratio(get("--cc-body-t3"), surface);
        const secondary = ratio(get("--cc-text-muted"), surface);
        expect(placeholder).toBeLessThan(secondary);
        // Still legible enough to read the reason a control is unavailable.
        expect(placeholder).toBeGreaterThanOrEqual(AA_LARGE);
      });
    });
  }
});
