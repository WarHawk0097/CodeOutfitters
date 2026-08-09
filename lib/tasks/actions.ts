// The task-mutation contract task-detail.tsx (and any other write surface) is built against.
// Demo and live each supply their own implementation — see lib/demo/task-actions.ts and
// lib/tasks/use-live-tasks.ts — so the component itself never imports a plane-specific module.
import type { Task } from "../demo/types";

export type TaskActionResult = { ok: true } | { ok: false; message: string };

export type TaskActions = {
  updateTask: (
    id: string,
    patch: Partial<Pick<Task, "title" | "detail" | "dueDate" | "priority">>,
  ) => Promise<TaskActionResult>;
  completeTask: (id: string) => Promise<TaskActionResult>;
  reopenTask: (id: string) => Promise<TaskActionResult>;
  setTaskWaiting: (id: string, waitingOn: string) => Promise<TaskActionResult>;
  reassignTask: (id: string, ownerId: string) => Promise<TaskActionResult>;
};
