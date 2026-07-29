"use client";
// My Work — the one screen that answers "what do I do next?".
//
// Everything on it is derived from the shared task collection by lib/tasks/model, which is
// also what the sidebar badge and the Overview work modules read. A count in the switch and
// the list it opens therefore cannot disagree: they are the same function over the same array.
//
// Demo mode only. Tasks created or changed here are written to this browser's demo store and
// nowhere else — the copy on every form and every confirmation says exactly that. In live
// mode this screen renders a provider-required state instead of falling back to the demo
// store, because one person's browser is not a workspace's task list.
import { SEGMENT, SEGMENT_ACTIVE } from "@/lib/command-center/ui/control-system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createTask, resetDemoTasks } from "../../../lib/demo/actions";
import { DEMO_CURRENT_USER_ID, DEMO_TODAY } from "../../../lib/demo/seed";
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
import {
  resolveTaskPlane,
  TASK_PROVIDER_REQUIRED_REASON,
  TASK_PROVIDER_REQUIRED_TITLE,
} from "../../../lib/tasks/provider";
import { useCommandCenterConfig } from "../../../components/command-center/mode-provider";
import { SavedViewsBar } from "../../../components/command-center/saved-views";
import { useListView, useQueryParam } from "../../../components/command-center/use-view-query";
import { COMMAND_CREATE_PARAM } from "../../../lib/search/commands";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { Dialog, DialogCancelButton } from "../../../components/demo/dialog";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton, ToolbarDivider } from "../../../components/demo/toolbar";
import {
  DEMO_TASK_SAVE_NOTICE,
  TaskRow,
  TASK_PRIMARY_ACTION,
  TASK_SECONDARY_ACTION,
} from "../../../components/dashboard/task-ui";
import { eventsFor } from "../../../lib/activity/model";
import { getTeamRoleDisplayLabel } from "../../../lib/identity/current-user";
import { TaskDetailBody } from "./task-detail";

/** A `?view=` value the Overview and the sidebar can link to. Anything else falls back to
 *  Today rather than rendering an empty screen for a typo. */
function readView(raw: string | null): TaskView {
  return TASK_VIEWS.includes(raw as TaskView) ? (raw as TaskView) : "today";
}

