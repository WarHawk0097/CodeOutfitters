"use client";
// Next Action — the task module that sits on a record screen.
//
// A record screen that shows history but not "what happens next" leaves the reader to
// work it out. This module answers it in one line: the most urgent open task about this
// record, or an explicit statement that there isn't one, with a way to add it.
//
// It reads the same task collection My Work reads, through the same derivations, so
// completing a task here and completing it there are the same event on the same record.
import Link from "next/link";
import { useMemo, useState } from "react";
import { completeTask, createTask } from "../../lib/demo/actions";
import { DEMO_CURRENT_USER_ID, DEMO_TODAY } from "../../lib/demo/seed";
import { useDemoState } from "../../lib/demo/store";
import type { TaskRelationKind } from "../../lib/demo/types";
import { dueLabel, dueTone, nextActionFor, tasksFor } from "../../lib/tasks/model";
import { resolveTaskPlane, TASK_PROVIDER_REQUIRED_TITLE } from "../../lib/tasks/provider";
import { useCommandCenterConfig } from "../command-center/mode-provider";
import { TextField } from "../demo/field";
import { TONE_INK } from "../demo/tone";
import { DEMO_TASK_SAVE_NOTICE, ownerName, TASK_PRIMARY_ACTION, TASK_SECONDARY_ACTION } from "./task-ui";

export function NextActionCard({
  kind,
  recordId,
  recordLabel,
  leadId = null,
}: {
  kind: TaskRelationKind;
  recordId: string;
  /** Stored on any task created here, so My Work can name the record without a join. */
  recordLabel: string;
  leadId?: string | null;
}) {
  const { live } = useCommandCenterConfig();
  const plane = resolveTaskPlane(live);
  const state = useDemoState();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const next = useMemo(
    () => (plane.kind === "demo" ? nextActionFor(state.tasks, kind, recordId) : null),
    [plane.kind, state.tasks, kind, recordId],
  );
  const queued = useMemo(
    () => (plane.kind === "demo" ? tasksFor(state.tasks, kind, recordId).filter((task) => task.id !== next?.id) : []),
    [plane.kind, state.tasks, kind, recordId, next],
  );

  if (plane.kind === "provider_required") {
    return (
      <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
        <h3 className="text-[12.5px] font-semibold text-cc-ink">Next action</h3>
        <p className="mt-1.5 text-[11.5px] leading-[1.55] text-cc-t2">
          {TASK_PROVIDER_REQUIRED_TITLE}. {plane.reason}
        </p>
      </section>
    );
  }

  const submit = () => {
    if (title.trim() === "") {
      setError("A task needs a title.");
      return;
    }
    createTask({
      title,
      ownerId: DEMO_CURRENT_USER_ID,
      dueDate: due,
      leadId,
      relation: { kind, id: recordId, label: recordLabel },
    });
    setTitle("");
    setDue("");
    setError("");
    setAdding(false);
    setAnnouncement(`Next action added. ${DEMO_TASK_SAVE_NOTICE}`);
  };

  return (
    <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[12.5px] font-semibold text-cc-ink">Next action</h3>
        <Link
          href="/dashboard/my-work"
          className="text-[11px] font-medium text-cc-t3 underline decoration-cc-line underline-offset-2 hover:text-cc-ink"
        >
          My Work
        </Link>
      </div>

      {next ? (
        <div className="mt-2 flex flex-col gap-1.5">
          <Link
            href={`/dashboard/my-work/${next.id}`}
            className="text-[13px] font-semibold text-cc-ink hover:underline"
          >
            {next.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="font-cc-mono text-[9px] font-semibold tracking-[.05em]"
              style={{ color: TONE_INK[dueTone(next, DEMO_TODAY)] }}
            >
              {dueLabel(next, DEMO_TODAY).toUpperCase()}
            </span>
            <span className="text-[11.5px] text-cc-t3">{ownerName(state.team, next.ownerId)}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button
              type="button"
              className={TASK_PRIMARY_ACTION}
              onClick={() => {
                completeTask(next.id);
                setAnnouncement(`Next action completed. ${DEMO_TASK_SAVE_NOTICE}`);
              }}
            >
              Complete
            </button>
            <button type="button" className={TASK_SECONDARY_ACTION} onClick={() => setAdding(true)}>
              Add another
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {/* Explicit, not hidden: "no next action" is the finding this module exists to report. */}
          <p className="text-[12px] text-cc-t2">No next action on this record.</p>
          {adding ? null : (
            <div>
              <button type="button" className={TASK_PRIMARY_ACTION} onClick={() => setAdding(true)}>
                Add next action
              </button>
            </div>
          )}
        </div>
      )}

      {adding ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-cc-line pt-3">
          <TextField
            label="Task"
            value={title}
            onChange={(value) => {
              setTitle(value);
              if (value.trim() !== "") setError("");
            }}
            error={error}
            placeholder="What happens next?"
            required
          />
          <TextField label="Due date" type="date" value={due} onChange={setDue} hint="Optional." />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={TASK_PRIMARY_ACTION} onClick={submit}>
              Add task
            </button>
            <button
              type="button"
              className={TASK_SECONDARY_ACTION}
              onClick={() => {
                setAdding(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {queued.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1 border-t border-cc-line pt-2.5">
          {queued.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-2">
              <Link href={`/dashboard/my-work/${task.id}`} className="truncate text-[11.5px] text-cc-t2 hover:underline">
                {task.title}
              </Link>
              <span
                className="flex-shrink-0 font-cc-mono text-[9px] font-semibold"
                style={{ color: TONE_INK[dueTone(task, DEMO_TODAY)] }}
              >
                {dueLabel(task, DEMO_TODAY).toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-2.5 text-[11px] text-cc-t3">{DEMO_TASK_SAVE_NOTICE}</p>
    </section>
  );
}
