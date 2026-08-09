import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Password-update completion (Part 2). Supabase and next/navigation are mocked
// so the real decision code runs: password validation, error shielding, and
// the post-update sign-out, without a network or a router.

class RedirectSignal extends Error {
  constructor(public readonly destination: string) {
    super(`redirect:${destination}`);
  }
}

const { redirect, createClient, supabase } = vi.hoisted(() => {
  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "u1", email: "a@b.c" } as { id: string; email: string } | null } })),
      updateUser: vi.fn(async () => ({ error: null as { message: string } | null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
  return {
    supabase,
    createClient: vi.fn(async () => supabase),
    redirect: vi.fn((destination: string) => {
      throw new RedirectSignal(destination);
    }),
  };
});

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { updatePassword } from "./actions";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

beforeEach(() => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.c" } } });
  supabase.auth.updateUser.mockResolvedValue({ error: null });
  supabase.auth.signOut.mockClear();
});

afterEach(() => vi.clearAllMocks());

describe("updatePassword", () => {
  it("rejects a password below the minimum length", async () => {
    const result = await updatePassword({ status: "idle" }, form({ password: "abc", confirmPassword: "abc" }));
    expect(result).toEqual({ status: "error", message: "Password must be at least 6 characters." });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    const result = await updatePassword(
      { status: "idle" },
      form({ password: "correcthorse", confirmPassword: "differenthorse" }),
    );
    expect(result).toEqual({ status: "error", message: "Passwords do not match." });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password, signs out, and reports success", async () => {
    const result = await updatePassword(
      { status: "idle" },
      form({ password: "correcthorse", confirmPassword: "correcthorse" }),
    );
    expect(result).toEqual({ status: "success" });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "correcthorse" });
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it("shields raw Supabase error strings behind a generic message", async () => {
    supabase.auth.updateUser.mockResolvedValueOnce({ error: { message: "some raw provider detail" } });
    const result = await updatePassword(
      { status: "idle" },
      form({ password: "correcthorse", confirmPassword: "correcthorse" }),
    );
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("some raw provider detail");
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated access to /login instead of accepting the change", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
    try {
      await updatePassword({ status: "idle" }, form({ password: "correcthorse", confirmPassword: "correcthorse" }));
      throw new Error("expected a redirect");
    } catch (error) {
      expect(error).toBeInstanceOf(RedirectSignal);
      expect((error as RedirectSignal).destination).toBe("/login");
    }
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });
});

const here = fileURLToPath(new URL(".", import.meta.url));
const forgotActionsSrc = readFileSync(`${here}../forgot-password/actions.ts`, "utf8");
const callbackRouteSrc = readFileSync(`${here}../auth/callback/route.ts`, "utf8");

describe("recovery redirect wiring", () => {
  it("points the reset email at /update-password, not /dashboard", () => {
    expect(forgotActionsSrc).toContain("returnTo=/update-password");
    expect(forgotActionsSrc).not.toContain("returnTo=/dashboard");
  });

  it("lets the callback bypass the workspace-membership gate for recovery", () => {
    expect(callbackRouteSrc).toContain("if (returnTo === '/update-password')");
    expect(callbackRouteSrc).toContain("return NextResponse.redirect(`${origin}${returnTo}`)");
  });
});
