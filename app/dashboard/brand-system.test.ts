// Brand-system guard: the Command Center palette IS the public CodeOutfitters
// palette, and no dashboard surface may re-introduce a disconnected hard-coded
// colour.
//
// The public site's --brand-* block is the authority. These tests read it out of
// globals.css and assert the dashboard's layer-1 tokens against it, so a future
// edit to either side that pulls them apart fails here rather than in review.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_SIDEBAR_STYLE,
  DEFAULT_THEME,
  SIDEBAR_STYLES,
  SIDEBAR_STYLE_LABELS,
  THEMES,
  THEME_LABELS,
  THEME_SWATCHES,
  readStoredSidebarStyle,
  readStoredTheme,
  readStoredAppearance,
} from "./theme";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const css = readFileSync(join(repoRoot, "app/globals.css"), "utf8");
const settingsSrc = readFileSync(join(repoRoot, "app/dashboard/settings/settings-view.tsx"), "utf8");
const sidebarSrc = readFileSync(join(repoRoot, "lib/command-center/ui/sidebar.tsx"), "utf8");

/** Value of `name` inside the first block whose selector text matches. */
function tokenIn(selector: string, name: string): string | undefined {
  const start = css.indexOf(selector);
  if (start === -1) return undefined;
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  const block = css.slice(open, close);
  const m = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  return m?.[1].trim();
}

// The first `:root {` block in the file is the public brand block; the second is
// the Command Center token layer.
const publicRootStart = css.indexOf(":root {");
const ccRootStart = css.indexOf(":root {", publicRootStart + 1);
const publicRoot = css.slice(publicRootStart, css.indexOf("\n}", publicRootStart));
const ccRoot = css.slice(ccRootStart, css.indexOf("\n}", ccRootStart));

function fromBlock(block: string, name: string): string | undefined {
  return block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
}

describe("public brand tokens are the dashboard's source of truth", () => {
  it("the public --brand-* block still defines the values we inherited", () => {
    expect(fromBlock(publicRoot, "--brand-bg")).toBe("#F7F2EA");
    expect(fromBlock(publicRoot, "--brand-text")).toBe("#0A120E");
    expect(fromBlock(publicRoot, "--brand-primary")).toBe("#17A063");
    expect(fromBlock(publicRoot, "--brand-primary-hover")).toBe("#0E7A4E");
    expect(fromBlock(publicRoot, "--brand-bright")).toBe("#2BD483");
  });

  it("the default dashboard palette matches the public palette exactly", () => {
    const pairs: [string, string][] = [
      ["--cc-page-bg", "--brand-bg"],
      ["--cc-page-text", "--brand-text"],
      ["--cc-text", "--brand-text"],
      ["--cc-accent", "--brand-primary"],
      ["--cc-accent-hover", "--brand-primary-hover"],
      ["--cc-sidebar-logo", "--brand-bright"],
    ];
    for (const [cc, brand] of pairs) {
      const ccValue = fromBlock(ccRoot, cc)?.replace(/\s*\/\*.*$/, "").toLowerCase();
      expect(ccValue, cc).toBe(fromBlock(publicRoot, brand)?.toLowerCase());
    }
  });

  it("the default sidebar is deep forest, not the old near-black rail", () => {
    const bg = fromBlock(ccRoot, "--cc-sidebar-bg")?.replace(/\s*\/\*.*$/, "").trim();
    expect(bg).toBe("#0e241a");
    // The rejected rail. Never again, in any palette or sidebar style.
    expect(css).not.toContain("#14130e");
  });

  it("the canvas is warm ivory, not the rejected cool grey", () => {
    expect(css).not.toContain("#edf0f2");
  });
});

