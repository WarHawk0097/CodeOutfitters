// The command palette catalogue.
//
// The rule this file exists to enforce: every command in it DOES something. There is no
// disabled row, no "coming soon" row, and no row that runs a handler which quietly returns.
// A command that cannot act is not listed, because a palette is a promise that the thing you
// just typed is a thing the application can do.
//
// That is why every command is expressed as a route. Navigation is the one action this
// application can always perform honestly: the target either exists in the route registry or
// the command is not built. Create commands carry a query parameter the destination route
// reads to open its own create dialog — the same dialog its toolbar button opens, not a
// second copy — so "Create task" opens the task form rather than dropping you on a list and
// hoping you find the button.
import {
  canManageWorkspace,
  canMutateRecords,
  type SearchPermissionContext,
} from "./model";

export const COMMAND_GROUPS = ["Go to", "Create", "Views", "Workspace"] as const;
export type CommandGroup = (typeof COMMAND_GROUPS)[number];

export type CommandCenterCommand = {
  id: string;
  label: string;
  group: CommandGroup;
  /** Where it goes. Always a real, implemented route — checked in the surface tests against
   *  IMPLEMENTED_ROUTES, never `#`. */
  href: string;
  /** Extra words that should find this command. Deterministic, hand-authored, no synonym
   *  expansion at runtime — "wip" finding "My Work" is a decision, not a guess. */
  keywords: readonly string[];
  /** One line stating what it will do, shown under the label. */
  detail: string;
};

/** The create parameter a route reads to open its own create dialog on arrival. One name for
 *  all of them, so a route's handling of it is obviously the same handling as its neighbour's. */
export const COMMAND_CREATE_PARAM = "new";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

const NAVIGATION_COMMANDS: readonly CommandCenterCommand[] = [
  {
    id: "go-overview",
    label: "Go to Overview",
    group: "Go to",
    href: "/dashboard",
    keywords: ["home", "dashboard", "start"],
    detail: "The workspace summary and today's attention list.",
  },
  {
    id: "go-my-work",
    label: "Go to My Work",
    group: "Go to",
    href: "/dashboard/my-work",
    keywords: ["tasks", "todo", "wip", "queue"],
    detail: "Your task queue across every record.",
  },
  {
    id: "go-leads",
    label: "Go to Leads",
    group: "Go to",
    href: "/dashboard/leads",
    keywords: ["contacts", "directory", "prospects"],
    detail: "The lead directory.",
  },
  {
    id: "go-pipeline",
    label: "Go to Pipeline",
    group: "Go to",
    href: "/dashboard/pipeline",
    keywords: ["board", "deals", "opportunities", "kanban"],
    detail: "The opportunity board.",
  },
  {
    id: "go-appointments",
    label: "Go to Appointments",
    group: "Go to",
    href: "/dashboard/appointments",
    keywords: ["calendar", "bookings", "schedule"],
    detail: "Booked appointments and their preparation state.",
  },
  {
    id: "go-meetings",
    label: "Go to Meetings",
    group: "Go to",
    href: "/dashboard/meetings",
    keywords: ["calls", "intelligence", "recordings", "reviews"],
    detail: "Meeting intelligence and reviews.",
  },
  {
    id: "go-proposals",
    label: "Go to Proposals",
    group: "Go to",
    href: "/dashboard/proposals",
    keywords: ["quotes", "documents", "offers"],
    detail: "The proposal directory.",
  },
  {
    id: "go-follow-ups",
    label: "Go to Follow-ups",
    group: "Go to",
    href: "/dashboard/follow-ups",
    keywords: ["chase", "nudge", "reminders"],
    detail: "Scheduled touches on leads.",
  },
  {
    id: "go-email-activity",
    label: "Go to Email Activity",
    group: "Go to",
    href: "/dashboard/email-activity",
    keywords: ["mail", "inbox", "messages", "communications"],
    detail: "The email log for this workspace.",
  },
] as const;

// ---------------------------------------------------------------------------
// Workspace administration
//
// Split out because these are the two rows a member must not see. Team and Settings are
// workspace administration; offering them to somebody who will be refused on arrival is a
// worse experience than not offering them.
// ---------------------------------------------------------------------------

const WORKSPACE_COMMANDS: readonly CommandCenterCommand[] = [
  {
    id: "go-team",
    label: "Go to Team",
    group: "Workspace",
    href: "/dashboard/team",
    keywords: ["members", "people", "roles", "invite"],
    detail: "Workspace members and their roles.",
  },
  {
    id: "go-settings",
    label: "Go to Settings",
    group: "Workspace",
    href: "/dashboard/settings",
    keywords: ["preferences", "configuration", "workspace", "theme"],
    detail: "Workspace configuration.",
  },
] as const;

// ---------------------------------------------------------------------------
// Create
//
// Only where the destination route owns a real create dialog. There is deliberately no
// "Add lead": no screen in this application creates a lead — leads arrive from the public
// site's inquiry flow — so a command offering it would be inventing a capability.
// ---------------------------------------------------------------------------

