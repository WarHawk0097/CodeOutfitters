"use client";
// The task detail route body — live plane. Same TaskDetailBody as the demo route, wired to
// useLiveTasks instead of the demo store.
import { useCallback, useState } from "react";
import { useLiveTasks } from "../../../../lib/tasks/use-live-tasks";
import { RouteEmpty, RouteError, RouteLoading } from "../../../../components/demo/route-states";
import { TaskDetailBody } from "../task-detail";
import { BackLink } from "./task-page-view";

export function TaskPageViewLive({ taskId }: { taskId: string }) {
  const { status, tasks, team, error, refresh, actions } = useLiveTasks();
  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((message: string) => setAnnouncement(message), []);
  const today = new Date().toISOString().slice(0, 10);

  if (status === "loading") return <RouteLoading label="this task" />;
  if (status === "error") {
    return <RouteError label="this task" error={error ?? "Unknown error"} onRetry={refresh} />;
  }

  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    return (
      <div>
        <BackLink />
        <RouteEmpty title="Task not found" hint="This task does not exist in this workspace." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <BackLink />
      <h1 className="mb-3 text-xl font-semibold tracking-tight text-cc-ink-strong">{task.title}</h1>
      <div className="rounded-cc-card border border-cc-line bg-cc-surface p-4 xl:p-5">
        <TaskDetailBody task={task} today={today} team={team} activity={[]} actions={actions} onAnnounce={announce} />
      </div>
    </div>
  );
}