export function MyWorkScreen() {
  const { live } = useCommandCenterConfig();
  const plane = resolveTaskPlane(live);
  const { state, status, error, retry } = useDemoQuery();

  // The filter state lives in the URL, so a Saved View, a search result and a link a colleague
  // was sent all arrive by the same door.
  const { filters, sort, publish, set } = useListView("myWork");
  const view = readView(filters.view ?? null);
  const q = filters.q ?? "";
  const ownerFilter = filters.owner === "" ? null : (filters.owner ?? null);
  const priorityFilter = filters.priority === "" ? null : (filters.priority ?? null);
  const setView = useCallback((next: TaskView) => set("view", next), [set]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // "Create task" in the command palette opens this screen with `?new=1`. The command promises
  // a create form; this is where that promise is kept, and without it the command would be a
  // navigation wearing a create label.
  const createRequested = useQueryParam(COMMAND_CREATE_PARAM) === "1";
  useEffect(() => {
    if (createRequested) setCreateOpen(true);
  }, [createRequested]);

  const [resetOpen, setResetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newOwner, setNewOwner] = useState(DEMO_CURRENT_USER_ID);
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [newTitleError, setNewTitleError] = useState("");

  const announce = useCallback((message: string) => setAnnouncement(message), []);

  const tasks = state.tasks;
  const counts = useMemo(
    () => viewCounts(tasks, DEMO_TODAY, DEMO_CURRENT_USER_ID),
    [tasks],
  );
  const attention = useMemo(() => attentionCount(tasks, DEMO_TODAY), [tasks]);

  const rows = useMemo(() => {
    const inView = filterByView(tasks, view, DEMO_TODAY, DEMO_CURRENT_USER_ID);
    return sortTasks(
      inView.filter(
        (task) =>
          matchesQuery(task, q) &&
          (ownerFilter === null || task.ownerId === ownerFilter) &&
          (priorityFilter === null || task.priority === priorityFilter),
      ),
    );
  }, [tasks, view, q, ownerFilter, priorityFilter]);

  const ownerOptions = useMemo(
    () => state.team.map((member) => ({ id: member.id, label: member.name })),
    [state.team],
  );
  const priorityOptions = useMemo(
    () => TASK_PRIORITIES.map((priority) => ({ id: priority, label: priority })),
    [],
  );
  const filtersApplied = q !== "" || ownerFilter !== null || priorityFilter !== null;
  const openTask: Task | null = openId ? (tasks.find((task) => task.id === openId) ?? null) : null;

  // Live mode has no task plane yet. Say so — do not read the demo store.
  if (plane.kind === "provider_required") {
    return (
      <div className="rounded-cc-card border border-cc-line bg-cc-surface p-6">
        <h2 className="text-[15px] font-semibold text-cc-ink">{TASK_PROVIDER_REQUIRED_TITLE}</h2>
        <p className="mt-2 max-w-[60ch] text-[12.5px] leading-[1.6] text-cc-t2">{plane.reason}</p>
      </div>
    );
  }

  if (status === "loading") return <RouteLoading label="your work" />;
  if (status === "error") {
    return <RouteError label="your work" error={error ?? "Unknown error"} onRetry={retry} />;
  }

  const submitCreate = () => {
    if (newTitle.trim() === "") {
      setNewTitleError("A task needs a title.");
      return;
    }
    createTask({
      title: newTitle,
      detail: newDetail,
      ownerId: newOwner,
      dueDate: newDue,
      priority: newPriority,
    });
    setNewTitle("");
    setNewDetail("");
    setNewDue("");
    setNewPriority("Medium");
    setNewOwner(DEMO_CURRENT_USER_ID);
    setNewTitleError("");
    setCreateOpen(false);
    announce(`Task created. ${DEMO_TASK_SAVE_NOTICE}`);
  };

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Attention summary. One sentence, derived — never a decorative number. */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-cc-card border border-cc-line bg-cc-surface px-4 py-3">
        <span className="text-[13px] font-semibold text-cc-ink">
          {attention === 0
            ? "Nothing needs attention right now"
            : `${attention} ${attention === 1 ? "task needs" : "tasks need"} attention`}
        </span>
        <span className="text-[11.5px] text-cc-t2">
          {counts.overdue} overdue · {counts.today} due today · {counts.waiting} waiting · {counts.upcoming} upcoming
        </span>
        <span className="ml-auto text-[11.5px] text-cc-t3">{DEMO_TASK_SAVE_NOTICE}</span>
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
            className={
              candidate === view
                ? SEGMENT_ACTIVE
                : SEGMENT
            }
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
        <ToolbarButton label="Reset demo tasks" onClick={() => setResetOpen(true)} />
        <ToolbarButton label="New task" tone="primary" onClick={() => setCreateOpen(true)} />
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
                today={DEMO_TODAY}
                team={state.team}
                onOpen={() => setOpenId(task.id)}
                actions={
                  <>
                    <button type="button" className={TASK_SECONDARY_ACTION} onClick={() => setOpenId(task.id)}>
                      Open
                    </button>
                  </>
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
            today={DEMO_TODAY}
            team={state.team}
            activity={eventsFor(state.activity, "task", openTask.id)}
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
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <DialogCancelButton onClick={() => setCreateOpen(false)} />
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
            options={state.team.map((member) => ({
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
          <p className="text-[11.5px] text-cc-t3">{DEMO_TASK_SAVE_NOTICE}</p>
        </div>
      </Dialog>

      <Dialog
        open={resetOpen}
        title="Reset demo tasks?"
        description="This restores the sample tasks and discards every task you created or changed in this browser. Nothing else on the dashboard changes."
        width={460}
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <DialogCancelButton onClick={() => setResetOpen(false)} />
            <button
              type="button"
              className="rounded-cc-control bg-cc-red px-3 py-1.5 text-[12.5px] font-semibold text-white"
              onClick={() => {
                resetDemoTasks();
                setResetOpen(false);
                setOpenId(null);
                announce(`Demo tasks reset. ${DEMO_TASK_SAVE_NOTICE}`);
              }}
            >
              Reset demo tasks
            </button>
          </>
        }
      >
        <p className="text-[12.5px] leading-[1.55] text-cc-t2">{DEMO_TASK_SAVE_NOTICE}</p>
      </Dialog>
    </div>
  );
}
