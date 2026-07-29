"use client";
// One task, in full. Rendered inside the My Work dialog and on the task's own route, so
// the two can never drift: same fields, same actions, same copy.
//
// Editing happens in place rather than in a second dialog on top of the first — a dialog
// inside a dialog has two focus traps and only one of them can be right.
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { completeTask, reassignTask, reopenTask, setTaskWaiting, updateTask } from "../../../lib/demo/actions";
import type { Task, TaskPriority, TeamMember } from "../../../lib/demo/types";
import { relationHref, TASK_PRIORITIES, TASK_RELATION_LABELS } from "../../../lib/tasks/model";
import type { ActivityEvent } from "../../../lib/activity/model";
import { RecordActivity } from "../../../components/dashboard/activity-ui";
import { getTeamRoleDisplayLabel } from "../../../lib/identity/current-user";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import {
  DEMO_TASK_SAVE_NOTICE,
  ownerName,
  TaskDueChip,
  TaskPriorityChip,
  TaskStateChip,
  TASK_PRIMARY_ACTION,
  TASK_SECONDARY_ACTION,
} from "../../../components/dashboard/task-ui";

type Mode = "view" | "edit" | "waiting";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-cc-mono text-[9.5px] tracking-[.06em] text-cc-t3">{label.toUpperCase()}</span>
      <span className="text-[12.5px] text-cc-ink">{children}</span>
    </div>
  );
}

