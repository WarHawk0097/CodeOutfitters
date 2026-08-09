// The live SavedViewProvider — the only file that speaks to public.saved_views.
//
// Everything here trusts nothing from the client except what lib/views/model.ts already
// validates (validateSavedViewDraft) and what SavedViewProviderContext carries, which is
// itself resolved server-side (see lib/dashboard/server.ts's getDashboardContext, used by the
// route handlers in app/api/dashboard/saved-views/**). workspace_id is always an explicit
// .eq() filter, never trusted from a row the client handed back — a cross-workspace id must
// fail, not return an empty list, because an empty list would confirm the workspace exists.
//
// RLS (supabase/migrations/20260801000000_command_center_saved_views.sql) is the actual
// boundary; the .eq("workspace_id", ...) filters here are defense in depth, not the whole of
// it. An UPDATE/DELETE that RLS's USING clause excludes simply matches zero rows — Postgres
// does not error for that, so `update`/`remove` treat "matched nothing" as "not found", the
// same non-leaking answer whether the row never existed or the caller may not touch it.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeFilters,
  sanitizeSort,
  validateSavedViewDraft,
  type SavedView,
  type SavedViewScope,
} from "./model";
import type { SavedViewDraftInput, SavedViewProvider, SavedViewProviderContext } from "./provider";

export type SavedViewErrorCode = "invalid" | "forbidden" | "not_found" | "conflict";

export class SavedViewError extends Error {
  constructor(
    public readonly code: SavedViewErrorCode,
    message: string,
  ) {
    super(message);
  }
}

type SavedViewRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  scope: SavedViewScope;
  filters: unknown;
  sort_state: unknown;
  visibility: "personal" | "shared";
};

const SELECT_COLUMNS = "id, workspace_id, owner_user_id, name, scope, filters, sort_state, visibility";

function rowToView(row: SavedViewRow): SavedView {
  return {
    id: row.id,
    scope: row.scope,
    name: row.name,
    filters: sanitizeFilters(row.scope, row.filters),
    sort: sanitizeSort(row.scope, row.sort_state),
    // No scope declares a column list yet (ScopeDescriptor.columns is always []); see
    // lib/views/store.ts's readView for the same omission in the demo path.
    columns: [],
    ownership:
      row.visibility === "shared"
        ? { kind: "shared", workspaceId: row.workspace_id }
        : { kind: "personal", userId: row.owner_user_id },
  };
}

function validateDraftOrThrow(draft: SavedViewDraftInput): void {
  const problems = validateSavedViewDraft({
    scope: draft.scope,
    name: draft.name,
    filters: draft.filters,
    sort: draft.sort,
  });
  if (problems.length > 0) throw new SavedViewError("invalid", problems[0]!);
}

/** Postgres error -> the caller-facing reason. Never forwards the raw Postgres message: that
 *  can name a column or constraint, and this is a boundary a browser talks to directly. */
function throwForPgError(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new SavedViewError("conflict", "A view with that name already exists.");
  }
  if (error.code === "42501") {
    throw new SavedViewError("forbidden", "You do not have permission to do that.");
  }
  throw new SavedViewError("invalid", "That saved view request could not be completed.");
}

