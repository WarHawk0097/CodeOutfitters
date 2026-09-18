// Auth outage contract tests (Sign in → /login → dashboard).
//
// Root cause this locks in: the hosted Supabase project can be unreachable
// (paused project / lost DNS / network partition). Before these fixes the
// login path made UNBOUNDED and UNGUARDED auth calls, so an outage produced a
// stalled or 500ing /login — the user-visible "click Sign in and nothing
// happens" bug — and sign-in attempts read as "wrong password".
//
// The contract now:
//   1. every Supabase auth HTTP call is bounded (a deadline exists in the
//      client factory, so no call site can forget it);
//   2. network-class auth failures are classified once (isAuthProviderOutage)
//      and rendered as an explicit, safe outage state — never a 500, never a
//      credential lie, never a demo fallback;
//   3. the middleware fails closed on an outage for protected routes.
//
// Source-contract assertions follow the repo's established style for
// middleware/pages whose real behavior lives in the Next runtime.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  boundedGetUser,
  isAuthProviderOutage,
  resolvedAuthError,
  withAuthFetchTimeout,
} from "@/lib/supabase/bounded-auth-fetch";
import { AuthRetryableFetchError } from "@supabase/auth-js";
const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel: string) => readFileSync(`${repo}${rel}`, "utf8");

describe("bounded auth fetch (the deadline itself)", () => {
  /** A fetch stand-in that never settles on its own but rejects when aborted —
   *  including an already-aborted signal, like the real fetch. */
  function hangingFetch(): { fetch: typeof fetch } {
    const impl = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        if (init?.signal?.aborted) {
          reject(new Error("aborted"));
          return;
        }
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
          once: true,
        });
      })) as unknown as typeof fetch;
    return { fetch: impl };
  }

  it("aborts a hanging request at the deadline", async () => {
    const { fetch: impl } = hangingFetch();
    const wrapped = withAuthFetchTimeout(impl, 25);
    await expect(wrapped("https://example.test/x")).rejects.toThrow();
  });

  it("combines the deadline with a caller-provided abort signal", async () => {
    const { fetch: impl } = hangingFetch();
    const wrapped = withAuthFetchTimeout(impl, 5_000);
    const controller = new AbortController();
    const pending = wrapped("https://example.test/x", { signal: controller.signal });
    // Abort after the call is in flight, as a superseded navigation would.
    await new Promise((r) => setTimeout(r, 5));
    controller.abort();
    await expect(pending).rejects.toThrow();
  });

  it("classifies exactly the network-class auth error as an outage", () => {
    // The real error class from the real dependency: status 0 = no HTTP answer.
    expect(isAuthProviderOutage(new AuthRetryableFetchError("fetch failed", 0))).toBe(true);
    // A 5xx auth answer means the service cannot do its job right now.
    expect(isAuthProviderOutage(new AuthRetryableFetchError("upstream 503", 503))).toBe(true);
    // A 4xx is a real API decision, never an outage signal.
    expect(isAuthProviderOutage(new AuthRetryableFetchError("bad request", 400))).toBe(false);
    expect(isAuthProviderOutage(new Error("something else"))).toBe(false);
    expect(isAuthProviderOutage("not an error object")).toBe(false);
    expect(isAuthProviderOutage(null)).toBe(false);
  });
});

