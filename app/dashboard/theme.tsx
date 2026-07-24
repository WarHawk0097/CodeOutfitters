"use client";

// Dashboard-scoped theme system. Scopes every token override to the app frame's
// root element via data-cc-theme / data-cc-appearance, so the public marketing
// site (outside the /dashboard route group) is never affected. Preferences are
// persisted per-user in localStorage and applied after mount, keeping the first
// paint deterministic (server and initial client render agree on the default).
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const THEMES = ["command", "graphite", "indigo", "ocean", "amber", "rose"] as const;
export type Theme = (typeof THEMES)[number];

export const APPEARANCES = ["system", "light", "dark"] as const;
export type Appearance = (typeof APPEARANCES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  command: "Command Center",
  graphite: "Graphite",
  indigo: "Indigo",
  ocean: "Ocean",
  amber: "Amber",
  rose: "Rose",
};

export const APPEARANCE_LABELS: Record<Appearance, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const THEME_KEY = "codeoutfitters.command-center.theme";
const APPEARANCE_KEY = "codeoutfitters.command-center.appearance";

type ThemeContextValue = {
  theme: Theme;
  appearance: Appearance;
  /** appearance with "system" resolved to the current OS preference. */
  resolvedAppearance: "light" | "dark";
  setTheme: (t: Theme) => void;
  setAppearance: (a: Appearance) => void;
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

export function DashboardThemeRoot({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  // Deterministic defaults so SSR and first client render match; stored prefs
  // are applied in the effect below (post-hydration attr change is not a mismatch).
  const [theme, setThemeState] = useState<Theme>("command");
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [osDark, setOsDark] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const storedAppearance = localStorage.getItem(APPEARANCE_KEY);
    if (isTheme(storedTheme)) setThemeState(storedTheme);
    if (isAppearance(storedAppearance)) setAppearanceState(storedAppearance);
    setOsDark(systemDark());
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setOsDark(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* private mode / disabled storage: keep in-memory only */
    }
  };
  const setAppearance = (a: Appearance) => {
    setAppearanceState(a);
    try {
      localStorage.setItem(APPEARANCE_KEY, a);
    } catch {
      /* ignore */
    }
  };

  const resolvedAppearance: "light" | "dark" =
    appearance === "system" ? (osDark ? "dark" : "light") : appearance;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, appearance, resolvedAppearance, setTheme, setAppearance }),
    [theme, appearance, resolvedAppearance],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className={className} data-cc-theme={theme} data-cc-appearance={resolvedAppearance}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
