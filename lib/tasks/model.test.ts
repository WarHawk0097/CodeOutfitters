// Task derivations (tests 1-34). Everything the My Work switch, the sidebar badge, the
// Overview modules and the Next Action module count is computed by these functions, so
// this file is where "the number and the list agree" is actually enforced.
import { describe, expect, it } from "vitest";
import { createSeedState, DEMO_CURRENT_USER_ID, DEMO_TODAY } from "../demo/seed";
import type { Task } from "../demo/types";
import {
  attentionCount,
  dueLabel,
  dueTone,
  filterByView,
  isDueToday,
  isOverdue,
  leadIdsWithoutNextAction,
  matchesQuery,
  nextActionFor,
  relationHref,
  sortTasks,
  TASK_VIEW_EMPTY,
  TASK_VIEW_LABELS,
  TASK_VIEWS,
  tasksFor,
  viewCounts,
} from "./model";

const seed = createSeedState();
const tasks = seed.tasks;

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t-x",
    title: "A task",
    detail: "",
    ownerId: DEMO_CURRENT_USER_ID,
    state: "OPEN",
    priority: "Medium",
    dueDate: DEMO_TODAY,
    leadId: null,
    relation: null,
    waitingOn: "",
    completedOn: "",
    createdOn: "2026-04-17",
    ...overrides,
  };
}

// Every route the app actually builds. relationHref may only produce members of this set.
const REAL_ROUTES = new Set([
  "/dashboard/leads",
  "/dashboard/pipeline",
  "/dashboard/appointments",
  "/dashboard/follow-ups",
]);