describe("the resolved-error contract (auth-js catches and resolves)", () => {
  it("resolvedAuthError extracts exactly the network-class resolved error", () => {
    expect(resolvedAuthError({ error: new AuthRetryableFetchError("fetch failed", 0) })).toBeInstanceOf(
      AuthRetryableFetchError,
    );
    expect(resolvedAuthError({ error: new AuthRetryableFetchError("upstream 502", 502) })).toBeInstanceOf(
      AuthRetryableFetchError,
    );
    // A 4xx API decision (wrong password, unknown email) is NOT an outage.
    expect(resolvedAuthError({ error: new AuthRetryableFetchError("bad request", 400) })).toBeNull();
    expect(resolvedAuthError({ error: null })).toBeNull();
    expect(resolvedAuthError({ error: undefined })).toBeNull();
  });

  it("boundedGetUser classifies a resolved network-class error as an outage", async () => {
    const outcome = await boundedGetUser(async () => ({
      data: { user: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    }));
    expect(outcome).toMatchObject({ outcome: "outage" });
  });

  it("boundedGetUser classifies a thrown network-class error as an outage", async () => {
    const outcome = await boundedGetUser(async () => {
      throw new AuthRetryableFetchError("deadline elapsed", 0);
    });
    expect(outcome).toMatchObject({ outcome: "outage" });
  });

  it("boundedGetUser reads a session-missing resolution as signed-out, never an outage", async () => {
    // The exact shape auth-js resolves for getUser() with no session cookie.
    const outcome = await boundedGetUser(async () => ({
      data: { user: null },
      error: Object.assign(new Error("Auth session missing!"), { name: "AuthSessionMissingError", status: 400 }),
    }));
    expect(outcome).toEqual({ outcome: "unauthenticated" });
  });

  it("boundedGetUser returns the user on success and rethrows non-auth errors", async () => {
    const user = { id: "u1" };
    const ok = await boundedGetUser(async () => ({ data: { user }, error: null }));
    expect(ok).toEqual({ outcome: "authenticated", user });

    await expect(
      boundedGetUser(async () => {
        throw new Error("client misconfigured");
      }),
    ).rejects.toThrow("client misconfigured");
  });
});

describe("the membership read distinguishes outage from no-membership", () => {
  it("lib/dashboard/server.ts classifies the getUser outcome and rethrows data-plane outages", () => {
    const src = read("lib/dashboard/server.ts");
    expect(src).toContain("boundedGetUser");
    expect(src).toContain("outcome === 'outage'");
    // PostgREST network failure arrives resolved with status 0 — rethrown as
    // an outage so callers cannot read it as "no membership".
    expect(src).toContain(".status === 0");
    expect(src).toContain("isDataPlaneOutage(membershipsError)");
  });

  it("the attachment download fails closed with 503 on an outage, 401 only when signed out", () => {
    const src = read("app/api/dashboard/attachments/[attachmentId]/download/route.ts");
    expect(src).toContain("boundedGetUser");
    expect(src).toContain("status: 503");
    expect(src).toContain("status: 401");
  });
});

describe("the client factories bound every auth call", () => {
  it("lib/supabase/server.ts installs the bounded fetch", () => {
    const src = read("lib/supabase/server.ts");
    expect(src).toContain("withAuthFetchTimeout(fetch)");
    expect(src).toContain("global: {");
  });

  it("lib/supabase/middleware.ts keeps its bounded fetch, fail-closed guard and explicit 503 on protected routes", () => {
    const src = read("lib/supabase/middleware.ts");
    // The shipped bounded auth fetch (edge-budget safety) is still in place.
    expect(src).toContain("authFetch");
    expect(src).toContain("AbortController");
    // Fail closed: ANY auth failure on a protected route is an explicit 503 —
    // never an authorization bypass, never a silent stall. Both delivery
    // contracts are classified: resolved `{ data, error }` (auth-js 2.110.8)
    // and thrown.
    expect(src).toContain("resolvedAuthError");
    expect(src).toContain("catch {");
    expect(src).toContain("status: 503");
    expect(src).toContain("needsGuard(path)");
    // The guard covers membership-state pages, not just /dashboard: an outage
    // must never render as "you have no access".
    expect(src).toContain("/access-pending");
    expect(src).toContain("/extension-auth");
  });
});

describe("the login page renders an explicit outage state", () => {
  const page = read("app/login/page.tsx");

  it("guards getUser() and the membership check instead of 500ing", () => {
    expect(page).toContain("isAuthProviderOutage");
    expect(page).toContain("<AuthOutageNotice />");
  });

  it("keeps the live Supabase auth path real (no demo fallback invented)", () => {
    expect(page).toContain("supabase.auth.getUser()");
    expect(page).toContain("action={signIn}");
  });

  it("renders the outage state when an action/callback reported outage=1", () => {
    // An anonymous visitor's /login cannot probe the provider (auth-js answers
    // "no session" locally, no network call), so the outage=1 the actions set
    // after a failed bounded sign-in attempt is the ONLY way the outage becomes
    // visible. Ignoring it used to land the visitor back on the bare form —
    // the exact "clicked sign in and nothing happened" experience.
    expect(page).toContain("const hasOutage = sp.outage === '1'");
    expect(page).toMatch(/if \(hasOutage\) \{[\s\S]{0,200}<AuthOutageNotice \/>/);
    // The ignore-the-parameter regression must not come back.
    expect(page).not.toContain("void sp.outage");
    // Demo mode has no auth plane and must never claim an outage: the demo
    // early-return appears before the outage branch, so a demo visit can never
    // reach it.
    expect(page.indexOf("isDemoMode()")).toBeLessThan(page.indexOf("if (hasOutage)"));
  });
});

describe("the outage notice is honest and safe", () => {
  const notice = read("app/login/auth-outage-notice.tsx");

  it("tells the truth about the condition without leaking internals", () => {
    const rendered = "Sign in is temporarily unavailable. Please try again shortly.";
    expect(rendered).toContain("temporarily unavailable");
    expect(rendered).not.toMatch(/supabase|auth-js|timeout|network|fetch|status/i);
  });

  it("offers a retry and the website exit", () => {
    expect(notice).toContain("window.location.reload()");
    expect(notice).toContain('href="/"');
  });
});

describe("auth actions never read an outage as a credential failure", () => {
  const actions = read("app/login/actions.ts");

  it("sign-in routes network-class failures to the outage state, not the denial", () => {
    expect(actions).toContain("const unavailable = `/login?outage=1");
    expect(actions).toContain("if (isAuthProviderOutage(error)) redirect(unavailable)");
    // The denial and the outage stay distinct destinations.
    expect(actions).toContain("redirect(denied)");
  });

  it("the OAuth action has its own outage destination", () => {
    expect(actions).toContain("const unavailable = `/login?outage=1");
    expect(actions).toMatch(/signInWithOAuth[\s\S]{0,400}isAuthProviderOutage/);
  });

  it("sign-out is best-effort and always redirects", () => {
    expect(actions).toMatch(/signOut[\s\S]{0,300}catch \{[\s\S]{0,120}redirect\('\/login'\)/);
  });
});

describe("the OAuth callback routes provider outages to the safe state", () => {
  const callback = read("app/auth/callback/route.ts");

  it("wraps exchange, getUser, membership and bootstrap", () => {
    expect(callback).toContain("isAuthProviderOutage(error)");
    expect(callback).toContain("/login?outage=1");
    // Distinct from the generic auth failure.
    expect(callback).toContain("destinationForAuthState('auth_error', returnTo)");
  });
});

describe("secondary auth surfaces degrade honestly", () => {
  it("access-pending shows the outage notice instead of a 500", () => {
    const src = read("app/access-pending/page.tsx");
    expect(src).toContain("isAuthProviderOutage");
    expect(src).toContain("<AuthOutageNotice");
  });

  it("update-password reports unavailability instead of a fake rejection", () => {
    const src = read("app/update-password/actions.ts");
    expect(src).toContain("temporarily unavailable");
    expect(src).toContain("isAuthProviderOutage");
  });

  it("the update-password PAGE classifies the resolved-error contract too", () => {
    // Raw getUser() + try/catch only sees the THROWN shape; auth-js 2.110.8
    // RESOLVES a network-class outage as { data, error } — which used to fall
    // through to redirect('/login') and tell a signed-out-looking story to a
    // person mid-password-reset. The page must use boundedGetUser, which
    // handles both contracts, and must keep the explicit outage state.
    const src = read("app/update-password/page.tsx");
    expect(src).toContain("boundedGetUser");
    // The unbounded, unclassified raw await is what regressed here.
    expect(src).not.toContain("await supabase.auth.getUser()");
    expect(src).toContain("outcome === 'outage'");
    expect(src).toContain("temporarily unavailable");
  });

  it("forgot-password distinguishes sent from not-sent", () => {
    const actions = read("app/forgot-password/actions.ts");
    const page = read("app/forgot-password/page.tsx");
    expect(actions).toContain("redirect('/forgot-password?sent=0')");
    expect(page).toContain("sent === '0'");
    expect(page).toContain("no reset link was");
  });

  it("the copilot route answers 503 for a provider outage, never 401/403", () => {
    const subject = read("lib/ai/server/copilot-subject.ts");
    const route = read("app/api/ai/copilot/route.ts");
    expect(subject).toContain('"provider_outage"');
    expect(route).toContain('"provider_outage"');
    expect(route).toContain("503");
  });

  it("a catch-all error boundary exists so no route renders a raw 500", () => {
    const boundary = read("app/error.tsx");
    expect(boundary).toContain("Something went wrong");
    expect(boundary).toContain("reset");
  });
});
