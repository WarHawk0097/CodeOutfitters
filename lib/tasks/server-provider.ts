import "server-only";

// Live TaskProvider — server-only. Mirrors lib/views/server-provider.ts: every query is
// workspace-scoped in the SQL itself as defense in depth, not the whole of the boundary
// (RLS in supabase/migrations/20260729020000_command_center_tasks.sql is). Never forwards
// the raw Postgres message to a caller. There is no delete: the tasks table grants none,
// so this provider offers none.
import { createClient } from "@/lib/supabase/server";
import type { ActivityRef } from "../activity/model";
import { recordActivity } from "../activity/emit";
import type { Task, TaskPriority, TaskRelationKind, TaskState } from "../demo/types";
import type { TaskCreateInput, TaskProvider, TaskQuery, TaskUpdateInput } from "./provider";

export type TaskErrorCode = "invalid" | "forbidden" | "not_found" | "conflict";

export class TaskError extends Error {
  constructor(
    public readonly code: TaskErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TaskError";
  }
}

function throwForPgError(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new TaskError("conflict", "That task already exists.");
  if (error.code === "42501") throw new TaskError("forbidden", "You do not have permission to do that.");
  throw new TaskError("invalid", "That task request could not be completed.");
}

type TaskRow = {
  id: string;
  title: string;
  detail: string;
  owner_id: string;
  state: TaskState;
  priority: TaskPriority;
  due_date: string | null;
  lead_id: string | null;
  relation_kind: TaskRelationKind | null;
  relation_id: string | null;
  relation_label: string | null;
  waiting_on: string;
  completed_on: string | null;
  created_at: string;
};

const SELECT_COLUMNS =
  "id, title, detail, owner_id, state, priority, due_date, lead_id, relation_kind, relation_id, relation_label, waiting_on, completed_on, created_at";

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    ownerId: row.owner_id,
    state: row.state,
    priority: row.priority,
    dueDate: row.due_date ?? "",
    leadId: row.lead_id,
    relation:
      row.relation_kind && row.relation_id && row.relation_label
        ? { kind: row.relation_kind, id: row.relation_id, label: row.relation_label }
        : null,
    waitingOn: row.waiting_on,
    completedOn: row.completed_on ?? "",
    createdOn: row.created_at.slice(0, 10),
  };
}

/** YYYY-MM-DD for "today" — live mode is real time; only the demo fixtures use a frozen date. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** A reassigned owner must be an active member of THIS workspace — RLS checks workspace_id
 *  on the row, not that owner_id belongs to it, so this is the one check the provider must
 *  make itself or a task could be assigned to an outsider. Returns the owner's display name
 *  (same profiles join as listWorkspaceTeam below) so a reassignment's activity summary can
 *  name them without a second round trip. */
