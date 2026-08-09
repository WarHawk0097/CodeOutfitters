// The live task plane contract.
//
// Demo mode owns tasks in this browser (lib/demo/store.ts) and says so. Live mode does
// NOT: a workspace's tasks live in the database behind RLS, read and written by server
// code with the caller's session (lib/tasks/server-provider.ts) — never by browser
// storage, which any user can edit and which no other member can see. There is no
// silent fallback to the demo store in live mode.
import type { Task, TaskPriority, TaskRelation } from "../demo/types";

/** Every call is workspace-scoped. The workspace id comes from the authenticated
 *  membership on the server, never from the client, and RLS enforces it a second time. */
export type TaskQuery = {
  workspaceId: string;
  /** Restrict to one member. Omitted means every task in the workspace the caller may read. */
  ownerId?: string;
};

export type TaskCreateInput = {
  workspaceId: string;
  title: string;
  detail?: string;
  ownerId: string;
  priority?: TaskPriority;
  dueDate?: string;
  leadId?: string | null;
  relation?: TaskRelation;
};

export type TaskUpdateInput = {
  workspaceId: string;
  taskId: string;
  patch: Partial<Pick<Task, "title" | "detail" | "ownerId" | "priority" | "dueDate" | "state" | "waitingOn">>;
};

export type TaskProvider = {
  list(query: TaskQuery): Promise<Task[]>;
  create(input: TaskCreateInput): Promise<Task>;
  update(input: TaskUpdateInput): Promise<Task>;
};

export type TaskPlane =
  /** Demo mode: tasks live in this browser and every surface says so. */
  | { kind: "demo" }
  /** Live mode: tasks live in the workspace database, read with the caller's session. */
  | { kind: "live" };

/**
 * Which plane is in force. `live` is the server-decided boolean already handed to the
 * client tree by CommandCenterConfigProvider — the mode env itself never reaches the
 * browser.
 *
 * There is deliberately no third branch: live mode never resolves to `demo`, and there
 * is no `provider_required` plane to fall through — Tasks is live-backed.
 */
export function resolveTaskPlane(live: boolean): TaskPlane {
  return live ? { kind: "live" } : { kind: "demo" };
}
