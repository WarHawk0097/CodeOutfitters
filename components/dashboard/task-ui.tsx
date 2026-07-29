"use client";
// Shared task presentation — used by My Work, the task detail route, the Next Action
// module on record screens and the Overview work modules. One row component means a task
// reads the same everywhere, and a tone or a due label can only be wrong in one place.
import Link from "next/link";
import type { ReactNode } from "react";
import type { Task, TeamMember } from "../../lib/demo/types";
import {
  dueLabel,
  dueTone,
  relationHref,
  TASK_PRIORITY_TONE,
  TASK_RELATION_LABELS,
} from "../../lib/tasks/model";
import {
  CONTROL_FOCUS,
  ROW_ACTION,
  ROW_ACTION_PRIMARY,
} from "../../lib/command-center/ui/control-system";
import { TONE_INK } from "../demo/tone";

/**
 * The one sentence every demo-mode task surface shows about persistence. It is exact on
 * purpose: a task created here is in this browser's session storage and nowhere else. No
 * account holds it, nothing is synced and no CRM is updated.
 */
export const DEMO_TASK_SAVE_NOTICE = "Saved in this browser.";

export function TaskDueChip({ task, today }: { task: Task; today: string }) {
  return (
    <span
      className="flex-shrink-0 font-cc-mono text-[8.5px] font-semibold tracking-[.05em] xl:text-[9.5px]"
      style={{ color: TONE_INK[dueTone(task, today)] }}
    >
      {dueLabel(task, today).toUpperCase()}
    </span>
  );
}

export function TaskPriorityChip({ task }: { task: Task }) {
  return (
    <span
      className="flex-shrink-0 font-cc-mono text-[8.5px] font-semibold"
      style={{ color: TONE_INK[TASK_PRIORITY_TONE[task.priority]] }}
    >
      {task.priority.toUpperCase()}
    </span>
  );
}

export function TaskStateChip({ task }: { task: Task }) {
  if (task.state === "OPEN") return null;
  return (
    <span
      className="flex-shrink-0 font-cc-mono text-[8.5px] font-semibold tracking-[.05em]"
      style={{ color: TONE_INK[task.state === "COMPLETED" ? "green" : "blue"] }}
    >
      {task.state === "COMPLETED" ? "COMPLETED" : `WAITING · ${task.waitingOn.toUpperCase()}`}
    </span>
  );
}

/** The related record, as a link that resolves. A task with no related record renders
 *  nothing here rather than a disabled-looking chip. */
export function TaskRelationLink({ task }: { task: Task }) {
  const href = relationHref(task.relation);
  if (!task.relation || !href) return null;
  return (
    <Link
      href={href}
      className="truncate text-[11.5px] text-cc-t2 underline decoration-cc-line underline-offset-2 hover:text-cc-ink"
    >
      {TASK_RELATION_LABELS[task.relation.kind]}: {task.relation.label}
    </Link>
  );
}

export function ownerName(team: readonly TeamMember[], ownerId: string): string {
  return team.find((member) => member.id === ownerId)?.name ?? "Unassigned";
}

/**
 * One task in a list. `onOpen` opens the detail; `actions` is whatever the surface wants
 * on the right. Nothing here is a no-op: a surface that has no action passes none.
 */
export function TaskRow({
  task,
  today,
  team,
  onOpen,
  actions,
  dense = false,
}: {
  task: Task;
  today: string;
  team: readonly TeamMember[];
  onOpen?: (task: Task) => void;
  actions?: ReactNode;
  dense?: boolean;
}) {
  const title = onOpen ? (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className={`truncate rounded-[3px] text-left text-[13px] font-semibold text-cc-ink hover:underline ${CONTROL_FOCUS}`}
    >
      {task.title}
    </button>
  ) : (
    <span className="truncate text-[13px] font-semibold text-cc-ink">{task.title}</span>
  );

  return (
    <div
      className={`flex items-start gap-3 border-b border-cc-line px-4 last:border-b-0 xl:px-[18px] ${
        dense ? "py-2.5" : "py-3"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {title}
          <TaskPriorityChip task={task} />
          <TaskStateChip task={task} />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <TaskDueChip task={task} today={today} />
          <span className="truncate text-[11.5px] text-cc-t3">{ownerName(team, task.ownerId)}</span>
          <TaskRelationLink task={task} />
        </div>
      </div>
      {/* `self-center`: the row's text block is top-aligned, but an action that floats
          level with the first line of a two-line row reads as detached from the record. */}
      {actions ? (
        <div className="flex flex-shrink-0 items-center gap-1.5 self-center">{actions}</div>
      ) : null}
    </div>
  );
}

// Row actions come from the one control system. They used to be 26px tall with a
// 11.5px label, which is why "Open" read as detached and low-contrast beside a 36px
// search field; they are now the shared compact band (36px on pointer widths, 44px
// below `sm` so the touch target is legal) with full-strength ink.
export const TASK_PRIMARY_ACTION = ROW_ACTION_PRIMARY;

export const TASK_SECONDARY_ACTION = ROW_ACTION;