export const serverSavedViewProvider: SavedViewProvider = {
  async list(context, scope) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_views")
      .select(SELECT_COLUMNS)
      .eq("workspace_id", context.workspaceId)
      .eq("scope", scope)
      // Deterministic: personal-before-shared, then name. Not "most recent first" — a saved
      // view's position in the menu should not move because somebody else edited theirs.
      .order("visibility", { ascending: true })
      .order("name", { ascending: true });
    if (error) throwForPgError(error);
    return ((data ?? []) as SavedViewRow[]).map(rowToView);
  },

  async create(context, draft) {
    validateDraftOrThrow(draft);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_views")
      .insert({
        workspace_id: context.workspaceId,
        // owner_user_id is intentionally omitted: the column default is auth.uid(), and the
        // insert policy's WITH CHECK re-verifies it. Setting it here would just be a second
        // place the same value has to stay correct.
        name: draft.name.trim(),
        scope: draft.scope,
        filters: draft.filters,
        sort_state: draft.sort ?? {},
        visibility: draft.visibility,
      })
      .select(SELECT_COLUMNS)
      .single();
    if (error) throwForPgError(error);
    return rowToView(data as SavedViewRow);
  },

  async update(context, id, draft) {
    validateDraftOrThrow(draft);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_views")
      .update({
        name: draft.name.trim(),
        filters: draft.filters,
        sort_state: draft.sort ?? {},
      })
      .eq("id", id)
      .eq("workspace_id", context.workspaceId)
      .select(SELECT_COLUMNS)
      .maybeSingle();
    if (error) throwForPgError(error);
    if (!data) throw new SavedViewError("not_found", "That saved view is not available to edit.");
    return rowToView(data as SavedViewRow);
  },

  async remove(context, id) {
    const supabase = await createClient();
    // Matches the house pattern in lib/ai/conversation/supabase-store.ts's delete(): a delete
    // that matches zero rows (already gone, or not yours) is not an error — the end state the
    // caller wanted is achieved either way, and it does not leak which case it was.
    const { error } = await supabase
      .from("saved_views")
      .delete()
      .eq("id", id)
      .eq("workspace_id", context.workspaceId);
    if (error) throwForPgError(error);
  },

  async setDefault(context, scope, id) {
    const supabase = await createClient();

    if (id !== null) {
      const { data: target, error: fetchError } = await supabase
        .from("saved_views")
        .select("owner_user_id, visibility, scope")
        .eq("id", id)
        .eq("workspace_id", context.workspaceId)
        .maybeSingle();
      if (fetchError) throwForPgError(fetchError);
      if (!target) throw new SavedViewError("not_found", "That saved view is not available.");
      if (target.scope !== scope) {
        throw new SavedViewError("invalid", "That view does not belong to this list.");
      }
      // saved_views_one_default_idx is scoped to (workspace_id, owner_user_id, scope) — a
      // shared row's owner is whoever created it, not the viewer setting a default. There is
      // no schema-correct way for a member to record "this shared view is my opening screen"
      // today, so the feature is scoped to personal views only rather than writing a default
      // that would silently mean something else. See PART 11 of the Saved Views work order.
      if (target.visibility !== "personal" || target.owner_user_id !== context.userId) {
        throw new SavedViewError(
          "invalid",
          "Only your own personal views can be set as your default for this list.",
        );
      }
    }

    // Clear any existing default first: the partial unique index allows at most one, and a
    // single UPDATE cannot both clear the old row and set a different one atomically.
    const { error: clearError } = await supabase
      .from("saved_views")
      .update({ is_default: false })
      .eq("workspace_id", context.workspaceId)
      .eq("owner_user_id", context.userId)
      .eq("scope", scope)
      .eq("is_default", true);
    if (clearError) throwForPgError(clearError);

    if (id === null) return;

    const { error } = await supabase
      .from("saved_views")
      .update({ is_default: true })
      .eq("id", id)
      .eq("workspace_id", context.workspaceId);
    if (error) throwForPgError(error);
  },
};

/**
 * This caller's default view for one scope, or `null`.
 *
 * Not part of the SavedViewProvider contract — that type is frozen (lib/views/provider.ts,
 * lib/search/provider.test.ts) and SavedView carries no `isDefault` field, matching the demo
 * store's shape (state.defaults[scope] is tracked beside the view list, not on it). The list
 * route reads this alongside `list()` for the same reason the demo bar reads
 * `state.defaults[scope]` beside `viewsForScope`.
 */
export async function getDefaultViewId(
  context: SavedViewProviderContext,
  scope: SavedViewScope,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_views")
    .select("id")
    .eq("workspace_id", context.workspaceId)
    .eq("owner_user_id", context.userId)
    .eq("scope", scope)
    .eq("is_default", true)
    .maybeSingle();
  if (error) throwForPgError(error);
  return (data as { id: string } | null)?.id ?? null;
}
