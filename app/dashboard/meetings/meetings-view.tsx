"use client";
// Meeting Intelligence — M-D01 (desktop directory), MO-08 (mobile cards), with the M-D02
// pre-call preparation panel opened as a dialog from a row's Prepare action.
//
// This screen owns transcripts, analysis and CRM recommendations. Scheduling lives on
// Appointments (M-D01 445 says so in the subtitle), so anything here that changes when a
// conversation happens writes through to the appointment it was booked from rather than
// keeping a second copy of the time.
//
// No provider is connected. Every meeting carries an empty joinUrl, the readiness panel
// reports REQUIRES PROVIDER exactly as M-D01 466-468 draws it, and no transcript text
// exists to show — the UI says that instead of implying a recording is available.
import { useCallback, useMemo, useState } from "react";
import {
  cancelMeeting,
  completeMeeting,
  createMeeting,
  createProposal,
  rescheduleMeeting,
  updateMeeting,
} from "../../../lib/demo/actions";
import { DEMO_TODAY, LEAD_DIRECTORY } from "../../../lib/demo/seed";
import type { Meeting, MeetingState, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../components/demo/tone";
import { useBreakpoint } from "../../../components/demo/use-breakpoint";
import { MenuButton, type MenuItem } from "../../../components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../../../components/demo/dialog";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton } from "../../../components/demo/toolbar";
import { longDate, timeRange } from "../appointments/date-utils";

// CANON 1392-1396 gives each meeting an `stc` colour. FAILED · NO-SHOW is red, NEEDS
// REVIEW blue, COMPLETED neutral, READY green. LIVE and CANCELLED are not drawn on any
// canonical meeting frame; their tones are SYNTHETIC and follow the same grammar.
const STATE_TONE: Record<MeetingState, Tone> = {
  READY: "green",
  LIVE: "green",
  "NEEDS REVIEW": "blue",
  COMPLETED: "neutral",
  "FAILED · NO-SHOW": "red",
  CANCELLED: "neutral",
};

const STATES: MeetingState[] = ["READY", "LIVE", "NEEDS REVIEW", "COMPLETED", "FAILED · NO-SHOW", "CANCELLED"];

// M-D01 445 / MO-08 1157: Upcoming · Live · Needs review · N · Completed (mobile "Done").
type MeetingsView = "upcoming" | "live" | "review" | "completed";

const VIEW_STATES: Record<MeetingsView, MeetingState[]> = {
  upcoming: ["READY"],
  live: ["LIVE"],
  review: ["NEEDS REVIEW"],
  completed: ["COMPLETED", "FAILED · NO-SHOW", "CANCELLED"],
};

const PLATFORMS = ["Google Meet", "Zoom", "Microsoft Teams", "Phone"] as const;

// M-D01 466-470: the readiness list. Everything that needs an external provider says so;
// the two that do not are genuinely satisfied in demo mode.
const READINESS: readonly { label: string; status: string; tone: Tone }[] = [
  { label: "Meeting integration", status: "REQUIRES PROVIDER", tone: "amber" },
  { label: "Transcription", status: "REQUIRES PROVIDER", tone: "amber" },
  { label: "AI provider · model", status: "REQUIRES PROVIDER", tone: "amber" },
  { label: "Consent message", status: "APPROVED", tone: "green" },
  { label: "Microphone", status: "OK", tone: "green" },
];

// M-D01 459-461.
const PINNED_QUESTIONS: readonly string[] = [
  "Problem — Which listing workflows break down first during peak season?",
  "Systems — What runs the current portal, and who maintains it?",
  "Decision — Who signs off, and by when do you want a decision?",
];

const ACTION_CLASS =
  "rounded-cc-control border border-cc-line-strong px-[11px] py-[5px] text-[11.5px] font-semibold text-cc-green-ink hover:border-cc-green-border";

type MeetingDraft = {
  name: string;
  company: string;
  service: string;
  when: string;
  ownerId: string;
  platform: string;
  state: MeetingState;
  consent: string;
  attendees: string;
};

type ScheduleDraft = { date: string; startTime: string; endTime: string };

