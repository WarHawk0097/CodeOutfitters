"use client";
// Appointments — C-D11 (desktop list), T-06 (tablet list), MO-07 (mobile day strip and
// cards), plus the Calendar view the canonical tab switch offers (C-D11 316).
//
// Three structural differences between the forms, all read from useBreakpoint rather than
// rendered three times behind CSS:
//   * desktop and tablet list every appointment in the selected view (C-D11 318-340 lists
//     three days at once); mobile is a day planner scoped by the date strip (MO-07 1142).
//   * the action row shortens as the frame narrows (C-D11 322 four actions, T-06 972 three,
//     MO-07 1149 two full-width).
//   * the date chip is a 44px block on desktop and tablet, and a strip chip on mobile.
//
// Nothing here contacts a meeting provider. Every appointment's linked meeting carries an
// empty joinUrl (see seed.ts), so "Join meeting" says so instead of pretending.
import { useCallback, useMemo, useState } from "react";
import {
  cancelAppointment,
  createAppointment,
  rescheduleAppointment,
  retryEmail,
  sendEmail,
  updateAppointment,
} from "../../../lib/demo/actions";
import { DEMO_TODAY, LEAD_DIRECTORY } from "../../../lib/demo/seed";
import type { Appointment, AppointmentState, Meeting, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_BASE, TONE_INK } from "../../../components/demo/tone";
import { useBreakpoint } from "../../../components/demo/use-breakpoint";
import { MenuButton, type MenuItem } from "../../../components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../../../components/demo/dialog";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton } from "../../../components/demo/toolbar";
import { isPast, isUpcoming, useAppointmentsView } from "./view-store";
import {
  addDays,
  addMonths,
  chronological,
  dayNumber,
  isSameMonth,
  longDate,
  monthGrid,
  monthShort,
  monthTitle,
  timeRange,
  weekdayLabel,
} from "./date-utils";

// C-D11 320/328/336 give three states a chip. `short` is the tablet and mobile wording
// (T-06 972 "READY", 973 "PREP NEEDED"). The remaining three states are not drawn on any
// canonical appointment frame; their tones are SYNTHETIC and follow the same grammar.
const STATE_META: Record<AppointmentState, { label: string; short: string; tone: Tone }> = {
  ready: { label: "READY · PREP DONE", short: "READY", tone: "green" },
  preparation_needed: { label: "PREPARATION NEEDED", short: "PREP NEEDED", tone: "amber" },
  no_show: { label: "NO-SHOW", short: "NO-SHOW", tone: "red" },
  completed: { label: "COMPLETED", short: "COMPLETED", tone: "blue" },
  cancelled: { label: "CANCELLED", short: "CANCELLED", tone: "neutral" },
  rescheduled: { label: "RESCHEDULED", short: "RESCHEDULED", tone: "amber" },
};

const PLATFORMS = ["Google Meet", "Zoom", "Microsoft Teams", "Phone"] as const;

const STATE_ORDER: AppointmentState[] = [
  "ready",
  "preparation_needed",
  "rescheduled",
  "no_show",
  "completed",
  "cancelled",
];

type AppointmentDraft = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  platform: string;
  ownerId: string;
  state: AppointmentState;
  detail: string;
  notes: string;
};

type CreateDraft = AppointmentDraft & { leadId: string };

type ScheduleDraft = { date: string; startTime: string; endTime: string };

const SECONDARY_ACTION =
  "rounded-cc-control border border-cc-line-strong px-[11px] py-[5px] text-[11.5px] font-semibold text-cc-t-table hover:border-cc-green-border hover:text-cc-green-ink";
const PRIMARY_ACTION =
  "rounded-cc-control bg-cc-green px-[11px] py-[5px] text-[11.5px] font-semibold text-white";
const TINT_ACTION =
  "rounded-cc-control border border-cc-green-border bg-cc-green-tint px-[11px] py-[5px] text-[11.5px] font-semibold text-cc-green-ink";
const DANGER_ACTION =
  "rounded-cc-control border border-cc-red-border px-[11px] py-[5px] text-[11.5px] font-semibold text-cc-red-ink";

