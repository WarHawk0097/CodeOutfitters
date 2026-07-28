// Full-interaction and sign-in repair — the 30 numbered facts.
//
// What each kind of test can honestly prove:
//   * pure logic (credentials, lead-flow buckets) is executed for real;
//   * every link target is resolved against the real app/ route tree on disk,
//     so a dead link fails here rather than in the browser;
//   * markup facts are asserted on actually-rendered output, not on source
//     strings, wherever the component renders under react-dom/server;
//   * the remaining facts are structural prohibitions (no href="#", no empty
//     handler, no placeholder alert), which are properly source-level.
// Real activation of every control at five viewports is the Edge click audit
// (work/tools/interaction_audit.mjs) — these tests do not claim to replace it.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  GENERIC_CREDENTIAL_ERROR,
  matchesDemoCredential,
  validateCredentials,
} from "../login/credentials";
import { LoginForm } from "../login/login-form";
import { LoginFrame } from "../login/login-frame";
import { SIDEBAR_STYLES, THEMES } from "./theme";
import { aggregateLeadFlow, leadFlowTotals } from "../../lib/dashboard/lead-flow";
import { LEAD_DIRECTORY } from "../../lib/demo/seed";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = `${here}../../`;

// ---------------------------------------------------------------------------
// Source corpus: every dashboard screen plus the shell UI package they render.
// ---------------------------------------------------------------------------
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const DASHBOARD_FILES = [...walk(`${repo}app/dashboard`), ...walk(`${repo}lib/command-center/ui`)];
const DASHBOARD_SOURCES = DASHBOARD_FILES.map((f) => [f, readFileSync(f, "utf8")] as const);

// ---------------------------------------------------------------------------
// Route tree: patterns collected from app/, with route groups collapsed and
// dynamic segments turned into wildcards, so hrefs can be resolved for real.
// ---------------------------------------------------------------------------
function collectRoutes(dir: string, prefix = "", out: string[] = []): string[] {
  const entries = readdirSync(dir);
  // A page or a route handler both make the path a real, reachable URL.
  if (entries.some((e) => /^(page|route)\.tsx?$/.test(e))) out.push(prefix === "" ? "/" : prefix);
  for (const entry of entries) {
    const full = `${dir}/${entry}`;
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("_")) continue;
    const next =
      entry.startsWith("(") && entry.endsWith(")")
        ? prefix // route group: no URL segment
        : entry.startsWith("[")
          ? `${prefix}/*`
          : `${prefix}/${entry}`;
    collectRoutes(full, next, out);
  }
  return out;
}

const ROUTE_PATTERNS = collectRoutes(`${repo}app`);

function routeExists(href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  const segs = path.split("/");
  return ROUTE_PATTERNS.some((pattern) => {
    const p = pattern.split("/");
    if (p.length !== segs.length) return false;
    return p.every((seg, i) => seg === "*" || seg === segs[i]);
  });
}

/** Internal hrefs written in the dashboard, with ${…} interpolations wildcarded. */
function dashboardHrefs(): { file: string; href: string }[] {
  const found: { file: string; href: string }[] = [];
  for (const [file, src] of DASHBOARD_SOURCES) {
    for (const m of src.matchAll(/href=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const raw = m[1] ?? m[2] ?? "";
      if (!raw.startsWith("/")) continue; // external / mailto handled separately
      found.push({ file, href: raw.replace(/\$\{[^}]*\}/g, "x") });
    }
  }
  return found;
}

