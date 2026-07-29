// The frozen canonical-URL policy, as executable facts.
//
// Core v1 is served to clients on one origin. Two classes of regression are guarded
// here: the resolver handing out the wrong origin for an environment, and a hostname
// re-entering source somewhere the constant should have been imported instead.
//
// The redirect assertions run against the pure function the middleware calls rather
// than against a rendered request, because that is where the decision lives; the
// middleware wiring itself is asserted from source, and neither is a substitute for
// the production HTTP check in the release record.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_HOST,
  CANONICAL_ORIGIN,
  DEVELOPMENT_ORIGIN,
  canonicalHostRedirect,
  isRedirectExempt,
  publicOrigin,
} from "./public-origin";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");

const PRODUCTION = { VERCEL_ENV: "production" } as const;
const PREVIEW = {
  VERCEL_ENV: "preview",
  VERCEL_URL: "codeoutfitters-git-fix-branch-warhawk0097s-projects.vercel.app",
} as const;
const SYSTEM_ALIAS = "codeoutfitters-warhawk0097s-projects.vercel.app";

describe("the canonical origin", () => {
  it("is the project domain, not a per-deployment hostname", () => {
    expect(CANONICAL_ORIGIN).toBe("https://codeoutfitters.vercel.app");
    expect(CANONICAL_HOST).toBe("codeoutfitters.vercel.app");
    expect(new URL(CANONICAL_ORIGIN).protocol).toBe("https:");
  });

  it("resolves to itself in production, whatever else the environment says", () => {
    expect(publicOrigin({ ...PRODUCTION, VERCEL_URL: SYSTEM_ALIAS })).toBe(CANONICAL_ORIGIN);
    expect(
      publicOrigin({ ...PRODUCTION, NEXT_PUBLIC_SITE_URL: "https://elsewhere.example" }),
    ).toBe(CANONICAL_ORIGIN);
  });

  it("resolves a preview to its own deployment URL", () => {
    expect(publicOrigin(PREVIEW)).toBe(`https://${PREVIEW.VERCEL_URL}`);
  });

  it("resolves development to localhost unless a site URL is configured", () => {
    expect(publicOrigin({})).toBe(DEVELOPMENT_ORIGIN);
    expect(publicOrigin({ NEXT_PUBLIC_SITE_URL: "not a url" })).toBe(DEVELOPMENT_ORIGIN);
    expect(publicOrigin({ NEXT_PUBLIC_SITE_URL: "http://localhost:4000/" })).toBe(
      "http://localhost:4000",
    );
  });

  it("never derives an absolute URL from a forwarded host", () => {
    // The resolver takes an environment, not a request: there is no header to trust.
    const src = read("lib/routing/public-origin.ts");
    expect(src).not.toContain("x-forwarded-host");
    expect(publicOrigin.length).toBeLessThanOrEqual(1);
  });
});

