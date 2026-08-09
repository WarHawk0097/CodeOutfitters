"use client";
// My Work — live plane. Same screen as my-work-view.tsx's MyWorkScreenDemo, wired to
// useLiveTasks instead of the demo store: real fetch, real workspace-scoped writes, and
// never a claim of a browser-only save.
import { SEGMENT, SEGMENT_ACTIVE } from "@/lib/command-center/ui/control-system";
import { useCallback, useMemo, useState } from "react";
import type { Task, TaskPriority } from "../../../lib/demo/types";
import {
  attentionCount,
  filterByView,
  matchesQuery,
  sortTasks,
  TASK_PRIORITIES,
  TASK_VIEW_EMPTY,
  TASK_VIEW_LABELS,
  TASK_VIEWS,
  viewCounts,
  type TaskView,
} from "../../../lib/tasks/model";
import { useLiveTasks } from "../../../lib/tasks/use-live-tasks";
import { SavedViewsBar } from "../../../components/command-center/saved-views";
import { useListView } from "../../../components/command-center/use-view-query";
import { useCommandCreateDialog } from "../../../components/command-center/use-command-create-dialog";
import { Dialog, DialogCancelButton } from "../../../components/demo/dialog";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton, ToolbarDivider } from "../../../components/demo/toolbar";
import { TaskRow, TASK_PRIMARY_ACTION, TASK_SECONDARY_ACTION } from "../../../components/dashboard/task-ui";
import { getTeamRoleDisplayLabel } from "../../../lib/identity/current-user";
import { TaskDetailBody } from "./task-detail";

function readView(raw: string | null): TaskView {
  return TASK_VIEWS.includes(raw as TaskView) ? (raw as TaskView) : "today";
}

const TODAY = () => new Date().toISOString().slice(0, 10);

