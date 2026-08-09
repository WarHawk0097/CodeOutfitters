// Saved Views — update (rename / edit filters) and delete for one view, plus the
// set-default toggle. Same identity and error-mapping shape as
// app/api/dashboard/saved-views/route.ts; see that file for the reasoning.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { isUuid } from "@/lib/dashboard/validation";
import { jsonError, jsonOk } from "@/lib/views/api-response";
import { isSavedViewScope, validateSavedViewDraft, type SavedViewSortState } from "@/lib/views/model";
import { SavedViewError, serverSavedViewProvider } from "@/lib/views/server-provider";

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

function normalizeSort(raw: unknown): SavedViewSortState | undefined {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.field !== "string") return undefined;
  if (candidate.direction !== "asc" && candidate.direction !== "desc") return undefined;
  return { field: candidate.field, direction: candidate.direction };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;
  if (!isUuid(id)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      id: "That is not a valid saved view id.",
    });
  }

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

  // Two distinct operations share this endpoint: setting/clearing the default view carries no
  // content, and content edits (rename, or a re-save of filters/sort) never touch is_default.
  // Keeping them apart avoids a request that could, for instance, silently un-default a view
  // while renaming it.
  if ("isDefault" in candidate) {
    if (typeof candidate.isDefault !== "boolean") {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        isDefault: "Must be true or false.",
      });
    }
    try {
      await serverSavedViewProvider.setDefault(
        { workspaceId: context.workspaceId, userId: context.userId },
        candidate.scope,
        candidate.isDefault ? id : null,
      );
      return jsonOk({}, correlationId);
    } catch (error) {
      if (error instanceof SavedViewError) {
        return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
      }
      return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
    }
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
  const sort = normalizeSort(candidate.sort);
  if (sort === undefined) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      sort: "That is not a valid sort.",
    });
  }

  const problems = validateSavedViewDraft({
    scope: candidate.scope,
    name: candidate.name,
    filters: candidate.filters as Record<string, unknown>,
    sort,
  });
  if (problems.length > 0) {
    return jsonError(422, "validation", problems[0]!, correlationId);
  }

  try {
    const view = await serverSavedViewProvider.update(
      { workspaceId: context.workspaceId, userId: context.userId },
      id,
      {
        scope: candidate.scope,
        name: candidate.name,
        filters: candidate.filters as Record<string, string>,
        sort,
        // Not editable post-creation by this endpoint; the provider ignores it for update().
        visibility: "personal",
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;
  if (!isUuid(id)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      id: "That is not a valid saved view id.",
    });
  }

  try {
    await serverSavedViewProvider.remove({ workspaceId: context.workspaceId, userId: context.userId }, id);
    return jsonOk({}, correlationId);
  } catch (error) {
    if (error instanceof SavedViewError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