describe("the semantic token layer exists and is complete", () => {
  const REQUIRED = [
    "--cc-page-bg",
    "--cc-page-text",
    "--cc-surface",
    "--cc-surface-muted",
    "--cc-surface-raised",
    "--cc-border",
    "--cc-border-strong",
    "--cc-text",
    "--cc-text-muted",
    "--cc-heading",
    "--cc-accent",
    "--cc-accent-hover",
    "--cc-accent-soft",
    "--cc-focus",
    "--cc-success",
    "--cc-warning",
    "--cc-danger",
    "--cc-sidebar-bg",
    "--cc-sidebar-surface",
    "--cc-sidebar-border",
    "--cc-sidebar-text",
    "--cc-sidebar-muted",
    "--cc-sidebar-heading",
    "--cc-sidebar-hover",
    "--cc-sidebar-active-bg",
    "--cc-sidebar-active-text",
    "--cc-sidebar-badge-bg",
    "--cc-sidebar-badge-text",
    "--cc-sidebar-logo",
    "--cc-sidebar-focus",
    "--cc-card-shadow",
    "--cc-dialog-shadow",
    "--cc-chart-grid",
    "--cc-chart-primary",
    "--cc-chart-secondary",
    "--cc-chart-tertiary",
    "--cc-chart-highlight",
  ];

  it("defines every required token on the Command Center root", () => {
    const missing = REQUIRED.filter((t) => fromBlock(ccRoot, t) === undefined);
    expect(missing).toEqual([]);
  });

  it("re-points the legacy Final.dc.html token names at the semantic layer", () => {
    // If these ever go back to literals, a palette switch stops reaching the
    // ~50 cc-* utilities that are actually used by components.
    expect(fromBlock(ccRoot, "--cc-body-canvas")).toBe("var(--cc-page-bg)");
    expect(fromBlock(ccRoot, "--cc-body-surface")).toBe("var(--cc-surface)");
    expect(fromBlock(ccRoot, "--cc-body-ink")).toBe("var(--cc-text)");
    expect(fromBlock(ccRoot, "--cc-green")).toBe("var(--cc-accent)");
    expect(fromBlock(ccRoot, "--cc-sidebar-ink")).toBe("var(--cc-sidebar-bg)");
    expect(fromBlock(ccRoot, "--cc-line-strong")).toBe("var(--cc-border-strong)");
  });

  it("exposes the semantic tokens as Tailwind utilities", () => {
    for (const name of ["--color-cc-accent", "--color-cc-sidebar-active-bg", "--color-cc-chart-primary"]) {
      expect(css).toContain(name);
    }
  });
});

