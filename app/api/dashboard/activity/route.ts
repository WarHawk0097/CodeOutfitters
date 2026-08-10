// Activity feed — GET only. Nothing calls ActivityProvider.record() yet (see PART 6/13 in the
// task report), so there is no POST endpoint here. Same shape as
// app/api/dashboard/tasks/route.ts: demo-mode 404 guard, session 401 guard, provider call,
// error-code mapping, 503 fallback.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/activity/api-response";
import { serverActivityProvider, ActivityError } from "@/lib/activity/server-provider";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Activity is not available.";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function statusForCode(code: ActivityError["code"]): number {
  switch (code) {
    case "invalid":
      return 422;
    case "forbidden":
      return 403;
  }
}

export async function GET(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const rawLimit = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    const events = await serverActivityProvider.list({ workspaceId: context.workspaceId, limit });
    return jsonOk({ events }, correlationId);
  } catch (error) {
    if (error instanceof ActivityError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
