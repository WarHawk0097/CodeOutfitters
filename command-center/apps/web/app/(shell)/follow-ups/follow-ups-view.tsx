"use client";
// Follow-ups — C-D12 (desktop work queue), the mobile card stack, and the switch the
// canonical frame draws above the list.
//
// This is the work queue Overview counts. Every mutation here (complete, reschedule,
// snooze, edit, create) writes through the shared demo actions, so the lead's next step,
// the Overview work queue and the activity history move with it — no second copy of the
// due state lives on this screen.
//
// Nothing is emailed and no reminder is sent. A follow-up is a local task record.
import { useCallback, useMemo, useState } from "react";
import {
  completeFollowUp,
  createFollowUp,
  rescheduleFollowUp,
  snoozeFollowUp,
  updateFollowUp,
} from "../../../lib/demo/actions";
import { DEMO_TODAY, LEAD_DIRECTORY, PIPELINE_STAGES, STAGE_LABELS } from "../../../lib/demo/seed";
import type { FollowUp, FollowUpState, PipelineStage, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../components/demo/tone";
import { useBreakpoint } from "../../../components/demo/use-breakpoint";
import { MenuButton, type MenuItem } from "../../../components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../../../components/demo/dialog";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton } from "../../../components/demo/toolbar";
import { longDate } from "../appointments/date-utils";

// C-D12 342-353 draws OVERDUE (red), DUE TODAY (amber) and the queue; the four states the
// switch offers each get a tone from the canonical palette by the same grammar the rest of
// the app uses — waiting/upcoming blue, snoozed neutral, done green.
const STATE_TONE: Record<FollowUpState, Tone> = {
  OVERDUE: "red",
  "DUE TODAY": "amber",
  UPCOMING: "blue",
  SNOOZED: "neutral",
  COMPLETED: "green",
};

// The switch, in order. C-D12 draws "Overdue · Today · Upcoming · Snoozed · Unassigned";
// the fifth tab here is Completed instead of Unassigned (see the deviations log F-D01) so
// that every FollowUp state has exactly one tab and no tab is ever empty of its own state.
type FollowUpsView = "OVERDUE" | "DUE TODAY" | "UPCOMING" | "SNOOZED" | "COMPLETED";
const VIEWS: FollowUpsView[] = ["OVERDUE", "DUE TODAY", "UPCOMING", "SNOOZED", "COMPLETED"];
const VIEW_LABEL: Record<FollowUpsView, string> = {
  OVERDUE: "Overdue",
  "DUE TODAY": "Today",
  UPCOMING: "Upcoming",
  SNOOZED: "Snoozed",
  COMPLETED: "Completed",
};

const PRIORITIES = ["High", "Medium", "Low"] as const;
const PRIORITY_TONE: Record<FollowUp["priority"], Tone> = { High: "red", Medium: "amber", Low: "neutral" };

const PRIMARY_ACTION =
  "rounded-cc-control bg-cc-green px-[11px] py-[5px] text-[11.5px] font-semibold text-white";
const SECONDARY_ACTION =
  "rounded-cc-control border border-cc-line-strong px-[11px] py-[5px] text-[11.5px] font-semibold text-cc-t-table hover:border-cc-green-border hover:text-cc-green-ink";

type FollowUpDraft = {
  name: string;
  company: string;
  type: string;
  dueDate: string;
  priority: FollowUp["priority"];
  stage: PipelineStage;
  ownerId: string;
  suggestion: string;
  state: FollowUpState;
};