describe("task fixtures (tests 1-8)", () => {
  // 1
  it("seeds a deterministic task set — same input, identical output", () => {
    expect(tasks.length).toBeGreaterThan(0);
    expect(createSeedState().tasks).toEqual(tasks);
  });

  // 2
  it("covers every view the My Work switch offers, so no tab starts empty", () => {
    for (const view of TASK_VIEWS) {
      expect(
        filterByView(tasks, view, DEMO_TODAY, DEMO_CURRENT_USER_ID).length,
        `view ${view} has no seeded task`,
      ).toBeGreaterThan(0);
    }
  });

  // 3
  it("includes tasks owned by Marc and by other members", () => {
    const owners = new Set(tasks.map((t) => t.ownerId));
    expect(owners.has(DEMO_CURRENT_USER_ID)).toBe(true);
    expect(owners.size).toBeGreaterThan(1);
  });

  // 4
  it("relates tasks to leads, meetings, proposals, appointments and follow-ups", () => {
    const kinds = new Set(tasks.map((t) => t.relation?.kind).filter(Boolean));
    for (const kind of ["lead", "meeting", "proposal", "appointment", "followUp"]) {
      expect(kinds.has(kind as never), `no seeded task relates to a ${kind}`).toBe(true);
    }
  });

  // 5
  it("includes general tasks with no related record", () => {
    expect(tasks.some((t) => t.relation === null)).toBe(true);
  });

  // 6
  it("points every relation at a record that exists in the same seed", () => {
    const byKind: Record<string, ReadonlySet<string>> = {
      opportunity: new Set(seed.opportunities.map((r) => r.id)),
      appointment: new Set(seed.appointments.map((r) => r.id)),
      meeting: new Set(seed.meetings.map((r) => r.id)),
      proposal: new Set(seed.proposals.map((r) => r.id)),
      followUp: new Set(seed.followUps.map((r) => r.id)),
    };
    for (const t of tasks) {
      if (!t.relation || t.relation.kind === "lead") continue;
      expect(byKind[t.relation.kind]!.has(t.relation.id), `${t.id} -> ${t.relation.id}`).toBe(true);
    }
  });

  // 7
  it("never derives a date from the clock — every due date is on or around the fixed today", () => {
    for (const t of tasks) {
      expect(t.dueDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)).toBe(true);
      expect(t.createdOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  // 8
  it("keeps completedOn and waitingOn consistent with state", () => {
    for (const t of tasks) {
      if (t.state === "COMPLETED") expect(t.completedOn).not.toBe("");
      else expect(t.completedOn).toBe("");
      if (t.state === "WAITING") expect(t.waitingOn).not.toBe("");
      else expect(t.waitingOn).toBe("");
    }
  });
});

describe("overdue and due-today (tests 9-16)", () => {
  // 9
  it("counts an open task with a past due date as overdue", () => {
    expect(isOverdue(task({ dueDate: "2026-04-20" }), DEMO_TODAY)).toBe(true);
  });

  // 10
  it("never counts a waiting task as overdue — the ball is not in our court", () => {
    expect(isOverdue(task({ dueDate: "2026-04-01", state: "WAITING", waitingOn: "Client" }), DEMO_TODAY)).toBe(false);
  });

  // 11
  it("never counts a completed task as overdue", () => {
    expect(isOverdue(task({ dueDate: "2026-04-01", state: "COMPLETED", completedOn: "2026-04-02" }), DEMO_TODAY)).toBe(false);
  });

  // 12
  it("never counts an undated task as overdue", () => {
    expect(isOverdue(task({ dueDate: "" }), DEMO_TODAY)).toBe(false);
  });

  // 13
  it("treats a task due exactly today as due today, not overdue", () => {
    const t = task({ dueDate: DEMO_TODAY });
    expect(isDueToday(t, DEMO_TODAY)).toBe(true);
    expect(isOverdue(t, DEMO_TODAY)).toBe(false);
  });

  // 14
  it("tones overdue red, due-today amber, waiting blue and completed green", () => {
    expect(dueTone(task({ dueDate: "2026-04-01" }), DEMO_TODAY)).toBe("red");
    expect(dueTone(task({ dueDate: DEMO_TODAY }), DEMO_TODAY)).toBe("amber");
    expect(dueTone(task({ state: "WAITING", waitingOn: "Client" }), DEMO_TODAY)).toBe("blue");
    expect(dueTone(task({ state: "COMPLETED", completedOn: DEMO_TODAY }), DEMO_TODAY)).toBe("green");
  });

  // 15
  it("labels due dates without reading a clock", () => {
    expect(dueLabel(task({ dueDate: DEMO_TODAY }), DEMO_TODAY)).toBe("Due today");
    expect(dueLabel(task({ dueDate: "2026-04-20" }), DEMO_TODAY)).toBe("Overdue · due 2026-04-20");
    expect(dueLabel(task({ dueDate: "2026-05-01" }), DEMO_TODAY)).toBe("Due 2026-05-01");
    expect(dueLabel(task({ dueDate: "" }), DEMO_TODAY)).toBe("No due date");
  });

  // 16
  it("counts only overdue plus due-today as needing attention", () => {
    const sample = [
      task({ id: "a", dueDate: "2026-04-01" }),
      task({ id: "b", dueDate: DEMO_TODAY }),
      task({ id: "c", dueDate: "2026-05-01" }),
      task({ id: "d", state: "WAITING", waitingOn: "Client", dueDate: "2026-04-01" }),
      task({ id: "e", dueDate: "" }),
    ];
    expect(attentionCount(sample, DEMO_TODAY)).toBe(2);
  });
});

describe("views (tests 17-24)", () => {
  // 17
  it("offers exactly the six required views, in order", () => {
    expect([...TASK_VIEWS]).toEqual(["today", "upcoming", "overdue", "assigned", "waiting", "completed"]);
  });

  // 18
  it("labels the views as the program specifies", () => {
    expect(TASK_VIEW_LABELS.assigned).toBe("Assigned to me");
    expect(TASK_VIEW_LABELS.waiting).toBe("Waiting on client");
  });

  // 19
  it("gives every view its own empty state rather than one generic message", () => {
    const titles = TASK_VIEWS.map((view) => TASK_VIEW_EMPTY[view].title);
    expect(new Set(titles).size).toBe(TASK_VIEWS.length);
  });

  // 20
  it("scopes Assigned to me to the current member and excludes completed work", () => {
    const rows = filterByView(tasks, "assigned", DEMO_TODAY, DEMO_CURRENT_USER_ID);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((t) => t.ownerId === DEMO_CURRENT_USER_ID)).toBe(true);
    expect(rows.every((t) => t.state !== "COMPLETED")).toBe(true);
  });

  // 21
  it("puts every waiting task in Waiting on client and nowhere in Today or Overdue", () => {
    const waiting = filterByView(tasks, "waiting", DEMO_TODAY, DEMO_CURRENT_USER_ID);
    expect(waiting.every((t) => t.state === "WAITING")).toBe(true);
    const today = new Set(filterByView(tasks, "today", DEMO_TODAY, DEMO_CURRENT_USER_ID).map((t) => t.id));
    const overdue = new Set(filterByView(tasks, "overdue", DEMO_TODAY, DEMO_CURRENT_USER_ID).map((t) => t.id));
    expect(waiting.some((t) => today.has(t.id) || overdue.has(t.id))).toBe(false);
  });

  // 22
  it("keeps Upcoming strictly after today", () => {
    const rows = filterByView(tasks, "upcoming", DEMO_TODAY, DEMO_CURRENT_USER_ID);
    expect(rows.every((t) => t.dueDate > DEMO_TODAY)).toBe(true);
  });

  // 23
  it("reports counts that equal the length of the list each view renders", () => {
    const counts = viewCounts(tasks, DEMO_TODAY, DEMO_CURRENT_USER_ID);
    for (const view of TASK_VIEWS) {
      expect(counts[view]).toBe(filterByView(tasks, view, DEMO_TODAY, DEMO_CURRENT_USER_ID).length);
    }
  });

  // 24
  it("puts a completed task in Completed only", () => {
    const done = tasks.filter((t) => t.state === "COMPLETED");
    expect(done.length).toBeGreaterThan(0);
    for (const t of done) {
      expect(filterByView([t], "completed", DEMO_TODAY, DEMO_CURRENT_USER_ID)).toHaveLength(1);
      expect(filterByView([t], "today", DEMO_TODAY, DEMO_CURRENT_USER_ID)).toHaveLength(0);
      expect(filterByView([t], "overdue", DEMO_TODAY, DEMO_CURRENT_USER_ID)).toHaveLength(0);
      expect(filterByView([t], "upcoming", DEMO_TODAY, DEMO_CURRENT_USER_ID)).toHaveLength(0);
    }
  });
});

describe("search and sort (tests 25-29)", () => {
  // 25
  it("matches an empty query against everything", () => {
    expect(tasks.every((t) => matchesQuery(t, "   "))).toBe(true);
  });

  // 26
  it("searches title, detail, waiting party and related-record label", () => {
    expect(matchesQuery(task({ title: "Call Ruben" }), "ruben")).toBe(true);
    expect(matchesQuery(task({ detail: "needs the scope" }), "SCOPE")).toBe(true);
    expect(matchesQuery(task({ state: "WAITING", waitingOn: "Harbor & Co" }), "harbor")).toBe(true);
    expect(
      matchesQuery(task({ relation: { kind: "proposal", id: "PRO-2034", label: "PRO-2034 · Solterra" } }), "solterra"),
    ).toBe(true);
    expect(matchesQuery(task({ title: "Call Ruben" }), "zzz")).toBe(false);
  });

  // 27
  it("sorts dated work before undated work", () => {
    const sorted = sortTasks([task({ id: "none", dueDate: "" }), task({ id: "dated", dueDate: "2026-05-01" })]);
    expect(sorted.map((t) => t.id)).toEqual(["dated", "none"]);
  });

  // 28
  it("sorts earlier due dates first, then by priority", () => {
    const sorted = sortTasks([
      task({ id: "late", dueDate: "2026-05-01", priority: "High" }),
      task({ id: "early-low", dueDate: "2026-04-20", priority: "Low" }),
      task({ id: "early-high", dueDate: "2026-04-20", priority: "High" }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["early-high", "early-low", "late"]);
  });

  // 29
  it("is stable — sorting twice gives the same order and does not mutate the input", () => {
    const input = filterByView(tasks, "assigned", DEMO_TODAY, DEMO_CURRENT_USER_ID);
    const snapshot = input.map((t) => t.id);
    const once = sortTasks(input);
    expect(sortTasks(once).map((t) => t.id)).toEqual(once.map((t) => t.id));
    expect(input.map((t) => t.id)).toEqual(snapshot);
  });
});

describe("related records (tests 30-34)", () => {
  // 30
  it("never produces a link to a route the app does not build", () => {
    for (const t of tasks) {
      const href = relationHref(t.relation);
      if (href === null) continue;
      const ok =
        REAL_ROUTES.has(href) ||
        /^\/dashboard\/meetings\/[^/]+\/review$/.test(href) ||
        /^\/dashboard\/proposals\/[^/]+\/edit$/.test(href);
      expect(ok, `unexpected relation href ${href}`).toBe(true);
    }
  });

  // 31
  it("sends a lead relation to the leads list, because the lead detail route reads a different dataset", () => {
    expect(relationHref({ kind: "lead", id: "lead-001", label: "x" })).toBe("/dashboard/leads");
  });

  // 32
  it("returns null for a general task rather than a placeholder link", () => {
    expect(relationHref(null)).toBeNull();
  });

  // 33
  it("returns the most urgent open task as a record's next action", () => {
    const rel = { kind: "meeting" as const, id: "mtg-777", label: "m" };
    const sample = [
      task({ id: "later", dueDate: "2026-05-01", relation: rel }),
      task({ id: "sooner", dueDate: "2026-04-23", relation: rel }),
      task({ id: "done", dueDate: "2026-04-01", state: "COMPLETED", completedOn: "2026-04-02", relation: rel }),
    ];
    expect(nextActionFor(sample, "meeting", "mtg-777")?.id).toBe("sooner");
    expect(nextActionFor(sample, "meeting", "nope")).toBeNull();
    expect(tasksFor(sample, "meeting", "mtg-777")).toHaveLength(3);
  });

  // 34
  it("reports exactly the leads with no open task against them", () => {
    const sample = [
      task({ id: "a", leadId: "lead-001" }),
      task({ id: "b", leadId: "lead-002", state: "COMPLETED", completedOn: DEMO_TODAY }),
    ];
    expect(leadIdsWithoutNextAction(sample, ["lead-001", "lead-002", "lead-003"])).toEqual([
      "lead-002",
      "lead-003",
    ]);
  });
});