describe("curated palettes and sidebar styles", () => {
  it("ships six palettes, each with a label and a four-token preview swatch", () => {
    expect(THEMES).toHaveLength(6);
    for (const preset of THEMES) {
      expect(THEME_LABELS[preset]).toBeTruthy();
      const swatch = THEME_SWATCHES[preset];
      for (const key of ["canvas", "surface", "accent", "rail"] as const) {
        expect(swatch[key], `${preset}.${key}`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it("every non-default palette restates the whole semantic layer, not just an accent", () => {
    for (const preset of THEMES.filter((t) => t !== DEFAULT_THEME)) {
      const selector = `[data-cc-theme='${preset}']`;
      expect(css, selector).toContain(selector);
      for (const token of ["--cc-page-bg", "--cc-surface", "--cc-accent", "--cc-sidebar-bg", "--cc-chart-primary"]) {
        expect(tokenIn(selector, token), `${preset} ${token}`).toBeTruthy();
      }
    }
  });

  it("each palette's preview swatch matches the CSS it previews", () => {
    for (const preset of THEMES) {
      const selector = preset === DEFAULT_THEME ? ":root {" : `[data-cc-theme='${preset}']`;
      const block = preset === DEFAULT_THEME ? ccRoot : css.slice(css.indexOf(selector));
      const read = (t: string) =>
        (preset === DEFAULT_THEME ? fromBlock(block, t) : tokenIn(selector, t))
          ?.replace(/\s*\/\*.*$/, "")
          .trim()
          .toLowerCase();
      expect(read("--cc-page-bg"), `${preset} canvas`).toBe(THEME_SWATCHES[preset].canvas);
      expect(read("--cc-accent"), `${preset} accent`).toBe(THEME_SWATCHES[preset].accent);
      expect(read("--cc-sidebar-bg"), `${preset} rail`).toBe(THEME_SWATCHES[preset].rail);
    }
  });

  it("ships six sidebar styles; 'match' is the no-override default", () => {
    expect(SIDEBAR_STYLES).toEqual([
      "match",
      "forest",
      "warm-ink",
      "graphite",
      "midnight-emerald",
      "light-ivory",
    ]);
    expect(DEFAULT_SIDEBAR_STYLE).toBe("match");
    // `match` deliberately has no CSS block — that is what makes it follow the
    // palette.
    expect(css).not.toContain("[data-cc-sidebar='match']");
    for (const style of SIDEBAR_STYLES.filter((s) => s !== "match")) {
      expect(css, style).toContain(`[data-cc-sidebar='${style}']`);
      expect(tokenIn(`[data-cc-sidebar='${style}']`, "--cc-sidebar-active-bg"), style).toBeTruthy();
      expect(SIDEBAR_STYLE_LABELS[style]).toBeTruthy();
    }
  });

  it("drops the legacy sidebar options that read as unbranded black", () => {
    expect(css).not.toContain("[data-cc-sidebar='ink']");
    expect(css).not.toContain("[data-cc-sidebar='tinted']");
    expect(css).not.toContain("[data-cc-sidebar='light']");
  });

  it("sidebar overrides are declared after the palettes so they actually win", () => {
    expect(css.indexOf("[data-cc-sidebar='forest']")).toBeGreaterThan(
      css.indexOf("[data-cc-theme='warm-sand']"),
    );
    expect(css.indexOf("[data-cc-sidebar='forest']")).toBeGreaterThan(
      css.indexOf("[data-cc-appearance='dark']"),
    );
  });
});

describe("preference persistence", () => {
  it("uses the namespaced palette / appearance / sidebar keys", () => {
    const themeSrc = readFileSync(join(repoRoot, "app/dashboard/theme.tsx"), "utf8");
    expect(themeSrc).toContain('"codeoutfitters.command-center.palette"');
    expect(themeSrc).toContain('"codeoutfitters.command-center.appearance"');
    expect(themeSrc).toContain('"codeoutfitters.command-center.sidebar"');
  });

  it("migrates the pre-refresh stored values instead of dropping them", () => {
    expect(readStoredTheme(null, "command")).toBe("codeoutfitters");
    expect(readStoredTheme(null, "ocean")).toBe("ocean-slate");
    expect(readStoredTheme(null, "amber")).toBe("warm-sand");
    expect(readStoredSidebarStyle(null, "ink")).toBe("forest");
    expect(readStoredSidebarStyle(null, "light")).toBe("light-ivory");
  });

  it("falls back safely on invalid, unknown or absent stored values", () => {
    expect(readStoredTheme(null, null)).toBe(DEFAULT_THEME);
    expect(readStoredTheme("neon-pink", "also-bogus")).toBe(DEFAULT_THEME);
    expect(readStoredTheme("{}", null)).toBe(DEFAULT_THEME);
    expect(readStoredSidebarStyle("nonsense", null)).toBe(DEFAULT_SIDEBAR_STYLE);
    expect(readStoredAppearance("chartreuse")).toBe(DEFAULT_APPEARANCE);
    expect(readStoredAppearance(null)).toBe(DEFAULT_APPEARANCE);
  });

  it("prefers a current value over a legacy one", () => {
    expect(readStoredTheme("warm-sand", "command")).toBe("warm-sand");
    expect(readStoredSidebarStyle("graphite", "ink")).toBe("graphite");
  });
});

describe("Settings → Appearance", () => {
  it("offers palette, appearance mode and sidebar style as three separate controls", () => {
    expect(settingsSrc).toContain("<legend");
    expect(settingsSrc).toContain("Palette");
    expect(settingsSrc).toContain("Appearance mode");
    expect(settingsSrc).toContain("Sidebar style");
    expect(settingsSrc).toContain("SIDEBAR_STYLES.map");
  });

  it("previews each palette with multiple token swatches, not a single dot", () => {
    expect(settingsSrc).toContain("THEME_SWATCHES[preset]");
    expect(settingsSrc).toContain("swatch.rail");
    expect(settingsSrc).toContain("swatch.canvas");
    expect(settingsSrc).toContain("swatch.surface");
    expect(settingsSrc).toContain("swatch.accent");
  });

  it("offers a reset to the CodeOutfitters default", () => {
    expect(settingsSrc).toContain("resetToDefaults");
    expect(settingsSrc).toContain("Reset to CodeOutfitters default");
  });

  it("states the persistence scope honestly — browser only, never the account", () => {
    expect(settingsSrc).toMatch(/this browser only/i);
    expect(settingsSrc).toMatch(/not saved to your account/i);
  });

  it("every control is a real button, so all of it is keyboard operable", () => {
    // Three grids, three sets of <button type="button"> with aria-pressed.
    const pressed = settingsSrc.match(/aria-pressed=\{selected\}/g) ?? [];
    expect(pressed.length).toBe(3);
  });
});

describe("no disconnected hard-coded colours remain in dashboard chrome", () => {
  const DASHBOARD_SOURCES = ["app/dashboard", "lib/command-center/ui", "components/demo"];

  function collect(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        collect(full, out);
        continue;
      }
      if (!/\.tsx$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
      out.push(full);
    }
    return out;
  }

  const files = DASHBOARD_SOURCES.flatMap((d) => collect(join(repoRoot, d))).map((path) => ({
    path: path.slice(repoRoot.length).replace(/\\/g, "/"),
    // Strip comments: the sidebar and leads-table both cite the retired
    // canonical hexes in prose, which is documentation, not styling.
    src: readFileSync(path, "utf8").replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ""),
  }));

  it("collects the dashboard sources it claims to guard", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("no dashboard component carries a literal hex colour", () => {
    // theme.tsx is the one exception: it is the palette *definition*, and its
    // swatches are asserted against globals.css above.
    const offenders = files
      .filter((f) => !f.path.endsWith("app/dashboard/theme.tsx"))
      .filter((f) => /#[0-9A-Fa-f]{6}\b/.test(f.src))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("status meaning is never colour-only in the sidebar", () => {
    // Count badges carry a screen-reader unit alongside the number.
    expect(sidebarSrc).toContain('<span className="sr-only">');
    expect(sidebarSrc).toContain("needing attention");
  });

  it("the active nav row has a surface treatment, not just a text colour", () => {
    expect(sidebarSrc).toContain("bg-cc-sidebar-active-bg");
    expect(sidebarSrc).toContain("hover:bg-cc-sidebar-hover");
  });
});
