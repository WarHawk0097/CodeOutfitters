// Demo task store tests (35-57). These lock the write side of the task collection:
// what a mutation is allowed to change, what it must refuse, and the fact that every
// write stays inside this browser with no clock and no random source behind it.
//
// The read side (views, counts, ordering) is covered in lib/tasks/model.test.ts; nothing
// here re-asserts a derivation.
import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  completeTask,
  createTask,
  reassignTask,
  reopenTask,
  resetDemoTasks,
  setTaskWaiting,
  updateTask,
} from "./actions";
import { __resetDemoStateForTests, getDemoState } from "./store";
import { createSeedState, DEMO_CURRENT_USER_ID, DEMO_NOW, DEMO_STATE_VERSION, DEMO_TODAY } from "./seed";
import type { Task } from "./types";

const here = fileURLToPath(new URL(".", import.meta.url));

/** The first task matching a condition, so a test names a condition rather than an id. */
function firstWhere(predicate: (task: Task) => boolean): Task {
  const task = getDemoState().tasks.find(predicate);
  if (!task) throw new Error("demo task test: no seeded task matches the requested condition");
  return task;
}

function byId(id: string): Task {
  const task = getDemoState().tasks.find((candidate) => candidate.id === id);
  if (!task) throw new Error(`demo task test: no task ${id}`);
  return task;
}

