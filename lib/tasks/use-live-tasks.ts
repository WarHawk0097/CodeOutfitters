"use client";

// Live Tasks data + actions — client hook, same idiom as saved-views-live.tsx's fetch/refresh
// pattern: every mutation re-fetches rather than splicing a guessed row into state.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Task, TaskPriority, TaskRelation } from "../demo/types";
import type { TaskActionResult, TaskActions } from "./actions";
// Type-only import from a "server-only" module — erased at compile time, never reaches the
// client bundle.
import type { TeamMember } from "./server-provider";

export type TaskViewer = { userId: string; role: "owner" | "admin" | "member" };

export type NewTaskInput = {
  title: string;
  detail?: string;
  ownerId: string;
  priority?: TaskPriority;
  dueDate?: string;
  leadId?: string | null;
  relation?: TaskRelation;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tasks: Task[]; team: TeamMember[]; viewer: TaskViewer };

type ApiResult<T> = { ok: true; body: T } | { ok: false; message: string };

async function parseApi<T>(res: Response): Promise<ApiResult<T>> {
  let body: { ok?: boolean; error?: { message?: string } } & Partial<T>;
  try {
    body = await res.json();
  } catch {
    return { ok: false, message: "The server sent an unreadable response." };
  }
  if (!res.ok || body?.ok !== true) {
    return { ok: false, message: body?.error?.message ?? "That request failed." };
  }
  return { ok: true, body: body as T };
}

async function fetchTasks(): Promise<LoadState> {
  const res = await fetch("/api/dashboard/tasks", { method: "GET" });
  const result = await parseApi<{ tasks: Task[]; team: TeamMember[]; viewer: TaskViewer }>(res);
  if (!result.ok) return { status: "error", message: result.message };
  return { status: "ready", tasks: result.body.tasks, team: result.body.team, viewer: result.body.viewer };
}

async function patchTask(id: string, patch: Record<string, unknown>): Promise<TaskActionResult> {
  const res = await fetch(`/api/dashboard/tasks/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const result = await parseApi<{ task: Task }>(res);
  return result.ok ? { ok: true } : { ok: false, message: result.message };
}

export type UseLiveTasksResult = {
  status: "loading" | "error" | "ready";
  tasks: Task[];
  team: TeamMember[];
  viewer: TaskViewer | null;
  error: string | null;
  refresh: () => Promise<void>;
  actions: TaskActions;
  createTask: (input: NewTaskInput) => Promise<TaskActionResult>;
};

export function useLiveTasks(): UseLiveTasksResult {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const refresh = useCallback(async () => {
    const next = await fetchTasks();
    if (mounted.current) setLoad(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const actions: TaskActions = {
    async updateTask(id, patch) {
      const result = await patchTask(id, patch);
      if (result.ok) await refresh();
      return result;
    },
    async completeTask(id) {
      const result = await patchTask(id, { state: "COMPLETED" });
      if (result.ok) await refresh();
      return result;
    },
    async reopenTask(id) {
      const result = await patchTask(id, { state: "OPEN" });
      if (result.ok) await refresh();
      return result;
    },
    async setTaskWaiting(id, waitingOn) {
      if (waitingOn.trim() === "") return { ok: false, message: "Name who this is waiting on." };
      const result = await patchTask(id, { state: "WAITING", waitingOn });
      if (result.ok) await refresh();
      return result;
    },
    async reassignTask(id, ownerId) {
      const result = await patchTask(id, { ownerId });
      if (result.ok) await refresh();
      return result;
    },
  };

  const createTask = useCallback(
    async (input: NewTaskInput): Promise<TaskActionResult> => {
      const res = await fetch("/api/dashboard/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await parseApi<{ task: Task }>(res);
      if (!result.ok) return { ok: false, message: result.message };
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  return {
    status: load.status,
    tasks: load.status === "ready" ? load.tasks : [],
    team: load.status === "ready" ? load.team : [],
    viewer: load.status === "ready" ? load.viewer : null,
    error: load.status === "error" ? load.message : null,
    refresh,
    actions,
    createTask,
  };
}