async function assertOwnerInWorkspace(
  supabase: SupabaseServerClient,
  workspaceId: string,
  ownerId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("user_id, profiles(full_name, email)")
    .eq("workspace_id", workspaceId)
    .eq("user_id", ownerId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throwForPgError(error);
  if (!data) throw new TaskError("invalid", "That owner is not a member of this workspace.");
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return (profile?.full_name || profile?.email || "Unnamed") as string;
}

/** The record a task's activity rolls up to — same rule as lib/demo/actions.ts's taskParent,
 *  minus the leadId-only branch: that would need a join to the leads table for a label, and
 *  nothing reads it yet. ponytail: add it if a screen needs a lead-only task's parent. */
function taskParent(task: Task): ActivityRef | undefined {
  if (task.relation) return { kind: task.relation.kind, id: task.relation.id, label: task.relation.label };
  return undefined;
}

export const serverTaskProvider: TaskProvider = {
  async list(query: TaskQuery): Promise<Task[]> {
    const { workspaceId } = query;
    const supabase = await createClient();
    let request = supabase.from("tasks").select(SELECT_COLUMNS).eq("workspace_id", workspaceId);
    if (query.ownerId) request = request.eq("owner_id", query.ownerId);
    const { data, error } = await request.order("created_at", { ascending: false });
    if (error) throwForPgError(error);
    return (data ?? []).map(rowToTask);
  },

  async create(input: TaskCreateInput): Promise<Task> {
    const title = input.title.trim();
    if (title === "") throw new TaskError("invalid", "A task needs a title.");
    const supabase = await createClient();
    await assertOwnerInWorkspace(supabase, input.workspaceId, input.ownerId);

    const { data, error: createError } = await supabase
      .from("tasks")
      // created_by is left null — the column is nullable, no read model uses it, and no
      // caller needs it yet. ponytail: add a real audit trail when something reads it.
      .insert({
        workspace_id: input.workspaceId,
        title,
        detail: input.detail?.trim() ?? "",
        owner_id: input.ownerId,
        priority: input.priority ?? "Medium",
        due_date: input.dueDate ? input.dueDate : null,
        lead_id: input.leadId ?? null,
        relation_kind: input.relation?.kind ?? null,
        relation_id: input.relation?.id ?? null,
        relation_label: input.relation?.label ?? null,
      })
      .select(SELECT_COLUMNS)
      .single();
    if (createError) throwForPgError(createError);
    const task = rowToTask(data);
    await recordActivity({
      workspaceId: input.workspaceId,
      operation: "task_created",
      summary: `Task created — ${task.title}`,
      detail: task.detail,
      target: { kind: "task", id: task.id, label: task.title },
      parent: taskParent(task),
      metadata: task.dueDate ? [{ label: "Due", value: task.dueDate }] : [],
    });
    return task;
  },

  async update(input: TaskUpdateInput): Promise<Task> {
    const { workspaceId, taskId, patch } = input;
    const supabase = await createClient();

    const { data: currentRow, error: fetchError } = await supabase
      .from("tasks")
      .select(SELECT_COLUMNS)
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (fetchError) throwForPgError(fetchError);
    if (!currentRow) throw new TaskError("not_found", "That task is not available.");
    const current = rowToTask(currentRow);

    const columns: Record<string, unknown> = {};
    let newOwnerName: string | undefined;

    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (title === "") throw new TaskError("invalid", "A task needs a title.");
      columns.title = title;
    }
    if (patch.detail !== undefined) columns.detail = patch.detail.trim();
    if (patch.priority !== undefined) columns.priority = patch.priority;
    if (patch.dueDate !== undefined) columns.due_date = patch.dueDate === "" ? null : patch.dueDate;
    if (patch.ownerId !== undefined && patch.ownerId !== current.ownerId) {
      newOwnerName = await assertOwnerInWorkspace(supabase, workspaceId, patch.ownerId);
      columns.owner_id = patch.ownerId;
    }

    // State transitions — same semantics as lib/demo/actions.ts's completeTask/reopenTask/
    // setTaskWaiting, so the live and demo planes behave identically. Each is a no-op when
    // already in the target state, so a redundant "complete" cannot overwrite completedOn.
    if (patch.state === "COMPLETED" && current.state !== "COMPLETED") {
      columns.state = "COMPLETED";
      columns.completed_on = today();
      columns.waiting_on = "";
    } else if (patch.state === "OPEN" && current.state !== "OPEN") {
      columns.state = "OPEN";
      columns.completed_on = null;
      columns.waiting_on = "";
    } else if (patch.state === "WAITING" && current.state !== "COMPLETED") {
      const waitingOn = (patch.waitingOn ?? "").trim();
      if (waitingOn === "") throw new TaskError("invalid", "Name who this is waiting on.");
      columns.state = "WAITING";
      columns.waiting_on = waitingOn;
      columns.completed_on = null;
    }

    if (Object.keys(columns).length === 0) return current;

    const { data, error } = await supabase
      .from("tasks")
      .update(columns)
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(SELECT_COLUMNS)
      .maybeSingle();
    if (error) throwForPgError(error);
    if (!data) throw new TaskError("not_found", "That task is not available.");
    const next = rowToTask(data);

    // Exactly one event per mutation, picked by precedence — a state transition is always
    // the most significant thing that happened in the call, then a reassignment, then any
    // other field edit. This mirrors lib/demo/actions.ts, which routes each of these through
    // its own dedicated action rather than one generic "task updated".
    const target = { kind: "task" as const, id: next.id, label: next.title };
    const parent = taskParent(next);
    if (columns.state === "COMPLETED") {
      await recordActivity({
        workspaceId,
        operation: "task_completed",
        summary: `Task completed — ${next.title}`,
        target,
        parent,
      });
    } else if (columns.state === "OPEN") {
      await recordActivity({
        workspaceId,
        operation: "task_reopened",
        summary: `Task reopened — ${next.title}`,
        target,
        parent,
      });
    } else if (columns.state === "WAITING") {
      await recordActivity({
        workspaceId,
        operation: "task_waiting_changed",
        summary: `Task waiting on ${next.waitingOn} — ${next.title}`,
        target,
        parent,
        metadata: [{ label: "Waiting on", value: next.waitingOn }],
      });
    } else if (newOwnerName !== undefined) {
      await recordActivity({
        workspaceId,
        operation: "task_assignee_changed",
        summary: `Task moved to ${newOwnerName} — ${next.title}`,
        target,
        parent,
        metadata: [{ label: "Assignee", value: newOwnerName }],
      });
    } else {
      await recordActivity({
        workspaceId,
        operation: "task_updated",
        summary: `Task updated — ${next.title}`,
        target,
        parent,
      });
    }

    return next;
  },
};

export type TeamMember = { id: string; name: string; role: "owner" | "admin" | "member" };

/** Workspace roster for the owner-select and server-side reassignment checks — returned
 *  alongside the task list so the UI needs one round trip, not two. */
export async function listWorkspaceTeam(workspaceId: string): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("user_id, role, profiles(full_name, email)")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");
  if (error) throwForPgError(error);
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.user_id as string,
      name: (profile?.full_name || profile?.email || "Unnamed") as string,
      role: row.role as TeamMember["role"],
    };
  });
}
