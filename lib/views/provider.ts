// The live Saved View plane contract.
//
// Demo mode keeps personal views in this browser (lib/views/store.ts) and labels them
// "Saved in this browser". Live mode must not, and the reason is not tidiness: a live Saved
// View is workspace data. A shared view is authored by one person and read by everyone, which
// makes "who may write it" a role decision, and a role decision cannot be made in a tab.
//
// So in live mode the browser asks a server, the server decides, and RLS decides again
// underneath. That implementation is not part of this release. Rather than write live views to
// localStorage and present them as though they were an account feature — which would produce a
// "shared" view nobody else can see, and a personal view that vanishes with a cleared cache —
// this module resolves to `provider_required` and the UI says what is missing. There is no
// third branch and no silent fallback to the demo store.
import type {
  SavedView,
  SavedViewFilterState,
  SavedViewScope,
  SavedViewSortState,
} from "./model";

/**
 * A live Saved View request.
 *
 * Both identifiers are here to be checked, never to be trusted. They are what the server
 * resolved from the session; a provider must verify the caller belongs to `workspaceId` and
 * must never accept either from a request body. The browser does not get to say which
 * workspace it is in, whose views it is reading, or who owns what it writes.
 */
export type SavedViewProviderContext = {
  workspaceId: string;
  /** The authenticated user, resolved server-side. The owner recorded on a created view is
   *  this value and not anything the client sent. */
  userId: string;
};

export type SavedViewDraftInput = {
  scope: SavedViewScope;
  name: string;
  filters: SavedViewFilterState;
  sort: SavedViewSortState;
  /** Personal is the default everywhere. Shared is a request, not an instruction: the provider
   *  checks the caller's role and refuses rather than downgrading silently, because a view the
   *  author believes is shared but is not is worse than a refusal. */
  visibility: "personal" | "shared";
};

/**
 * What a live implementation must satisfy.
 *
 * Obligations the type cannot express, which a reviewer should check:
 *
 *   * `workspace_id` is in the SQL predicate, not applied to the result. A cross-workspace id
 *     is a rejection, never an empty list — an empty list is indistinguishable from "that
 *     workspace has no views", which confirms the workspace exists.
 *   * A personal view is readable and writable by its owner alone. Not by an admin, not by the
 *     workspace owner. It is somebody's private arrangement of their own screen.
 *   * A shared view is readable by every member and writable only by a permitted role. Both
 *     halves are re-checked server-side; `canCreateSharedView` in lib/views/model.ts is the
 *     UI's copy of the rule for enabling a control, and is not the rule.
 *   * `filters` is validated against the scope's declared fields on the way in, by the server.
 *     A stored view is later applied to somebody else's screen, so an unvalidated jsonb column
 *     is a stored injection waiting for a route to forward it somewhere.
 *   * A filter value that looks like a token, a hash, an address or a URL is rejected — the
 *     same list as `sensitiveValueProblem`, enforced again where it counts.
 *   * The default view is per user, never per workspace. One person's choice of opening screen
 *     is not a setting they may apply to a colleague.
 */
export type SavedViewProvider = {
  /** Personal views for this user plus shared views for this workspace, in one call, already
   *  filtered to what the caller may see. */
  list(context: SavedViewProviderContext, scope: SavedViewScope): Promise<readonly SavedView[]>;
  create(context: SavedViewProviderContext, draft: SavedViewDraftInput): Promise<SavedView>;
  update(context: SavedViewProviderContext, id: string, draft: SavedViewDraftInput): Promise<SavedView>;
  /** Permitted for the owner of a personal view, and for an authorized role on a shared one. */
  remove(context: SavedViewProviderContext, id: string): Promise<void>;
  /** This user's opening view for one list. `null` clears it. */
  setDefault(
    context: SavedViewProviderContext,
    scope: SavedViewScope,
    id: string | null,
  ): Promise<void>;
};

export type SavedViewPlane =
  /** Demo mode: personal views in this browser, labelled as such, shared unavailable. */
  | { kind: "demo" }
  /** Live mode with no server implementation wired: explicit, honest, no fallback. */
  | { kind: "provider_required"; reason: string };

export const SAVED_VIEWS_PROVIDER_REQUIRED_TITLE = "Saved Views are not connected yet";

export const SAVED_VIEWS_PROVIDER_REQUIRED_REASON =
  "This workspace is running in live mode. Saved Views belong to the workspace and to your account, so they are stored on the server rather than in this browser, and they are not available until the Saved View service is connected. Nothing is being saved locally in their place.";

/** Why the Shared option is offered but not selectable in demo mode. Shown on the disabled
 *  control itself — the option stays visible so the product does not pretend the concept is
 *  absent, and stays disabled so nothing can claim a browser-local view is shared. */
export const SHARED_VIEWS_UNAVAILABLE_REASON =
  "Sharing a view with your workspace needs the workspace database. In this demo, views are saved in this browser only, so they cannot be shared.";

export function resolveSavedViewPlane(live: boolean): SavedViewPlane {
  return live
    ? { kind: "provider_required", reason: SAVED_VIEWS_PROVIDER_REQUIRED_REASON }
    : { kind: "demo" };
}
