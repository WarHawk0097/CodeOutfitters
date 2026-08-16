// Live lead provider — source-surface tests, same convention as lib/tasks/server-provider.test.ts.
// Local-Supabase integration coverage for RLS lives elsewhere; this file defends the properties
// that would be a lie if this file regressed: every query is workspace-scoped, no Postgres error
// message reaches the caller unmapped, and exactly one activity event fires per successful update.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createLead, LeadError, updateLead } from "./server-provider";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const src = read("lib/leads/server-provider.ts");

describe("live lead provider (server-provider.ts)", () => {
  it("exports updateLead", () => {
    expect(typeof updateLead).toBe("function");
  });

  it("exports createLead", () => {
    expect(typeof createLead).toBe("function");
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
    const err = new LeadError("not_found", "gone");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("not_found");
  });

  it("has no fallback to a fixture or a browser store — the only client is Supabase", () => {
    expect(src).not.toMatch(/from ["'].*lib\/demo/);
    expect(src).not.toContain("localStorage");
    expect(src).toContain('import { createClient } from "@/lib/supabase/server"');
  });

  it("never trusts a client-supplied actor/timestamp for the activity it emits", () => {
    expect(src).not.toMatch(/actorId:|occurredAt:/);
  });

  it("reuses assertOwnerInWorkspace and displayNamesByUserId rather than duplicating them", () => {
    expect(src).toContain(
      'import { assertOwnerInWorkspace, displayNamesByUserId } from "@/lib/tasks/server-provider"',
    );
  });

  it("never embeds profiles(...) on a workspace_memberships select (PostgREST has no FK for it)", () => {
    expect(src).not.toMatch(/workspace_memberships["'][\s\S]{0,80}profiles\(/);
    expect(src).not.toContain(".select(\"user_id, profiles(full_name, email)\")");
  });

  it("emits exactly one activity call per branch: stage change, reassign, generic update, create", () => {
    expect(src.match(/await recordActivity\(/g)?.length).toBe(4);
    expect(src).toContain('operation: "lead_stage_changed"');
    expect(src).toContain('operation: "lead_assigned"');
    expect(src).toContain('operation: "lead_updated"');
    expect(src).toContain('operation: "lead_created"');
  });

  it("routes every status change through the atomic change_lead_stage RPC, never a raw status update", () => {
    expect(src).toContain('supabase.rpc("change_lead_stage"');
    expect(src).not.toMatch(/columns\.status\s*=/);
  });

  it("createLead never sets status/appointment_status — a manual lead keeps the table default", () => {
    const branch = src.slice(src.indexOf("export async function createLead"));
    expect(branch).not.toMatch(/status:\s*["']New["']/);
    expect(branch).not.toContain("appointment_status:");
  });

  it("picks stage change over reassignment over a generic field edit — never more than one", () => {
    const branch = src.slice(src.indexOf("if (stageResult?.changed) {"), src.indexOf("return next;"));
    expect(branch.match(/await recordActivity\(/g)?.length).toBe(3);
    expect(branch.match(/\} else /g)?.length).toBe(2);
  });

  it("emits nothing when update is a no-op — the early return precedes every recordActivity call", () => {
    const noopIndex = src.indexOf("if (Object.keys(columns).length === 0 && !stageResult?.changed) return current;");
    const firstEmitIndex = src.indexOf("await recordActivity(");
    expect(noopIndex).toBeGreaterThan(-1);
    expect(noopIndex).toBeLessThan(firstEmitIndex);
  });
});
