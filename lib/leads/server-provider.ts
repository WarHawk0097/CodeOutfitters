import "server-only";

// Live lead write path — server-only. Same shape as lib/tasks/server-provider.ts: every
// query is workspace-scoped in the SQL itself as defense in depth, not the whole of the
// boundary (RLS in supabase/migrations/20260812000000_leads_update.sql is). Never forwards
// the raw Postgres message to a caller. Only status and owner are writable — that is all
// public.leads grants to `authenticated`.
import { createClient } from "@/lib/supabase/server";
import { assertOwnerInWorkspace } from "@/lib/tasks/server-provider";
import { recordActivity } from "../activity/emit";
import { LEAD_COLUMNS, rowToLead, type LeadRow } from "./row";
import type { Lead } from "@command-center/contracts";

export type LeadErrorCode = "invalid" | "forbidden" | "not_found" | "conflict" | "stage_conflict";

export class LeadError extends Error {
  constructor(
    public readonly code: LeadErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LeadError";
  }
}

function throwForPgError(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new LeadError("conflict", "That lead already exists.");
  if (error.code === "42501") throw new LeadError("forbidden", "You do not have permission to do that.");
  throw new LeadError("invalid", "That lead request could not be completed.");
}

export type LeadUpdateInput = {
  workspaceId: string;
  leadId: string;
  patch: {
    status?: string;
    // The status the caller's own view was based on. Compared against the DB's current
    // status inside change_lead_stage()'s row lock — see that migration's header comment
    // for why a mismatch is rejected as a conflict even when `status` already matches.
    expectedStatus?: string;
    owner?: string;
    reason?: string;
    source?: "lead_detail" | "pipeline";
  };
};

// RPC row shape from public.change_lead_stage() — see
// supabase/migrations/20260813000000_leads_pipeline_stage.sql.
type StageChangeResult = { lead_id: string; changed: boolean; from_stage: string; to_stage: string };

function throwForStageRpcError(error: { code?: string; message: string }): never {
  if (error.message?.includes("stage_conflict")) {
    throw new LeadError("stage_conflict", "This lead has changed since you loaded it. Refresh and try again.");
  }
  if (error.message?.includes("reason_required")) throw new LeadError("invalid", "That status needs a reason.");
  if (error.message?.includes("invalid_stage")) throw new LeadError("invalid", "That status is not valid.");
  if (error.message?.includes("lead_not_found")) throw new LeadError("not_found", "That lead is not available.");
  if (error.message?.includes("forbidden") || error.code === "42501") {
    throw new LeadError("forbidden", "You do not have permission to do that.");
  }
  throwForPgError(error);
}

