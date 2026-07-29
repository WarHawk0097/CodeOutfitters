import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Live-authentication contract (Phase 11, tests 13-23 and 36-42).
//
// Supabase and next/navigation are mocked so the real decision code runs without
// a network or a router: what is asserted is OUR routing, OUR guards and OUR
// error handling, never a mocked-away happy path. `redirect()` throws in Next,
// so the mock throws too and the thrown destination is the assertion.

class RedirectSignal extends Error {
  constructor(public readonly destination: string) {
    super(`redirect:${destination}`);
  }
}

const { redirect, createClient, getDashboardContext, supabase } = vi.hoisted(() => {
  const supabase = {
    auth: {
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signInWithOAuth: vi.fn(async () => ({
        data: { url: "https://accounts.google.com/o/oauth2/auth?x=1" },
        error: null,
      })),
      exchangeCodeForSession: vi.fn(async () => ({ error: null })),
      getUser: vi.fn(async () => ({ data: { user: { id: "u1", email: "a@b.c" } } })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    rpc: vi.fn(async () => ({ data: null, error: null })),
  };
  return {
    supabase,
    createClient: vi.fn(async () => supabase),
    getDashboardContext: vi.fn(async () => null as unknown),
    redirect: vi.fn((destination: string) => {
      throw new RedirectSignal(destination);
    }),
  };
});

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/dashboard/server", () => ({ getDashboardContext }));

import { signIn, signInWithProvider } from "@/app/login/actions";
import { GET as authCallback } from "@/app/auth/callback/route";
import { LoginForm } from "@/app/login/login-form";
import { providerAvailability, isProviderConfigured } from "./providers";
import { destinationForAuthState, AUTH_STATES } from "./auth-state";
import { safeReturnTo, oauthCallbackUrl } from "./return-url";
import { DEMO_PASSWORD } from "@/app/login/credentials";

const repo = fileURLToPath(new URL("../../", import.meta.url));

/** Capture where a server action sent the browser. */
async function destinationOf(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof RedirectSignal) return error.destination;
    throw error;
  }
  throw new Error("expected a redirect, none happened");
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

const ENV_KEYS = [
  "COMMAND_CENTER_MODE",
  "AUTH_GOOGLE_ENABLED",
  "AUTH_APPLE_ENABLED",
  "NEXT_PUBLIC_SITE_URL",
] as const;
let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  vi.clearAllMocks();
  supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
  supabase.auth.exchangeCodeForSession.mockResolvedValue({ error: null });
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.c" } } });
  supabase.auth.signInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.com/o/oauth2/auth?x=1" },
    error: null,
  });
  getDashboardContext.mockResolvedValue(null);
  process.env.COMMAND_CENTER_MODE = "live";
  process.env.NEXT_PUBLIC_SITE_URL = "https://codeoutfitters.vercel.app";
  process.env.AUTH_GOOGLE_ENABLED = "true";
  process.env.AUTH_APPLE_ENABLED = "true";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("auth states", () => {
  it("declares all seven states and routes each one honestly", () => {
    expect(AUTH_STATES).toEqual([
      "loading",
      "signed_out",
      "authenticating",
      "authenticated_without_membership",
      "authenticated_member",
      "access_pending",
      "auth_error",
    ]);
    expect(destinationForAuthState("authenticated_member", "/dashboard/leads")).toBe(
      "/dashboard/leads",
    );
    expect(destinationForAuthState("authenticated_without_membership", "/dashboard")).toBe(
      "/access-pending",
    );
    expect(destinationForAuthState("access_pending", "/dashboard")).toBe("/access-pending");
    expect(destinationForAuthState("auth_error", "/dashboard")).toBe("/login?error=auth");
  });
});