describe("the production host redirect", () => {
  // 1
  it("leaves the canonical production host unchanged", () => {
    expect(
      canonicalHostRedirect({ host: CANONICAL_HOST, pathname: "/dashboard", env: PRODUCTION }),
    ).toBeNull();
    expect(
      canonicalHostRedirect({
        host: `${CANONICAL_HOST}:443`,
        pathname: "/",
        env: PRODUCTION,
      }),
    ).toBeNull();
  });

  // 2
  it("redirects a production system alias to the canonical origin", () => {
    expect(
      canonicalHostRedirect({ host: SYSTEM_ALIAS, pathname: "/dashboard", env: PRODUCTION }),
    ).toBe(`${CANONICAL_ORIGIN}/dashboard`);
  });

  // 3
  it("preserves the path", () => {
    for (const path of [
      "/",
      "/login",
      "/dashboard/my-work",
      "/dashboard/leads",
      "/dashboard/pipeline",
      "/dashboard/meetings",
      "/dashboard/proposals",
      "/dashboard/follow-ups",
      "/dashboard/email-activity",
      "/dashboard/settings",
      "/dashboard/team",
    ]) {
      expect(canonicalHostRedirect({ host: SYSTEM_ALIAS, pathname: path, env: PRODUCTION })).toBe(
        `${CANONICAL_ORIGIN}${path}`,
      );
    }
  });

  // 4
  it("preserves the query string", () => {
    expect(
      canonicalHostRedirect({
        host: SYSTEM_ALIAS,
        pathname: "/dashboard",
        search: "?view=today",
        env: PRODUCTION,
      }),
    ).toBe(`${CANONICAL_ORIGIN}/dashboard?view=today`);
  });

  // 5
  it("does not redirect a preview deployment or a branch alias", () => {
    for (const host of [PREVIEW.VERCEL_URL, "codeoutfitters-lype16rtv-warhawk0097s-projects.vercel.app"]) {
      expect(canonicalHostRedirect({ host, pathname: "/dashboard", env: PREVIEW })).toBeNull();
    }
  });

  // 6
  it("does not redirect local development", () => {
    expect(canonicalHostRedirect({ host: "localhost:3000", pathname: "/dashboard", env: {} })).toBeNull();
    expect(
      canonicalHostRedirect({
        host: "127.0.0.1:3000",
        pathname: "/dashboard",
        env: { VERCEL_ENV: "development" },
      }),
    ).toBeNull();
  });

  // 7
  it("does not touch the API surface", () => {
    expect(isRedirectExempt("/api/leads")).toBe(true);
    expect(
      canonicalHostRedirect({ host: SYSTEM_ALIAS, pathname: "/api/inquiries", env: PRODUCTION }),
    ).toBeNull();
    // The middleware matcher excludes it outright as well.
    expect(read("middleware.ts")).toContain("(?!api/|_next/|_vercel/");
  });

  // 8
  it("leaves the auth callback intact", () => {
    expect(
      canonicalHostRedirect({
        host: SYSTEM_ALIAS,
        pathname: "/auth/callback",
        search: "?code=abc&returnTo=%2Fdashboard",
        env: PRODUCTION,
      }),
    ).toBeNull();
  });

  // 9
  it("leaves the secure proposal route intact", () => {
    expect(
      canonicalHostRedirect({ host: SYSTEM_ALIAS, pathname: "/proposal/token-123", env: PRODUCTION }),
    ).toBeNull();
  });

  // 10
  it("cannot loop: the target is always already canonical", () => {
    const target = canonicalHostRedirect({
      host: SYSTEM_ALIAS,
      pathname: "/dashboard",
      search: "?view=today",
      env: PRODUCTION,
    })!;
    const url = new URL(target);
    expect(url.host).toBe(CANONICAL_HOST);
    expect(
      canonicalHostRedirect({
        host: url.host,
        pathname: url.pathname,
        search: url.search,
        env: PRODUCTION,
      }),
    ).toBeNull();
  });

  it("is wired into the middleware as a permanent redirect", () => {
    const src = read("middleware.ts");
    expect(src).toContain("canonicalHostRedirect");
    expect(src).toContain("NextResponse.redirect(canonical, 308)");
    // Session work stays scoped to the auth-bearing paths even though the matcher is wider.
    expect(src).toContain("if (needsSession(request.nextUrl.pathname)) return updateSession(request)");
  });
});

describe("the frozen URL policy in source", () => {
  it("points canonical metadata, the sitemap and robots at the canonical origin", () => {
    expect(read("app/layout.tsx")).toContain("metadataBase: new URL(CANONICAL_ORIGIN)");
    const sitemap = read("app/sitemap.ts");
    expect(sitemap).toContain("CANONICAL_ORIGIN");
    expect(sitemap).not.toContain("codeoutfitters.com");
    const robots = read("app/robots.ts");
    expect(robots).toContain("${CANONICAL_ORIGIN}/sitemap.xml");
    expect(robots).not.toContain("codeoutfitters.com");
    expect(read("app/(public)/layout.tsx")).toContain("url: CANONICAL_ORIGIN");
  });

  it("indexes no authenticated or client-confidential route", async () => {
    const { default: sitemap } = await import("../../app/sitemap");
    const urls = sitemap().map((entry) => String(entry.url));
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith(`${CANONICAL_ORIGIN}`), url).toBe(true);
      expect(url.includes("/dashboard"), url).toBe(false);
      expect(url.includes("/proposal"), url).toBe(false);
    }
  });

  it("builds the password-reset link from the resolver, not the request host", () => {
    const src = read("app/forgot-password/actions.ts");
    expect(src).toContain("publicOrigin()");
    expect(src).not.toContain("x-forwarded-host");
  });

  it("has no second hostname for the same product", () => {
    for (const path of [
      "middleware.ts",
      "app/layout.tsx",
      "app/sitemap.ts",
      "app/robots.ts",
      "app/(public)/layout.tsx",
      "lib/routing/public-origin.ts",
    ]) {
      const src = read(path);
      expect(/https?:\/\/m\./.test(src), path).toBe(false);
      expect(src.includes("m.codeoutfitters"), path).toBe(false);
    }
  });

  it("writes no duplicated dashboard segment", () => {
    for (const path of ["middleware.ts", "lib/routing/public-origin.ts", "app/sitemap.ts"]) {
      expect(read(path).includes("/dashboard/dashboard"), path).toBe(false);
    }
  });
});
