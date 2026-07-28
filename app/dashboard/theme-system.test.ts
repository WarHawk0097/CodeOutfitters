// Dashboard theme-system tests (33-44). The theme system is scoped to the
// /dashboard frame via data attributes, persisted per-browser, and hydration-safe
// (server + first client render agree on the default). The public marketing site
// must be unaffected, so every override is attribute-scoped, never on :root.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { APPEARANCES, DashboardThemeRoot, THEMES } from "./theme";

const here = fileURLToPath(new URL(".", import.meta.url));
const css = readFileSync(`${here}../globals.css`, "utf8");
const themeSrc = readFileSync(`${here}theme.tsx`, "utf8");
const layoutSrc = readFileSync(`${here}layout.tsx`, "utf8");
const settingsSrc = readFileSync(`${here}settings/settings-view.tsx`, "utf8");

// children is a required prop, so it is passed in the props object rather than
// as a variadic argument — the variadic overload does not satisfy it.
const rootHtml = renderToStaticMarkup(
  createElement(DashboardThemeRoot, {
    className: "frame",
    children: createElement("span", null, "child"),
  }),
);

describe("dashboard theme system (tests 33-44)", () => {
  // 33
  it("exposes the six presets with Command Center as the default", () => {
    expect(THEMES).toEqual(["command", "graphite", "indigo", "ocean", "amber", "rose"]);
  });

  // 34
  it("exposes System, Light and Dark appearance modes", () => {
    expect(APPEARANCES).toEqual(["system", "light", "dark"]);
  });

  // 35
  it("persists preferences under stable, namespaced localStorage keys", () => {
    expect(themeSrc).toContain('"codeoutfitters.command-center.theme"');
    expect(themeSrc).toContain('"codeoutfitters.command-center.appearance"');
  });

  // 36
  it("defines a scoped token override for every non-default preset", () => {
    for (const preset of ["graphite", "indigo", "ocean", "amber", "rose"]) {
      expect(css).toContain(`[data-cc-theme='${preset}']`);
    }
  });

  // 37
  it("defines a scoped dark-appearance token override", () => {
    expect(css).toContain("[data-cc-appearance='dark']");
    expect(css).toContain("--cc-body-canvas: #0f1417");
  });

  // 38
  it("derives dark accent tints from the live accent so presets keep their hue", () => {
    expect(css).toContain("color-mix(in srgb, var(--cc-green)");
  });

  // 39
  it("the dashboard frame is wrapped in DashboardThemeRoot", () => {
    expect(layoutSrc).toContain("<DashboardThemeRoot");
    expect(layoutSrc).toContain("</DashboardThemeRoot>");
  });

  // 40
  it("the theme root emits both scope attributes", () => {
    expect(rootHtml).toContain("data-cc-theme=");
    expect(rootHtml).toContain("data-cc-appearance=");
    expect(rootHtml).toContain("child");
  });

  // 41
  it("first render is the deterministic default (command / light) for hydration safety", () => {
    expect(rootHtml).toContain('data-cc-theme="command"');
    expect(rootHtml).toContain('data-cc-appearance="light"');
  });

  // 42
  it("Settings renders a Theme card with appearance modes and theme swatches", () => {
    expect(settingsSrc).toContain("<ThemeSettingsCard />");
    expect(settingsSrc).toContain("APPEARANCES.map");
    expect(settingsSrc).toContain("THEMES.map");
    expect(settingsSrc).toContain('id="settings-appearance"');
  });

  // 43
  it("theme selection is keyboard-operable and announced textually, not colour-only", () => {
    expect(settingsSrc).toContain("aria-pressed={selected}");
    expect(settingsSrc).toContain("Selected");
    // Swatches are <button>s, so they are natively focusable/keyboard-operable.
    expect(settingsSrc).toContain('type="button"');
  });

  // 44
  it("theme overrides are attribute-scoped, never applied to :root (public site untouched)", () => {
    // No preset/appearance override may leak onto the global :root token block.
    expect(css).not.toContain(":root[data-cc-theme");
    expect(css).not.toMatch(/:root\s*\{[^}]*data-cc-appearance/);
  });
});
