// The Saved Views the product ships with.
//
// The rule applied to every entry below is narrow and worth stating, because it is the reason
// this file is shorter than the list it was written from: a default view exists only when its
// filter can be expressed in the filters its route actually has. Not "when the name sounds
// useful" — when the filter is real.
//
// A view named "Stalled" on a board with no last-activity filter would open, show every deal,
// and teach its reader that the Saved View selector does not do anything. That is worse than
// the view being absent, because absence is honest and a lying control is not. So the views
// that could not be built are recorded in {@link UNBUILDABLE_DEFAULT_VIEWS} with the reason and
// the filter each would need, rather than shipped as decoration.
//
// Every filter here is a value the route's own control can produce. Nothing invents a query
// parameter that no list reads.
import {
  defaultFilters,
  savedViewId,
  type SavedView,
  type SavedViewScope,
} from "./model";

function builtIn(
  scope: SavedViewScope,
  name: string,
  filters: Record<string, string>,
): SavedView {
  return {
    id: savedViewId(scope, name),
    scope,
    name,
    filters: { ...defaultFilters(scope), ...filters },
    sort: null,
    columns: [],
    ownership: { kind: "builtIn" },
  };
}

export const DEFAULT_SAVED_VIEWS: readonly SavedView[] = [
  // MY WORK — the task views are literally `TaskView`, so all five requested views are real.
  builtIn("myWork", "Today", { view: "today" }),
  builtIn("myWork", "Upcoming", { view: "upcoming" }),
  builtIn("myWork", "Overdue", { view: "overdue" }),
  builtIn("myWork", "Waiting on client", { view: "waiting" }),
  builtIn("myWork", "Completed", { view: "completed" }),

  // LEADS — `status` is the only closed filter the directory has, so the two views that are a
  // status are real and the three that are a behaviour are not. See below.
  builtIn("leads", "All leads", {}),
  builtIn("leads", "New and uncontacted", { status: "New" }),

  // PIPELINE — the board filters by owner, service and priority. "High priority" is the one
  // requested view that maps to one of them.
  builtIn("pipeline", "High priority", { priority: "High" }),

  // MEETINGS — the view tabs are `upcoming | live | review | completed`.
  builtIn("meetings", "Upcoming", { view: "upcoming" }),
  builtIn("meetings", "Needs review", { view: "review" }),
  builtIn("meetings", "Completed", { view: "completed" }),

  // PROPOSALS — every one of these is a `ProposalState` the Status filter offers.
  builtIn("proposals", "Drafts", { state: "DRAFT" }),
  builtIn("proposals", "Awaiting review", { state: "INTERNAL REVIEW" }),
  builtIn("proposals", "Ready to send", { state: "APPROVED" }),
  builtIn("proposals", "Client response received", { state: "CHANGES REQUESTED" }),

  // FOLLOW-UPS — the view tabs are the five `FollowUpsView` values.
  builtIn("followUps", "Due today", { view: "DUE TODAY" }),
  builtIn("followUps", "Overdue", { view: "OVERDUE" }),
  builtIn("followUps", "Upcoming", { view: "UPCOMING" }),
  builtIn("followUps", "Completed", { view: "COMPLETED" }),

  // EMAIL ACTIVITY — not in the requested set. Two views are added because both are one
  // existing filter and both answer a question people actually ask of a mail log.
  builtIn("emailActivity", "Unread", { read: "unread" }),
  builtIn("emailActivity", "Failed to deliver", { state: "FAILED" }),
];

/**
 * Requested default views that were not built, and what each would need.
 *
 * This is not a backlog note left in a comment — it is exported and asserted in the tests, so
 * that adding the missing filter and forgetting the view, or shipping the view without the
 * filter, both fail rather than pass quietly.
 */
export const UNBUILDABLE_DEFAULT_VIEWS: readonly {
  scope: SavedViewScope;
  name: string;
  reason: string;
}[] = [
  {
    scope: "leads",
    name: "No next action",
    reason:
      "The Leads directory filters by search text, status, service and owner. Whether a lead has a next action is a property of the record, not a filter the API accepts, so this view would return every lead.",
  },
  {
    scope: "leads",
    name: "Inactive",
    reason:
      "There is no last-contacted or last-activity filter. `nextFollowUpAt` is sortable but not filterable, so 'inactive' cannot be narrowed to — only sorted towards.",
  },
  {
    scope: "leads",
    name: "High priority",
    reason:
      "Leads have no priority field. Priority exists on tasks and on opportunities; adding it to a lead view would filter on something the record does not carry.",
  },
  {
    scope: "pipeline",
    name: "Open opportunities",
    reason:
      "The board shows every stage as a column and has no stage filter, so 'open' cannot be expressed. The board already communicates it visually.",
  },
  {
    scope: "pipeline",
    name: "High value",
    reason:
      "Opportunities carry a value but the board offers no value filter. Proposals do — the bucket filter — which is why the equivalent proposal view could have been built and this one cannot.",
  },
  {
    scope: "pipeline",
    name: "Stalled",
    reason:
      "Requires a last-activity or days-in-stage filter. Neither exists on the board or on the opportunity record.",
  },
  {
    scope: "pipeline",
    name: "Closing soon",
    reason: "Opportunities have no close date, so there is no date to compare against.",
  },
  {
    scope: "meetings",
    name: "Needs preparation",
    reason:
      "The Meetings tabs are upcoming, live, needs review and completed. Preparation state is not one of them and is not a filter — the prepare screen is reached from a meeting, not from a filtered list.",
  },
  {
    scope: "proposals",
    name: "Validation blocked",
    reason:
      "Validation blocking is computed per proposal when it is opened; it is not a `ProposalState` and the Status filter cannot select it.",
  },
  {
    scope: "followUps",
    name: "Waiting on client",
    reason:
      "The follow-up tabs are overdue, due today, upcoming, snoozed and completed. Snoozed is not the same fact as waiting on a client, and mapping one to the other would mislabel the rows it returns.",
  },
];

export function defaultViewsForScope(scope: SavedViewScope): SavedView[] {
  return DEFAULT_SAVED_VIEWS.filter((view) => view.scope === scope);
}