const CREATE_COMMANDS: readonly CommandCenterCommand[] = [
  {
    id: "create-task",
    label: "Create task",
    group: "Create",
    href: `/dashboard/my-work?${COMMAND_CREATE_PARAM}=1`,
    keywords: ["new task", "next action", "todo", "add task"],
    detail: "Opens the new task form on My Work.",
  },
  {
    id: "create-opportunity",
    label: "Create opportunity",
    group: "Create",
    href: `/dashboard/pipeline?${COMMAND_CREATE_PARAM}=1`,
    keywords: ["new deal", "add opportunity", "pipeline"],
    detail: "Opens the new opportunity form on Pipeline.",
  },
  {
    id: "create-meeting",
    label: "Schedule meeting",
    group: "Create",
    href: `/dashboard/meetings?${COMMAND_CREATE_PARAM}=1`,
    keywords: ["new meeting", "book call", "add meeting"],
    detail: "Opens the new meeting form on Meeting Intelligence.",
  },
  {
    id: "create-proposal",
    label: "Create proposal",
    group: "Create",
    href: `/dashboard/proposals?${COMMAND_CREATE_PARAM}=1`,
    keywords: ["new proposal", "quote", "draft proposal"],
    detail: "Opens the new proposal form, starting from a lead.",
  },
  {
    id: "create-follow-up",
    label: "Schedule follow-up",
    group: "Create",
    href: `/dashboard/follow-ups?${COMMAND_CREATE_PARAM}=1`,
    keywords: ["new follow up", "chase", "add follow-up"],
    detail: "Opens the new follow-up form.",
  },
] as const;

// ---------------------------------------------------------------------------
// Views
//
// Each of these is a query state the destination route already reads today. `?view=` on My
// Work predates this release; these commands are shortcuts to it, not new behaviour.
// ---------------------------------------------------------------------------

const VIEW_COMMANDS: readonly CommandCenterCommand[] = [
  {
    id: "view-tasks-overdue",
    label: "Show overdue tasks",
    group: "Views",
    href: "/dashboard/my-work?view=overdue",
    keywords: ["late", "past due", "behind"],
    detail: "My Work, filtered to work that is past its due date.",
  },
  {
    id: "view-tasks-today",
    label: "Show tasks due today",
    group: "Views",
    href: "/dashboard/my-work?view=today",
    keywords: ["today", "due today", "now"],
    detail: "My Work, filtered to today.",
  },
  {
    id: "view-tasks-waiting",
    label: "Show waiting-on-client tasks",
    group: "Views",
    href: "/dashboard/my-work?view=waiting",
    keywords: ["blocked", "waiting", "client", "on hold"],
    detail: "My Work, filtered to work where the ball is not in our court.",
  },
  {
    id: "view-tasks-upcoming",
    label: "Show upcoming tasks",
    group: "Views",
    href: "/dashboard/my-work?view=upcoming",
    keywords: ["later", "next", "future"],
    detail: "My Work, filtered to work that is not due yet.",
  },
  {
    id: "view-proposals",
    label: "Show proposals awaiting a client response",
    group: "Views",
    href: "/dashboard/proposals",
    keywords: ["sent", "viewed", "awaiting", "outstanding"],
    detail: "The proposal directory, where sent and viewed proposals are listed.",
  },
] as const;

/** Every command that exists, before any permission decision. Exported for the surface tests,
 *  which check each href against the route registry. */
export const ALL_COMMANDS: readonly CommandCenterCommand[] = [
  ...NAVIGATION_COMMANDS,
  ...CREATE_COMMANDS,
  ...VIEW_COMMANDS,
  ...WORKSPACE_COMMANDS,
];

/**
 * The commands a given context may run.
 *
 * Two filters, both stated rather than implied:
 *
 *   * Workspace administration needs `admin` or above. A member does not see Team or Settings.
 *   * Create commands need a role that may write. They are also withheld in live mode, because
 *     live mode has no record provider yet — every create dialog on every route currently
 *     renders a provider-required notice — and a command that reliably lands on "not connected
 *     yet" is a command that does not work.
 */
export function commandsFor(context: SearchPermissionContext): CommandCenterCommand[] {
  return ALL_COMMANDS.filter((command) => {
    if (command.group === "Workspace") return canManageWorkspace(context);
    if (command.group === "Create") return canMutateRecords(context) && !context.live;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Commands are matched on label first, then on their authored aliases. The ordering within
 *  a score band is the catalogue order above, which is hand-arranged and stable — so the
 *  palette does not reshuffle between keystrokes that score identically. */
export function matchCommands(
  commands: readonly CommandCenterCommand[],
  rawQuery: string,
  limit = 8,
): CommandCenterCommand[] {
  const query = normalize(rawQuery);
  if (query === "") return commands.slice(0, limit);
  const tokens = query.split(" ");

  const scored: { command: CommandCenterCommand; score: number; order: number }[] = [];
  commands.forEach((command, order) => {
    const label = normalize(command.label);
    const aliases = command.keywords.map(normalize);
    let total = 0;
    for (const token of tokens) {
      let best = 0;
      if (label === token) best = 1000;
      else if (label.startsWith(token)) best = 800;
      else if (label.split(" ").some((word) => word.startsWith(token))) best = 600;
      else if (label.includes(token)) best = 400;
      else if (aliases.some((alias) => alias === token)) best = 350;
      else if (aliases.some((alias) => alias.split(" ").some((word) => word.startsWith(token)))) best = 300;
      else if (aliases.some((alias) => alias.includes(token))) best = 200;
      if (best === 0) return;
      total += best;
    }
    if (total > 0) scored.push({ command, score: total, order });
  });

  scored.sort((a, b) => (a.score === b.score ? a.order - b.order : b.score - a.score));
  return scored.slice(0, limit).map((entry) => entry.command);
}

/** Fixed heading order, empty headings dropped — the same rule the search results follow. */
export function groupCommands(
  commands: readonly CommandCenterCommand[],
): { group: CommandGroup; commands: CommandCenterCommand[] }[] {
  const groups: { group: CommandGroup; commands: CommandCenterCommand[] }[] = [];
  for (const group of COMMAND_GROUPS) {
    const inGroup = commands.filter((command) => command.group === group);
    if (inGroup.length > 0) groups.push({ group, commands: inGroup });
  }
  return groups;
}