describe("provider availability (13, 14)", () => {
  it("enables Google only when live mode and the server-side Google flag are both set", () => {
    delete process.env.AUTH_GOOGLE_ENABLED;
    expect(providerAvailability(true).find((p) => p.id === "google")!.enabled).toBe(false);

    process.env.AUTH_GOOGLE_ENABLED = "true";
    expect(providerAvailability(true).find((p) => p.id === "google")!.enabled).toBe(true);
    // Live flag on, but demo mode: still disabled.
    expect(providerAvailability(false).find((p) => p.id === "google")!.enabled).toBe(false);
  });

  it("enables Apple only when live mode and the server-side Apple flag are both set", () => {
    delete process.env.AUTH_APPLE_ENABLED;
    expect(providerAvailability(true).find((p) => p.id === "apple")!.enabled).toBe(false);

    process.env.AUTH_APPLE_ENABLED = "true";
    expect(providerAvailability(true).find((p) => p.id === "apple")!.enabled).toBe(true);
    expect(providerAvailability(false).find((p) => p.id === "apple")!.enabled).toBe(false);
  });

  it("always gives a disabled provider an accessible reason, and an enabled one none", () => {
    const demo = providerAvailability(false);
    expect(demo.map((p) => p.id)).toEqual(["google", "apple"]);
    for (const provider of demo) {
      expect(provider.enabled).toBe(false);
      expect(provider.reason).toBe("Available when live authentication is connected.");
    }
    delete process.env.AUTH_APPLE_ENABLED;
    const live = providerAvailability(true);
    expect(live.find((p) => p.id === "apple")!.reason).toBe(
      "Available once this provider is configured.",
    );
    expect(live.find((p) => p.id === "google")!.reason).toBeNull();
  });

  it("reads a server-only flag, never a NEXT_PUBLIC_ one", () => {
    const source = readFileSync(`${repo}lib/auth/providers.ts`, "utf8");
    expect(source).toContain("AUTH_GOOGLE_ENABLED");
    expect(source).toContain("AUTH_APPLE_ENABLED");
    expect(source).not.toMatch(/NEXT_PUBLIC_[A-Z_]*(GOOGLE|APPLE|AUTH)/);
    expect(source).toContain("import 'server-only'");
    // An unset, empty or "false" flag never enables a provider.
    for (const value of [undefined, "", "false", "0", "no", "maybe"]) {
      expect(isProviderConfigured("google", { AUTH_GOOGLE_ENABLED: value })).toBe(false);
    }
    expect(isProviderConfigured("google", { AUTH_GOOGLE_ENABLED: "true" })).toBe(true);
  });
});

describe("demo boundary (15, 16, 17)", () => {
  it("renders the demo credential block only in demo mode", () => {
    const demo = renderToStaticMarkup(
      createElement(LoginForm, {
        live: false,
        initialError: false,
        returnTo: "/dashboard",
        providers: providerAvailability(false),
      }),
    );
    const live = renderToStaticMarkup(
      createElement(LoginForm, {
        live: true,
        initialError: false,
        returnTo: "/dashboard",
        providers: providerAvailability(true),
      }),
    );

    expect(demo).toContain("Demo access");
    expect(demo).toContain("marc@gmail.com");
    expect(demo).toContain(DEMO_PASSWORD);
    expect(demo).toContain("Fill demo credentials");

    expect(live).not.toContain("Demo access");
    expect(live).not.toContain("Fill demo credentials");
    expect(live).not.toContain("marc@gmail.com");
    expect(live).not.toMatch(/>123</);
  });

  it("keeps the demo login page free of any Supabase call", () => {
    const page = readFileSync(`${repo}app/login/page.tsx`, "utf8");
    const demoBranch = page.slice(page.indexOf("if (isDemoMode())"), page.indexOf("// Live mode"));
    expect(demoBranch).not.toContain("createClient");
    expect(demoBranch).not.toContain("getUser");
    // The demo form never receives a server action, so it cannot post anywhere.
    expect(demoBranch).not.toContain("action={signIn}");
  });

  it("refuses the demo password in live mode before any auth call is made", async () => {
    const destination = await destinationOf(() =>
      signIn(form({ email: "marc@gmail.com", password: DEMO_PASSWORD, returnTo: "/dashboard" })),
    );
    expect(destination).toBe("/login?error=1&returnTo=%2Fdashboard");
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("blocks the OAuth action entirely in demo mode", async () => {
    process.env.COMMAND_CENTER_MODE = "demo";
    const destination = await destinationOf(() =>
      signInWithProvider(form({ provider: "google", returnTo: "/dashboard" })),
    );
    expect(destination).toBe("/login?error=auth");
    expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled();
  });
});

describe("provider sign-in action", () => {
  it("starts the real flow with a server-built callback URL", async () => {
    const destination = await destinationOf(() =>
      signInWithProvider(form({ provider: "google", returnTo: "/dashboard/leads" })),
    );
    expect(destination).toBe("https://accounts.google.com/o/oauth2/auth?x=1");
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "https://codeoutfitters.vercel.app/auth/callback?returnTo=%2Fdashboard%2Fleads",
      },
    });
  });

  it("refuses a provider the server has not enabled", async () => {
    delete process.env.AUTH_APPLE_ENABLED;
    const destination = await destinationOf(() =>
      signInWithProvider(form({ provider: "apple", returnTo: "/dashboard" })),
    );
    expect(destination).toBe("/login?error=auth");
    expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("refuses an unknown provider id from the browser", async () => {
    const destination = await destinationOf(() =>
      signInWithProvider(form({ provider: "github", returnTo: "/dashboard" })),
    );
    expect(destination).toBe("/login?error=auth");
    expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("never surfaces a provider error to the browser", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: "invalid_client: bad Google client secret" },
    } as never);
    const destination = await destinationOf(() =>
      signInWithProvider(form({ provider: "google", returnTo: "/dashboard" })),
    );
    expect(destination).toBe("/login?error=auth");
    expect(destination).not.toContain("invalid_client");
  });
});