export async function updateLead(input: LeadUpdateInput): Promise<Lead> {
  const { workspaceId, leadId, patch } = input;
  const supabase = await createClient();

  const { data: currentRow, error: fetchError } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("id", leadId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (fetchError) throwForPgError(fetchError);
  if (!currentRow) throw new LeadError("not_found", "That lead is not available.");

  // Owner names aren't on the row — fetch once, reused for the current row's mapping, the
  // reassignment check, and the updated row's mapping.
  const { data: team, error: teamError } = await supabase
    .from("workspace_memberships")
    .select("user_id, profiles(full_name, email)")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");
  if (teamError) throwForPgError(teamError);
  const teamNames = new Map(
    (team ?? []).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return [row.user_id as string, (profile?.full_name || profile?.email || "Unnamed") as string];
    }),
  );
  const current = rowToLead(currentRow as LeadRow, teamNames);

  // Deliberately NOT gated on `patch.status !== current.status`: `current` is an
  // un-locked read taken moments earlier and may already be stale. Whether this is a
  // real transition, a true no-op, or a stale conflict is decided by change_lead_stage()
  // under its row lock, not by comparing against this read.
  const wantsStatusChange = patch.status !== undefined;
  let newOwnerName: string | undefined;
  const columns: Record<string, unknown> = {};

  if (patch.owner !== undefined && patch.owner !== current.owner) {
    newOwnerName = await assertOwnerInWorkspace(supabase, workspaceId, patch.owner);
    columns.assigned_owner = patch.owner;
  }

  // Every status change — whether from the Lead detail status control or the Pipeline
  // board — goes through change_lead_stage() so it is atomic with its
  // lead_stage_history row. A plain owner-only patch skips the RPC entirely: no stage
  // changed, nothing to put in stage history. A rejected (conflicting) RPC call throws
  // and aborts this whole function before the owner `columns` update below ever runs —
  // a combined owner+status PATCH can therefore never partially apply a rejected status
  // change together with an owner change.
  let stageResult: StageChangeResult | null = null;
  if (wantsStatusChange) {
    const { data: rpcData, error: rpcError } = await supabase.rpc("change_lead_stage", {
      p_lead_id: leadId,
      p_expected_from_stage: patch.expectedStatus ?? null,
      p_to_stage: patch.status,
      p_reason: patch.reason ?? null,
      p_change_source: patch.source ?? "lead_detail",
    });
    if (rpcError) throwForStageRpcError(rpcError);
    stageResult = rpcData as StageChangeResult;
  }

  if (Object.keys(columns).length === 0 && !stageResult?.changed) return current;

  let next = current;
  if (Object.keys(columns).length > 0) {
    const { data, error } = await supabase
      .from("leads")
      .update(columns)
      .eq("id", leadId)
      .eq("workspace_id", workspaceId)
      .select(LEAD_COLUMNS)
      .maybeSingle();
    if (error) throwForPgError(error);
    if (!data) throw new LeadError("not_found", "That lead is not available.");
    next = rowToLead(data as LeadRow, teamNames);
  } else if (stageResult?.changed) {
    // The RPC already wrote the new status — re-read so the returned Lead reflects it
    // (and updated_at) rather than hand-assembling a partial row.
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("id", leadId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (error) throwForPgError(error);
    if (!data) throw new LeadError("not_found", "That lead is not available.");
    next = rowToLead(data as LeadRow, teamNames);
  }

  // Precedence mirrors lib/tasks/server-provider.ts's update(): the most significant thing
  // that happened wins, one event per mutation, never both a status and an owner event for
  // one PATCH. Fired after the RPC's own transaction has committed — see
  // supabase/migrations/20260813000000_leads_pipeline_stage.sql's header comment for why
  // Activity cannot be inside that same transaction.
  const target = { kind: "lead" as const, id: next.id, label: next.name };
  if (stageResult?.changed) {
    await recordActivity({
      workspaceId,
      operation: "lead_stage_changed",
      summary: `${next.name} moved to ${next.status}${patch.reason ? ` — ${patch.reason}` : ""}`,
      target,
      metadata: [
        { label: "From", value: stageResult.from_stage },
        { label: "To", value: stageResult.to_stage },
        ...(patch.reason ? [{ label: "Reason", value: patch.reason }] : []),
      ],
    });
  } else if (newOwnerName !== undefined) {
    await recordActivity({
      workspaceId,
      operation: "lead_assigned",
      summary: `${next.name} assigned to ${newOwnerName}`,
      target,
      metadata: [{ label: "Owner", value: newOwnerName }],
    });
  } else {
    await recordActivity({
      workspaceId,
      operation: "lead_updated",
      summary: `${next.name} updated`,
      target,
    });
  }

  return next;
}

export type LeadCreateInput = {
  workspaceId: string;
  firstName: string;
  lastName?: string;
  businessName: string;
  workEmail: string;
  phone?: string;
  serviceInterest?: string;
  notes?: string;
};

// Manual lead creation — the write surface supabase/migrations/20260812030000_leads_insert.sql
// grants. status/appointment_status are never set here: the table defaults ('New' /
// 'not_started') apply, same starting point as an inquiry-sourced lead. work_email is unique
// (leads_work_email_key) — a duplicate maps to LeadError("conflict") via throwForPgError,
// same as every other write path in this file.
export async function createLead(input: LeadCreateInput): Promise<Lead> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: input.workspaceId,
      first_name: input.firstName,
      last_name: input.lastName || null,
      business_name: input.businessName,
      work_email: input.workEmail,
      phone: input.phone || null,
      service_interest: input.serviceInterest || null,
      workflow_description: input.notes || "",
      source_page: "Manual",
    })
    .select(LEAD_COLUMNS)
    .single();
  if (error) throwForPgError(error);

  const lead = rowToLead(data as LeadRow, new Map());
  await recordActivity({
    workspaceId: input.workspaceId,
    operation: "lead_created",
    summary: `${lead.name} added manually`,
    target: { kind: "lead", id: lead.id, label: lead.name },
  });
  return lead;
}
