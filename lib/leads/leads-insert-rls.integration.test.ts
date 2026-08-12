import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Leads insert RLS + persistence integration tests — proves the write surface
// supabase/migrations/20260812030000_leads_insert.sql grants (manual "Add Lead") against the
// REAL local Docker stack. Same seeded users/workspaces as leads-update-rls.integration.test.ts:
// owner@... owns "primary", second@... owns "isolation". Every query goes through an
// authenticated anon-key client — RLS/column-grant is the boundary under test, not the provider
// (lib/leads/server-provider.test.ts already covers workspace-scoping/error-mapping as source
// surface).

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

let owner: SupabaseClient;
let second: SupabaseClient;
let ownerWorkspaceId: string;
let secondWorkspaceId: string;
const insertedIds: string[] = [];

beforeAll(async () => {
  owner = await signedInClient(OWNER_EMAIL, OWNER_PASSWORD);
  second = await signedInClient(SECOND_EMAIL, SECOND_PASSWORD);
  ownerWorkspaceId = await ownWorkspaceId(owner);
  secondWorkspaceId = await ownWorkspaceId(second);
});

afterAll(async () => {
  if (insertedIds.length) await owner.from("leads").delete().in("id", insertedIds);
});

describe("leads insert — grant scoped to the manual Add Lead columns only, RLS-gated", () => {
  it("A: a workspace member can insert a lead into their own workspace, status defaults to New", async () => {
    const { data, error } = await owner
      .from("leads")
      .insert({
        first_name: "Insert",
        last_name: "RlsProbe",
        business_name: "Probe Co",
        work_email: `insert-rls-a-${Date.now()}@example.com`,
        workflow_description: "",
        workspace_id: ownerWorkspaceId,
      })
      .select("id, status, appointment_status, workspace_id")
      .single();
    expect(error).toBeNull();
    expect(data!.status).toBe("New");
    expect(data!.appointment_status).toBe("not_started");
    expect(data!.workspace_id).toBe(ownerWorkspaceId);
    insertedIds.push(data!.id as string);
  });

  it("B: cannot insert a lead into a workspace the caller is not a member of", async () => {
    const { data, error } = await owner
      .from("leads")
      .insert({
        first_name: "Insert",
        last_name: "CrossWorkspace",
        business_name: "Probe Co",
        work_email: `insert-rls-b-${Date.now()}@example.com`,
        workflow_description: "",
        workspace_id: secondWorkspaceId,
      })
      .select("id");
    expect(error).not.toBeNull();
    expect(error!.code).toBe("42501");
    expect(data ?? []).toHaveLength(0);
  });

  it("C: a column outside the grant (status) cannot be set through this write path", async () => {
    const { error } = await owner.from("leads").insert({
      first_name: "Insert",
      last_name: "StatusProbe",
      business_name: "Probe Co",
      work_email: `insert-rls-c-${Date.now()}@example.com`,
      workflow_description: "",
      workspace_id: ownerWorkspaceId,
      status: "Won",
    });
    expect(error).not.toBeNull();
    expect(error!.code).toBe("42501");
  });
});