export function MeetingsScreen() {
  const { state, status, error, retry } = useDemoQuery();
  const breakpoint = useBreakpoint();

  const [view, setView] = useState<MeetingsView>("review");
  const [q, setQ] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [prepareId, setPrepareId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState<string | null>(null);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
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

  /** The day a meeting happens is the linked appointment's — this screen never keeps a
   *  second copy of it. Meetings booked here without an appointment have no day, and the
   *  date filter leaves them alone rather than guessing one. */
  const dayOf = useCallback(
    (meeting: Meeting): string | null =>
      state.appointments.find((a) => a.id === meeting.appointmentId)?.date ?? null,
    [state.appointments],
  );

  const dateOptions = useMemo(() => {
    const days = [...new Set(state.meetings.map(dayOf).filter((d): d is string => d !== null))].sort();
    return days.map((day) => ({ id: day, label: longDate(day) }));
  }, [state.meetings, dayOf]);

  const matching = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.meetings.filter((meeting) => {
      if (ownerFilter && meeting.ownerId !== ownerFilter) return false;
      if (dateFilter && dayOf(meeting) !== dateFilter) return false;
      if (!needle) return true;
      return (
        meeting.name.toLowerCase().includes(needle) ||
        meeting.company.toLowerCase().includes(needle) ||
        meeting.service.toLowerCase().includes(needle) ||
        meeting.platform.toLowerCase().includes(needle)
      );
    });
  }, [state.meetings, q, ownerFilter, dateFilter, dayOf]);

  const rows = useMemo(
    () => matching.filter((meeting) => VIEW_STATES[view].includes(meeting.state)),
    [matching, view],
  );

  const reviewCount = useMemo(
    () => state.meetings.filter((meeting) => meeting.state === "NEEDS REVIEW").length,
    [state.meetings],
  );

  const filtersApplied = Boolean(q || ownerFilter || dateFilter);
  const find = (id: string | null) => (id ? (state.meetings.find((m) => m.id === id) ?? null) : null);

  const detail = find(detailId);
  const editing = find(editId);
  const preparing = find(prepareId);
  const joining = find(joinId);
  const transcript = find(transcriptId);
  const completing = find(completeId);
  const rescheduling = find(rescheduleId);
  const cancelling = find(cancelId);

  /** "Transcript · Proposal" (CANON 1394). The proposal is a real record in the shared
   *  demo store, opened from the meeting's own lead and opportunity — not a stub. */
  const draftProposal = useCallback(
    (meeting: Meeting) => {
      const opportunity = state.opportunities.find((o) => o.id === meeting.opportunityId);
      const id = createProposal({
        leadId: meeting.leadId,
        opportunityId: meeting.opportunityId,
        client: meeting.company,
        leadName: meeting.name,
        service: meeting.service,
        value: opportunity?.value ?? 0,
        ownerId: meeting.ownerId,
        version: "v1",
        state: "DRAFT",
        lastEvent: "Drafted from meeting",
        source: "Meeting · Solution Canvas",
      });
      setAnnouncement(`${id} drafted from ${meeting.name}'s meeting.`);
    },
    [state.opportunities],
  );

  if (status === "loading") return <RouteLoading label="meetings" />;
  if (status === "error") return <RouteError label="meetings" error={error!} onRetry={retry} />;

  const rowMenu = (meeting: Meeting): MenuItem[] => [
    { id: "open", label: "Open details" },
    { id: "edit", label: "Edit meeting" },
    { id: "prepare", label: "Prepare for meeting" },
    { id: "transcript", label: "Open transcript" },
    { id: "proposal", label: "Draft proposal from meeting" },
    { id: "complete", label: "Mark complete", disabled: meeting.state === "COMPLETED" },
    { id: "reschedule", label: "Reschedule" },
    { id: "cancel", label: "Cancel meeting", disabled: meeting.state === "CANCELLED" },
  ];

  const onMenuSelect = (meeting: Meeting, id: string) => {
    if (id === "open") setDetailId(meeting.id);
    else if (id === "edit") setEditId(meeting.id);
    else if (id === "prepare") setPrepareId(meeting.id);
    else if (id === "transcript") setTranscriptId(meeting.id);
    else if (id === "proposal") draftProposal(meeting);
    else if (id === "complete") setCompleteId(meeting.id);
    else if (id === "reschedule") setRescheduleId(meeting.id);
    else if (id === "cancel") setCancelId(meeting.id);
  };

  /** CANON 1392-1396 `act`: the action list each state offers. */
  const actionsFor = (meeting: Meeting): Array<{ key: string; label: string; onClick: () => void }> => {
    switch (meeting.state) {
      case "READY":
        return [
          { key: "prepare", label: "Prepare", onClick: () => setPrepareId(meeting.id) },
          { key: "join", label: "Join", onClick: () => setJoinId(meeting.id) },
        ];
      case "LIVE":
        return [
          { key: "workspace", label: "Open workspace", onClick: () => setJoinId(meeting.id) },
          { key: "complete", label: "End and review", onClick: () => setCompleteId(meeting.id) },
        ];
      case "NEEDS REVIEW":
        return [
          { key: "review", label: "Review", onClick: () => setDetailId(meeting.id) },
          { key: "transcript", label: "Transcript", onClick: () => setTranscriptId(meeting.id) },
        ];
      case "COMPLETED":
        return [
          { key: "transcript", label: "Transcript", onClick: () => setTranscriptId(meeting.id) },
          { key: "proposal", label: "Proposal", onClick: () => draftProposal(meeting) },
        ];
      default:
        return [{ key: "reschedule", label: "Reschedule", onClick: () => setRescheduleId(meeting.id) }];
    }
  };

  const renderRow = (meeting: Meeting) => {
    const chip = (
      <span
        className="flex-shrink-0 font-cc-mono text-[8px] font-semibold tracking-[.05em] xl:text-[9.5px]"
        style={{ color: TONE_INK[STATE_TONE[meeting.state]] }}
      >
        {meeting.state}
      </span>
    );
    const menu = (
      <MenuButton
        label="⋯"
        ariaLabel={`Actions for ${meeting.name}`}
        align="right"
        width={250}
        items={rowMenu(meeting)}
        onSelect={(id) => onMenuSelect(meeting, id)}
        className="px-1 leading-none text-cc-icon-muted hover:text-cc-t2"
      />
    );
    const actions = actionsFor(meeting);

    if (breakpoint === "mobile") {
      // MO-08 1160: name · company on one line with the status, then two muted detail lines
      // and the action list. "Done" is the tab label; the card keeps the full state.
      return (
        <article
          key={meeting.id}
          aria-label={meeting.name}
          data-testid={`meeting-card-${meeting.id}`}
          className="mb-[9px] rounded-cc-card border border-cc-line bg-cc-surface px-[13px] py-[11px]"
        >
          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setDetailId(meeting.id)}
              className="min-w-0 truncate text-left text-[12.5px] font-semibold text-cc-ink"
            >
              {meeting.name} · {meeting.company}
            </button>
            <span className="flex flex-shrink-0 items-center gap-1.5">
              {chip}
              {menu}
            </span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-cc-t3">
            {meeting.service} · {meeting.when} · {ownerName(meeting.ownerId)}
          </div>
          <div className="mt-[3px] text-[10px] text-cc-t3">
            {meeting.consent} · transcript {meeting.transcript} · AI {meeting.ai}
          </div>
          <div className="mt-[7px] flex gap-1.5">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                className={`flex-1 py-[7px] text-center ${ACTION_CLASS}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </article>
      );
    }

    // M-D01 447: one row, three stacked detail lines, the status chip and the actions.
    return (
      <div
        key={meeting.id}
        data-testid={`meeting-row-${meeting.id}`}
        className="flex min-h-[62px] items-center gap-[13px] border-b border-cc-row-line px-4 py-2.5 last:border-b-0 xl:px-[18px]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailId(meeting.id)}
              className="truncate text-[13px] font-semibold text-cc-ink hover:text-cc-green-ink"
            >
              {meeting.name}
            </button>
            <span className="truncate text-[11.5px] text-cc-t3">{meeting.company}</span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-cc-t2">
            {meeting.service} · {meeting.when} · {ownerName(meeting.ownerId)} · {meeting.platform}
          </div>
          <div className="mt-0.5 text-[11px] text-cc-t3">
            {meeting.consent} · transcript: {meeting.transcript} · AI: {meeting.ai} · CRM: {meeting.crm}
          </div>
        </div>
        {chip}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {actions.map((action) => (
            <button key={action.key} type="button" onClick={action.onClick} className={ACTION_CLASS}>
              {action.label}
            </button>
          ))}
          {menu}
        </div>
      </div>
    );
  };

  const viewLabel = (candidate: MeetingsView): string => {
    if (candidate === "review") return `Needs review · ${reviewCount}`;
    if (candidate === "completed") return breakpoint === "mobile" ? "Done" : "Completed";
    return candidate === "upcoming" ? "Upcoming" : "Live";
  };

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* MO-08 1157 draws the switch as a strip under the header rather than inside it, so
          it stays in the body at every size. */}
      <div
        role="tablist"
        aria-label="Meeting view"
        className="mb-3 flex flex-wrap gap-1.5 rounded-cc-card border border-cc-line bg-cc-surface px-2 py-2"
      >
        {(["upcoming", "live", "review", "completed"] as MeetingsView[]).map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            id={`meetings-tab-${candidate}`}
            aria-selected={candidate === view}
            aria-controls="meetings-panel"
            tabIndex={candidate === view ? 0 : -1}
            onClick={() => setView(candidate)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const order: MeetingsView[] = ["upcoming", "live", "review", "completed"];
              const next = order[(order.indexOf(candidate) + (event.key === "ArrowRight" ? 1 : order.length - 1)) % order.length]!;
              setView(next);
              document.getElementById(`meetings-tab-${next}`)?.focus();
            }}
            className={
              candidate === view
                ? "rounded-cc-control bg-cc-ink-strong px-[11px] py-[7px] text-[11.5px] font-semibold text-white"
                : "rounded-cc-control px-[11px] py-[7px] text-[11.5px] font-semibold text-cc-t2 hover:bg-cc-secondary"
            }
          >
            {viewLabel(candidate)}
          </button>
        ))}
      </div>

      <RouteToolbar>
        <SearchInput value={q} onChange={setQ} label="Search meetings by name, company, service or platform" />
        <FilterMenu label="Owner" allLabel="All owners" value={ownerFilter} options={ownerOptions} onChange={setOwnerFilter} />
        <FilterMenu label="Date" allLabel="Any date" value={dateFilter} options={dateOptions} onChange={setDateFilter} />
        <ToolbarButton label="Today" onClick={() => setDateFilter(DEMO_TODAY)} />
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => {
              setQ("");
              setOwnerFilter(null);
              setDateFilter(null);
            }}
          />
        ) : null}
        <ToolbarButton label="New meeting" tone="primary" onClick={() => setCreateOpen(true)} />
      </RouteToolbar>

      <div id="meetings-panel" role="tabpanel" aria-labelledby={`meetings-tab-${view}`}>
        {rows.length === 0 ? (
          <RouteEmpty
            title="No meetings to show"
            hint={filtersApplied ? "Clear a filter to see the rest." : "Nothing is in this state right now."}
          />
        ) : breakpoint === "mobile" ? (
          rows.map(renderRow)
        ) : (
          <div className="overflow-hidden rounded-cc-card border border-cc-line bg-cc-surface">{rows.map(renderRow)}</div>
        )}
      </div>

      {detail ? (
        <MeetingDetailDialog
          meeting={detail}
          ownerName={ownerName(detail.ownerId)}
          day={dayOf(detail)}
          activity={state.activity.filter((entry) => entry.subjectId === detail.id)}
          onClose={() => setDetailId(null)}
          onComplete={() => {
            setDetailId(null);
            setCompleteId(detail.id);
          }}
          onEdit={() => {
            setDetailId(null);
            setEditId(detail.id);
          }}
        />
      ) : null}

      {editing ? (
        <MeetingFormDialog
          title={`Edit ${editing.name}`}
          submitLabel="Save changes"
          owners={ownerOptions}
          initial={{
            name: editing.name,
            company: editing.company,
            service: editing.service,
            when: editing.when,
            ownerId: editing.ownerId,
            platform: editing.platform,
            state: editing.state,
            consent: editing.consent,
            attendees: editing.attendees.join(", "),
          }}
          onClose={() => setEditId(null)}
          onSubmit={(draft) => {
            updateMeeting(editing.id, { ...toMeetingPatch(draft) });
            setAnnouncement(`${draft.name.trim()} saved.`);
            setEditId(null);
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateMeetingDialog
          owners={ownerOptions}
          onClose={() => setCreateOpen(false)}
          onSubmit={(leadId, draft) => {
            const lead = LEAD_DIRECTORY.find((row) => row.id === leadId);
            if (!lead) return;
            createMeeting({
              leadId: lead.id,
              opportunityId: state.opportunities.find((o) => o.leadId === lead.id)?.id ?? null,
              appointmentId: state.appointments.find((a) => a.leadId === lead.id)?.id ?? null,
              ...toMeetingPatch(draft),
              transcript: "—",
              ai: "—",
              crm: "—",
              joinUrl: "",
              outcome: "",
              notes: "",
            });
            setView("upcoming");
            setAnnouncement(`${draft.name.trim()} added to Meeting Intelligence.`);
            setCreateOpen(false);
          }}
        />
      ) : null}

      {completing ? (
        <CompleteMeetingDialog
          meeting={completing}
          onClose={() => setCompleteId(null)}
          onSubmit={(outcome, notes) => {
            completeMeeting(completing.id, outcome, notes);
            setView("completed");
            setAnnouncement(`${completing.name} marked complete.`);
            setCompleteId(null);
          }}
        />
      ) : null}

      {rescheduling ? (
        <RescheduleMeetingDialog
          meeting={rescheduling}
          day={dayOf(rescheduling)}
          onClose={() => setRescheduleId(null)}
          onSubmit={(draft) => {
            rescheduleMeeting(rescheduling.id, {
              ...draft,
              when: `${longDate(draft.date)} · ${timeRange(draft.startTime, draft.endTime, "PST")}`,
            });
            setView("upcoming");
            setAnnouncement(`${rescheduling.name} moved to ${longDate(draft.date)}.`);
            setRescheduleId(null);
          }}
        />
      ) : null}

      {cancelling ? (
        <CancelMeetingDialog
          meeting={cancelling}
          onClose={() => setCancelId(null)}
          onSubmit={(reason) => {
            cancelMeeting(cancelling.id, reason);
            setAnnouncement(`${cancelling.name} cancelled.`);
            setCancelId(null);
          }}
        />
      ) : null}

      {preparing ? (
        <PrepareDialog meeting={preparing} onClose={() => setPrepareId(null)} onJoin={() => setJoinId(preparing.id)} />
      ) : null}

      {joining ? (
        <Dialog
          open
          title={`Join ${joining.name}`}
          description={`${joining.platform} · ${joining.when}`}
          onClose={() => setJoinId(null)}
          footer={<DialogCancelButton onClick={() => setJoinId(null)} label="Close" />}
        >
          {/* M-D01 466: meeting integration REQUIRES PROVIDER. No meeting carries a join
              URL, so there is nothing real to open and this says so. */}
          <p className="text-[12.5px] leading-[1.5] text-cc-t-table">
            No meeting provider is connected, so there is no live workspace to open. Connecting{" "}
            {joining.platform} and a transcription provider is part of production integration.
          </p>
        </Dialog>
      ) : null}

      {transcript ? (
        <Dialog
          open
          title={`Transcript — ${transcript.name}`}
          description={`${transcript.consent} · ${transcript.transcript}`}
          onClose={() => setTranscriptId(null)}
          footer={<DialogCancelButton onClick={() => setTranscriptId(null)} label="Close" />}
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
            <dt className="text-cc-t3">Transcript</dt>
            <dd className="text-cc-ink">{transcript.transcript}</dd>
            <dt className="text-cc-t3">AI analysis</dt>
            <dd className="text-cc-ink">{transcript.ai}</dd>
            <dt className="text-cc-t3">CRM recommendations</dt>
            <dd className="text-cc-ink">{transcript.crm}</dd>
          </dl>
          <p className="mt-3 border-t border-cc-line pt-3 text-[12.5px] leading-[1.5] text-cc-t-table">
            Transcription requires a configured provider (M-D01 467), so no recorded text exists
            in demo mode — the summary above is demo data, not a real recording.
          </p>
        </Dialog>
      ) : null}
    </div>
  );
}

function toMeetingPatch(draft: MeetingDraft) {
  return {
    name: draft.name.trim(),
    company: draft.company.trim(),
    service: draft.service.trim(),
    when: draft.when.trim(),
    ownerId: draft.ownerId,
    platform: draft.platform,
    state: draft.state,
    consent: draft.consent.trim(),
    attendees: draft.attendees
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  };
}

function MeetingDetailDialog({
  meeting,
  ownerName,
  day,
  activity,
  onClose,
  onEdit,
  onComplete,
}: {
  meeting: Meeting;
  ownerName: string;
  day: string | null;
  activity: readonly { id: string; message: string }[];
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
}) {
  return (
    <Dialog
      open
      title={meeting.name}
      description={`${meeting.company} · ${meeting.service}`}
      onClose={onClose}
      width={540}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button
            type="button"
            onClick={onEdit}
            className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-1.5 text-[12.5px] font-semibold text-cc-t-table"
          >
            Edit meeting
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
          >
            Mark complete
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <dt className="text-cc-t3">When</dt>
        <dd className="text-cc-ink">{day ? longDate(day) : meeting.when}</dd>
        <dt className="text-cc-t3">Status</dt>
        <dd className="text-cc-ink">{meeting.state}</dd>
        <dt className="text-cc-t3">Owner</dt>
        <dd className="text-cc-ink">{ownerName}</dd>
        <dt className="text-cc-t3">Platform</dt>
        <dd className="text-cc-ink">{meeting.platform}</dd>
        <dt className="text-cc-t3">Attendees</dt>
        <dd className="text-cc-ink">{meeting.attendees.join(", ") || "None recorded"}</dd>
        <dt className="text-cc-t3">Consent</dt>
        <dd className="text-cc-ink">{meeting.consent}</dd>
        <dt className="text-cc-t3">Related opportunity</dt>
        <dd className="text-cc-ink">{meeting.opportunityId ?? "None linked"}</dd>
        <dt className="text-cc-t3">Related appointment</dt>
        <dd className="text-cc-ink">{meeting.appointmentId ?? "None linked"}</dd>
      </dl>
      {meeting.outcome ? (
        <p className="mt-3 border-t border-cc-line pt-3 text-[12.5px] text-cc-t-table">Outcome: {meeting.outcome}</p>
      ) : null}
      {meeting.notes ? <p className="mt-2 text-[12.5px] text-cc-t-table">{meeting.notes}</p> : null}
      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">ACTIVITY HISTORY</h3>
      {activity.length === 0 ? (
        <p className="mt-1 text-[11.5px] text-cc-t3">No demo activity recorded for this meeting yet.</p>
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

/** M-D02 456-474 — pinned questions, readiness and lead context, opened from a row rather
 *  than living beside the directory as the wide canonical frame draws it. */
function PrepareDialog({ meeting, onClose, onJoin }: { meeting: Meeting; onClose: () => void; onJoin: () => void }) {
  const [questions, setQuestions] = useState<string[]>([...PINNED_QUESTIONS]);
  const [draft, setDraft] = useState("");
  return (
    <Dialog
      open
      title={`Prepare — ${meeting.name} · ${meeting.when}`}
      description={`Goal: discovery · ${meeting.company} · ${meeting.service}`}
      onClose={onClose}
      width={560}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button
            type="button"
            onClick={onJoin}
            className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
          >
            Open live workspace
          </button>
        </>
      }
    >
      <h3 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
        PINNED QUESTIONS · {questions.length}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {questions.map((question) => (
          <li
            key={question}
            className="flex items-start justify-between gap-2 rounded-cc-control bg-cc-soft px-[9px] py-[7px] text-[12px] leading-[1.5] text-cc-t-table"
          >
            <span>{question}</span>
            <button
              type="button"
              aria-label={`Dismiss question: ${question}`}
              onClick={() => setQuestions((list) => list.filter((item) => item !== question))}
              className="flex-shrink-0 text-[11.5px] font-semibold text-cc-t3 hover:text-cc-red-ink"
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const question = draft.trim();
          if (!question) return;
          setQuestions((list) => [...list, question]);
          setDraft("");
        }}
      >
        <span className="flex-1">
          <TextField label="Add question" value={draft} onChange={setDraft} />
        </span>
        <button
          type="submit"
          className="mb-1 rounded-cc-control border border-cc-green-border bg-cc-green-tint px-3 py-1.5 text-[12px] font-semibold text-cc-green-ink"
        >
          Add
        </button>
      </form>

      <h3 className="mt-4 font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">READINESS</h3>
      <ul className="mt-1">
        {READINESS.map((item) => (
          <li key={item.label} className="flex items-center justify-between py-[5px] text-[11.5px] text-cc-t2">
            <span>{item.label}</span>
            <span
              className="rounded-[4px] px-1.5 py-0.5 font-cc-mono text-[9px] font-semibold"
              style={{ color: TONE_INK[item.tone] }}
            >
              {item.status}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-cc-line pt-2 text-[11.5px] leading-[1.5] text-cc-t3">
        Three of the five need an external provider that is not connected in demo mode, so the
        live workspace has nothing to record or transcribe.
      </p>
    </Dialog>
  );
}

function MeetingFormDialog({
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
  initial: MeetingDraft;
  onClose: () => void;
  onSubmit: (draft: MeetingDraft) => void;
}) {
  const [draft, setDraft] = useState<MeetingDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof MeetingDraft, string>>>({});
  const patch = (values: Partial<MeetingDraft>) => setDraft((d) => ({ ...d, ...values }));
  return (
    <Dialog
      open
      title={title}
      description="Saved to the local demo store in this browser only."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label={submitLabel} form="meeting-form" />
        </>
      }
    >
      <form
        id="meeting-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateMeetingDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <TextField label="Name" value={draft.name} error={errors.name} onChange={(name) => patch({ name })} />
        <TextField label="Company" value={draft.company} error={errors.company} onChange={(company) => patch({ company })} />
        <TextField label="Service" value={draft.service} onChange={(service) => patch({ service })} />
        <TextField
          label="When"
          value={draft.when}
          error={errors.when}
          onChange={(when) => patch({ when })}
          hint="Display label. Rescheduling from the row is what moves the linked appointment."
        />
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
          onChange={(value) => patch({ state: value as MeetingState })}
          options={STATES.map((candidate) => ({ value: candidate, label: candidate }))}
        />
        <TextField label="Consent" value={draft.consent} onChange={(consent) => patch({ consent })} />
        <TextField
          label="Attendees"
          value={draft.attendees}
          error={errors.attendees}
          onChange={(attendees) => patch({ attendees })}
          hint="Comma separated."
        />
      </form>
    </Dialog>
  );
}

function CreateMeetingDialog({
  owners,
  onClose,
  onSubmit,
}: {
  owners: readonly { id: string; label: string }[];
  onClose: () => void;
  onSubmit: (leadId: string, draft: MeetingDraft) => void;
}) {
  const available = useMemo(() => LEAD_DIRECTORY.slice(0, 40), []);
  const first = available[0];
  const [leadId, setLeadId] = useState(first?.id ?? "");
  const [draft, setDraft] = useState<MeetingDraft>({
    name: first?.name ?? "",
    company: first?.company ?? "",
    service: first?.serviceInterest ?? "AI Automation",
    when: "Today · 10:00 AM PST",
    ownerId: owners[0]?.id ?? "unassigned",
    platform: "Google Meet",
    state: "READY",
    consent: "Consent pending",
    attendees: first?.name ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MeetingDraft, string>>>({});
  const patch = (values: Partial<MeetingDraft>) => setDraft((d) => ({ ...d, ...values }));

  return (
    <Dialog
      open
      title="New meeting"
      description="Added to the local demo store only — no provider is contacted and nothing is recorded."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Add meeting" form="create-meeting-form" />
        </>
      }
    >
      <form
        id="create-meeting-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateMeetingDraft(draft);
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
            if (lead) patch({ name: lead.name, company: lead.company, service: lead.serviceInterest ?? draft.service, attendees: lead.name });
          }}
          options={available.map((lead) => ({ value: lead.id, label: `${lead.name} — ${lead.company}` }))}
        />
        <TextField label="Name" value={draft.name} error={errors.name} onChange={(name) => patch({ name })} />
        <TextField label="Company" value={draft.company} error={errors.company} onChange={(company) => patch({ company })} />
        <TextField label="Service" value={draft.service} onChange={(service) => patch({ service })} />
        <TextField label="When" value={draft.when} error={errors.when} onChange={(when) => patch({ when })} />
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
        <TextField
          label="Attendees"
          value={draft.attendees}
          error={errors.attendees}
          onChange={(attendees) => patch({ attendees })}
          hint="Comma separated."
        />
      </form>
    </Dialog>
  );
}

function CompleteMeetingDialog({
  meeting,
  onClose,
  onSubmit,
}: {
  meeting: Meeting;
  onClose: () => void;
  onSubmit: (outcome: string, notes: string) => void;
}) {
  const [outcome, setOutcome] = useState(meeting.outcome);
  const [notes, setNotes] = useState(meeting.notes);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      title={`Mark ${meeting.name} complete`}
      description="The outcome becomes the lead's next step, so it is required."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Mark complete" form="complete-meeting-form" />
        </>
      }
    >
      <form
        id="complete-meeting-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (outcome.trim().length < 3) {
            setError("Give an outcome of at least 3 characters.");
            return;
          }
          onSubmit(outcome.trim(), notes.trim());
        }}
      >
        <TextField
          label="Outcome"
          value={outcome}
          error={error ?? undefined}
          onChange={(value) => {
            setOutcome(value);
            if (error) setError(null);
          }}
        />
        <TextAreaField label="Notes" value={notes} onChange={setNotes} />
      </form>
    </Dialog>
  );
}

function RescheduleMeetingDialog({
  meeting,
  day,
  onClose,
  onSubmit,
}: {
  meeting: Meeting;
  day: string | null;
  onClose: () => void;
  onSubmit: (draft: ScheduleDraft) => void;
}) {
  const [draft, setDraft] = useState<ScheduleDraft>({
    date: day ?? DEMO_TODAY,
    startTime: "10:00",
    endTime: "10:45",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleDraft, string>>>({});
  return (
    <Dialog
      open
      title={`Reschedule ${meeting.name}`}
      description={
        meeting.appointmentId
          ? "Moves the linked appointment too, so both screens agree. Nobody is emailed."
          : "This meeting has no linked appointment, so only the meeting moves."
      }
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Reschedule meeting" form="reschedule-meeting-form" />
        </>
      }
    >
      <form
        id="reschedule-meeting-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateSchedule(draft);
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

function CancelMeetingDialog({
  meeting,
  onClose,
  onSubmit,
}: {
  meeting: Meeting;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      title={`Cancel ${meeting.name}`}
      description="Cancels the linked appointment as well, and the lead's next step becomes a rebook."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Keep meeting" />
          <DialogSubmitButton label="Cancel meeting" tone="red" form="cancel-meeting-form" />
        </>
      }
    >
      <form
        id="cancel-meeting-form"
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
          error={error ?? undefined}
          onChange={(value) => {
            setReason(value);
            if (error) setError(null);
          }}
        />
      </form>
    </Dialog>
  );
}

function validateSchedule(draft: ScheduleDraft): Partial<Record<keyof ScheduleDraft, string>> {
  const errors: Partial<Record<keyof ScheduleDraft, string>> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.date = "Pick a date.";
  if (!/^\d{2}:\d{2}$/.test(draft.startTime)) errors.startTime = "Pick a start time.";
  if (!/^\d{2}:\d{2}$/.test(draft.endTime)) errors.endTime = "Pick an end time.";
  else if (!errors.startTime && draft.endTime <= draft.startTime) errors.endTime = "End time must be after the start time.";
  return errors;
}

export function validateMeetingDraft(draft: MeetingDraft): Partial<Record<keyof MeetingDraft, string>> {
  const errors: Partial<Record<keyof MeetingDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Name is required.";
  if (!draft.company.trim()) errors.company = "Company is required.";
  if (!draft.when.trim()) errors.when = "When is required — it is the line the directory shows.";
  if (!draft.attendees.split(",").some((name) => name.trim())) errors.attendees = "List at least one attendee.";
  return errors;
}
