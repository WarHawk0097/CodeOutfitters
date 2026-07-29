// The route patterns a search result, a command or a recent item may point at.
//
// This is deliberately NOT `IMPLEMENTED_ROUTES` from app/dashboard/shell-nav.tsx. That set
// answers a narrower question — "should this sidebar row be a link or an explained
// unavailable row?" — and so it lists only the nine top-level destinations plus the two
// proposal sub-routes the nav reaches. Search reaches deeper: it offers a task, a meeting
// review and a proposal history directly, and those are real pages that the nav simply never
// links to.
//
// Keeping the two separate is the point. Widening the nav set to satisfy search would put
// routes into the sidebar's route registry that the sidebar has no row for.
//
// The constant below is checked against the filesystem in the surface tests — every pattern
// here must have a page.tsx, and every dashboard page.tsx must appear here — so it cannot
// drift into listing a page that was deleted or missing one that was added.

/** Route patterns, in Next's own `[param]` notation. */
export const SEARCH_ROUTE_PATTERNS: ReadonlySet<string> = new Set([
  "/dashboard",
  "/dashboard/my-work",
  "/dashboard/my-work/[taskId]",
  "/dashboard/leads",
  "/dashboard/leads/[leadId]",
  "/dashboard/pipeline",
  "/dashboard/appointments",
  "/dashboard/meetings",
  "/dashboard/meetings/[meetingId]/prepare",
  "/dashboard/meetings/[meetingId]/live",
  "/dashboard/meetings/[meetingId]/review",
  "/dashboard/meetings/[meetingId]/transcript",
  "/dashboard/follow-ups",
  "/dashboard/proposals",
  "/dashboard/proposals/new",
  "/dashboard/proposals/templates",
  "/dashboard/proposals/[proposalId]/edit",
  "/dashboard/proposals/[proposalId]/preview",
  "/dashboard/proposals/[proposalId]/activity",
  "/dashboard/proposals/[proposalId]/access",
  "/dashboard/email-activity",
  "/dashboard/team",
  "/dashboard/settings",
]);

/**
 * Encode a value for a route's query string.
 *
 * Used to seed a list route's search box from a search result — "open the Leads directory
 * already filtered to this person" — which is how a record kind with no detail page still
 * gets a result that lands somewhere specific rather than on an unfiltered list of 128.
 *
 * `encodeURIComponent` is the whole safety story here and it is sufficient: the value can only
 * ever become one query parameter's value, never a second parameter, never a fragment, and
 * never a different path. There is no branch in which this returns an absolute URL, so it
 * cannot be turned into an open redirect.
 */
export function listHrefWithQuery(path: string, query: string): string {
  const trimmed = query.trim();
  return trimmed === "" ? path : `${path}?q=${encodeURIComponent(trimmed)}`;
}