describe("demo task store (tests 35-57)", () => {
  beforeEach(() => {
    __resetDemoStateForTests();
  });

  // 35
  it("the seed exposes fifteen tasks with unique ids", () => {
    const { tasks } = getDemoState();
    expect(tasks).toHaveLength(15);
    expect(new Set(tasks.map((task) => task.id)).size).toBe(15);
  });

  // 36
  it("the state version is bumped so a pre-task stored session is discarded, not migrated", () => {
    // A session written before tasks existed has no `tasks` array at all. Reading it back
    // would hand every task screen `undefined`, so the version must have moved.
    expect(DEMO_STATE_VERSION).toBe(2);
    expect(createSeedState().version).toBe(DEMO_STATE_VERSION);
  });

  // 37
  it("every seeded task carries the fields its state requires and none it forbids", () => {
    for (const task of getDemoState().tasks) {
      if (task.state === "COMPLETED") {
        expect(task.completedOn).not.toBe("");
        expect(task.waitingOn).toBe("");
      } else if (task.state === "WAITING") {
        expect(task.waitingOn).not.toBe("");
        expect(task.completedOn).toBe("");
      } else {
        expect(task.completedOn).toBe("");
        expect(task.waitingOn).toBe("");
      }
    }
  });

  // 38
  it("the seed owns at least one task in every state and work that is not the current user's", () => {
    const { tasks } = getDemoState();
    expect(tasks.some((task) => task.state === "OPEN")).toBe(true);
    expect(tasks.some((task) => task.state === "WAITING")).toBe(true);
    expect(tasks.some((task) => task.state === "COMPLETED")).toBe(true);
    expect(tasks.some((task) => task.ownerId === DEMO_CURRENT_USER_ID)).toBe(true);
    // Someone else's work has to exist too, or the "Assigned to me" filter proves nothing.
    expect(tasks.some((task) => task.ownerId !== DEMO_CURRENT_USER_ID)).toBe(true);
  });

  // 39
  it("createTask mints a padded, sequential id and puts the task at the head", () => {
    const first = createTask({ title: "Call the architect back", ownerId: DEMO_CURRENT_USER_ID });
    expect(first).toMatch(/^task-\d{4}$/);
    expect(getDemoState().tasks[0]?.id).toBe(first);

    const second = createTask({ title: "Send the revised scope", ownerId: DEMO_CURRENT_USER_ID });
    // Monotonic, not random: the same session replays to the same ids.
    expect(second).not.toBe(first);
    expect(getDemoState().tasks[0]?.id).toBe(second);
    expect(getDemoState().tasks).toHaveLength(17);
  });

  // 40
  it("a created task is OPEN, Medium, dated today, and cannot arrive pre-completed", () => {
    const id = createTask({ title: "Draft the follow-up note", ownerId: DEMO_CURRENT_USER_ID });
    const task = byId(id);
    expect(task.state).toBe("OPEN");
    expect(task.priority).toBe("Medium");
    expect(task.createdOn).toBe(DEMO_TODAY);
    expect(task.completedOn).toBe("");
    expect(task.waitingOn).toBe("");
    expect(task.dueDate).toBe("");
    expect(task.relation).toBeNull();
  });

  // 41
  it("createTask trims the text it is given so whitespace never becomes a title", () => {
    const id = createTask({
      title: "   Confirm the site visit   ",
      detail: "  Ask about parking  ",
      ownerId: DEMO_CURRENT_USER_ID,
    });
    expect(byId(id).title).toBe("Confirm the site visit");
    expect(byId(id).detail).toBe("Ask about parking");
  });

  // 42
  it("a create is recorded in activity as a task event stamped with the fixed demo clock", () => {
    const id = createTask({ title: "Chase the deposit", ownerId: DEMO_CURRENT_USER_ID });
    const entry = getDemoState().activity[0];
    expect(entry?.subjectKind).toBe("task");
    expect(entry?.subjectId).toBe(id);
    expect(entry?.at).toBe(DEMO_NOW);
    expect(entry?.message).toContain("Chase the deposit");
  });

  // 43
  it("createTask attaches the relation it is handed, so a next action stays on its record", () => {
    const meeting = getDemoState().meetings[0];
    const id = createTask({
      title: "Write the recap",
      ownerId: DEMO_CURRENT_USER_ID,
      relation: { kind: "meeting", id: meeting.id, label: meeting.name },
    });
    expect(byId(id).relation).toEqual({ kind: "meeting", id: meeting.id, label: meeting.name });
  });

  // 44
  it("updateTask patches only the fields it is given", () => {
    const task = firstWhere((candidate) => candidate.state === "OPEN");
    updateTask(task.id, { title: "Renamed", priority: "High" });
    const updated = byId(task.id);
    expect(updated.title).toBe("Renamed");
    expect(updated.priority).toBe("High");
    expect(updated.detail).toBe(task.detail);
    expect(updated.ownerId).toBe(task.ownerId);
    expect(updated.state).toBe(task.state);
  });

  // 45
  it("a mutation against an unknown id leaves the state identical by reference", () => {
    const before = getDemoState();
    updateTask("task-does-not-exist", { title: "Nope" });
    completeTask("task-does-not-exist");
    reopenTask("task-does-not-exist");
    reassignTask("task-does-not-exist", DEMO_CURRENT_USER_ID);
    // Reference equality on purpose: every reader compares by reference, so a no-op that
    // still allocated a new state would re-render the whole dashboard for nothing.
    expect(getDemoState()).toBe(before);
  });

  // 46
  it("completeTask stamps the completion date and clears any waiting party", () => {
    const waiting = firstWhere((candidate) => candidate.state === "WAITING");
    completeTask(waiting.id);
    const done = byId(waiting.id);
    expect(done.state).toBe("COMPLETED");
    expect(done.completedOn).toBe(DEMO_TODAY);
    expect(done.waitingOn).toBe("");
  });

  // 47
  it("completing an already-completed task changes nothing", () => {
    const done = firstWhere((candidate) => candidate.state === "COMPLETED");
    const before = getDemoState();
    completeTask(done.id);
    expect(getDemoState()).toBe(before);
  });

  // 48
  it("reopenTask clears the completion date so a reopened task is genuinely open", () => {
    const done = firstWhere((candidate) => candidate.state === "COMPLETED");
    reopenTask(done.id);
    const open = byId(done.id);
    expect(open.state).toBe("OPEN");
    expect(open.completedOn).toBe("");
    expect(open.waitingOn).toBe("");
  });

  // 49
  it("reopening an open task changes nothing", () => {
    const open = firstWhere((candidate) => candidate.state === "OPEN");
    const before = getDemoState();
    reopenTask(open.id);
    expect(getDemoState()).toBe(before);
  });

  // 50
  it("setTaskWaiting refuses an unnamed party", () => {
    const open = firstWhere((candidate) => candidate.state === "OPEN");
    const before = getDemoState();
    setTaskWaiting(open.id, "   ");
    // "Waiting" with nobody named is a status that hides work instead of tracking it.
    expect(getDemoState()).toBe(before);
    expect(byId(open.id).state).toBe("OPEN");
  });

  // 51
  it("setTaskWaiting parks the task on the named party", () => {
    const open = firstWhere((candidate) => candidate.state === "OPEN");
    setTaskWaiting(open.id, "  Harborline facilities  ");
    const parked = byId(open.id);
    expect(parked.state).toBe("WAITING");
    expect(parked.waitingOn).toBe("Harborline facilities");
    expect(parked.completedOn).toBe("");
  });

  // 52
  it("a completed task cannot be moved into waiting without being reopened first", () => {
    const done = firstWhere((candidate) => candidate.state === "COMPLETED");
    const before = getDemoState();
    setTaskWaiting(done.id, "Client");
    expect(getDemoState()).toBe(before);
  });

  // 53
  it("reassignTask only accepts an owner who is actually on the team", () => {
    const task = firstWhere((candidate) => candidate.state === "OPEN");
    const before = getDemoState();
    reassignTask(task.id, "user-not-on-this-team");
    expect(getDemoState()).toBe(before);

    const other = getDemoState().team.find((member) => member.id !== task.ownerId);
    if (!other) throw new Error("demo task test: seed has a single team member");
    reassignTask(task.id, other.id);
    expect(byId(task.id).ownerId).toBe(other.id);
  });

  // 54
  it("reassigning a task to its current owner changes nothing", () => {
    const task = firstWhere((candidate) => candidate.state === "OPEN");
    const before = getDemoState();
    reassignTask(task.id, task.ownerId);
    expect(getDemoState()).toBe(before);
  });

  // 55
  it("resetDemoTasks restores the seeded set and drops everything created in this browser", () => {
    const id = createTask({ title: "Temporary", ownerId: DEMO_CURRENT_USER_ID });
    completeTask(firstWhere((candidate) => candidate.state === "OPEN").id);
    resetDemoTasks();

    const { tasks } = getDemoState();
    expect(tasks).toHaveLength(15);
    expect(tasks.some((task) => task.id === id)).toBe(false);
    expect(tasks).toEqual(createSeedState().tasks);
  });

  // 56
  it("resetDemoTasks is scoped to tasks and leaves the other collections alone", () => {
    const before = getDemoState();
    resetDemoTasks();
    const after = getDemoState();
    expect(after.leadOverrides).toBe(before.leadOverrides);
    expect(after.opportunities).toBe(before.opportunities);
    expect(after.meetings).toBe(before.meetings);
    expect(after.proposals).toBe(before.proposals);
    expect(after.followUps).toBe(before.followUps);
  });

  // 57
  it("no task write reads a wall clock or a random source", () => {
    // Every date a task carries is DEMO_TODAY and every id is minted from nextId. A
    // Date.now() or Math.random() here would make the demo replay differently per visit
    // and quietly break every fixed-date assertion above.
    for (const file of ["actions.ts", "seed.ts", "store.ts"]) {
      // Comment lines are dropped first: seed.ts explains *why* it never calls Date.now(),
      // and a prose mention of the trap must not read as the trap.
      const source = readFileSync(`${here}${file}`, "utf8")
        .split("\n")
        .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
        .join("\n");
      expect(source, file).not.toMatch(/Date\.now\(/);
      expect(source, file).not.toMatch(/Math\.random\(/);
      expect(source, file).not.toMatch(/new Date\(\)/);
    }
  });
});
