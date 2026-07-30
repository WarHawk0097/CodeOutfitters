// Public-site contrast tests — the v1.0.1 patch guard.
//
// The Core v1 freeze shipped with five reported control patterns below WCAG AA 4.5:1, all
// of them the same root cause: one brand green (#17A063, 3.36:1 as text or under white)
// was being used for three different jobs — the brand mark and decorative graphics, green
// *text*, and the fill under a white button label. Only the first of those jobs is what
// 3.36:1 is adequate for.
//
// The patch splits the roles into tokens (app/globals.css) rather than editing hex values
// per component, so these tests assert two things: the tokens measure what the roles need,
// and the components that were reported now consume the right token. Ratios are calculated
// from the sRGB relative-luminance formula, not judged by eye.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(repo, path), "utf8");
const css = read("app/globals.css");

/** The public brand block: the `:root` that declares --brand-primary. The second `:root`
 *  opens the dashboard token layer and is covered by app/dashboard/palette-contrast.test.ts. */
const brandBlock = (() => {
  const block = css
    .split(":root {")
    .slice(1)
    .find((candidate) => candidate.includes("--brand-primary:"));
  if (!block) throw new Error("no :root block declares --brand-primary");
  return block.slice(0, block.indexOf("}"));
})();

function token(name: string): string {
  const raw = brandBlock.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
  if (!raw) throw new Error(`missing token ${name}`);
  const indirect = raw.match(/^var\((--[a-z0-9-]+)\)$/);
  return indirect ? token(indirect[1]) : raw;
}

function luminance(hex: string): number {
  const value = hex.trim();
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`not a 6-digit hex colour: ${hex}`);
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const c = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** AA for normal-size text. Every control label and link in this patch is normal-size. */
const AA = 4.5;
/** AA for a non-text boundary: a focus ring, a control border, a decorative graphic. */
const AA_NON_TEXT = 3;

const WHITE = "#FFFFFF";

/** Every light surface the public site puts green text or a green control on. */
const SURFACES = {
  "--brand-surface": token("--brand-surface"),
  "--brand-surface-2": token("--brand-surface-2"),
  "--brand-bg": token("--brand-bg"),
  "--brand-primary-light": token("--brand-primary-light"),
  "--brand-cream-card": token("--brand-cream-card"),
  input: "#FDFBF6",
  "faq card": "#FCFAF4",
  "timezone option, selected": "#E8F5F1",
};

/** The end stop of the two FAQ gradients (`components/faq.tsx`, the security page). It is
 *  the darkest thing the ivory family reaches, and --brand-green-ink measures 4.36:1 on it
 *  — under AA. Nothing puts green text there today (the FAQ control is a white label on the
 *  filled action, and the copy is #0A120E ink), so it is listed as a boundary rather than a
 *  surface, with --brand-green-ink-hover as the token to use if green text ever lands on it. */
const IVORY_GRADIENT_END = "#EFE7D6";

