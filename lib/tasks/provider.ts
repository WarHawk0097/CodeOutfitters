// The live task plane contract.
//
// Demo mode owns tasks in this browser (lib/demo/store.ts) and says so. Live mode does
// NOT: a workspace's tasks belong in the database behind RLS, read and written by
// server code with the caller's session — never by browser storage, which any user can
// edit and which no other member can see.
//
// That server implementation is not part of this release. Rather than let live mode fall
// through to the demo store — which would show one user's browser-local tasks as if they
// were the workspace's — this module resolves to `null` and the UI renders an explicit
// provider-required state. The interface below is what a live implementation must satisfy.
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
  /** Live mode with no server implementation wired: read-only, honest, no fallback. */
  | { kind: "provider_required"; reason: string };

export const TASK_PROVIDER_REQUIRED_TITLE = "Task management is not connected yet";

export const TASK_PROVIDER_REQUIRED_REASON =
  "This workspace is running in live mode. Tasks are stored in the workspace database and read with your session, so they are not available until the task service is connected. Nothing is being kept in this browser.";

/**
 * Which plane is in force. `live` is the server-decided boolean already handed to the
 * client tree by CommandCenterConfigProvider — the mode env itself never reaches the
 * browser.
 *
 * There is deliberately no third branch: live mode never resolves to `demo`.
 */
export function resolveTaskPlane(live: boolean): TaskPlane {
  return live
    ? { kind: "provider_required", reason: TASK_PROVIDER_REQUIRED_REASON }
    : { kind: "demo" };
}
