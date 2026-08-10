// Live Search provider — source-surface tests, same convention as lib/tasks/server-provider.test.ts
// and lib/views/server-provider.test.ts. Local-Supabase/RLS integration coverage is out of scope
// for this file; this defends the properties that would be a lie if this file regressed: every
// query is workspace-scoped, text matching happens in SQL rather than after an unbounded fetch,
// and nothing here reads a fixture.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { serverSearchProvider } from "./server-provider";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("lib/search/server-provider.ts");

describe("live search provider (server-provider.ts)", () => {
  it("implements exactly the two operations the frozen contract declares", () => {
    expect(Object.keys(serverSearchProvider).sort()).toEqual(["recent", "search"]);
  });

  it("scopes every entity query to the caller's workspace", () => {
    expect(src.match(/\.eq\("workspace_id", workspaceId\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("bounds every entity fetch instead of pulling an unbounded table into Node", () => {
    expect(src.match(/\.limit\(PER_ENTITY_ROWS\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("has no fallback to a fixture or a browser store — the only client is Supabase", () => {
    expect(src).not.toMatch(/from ["'].*lib\/demo/);
    expect(src).not.toContain("localStorage");
    expect(src).toContain('import { createClient } from "@/lib/supabase/server"');
  });

  it("returns an empty page instead of guessing when there is no server-side recent list", async () => {
    await expect(
      serverSearchProvider.recent({ workspaceId: "ws-1", userId: "user-1", limit: 10 }),
    ).resolves.toEqual({ results: [], nextCursor: null });
  });

  it("returns an empty page for a query shorter than the minimum, without touching Supabase", async () => {
    await expect(
      serverSearchProvider.search({ workspaceId: "ws-1", userId: "user-1", text: "a", scope: "all", limit: 10 }),
    ).resolves.toEqual({ results: [], nextCursor: null });
  });
});