export function AppointmentsScreen() {
  const { state, status, error, retry } = useDemoQuery();
  const breakpoint = useBreakpoint();
  const { view, date, setDate, setView, today } = useAppointmentsView();

  const [q, setQ] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const ownerName = useCallback(
    (id: string) => (id === "unassigned" ? "Unassigned" : (state.team.find((m) => m.id === id)?.name ?? id)),
    [state.team],
  );

  const ownerOptions = useMemo(
    () => [...state.team.map((m) => ({ id: m.id, label: m.name })), { id: "unassigned", label: "Unassigned" }],
    [state.team],
  );

  const meetingFor = useCallback(
    (appointmentId: string): Meeting | undefined => state.meetings.find((m) => m.appointmentId === appointmentId),
    [state.meetings],
  );

  const matching = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.appointments.filter((appointment) => {
      if (ownerFilter && appointment.ownerId !== ownerFilter) return false;
      if (stateFilter && appointment.state !== stateFilter) return false;
      if (!needle) return true;
      return (
        appointment.title.toLowerCase().includes(needle) ||
        appointment.company.toLowerCase().includes(needle) ||
        appointment.service.toLowerCase().includes(needle) ||
        appointment.platform.toLowerCase().includes(needle)
      );
    });
  }, [state.appointments, q, ownerFilter, stateFilter]);

  // Which rows the current view shows. Mobile scopes the two list views to the day the
  // strip has selected (MO-07 1142); the wider frames list every day at once, as C-D11 318
  // does. The calendar view is day-scoped at every size — that is what a calendar is.
  const rows = useMemo(() => {
    const bucket = view === "past" ? matching.filter(isPast) : view === "upcoming" ? matching.filter(isUpcoming) : matching;
    const scoped =
      view === "calendar" || breakpoint === "mobile" ? bucket.filter((a) => a.date === date) : bucket;
    return [...scoped].sort(chronological);
  }, [matching, view, breakpoint, date]);

  const countsByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const appointment of matching) counts.set(appointment.date, (counts.get(appointment.date) ?? 0) + 1);
    return counts;
  }, [matching]);

  const filtersApplied = Boolean(q || ownerFilter || stateFilter);
  const showsDayControls = view === "calendar" || breakpoint === "mobile";

  const detail = detailId ? (state.appointments.find((a) => a.id === detailId) ?? null) : null;
  const editing = editId ? (state.appointments.find((a) => a.id === editId) ?? null) : null;
  const rescheduling = rescheduleId ? (state.appointments.find((a) => a.id === rescheduleId) ?? null) : null;
  const cancelling = cancelId ? (state.appointments.find((a) => a.id === cancelId) ?? null) : null;
  const joining = joinId ? (state.appointments.find((a) => a.id === joinId) ?? null) : null;

  /** "Retry reminder" (C-D11 338). The no-show row's reminder is a real record in the demo
   *  email activity, so retrying re-queues that record rather than inventing a new one.
   *  Nothing is delivered either way. */
  const retryReminder = useCallback(
    (appointment: Appointment) => {
      const failed = state.emails.find((email) => email.leadId === appointment.leadId && email.state === "FAILED");
      if (failed) {
        retryEmail(failed.id);
      } else {
        sendEmail({
          leadId: appointment.leadId,
          to: "",
          leadName: appointment.title.split(" — ")[0] ?? appointment.title,
          type: "Appointment reminder",
          subject: `Reminder — ${appointment.title}`,
          body: "Reminder for the scheduled call.",
          direction: "outbound",
          state: "QUEUED",
          sent: "just now",
          read: true,
          archived: false,
        });
      }
      setAnnouncement("Reminder queued in demo mode. No email was delivered.");
    },
    [state.emails],
  );

  const changeState = useCallback((appointment: Appointment, next: AppointmentState) => {
    updateAppointment(appointment.id, { state: next });
    setAnnouncement(`${appointment.title} marked ${STATE_META[next].short.toLowerCase()}.`);
  }, []);

  if (status === "loading") return <RouteLoading label="appointments" />;
  if (status === "error") return <RouteError label="appointments" error={error!} onRetry={retry} />;

  const rowMenu = (appointment: Appointment): MenuItem[] => [
    { id: "open", label: "Open details" },
    { id: "edit", label: "Edit appointment" },
    { id: "reschedule", label: "Reschedule" },
    ...STATE_ORDER.filter((candidate) => candidate !== "cancelled").map((candidate) => ({
      id: `state:${candidate}`,
      label: `Mark ${STATE_META[candidate].short.toLowerCase()}`,
      selected: candidate === appointment.state,
      disabled: candidate === appointment.state,
    })),
    { id: "cancel", label: "Cancel appointment", disabled: appointment.state === "cancelled" },
  ];

  const onMenuSelect = (appointment: Appointment, id: string) => {
    if (id === "open") setDetailId(appointment.id);
    else if (id === "edit") setEditId(appointment.id);
    else if (id === "reschedule") setRescheduleId(appointment.id);
    else if (id === "cancel") setCancelId(appointment.id);
    else if (id.startsWith("state:")) changeState(appointment, id.slice(6) as AppointmentState);
  };

  /** The chip text. A completed appointment whose meeting still needs review says so —
   *  MO-07 1151 draws exactly that card, and it is the state the person acts on. */
  const chipFor = (appointment: Appointment, form: "desktop" | "tablet" | "mobile") => {
    const meeting = meetingFor(appointment.id);
    if (appointment.state === "completed" && meeting?.state === "NEEDS REVIEW") {
      return { text: "NEEDS REVIEW", tone: "blue" as Tone };
    }
    const meta = STATE_META[appointment.state];
    return { text: form === "desktop" ? meta.label : meta.short, tone: meta.tone };
  };

  const actionsFor = (appointment: Appointment, form: "desktop" | "tablet" | "mobile") => {
    const label = (full: string, short: string) => (form === "desktop" ? full : short);
    const actions: Array<{ key: string; label: string; className: string; onClick: () => void }> = [];

    if (appointment.state === "ready" || appointment.state === "rescheduled") {
      actions.push({
        key: "join",
        label: label("Join meeting", "Join"),
        className: PRIMARY_ACTION,
        onClick: () => setJoinId(appointment.id),
      });
      actions.push({
        key: "workspace",
        label: label("Open live workspace", "Live workspace"),
        className: SECONDARY_ACTION,
        onClick: () => setView("upcoming"),
      });
    }
    if (appointment.state === "preparation_needed") {
      actions.push({
        key: "prepare",
        label: label("Prepare for meeting", "Prepare"),
        className: TINT_ACTION,
        onClick: () => {
          changeState(appointment, "ready");
        },
      });
    }
    if (appointment.state === "completed") {
      actions.push({
        key: "review",
        label: label("Review meeting", "Review"),
        className: PRIMARY_ACTION,
        onClick: () => setDetailId(appointment.id),
      });
    }
    if (appointment.state === "no_show") {
      actions.push({
        key: "retry",
        label: label("Retry reminder", "Retry reminder"),
        className: DANGER_ACTION,
        onClick: () => retryReminder(appointment),
      });
    }
    actions.push({
      key: "lead",
      label: label("Open lead", "Open lead"),
      className: SECONDARY_ACTION,
      onClick: () => setDetailId(appointment.id),
    });
    if (appointment.state !== "completed") {
      actions.push({
        key: "reschedule",
        label: "Reschedule",
        className: SECONDARY_ACTION,
        onClick: () => setRescheduleId(appointment.id),
      });
    }
    // T-06 972 shows three actions, MO-07 1149 two. The overflow menu carries every action
    // regardless, so nothing is unreachable on a narrow frame.
    return form === "desktop" ? actions : actions.slice(0, form === "tablet" ? 3 : 2);
  };

  const renderRow = (appointment: Appointment, form: "desktop" | "tablet" | "mobile") => {
    const chip = chipFor(appointment, form);
    const isToday = appointment.date === today;
    const actions = actionsFor(appointment, form);
    const heading = (
      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={() => setDetailId(appointment.id)}
          className="min-w-0 truncate text-left text-[13px] font-semibold text-cc-ink hover:text-cc-green-ink xl:text-[13.5px]"
        >
          {appointment.title}
        </button>
        <span className="flex flex-shrink-0 items-center gap-1.5">
          {form === "desktop" ? (
            <i aria-hidden="true" className="h-2 w-2 rounded-[2px]" style={{ background: TONE_BASE[chip.tone] }} />
          ) : null}
          <span
            className="font-cc-mono text-[9px] font-semibold tracking-[.04em] xl:text-[9.5px]"
            style={{ color: TONE_INK[chip.tone] }}
          >
            {chip.text}
          </span>
          <MenuButton
            label="⋯"
            ariaLabel={`Actions for ${appointment.title}`}
            align="right"
            width={240}
            items={rowMenu(appointment)}
            onSelect={(id) => onMenuSelect(appointment, id)}
            className="px-1 leading-none text-cc-icon-muted hover:text-cc-t2"
          />
        </span>
      </div>
    );

    const meta =
      form === "desktop"
        ? `${appointment.company} · ${appointment.service} · ${timeRange(appointment.startTime, appointment.endTime, appointment.timezone)} · ${appointment.platform} · ${ownerName(appointment.ownerId)}`
        : `${timeRange(appointment.startTime, appointment.endTime, appointment.timezone)} · ${appointment.platform} · ${ownerName(appointment.ownerId)}`;

    const actionRow = (
      <div className={form === "mobile" ? "mt-[9px] flex gap-1.5" : "mt-[9px] flex flex-wrap gap-1.5"}>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className={form === "mobile" ? `flex-1 py-[9px] text-center ${action.className}` : action.className}
          >
            {action.label}
          </button>
        ))}
      </div>
    );

    if (form === "mobile") {
      // MO-07 1149: a card per appointment, no date chip — the strip above already states
      // the day every card belongs to.
      return (
        <article
          key={appointment.id}
          aria-label={appointment.title}
          data-testid={`appointment-card-${appointment.id}`}
          className="mb-[9px] rounded-cc-card border border-cc-line bg-cc-surface px-[13px] py-[11px]"
        >
          {heading}
          <div className="mt-px text-[11px] text-cc-t3">{meta}</div>
          {actionRow}
        </article>
      );
    }

    return (
      <div
        key={appointment.id}
        data-testid={`appointment-row-${appointment.id}`}
        className="flex gap-3 border-b border-cc-row-line px-4 py-[14px] last:border-b-0 xl:px-[18px]"
      >
        <div className="w-11 flex-shrink-0 self-start rounded-cc-control border border-cc-line bg-cc-secondary py-[5px] text-center">
          <div className="text-[8.5px] font-bold text-cc-t3">{isToday ? "TODAY" : monthShort(appointment.date)}</div>
          <div className="font-cc-mono text-[15px] font-semibold text-cc-ink">{dayNumber(appointment.date)}</div>
        </div>
        <div className="min-w-0 flex-1">
          {heading}
          <div className="mt-0.5 text-[12px] text-cc-t3">{meta}</div>
          <div className="mt-0.5 text-[11.5px] text-cc-t2">{appointment.detail}</div>
          {actionRow}
        </div>
      </div>
    );
  };

  const dayStrip = (
    // MO-07 1142: four day chips. They are a day filter, so they are buttons with a
    // pressed state rather than the decorative chips the static frame draws.
    <div className="-mx-4 mb-[11px] flex items-center gap-1.5 border-b border-cc-line bg-cc-surface px-4 py-[10px]">
      <button
        type="button"
        onClick={() => setDate(addDays(date, -1))}
        aria-label="Previous day"
        className="inline-flex h-[38px] w-[30px] flex-shrink-0 items-center justify-center rounded-cc-control border border-cc-line-strong text-cc-t2"
      >
        <span aria-hidden="true">‹</span>
      </button>
      {[0, 1, 2, 3].map((offset) => {
        const day = addDays(date, offset);
        const selected = offset === 0;
        const count = countsByDay.get(day) ?? 0;
        return (
          <button
            key={day}
            type="button"
            onClick={() => setDate(day)}
            aria-pressed={selected}
            aria-label={`${longDate(day)}, ${count} ${count === 1 ? "appointment" : "appointments"}`}
            className={`flex w-12 flex-col items-center rounded-cc-control py-[7px] ${
              selected ? "bg-cc-ink-strong text-white" : "border border-cc-line text-cc-ink"
            }`}
          >
            <span className={`text-[8.5px] font-bold ${selected ? "text-white opacity-70" : "text-cc-t3"}`}>
              {weekdayLabel(day)}
            </span>
            <span className="font-cc-mono text-[14px] font-semibold">{dayNumber(day)}</span>
            <i
              aria-hidden="true"
              className="mt-0.5 h-1 w-1 rounded-full"
              style={{ background: count ? (selected ? "var(--cc-green-tint)" : "var(--cc-green)") : "transparent" }}
            />
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setDate(addDays(date, 1))}
        aria-label="Next day"
        className="inline-flex h-[38px] w-[30px] flex-shrink-0 items-center justify-center rounded-cc-control border border-cc-line-strong text-cc-t2"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );

  const calendar = (
    <div className="mb-4 rounded-cc-card border border-cc-line bg-cc-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDate(addMonths(date, -1))}
          aria-label="Previous month"
          className="rounded-cc-control border border-cc-line-strong px-2 py-1 text-cc-t2"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h2 className="text-[13.5px] font-semibold text-cc-ink">{monthTitle(date)}</h2>
        <button
          type="button"
          onClick={() => setDate(addMonths(date, 1))}
          aria-label="Next month"
          className="rounded-cc-control border border-cc-line-strong px-2 py-1 text-cc-t2"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 gap-1 pb-1 text-center font-cc-mono text-[9px] text-cc-t3">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div role="grid" aria-label={`${monthTitle(date)} calendar`} className="grid grid-cols-7 gap-1">
        {monthGrid(date).flat().map((day) => {
          const count = countsByDay.get(day) ?? 0;
          const selected = day === date;
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-selected={selected}
              aria-label={`${longDate(day)}, ${count} ${count === 1 ? "appointment" : "appointments"}`}
              onClick={() => setDate(day)}
              className={`flex h-[46px] flex-col items-center justify-center rounded-cc-control border text-[12px] ${
                selected
                  ? "border-cc-green bg-cc-green-tint font-semibold text-cc-green-ink"
                  : isSameMonth(day, date)
                    ? "border-cc-line text-cc-ink hover:border-cc-green-border"
                    : "border-transparent text-cc-t4"
              }`}
            >
              <span className="font-cc-mono">{dayNumber(day)}</span>
              <span className="mt-0.5 h-1 w-1 rounded-full" style={{ background: count ? "var(--cc-green)" : "transparent" }} />
              <span className="sr-only">{count ? `${count} scheduled` : "nothing scheduled"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const emptyHint =
    view === "past"
      ? "Completed and cancelled appointments land here."
      : filtersApplied
        ? "Clear a filter to see the rest."
        : showsDayControls
          ? "Pick another day, or book one."
          : "Book one to get started.";

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* The Upcoming/Calendar/Past switch is NOT here: T-06 969 and MO-07 1141 both put it
          in the header, so it is rendered once from shell-nav. Two tablists would also mean
          two elements sharing the appointments-tab-* ids. */}
      <RouteToolbar>
        <SearchInput value={q} onChange={setQ} label="Search appointments by name, company, service or platform" />
        <FilterMenu label="Owner" allLabel="All owners" value={ownerFilter} options={ownerOptions} onChange={setOwnerFilter} />
        <FilterMenu
          label="Status"
          allLabel="All statuses"
          value={stateFilter}
          options={STATE_ORDER.map((candidate) => ({ id: candidate, label: STATE_META[candidate].short }))}
          onChange={setStateFilter}
        />
        {showsDayControls ? (
          <ToolbarButton label="Today" onClick={() => setDate(DEMO_TODAY)} />
        ) : null}
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => {
              setQ("");
              setOwnerFilter(null);
              setStateFilter(null);
            }}
          />
        ) : null}
        <ToolbarButton label="New appointment" tone="primary" onClick={() => setCreateOpen(true)} />
      </RouteToolbar>

      {breakpoint === "mobile" ? dayStrip : null}
      {view === "calendar" ? calendar : null}

      <div id="appointments-panel" role="tabpanel" aria-labelledby={`appointments-tab-${view}`}>
        {showsDayControls ? (
          <h2 className="mb-2 text-[12.5px] font-semibold text-cc-t-table">{longDate(date)}</h2>
        ) : null}

        {rows.length === 0 ? (
          <RouteEmpty title="No appointments to show" hint={emptyHint} />
        ) : breakpoint === "mobile" ? (
          rows.map((appointment) => renderRow(appointment, "mobile"))
        ) : (
          <div className="overflow-hidden rounded-cc-card border border-cc-line bg-cc-surface">
            {rows.map((appointment) => renderRow(appointment, breakpoint === "desktop" ? "desktop" : "tablet"))}
          </div>
        )}
      </div>

      {detail ? (
        <AppointmentDetailDialog
          appointment={detail}
          ownerName={ownerName(detail.ownerId)}
          meeting={meetingFor(detail.id)}
          activity={state.activity.filter((entry) => entry.subjectId === detail.id)}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setEditId(detail.id);
          }}
        />
      ) : null}

      {editing ? (
        <AppointmentFormDialog
          title={`Edit ${editing.title}`}
          submitLabel="Save changes"
          owners={ownerOptions}
          initial={{
            title: editing.title,
            date: editing.date,
            startTime: editing.startTime,
            endTime: editing.endTime,
            platform: editing.platform,
            ownerId: editing.ownerId,
            state: editing.state,
            detail: editing.detail,
            notes: editing.notes,
          }}
          onClose={() => setEditId(null)}
          onSubmit={(draft) => {
            updateAppointment(editing.id, {
              title: draft.title.trim(),
              date: draft.date,
              startTime: draft.startTime,
              endTime: draft.endTime,
              platform: draft.platform,
              ownerId: draft.ownerId,
              state: draft.state,
              detail: draft.detail.trim(),
              notes: draft.notes.trim(),
            });
            setAnnouncement(`${draft.title.trim()} saved.`);
            setEditId(null);
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateAppointmentDialog
          owners={ownerOptions}
          defaultDate={date}
          onClose={() => setCreateOpen(false)}
          onSubmit={(draft) => {
            const lead = LEAD_DIRECTORY.find((row) => row.id === draft.leadId);
            if (!lead) return;
            createAppointment({
              leadId: lead.id,
              opportunityId: state.opportunities.find((o) => o.leadId === lead.id)?.id ?? null,
              title: draft.title.trim(),
              company: lead.company,
              service: lead.serviceInterest ?? "AI Automation",
              date: draft.date,
              startTime: draft.startTime,
              endTime: draft.endTime,
              timezone: "PST",
              platform: draft.platform,
              ownerId: draft.ownerId,
              state: draft.state,
              detail: draft.detail.trim(),
              notes: draft.notes.trim(),
            });
            setDate(draft.date);
            setAnnouncement(`${draft.title.trim()} booked for ${longDate(draft.date)}.`);
            setCreateOpen(false);
          }}
        />
      ) : null}

      {rescheduling ? (
        <RescheduleDialog
          appointment={rescheduling}
          onClose={() => setRescheduleId(null)}
          onSubmit={(draft) => {
            rescheduleAppointment(rescheduling.id, draft.date, draft.startTime, draft.endTime);
            setDate(draft.date);
            setAnnouncement(`${rescheduling.title} moved to ${longDate(draft.date)} at ${draft.startTime}.`);
            setRescheduleId(null);
          }}
        />
      ) : null}

      {cancelling ? (
        <CancelDialog
          appointment={cancelling}
          onClose={() => setCancelId(null)}
          onSubmit={(reason) => {
            cancelAppointment(cancelling.id, reason);
            setAnnouncement(`${cancelling.title} cancelled.`);
            setCancelId(null);
          }}
        />
      ) : null}

      {joining ? (
        <Dialog
          open
          title={`Join ${joining.title}`}
          description={`${joining.platform} · ${timeRange(joining.startTime, joining.endTime, joining.timezone)}`}
          onClose={() => setJoinId(null)}
          footer={<DialogCancelButton onClick={() => setJoinId(null)} label="Close" />}
        >
          {/* CANON 1440: the meeting platform is "NOT CONFIGURED — provider-neutral". No
              record carries a join URL, so this says so rather than opening nothing. */}
          <p className="text-[12.5px] leading-[1.5] text-cc-t-table">
            No meeting provider is connected in this demo. Connecting {joining.platform} is part of
            production integration, so there is no real meeting to open from here.
          </p>
        </Dialog>
      ) : null}
    </div>
  );
}

function AppointmentDetailDialog({
  appointment,
  ownerName,
  meeting,
  activity,
  onClose,
  onEdit,
}: {
  appointment: Appointment;
  ownerName: string;
  meeting: Meeting | undefined;
  activity: readonly { id: string; message: string }[];
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Dialog
      open
      title={appointment.title}
      description={`${appointment.company} · ${appointment.service}`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button type="button" onClick={onEdit} className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white">
            Edit appointment
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <dt className="text-cc-t3">When</dt>
        <dd className="text-cc-ink">
          {longDate(appointment.date)} · {timeRange(appointment.startTime, appointment.endTime, appointment.timezone)}
        </dd>
        <dt className="text-cc-t3">Status</dt>
        <dd className="text-cc-ink">{STATE_META[appointment.state].label}</dd>
        <dt className="text-cc-t3">Owner</dt>
        <dd className="text-cc-ink">{ownerName}</dd>
        <dt className="text-cc-t3">Platform</dt>
        <dd className="text-cc-ink">{appointment.platform}</dd>
        <dt className="text-cc-t3">Meeting record</dt>
        <dd className="text-cc-ink">{meeting ? meeting.state : "None linked"}</dd>
      </dl>
      <p className="mt-3 border-t border-cc-line pt-3 text-[12.5px] text-cc-t-table">{appointment.detail}</p>
      {appointment.notes ? <p className="mt-2 text-[12.5px] text-cc-t-table">{appointment.notes}</p> : null}
      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">ACTIVITY HISTORY</h3>
      {activity.length === 0 ? (
        <p className="mt-1 text-[11.5px] text-cc-t3">No demo activity recorded for this appointment yet.</p>
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

function AppointmentFormDialog({
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
  initial: AppointmentDraft;
  onClose: () => void;
  onSubmit: (draft: AppointmentDraft) => void;
}) {
  const [draft, setDraft] = useState<AppointmentDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentDraft, string>>>({});
  return (
    <Dialog
      open
      title={title}
      description="Saved to the local demo store in this browser only."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label={submitLabel} form="appointment-form" />
        </>
      }
    >
      <form
        id="appointment-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateAppointmentDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <AppointmentFields draft={draft} errors={errors} owners={owners} onChange={setDraft} />
      </form>
    </Dialog>
  );
}

function CreateAppointmentDialog({
  owners,
  defaultDate,
  onClose,
  onSubmit,
}: {
  owners: readonly { id: string; label: string }[];
  defaultDate: string;
  onClose: () => void;
  onSubmit: (draft: CreateDraft) => void;
}) {
  const available = useMemo(() => LEAD_DIRECTORY.slice(0, 40), []);
  const [draft, setDraft] = useState<CreateDraft>({
    leadId: available[0]?.id ?? "",
    title: available[0] ? `${available[0].name} — discovery call` : "",
    date: defaultDate,
    startTime: "10:00",
    endTime: "10:45",
    platform: "Google Meet",
    ownerId: owners[0]?.id ?? "unassigned",
    state: "preparation_needed",
    detail: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateDraft, string>>>({});

  return (
    <Dialog
      open
      title="New appointment"
      description="Booked in the local demo store only — no calendar or provider is contacted."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Book appointment" form="create-appointment-form" />
        </>
      }
    >
      <form
        id="create-appointment-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next: Partial<Record<keyof CreateDraft, string>> = validateAppointmentDraft(draft);
          if (!draft.leadId) next.leadId = "Choose the lead this appointment belongs to.";
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <SelectField
          label="Lead"
          value={draft.leadId}
          error={errors.leadId}
          onChange={(leadId) => {
            const lead = available.find((row) => row.id === leadId);
            setDraft((d) => ({ ...d, leadId, title: lead ? `${lead.name} — discovery call` : d.title }));
          }}
          options={available.map((lead) => ({ value: lead.id, label: `${lead.name} — ${lead.company}` }))}
        />
        <AppointmentFields
          draft={draft}
          errors={errors}
          owners={owners}
          onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
        />
      </form>
    </Dialog>
  );
}

function AppointmentFields({
  draft,
  errors,
  owners,
  onChange,
}: {
  draft: AppointmentDraft;
  errors: Partial<Record<keyof AppointmentDraft, string>>;
  owners: readonly { id: string; label: string }[];
  onChange: (draft: AppointmentDraft) => void;
}) {
  const patch = (values: Partial<AppointmentDraft>) => onChange({ ...draft, ...values });
  return (
    <>
      <TextField label="Title" value={draft.title} error={errors.title} onChange={(title) => patch({ title })} />
      <TextField label="Date" type="date" value={draft.date} error={errors.date} onChange={(date) => patch({ date })} />
      <TextField label="Start time" type="time" value={draft.startTime} error={errors.startTime} onChange={(startTime) => patch({ startTime })} />
      <TextField label="End time" type="time" value={draft.endTime} error={errors.endTime} onChange={(endTime) => patch({ endTime })} />
      <SelectField
        label="Platform"
        value={draft.platform}
        onChange={(platform) => patch({ platform })}
        options={PLATFORMS.map((platform) => ({ value: platform, label: platform }))}
      />
      <SelectField
        label="Owner"
        value={draft.ownerId}
        onChange={(ownerId) => patch({ ownerId })}
        options={owners.map((owner) => ({ value: owner.id, label: owner.label }))}
      />
      <SelectField
        label="Status"
        value={draft.state}
        onChange={(value) => patch({ state: value as AppointmentState })}
        options={STATE_ORDER.map((candidate) => ({ value: candidate, label: STATE_META[candidate].short }))}
      />
      <TextField label="Detail" value={draft.detail} error={errors.detail} onChange={(detail) => patch({ detail })} hint="The line the list shows under the appointment." />
      <TextAreaField label="Notes" value={draft.notes} onChange={(notes) => patch({ notes })} />
    </>
  );
}

function RescheduleDialog({
  appointment,
  onClose,
  onSubmit,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSubmit: (draft: ScheduleDraft) => void;
}) {
  const [draft, setDraft] = useState<ScheduleDraft>({
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleDraft, string>>>({});
  return (
    <Dialog
      open
      title={`Reschedule ${appointment.title}`}
      description="Moves the appointment and updates the lead's next step. Nobody is emailed."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Reschedule" form="reschedule-form" />
        </>
      }
    >
      <form
        id="reschedule-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateSchedule(draft);
          if (draft.date === appointment.date && draft.startTime === appointment.startTime && draft.endTime === appointment.endTime) {
            next.date = "Pick a different date or time.";
          }
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <TextField label="Date" type="date" value={draft.date} error={errors.date} onChange={(date) => setDraft((d) => ({ ...d, date }))} />
        <TextField label="Start time" type="time" value={draft.startTime} error={errors.startTime} onChange={(startTime) => setDraft((d) => ({ ...d, startTime }))} />
        <TextField label="End time" type="time" value={draft.endTime} error={errors.endTime} onChange={(endTime) => setDraft((d) => ({ ...d, endTime }))} />
      </form>
    </Dialog>
  );
}

function CancelDialog({
  appointment,
  onClose,
  onSubmit,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      title={`Cancel ${appointment.title}`}
      description="The appointment stays on the record as cancelled, and the lead's next step becomes a rebook."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Keep appointment" />
          <DialogSubmitButton label="Cancel appointment" tone="red" form="cancel-appointment-form" />
        </>
      }
    >
      <form
        id="cancel-appointment-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (reason.trim().length < 3) {
            setError("Give a reason of at least 3 characters.");
            return;
          }
          onSubmit(reason.trim());
        }}
      >
        <TextAreaField
          label="Reason"
          value={reason}
          onChange={(value) => {
            setReason(value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          hint="Recorded on this appointment's activity history."
        />
      </form>
    </Dialog>
  );
}

export function validateSchedule(draft: ScheduleDraft): Partial<Record<keyof ScheduleDraft, string>> {
  const errors: Partial<Record<keyof ScheduleDraft, string>> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.date = "Pick a date.";
  if (!/^\d{2}:\d{2}$/.test(draft.startTime)) errors.startTime = "Pick a start time.";
  if (!/^\d{2}:\d{2}$/.test(draft.endTime)) errors.endTime = "Pick an end time.";
  else if (!errors.startTime && draft.endTime <= draft.startTime) errors.endTime = "End time must be after the start time.";
  return errors;
}

export function validateAppointmentDraft(draft: AppointmentDraft): Partial<Record<keyof AppointmentDraft, string>> {
  const errors: Partial<Record<keyof AppointmentDraft, string>> = { ...validateSchedule(draft) };
  if (!draft.title.trim()) errors.title = "Title is required.";
  if (!draft.detail.trim()) errors.detail = "Detail is required — it is the line the list shows.";
  return errors;
}