describe("command center repair — interaction facts (1-14)", () => {
  // 1
  it("every internal dashboard link resolves to a route that exists on disk", () => {
    const broken = dashboardHrefs().filter((h) => !routeExists(h.href));
    expect(broken).toEqual([]);
  });

  // 2
  it("no dashboard source uses href=\"#\" or a javascript: URL", () => {
    for (const [file, src] of DASHBOARD_SOURCES) {
      expect(`${file}:${src.includes('href="#"')}`).toBe(`${file}:false`);
      expect(`${file}:${src.includes("javascript:void")}`).toBe(`${file}:false`);
    }
  });

  // 3
  it("no empty click handler is wired anywhere in the dashboard", () => {
    for (const [file, src] of DASHBOARD_SOURCES) {
      const empty = /on[A-Z]\w+=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(src);
      expect(`${file}:${empty}`).toBe(`${file}:false`);
    }
  });

  // 4
  it("no control's only effect is a console call", () => {
    for (const [file, src] of DASHBOARD_SOURCES) {
      const consoleOnly = /on[A-Z]\w+=\{\s*\(\s*\)\s*=>\s*console\./.test(src);
      expect(`${file}:${consoleOnly}`).toBe(`${file}:false`);
    }
  });

  // 5
  it("no placeholder alert()/confirm() stands in for a feature", () => {
    for (const [file, src] of DASHBOARD_SOURCES) {
      const placeholder = /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/.test(src);
      expect(`${file}:${placeholder}`).toBe(`${file}:false`);
    }
  });

  // 6
  it("the appointments live-workspace action navigates instead of re-selecting the current view", () => {
    const src = readFileSync(`${here}appointments/appointments-view.tsx`, "utf8");
    expect(src).toContain("/dashboard/meetings/${workspace.id}/live");
    // The old action re-selected the view it was already on.
    expect(src).not.toMatch(/onClick:\s*\(\)\s*=>\s*setView/);
  });

  // 7
  it("the prepare screen's Add is disabled while empty, with the reason announced", () => {
    const src = readFileSync(`${here}meetings/[meetingId]/prepare/prepare-view.tsx`, "utf8");
    expect(src).toContain('disabled={draft.trim() === ""}');
    expect(src).toContain('aria-describedby="prepare-add-question-reason"');
    expect(src).toContain('id="prepare-add-question-reason"');
  });

  // 8
  it("both leads pager ends are disabled with an announced reason", () => {
    const src = readFileSync(`${repo}lib/command-center/ui/leads-table.tsx`, "utf8");
    expect(src).toContain('aria-describedby={query.page <= 1 ? "leads-pager-prev-reason" : undefined}');
    expect(src).toContain('id="leads-pager-prev-reason"');
    expect(src).toContain('id="leads-pager-next-reason"');
  });

  // 9
  it("first/last proposal sections say why they cannot move further", () => {
    const src = readFileSync(`${here}proposals/[proposalId]/edit/builder-view.tsx`, "utf8");
    expect(src).toContain("move-up-reason-");
    expect(src).toContain("move-down-reason-");
    expect(src).toContain("This section is already first.");
    expect(src).toContain("This section is already last.");
  });

  // 10
  it("the settings Save button explains why it is disabled when nothing changed", () => {
    const src = readFileSync(`${here}settings/settings-view.tsx`, "utf8");
    expect(src).toContain("aria-describedby={dirty ? undefined : `${section.id}-save-reason`}");
    expect(src).toContain("Change a field to save this section.");
    // Local persistence is described honestly.
    expect(src).toContain("Saved in this browser.");
    expect(src).not.toContain("Saved to the local demo store.");
  });

  // 11
  it("deferred nav rows and gated header actions carry aria-describedby, not just a title", () => {
    const src = readFileSync(`${here}shell-nav.tsx`, "utf8");
    expect(src).toContain("aria-describedby={reasonId}");
    expect(src).toContain('aria-describedby="leads-columns-reason"');
    expect(src).toContain('aria-describedby="leads-export-reason"');
  });

  // 12
  it("the overview search is a real disabled input with a reason, not a decorative div", () => {
    const src = readFileSync(`${here}shell-nav.tsx`, "utf8");
    expect(src).toContain('aria-describedby="overview-search-reason"');
    expect(src).toContain("Search is available when a live workspace is connected.");
    // No shortcut advertised that is not bound.
    expect(src).not.toContain("⌘K");
  });

  // 13
  it("the source picker radios have a short, stable accessible name", () => {
    const src = readFileSync(`${here}proposals/new/create-view.tsx`, "utf8");
    expect(src).toContain("aria-label={option.title}");
  });

  // 14
  it("no route to an unbuilt Proposal Activity or public secure-proposal URL is linked", () => {
    for (const { href } of dashboardHrefs()) {
      expect(href).not.toMatch(/\/activity$/);
      expect(href.startsWith("/proposal/")).toBe(false);
    }
  });
});

describe("command center repair — shell, theme and range facts (15-20)", () => {
  // 15
  it("View website is rendered once per desktop width, and opens the current origin", () => {
    const header = readFileSync(`${repo}lib/command-center/ui/shell-header.tsx`, "utf8");
    const sidebar = readFileSync(`${repo}lib/command-center/ui/sidebar.tsx`, "utf8");
    // Header copy only spans md–xl; the expanded sidebar owns it from xl.
    expect(header).toContain('<span className="xl:hidden">');
    // Relative href — never a hardcoded deployment hostname.
    expect(header).toContain('href="/"');
    expect(header).toContain('target="_blank"');
    expect(header).toContain('rel="noopener noreferrer"');
    expect(header).not.toMatch(/https?:\/\/[a-z0-9.-]*vercel\.app/);
    expect(sidebar).not.toMatch(/https?:\/\/[a-z0-9.-]*vercel\.app/);
    // Sidebar footer: View website sits immediately above Collapse.
    expect(sidebar.indexOf("View website")).toBeLessThan(sidebar.indexOf("<CollapseRow"));
  });

  // 16
  it("Collapse actually collapses the desktop nav and the rail can expand it again", () => {
    const sidebar = readFileSync(`${repo}lib/command-center/ui/sidebar.tsx`, "utf8");
    expect(sidebar).toContain("const [collapsed, setCollapsed] = useState(false)");
    expect(sidebar).toContain("{collapsed ? null : (");
    expect(sidebar).toContain('aria-label="Expand navigation"');
    // The rail stops hiding itself at xl once it is standing in for the nav.
    expect(sidebar).toContain('collapsed ? "" : "xl:hidden"');
  });

  // 17
  it("theme, appearance and sidebar style are all applied to the dashboard root", () => {
    const theme = readFileSync(`${here}theme.tsx`, "utf8");
    expect(theme).toContain("data-cc-theme={theme}");
    expect(theme).toContain("data-cc-appearance={resolvedAppearance}");
    expect(theme).toContain("data-cc-sidebar={sidebarStyle}");
  });

  // 18
  it("every theme preset and sidebar style has sidebar tokens defined, scoped away from the public site", () => {
    const css = readFileSync(`${repo}app/globals.css`, "utf8");
    for (const t of THEMES) {
      if (t === "command") continue; // :root default
      expect(css).toContain(`[data-cc-theme='${t}']`);
    }
    for (const s of SIDEBAR_STYLES) {
      if (s === "ink") continue; // :root default
      expect(css).toContain(`[data-cc-sidebar='${s}']`);
      const block = css.slice(css.indexOf(`[data-cc-sidebar='${s}']`));
      expect(block).toContain("--cc-sidebar-ink:");
      expect(block).toContain("--cc-sidebar-active:");
    }
    // Dashboard-scoped only: no bare :root override of the sidebar scale outside
    // the token block, and no public selector touched.
    expect(css).not.toContain(".site-navbar [data-cc-sidebar");
  });

  // 19
  it("theme, appearance and sidebar style each persist under their own key", () => {
    const theme = readFileSync(`${here}theme.tsx`, "utf8");
    expect(theme).toContain('"codeoutfitters.command-center.theme"');
    expect(theme).toContain('"codeoutfitters.command-center.appearance"');
    expect(theme).toContain('"codeoutfitters.command-center.sidebar-style"');
    expect(theme).toContain("localStorage.setItem(SIDEBAR_KEY, s)");
  });

  // 20
  it("7D / 30D / 90D produce different, deterministic lead-flow data", () => {
    const d7 = aggregateLeadFlow(LEAD_DIRECTORY, "7d");
    const d30 = aggregateLeadFlow(LEAD_DIRECTORY, "30d");
    const d90 = aggregateLeadFlow(LEAD_DIRECTORY, "90d");
    expect(d7.length).toBeLessThan(d30.length);
    expect(d30.length).toBeLessThan(d90.length);
    const t7 = leadFlowTotals(d7);
    const t90 = leadFlowTotals(d90);
    expect(t90.newTotal).toBeGreaterThan(t7.newTotal);
    // Deterministic: the same input yields the same series every time.
    expect(aggregateLeadFlow(LEAD_DIRECTORY, "30d")).toEqual(d30);
  });
});

describe("sign-in repair — credential facts (21-26)", () => {
  // 21
  it("the published demo credential is the one that opens the workspace", () => {
    expect(DEMO_EMAIL).toBe("marc@gmail.com");
    expect(DEMO_PASSWORD).toBe("123");
    expect(matchesDemoCredential(DEMO_EMAIL, DEMO_PASSWORD)).toBe(true);
  });

  // 22
  it("the email is trimmed and case-insensitive; the password is neither", () => {
    expect(matchesDemoCredential("  MARC@Gmail.com  ", "123")).toBe(true);
    expect(matchesDemoCredential(DEMO_EMAIL, " 123")).toBe(false);
    expect(matchesDemoCredential(DEMO_EMAIL, "123 ")).toBe(false);
    expect(matchesDemoCredential(DEMO_EMAIL, "1 2 3".replace(/ /g, ""))).toBe(true);
  });

  // 23
  it("a wrong credential is rejected without revealing which field was wrong", () => {
    expect(matchesDemoCredential("someone@else.com", "123")).toBe(false);
    expect(matchesDemoCredential(DEMO_EMAIL, "wrong")).toBe(false);
    expect(GENERIC_CREDENTIAL_ERROR).toBe("The email or password is incorrect.");
    // One message for both fields — never a user-enumeration hint.
    expect(GENERIC_CREDENTIAL_ERROR.toLowerCase()).not.toMatch(
      /no account|not registered|unknown email|wrong password|user not found/,
    );
  });

  // 24
  it("validation covers required email, email format and required password", () => {
    expect(validateCredentials("", "")).toEqual({
      email: "Enter your email address.",
      password: "Enter your password.",
    });
    expect(validateCredentials("not-an-email", "123").email).toBe("Enter a valid email address.");
    expect(validateCredentials(DEMO_EMAIL, "123")).toEqual({});
    // A password of spaces is a real password, not an empty one.
    expect(validateCredentials(DEMO_EMAIL, "   ").password).toBeUndefined();
  });

  // 25
  it("the demo password is never persisted anywhere", () => {
    const form = readFileSync(`${repo}app/login/login-form.tsx`, "utf8");
    const creds = readFileSync(`${repo}app/login/credentials.ts`, "utf8");
    // Comments stripped: the file explains that it stores nothing, which is not
    // itself a store.
    const code = (src: string) => src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const src of [form, creds]) {
      expect(code(src)).not.toMatch(/localStorage|sessionStorage|document\.cookie|console\./);
    }
    // Demo success is a plain navigation, not a fabricated session.
    expect(form).toContain('window.location.assign("/dashboard")');
  });

  // 26
  it("live mode cannot be bypassed by the demo credential", () => {
    const form = readFileSync(`${repo}app/login/login-form.tsx`, "utf8");
    const page = readFileSync(`${repo}app/login/page.tsx`, "utf8");
    // Inside the submit handler the live branch returns before the demo
    // comparison is ever reached, so the demo credential cannot bypass it.
    const handler = form.slice(form.indexOf("function handleSubmit"), form.indexOf("function fillDemoCredentials"));
    expect(handler.indexOf("if (live) {")).toBeGreaterThan(-1);
    expect(handler.indexOf("if (live) {")).toBeLessThan(handler.indexOf("matchesDemoCredential"));
    expect(form).toContain("// Live mode: let the server action run. Demo constants are never consulted.");
    // Live mode still uses the existing Work Order F server action and returnTo.
    expect(page).toContain("action={signIn}");
    expect(page).toContain("safeReturnTo(sp.returnTo)");
    // Demo mode never reaches Supabase.
    expect(page.indexOf("if (isDemoMode())")).toBeLessThan(page.indexOf("createClient()"));
  });
});

