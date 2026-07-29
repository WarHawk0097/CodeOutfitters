// Task derivations — pure functions over Task[], no React and no store import.
//
// Everything the My Work screen, the sidebar badge, the Overview modules and the
// Next Action module show is computed here, from the same inputs, so a count in the
// sidebar and the list it drills into can never disagree: they call the same function.
//
// "Today" is passed in, never read from the clock. Demo mode passes DEMO_TODAY; live mode
// passes the workspace's day. That is also what makes these functions testable.
import type { Task, TaskPriority, TaskRelation, TaskRelationKind, Tone } from "../demo/types";

export const TASK_VIEWS = ["today", "upcoming", "overdue", "assigned", "waiting", "completed"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export const TASK_VIEW_LABELS: Record<TaskView, string> = {
  today: "Today",
  upcoming: "Upcoming",
  overdue: "Overdue",
  assigned: "Assigned to me",
  waiting: "Waiting on client",
  completed: "Completed",
};

/** Empty copy is per view: "nothing here" is a different fact in Overdue than in
 *  Completed, and a single generic string would misreport one of them. */
export const TASK_VIEW_EMPTY: Record<TaskView, { title: string; hint: string }> = {
  today: { title: "Nothing due today", hint: "Check Upcoming for what is next." },
  upcoming: { title: "Nothing scheduled ahead", hint: "Tasks with a future due date appear here." },
  overdue: { title: "Nothing overdue", hint: "Everything with a due date is still in time." },
  assigned: { title: "No open tasks assigned to you", hint: "Open tasks you own appear here." },
  waiting: { title: "Not waiting on anyone", hint: "Tasks parked on a client or a third party appear here." },
  completed: { title: "Nothing completed yet", hint: "Completed tasks stay here for reference." },
};

export const TASK_PRIORITIES: readonly TaskPriority[] = ["High", "Medium", "Low"];

export const TASK_PRIORITY_TONE: Record<TaskPriority, Tone> = {
  High: "red",
  Medium: "amber",
  Low: "neutral",
};

export const TASK_RELATION_LABELS: Record<TaskRelationKind, string> = {
  lead: "Lead",
  opportunity: "Opportunity",
  appointment: "Appointment",
  meeting: "Meeting",
  proposal: "Proposal",
  followUp: "Follow-up",
};

/**
 * Where "open the record this task is about" goes.
 *
 * Every branch returns a route that exists in app/dashboard. Leads deliberately resolve to
 * the list, not to /dashboard/leads/[leadId]: that detail route reads a different lead
 * dataset than the demo store, so a per-id link would 404. A working list beats a broken
 * deep link.
 */
export function relationHref(relation: TaskRelation): string | null {
  if (!relation) return null;
  switch (relation.kind) {
    case "lead":
      return "/dashboard/leads";
    case "opportunity":
      return "/dashboard/pipeline";
    case "appointment":
      return "/dashboard/appointments";
    case "meeting":
      return `/dashboard/meetings/${relation.id}/review`;
    case "proposal":
      return `/dashboard/proposals/${relation.id}/edit`;
    case "followUp":
      return "/dashboard/follow-ups";
  }
}

/** Overdue is a state of OPEN work only. A WAITING task is not late — the ball is not in
 *  our court — and a task with no due date can never be late. */
export function isOverdue(task: Task, today: string): boolean {
  return task.state === "OPEN" && task.dueDate !== "" && task.dueDate < today;
}

export function isDueToday(task: Task, today: string): boolean {
  return task.state === "OPEN" && task.dueDate === today;
}

export function dueTone(task: Task, today: string): Tone {
  if (task.state === "COMPLETED") return "green";
  if (task.state === "WAITING") return "blue";
  if (isOverdue(task, today)) return "red";
  if (isDueToday(task, today)) return "amber";
  return "neutral";
}

/** Authored label, not a relative-time string: a demo that renders "2 days ago" from the
 *  real clock reads differently on every run. */
export function dueLabel(task: Task, today: string): string {
  if (task.state === "COMPLETED") return task.completedOn ? `Completed ${task.completedOn}` : "Completed";
  if (task.dueDate === "") return "No due date";
  if (isOverdue(task, today)) return `Overdue · due ${task.dueDate}`;
  if (task.dueDate === today) return "Due today";
  return `Due ${task.dueDate}`;
}

export function matchesView(task: Task, view: TaskView, today: string, currentUserId: string): boolean {
  switch (view) {
    case "today":
      return isDueToday(task, today);
    case "upcoming":
      return task.state === "OPEN" && task.dueDate > today;
    case "overdue":
      return isOverdue(task, today);
    case "assigned":
      return task.state !== "COMPLETED" && task.ownerId === currentUserId;
    case "waiting":
      return task.state === "WAITING";
    case "completed":
      return task.state === "COMPLETED";
  }
}

export function filterByView(
  tasks: readonly Task[],
  view: TaskView,
  today: string,
  currentUserId: string,
): Task[] {
  return tasks.filter((task) => matchesView(task, view, today, currentUserId));
}

/** Free-text match across the fields a person would actually search by. */
export function matchesQuery(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return [task.title, task.detail, task.waitingOn, task.relation?.label ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

const PRIORITY_RANK: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };

/**
 * Most urgent first: dated work before undated work, earlier dates before later ones,
 * then priority, then title. Total and stable — same input, same order, every render.
 */
export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if ((a.dueDate === "") !== (b.dueDate === "")) return a.dueDate === "" ? 1 : -1;
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    return a.title.localeCompare(b.title);
  });
}

export function viewCounts(
  tasks: readonly Task[],
  today: string,
  currentUserId: string,
): Record<TaskView, number> {
  const counts = {} as Record<TaskView, number>;
  for (const view of TASK_VIEWS) {
    counts[view] = tasks.reduce(
      (total, task) => total + (matchesView(task, view, today, currentUserId) ? 1 : 0),
      0,
    );
  }
  return counts;
}

/** What the sidebar badge and the header summary count: work that is late or due now.
 *  Waiting and undated work is deliberately excluded — a badge that never reaches zero
 *  stops being a signal. */
export function attentionCount(tasks: readonly Task[], today: string): number {
  return tasks.reduce(
    (total, task) => total + (isOverdue(task, today) || isDueToday(task, today) ? 1 : 0),
    0,
  );
}

/**
 * The one next action on a record: the most urgent open task about it. Returns null when
 * there is none, which the Next Action module renders as an explicit "no next action"
 * state rather than hiding itself.
 */
export function nextActionFor(
  tasks: readonly Task[],
  kind: TaskRelationKind,
  id: string,
): Task | null {
  const open = tasks.filter(
    (task) => task.state !== "COMPLETED" && task.relation?.kind === kind && task.relation.id === id,
  );
  return sortTasks(open)[0] ?? null;
}

/** Every task about a record, newest work first. Used by the record's Next Action module
 *  to show what else is queued without opening My Work. */
export function tasksFor(tasks: readonly Task[], kind: TaskRelationKind, id: string): Task[] {
  return sortTasks(tasks.filter((task) => task.relation?.kind === kind && task.relation.id === id));
}

/** Leads that have no open task against them, by lead id. Overview surfaces the count;
 *  the drill-down shows exactly these records, never an approximation of them. */
export function leadIdsWithoutNextAction(
  tasks: readonly Task[],
  leadIds: readonly string[],
): string[] {
  const covered = new Set(
    tasks.filter((task) => task.state !== "COMPLETED" && task.leadId).map((task) => task.leadId!),
  );
  return leadIds.filter((id) => !covered.has(id));
}
