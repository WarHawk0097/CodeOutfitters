// Saved Views — list and create, scoped to the caller's authenticated workspace.
//
// Identity comes from getDashboardContext() only: never a query parameter, never the request
// body. Same shape as app/api/ai/copilot/conversations/route.ts — authenticate, validate, hand
// off to the provider, map the result — with RLS as the actual boundary underneath either way.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/views/api-response";
import { isSavedViewScope, validateSavedViewDraft, type SavedViewSortState } from "@/lib/views/model";
import { getDefaultViewId, SavedViewError, serverSavedViewProvider } from "@/lib/views/server-provider";

// The Supabase SSR client requires the Node runtime, matching every other authenticated
// dashboard route.
export const runtime = "nodejs";

const NOT_AVAILABLE = "Saved Views are not available.";

function statusForCode(code: SavedViewError["code"]): number {
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

/** `undefined` marks a malformed sort payload — distinct from `null`, "no sort requested". */
function normalizeSort(raw: unknown): SavedViewSortState | undefined {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.field !== "string") return undefined;
  if (candidate.direction !== "asc" && candidate.direction !== "desc") return undefined;
  return { field: candidate.field, direction: candidate.direction };
}

export async function GET(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const scope = new URL(request.url).searchParams.get("scope");
  if (!isSavedViewScope(scope)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      scope: "That is not a list this application has.",
    });
  }

  try {
    const providerContext = { workspaceId: context.workspaceId, userId: context.userId };
    const [views, defaultViewId] = await Promise.all([
      serverSavedViewProvider.list(providerContext, scope),
      getDefaultViewId(providerContext, scope),
    ]);
    return jsonOk(
      { views, defaultViewId, viewer: { userId: context.userId, role: context.role } },
      correlationId,
    );
  } catch (error) {
    if (error instanceof SavedViewError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(422, "validation", "That request was not valid JSON.", correlationId);
  }
  if (typeof body !== "object" || body === null) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId);
  }
  const candidate = body as Record<string, unknown>;

  if (!isSavedViewScope(candidate.scope)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      scope: "That is not a list this application has.",
    });
  }
  if (typeof candidate.name !== "string") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      name: "A view needs a name.",
    });
  }
  if (typeof candidate.filters !== "object" || candidate.filters === null || Array.isArray(candidate.filters)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      filters: "Filters must be an object.",
    });
  }
  if (candidate.visibility !== "personal" && candidate.visibility !== "shared") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      visibility: "Visibility must be personal or shared.",
    });
  }
  const sort = normalizeSort(candidate.sort);
  if (sort === undefined) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      sort: "That is not a valid sort.",
    });
  }

  const draftForValidation = {
    scope: candidate.scope,
    name: candidate.name,
    filters: candidate.filters as Record<string, unknown>,
    sort,
  };
  const problems = validateSavedViewDraft(draftForValidation);
  if (problems.length > 0) {
    return jsonError(422, "validation", problems[0]!, correlationId);
  }

  try {
    const view = await serverSavedViewProvider.create(
      { workspaceId: context.workspaceId, userId: context.userId },
      {
        scope: candidate.scope,
        name: candidate.name,
        filters: candidate.filters as Record<string, string>,
        sort,
        visibility: candidate.visibility,
      },
    );
    return jsonOk({ view }, correlationId);
  } catch (error) {
    if (error instanceof SavedViewError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
