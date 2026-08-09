"use client";
// Next Action — live plane. Same module as next-action-card.tsx's demo body, wired to
// useLiveTasks instead of the demo store.
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveTasks } from "../../lib/tasks/use-live-tasks";
import { dueLabel, dueTone, nextActionFor, tasksFor } from "../../lib/tasks/model";
import { TextField } from "../demo/field";
import { TONE_INK } from "../demo/tone";
import { ownerName, TASK_PRIMARY_ACTION, TASK_SECONDARY_ACTION } from "./task-ui";
import type { NextActionCardProps } from "./next-action-card";

export function NextActionCardLive({ kind, recordId, recordLabel, leadId = null }: NextActionCardProps) {
  const { status, tasks, team, viewer, error: loadError, createTask, actions } = useLiveTasks();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const next = useMemo(() => nextActionFor(tasks, kind, recordId), [tasks, kind, recordId]);
  const queued = useMemo(
    () => tasksFor(tasks, kind, recordId).filter((task) => task.id !== next?.id),
    [tasks, kind, recordId, next],
  );

  if (status === "loading") {
    return (
      <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
        <h3 className="text-[12.5px] font-semibold text-cc-ink">Next action</h3>
        <p className="mt-1.5 text-[11.5px] text-cc-t2">Loading…</p>
      </section>
    );
  }
  if (status === "error") {
    return (
      <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
        <h3 className="text-[12.5px] font-semibold text-cc-ink">Next action</h3>
        <p className="mt-1.5 text-[11.5px] text-cc-t2" role="alert">
          {loadError ?? "This could not be loaded."}
        </p>
      </section>
    );
  }

  const submit = async () => {
    if (title.trim() === "") {
      setError("A task needs a title.");
      return;
    }
    const result = await createTask({
      title,
      ownerId: viewer?.userId ?? "",
      dueDate: due,
      leadId,
      relation: { kind, id: recordId, label: recordLabel },
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setTitle("");
    setDue("");
    setError("");
    setAdding(false);
    setAnnouncement("Next action added.");
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
              style={{ color: TONE_INK[dueTone(next, today)] }}
            >
              {dueLabel(next, today).toUpperCase()}
            </span>
            <span className="text-[11.5px] text-cc-t3">{ownerName(team, next.ownerId)}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button
              type="button"
              className={TASK_PRIMARY_ACTION}
              onClick={async () => {
                const result = await actions.completeTask(next.id);
                setAnnouncement(result.ok ? "Next action completed." : result.message);
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
                style={{ color: TONE_INK[dueTone(task, today)] }}
              >
                {dueLabel(task, today).toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
