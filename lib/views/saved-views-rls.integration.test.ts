import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Saved Views RLS + persistence integration tests (Part 8 of the Saved Views work order).
// Runs against the REAL local Docker stack, same seeded users/workspaces as
// lib/dashboard/dashboard-rls.integration.test.ts: owner@... owns "primary", second@... owns
// "isolation" — two different workspaces, so every cross-user check here is also a
// cross-workspace check. Every query goes through an authenticated client; RLS is the boundary
// under test, not the provider (lib/views/server-provider.test.ts already covers that source
// surface). Test rows are deleted in afterAll — never leaves state behind, never touches
// production.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const OWNER_EMAIL = process.env.BOOTSTRAP_OWNER_EMAIL || "owner@codeoutfitters.local";
const OWNER_PASSWORD = process.env.BOOTSTRAP_OWNER_PASSWORD || "localdev-owner-pass";
const SECOND_EMAIL = process.env.BOOTSTRAP_SECOND_EMAIL || "second@codeoutfitters.local";
const SECOND_PASSWORD = process.env.BOOTSTRAP_SECOND_PASSWORD || "localdev-second-pass";

async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message} (run the bootstrap script)`);
  return c;
}

async function ownWorkspaceId(c: SupabaseClient): Promise<string> {
  const { data, error } = await c.from("workspace_memberships").select("workspace_id").limit(1).single();
  if (error) throw error;
  return data!.workspace_id as string;
}

let owner: SupabaseClient;
let second: SupabaseClient;
let ownerWorkspaceId: string;
let secondWorkspaceId: string;
const createdIds: string[] = [];

beforeAll(async () => {
  owner = await signedInClient(OWNER_EMAIL, OWNER_PASSWORD);
  second = await signedInClient(SECOND_EMAIL, SECOND_PASSWORD);
  ownerWorkspaceId = await ownWorkspaceId(owner);
  secondWorkspaceId = await ownWorkspaceId(second);
});

afterAll(async () => {
  // Best-effort cleanup — RLS means only the owning client can delete its own rows, so a plain
  // owner-scoped delete-by-id covers everything this file created (nothing here is shared).
  for (const id of createdIds) {
    await owner.from("saved_views").delete().eq("id", id);
    await second.from("saved_views").delete().eq("id", id);
  }
});

const NAME_PREFIX = "RLS test view ";
const uniqueName = () => `${NAME_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe("saved views — CRUD persists through RLS", () => {
  it("creates a personal view as the owner, with owner_user_id set by the server, not the client", async () => {
    const name = uniqueName();
    const { data, error } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name, filters: { status: "New" }, visibility: "personal" })
      .select("id, owner_user_id, workspace_id, name")
      .single();
    expect(error).toBeNull();
    expect(data!.name).toBe(name);
    expect(data!.owner_user_id).not.toBeNull();
    createdIds.push(data!.id);
  });

  it("reads it back for the creator, with the filters that were written", async () => {
    const name = uniqueName();
    const { data: created } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name, filters: { status: "Won" }, visibility: "personal" })
      .select("id")
      .single();
    createdIds.push(created!.id);

    const { data, error } = await owner.from("saved_views").select("name, filters").eq("id", created!.id).single();
    expect(error).toBeNull();
    expect(data!.name).toBe(name);
    expect(data!.filters).toEqual({ status: "Won" });
  });

  it("survives a fresh session — a brand new signed-in client sees the same row", async () => {
    const name = uniqueName();
    const { data: created } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "pipeline", name, filters: {}, visibility: "personal" })
      .select("id")
      .single();
    createdIds.push(created!.id);

    const freshOwner = await signedInClient(OWNER_EMAIL, OWNER_PASSWORD);
    const { data, error } = await freshOwner.from("saved_views").select("name").eq("id", created!.id).single();
    expect(error).toBeNull();
    expect(data!.name).toBe(name);
  });

  it("updates and the new value persists on the next read", async () => {
    const original = uniqueName();
    const renamed = uniqueName();
    const { data: created } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name: original, filters: {}, visibility: "personal" })
      .select("id")
      .single();
    createdIds.push(created!.id);

    const { error: updateError } = await owner
      .from("saved_views")
      .update({ name: renamed, filters: { status: "New" } })
      .eq("id", created!.id);
    expect(updateError).toBeNull();

    const { data } = await owner.from("saved_views").select("name, filters").eq("id", created!.id).single();
    expect(data!.name).toBe(renamed);
    expect(data!.filters).toEqual({ status: "New" });
  });

  it("deletes, and the row is gone on the next read — no reappearance after refresh", async () => {
    const { data: created } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name: uniqueName(), filters: {}, visibility: "personal" })
      .select("id")
      .single();
    const id = created!.id;

    const { error: deleteError } = await owner.from("saved_views").delete().eq("id", id);
    expect(deleteError).toBeNull();

    const { data: afterDelete, error: readError } = await owner
      .from("saved_views")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    expect(readError).toBeNull();
    expect(afterDelete).toBeNull();
  });
});