export function TaskDetailBody({
  task,
  today,
  team,
  activity,
  onAnnounce,
  showOpenLink = false,
}: {
  task: Task;
  today: string;
  team: readonly TeamMember[];
  /** This task's own recorded history. Passed in rather than read here so the dialog and the
   *  task route stay one component with one data source. */
  activity: readonly ActivityEvent[];
  onAnnounce: (message: string) => void;
  /** The dialog offers a link to the task's own route; that route does not link to itself. */
  showOpenLink?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [title, setTitle] = useState(task.title);
  const [detail, setDetail] = useState(task.detail);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [waitingOn, setWaitingOn] = useState(task.waitingOn);
  const [titleError, setTitleError] = useState("");
  const [waitingError, setWaitingError] = useState("");

  const ownerOptions = useMemo(
    () =>
      team.map((member) => ({
        value: member.id,
        label: `${member.name} · ${getTeamRoleDisplayLabel(member.role)}`,
      })),
    [team],
  );
  const href = relationHref(task.relation);

  const saveEdit = () => {
    if (title.trim() === "") {
      setTitleError("A task needs a title.");
      return;
    }
    updateTask(task.id, { title: title.trim(), detail: detail.trim(), dueDate, priority });
    setTitleError("");
    setMode("view");
    onAnnounce(`Task updated. ${DEMO_TASK_SAVE_NOTICE}`);
  };

  const saveWaiting = () => {
    if (waitingOn.trim() === "") {
      setWaitingError("Name who this is waiting on.");
      return;
    }
    setTaskWaiting(task.id, waitingOn);
    setWaitingError("");
    setMode("view");
    onAnnounce(`Task is now waiting on ${waitingOn.trim()}. ${DEMO_TASK_SAVE_NOTICE}`);
  };

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-3">
        <TextField
          label="Title"
          value={title}
          onChange={(value) => {
            setTitle(value);
            if (value.trim() !== "") setTitleError("");
          }}
          error={titleError}
          required
        />
        <TextAreaField label="Detail" value={detail} onChange={setDetail} rows={3} />
        <TextField
          label="Due date"
          type="date"
          value={dueDate}
          onChange={setDueDate}
          hint="Leave empty for a task with no due date."
        />
        <SelectField
          label="Priority"
          value={priority}
          onChange={(value) => setPriority(value as TaskPriority)}
          options={TASK_PRIORITIES.map((value) => ({ value, label: value }))}
        />
        <p className="text-[11.5px] text-cc-t3">{DEMO_TASK_SAVE_NOTICE}</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={TASK_PRIMARY_ACTION} onClick={saveEdit}>
            Save changes
          </button>
          <button type="button" className={TASK_SECONDARY_ACTION} onClick={() => setMode("view")}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "waiting") {
    return (
      <div className="flex flex-col gap-3">
        <TextField
          label="Waiting on"
          value={waitingOn}
          onChange={(value) => {
            setWaitingOn(value);
            if (value.trim() !== "") setWaitingError("");
          }}
          error={waitingError}
          placeholder="Client, partner or team"
          required
        />
        <p className="text-[11.5px] text-cc-t3">
          A waiting task is not counted as overdue. {DEMO_TASK_SAVE_NOTICE}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={TASK_PRIMARY_ACTION} onClick={saveWaiting}>
            Mark waiting
          </button>
          <button type="button" className={TASK_SECONDARY_ACTION} onClick={() => setMode("view")}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TaskDueChip task={task} today={today} />
        <TaskPriorityChip task={task} />
        <TaskStateChip task={task} />
      </div>

      {task.detail ? <p className="text-[12.5px] leading-[1.55] text-cc-t2">{task.detail}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner">{ownerName(team, task.ownerId)}</Field>
        <Field label="Due">{task.dueDate === "" ? "No due date" : task.dueDate}</Field>
        <Field label="Created">{task.createdOn}</Field>
        <Field label="Related record">
          {task.relation && href ? (
            <Link href={href} className="underline decoration-cc-line underline-offset-2 hover:text-cc-ink">
              {TASK_RELATION_LABELS[task.relation.kind]}: {task.relation.label}
            </Link>
          ) : (
            "General task"
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="font-cc-mono text-[9.5px] tracking-[.06em] text-cc-t3">REASSIGN</span>
        <SelectField
          label="Owner"
          value={task.ownerId}
          onChange={(value) => {
            reassignTask(task.id, value);
            onAnnounce(`Task moved to ${ownerName(team, value)}. ${DEMO_TASK_SAVE_NOTICE}`);
          }}
          options={ownerOptions}
        />
      </div>

      <p className="text-[11.5px] text-cc-t3">{DEMO_TASK_SAVE_NOTICE}</p>

      <div className="flex flex-wrap gap-1.5">
        {task.state === "COMPLETED" ? (
          <button
            type="button"
            className={TASK_PRIMARY_ACTION}
            onClick={() => {
              reopenTask(task.id);
              onAnnounce(`Task reopened. ${DEMO_TASK_SAVE_NOTICE}`);
            }}
          >
            Reopen
          </button>
        ) : (
          <button
            type="button"
            className={TASK_PRIMARY_ACTION}
            onClick={() => {
              completeTask(task.id);
              onAnnounce(`Task completed. ${DEMO_TASK_SAVE_NOTICE}`);
            }}
          >
            Complete
          </button>
        )}
        <button type="button" className={TASK_SECONDARY_ACTION} onClick={() => setMode("edit")}>
          Edit
        </button>
        {task.state === "COMPLETED" ? null : (
          <button type="button" className={TASK_SECONDARY_ACTION} onClick={() => setMode("waiting")}>
            {task.state === "WAITING" ? "Change who we are waiting on" : "Mark waiting"}
          </button>
        )}
        {task.state === "WAITING" ? (
          <button
            type="button"
            className={TASK_SECONDARY_ACTION}
            onClick={() => {
              reopenTask(task.id);
              onAnnounce(`Task is open again. ${DEMO_TASK_SAVE_NOTICE}`);
            }}
          >
            Stop waiting
          </button>
        ) : null}
        {showOpenLink ? (
          <Link href={`/dashboard/my-work/${task.id}`} className={TASK_SECONDARY_ACTION}>
            Open task page
          </Link>
        ) : null}
      </div>

      <RecordActivity
        events={activity}
        emptyLabel="Nothing has been recorded against this task yet."
      />
    </div>
  );
}
