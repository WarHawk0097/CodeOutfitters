"use client";

// Dashboard-scoped theme system. Scopes token overrides to the app frame's own
// root element via data-cc-theme / data-cc-appearance / data-cc-sidebar, so the
// public marketing site (outside the /dashboard route group) is never affected.
// Preferences are persisted per-browser in localStorage and applied on mount,
// keeping first paint deterministic (server and initial client render agree on
// the default).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// The curated palette set. `codeoutfitters` is the default and is the :root
// block in globals.css; the rest are attribute-scoped overrides.
export const THEMES = [
  "codeoutfitters",
  "forest-mist",
  "graphite-sage",
  "midnight-emerald",
  "ocean-slate",
  "warm-sand",
] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "codeoutfitters";

export const APPEARANCES = ["system", "light", "dark"] as const;
export type Appearance = (typeof APPEARANCES)[number];

export const DEFAULT_APPEARANCE: Appearance = "system";

export const APPEARANCE_LABELS: Record<Appearance, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export const THEME_LABELS: Record<Theme, string> = {
  codeoutfitters: "CodeOutfitters",
  "forest-mist": "Forest Mist",
  "graphite-sage": "Graphite Sage",
  "midnight-emerald": "Midnight Emerald",
  "ocean-slate": "Ocean Slate",
  "warm-sand": "Warm Sand",
};

export const THEME_DESCRIPTIONS: Record<Theme, string> = {
  codeoutfitters: "The public site's palette: ivory canvas, deep forest rail, emerald actions.",
  "forest-mist": "Sage-washed canvas over a near-black forest rail.",
  "graphite-sage": "Warm graphite structure with a restrained sage accent.",
  "midnight-emerald": "Neutral ivory canvas, midnight rail, bright emerald actions.",
  "ocean-slate": "Slate-blue structure with a teal-green accent.",
  "warm-sand": "Sand canvas, olive rail, deep olive-green actions.",
};

// Preview swatches for the Settings palette cards. Four tokens each — canvas,
// surface, accent, rail — so a card shows the actual palette rather than a
// single accent dot. Kept in sync with globals.css by
// app/dashboard/brand-system.test.ts.
export type ThemeSwatch = { canvas: string; surface: string; accent: string; rail: string };

export const THEME_SWATCHES: Record<Theme, ThemeSwatch> = {
  codeoutfitters: { canvas: "#f7f2ea", surface: "#ffffff", accent: "#17a063", rail: "#0e241a" },
  "forest-mist": { canvas: "#eef3ec", surface: "#ffffff", accent: "#0f8a55", rail: "#0a1c14" },
  "graphite-sage": { canvas: "#f2f1ee", surface: "#ffffff", accent: "#3f7d5c", rail: "#24262a" },
  "midnight-emerald": { canvas: "#f4f4f1", surface: "#ffffff", accent: "#0f9d63", rail: "#05100b" },
  "ocean-slate": { canvas: "#f1f4f5", surface: "#ffffff", accent: "#10826f", rail: "#16262c" },
  "warm-sand": { canvas: "#f6f0e3", surface: "#fffdf7", accent: "#5b7a37", rail: "#1e2015" },
};

// The sidebar is its own surface with its own colour scale, so its treatment is
// a separate choice from the accent palette. `match` means "no override" — the
// rail follows the active palette (and the dark appearance). The rest are
// explicit rails that survive a palette change.
export const SIDEBAR_STYLES = [
  "match",
  "forest",
  "warm-ink",
  "graphite",
  "midnight-emerald",
  "light-ivory",
] as const;
export type SidebarStyle = (typeof SIDEBAR_STYLES)[number];

export const DEFAULT_SIDEBAR_STYLE: SidebarStyle = "match";

export const SIDEBAR_STYLE_LABELS: Record<SidebarStyle, string> = {
  match: "Match palette",
  forest: "Deep Forest",
  "warm-ink": "Warm Ink",
  graphite: "Graphite",
  "midnight-emerald": "Midnight Emerald",
  "light-ivory": "Light Ivory",
};

// Rail preview colours for the Settings sidebar-style control. `match` has no
// fixed colour, so it previews as the live rail via the CSS variable.
export const SIDEBAR_STYLE_SWATCHES: Record<SidebarStyle, string> = {
  match: "var(--cc-sidebar-bg)",
  forest: "#0e241a",
  "warm-ink": "#1a1712",
  graphite: "#212429",
  "midnight-emerald": "#05100b",
  "light-ivory": "#fbf7ee",
};

const THEME_KEY = "codeoutfitters.command-center.palette";
const APPEARANCE_KEY = "codeoutfitters.command-center.appearance";
const SIDEBAR_KEY = "codeoutfitters.command-center.sidebar";

// Keys used before the brand refresh. Read once, migrated forward, then left
// alone — a stale key can never resurrect a palette that no longer exists.
const LEGACY_THEME_KEY = "codeoutfitters.command-center.theme";
const LEGACY_SIDEBAR_KEY = "codeoutfitters.command-center.sidebar-style";

// Old preset/sidebar ids mapped onto their nearest survivor. Anything absent
// from these maps (and from the current sets) falls back to the default, which
// is also what a corrupted value gets.
const LEGACY_THEME_VALUES: Record<string, Theme> = {
  command: "codeoutfitters",
  graphite: "graphite-sage",
  ocean: "ocean-slate",
  amber: "warm-sand",
  indigo: "midnight-emerald",
  rose: "codeoutfitters",
};

const LEGACY_SIDEBAR_VALUES: Record<string, SidebarStyle> = {
  ink: "forest",
  tinted: "match",
  light: "light-ivory",
};