describe("password sign-in routes by membership (19, 20)", () => {
  it("sends a member to the validated return path", async () => {
    getDashboardContext.mockResolvedValue({ userId: "u1", workspaceId: "w1", role: "owner" });
    const destination = await destinationOf(() =>
      signIn(form({ email: "marc@gmail.com", password: "a-real-password", returnTo: "/dashboard/leads" })),
    );
    expect(destination).toBe("/dashboard/leads");
  });

  it("sends an authenticated non-member to /access-pending, not the dashboard", async () => {
    getDashboardContext.mockResolvedValue(null);
    const destination = await destinationOf(() =>
      signIn(form({ email: "someone@example.com", password: "a-real-password", returnTo: "/dashboard" })),
    );
    expect(destination).toBe("/access-pending");
  });

  it("gives one generic denial for a bad credential", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials", status: 400 },
    } as never);
    const destination = await destinationOf(() =>
      signIn(form({ email: "someone@example.com", password: "wrong", returnTo: "/dashboard" })),
    );
    expect(destination).toBe("/login?error=1&returnTo=%2Fdashboard");
    expect(destination).not.toContain("Invalid login");
  });
});

describe("OAuth callback (18, 19, 20, 22, 23)", () => {
  const call = async (url: string) => {
    const response = await authCallback(new Request(url) as never);
    return response.headers.get("location");
  };

  it("validates the session server-side before deciding anything", async () => {
    getDashboardContext.mockResolvedValue({ userId: "u1", workspaceId: "w1", role: "owner" });
    await call("https://codeoutfitters.vercel.app/auth/callback?code=abc");
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(supabase.auth.getUser).toHaveBeenCalled();
  });

  it("sends an authenticated member to the validated return path", async () => {
    getDashboardContext.mockResolvedValue({ userId: "u1", workspaceId: "w1", role: "owner" });
    expect(
      await call(
        "https://codeoutfitters.vercel.app/auth/callback?code=abc&returnTo=%2Fdashboard%2Fleads",
      ),
    ).toBe("https://codeoutfitters.vercel.app/dashboard/leads");
    // A member already has access; the bootstrap is not even attempted.
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("sends an authenticated non-member to /access-pending after the bootstrap declines", async () => {
    getDashboardContext.mockResolvedValue(null);
    expect(await call("https://codeoutfitters.vercel.app/auth/callback?code=abc")).toBe(
      "https://codeoutfitters.vercel.app/access-pending",
    );
    expect(supabase.rpc).toHaveBeenCalledWith("bootstrap_initial_workspace_owner");
  });

  it("admits the owner once the bootstrap grants membership", async () => {
    getDashboardContext
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: "marc", workspaceId: "w1", role: "owner" });
    expect(await call("https://codeoutfitters.vercel.app/auth/callback?code=abc")).toBe(
      "https://codeoutfitters.vercel.app/dashboard",
    );
  });

  it("rejects an external returnTo instead of following it", async () => {
    getDashboardContext.mockResolvedValue({ userId: "u1", workspaceId: "w1", role: "owner" });
    for (const hostile of [
      "https%3A%2F%2Fevil.example.com",
      "%2F%2Fevil.example.com",
      "%2F%5Cevil.example.com",
    ]) {
      expect(
        await call(
          `https://codeoutfitters.vercel.app/auth/callback?code=abc&returnTo=${hostile}`,
        ),
      ).toBe("https://codeoutfitters.vercel.app/dashboard");
    }
  });

  it("collapses every failure to one generic auth error", async () => {
    // Provider-side failure.
    expect(
      await call(
        "https://codeoutfitters.vercel.app/auth/callback?error=access_denied&error_description=User+cancelled",
      ),
    ).toBe("https://codeoutfitters.vercel.app/login?error=auth");

    // Missing code.
    expect(await call("https://codeoutfitters.vercel.app/auth/callback")).toBe(
      "https://codeoutfitters.vercel.app/login?error=auth",
    );

    // Exchange failure.
    supabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid_grant: code verifier mismatch" },
    } as never);
    const location = await call("https://codeoutfitters.vercel.app/auth/callback?code=abc");
    expect(location).toBe("https://codeoutfitters.vercel.app/login?error=auth");
    expect(location).not.toContain("invalid_grant");

    // Valid exchange, but no user on the auth server.
    supabase.auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } } as never);
    expect(await call("https://codeoutfitters.vercel.app/auth/callback?code=abc")).toBe(
      "https://codeoutfitters.vercel.app/login?error=auth",
    );
  });
});

