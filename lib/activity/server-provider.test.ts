// Live Activity provider — source-surface tests, same convention as
// lib/views/server-provider.test.ts. Local-Supabase RLS/trigger coverage for the actual
// insert/select behavior lives in lib/activity/activity-migration.pglite.test.ts. These tests
// defend the properties that would be a lie if this file regressed: every query is
// workspace-scoped, no Postgres error message reaches the caller unmapped, no actor/instant is
// client-supplied, and nothing here reads a fixture.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ActivityError, serverActivityProvider } from "./server-provider";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("lib/activity/server-provider.ts");

describe("live activity provider (server-provider.ts)", () => {
  it("implements exactly the two operations the frozen contract declares", () => {
    expect(Object.keys(serverActivityProvider).sort()).toEqual(["list", "record"]);
  });

  it("scopes every query to the caller's workspace, never trusting a client-sent id alone", () => {
    expect(src).toContain('.eq("workspace_id", query.workspaceId)');
    expect(src).toContain("workspace_id: intent.workspaceId");
    expect(src).toContain("defense in depth");
  });

  it("never sets actor_id, occurred_at or created_at from the client — the trigger derives them", () => {
    expect(src).toContain("trigger-derived");
    expect(src).not.toMatch(/actor_id:\s*(intent|context)/);
    expect(src).not.toMatch(/occurred_at:\s*(intent|context)/);
    expect(src).not.toMatch(/created_at:\s*(intent|context)/);
  });

  it("maps every Postgres error to a fixed caller-facing reason, never the raw message", () => {
    expect(src).toContain('error.code === "42501"');
    expect(src).toContain("Never forwards the");
    expect(src).toContain("raw Postgres message to a caller");
    expect(src.match(/throwForPgError\(/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("throws distinct, typed errors a route can map to the right HTTP status", () => {
    const err = new ActivityError("invalid", "bad");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("invalid");
    for (const code of ["invalid", "forbidden"] as const) {
      expect(new ActivityError(code, "x").code).toBe(code);
    }
  });

  it("rejects an empty summary before it reaches the database", () => {
    expect(src).toContain('if (summary === "")');
  });

  it("bounds every read — an unbounded activity query is a slow page and a large payload", () => {
    expect(src).toContain("DEFAULT_LIMIT");
    expect(src).toContain("MAX_LIMIT");
    expect(src).toContain(".limit(limit)");
  });

  it("orders newest first", () => {
    expect(src).toContain('.order("occurred_at", { ascending: false })');
  });

  it("has no fallback to a fixture or a browser store — the only client is Supabase", () => {
    expect(src).not.toMatch(/lib\/demo/);
    expect(src).not.toContain("localStorage");
    expect(src).toContain('import { createClient } from "@/lib/supabase/server"');
  });

  it("the API route imports no demo fixture and refuses in demo mode before touching the DB", () => {
    const routeSrc = read("app/api/dashboard/activity/route.ts");
    expect(routeSrc).not.toMatch(/lib\/demo/);
    expect(routeSrc).toContain("if (isDemoMode())");
  });

  it("the API route exposes read only — nothing calls record() yet, so there is no POST", () => {
    const routeSrc = read("app/api/dashboard/activity/route.ts");
    expect(routeSrc).toContain("export async function GET");
    expect(routeSrc).not.toContain("export async function POST");
  });
});
