// Domain-split regression guard.
//
// The public site, /login and /dashboard must all be served from one origin.
// A previous release had the repaired dashboard living on a separate Vercel
// preview hostname, so this file exists to make that class of split fail the
// build rather than fail in production: no product source file may reference a
// deployment hostname, and every internal navigation must stay a root-relative
// path.
//
// Source-level assertions (rather than rendered markup) are deliberate — the
// point is that the *string* never re-enters the shipped bundle, wherever it is
// written. This matches the repo's established convention for client wiring
// that cannot be rendered in a node environment.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { safeReturnTo } from "@/lib/auth/return-url";
import { destinationForAuthState } from "@/lib/auth/auth-state";
import { CANONICAL_ORIGIN } from "@/lib/routing/public-origin";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

// Everything that is compiled into the shipped app. `command-center/` is the
// separate monorepo (its own vitest); `work/`, `docs/` and the review archives
// are prose and QA scripts, not product source.
const SOURCE_DIRS = ["app", "components", "lib", "hooks", "mocks", "workers", "ai"];
const SOURCE_FILES = ["middleware.ts", "next.config.mjs"];

function collect(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collect(full, out);
      continue;
    }
    if (!/\.(ts|tsx|mjs|js|jsx)$/.test(entry)) continue;
    // Test files legitimately name the forbidden hostnames in order to assert
    // their absence.
    if (/\.test\.(ts|tsx)$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

const productSources = [
  ...SOURCE_DIRS.flatMap((d) => collect(join(repoRoot, d))),
  ...SOURCE_FILES.map((f) => join(repoRoot, f)),
].map((path) => ({ path: path.slice(repoRoot.length).replace(/\\/g, "/"), src: readFileSync(path, "utf8") }));

const navbarSrc = readFileSync(join(repoRoot, "components/navbar.tsx"), "utf8");
const sidebarSrc = readFileSync(join(repoRoot, "lib/command-center/ui/sidebar.tsx"), "utf8");
const shellHeaderSrc = readFileSync(join(repoRoot, "lib/command-center/ui/shell-header.tsx"), "utf8");
const loginFormSrc = readFileSync(join(repoRoot, "app/login/login-form.tsx"), "utf8");
const loginActionsSrc = readFileSync(join(repoRoot, "app/login/actions.ts"), "utf8");
const authMiddlewareSrc = readFileSync(join(repoRoot, "lib/supabase/middleware.ts"), "utf8");

describe("one production origin", () => {
  it("collects the product sources it claims to guard", () => {
    // A silent empty sweep would make every assertion below vacuous.
    expect(productSources.length).toBeGreaterThan(50);
  });

  // The canonical origin is declared in exactly one module, and that module is the
  // only place in product source the hostname may be written. The ban is unchanged
  // everywhere else — a second file naming a hostname is still a failure.
  const ORIGIN_MODULE = "lib/routing/public-origin.ts";

  it("declares the canonical origin in one module and nowhere else", () => {
    const declaring = productSources.find(({ path }) => path === ORIGIN_MODULE);
    expect(declaring, ORIGIN_MODULE).toBeDefined();
    expect(declaring!.src).toContain(`export const CANONICAL_ORIGIN = "${CANONICAL_ORIGIN}"`);
    expect(CANONICAL_ORIGIN).toBe("https://codeoutfitters.vercel.app");
  });

  it("no other product source references a Vercel deployment hostname", () => {
    const offenders = productSources
      .filter(({ path }) => path !== ORIGIN_MODULE)
      .filter(({ src }) => /[\w-]+\.vercel\.app/.test(src))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it("no product source references a preview-project hostname", () => {
    const offenders = productSources
      .filter(({ src }) => /warhawk0097s-projects/.test(src))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it("no product source hardcodes an absolute URL for /login or /dashboard", () => {
    const offenders = productSources
      .filter(({ src }) => /https?:\/\/[^\s"'`]*\/(login|dashboard)\b/.test(src))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it("no product source navigates to a localhost or Supabase-CLI port", () => {
    const offenders = productSources
      .filter(({ src }) => /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/(login|dashboard)/.test(src))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});

describe("public site -> /login", () => {
  it("the desktop navbar Sign in is exactly /login", () => {
    expect(navbarSrc).toMatch(/className="site-nav-signin" href="\/login">Sign in/);
  });

  it("the mobile menu Sign in is exactly /login", () => {
    expect(navbarSrc).toMatch(/<Link href="\/login" onClick=\{\(\)=>setOpen\(false\)\}>Sign in<\/Link>/);
  });

  it("both Sign in entries are root-relative, so neither can leave the origin", () => {
    const hrefs = navbarSrc.match(/href="[^"]*login[^"]*"/g) ?? [];
    expect(hrefs).toEqual(['href="/login"', 'href="/login"']);
  });
});

describe("/login -> /dashboard", () => {
  it("demo sign-in opens the same-origin /dashboard path", () => {
    expect(loginFormSrc).toContain('window.location.assign("/dashboard")');
    // No origin may be prepended to that navigation.
    expect(loginFormSrc).not.toMatch(/window\.location\.assign\(\s*[`"']https?:/);
  });

  it("live sign-in defaults to /dashboard through the validated returnTo", () => {
    expect(loginActionsSrc).toContain("safeReturnTo(");
    // The destination is now membership-gated: a member goes to the validated
    // returnTo, everyone else to /access-pending. Both stay same-origin.
    expect(loginActionsSrc).toContain("redirect(await postAuthDestination(returnTo))");
    expect(destinationForAuthState("authenticated_member", "/dashboard")).toBe("/dashboard");
    expect(destinationForAuthState("authenticated_without_membership", "/dashboard")).toBe(
      "/access-pending",
    );
    expect(safeReturnTo(undefined)).toBe("/dashboard");
  });

  it("the dashboard guard sends unauthenticated users to /login on the same origin", () => {
    // nextUrl.clone() keeps the request's own origin; a string URL would not.
    expect(authMiddlewareSrc).toContain("request.nextUrl.clone()");
    expect(authMiddlewareSrc).toContain("loginUrl.pathname = '/login'");
  });

  it("returnTo cannot be used to leave the origin", () => {
    expect(safeReturnTo("https://evil.example/dashboard")).toBe("/dashboard");
    expect(safeReturnTo("//evil.example")).toBe("/dashboard");
    expect(safeReturnTo("/\\evil.example")).toBe("/dashboard");
    expect(safeReturnTo("/dashboard/settings")).toBe("/dashboard/settings");
  });
});

describe("/dashboard -> public site", () => {
  it("the desktop View website action is a relative root link in a safe new tab", () => {
    expect(shellHeaderSrc).toMatch(/href="\/"\s+target="_blank"\s+rel="noopener noreferrer"/);
  });

  it("both sidebar View website actions are relative root links in a safe new tab", () => {
    const anchors = sidebarSrc.match(/href="\/"[\s\S]{0,120}?rel="noopener noreferrer"/g) ?? [];
    // Expanded sidebar + mobile drawer.
    expect(anchors).toHaveLength(2);
  });

  it("no dashboard chrome links back to an absolute site URL", () => {
    for (const src of [shellHeaderSrc, sidebarSrc]) {
      expect(src).not.toMatch(/href=\{?["'`]https?:\/\//);
    }
  });
});
