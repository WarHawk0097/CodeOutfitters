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

/** Reads a token as it resolves under an appearance: the appearance block wins over the
 *  palette block for anything it restates, exactly as the cascade does (both selectors
 *  have the same specificity and the appearance block is written later). */
function appearanceToken(name: string, selector: string, appearance: string): string {
  const read = (block: string) => block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
  const raw =
    read(blockFor(appearance)) ??
    read(blockFor(selector)) ??
    read(blockFor(DEFAULT_SELECTOR));
  if (!raw) throw new Error(`missing token ${name} for ${selector} under ${appearance}`);
  // The indirection is followed under the appearance too — a layer-2 alias like
  // --cc-green-tint: var(--cc-accent-soft) must land on the dark --cc-accent-soft, not the
  // light one, which is what the browser resolves it to.
  const indirect = raw.match(/^var\((--[a-z0-9-]+)\)$/);
  if (indirect) return appearanceToken(indirect[1], selector, appearance);
  return resolveMix(raw, selector, appearance);
}

/** `color-mix(in srgb, <colour> <p>%, <colour>)` — the only mix form the token layer uses.
 *  Interpolating in gamma-encoded sRGB is what the browser does for `in srgb`. */
function resolveMix(value: string, selector: string, appearance: string): string {
  const mix = value.match(
    /^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*(.+?)\s*\)$/,
  );
  if (!mix) return value;
  const colour = (part: string) => {
    const indirect = part.match(/^var\((--[a-z0-9-]+)\)$/);
    return indirect ? appearanceToken(indirect[1], selector, appearance) : part;
  };
  const weight = Number(mix[2]) / 100;
  const a = rgb(colour(mix[1]));
  const b = rgb(colour(mix[3]));
  const channel = (i: number) => Math.round(a[i] * weight + b[i] * (1 - weight));
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, "0")).join("")}`;
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

      it("keeps the tertiary foreground weaker than enabled ink but still at AA", () => {
        // `--cc-body-t3` is the placeholder, the disabled label AND every tertiary
        // sub-label on these cards. The last of those three is live text, so v1.0.1
        // moved it to AA: it measured 3.20:1 on the warm-sand lane, which the rendered
        // QA caught as the search placeholder and the row sub-labels.
        //
        // The inequality below survives the move and is the other half of the same
        // defect: a disabled control that reads as strongly as an enabled one is
        // indistinguishable from it at a glance.
        const tertiary = get("--cc-body-t3");
        for (const surface of [
          "--cc-surface",
          "--cc-surface-muted",
          "--cc-surface-raised",
          "--cc-page-bg",
          "--cc-lane",
          "--cc-accent-soft",
        ]) {
          expect(ratio(tertiary, get(surface)), surface).toBeGreaterThanOrEqual(AA);
        }
        const surface = get("--cc-surface");
        expect(ratio(tertiary, surface)).toBeLessThan(ratio(get("--cc-text-muted"), surface));
      });
    });
  }
});

// The dark appearance is a second set of surfaces under the same palettes, so every pair
// above has a dark twin. It is checked separately because one token — green *text* — has
// to move the other way in the dark: --cc-green-ink is the accent one step darker, which
// is 2.4-3.2:1 on the dark canvas. The dark block lifts it toward white instead.
const DARK = "[data-cc-appearance='dark']";

describe("dashboard palette contrast, dark appearance", () => {
  for (const palette of Object.keys(SELECTORS)) {
    const selector = SELECTORS[palette];
    const get = (name: string) => appearanceToken(name, selector, DARK);

    describe(palette, () => {
      it("reads body, secondary, table and tertiary ink at AA on every dark surface", () => {
        for (const surface of ["--cc-surface", "--cc-surface-muted", "--cc-surface-raised"]) {
          expect(ratio(get("--cc-text"), get(surface)), surface).toBeGreaterThanOrEqual(AA);
          expect(ratio(get("--cc-text-muted"), get(surface)), surface).toBeGreaterThanOrEqual(AA);
          expect(ratio(get("--cc-t-table"), get(surface)), surface).toBeGreaterThanOrEqual(AA);
          expect(ratio(get("--cc-body-t3"), get(surface)), surface).toBeGreaterThanOrEqual(AA);
        }
      });

      it("reads green text at AA on every dark surface and on its own tint", () => {
        const ink = get("--cc-green-ink");
        for (const surface of [
          "--cc-page-bg",
          "--cc-surface",
          "--cc-surface-muted",
          "--cc-surface-raised",
          "--cc-lane",
          "--cc-green-tint",
        ]) {
          expect(ratio(ink, get(surface)), surface).toBeGreaterThanOrEqual(AA);
        }
      });

      it("keeps the primary label at AA on the primary fill in the dark", () => {
        // The fill is a background under a white label and therefore stays dark.
        expect(ratio("#ffffff", get("--cc-green-solid"))).toBeGreaterThanOrEqual(AA);
        expect(ratio("#ffffff", get("--cc-green-press"))).toBeGreaterThanOrEqual(AA);
      });

      it("reads status ink at AA on the dark surface and on its own tint", () => {
        for (const tone of ["red", "amber", "blue"] as const) {
          const ink = get(`--cc-${tone}-ink`);
          expect(ratio(ink, get("--cc-surface")), `${tone} on surface`).toBeGreaterThanOrEqual(AA);
          expect(ratio(ink, get(`--cc-${tone}-tint`)), `${tone} on tint`).toBeGreaterThanOrEqual(AA);
        }
      });

      it("keeps the focus ring visible against the dark surfaces", () => {
        const ring = get("--cc-accent");
        expect(ratio(ring, get("--cc-surface"))).toBeGreaterThanOrEqual(AA_LARGE);
        expect(ratio(ring, get("--cc-surface-muted"))).toBeGreaterThanOrEqual(AA_LARGE);
      });
    });
  }
});

// The rail is a third axis: it keeps its own five colour sets, independent of palette and
// appearance, so a foreground that is too pale there is invisible in whichever rail the
// owner picked and nowhere else. v1.0.1 found three that were: the graphite rail's muted
// text at 3.69:1, and both of the light-ivory rail's weaker foregrounds at 3.18/3.60:1.
const SIDEBARS = ["forest", "warm-ink", "graphite", "midnight-emerald", "light-ivory"] as const;

describe("dashboard sidebar contrast", () => {
  for (const rail of SIDEBARS) {
    const selector = `[data-cc-sidebar='${rail}']`;
    const get = (name: string) => token(name, selector);

    it(`${rail} reads every rail foreground at AA on the rail's own surfaces`, () => {
      // A nav item is a link, its count is text beside that link and a section heading
      // labels both — every one of them is live text on one of these three fills.
      for (const fill of ["--cc-sidebar-bg", "--cc-sidebar-surface", "--cc-sidebar-hover"]) {
        for (const ink of ["--cc-sidebar-text", "--cc-sidebar-muted", "--cc-sidebar-heading"]) {
          expect(ratio(get(ink), get(fill)), `${ink} on ${fill}`).toBeGreaterThanOrEqual(AA);
        }
      }
    });

    it(`${rail} reads the active item and its badge at AA on their own fills`, () => {
      expect(
        ratio(get("--cc-sidebar-active-text"), get("--cc-sidebar-active-bg")),
        "active item",
      ).toBeGreaterThanOrEqual(AA);
      expect(
        ratio(get("--cc-sidebar-badge-text"), get("--cc-sidebar-badge-bg")),
        "badge",
      ).toBeGreaterThanOrEqual(AA);
    });

    it(`${rail} keeps its focus ring visible against the rail`, () => {
      expect(ratio(get("--cc-sidebar-focus"), get("--cc-sidebar-bg"))).toBeGreaterThanOrEqual(
        AA_LARGE,
      );
    });
  }
});
