// Lead row <-> Lead DTO mapping — the one place this shape is defined, so the GET route and
// the live write provider (lib/leads/server-provider.ts) cannot drift on it. Moved out of
// app/api/leads/route.ts when the write path was added.
import type { AppointmentStatus, Lead, LeadStatus } from "@command-center/contracts";

export type LeadRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  business_name: string;
  status: string;
  service_interest: string | null;
  source_page: string | null;
  assigned_owner: string | null;
  appointment_status: string;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export const LEAD_COLUMNS =
  "id, first_name, last_name, business_name, status, service_interest, source_page, assigned_owner, appointment_status, next_follow_up_at, created_at, updated_at";

export function rowToLead(row: LeadRow, teamNames: ReadonlyMap<string, string>): Lead {
  const owner = row.assigned_owner ?? "unassigned";
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Unknown";
  return {
    id: row.id,
    name,
    company: row.business_name,
    // The status/appointment_status check constraints (20260723_inquiry_backend.sql) match
    // these enums exactly, so this cast reflects a DB guarantee, not an assumption.
    status: row.status as LeadStatus,
    owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serviceInterest: row.service_interest ?? undefined,
    appointmentStatus: row.appointment_status as AppointmentStatus,
    nextFollowUpAt: row.next_follow_up_at ?? undefined,
    sourcePage: row.source_page ?? undefined,
    ownerName: owner === "unassigned" ? "Unassigned" : teamNames.get(owner),
  };
}