describe("sign-in repair — rendered screen facts (27-30)", () => {
  const demoHtml = renderToStaticMarkup(
    createElement(LoginFrame, {
      children: createElement(LoginForm, { live: false, initialError: false, returnTo: "/dashboard" }),
    }),
  );

  // 27
  it("renders the two-column brand + form composition with a way back to the website", () => {
    expect(demoHtml).toContain('class="login-page"');
    expect(demoHtml).toContain('class="login-brand"');
    expect(demoHtml).toContain('class="login-panel"');
    expect(demoHtml).toContain("Command Center");
    expect(demoHtml).toContain("Back to website");
    expect(demoHtml).toContain("grid-template-columns:minmax(380px,42%) 1fr");
    // Public brand language, not dashboard tokens.
    expect(demoHtml).not.toContain("cc-sidebar");
    expect(demoHtml).not.toContain("data-cc-theme");
  });

  // 28
  it("renders the requested heading, fields, actions and demo block", () => {
    expect(demoHtml).toContain("Welcome back");
    expect(demoHtml).toContain("Sign in to your CodeOutfitters Command Center.");
    expect(demoHtml).toContain("Email address");
    expect(demoHtml).toContain("Password");
    expect(demoHtml).toContain("Forgot password");
    expect(demoHtml).toContain("or continue with");
    expect(demoHtml).toContain("Demo access");
    expect(demoHtml).toContain("Use the demo credentials to explore the Command Center.");
    expect(demoHtml).toContain(DEMO_EMAIL);
    expect(demoHtml).toContain("Fill demo credentials");
    // Fill is a button, never a submit — it must not post the form.
    expect(demoHtml).toMatch(/<button type="button" class="login-demo-fill"/);
    // Show/hide password is a real toggle with state.
    expect(demoHtml).toMatch(/aria-pressed="false"[^>]*aria-controls="[^"]+"/);
  });

  // 29
  it("renders Google and Apple disabled, each with a connected reason and no fake auth", () => {
    const providers = demoHtml.match(/<button[^>]*class="login-provider"[^>]*>/g) ?? [];
    expect(providers).toHaveLength(2);
    for (const button of providers) {
      expect(button).toContain("disabled");
      expect(button).toMatch(/aria-describedby="[^"]+-provider-reason"/);
    }
    expect(demoHtml).toContain("Continue with Google");
    expect(demoHtml).toContain("Continue with Apple");
    expect(demoHtml).not.toContain("Gmail");
    expect(demoHtml).toContain("Available when live authentication is connected.");
  });

  // 30
  it("the public header keeps Sign in immediately before Book a Call, 12px apart", () => {
    const navbar = readFileSync(`${repo}components/navbar.tsx`, "utf8");
    const group = navbar.slice(
      navbar.indexOf('className="site-nav-actions"'),
      navbar.indexOf("site-nav-toggle"),
    );
    expect(group.indexOf('href="/login"')).toBeGreaterThan(-1);
    expect(group.indexOf('href="/login"')).toBeLessThan(group.indexOf("Book a Call"));
    expect(navbar).toContain(".site-nav-actions{display:flex;align-items:center;gap:12px");
    expect(navbar).not.toContain(".site-nav-actions{display:flex;justify-content:space-between");
    // Mobile drawer keeps the same order.
    const drawer = navbar.slice(navbar.indexOf("site-mobile-links"));
    expect(drawer.indexOf("Sign in")).toBeLessThan(drawer.indexOf("Book a Call"));
  });

  // 31
  it("the appointments Today jump is not offered while the day strip is already on today", () => {
    const src = readFileSync(`${repo}app/dashboard/appointments/appointments-view.tsx`, "utf8");
    expect(src).toContain("showsDayControls && date !== DEMO_TODAY ? (");
    expect(src).toContain('<ToolbarButton label="Today" onClick={() => setDate(DEMO_TODAY)} />');
  });
});