describe("return-path safety (22, 23)", () => {
  it("keeps same-origin paths and rejects everything else", () => {
    expect(safeReturnTo("/dashboard/leads?page=2")).toBe("/dashboard/leads?page=2");
    for (const hostile of [
      "https://evil.example.com",
      "//evil.example.com",
      "/\\evil.example.com",
      "/dashboard\\..\\evil",
      "%2F%2Fevil.example.com",
      null,
      "",
    ]) {
      expect(safeReturnTo(hostile)).toBe("/dashboard");
    }
  });

  it("builds the OAuth callback from the server's own origin only", () => {
    expect(oauthCallbackUrl("/dashboard", "https://codeoutfitters.vercel.app")).toBe(
      "https://codeoutfitters.vercel.app/auth/callback?returnTo=%2Fdashboard",
    );
    // A hostile returnTo cannot escape the origin.
    expect(oauthCallbackUrl("https://evil.example.com", "https://codeoutfitters.vercel.app")).toBe(
      "https://codeoutfitters.vercel.app/auth/callback?returnTo=%2Fdashboard",
    );
    // No site URL, or an insecure one, means no OAuth start at all.
    expect(oauthCallbackUrl("/dashboard", "")).toBeNull();
    expect(oauthCallbackUrl("/dashboard", "http://codeoutfitters.vercel.app")).toBeNull();
    expect(oauthCallbackUrl("/dashboard", "not-a-url")).toBeNull();
  });
});

describe("unauthenticated dashboard access (21)", () => {
  it("middleware guards /dashboard and hands the login page a validated returnTo", () => {
    const source = readFileSync(`${repo}lib/supabase/middleware.ts`, "utf8");
    // Auth is read from the auth server, never from an unverified session blob.
    expect(source).toContain("supabase.auth.getUser()");
    expect(source).not.toMatch(/await\s+supabase\.auth\.getSession\(\)/);
    expect(source).toMatch(/if \(!user && path\.startsWith\('\/dashboard'\)\)/);
    expect(source).toContain("safeReturnTo(");

    // Since the canonical host redirect the matcher covers the whole site, so the
    // paths that get session work are the ones listed for it — /dashboard included.
    const matcher = readFileSync(`${repo}middleware.ts`, "utf8");
    expect(matcher).toContain("const SESSION_PATHS = ['/dashboard', '/login', '/access-pending', '/auth']");
    expect(matcher).toContain("if (needsSession(request.nextUrl.pathname)) return updateSession(request)");
  });

  it("server components re-check membership instead of trusting the middleware", () => {
    const source = readFileSync(`${repo}lib/dashboard/server.ts`, "utf8");
    // Authenticated-but-unauthorized goes to /access-pending, never to the dashboard
    // and never into a /login loop.
    expect(source).toContain("redirect('/access-pending')");
    expect(source).toContain("redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)");
    expect(source).toContain(".eq('status', 'active')");
  });
});

