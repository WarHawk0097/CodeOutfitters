// PATCH /api/leads/[id] — status/owner updates, scoped to the caller's authenticated
// workspace. Same envelope as app/api/leads/route.ts's GET ({error:{code,message,status}},
// no {ok} wrapper) — that route's header comment explains why this is its own convention,
// separate from app/api/dashboard/tasks/[id]/route.ts's.
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { isUuid } from "@/lib/dashboard/validation";
import { LeadError, updateLead } from "@/lib/leads/server-provider";
import { LeadsPatchRequestSchema } from "@command-center/contracts";

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
      return 409;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.");

  const { id } = await params;
  if (!isUuid(id)) return jsonError(422, "invalid", "That lead id is not valid.");

  const body = await request.json().catch(() => null);
  const parsed = LeadsPatchRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "invalid", "That request is not valid.");

  try {
    const lead = await updateLead({
      workspaceId: context.workspaceId,
      leadId: id,
      patch: parsed.data,
    });
    return jsonOk(lead);
  } catch (error) {
    if (error instanceof LeadError) return jsonError(statusForCode(error.code), error.code, error.message);
    return jsonError(503, "unavailable", NOT_AVAILABLE);
  }
}