describe("public brand token roles", () => {
  it("keeps the decorative brand green as it was approved", () => {
    // The patch is not a global darkening: the brand accent still paints the wordmark, the
    // hero line art and the decorative FAQ icon, where 3:1 for a graphic is the bar.
    expect(token("--brand-green")).toBe("#17A063");
    expect(token("--brand-primary")).toBe("#17A063");
    expect(ratio(token("--brand-green"), SURFACES["--brand-surface"])).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
    // And the reason it could not stay on text or under a white label:
    expect(ratio(token("--brand-green"), SURFACES["--brand-surface"])).toBeLessThan(AA);
    expect(ratio(WHITE, token("--brand-green"))).toBeLessThan(AA);
  });

  it("reads green text at AA on every public surface it is used on", () => {
    const ink = token("--brand-green-ink");
    for (const [name, surface] of Object.entries(SURFACES)) {
      expect(ratio(ink, surface), name).toBeGreaterThanOrEqual(AA);
    }
  });

  it("has a green text step that clears AA on the ivory gradient end too", () => {
    expect(ratio(token("--brand-green-ink"), IVORY_GRADIENT_END)).toBeLessThan(AA);
    expect(
      ratio(token("--brand-green-ink-hover"), IVORY_GRADIENT_END),
    ).toBeGreaterThanOrEqual(AA);
  });

  it("reads a white label at AA on the filled action in all three states", () => {
    for (const state of [
      "--brand-green-solid",
      "--brand-green-solid-hover",
      "--brand-green-solid-press",
    ]) {
      expect(ratio(WHITE, token(state)), state).toBeGreaterThanOrEqual(AA);
    }
    // The login submit uses the ivory paper colour for its label rather than pure white.
    expect(ratio(token("--brand-bg"), token("--brand-green-solid"))).toBeGreaterThanOrEqual(AA);
  });

  it("darkens the filled action monotonically from rest to press", () => {
    const steps = ["--brand-green-solid", "--brand-green-solid-hover", "--brand-green-solid-press"]
      .map((name) => ratio(WHITE, token(name)));
    expect(steps[1]).toBeGreaterThan(steps[0]);
    expect(steps[2]).toBeGreaterThan(steps[1]);
  });

  it("keeps every focus indicator visible on every public surface", () => {
    for (const [name, surface] of Object.entries(SURFACES)) {
      expect(ratio(token("--brand-focus"), surface), name).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
    // --ring is the shadcn focus token; it must not drift back to the decorative accent.
    expect(css).toMatch(/--ring:\s*#0E7A4E;/);
  });
});

// ---------------------------------------------------------------------------------------
// The five reported patterns, at their source.
// ---------------------------------------------------------------------------------------

describe("reported patterns consume the right token", () => {
  it("gives the homepage FAQ Contact Support a filled-action background", () => {
    const faq = read("components/faq.tsx");
    expect(faq).toMatch(/\.hp-faq aside a\{[^}]*background:var\(--brand-green-solid\)/);
    expect(faq).toContain(".hp-faq aside a:first-child:hover{background:var(--brand-green-solid-hover)}");
    expect(faq).toContain(".hp-faq aside a:first-child:active{background:var(--brand-green-solid-press)}");
    expect(faq).toContain("outline:2px solid var(--brand-focus)");
    // The decorative icon above the heading is left on the brand accent.
    expect(faq).toMatch(/\.hp-faq aside>svg\{[^}]*color:#17A063/);
  });

  it("gives the workflow-audit CTA a filled-action background on every page that mounts it", () => {
    const cta = read("components/inquiry/inquiry-cta.tsx");
    expect(cta).toContain("bg-[var(--brand-green-solid)]");
    expect(cta).not.toContain("bg-[var(--brand-green)]");
    for (const path of [
      "app/(public)/services/page.tsx",
      "app/(public)/industries/page.tsx",
      "app/(public)/security/security-page-client.tsx",
    ]) {
      expect(read(path), path).toContain("ContextualInquiryCta");
    }
  });

  it("gives both inquiry-form submits and privacy links their tokens", () => {
    for (const path of [
      "components/inquiry/compact-inquiry-form.tsx",
      "components/inquiry/full-inquiry-form.tsx",
    ]) {
      const src = read(path);
      expect(src, path).toContain("bg-[var(--brand-green-solid)]");
      expect(src, path).toMatch(/href="\/privacy" className="text-\[var\(--brand-green-ink\)\] underline"/);
    }
  });

  it("gives the login status text and Forgot password link the text token", () => {
    const login = read("app/login/login-frame.tsx");
    expect(login).toContain(".login-forgot{font:500 13px 'Instrument Sans',sans-serif;color:var(--brand-green-ink)");
    expect(login).toMatch(/\.login-status\{[^}]*color:var\(--brand-green-ink\)/);
    // The submit's hover was a white label on the decorative accent, 3.3:1.
    expect(login).toContain(".login-submit:hover:not(:disabled){background:var(--brand-green-solid)}");
    expect(login).toMatch(/\.login-input:focus\{border-color:var\(--brand-focus\)/);
  });

  it("gives the forgot-password actions the filled-action and focus tokens", () => {
    const page = read("app/forgot-password/page.tsx");
    expect(page).toContain("bg-[var(--brand-green-solid,#0E7A4E)]");
    expect(page).not.toContain("bg-[var(--brand-green,#0A7C4A)]");
    expect(page).toContain("focus:border-[var(--brand-focus,#0E7A4E)]");
  });

  it("gives the dashboard attention links the green text token", () => {
    // The five `Open …` links on /dashboard, plus the three list-route batch actions and
    // the two card expanders that carried the same class.
    for (const path of [
      "components/dashboard/overview-operations.tsx",
      "app/dashboard/leads/leads-data.tsx",
      "app/dashboard/meetings/meetings-view.tsx",
      "app/dashboard/proposals/proposals-view.tsx",
      "lib/command-center/ui/leads-table.tsx",
      "lib/command-center/ui/overview-cards.tsx",
      "lib/command-center/ui/pipeline-journey.tsx",
    ]) {
      expect(read(path), path).toContain("text-cc-green-ink");
    }
  });

  it("gives the booking flow and timezone picker their control tokens", () => {
    const booking = read("components/contact-booking-flow.tsx");
    // A selected day was a white label on #128A54 (3.63:1) and its sub-label was #128A54
    // on the sage wash (3.95:1). Neither is reachable without interacting, so neither was
    // in the rendered report; both are the same defect.
    expect(booking).not.toContain("#128A54'; color: '#fff'");
    expect(booking).toContain("bg = 'var(--brand-green-solid)'");
    expect(booking).toContain("subColor = 'var(--brand-green-ink)'");
    expect(read("components/timezone-selector.tsx")).toContain(
      ".tz-option.selected{background:#E8F5F1;color:var(--brand-green-ink)",
    );
  });

  it("gives the public proposal submit a filled-action background", () => {
    const proposal = read("app/proposal/[secureToken]/proposal-public-view.tsx");
    expect(proposal).toContain("background: var(--brand-green-solid); color: #fff;");
    expect(proposal).toContain("outline: 2px solid var(--brand-focus)");
  });
});

// ---------------------------------------------------------------------------------------
// Role separation, swept across the product source.
// ---------------------------------------------------------------------------------------

const SOURCE_DIRS = ["app", "components", "lib", "hooks"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(repo, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(repo, rel)).isDirectory()) walk(rel, out);
    else if (/\.tsx?$/.test(entry) && !entry.includes(".test.")) out.push(rel);
  }
  return out;
}

const sources = SOURCE_DIRS.flatMap((dir) => walk(dir)).map((path) => ({
  path,
  src: read(path),
}));

describe("token roles are not conflated", () => {
  it("sweeps the product source it claims to guard", () => {
    expect(sources.length).toBeGreaterThan(50);
  });

  it("never paints text with a filled-action token", () => {
    for (const { path, src } of sources) {
      expect(src, path).not.toMatch(/text-\[var\(--brand-green-solid/);
      expect(src, path).not.toMatch(/color:\s*var\(--brand-green-solid/);
    }
  });

  it("never fills a background with a green text token", () => {
    for (const { path, src } of sources) {
      expect(src, path).not.toMatch(/bg-\[var\(--brand-green-ink/);
      expect(src, path).not.toMatch(/background(-color)?:\s*var\(--brand-green-ink/);
    }
  });

  it("puts no white or ivory label on the decorative brand green", () => {
    for (const { path, src } of sources) {
      expect(src, path).not.toMatch(/bg-\[var\(--brand-green\)\][^"`]*text-white/);
      expect(src, path).not.toMatch(/background:\s*var\(--brand-green\);[^}]*color:\s*#fff/);
    }
  });

  it("does not fade an enabled control instead of disabling it", () => {
    for (const { path, src } of sources) {
      // `disabled:opacity-` on the public forms is the pre-existing disabled treatment and
      // stays; what must not exist is an opacity fade on a control that is enabled.
      expect(src, path).not.toMatch(/(?<!disabled:)\bopacity-\d+ [^"`]*bg-\[var\(--brand-green-solid/);
    }
  });

  it("leaves no href=\"#\" placeholder behind", () => {
    for (const { path, src } of sources) {
      expect(src, path).not.toMatch(/href="#"/);
    }
  });

  it("never paints a status tone as text through its fill entry", () => {
    // TONE_BASE is the solid square/dot; TONE_INK is the same tone as text. The overview
    // "DUE TODAY" tag took the fill entry and measured 3.65:1 on white — the amber twin of
    // the green defect this release exists to fix.
    for (const { path, src } of sources) {
      expect(src, path).not.toMatch(/style=\{\{[^}]*\bcolor:\s*TONE_BASE\[/);
      // Same defect one indirection later: a `color` field holding the fill tone, spent as
      // the text colour of the label beside the fill.
      expect(src, path).not.toMatch(/style=\{\{\s*color:\s*\w+\.color\s*\}\}/);
    }
  });
});

// The contact page's "other ways to reach us" cards write their own CSS with alpha
// foregrounds rather than tokens, so the token sweep above cannot see them: the rendered QA
// measured the card sub-labels at 4.30:1 on the dark panel. Composite and check them.
describe("contact reach cards", () => {
  const contact = read("app/(public)/contact/contact-page-client.tsx");
  /** Alpha composite: `foreground` at `alpha` over an opaque `background`. */
  const overlay = (foreground: string, alpha: number, background: string) => {
    const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    const mixed = [0, 1, 2].map((i) =>
      Math.round(channel(foreground, i) * alpha + channel(background, i) * (1 - alpha)),
    );
    return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };

  const PANEL = "#0E241A";
  const IVORY = "#F5F0E8";
  /** The card is a white wash over the panel; its hover step raises the wash to .08. */
  const CARD = overlay("#FFFFFF", 0.05, PANEL);
  const CARD_HOVER = overlay("#FFFFFF", 0.08, PANEL);

  const alphaOf = (rule: string) => {
    const block = contact.match(new RegExp(`${rule}\\{[^}]*\\}`))?.[0];
    if (!block) throw new Error(`missing rule: ${rule}`);
    const alpha = block.match(/color:rgba\(245,240,232,(\.\d+|1)\)/);
    if (!alpha) throw new Error(`no ivory alpha foreground in: ${rule}`);
    return Number(alpha[1]);
  };

  it("reads the card sub-label at AA at rest and on hover", () => {
    const alpha = alphaOf("\\.con-reach a small");
    expect(ratio(overlay(IVORY, alpha, CARD), CARD)).toBeGreaterThanOrEqual(AA);
    expect(ratio(overlay(IVORY, alpha, CARD_HOVER), CARD_HOVER)).toBeGreaterThanOrEqual(AA);
  });

  it("reads the section eyebrow at AA on the panel", () => {
    const alpha = alphaOf("\\.con-reach>div>strong");
    expect(ratio(overlay(IVORY, alpha, PANEL), PANEL)).toBeGreaterThanOrEqual(AA);
  });
});