describe("no browser-controlled authorization (36)", () => {
  it("never accepts a role, workspace or owner email from a form", () => {
    const actions = readFileSync(`${repo}app/login/actions.ts`, "utf8");
    for (const field of ["'role'", '"role"', "'workspace", "'owner"]) {
      expect(actions).not.toContain(`formData.get(${field}`);
    }
    // Only these three fields are ever read from the browser.
    const read = [...actions.matchAll(/formData\.get\('([^']+)'\)/g)].map((m) => m[1]);
    expect(new Set(read)).toEqual(new Set(["email", "password", "returnTo", "provider"]));
  });

  it("takes the owner identity from the database allowlist, not from the request", () => {
    const migration = readFileSync(
      `${repo}supabase/migrations/20260729_owner_bootstrap.sql`,
      "utf8",
    );
    expect(migration).toContain("create or replace function public.bootstrap_initial_workspace_owner()");
    // No arguments at all: nothing about the owner can be supplied by a caller.
    expect(migration).toContain("bootstrap_initial_workspace_owner()\nreturns");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain(
      "revoke all on function public.bootstrap_initial_workspace_owner() from public, anon;",
    );
    expect(migration).toContain("revoke all on table public.workspace_owner_bootstrap from anon, authenticated;");
  });
});

describe("secrets stay out of source and the client bundle (37-42)", () => {
  const SKIP = new Set([
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "command-center",
    "work",
    "graphify-out",
    ".tokensave",
  ]);

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (SKIP.has(entry) || entry.startsWith("# CodeOutfitters") || entry.startsWith("CODEOUTFITTERS-")) {
        continue;
      }
      const full = `${dir}/${entry}`;
      if (statSync(full).isDirectory()) walk(full, out);
      else out.push(full);
    }
    return out;
  }

  const root = repo.replace(/[\\/]$/, "");
  const rel = (file: string) => file.slice(root.length + 1);
  // This file necessarily contains every pattern it searches for, so it excludes
  // itself. Nothing else is exempt.
  const files = walk(root).filter((f) => !f.endsWith("live-auth.test.ts"));
  const sources = files.filter((f) => /\.(ts|tsx|js|mjs|cjs)$/.test(f));

  it("keeps the service-role key out of every client component (37)", () => {
    const clientFiles = sources.filter((f) => {
      const head = readFileSync(f, "utf8").slice(0, 200);
      return head.includes('"use client"') || head.includes("'use client'");
    });
    expect(clientFiles.length).toBeGreaterThan(0);
    for (const file of clientFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toContain("SUPABASE_SECRET_KEY");
      expect(source, file).not.toContain("SUPABASE_SERVICE_ROLE");
    }
  });

  it("never exposes an auth or provider secret through NEXT_PUBLIC_ (37, 38, 39)", () => {
    for (const file of sources) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/NEXT_PUBLIC_[A-Z_]*(SECRET|SERVICE_ROLE|PRIVATE_KEY)/);
      expect(source, file).not.toMatch(/NEXT_PUBLIC_[A-Z_]*(GOOGLE_CLIENT|APPLE_)/);
    }
  });

  it("contains no committed provider credential or key material (38, 39, 41)", () => {
    for (const file of files.filter((f) => /\.(ts|tsx|js|mjs|cjs|json|sql|md|yml|yaml)$/.test(f))) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toContain("-----BEGIN PRIVATE KEY-----");
      expect(source, file).not.toContain("-----BEGIN RSA PRIVATE KEY-----");
      // Google OAuth client secrets have a fixed prefix.
      expect(source, file).not.toMatch(/GOCSPX-[A-Za-z0-9_-]{10,}/);
      // Any committed Supabase JWT must be an anon key. `lib/supabase.ts`
      // deliberately carries the public browser anon key as a static-export
      // fallback; a service_role token there would be a breach.
      for (const token of source.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g) ?? []) {
        let role: unknown;
        try {
          role = JSON.parse(Buffer.from(token.split(".")[1]!, "base64").toString()).role;
        } catch {
          role = undefined;
        }
        expect(role, `${file}: committed JWT role`).not.toBe("service_role");
      }
    }
  });

  it("tracks no .p8 file and refuses one in .gitignore (40)", () => {
    expect(files.filter((f) => f.endsWith(".p8"))).toEqual([]);
    const ignore = readFileSync(`${repo}.gitignore`, "utf8");
    expect(ignore).toMatch(/^\*\.p8$/m);
    expect(ignore).toMatch(/^\.env\*$/m);
  });

  it("stores no plaintext production password (41)", () => {
    // The only literal password in the repository is the published demo one, and
    // it exists solely in the demo-mode credential module.
    const owners = sources.filter((f) => readFileSync(f, "utf8").includes('DEMO_PASSWORD = "'));
    expect(owners.map(rel)).toEqual(["app/login/credentials.ts"]);

    const actions = readFileSync(`${repo}app/login/actions.ts`, "utf8");
    expect(actions).not.toMatch(/password\s*===\s*["'`]/);
    expect(actions).toContain("password === DEMO_PASSWORD");
  });

  it("logs no provider token, code or session (42)", () => {
    const authFiles = [
      "app/auth/callback/route.ts",
      "app/login/actions.ts",
      "app/login/page.tsx",
      "app/access-pending/page.tsx",
      "lib/auth/providers.ts",
      "lib/auth/auth-state.ts",
      "lib/supabase/middleware.ts",
      "lib/supabase/server.ts",
    ];
    for (const rel of authFiles) {
      const source = readFileSync(`${repo}${rel}`, "utf8");
      expect(source, rel).not.toMatch(/console\.(log|info|warn|error|debug)/);
    }
  });
});