type ThemeContextValue = {
  theme: Theme;
  appearance: Appearance;
  sidebarStyle: SidebarStyle;
  /** `appearance` with "system" resolved against the OS preference. */
  resolvedAppearance: "light" | "dark";
  /** True once stored preferences have been read (post-hydration). */
  hydrated: boolean;
  /** True when every preference is already at its shipped default. */
  isDefault: boolean;
  setTheme: (theme: Theme) => void;
  setAppearance: (appearance: Appearance) => void;
  setSidebarStyle: (style: SidebarStyle) => void;
  resetToDefaults: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useDashboardTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useDashboardTheme must be used within DashboardThemeRoot");
  return ctx;
}

function isTheme(v: string | null): v is Theme {
  return !!v && (THEMES as readonly string[]).includes(v);
}
function isAppearance(v: string | null): v is Appearance {
  return !!v && (APPEARANCES as readonly string[]).includes(v);
}
function isSidebarStyle(v: string | null): v is SidebarStyle {
  return !!v && (SIDEBAR_STYLES as readonly string[]).includes(v);
}

// Exported for the theme tests: a stored value is accepted only if it is
// current or has a known migration; everything else falls back safely.
export function readStoredTheme(current: string | null, legacy: string | null): Theme {
  if (isTheme(current)) return current;
  if (legacy && LEGACY_THEME_VALUES[legacy]) return LEGACY_THEME_VALUES[legacy];
  if (isTheme(legacy)) return legacy;
  return DEFAULT_THEME;
}

export function readStoredSidebarStyle(current: string | null, legacy: string | null): SidebarStyle {
  if (isSidebarStyle(current)) return current;
  if (legacy && LEGACY_SIDEBAR_VALUES[legacy]) return LEGACY_SIDEBAR_VALUES[legacy];
  if (isSidebarStyle(legacy)) return legacy;
  return DEFAULT_SIDEBAR_STYLE;
}

export function readStoredAppearance(current: string | null): Appearance {
  return isAppearance(current) ? current : DEFAULT_APPEARANCE;
}

// ponytail: matchMedia only, no ResizeObserver/theme lib. Adds a listener so a
// "System" user who flips OS dark mode updates live.
function systemDark(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode / quota — the preference stays in-memory for this session. */
  }
}

export function DashboardThemeRoot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  // Deterministic defaults so SSR and the first client render match; stored
  // prefs are applied in the effect below (a post-hydration attribute change is
  // not a mismatch).
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [appearance, setAppearanceState] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [sidebarStyle, setSidebarStyleState] = useState<SidebarStyle>(DEFAULT_SIDEBAR_STYLE);
  const [osDark, setOsDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let storedTheme: string | null = null;
    let storedAppearance: string | null = null;
    let storedSidebar: string | null = null;
    let legacyTheme: string | null = null;
    let legacySidebar: string | null = null;
    try {
      storedTheme = localStorage.getItem(THEME_KEY);
      storedAppearance = localStorage.getItem(APPEARANCE_KEY);
      storedSidebar = localStorage.getItem(SIDEBAR_KEY);
      legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
      legacySidebar = localStorage.getItem(LEGACY_SIDEBAR_KEY);
    } catch {
      /* ignore */
    }

    const nextTheme = readStoredTheme(storedTheme, legacyTheme);
    const nextSidebar = readStoredSidebarStyle(storedSidebar, legacySidebar);
    setThemeState(nextTheme);
    setAppearanceState(readStoredAppearance(storedAppearance));
    setSidebarStyleState(nextSidebar);

    // Migrate forward so the legacy key stops being consulted next visit.
    if (!isTheme(storedTheme) && legacyTheme) write(THEME_KEY, nextTheme);
    if (!isSidebarStyle(storedSidebar) && legacySidebar) write(SIDEBAR_KEY, nextSidebar);

    setOsDark(systemDark());
    setHydrated(true);

    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setOsDark(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    write(THEME_KEY, next);
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    write(APPEARANCE_KEY, next);
  }, []);

  const setSidebarStyle = useCallback((next: SidebarStyle) => {
    setSidebarStyleState(next);
    write(SIDEBAR_KEY, next);
  }, []);

  const resetToDefaults = useCallback(() => {
    setThemeState(DEFAULT_THEME);
    setAppearanceState(DEFAULT_APPEARANCE);
    setSidebarStyleState(DEFAULT_SIDEBAR_STYLE);
    write(THEME_KEY, DEFAULT_THEME);
    write(APPEARANCE_KEY, DEFAULT_APPEARANCE);
    write(SIDEBAR_KEY, DEFAULT_SIDEBAR_STYLE);
  }, []);

  const resolvedAppearance: "light" | "dark" =
    appearance === "system" ? (osDark ? "dark" : "light") : appearance;

  const isDefault =
    theme === DEFAULT_THEME &&
    appearance === DEFAULT_APPEARANCE &&
    sidebarStyle === DEFAULT_SIDEBAR_STYLE;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      appearance,
      sidebarStyle,
      resolvedAppearance,
      hydrated,
      isDefault,
      setTheme,
      setAppearance,
      setSidebarStyle,
      resetToDefaults,
    }),
    [
      theme,
      appearance,
      sidebarStyle,
      resolvedAppearance,
      hydrated,
      isDefault,
      setTheme,
      setAppearance,
      setSidebarStyle,
      resetToDefaults,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={className}
        data-cc-theme={theme}
        data-cc-appearance={resolvedAppearance}
        data-cc-sidebar={sidebarStyle}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
