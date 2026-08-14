// Leads — list, scoped to the caller's authenticated workspace. Same shape as
// app/api/dashboard/tasks/route.ts: authenticate, query, derive, map — RLS
// (supabase/migrations/20260727_command_center_workspaces.sql) is the boundary underneath.
//
// Response envelope is the raw LeadsListResponseSchema shape (rows/total/facetCounts/...),
// NOT the tasks route's {ok:true/false} wrapper — see lib/command-center/contracts/leads.ts.
//
// PATCH /api/leads/[id] lives at app/api/leads/[id]/route.ts.
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { clampPage, clampPageSize } from "@/lib/dashboard/validation";
import { createClient } from "@/lib/supabase/server";
import { listWorkspaceTeam } from "@/lib/tasks/server-provider";
import {
  computeOwnerFacets,
  computeServiceFacets,
  computeStatusFacets,
  countAwaitingFirstContact,
  countNewThisWeek,
  selectLeads,
} from "@/lib/leads/select";
import { LEAD_COLUMNS, rowToLead, type LeadRow } from "@/lib/leads/row";
import { createLead, LeadError } from "@/lib/leads/server-provider";
import { LEADS_PAGE_SIZE, LeadsCreateRequestSchema, LeadStatusSchema, type LeadStatus } from "@command-center/contracts";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Leads are not available.";

function jsonOk(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message, status } }, { status });
}

function statusForCode(code: LeadError["code"]): number {
  switch (code) {
    case "invalid":
      return 422;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
    case "stage_conflict":
      return 409;
  }
}

export async function GET(request: Request): Promise<Response> {
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.");

  const sp = new URL(request.url).searchParams;
  const statusParam = sp.get("status");
  const status = LeadStatusSchema.safeParse(statusParam).success ? (statusParam as LeadStatus) : undefined;
  const view = sp.get("view") === "no-next-action" ? ("no-next-action" as const) : undefined;
  const params = {
    status,
    service: sp.get("service") ?? undefined,
    owner: sp.get("owner") ?? undefined,
    q: sp.get("q") ?? undefined,
    sortBy: sp.get("sortBy") ?? undefined,
    sortDir: sp.get("sortDir") === "desc" ? ("desc" as const) : undefined,
    view,
    page: clampPage(sp.get("page")),
    pageSize: clampPageSize(sp.get("pageSize"), LEADS_PAGE_SIZE, 200),
  };

  try {
    const supabase = await createClient();
    const [leadsResult, team, coveredResult] = await Promise.all([
      supabase.from("leads").select(LEAD_COLUMNS).eq("workspace_id", context.workspaceId),
      listWorkspaceTeam(context.workspaceId),
      view === "no-next-action"
        ? supabase
            .from("tasks")
            .select("lead_id")
            .eq("workspace_id", context.workspaceId)
            .neq("state", "COMPLETED")
            .not("lead_id", "is", null)
        : Promise.resolve({ data: [] as { lead_id: string | null }[], error: null }),
    ]);
    if (leadsResult.error) throw leadsResult.error;
    if (coveredResult.error) throw coveredResult.error;

    const teamNames = new Map(team.map((member) => [member.id, member.name]));
    const dataset = (leadsResult.data as LeadRow[]).map((row) => rowToLead(row, teamNames));
    const coveredLeadIds = new Set((coveredResult.data ?? []).map((r) => r.lead_id as string));

    const { page, matched, matchedWithoutOwner, pageNumber, pageSize } = selectLeads(
      dataset,
      params,
      coveredLeadIds,
    );

    return jsonOk({
      rows: page,
      total: matched.length,
      page: pageNumber,
      pageSize,
      facetCounts: computeStatusFacets(matched),
      serviceFacetCounts: computeServiceFacets(matched),
      ownerFacets: computeOwnerFacets(dataset, matchedWithoutOwner),
      newThisWeekCount: countNewThisWeek(matched, Date.now()),
      awaitingFirstContactCount: countAwaitingFirstContact(matched),
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "42501") return jsonError(403, "forbidden", "You do not have permission to do that.");
    return jsonError(503, "unavailable", NOT_AVAILABLE);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.");

  const body = await request.json().catch(() => null);
  const parsed = LeadsCreateRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "invalid", "That request is not valid.");

  try {
    const lead = await createLead({ workspaceId: context.workspaceId, ...parsed.data });
    return jsonOk(lead, 201);
  } catch (error) {
    if (error instanceof LeadError) return jsonError(statusForCode(error.code), error.code, error.message);
    return jsonError(503, "unavailable", NOT_AVAILABLE);
  }
}
