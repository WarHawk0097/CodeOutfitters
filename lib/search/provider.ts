// The live search plane contract.
//
// Demo mode builds its index in the browser from fixtures (lib/search/demo-index.ts) and says
// so. Live mode must not, and the reason is worth stating plainly rather than assuming: a
// browser-built index would have to be given every record in the workspace in order to search
// them, which turns "search" into "ship the whole workspace to the client and filter it
// there". The filtering would then be cosmetic — the records a role may not see would already
// be in the tab.
//
// So in live mode search is a server call: GET /api/dashboard/search, answered inside the
// caller's session by serverSearchProvider (lib/search/server-provider.ts), with RLS as the
// boundary a second time underneath. The dialog's live-mode UI (components/command-center/
// search-live.ts) is the sole consumer. There is no third branch.
import type {
  CommandCenterSearchDocument,
  CommandCenterSearchResult,
  SearchEntityType,
  SearchScope,
} from "./model";

/**
 * A live search request.
 *
 * `workspaceId` is here to be checked, not to be trusted. It comes from the authenticated
 * membership resolved on the server; a provider must still verify that the caller belongs to
 * it and must never accept it from a request body. The field exists so a provider that
 * receives a workspace id different from the session's can fail loudly rather than silently
 * search whichever one it was handed.
 */
export type SearchProviderQuery = {
  workspaceId: string;
  /** The authenticated user, resolved server-side from the session. */
  userId: string;
  text: string;
  scope: SearchScope;
  /** Narrow to particular record kinds. A provider may return fewer kinds than requested — it
   *  may never return more. */
  types?: readonly SearchEntityType[];
  /** Hard cap on rows. A provider must apply its own maximum regardless of what is asked. */
  limit: number;
  /** Opaque, provider-minted continuation token. Never a row offset the client can inflate,
   *  and never something a client can craft to page past a permission boundary. */
  cursor?: string | null;
};

export type SearchProviderPage = {
  /** Already permission-filtered, already sanitized to the pointer-shaped document. A provider
   *  must not return a raw row: the document type is the contract with the UI precisely so a
   *  column added to a table later does not silently start reaching the browser. */
  results: readonly CommandCenterSearchResult[];
  /** `null` when there is no further page. */
  nextCursor: string | null;
};

/**
 * What a live implementation must satisfy.
 *
 * Obligations that are not expressible in the type, and which a reviewer should check:
 *
 *   * Every query is scoped to the caller's workspace in the SQL itself, not by filtering
 *     afterwards. A `where workspace_id = $1` that is applied after a `limit` returns fewer
 *     rows than expected AND leaks the existence of other workspaces' records through the
 *     count.
 *   * Text matching runs server-side. Do not fetch rows and rank them in Node — that is the
 *     browser problem moved one process over.
 *   * Never index or return a secure proposal token, a token hash, an access link, a client
 *     response body or a recipient address. The same list as the demo index, for the same
 *     reasons (see lib/search/demo-index.ts).
 *   * Restricted activity is filtered in the query, by visibility, not hidden in the response.
 *   * Never log the query text alongside the user id. A search box accumulates a remarkably
 *     complete picture of what somebody is working on.
 */
export type SearchProvider = {
  search(query: SearchProviderQuery): Promise<SearchProviderPage>;
  /** Recent permitted records for an empty query — the "you were just here" list, resolved
   *  server-side rather than from browser storage, so it reflects the workspace rather than
   *  this device. */
  recent(query: Omit<SearchProviderQuery, "text" | "scope">): Promise<SearchProviderPage>;
};

/** The demo plane's shape, for symmetry with the live one. The index is a plain array because
 *  in demo mode there is nothing to authorize and nothing to page. */
export type DemoSearchIndex = readonly CommandCenterSearchDocument[];

export type SearchPlane =
  /** Demo mode: the index is built in this browser from fixtures, and every surface says so. */
  | { kind: "demo" }
  /** Live mode: results come from GET /api/dashboard/search, scoped to the caller's session. */
  | { kind: "live" };

export function resolveSearchPlane(live: boolean): SearchPlane {
  return live ? { kind: "live" } : { kind: "demo" };
}
