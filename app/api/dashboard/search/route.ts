// Live Search — GET only. Same shape as app/api/dashboard/activity/route.ts: demo-mode 404
// guard, session 401 guard, provider call, 503 fallback. No POST: search never writes anything.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/search/api-response";
import { serverSearchProvider } from "@/lib/search/server-provider";
import { SEARCH_SCOPES, type SearchScope } from "@/lib/search/model";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Search is not available.";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function isSearchScope(value: string): value is SearchScope {
  return (SEARCH_SCOPES as readonly string[]).includes(value);
}

export async function GET(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const url = new URL(request.url);
  const text = url.searchParams.get("q") ?? "";
  const rawScope = url.searchParams.get("scope") ?? "all";
  if (!isSearchScope(rawScope)) {
    return jsonError(422, "invalid", "That search scope is not recognized.", correlationId, { scope: rawScope });
  }

  const rawLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    const page = await serverSearchProvider.search({
      workspaceId: context.workspaceId,
      userId: context.userId,
      text,
      scope: rawScope,
      limit,
    });
    return jsonOk({ results: page.results, nextCursor: page.nextCursor }, correlationId);
  } catch {
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