export function FollowUpsScreen() {
  const { state, status, error, retry } = useDemoQuery();
  const breakpoint = useBreakpoint();

  const [view, setView] = useState<FollowUpsView>("OVERDUE");
  const [q, setQ] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkSnooze, setBulkSnooze] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const ownerName = useCallback(
    (id: string) => (id === "unassigned" ? "Unassigned" : (state.team.find((m) => m.id === id)?.name ?? id)),
    [state.team],
  );

  const ownerOptions = useMemo(
    () => [...state.team.map((m) => ({ id: m.id, label: m.name })), { id: "unassigned", label: "Unassigned" }],
    [state.team],
  );

  const priorityOptions = useMemo(() => PRIORITIES.map((p) => ({ id: p, label: p })), []);

  const matching = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.followUps.filter((followUp) => {
      if (ownerFilter && followUp.ownerId !== ownerFilter) return false;
      if (priorityFilter && followUp.priority !== priorityFilter) return false;
      if (!needle) return true;
      return (
        followUp.name.toLowerCase().includes(needle) ||
        followUp.company.toLowerCase().includes(needle) ||
        followUp.type.toLowerCase().includes(needle) ||
        followUp.suggestion.toLowerCase().includes(needle)
      );
    });
  }, [state.followUps, q, ownerFilter, priorityFilter]);

  const rows = useMemo(() => matching.filter((followUp) => followUp.state === view), [matching, view]);

  const countFor = useCallback(
    (candidate: FollowUpsView) => state.followUps.filter((f) => f.state === candidate).length,
    [state.followUps],
  );

  const filtersApplied = Boolean(q || ownerFilter || priorityFilter);
  const find = (id: string | null) => (id ? (state.followUps.find((f) => f.id === id) ?? null) : null);

  const detail = find(detailId);
  const editing = find(editId);
  const rescheduling = find(rescheduleId);
  const snoozing = find(snoozeId);

  // Selection is scoped to what is on screen: switching view or filtering drops any selected
  // rows that are no longer visible, so a bulk action never touches a row the user can't see.
  const visibleSelected = useMemo(
    () => rows.filter((row) => selected.has(row.id)).map((row) => row.id),
    [rows, selected],
  );

  const clearSelection = () => setSelected(new Set());
  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((current) => {
      const allOn = rows.length > 0 && rows.every((row) => current.has(row.id));
      const next = new Set(current);
      if (allOn) rows.forEach((row) => next.delete(row.id));
      else rows.forEach((row) => next.add(row.id));
      return next;
    });

  const onComplete = (followUp: FollowUp) => {
    completeFollowUp(followUp.id);
    setSelected((current) => {
      const next = new Set(current);
      next.delete(followUp.id);
      return next;
    });
    setAnnouncement(`${followUp.name} — ${followUp.type} completed.`);
  };

  const onBulkComplete = () => {
    const ids = [...visibleSelected];
    const names = rows.filter((r) => ids.includes(r.id)).map((r) => r.name);
    ids.forEach((id) => completeFollowUp(id));
    clearSelection();
    setAnnouncement(`Completed ${ids.length} follow-up${ids.length === 1 ? "" : "s"}${names.length ? ` — ${names.join(", ")}` : ""}.`);
  };

  if (status === "loading") return <RouteLoading label="follow-ups" />;
  if (status === "error") return <RouteError label="follow-ups" error={error!} onRetry={retry} />;

  const rowMenu = (followUp: FollowUp): MenuItem[] => [
    { id: "open", label: "Open details" },
    { id: "edit", label: "Edit follow-up" },
    { id: "complete", label: "Mark complete", disabled: followUp.state === "COMPLETED" },
    { id: "reschedule", label: "Reschedule" },
    { id: "snooze", label: "Snooze" },
  ];

  const onMenuSelect = (followUp: FollowUp, id: string) => {
    if (id === "open") setDetailId(followUp.id);
    else if (id === "edit") setEditId(followUp.id);
    else if (id === "complete") onComplete(followUp);
    else if (id === "reschedule") setRescheduleId(followUp.id);
    else if (id === "snooze") setSnoozeId(followUp.id);
  };

  const renderRow = (followUp: FollowUp) => {
    const isSelected = selected.has(followUp.id);
    const checkbox = (
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleSelected(followUp.id)}
        aria-label={`Select ${followUp.name}`}
        className="h-4 w-4 flex-shrink-0 accent-cc-green"
      />
    );
    const chip = (
      <span
        className="flex-shrink-0 font-cc-mono text-[8px] font-semibold tracking-[.05em] xl:text-[9.5px]"
        style={{ color: TONE_INK[STATE_TONE[followUp.state]] }}
      >
        {followUp.state}
      </span>
    );
    const priorityChip = (
      <span
        className="flex-shrink-0 font-cc-mono text-[8.5px] font-semibold"
        style={{ color: TONE_INK[PRIORITY_TONE[followUp.priority]] }}
      >
        {followUp.priority.toUpperCase()}
      </span>
    );
    const menu = (
      <MenuButton
        label="⋯"
        ariaLabel={`Actions for ${followUp.name}`}
        align="right"
        width={220}
        items={rowMenu(followUp)}
        onSelect={(id) => onMenuSelect(followUp, id)}
        className="px-1 leading-none text-cc-icon-muted hover:text-cc-t2"
      />
    );

    if (breakpoint === "mobile") {
      return (
        <article
          key={followUp.id}
          aria-label={followUp.name}
          data-testid={`follow-up-card-${followUp.id}`}
          className="mb-[9px] rounded-cc-card border border-cc-line bg-cc-surface px-[13px] py-[11px]"
        >
          <div className="flex justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              {checkbox}
              <button
                type="button"
                onClick={() => setDetailId(followUp.id)}
                className="min-w-0 truncate text-left text-[12.5px] font-semibold text-cc-ink"
              >
                {followUp.name} · {followUp.company}
              </button>
            </span>
            <span className="flex flex-shrink-0 items-center gap-1.5">
              {chip}
              {menu}
            </span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-cc-t3">
            {followUp.type} · due {followUp.due} · {ownerName(followUp.ownerId)}
          </div>
          <div className="mt-[3px] text-[10px] text-cc-t3">{followUp.suggestion}</div>
          <div className="mt-[7px] flex gap-1.5">
            <button type="button" onClick={() => onComplete(followUp)} className={`flex-1 py-[7px] text-center ${PRIMARY_ACTION}`}>
              Complete
            </button>
            <button type="button" onClick={() => setSnoozeId(followUp.id)} className={`flex-1 py-[7px] text-center ${SECONDARY_ACTION}`}>
              Snooze
            </button>
          </div>
        </article>
      );
    }

    return (
      <div
        key={followUp.id}
        data-testid={`follow-up-row-${followUp.id}`}
        className="flex min-h-[58px] items-center gap-[13px] border-b border-cc-row-line px-4 py-2.5 last:border-b-0 xl:px-[18px]"
      >
        {checkbox}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailId(followUp.id)}
              className="truncate text-[13px] font-semibold text-cc-ink hover:text-cc-green-ink"
            >
              {followUp.name}
            </button>
            <span className="truncate text-[11.5px] text-cc-t3">{followUp.company}</span>
            {priorityChip}
          </div>
          <div className="mt-0.5 text-[11.5px] text-cc-t2">
            {followUp.type} · due {followUp.due} · {ownerName(followUp.ownerId)} · {STAGE_LABELS[followUp.stage]}
          </div>
          <div className="mt-0.5 text-[11px] text-cc-t3">{followUp.suggestion}</div>
        </div>
        {chip}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => onComplete(followUp)} className={PRIMARY_ACTION}>
            Complete
          </button>
          <button type="button" onClick={() => setSnoozeId(followUp.id)} className={SECONDARY_ACTION}>
            Snooze
          </button>
          {menu}
        </div>
      </div>
    );
  };

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* C-D12 342: the switch sits above the queue. It stays in the body at every size. */}
      <div
        role="tablist"
        aria-label="Follow-up view"
        className="mb-3 flex flex-wrap gap-1.5 rounded-cc-card border border-cc-line bg-cc-surface px-2 py-2"
      >
        {VIEWS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            id={`follow-ups-tab-${candidate}`}
            aria-selected={candidate === view}
            aria-controls="follow-ups-panel"
            tabIndex={candidate === view ? 0 : -1}
            onClick={() => {
              setView(candidate);
              clearSelection();
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const next = VIEWS[(VIEWS.indexOf(candidate) + (event.key === "ArrowRight" ? 1 : VIEWS.length - 1)) % VIEWS.length]!;
              setView(next);
              clearSelection();
              document.getElementById(`follow-ups-tab-${next}`)?.focus();
            }}
            className={
              candidate === view
                ? "rounded-cc-control bg-cc-ink-strong px-[11px] py-[7px] text-[11.5px] font-semibold text-white"
                : "rounded-cc-control px-[11px] py-[7px] text-[11.5px] font-semibold text-cc-t2 hover:bg-cc-secondary"
            }
          >
            {VIEW_LABEL[candidate]} · {countFor(candidate)}
          </button>
        ))}
      </div>

      <RouteToolbar>
        <SearchInput value={q} onChange={setQ} label="Search follow-ups by name, company, type or suggestion" />
        <FilterMenu label="Owner" allLabel="All owners" value={ownerFilter} options={ownerOptions} onChange={setOwnerFilter} />
        <FilterMenu label="Priority" allLabel="Any priority" value={priorityFilter} options={priorityOptions} onChange={setPriorityFilter} />
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => {
              setQ("");
              setOwnerFilter(null);
              setPriorityFilter(null);
            }}
          />
        ) : null}
        <ToolbarButton label="New follow-up" tone="primary" onClick={() => setCreateOpen(true)} />
      </RouteToolbar>

      {/* Bulk action bar — appears only when at least one visible row is selected, so it is
          never an enabled control with nothing to act on. */}
      {visibleSelected.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-cc-card border border-cc-green-border bg-cc-green-tint px-3 py-2">
          <span className="text-[12px] font-semibold text-cc-green-ink">
            {visibleSelected.length} selected
          </span>
          <div className="flex flex-1 flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={onBulkComplete}
              disabled={view === "COMPLETED"}
              className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              Complete selected
            </button>
            <button
              type="button"
              onClick={() => setBulkSnooze(true)}
              className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-1.5 text-[12px] font-semibold text-cc-t-table"
            >
              Snooze selected
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-cc-control px-3 py-1.5 text-[12px] font-semibold text-cc-t2 hover:bg-cc-secondary"
            >
              Clear selection
            </button>
          </div>
        </div>
      ) : null}

      <div id="follow-ups-panel" role="tabpanel" aria-labelledby={`follow-ups-tab-${view}`}>
        {rows.length === 0 ? (
          <RouteEmpty
            title="No follow-ups here"
            hint={filtersApplied ? "Clear a filter to see the rest." : "Nothing is in this state right now."}
          />
        ) : breakpoint === "mobile" ? (
          rows.map(renderRow)
        ) : (
          <div className="overflow-hidden rounded-cc-card border border-cc-line bg-cc-surface">
            <div className="flex items-center gap-[13px] border-b border-cc-line bg-cc-secondary px-4 py-2 xl:px-[18px]">
              <input
                type="checkbox"
                checked={rows.length > 0 && rows.every((row) => selected.has(row.id))}
                onChange={toggleAll}
                aria-label="Select all follow-ups in this view"
                className="h-4 w-4 accent-cc-green"
              />
              <span className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
                {rows.length} {VIEW_LABEL[view].toUpperCase()}
              </span>
            </div>
            {rows.map(renderRow)}
          </div>
        )}
      </div>

      {detail ? (
        <FollowUpDetailDialog
          followUp={detail}
          ownerName={ownerName(detail.ownerId)}
          activity={state.activity.filter((entry) => entry.subjectId === detail.id)}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setEditId(detail.id);
          }}
          onComplete={() => {
            onComplete(detail);
            setDetailId(null);
          }}
        />
      ) : null}

      {editing ? (
        <FollowUpFormDialog
          title={`Edit ${editing.name}`}
          submitLabel="Save changes"
          owners={ownerOptions}
          initial={{
            name: editing.name,
            company: editing.company,
            type: editing.type,
            dueDate: editing.dueDate,
            priority: editing.priority,
            stage: editing.stage,
            ownerId: editing.ownerId,
            suggestion: editing.suggestion,
            state: editing.state,
          }}
          onClose={() => setEditId(null)}
          onSubmit={(draft) => {
            updateFollowUp(editing.id, {
              name: draft.name.trim(),
              company: draft.company.trim(),
              type: draft.type.trim(),
              dueDate: draft.dueDate,
              due: draft.dueDate,
              priority: draft.priority,
              stage: draft.stage,
              ownerId: draft.ownerId,
              suggestion: draft.suggestion.trim(),
              state: draft.state,
            });
            setAnnouncement(`${draft.name.trim()} saved.`);
            setEditId(null);
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateFollowUpDialog
          owners={ownerOptions}
          onClose={() => setCreateOpen(false)}
          onSubmit={(leadId, draft) => {
            const lead = LEAD_DIRECTORY.find((row) => row.id === leadId);
            if (!lead) return;
            createFollowUp({
              leadId: lead.id,
              opportunityId: state.opportunities.find((o) => o.leadId === lead.id)?.id ?? null,
              name: draft.name.trim(),
              company: draft.company.trim(),
              type: draft.type.trim(),
              due: draft.dueDate,
              dueDate: draft.dueDate,
              priority: draft.priority,
              stage: draft.stage,
              state: draft.state,
              ownerId: draft.ownerId,
              suggestion: draft.suggestion.trim(),
            });
            setView(draft.state);
            setAnnouncement(`${draft.name.trim()} added to the follow-up queue.`);
            setCreateOpen(false);
          }}
        />
      ) : null}

      {rescheduling ? (
        <DateDialog
          title={`Reschedule ${rescheduling.name}`}
          description="Sets the follow-up as upcoming and updates the lead's next step. Nobody is emailed."
          initial={rescheduling.dueDate}
          submitLabel="Reschedule"
          onClose={() => setRescheduleId(null)}
          onSubmit={(dueDate) => {
            rescheduleFollowUp(rescheduling.id, dueDate);
            setAnnouncement(`${rescheduling.name} rescheduled to ${longDate(dueDate)}.`);
            setRescheduleId(null);
          }}
        />
      ) : null}

      {snoozing ? (
        <DateDialog
          title={`Snooze ${snoozing.name}`}
          description="Moves the follow-up out of the active queue until the chosen date."
          initial={snoozing.dueDate}
          submitLabel="Snooze"
          onClose={() => setSnoozeId(null)}
          onSubmit={(dueDate) => {
            snoozeFollowUp(snoozing.id, dueDate);
            setAnnouncement(`${snoozing.name} snoozed to ${longDate(dueDate)}.`);
            setSnoozeId(null);
          }}
        />
      ) : null}

      {bulkSnooze ? (
        <DateDialog
          title={`Snooze ${visibleSelected.length} follow-up${visibleSelected.length === 1 ? "" : "s"}`}
          description="Moves every selected follow-up out of the active queue until the chosen date."
          initial={DEMO_TODAY}
          submitLabel="Snooze selected"
          onClose={() => setBulkSnooze(false)}
          onSubmit={(dueDate) => {
            const ids = [...visibleSelected];
            ids.forEach((id) => snoozeFollowUp(id, dueDate));
            clearSelection();
            setBulkSnooze(false);
            setAnnouncement(`Snoozed ${ids.length} follow-up${ids.length === 1 ? "" : "s"} to ${longDate(dueDate)}.`);
          }}
        />
      ) : null}
    </div>
  );
}