export function MyWorkScreenLive() {
  const { status, tasks, team, viewer, error, refresh, actions, createTask } = useLiveTasks();
  const today = useMemo(() => TODAY(), []);

  const { filters, sort, publish, set } = useListView("myWork");
  const view = readView(filters.view ?? null);
  const q = filters.q ?? "";
  const ownerFilter = filters.owner === "" ? null : (filters.owner ?? null);
  const priorityFilter = filters.priority === "" ? null : (filters.priority ?? null);
  const setView = useCallback((next: TaskView) => set("view", next), [set]);

  const [openId, setOpenId] = useState<string | null>(null);
  const { open: createOpen, openCreateDialog, closeCreateDialog } = useCommandCreateDialog();
  const [announcement, setAnnouncement] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newOwner, setNewOwner] = useState(viewer?.userId ?? "");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [newTitleError, setNewTitleError] = useState("");

  const announce = useCallback((message: string) => setAnnouncement(message), []);

  const currentUserId = viewer?.userId ?? "";
  const counts = useMemo(() => viewCounts(tasks, today, currentUserId), [tasks, today, currentUserId]);
  const attention = useMemo(() => attentionCount(tasks, today), [tasks, today]);

  const rows = useMemo(() => {
    const inView = filterByView(tasks, view, today, currentUserId);
    return sortTasks(
      inView.filter(
        (task) =>
          matchesQuery(task, q) &&
          (ownerFilter === null || task.ownerId === ownerFilter) &&
          (priorityFilter === null || task.priority === priorityFilter),
      ),
    );
  }, [tasks, view, today, currentUserId, q, ownerFilter, priorityFilter]);

  const ownerOptions = useMemo(() => team.map((member) => ({ id: member.id, label: member.name })), [team]);
  const priorityOptions = useMemo(() => TASK_PRIORITIES.map((priority) => ({ id: priority, label: priority })), []);
  const filtersApplied = q !== "" || ownerFilter !== null || priorityFilter !== null;
  const openTask: Task | null = openId ? (tasks.find((task) => task.id === openId) ?? null) : null;

  if (status === "loading") return <RouteLoading label="your work" />;
  if (status === "error") {
    return <RouteError label="your work" error={error ?? "Unknown error"} onRetry={refresh} />;
  }

  const submitCreate = async () => {
    if (newTitle.trim() === "") {
      setNewTitleError("A task needs a title.");
      return;
    }
    const result = await createTask({
      title: newTitle,
      detail: newDetail,
      ownerId: newOwner,
      dueDate: newDue,
      priority: newPriority,
    });
    if (!result.ok) {
      setNewTitleError(result.message);
      return;
    }
    setNewTitle("");
    setNewDetail("");
    setNewDue("");
    setNewPriority("Medium");
    setNewOwner(viewer?.userId ?? "");
    setNewTitleError("");
    closeCreateDialog();
    announce("Task created.");
  };

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-cc-card border border-cc-line bg-cc-surface px-4 py-3">
        <span className="text-[13px] font-semibold text-cc-ink">
          {attention === 0
            ? "Nothing needs attention right now"
            : `${attention} ${attention === 1 ? "task needs" : "tasks need"} attention`}
        </span>
        <span className="text-[11.5px] text-cc-t2">
          {counts.overdue} overdue · {counts.today} due today · {counts.waiting} waiting · {counts.upcoming} upcoming
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Task view"
        className="mb-3 flex flex-wrap gap-1.5 rounded-cc-card border border-cc-line bg-cc-surface px-2 py-2"
      >
        {TASK_VIEWS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            id={`my-work-tab-${candidate}`}
            aria-selected={candidate === view}
            aria-controls="my-work-panel"
            tabIndex={candidate === view ? 0 : -1}
            onClick={() => setView(candidate)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const step = event.key === "ArrowRight" ? 1 : TASK_VIEWS.length - 1;
              const next = TASK_VIEWS[(TASK_VIEWS.indexOf(candidate) + step) % TASK_VIEWS.length]!;
              setView(next);
              document.getElementById(`my-work-tab-${next}`)?.focus();
            }}
            className={candidate === view ? SEGMENT_ACTIVE : SEGMENT}
          >
            {TASK_VIEW_LABELS[candidate]} · {counts[candidate]}
          </button>
        ))}
      </div>

      <RouteToolbar>
        <SearchInput value={q} onChange={(value) => set("q", value)} label="Search tasks by title, detail or related record" />
        <FilterMenu label="Owner" allLabel="All owners" value={ownerFilter} options={ownerOptions} onChange={(value) => set("owner", value)} />
        <FilterMenu label="Priority" allLabel="Any priority" value={priorityFilter} options={priorityOptions} onChange={(value) => set("priority", value)} />
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => publish({ ...filters, q: "", owner: "", priority: "" }, sort)}
          />
        ) : null}
        <ToolbarButton label="New task" tone="primary" onClick={openCreateDialog} />
        <ToolbarDivider />
        <SavedViewsBar scope="myWork" filters={filters} sort={sort} onApply={publish} />
      </RouteToolbar>

      <div id="my-work-panel" role="tabpanel" aria-labelledby={`my-work-tab-${view}`}>
        {rows.length === 0 ? (
          <RouteEmpty
            title={filtersApplied ? "No tasks match these filters" : TASK_VIEW_EMPTY[view].title}
            hint={filtersApplied ? "Clear a filter to see the rest." : TASK_VIEW_EMPTY[view].hint}
          />
        ) : (
          <div className="overflow-hidden rounded-cc-card border border-cc-line bg-cc-surface">
            <div className="border-b border-cc-line bg-cc-secondary px-4 py-2 xl:px-[18px]">
              <span className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
                {rows.length} {TASK_VIEW_LABELS[view].toUpperCase()}
              </span>
            </div>
            {rows.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                today={today}
                team={team}
                onOpen={() => setOpenId(task.id)}
                actions={
                  <button type="button" className={TASK_SECONDARY_ACTION} onClick={() => setOpenId(task.id)}>
                    Open
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={openTask !== null}
        title={openTask?.title ?? "Task"}
        description="Task detail"
        width={560}
        onClose={() => setOpenId(null)}
        footer={<DialogCancelButton onClick={() => setOpenId(null)} label="Close" />}
      >
        {openTask ? (
          <TaskDetailBody
            key={openTask.id}
            task={openTask}
            today={today}
            team={team}
            activity={[]}
            actions={actions}
            onAnnounce={announce}
            showOpenLink
          />
        ) : null}
      </Dialog>

      <Dialog
        open={createOpen}
        title="New task"
        description="Title is the only required field."
        width={520}
        onClose={closeCreateDialog}
        footer={
          <>
            <DialogCancelButton onClick={closeCreateDialog} />
            <button type="button" className={TASK_PRIMARY_ACTION} onClick={submitCreate}>
              Create task
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField
            label="Title"
            value={newTitle}
            onChange={(value) => {
              setNewTitle(value);
              if (value.trim() !== "") setNewTitleError("");
            }}
            error={newTitleError}
            placeholder="What needs doing?"
            required
          />
          <TextAreaField label="Detail" value={newDetail} onChange={setNewDetail} rows={3} />
          <SelectField
            label="Owner"
            value={newOwner}
            onChange={setNewOwner}
            options={team.map((member) => ({
              value: member.id,
              label: `${member.name} · ${getTeamRoleDisplayLabel(member.role)}`,
            }))}
          />
          <TextField
            label="Due date"
            type="date"
            value={newDue}
            onChange={setNewDue}
            hint="Optional. A task with no due date is never counted as overdue."
          />
          <SelectField
            label="Priority"
            value={newPriority}
            onChange={(value) => setNewPriority(value as TaskPriority)}
            options={TASK_PRIORITIES.map((value) => ({ value, label: value }))}
          />
        </div>
      </Dialog>
    </div>
  );
}
