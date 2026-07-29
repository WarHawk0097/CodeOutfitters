"use client";
// The task detail route body. Same TaskDetailBody the My Work dialog renders, so the two
// views of a task cannot drift apart.
import Link from "next/link";
import { useCallback, useState } from "react";
import { DEMO_TODAY } from "../../../../lib/demo/seed";
import {
  resolveTaskPlane,
  TASK_PROVIDER_REQUIRED_TITLE,
} from "../../../../lib/tasks/provider";
import { useCommandCenterConfig } from "../../../../components/command-center/mode-provider";
import { useDemoQuery } from "../../../../components/demo/use-demo-query";
import { RouteEmpty, RouteError, RouteLoading } from "../../../../components/demo/route-states";
import { eventsFor } from "../../../../lib/activity/model";
import { TaskDetailBody } from "../task-detail";

function BackLink() {
  return (
    <Link
      href="/dashboard/my-work"
      className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
    >
      ← Back to My Work
    </Link>
  );
}

export function TaskPageView({ taskId }: { taskId: string }) {
  const { live } = useCommandCenterConfig();
  const plane = resolveTaskPlane(live);
  const { state, status, error, retry } = useDemoQuery();
  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((message: string) => setAnnouncement(message), []);

  if (plane.kind === "provider_required") {
    return (
      <div>
        <BackLink />
        <div className="rounded-cc-card border border-cc-line bg-cc-surface p-6">
          <h1 className="text-[15px] font-semibold text-cc-ink">{TASK_PROVIDER_REQUIRED_TITLE}</h1>
          <p className="mt-2 max-w-[60ch] text-[12.5px] leading-[1.6] text-cc-t2">{plane.reason}</p>
        </div>
      </div>
    );
  }

  if (status === "loading") return <RouteLoading label="this task" />;
  if (status === "error") {
    return <RouteError label="this task" error={error ?? "Unknown error"} onRetry={retry} />;
  }

  const task = state.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    return (
      <div>
        <BackLink />
        <RouteEmpty
          title="Task not found"
          hint="This task does not exist in this browser's demo data. It may have been removed by a demo reset."
        />
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
        <TaskDetailBody
          task={task}
          today={DEMO_TODAY}
          team={state.team}
          activity={eventsFor(state.activity, "task", task.id)}
          onAnnounce={announce}
        />
      </div>
    </div>
  );
}