function FollowUpDetailDialog({
  followUp,
  ownerName,
  activity,
  onClose,
  onEdit,
  onComplete,
}: {
  followUp: FollowUp;
  ownerName: string;
  activity: readonly { id: string; message: string }[];
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
}) {
  return (
    <Dialog
      open
      title={followUp.name}
      description={`${followUp.company} · ${followUp.type}`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button
            type="button"
            onClick={onEdit}
            className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-1.5 text-[12.5px] font-semibold text-cc-t-table"
          >
            Edit follow-up
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={followUp.state === "COMPLETED"}
            className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40"
          >
            Mark complete
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <dt className="text-cc-t3">Due</dt>
        <dd className="text-cc-ink">{followUp.due}</dd>
        <dt className="text-cc-t3">Status</dt>
        <dd className="text-cc-ink">{followUp.state}</dd>
        <dt className="text-cc-t3">Priority</dt>
        <dd className="text-cc-ink">{followUp.priority}</dd>
        <dt className="text-cc-t3">Owner</dt>
        <dd className="text-cc-ink">{ownerName}</dd>
        <dt className="text-cc-t3">Related lead stage</dt>
        <dd className="text-cc-ink">{STAGE_LABELS[followUp.stage]}</dd>
        <dt className="text-cc-t3">Related opportunity</dt>
        <dd className="text-cc-ink">{followUp.opportunityId ?? "None linked"}</dd>
      </dl>
      <p className="mt-3 border-t border-cc-line pt-3 text-[12.5px] leading-[1.5] text-cc-t-table">
        {followUp.suggestion}
      </p>
      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">ACTIVITY HISTORY</h3>
      {activity.length === 0 ? (
        <p className="mt-1 text-[11.5px] text-cc-t3">No demo activity recorded for this follow-up yet.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {activity.map((entry) => (
            <li key={entry.id} className="text-[11.5px] text-cc-t-table">
              {entry.message}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

function FollowUpFormDialog({
  title,
  submitLabel,
  owners,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  owners: readonly { id: string; label: string }[];
  initial: FollowUpDraft;
  onClose: () => void;
  onSubmit: (draft: FollowUpDraft) => void;
}) {
  const [draft, setDraft] = useState<FollowUpDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FollowUpDraft, string>>>({});
  const patch = (values: Partial<FollowUpDraft>) => setDraft((d) => ({ ...d, ...values }));
  return (
    <Dialog
      open
      title={title}
      description="Saved to the local demo store in this browser only."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label={submitLabel} form="follow-up-form" />
        </>
      }
    >
      <form
        id="follow-up-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateFollowUpDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <TextField label="Name" value={draft.name} error={errors.name} onChange={(name) => patch({ name })} />
        <TextField label="Company" value={draft.company} error={errors.company} onChange={(company) => patch({ company })} />
        <TextField label="Type" value={draft.type} error={errors.type} onChange={(type) => patch({ type })} hint="e.g. Proposal follow-up, Second touch." />
        <TextField label="Due date" type="date" value={draft.dueDate} error={errors.dueDate} onChange={(dueDate) => patch({ dueDate })} />
        <SelectField
          label="Priority"
          value={draft.priority}
          onChange={(value) => patch({ priority: value as FollowUp["priority"] })}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
        <SelectField
          label="Status"
          value={draft.state}
          onChange={(value) => patch({ state: value as FollowUpState })}
          options={VIEWS.map((candidate) => ({ value: candidate, label: VIEW_LABEL[candidate] }))}
        />
        <SelectField
          label="Related stage"
          value={draft.stage}
          onChange={(value) => patch({ stage: value as PipelineStage })}
          options={PIPELINE_STAGES.map((stage) => ({ value: stage, label: STAGE_LABELS[stage] }))}
        />
        <SelectField
          label="Owner"
          value={draft.ownerId}
          onChange={(ownerId) => patch({ ownerId })}
          options={owners.map((owner) => ({ value: owner.id, label: owner.label }))}
        />
        <TextAreaField label="Suggestion" value={draft.suggestion} onChange={(suggestion) => patch({ suggestion })} />
      </form>
    </Dialog>
  );
}

function CreateFollowUpDialog({
  owners,
  onClose,
  onSubmit,
}: {
  owners: readonly { id: string; label: string }[];
  onClose: () => void;
  onSubmit: (leadId: string, draft: FollowUpDraft) => void;
}) {
  const available = useMemo(() => LEAD_DIRECTORY.slice(0, 40), []);
  const first = available[0];
  const [leadId, setLeadId] = useState(first?.id ?? "");
  const [draft, setDraft] = useState<FollowUpDraft>({
    name: first?.name ?? "",
    company: first?.company ?? "",
    type: "Follow-up",
    dueDate: DEMO_TODAY,
    priority: "Medium",
    stage: (first?.status as PipelineStage) ?? "Contacted",
    ownerId: owners[0]?.id ?? "unassigned",
    suggestion: "",
    state: "DUE TODAY",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FollowUpDraft, string>>>({});
  const patch = (values: Partial<FollowUpDraft>) => setDraft((d) => ({ ...d, ...values }));

  return (
    <Dialog
      open
      title="New follow-up"
      description="Added to the local demo work queue only — nothing is emailed and no reminder is sent."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Add follow-up" form="create-follow-up-form" />
        </>
      }
    >
      <form
        id="create-follow-up-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateFollowUpDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(leadId, draft);
        }}
      >
        <SelectField
          label="Lead"
          value={leadId}
          onChange={(id) => {
            setLeadId(id);
            const lead = available.find((row) => row.id === id);
            if (lead) patch({ name: lead.name, company: lead.company, stage: (lead.status as PipelineStage) ?? draft.stage });
          }}
          options={available.map((lead) => ({ value: lead.id, label: `${lead.name} — ${lead.company}` }))}
        />
        <TextField label="Name" value={draft.name} error={errors.name} onChange={(name) => patch({ name })} />
        <TextField label="Company" value={draft.company} error={errors.company} onChange={(company) => patch({ company })} />
        <TextField label="Type" value={draft.type} error={errors.type} onChange={(type) => patch({ type })} />
        <TextField label="Due date" type="date" value={draft.dueDate} error={errors.dueDate} onChange={(dueDate) => patch({ dueDate })} />
        <SelectField
          label="Priority"
          value={draft.priority}
          onChange={(value) => patch({ priority: value as FollowUp["priority"] })}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
        <SelectField
          label="Status"
          value={draft.state}
          onChange={(value) => patch({ state: value as FollowUpState })}
          options={VIEWS.map((candidate) => ({ value: candidate, label: VIEW_LABEL[candidate] }))}
        />
        <SelectField
          label="Owner"
          value={draft.ownerId}
          onChange={(ownerId) => patch({ ownerId })}
          options={owners.map((owner) => ({ value: owner.id, label: owner.label }))}
        />
        <TextAreaField label="Suggestion" value={draft.suggestion} onChange={(suggestion) => patch({ suggestion })} />
      </form>
    </Dialog>
  );
}

function DateDialog({
  title,
  description,
  initial,
  submitLabel,
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  initial: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (dueDate: string) => void;
}) {
  const [dueDate, setDueDate] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label={submitLabel} form="follow-up-date-form" />
        </>
      }
    >
      <form
        id="follow-up-date-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            setError("Pick a date.");
            return;
          }
          onSubmit(dueDate);
        }}
      >
        <TextField
          label="Due date"
          type="date"
          value={dueDate}
          error={error ?? undefined}
          onChange={(value) => {
            setDueDate(value);
            if (error) setError(null);
          }}
        />
      </form>
    </Dialog>
  );
}

export function validateFollowUpDraft(draft: FollowUpDraft): Partial<Record<keyof FollowUpDraft, string>> {
  const errors: Partial<Record<keyof FollowUpDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Name is required.";
  if (!draft.company.trim()) errors.company = "Company is required.";
  if (!draft.type.trim()) errors.type = "Type is required — it is the line the queue shows.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) errors.dueDate = "Pick a due date.";
  return errors;
}
