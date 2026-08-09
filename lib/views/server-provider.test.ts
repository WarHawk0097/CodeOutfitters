// Live Saved View provider — source-surface tests (Part 9 / Part 13 of the Saved Views work
// order). This is the only file that speaks to public.saved_views; local-Supabase integration
// coverage for the actual CRUD/RLS behavior lives separately (Part 8). These tests defend the
// properties that would be a lie if this file regressed: every query is workspace-scoped, no
// Postgres error message reaches the caller unmapped, and nothing here reads a fixture.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SavedViewError, serverSavedViewProvider, getDefaultViewId } from "./server-provider";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("lib/views/server-provider.ts");

describe("live saved view provider (server-provider.ts)", () => {
  it("implements exactly the five operations the frozen contract declares", () => {
    expect(Object.keys(serverSavedViewProvider).sort()).toEqual([
      "create",
      "list",
      "remove",
      "setDefault",
      "update",
    ]);
  });

  it("scopes every query to the caller's workspace, never trusting a client-sent id alone", () => {
    // Every list/create/update/remove/setDefault query carries an explicit workspace_id filter
    // — the .eq() calls are the defense-in-depth layer this file documents on top of RLS.
    expect(src.match(/\.eq\("workspace_id", context\.workspaceId\)/g)?.length).toBeGreaterThanOrEqual(5);
    expect(src).toContain("defense in depth, not the whole of");
  });

  it("never sets owner_user_id from the client — the column default (auth.uid()) is the source", () => {
    expect(src).toContain("owner_user_id is intentionally omitted");
    expect(src).not.toMatch(/owner_user_id:\s*(context|draft|candidate)/);
  });

  it("maps every Postgres error to a fixed caller-facing reason, never the raw message", () => {
    expect(src).toContain('error.code === "23505"');
    expect(src).toContain('error.code === "42501"');
    expect(src).toContain("Never forwards the raw Postgres message");
    // Every code path that can hit Postgres runs its error through the same mapper.
    expect(src.match(/throwForPgError\(/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("throws distinct, typed errors a route can map to the right HTTP status", () => {
    const err = new SavedViewError("not_found", "gone");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("not_found");
    for (const code of ["invalid", "forbidden", "not_found", "conflict"] as const) {
      expect(new SavedViewError(code, "x").code).toBe(code);
    }
  });

  it("validates create and update against the same rules the client-side draft already enforces", () => {
    expect(src.match(/validateDraftOrThrow\(draft\)/g)?.length).toBe(2);
  });

  it("treats a zero-row update/delete as not_found or a silent success, never a leak of which", () => {
    expect(src).toContain('throw new SavedViewError("not_found", "That saved view is not available to edit.")');
    expect(src).toContain("a delete\n    // that matches zero rows");
  });

  it("scopes setDefault to the caller's own personal views — a shared view has no correct owner here", () => {
    expect(src).toContain('target.visibility !== "personal" || target.owner_user_id !== context.userId');
    expect(src).toContain("Only your own personal views can be set as your default for this list.");
  });

  it("getDefaultViewId reads this caller's default only, scoped by workspace, owner and scope", () => {
    expect(typeof getDefaultViewId).toBe("function");
    const fn = src.slice(src.indexOf("export async function getDefaultViewId"));
    expect(fn).toContain('.eq("workspace_id", context.workspaceId)');
    expect(fn).toContain('.eq("owner_user_id", context.userId)');
    expect(fn).toContain('.eq("is_default", true)');
  });

  it("has no fallback to a fixture or a browser store — the only client is Supabase", () => {
    expect(src).not.toMatch(/lib\/demo/);
    expect(src).not.toContain("localStorage");
    expect(src).toContain('import { createClient } from "@/lib/supabase/server"');
  });

  it("neither API route imports a demo fixture, and both refuse in demo mode before touching the DB", () => {
    for (const path of ["app/api/dashboard/saved-views/route.ts", "app/api/dashboard/saved-views/[id]/route.ts"]) {
      const routeSrc = read(path);
      expect(routeSrc, path).not.toMatch(/lib\/demo/);
      expect(routeSrc, path).toContain("if (isDemoMode())");
    }
  });
});
