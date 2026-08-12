import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Leads update RLS + persistence integration tests — proves the write surface
// supabase/migrations/20260812000000_leads_update.sql grants (status, assigned_owner only)
// against the REAL local Docker stack. Same seeded users/workspaces as
// lib/dashboard/dashboard-rls.integration.test.ts / lib/views/saved-views-rls.integration.test.ts:
// owner@... owns "primary" (seeded leads ada@seed../grace@seed..), second@... owns "isolation"
// (seeded lead foreign@seed..). Every query goes through an authenticated anon-key client —
// RLS/column-grant is the boundary under test, not the provider (lib/leads/server-provider.test.ts
// already covers workspace-scoping/error-mapping as source surface).
//
// Owner-membership validation (an assigned_owner must be an active member of the caller's
// workspace) and reason-required-for-status validation are APPLICATION-layer checks
// (assertOwnerInWorkspace in lib/tasks/server-provider.ts, LeadsPatchRequestSchema's
// superRefine) — not DB grants or RLS policies, so they are deliberately NOT re-tested here.
// The grant tested here has no opinion on which UUID goes into assigned_owner.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const OWNER_EMAIL = process.env.BOOTSTRAP_OWNER_EMAIL || "owner@codeoutfitters.local";
const OWNER_PASSWORD = process.env.BOOTSTRAP_OWNER_PASSWORD || "localdev-owner-pass";
const SECOND_EMAIL = process.env.BOOTSTRAP_SECOND_EMAIL || "second@codeoutfitters.local";
const SECOND_PASSWORD = process.env.BOOTSTRAP_SECOND_PASSWORD || "localdev-second-pass";

async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message} (run scripts/bootstrap-command-center.mjs)`);
  return c;
}

async function ownWorkspaceId(c: SupabaseClient): Promise<string> {
  const { data, error } = await c.from("workspace_memberships").select("workspace_id").limit(1).single();
  if (error) throw error;
  return data!.workspace_id as string;
}

async function ownUserId(c: SupabaseClient): Promise<string> {
  const { data, error } = await c.auth.getUser();
  if (error) throw error;
  return data.user!.id;
}

async function leadIdByEmail(c: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await c.from("leads").select("id, status, assigned_owner").eq("work_email", email).single();
  if (error) throw error;
  return data!.id as string;
}

let owner: SupabaseClient;
let second: SupabaseClient;
let ownerUserId: string;
let adaLeadId: string;
let graceLeadId: string;
let foreignLeadId: string;

beforeAll(async () => {
  owner = await signedInClient(OWNER_EMAIL, OWNER_PASSWORD);
  second = await signedInClient(SECOND_EMAIL, SECOND_PASSWORD);
  ownerUserId = await ownUserId(owner);
  adaLeadId = await leadIdByEmail(owner, "ada@seed.codeoutfitters.local");
  graceLeadId = await leadIdByEmail(owner, "grace@seed.codeoutfitters.local");
  foreignLeadId = await leadIdByEmail(second, "foreign@seed.codeoutfitters.local");
});

afterAll(async () => {
  // Best-effort — restore the two rows this file mutates to their seeded baseline so a rerun
  // of scripts/bootstrap-command-center.mjs is never required between test runs.
  await owner.from("leads").update({ status: "New", assigned_owner: null }).eq("id", adaLeadId);
  await owner.from("leads").update({ status: "New", assigned_owner: null }).eq("id", graceLeadId);
});

describe("leads update — grant scoped to status/assigned_owner only, RLS-gated", () => {
  it("A: a workspace member can update the permitted fields on their own workspace's lead", async () => {
    const { data, error } = await owner
      .from("leads")
      .update({ status: "Contacted", assigned_owner: ownerUserId })
      .eq("id", adaLeadId)
      .select("status, assigned_owner")
      .single();
    expect(error).toBeNull();
    expect(data!.status).toBe("Contacted");
    expect(data!.assigned_owner).toBe(ownerUserId);
  });

  it("B: a user in a different workspace cannot update the lead — zero rows matched, nothing changes", async () => {
    const { data: updated, error } = await second
      .from("leads")
      .update({ status: "Won" })
      .eq("id", adaLeadId)
      .select("id");
    expect(error).toBeNull();
    expect(updated ?? []).toHaveLength(0);

    const { data: stillContacted } = await owner.from("leads").select("status").eq("id", adaLeadId).single();
    expect(stillContacted!.status).toBe("Contacted");
  });

  it("E: a permitted update persists across a fresh session (new signed-in client)", async () => {
    const { error } = await owner.from("leads").update({ status: "Appt Scheduled" }).eq("id", graceLeadId);
    expect(error).toBeNull();

    const freshOwner = await signedInClient(OWNER_EMAIL, OWNER_PASSWORD);
    const { data, error: readError } = await freshOwner.from("leads").select("status").eq("id", graceLeadId).single();
    expect(readError).toBeNull();
    expect(data!.status).toBe("Appt Scheduled");
  });

  it("F: a column outside the grant (work_email) cannot be overwritten through this endpoint's write path", async () => {
    const { error } = await owner
      .from("leads")
      .update({ work_email: "hijacked@example.com" })
      .eq("id", adaLeadId);
    expect(error).not.toBeNull();
    expect(error!.code).toBe("42501");

    const { data: unchanged } = await owner.from("leads").select("work_email").eq("id", adaLeadId).single();
    expect(unchanged!.work_email).toBe("ada@seed.codeoutfitters.local");
  });

  it("H: no RLS bypass — the foreign workspace's lead is invisible and unwritable to the owner client", async () => {
    const { data: read } = await owner.from("leads").select("id").eq("id", foreignLeadId).maybeSingle();
    expect(read).toBeNull();

    const { data: written, error } = await owner
      .from("leads")
      .update({ status: "Won" })
      .eq("id", foreignLeadId)
      .select("id");
    expect(error).toBeNull();
    expect(written ?? []).toHaveLength(0);
  });
});
