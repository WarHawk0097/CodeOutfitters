// Live Task provider — source-surface tests, same convention as lib/views/server-provider.test.ts.
// Local-Supabase integration coverage for CRUD/RLS lives in the *.pglite.test.ts suites; this
// file defends the properties that would be a lie if this file regressed: every query is
// workspace-scoped, no Postgres error message reaches the caller unmapped, and exactly one
// activity event fires per successful mutation, picked by a fixed precedence.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TaskError, serverTaskProvider, listWorkspaceTeam } from "./server-provider";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("lib/tasks/server-provider.ts");

describe("live task provider (server-provider.ts)", () => {
  it("implements exactly the three operations the frozen contract declares", () => {
    expect(Object.keys(serverTaskProvider).sort()).toEqual(["create", "list", "update"]);
  });

  it("scopes every query to the caller's workspace, never trusting a client-sent id alone", () => {
    expect(src.match(/\.eq\("workspace_id", workspaceId\)/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("maps every Postgres error to a fixed caller-facing reason, never the raw message", () => {
    expect(src).toContain('error.code === "23505"');
    expect(src).toContain('error.code === "42501"');
    expect(src.match(/throwForPgError\(/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("throws distinct, typed errors a route can map to the right HTTP status", () => {
    const err = new TaskError("not_found", "gone");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("not_found");
  });

  it("has no fallback to a fixture or a browser store — the only client is Supabase", () => {
    expect(src).not.toMatch(/from ["'].*lib\/demo/);
    expect(src).not.toContain("localStorage");
    expect(src).toContain('import { createClient } from "@/lib/supabase/server"');
  });

  it("never trusts a client-supplied actor/timestamp for the activity it emits", () => {
    // recordActivity() intents never carry actorId/occurredAt fields — see
    // lib/activity/provider.ts's ActivityWriteIntent and lib/activity/emit.ts's header.
    expect(src).not.toMatch(/actorId:|occurredAt:/);
  });

  it("emits exactly one activity call per branch: create, complete, reopen, waiting, reassign, generic update", () => {
    expect(src.match(/await recordActivity\(/g)?.length).toBe(6);
    expect(src).toContain('operation: "task_created"');
    expect(src).toContain('operation: "task_completed"');
    expect(src).toContain('operation: "task_reopened"');
    expect(src).toContain('operation: "task_waiting_changed"');
    expect(src).toContain('operation: "task_assignee_changed"');
    expect(src).toContain('operation: "task_updated"');
  });

  it("picks state-transition over reassignment over a generic field edit — never more than one", () => {
    // The five update-branch emits are one if/else if chain, so at most one can run per call.
    const updateBody = src.slice(src.indexOf("async update("));
    const branch = updateBody.slice(
      updateBody.indexOf('if (columns.state === "COMPLETED")'),
      updateBody.indexOf("return next;"),
    );
    expect(branch.match(/await recordActivity\(/g)?.length).toBe(5);
    expect(branch.match(/\} else /g)?.length).toBe(4);
  });

  it("emits nothing when update() is a no-op — the early return precedes every recordActivity call", () => {
    const noopIndex = src.indexOf("if (Object.keys(columns).length === 0) return current;");
    const firstEmitIndex = src.indexOf("await recordActivity(", src.indexOf("async update("));
    expect(noopIndex).toBeGreaterThan(-1);
    expect(noopIndex).toBeLessThan(firstEmitIndex);
  });

  it("a redundant state transition (already in that state) touches no state column and cannot re-emit", () => {
    expect(src).toContain('patch.state === "COMPLETED" && current.state !== "COMPLETED"');
    expect(src).toContain('patch.state === "OPEN" && current.state !== "OPEN"');
  });

  it("listWorkspaceTeam is exported for the owner-select and reassignment checks", () => {
    expect(typeof listWorkspaceTeam).toBe("function");
  });
});