describe("saved views — cross-user / cross-workspace isolation", () => {
  it("a personal view in the owner's workspace is invisible to a user in a different workspace", async () => {
    const { data: created } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name: uniqueName(), filters: {}, visibility: "personal" })
      .select("id")
      .single();
    createdIds.push(created!.id);

    const { data, error } = await second.from("saved_views").select("id").eq("id", created!.id).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("a shared view in the owner's workspace is still invisible across workspaces — visibility is workspace-scoped, not global", async () => {
    const { data: created, error: createError } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name: uniqueName(), filters: {}, visibility: "shared" })
      .select("id")
      .single();
    expect(createError).toBeNull();
    createdIds.push(created!.id);

    const { data } = await second.from("saved_views").select("id").eq("id", created!.id).maybeSingle();
    expect(data).toBeNull();
  });

  it("a cross-workspace update matches zero rows — not an error, and nothing changes", async () => {
    const original = uniqueName();
    const { data: created } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name: original, filters: {}, visibility: "personal" })
      .select("id")
      .single();
    createdIds.push(created!.id);

    const { data: updated, error } = await second
      .from("saved_views")
      .update({ name: "hijacked" })
      .eq("id", created!.id)
      .select("id");
    expect(error).toBeNull();
    expect(updated ?? []).toHaveLength(0);

    const { data: stillOriginal } = await owner.from("saved_views").select("name").eq("id", created!.id).single();
    expect(stillOriginal!.name).toBe(original);
  });

  it("a cross-workspace delete matches zero rows — the row survives", async () => {
    const { data: created } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "leads", name: uniqueName(), filters: {}, visibility: "personal" })
      .select("id")
      .single();
    createdIds.push(created!.id);

    const { data: deleted, error } = await second.from("saved_views").delete().eq("id", created!.id).select("id");
    expect(error).toBeNull();
    expect(deleted ?? []).toHaveLength(0);

    const { data: stillThere } = await owner.from("saved_views").select("id").eq("id", created!.id).maybeSingle();
    expect(stillThere).not.toBeNull();
  });

  it("list() only ever returns rows from the caller's own workspace", async () => {
    const ownerOnly = uniqueName();
    const secondOnly = uniqueName();
    const { data: a } = await owner
      .from("saved_views")
      .insert({ workspace_id: ownerWorkspaceId, scope: "myWork", name: ownerOnly, filters: {}, visibility: "personal" })
      .select("id")
      .single();
    const { data: b } = await second
      .from("saved_views")
      .insert({ workspace_id: secondWorkspaceId, scope: "myWork", name: secondOnly, filters: {}, visibility: "personal" })
      .select("id")
      .single();
    createdIds.push(a!.id, b!.id);

    const { data: ownerList } = await owner.from("saved_views").select("name").eq("scope", "myWork");
    const { data: secondList } = await second.from("saved_views").select("name").eq("scope", "myWork");
    expect((ownerList ?? []).map((r) => r.name)).toContain(ownerOnly);
    expect((ownerList ?? []).map((r) => r.name)).not.toContain(secondOnly);
    expect((secondList ?? []).map((r) => r.name)).toContain(secondOnly);
    expect((secondList ?? []).map((r) => r.name)).not.toContain(ownerOnly);
  });
});
