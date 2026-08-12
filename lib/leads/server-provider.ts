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

export type LeadErrorCode = "invalid" | "forbidden" | "not_found" | "conflict";

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
  patch: { status?: string; owner?: string; reason?: string };
};

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

  const columns: Record<string, unknown> = {};
  let newOwnerName: string | undefined;

  if (patch.status !== undefined && patch.status !== current.status) columns.status = patch.status;
  if (patch.owner !== undefined && patch.owner !== current.owner) {
    newOwnerName = await assertOwnerInWorkspace(supabase, workspaceId, patch.owner);
    columns.assigned_owner = patch.owner;
  }

  if (Object.keys(columns).length === 0) return current;

  const { data, error } = await supabase
    .from("leads")
    .update(columns)
    .eq("id", leadId)
    .eq("workspace_id", workspaceId)
    .select(LEAD_COLUMNS)
    .maybeSingle();
  if (error) throwForPgError(error);
  if (!data) throw new LeadError("not_found", "That lead is not available.");
  const next = rowToLead(data as LeadRow, teamNames);

  // Precedence mirrors lib/tasks/server-provider.ts's update(): the most significant thing
  // that happened wins, one event per mutation, never both a status and an owner event for
  // one PATCH.
  const target = { kind: "lead" as const, id: next.id, label: next.name };
  if (columns.status !== undefined) {
    await recordActivity({
      workspaceId,
      operation: "lead_status_changed",
      summary: `${next.name} moved to ${next.status}${patch.reason ? ` — ${patch.reason}` : ""}`,
      target,
      metadata: [
        { label: "From", value: current.status },
        { label: "To", value: next.status },
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
