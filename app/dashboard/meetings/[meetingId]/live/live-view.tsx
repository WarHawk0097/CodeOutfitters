"use client";
// M-D03 · LIVE MEETING WORKSPACE (Command Center Final.dc.html lines 479-524), as a
// full-page, deep-linkable route. Same canonical three-column frame — CONTEXT / AGENDA
// / PINNED (280px) · TRANSCRIPT (1fr) · COPILOT tabs (420px) — but with the honest demo
// posture the whole Command Center is held to:
//
//   - No meeting provider is connected in demo mode, so nothing is recording and nothing
//     is transcribing. The canonical active markers the frame draws for a real session
//     ("CONSENT RECORDED · TRANSCRIBING", "REC ●", "LIVE · 00:17:26", a live transcript
//     feed, "…is speaking") are DELIBERATELY ABSENT — rendering them would claim a
//     recording/consent state that does not exist. The header instead reports NOT
//     RECORDING and surfaces the meeting's real consent field verbatim.
//   - Consent is never inferred: recording/transcription controls stay disabled until a
//     real provider and explicit consent exist, and each disabled control says why.
//   - Safe local, non-persistent interactions ARE allowed (M-D03 is a workspace): the
//     agenda items can be checked off locally and the copilot tabs can be switched. None
//     of it persists, records, or calls a provider.
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DemoState, Meeting, Tone } from "../../../../../lib/demo/types";
import { useDemoQuery } from "../../../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../../../components/demo/tone";
import { RouteEmpty, RouteError, RouteLoading } from "../../../../../components/demo/route-states";

// M-D03 495-496: the discovery agenda. In demo nothing has been covered yet (there is no
// live session), so every item starts un-covered and is only checkable locally.
const AGENDA: readonly string[] = [
  "Problem",
  "Workflow",
  "Systems",
  "Volume",
  "Users",
  "Value",
  "Risk",
  "Timing",
  "Exceptions",
  "Budget",
  "Decision",
  "Security",
];

// M-D03 497-498.
const PINNED = "Should we structure phase 1 under the CFO approval threshold?";

// M-D03 513: the copilot tab strip. Switching is a safe local interaction; every panel
// reports REQUIRES PROVIDER because AI assistance needs a connected provider (M-D02 466-468).
const COPILOT_TABS = ["Discovery", "Canvas", "Pitch", "Objections", "Actions", "Proposal"] as const;
type CopilotTab = (typeof COPILOT_TABS)[number];

/** Not-found logic, isolated so it is unit-testable in the node test env. */
export function findMeeting(state: DemoState, meetingId: string): Meeting | null {
  return state.meetings.find((m) => m.id === meetingId) ?? null;
}

export function LiveView({ meetingId }: { meetingId: string }) {
  const { state, status, error, retry } = useDemoQuery();
  const meeting = findMeeting(state, meetingId);

  const back = (
    <Link
      href={`/dashboard/meetings/${meetingId}/prepare`}
      className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to preparation
    </Link>
  );

  if (status === "loading") {
    return (
      <div className="cc-scope mx-auto max-w-6xl font-cc-body">
        {back}
        <RouteLoading label="live meeting workspace" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="cc-scope mx-auto max-w-6xl font-cc-body">
        {back}
        <RouteError label="live meeting workspace" error={error ?? "Unknown error"} onRetry={retry} />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="cc-scope mx-auto max-w-6xl font-cc-body">
        {back}
        <RouteEmpty
          title="Meeting not found"
          hint="This meeting is not in your directory, or the link is out of date."
        />
      </div>
    );
  }

  return (
    <div className="cc-scope mx-auto max-w-6xl font-cc-body">
      {back}
      <LiveContent meeting={meeting} />
    </div>
  );
}

// Pure presentation — the only local state is non-persistent UI (checked agenda items,
// active copilot tab). No hooks that touch window/store, so it renders under
// react-dom/server in the node test env and its markup can be asserted directly.
export function LiveContent({ meeting }: { meeting: Meeting }) {
  const [covered, setCovered] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<CopilotTab>("Discovery");
  const providerNoteId = useId();

  const coveredCount = AGENDA.filter((item) => covered[item]).length;

  return (
    <div className="overflow-hidden rounded-cc-card border border-cc-line-strong bg-cc-surface shadow-[0_14px_40px_rgba(20,26,30,.08)]">
      {/* M-D03 482-490: the dark session header. In demo there is no live session, so it
          reports NOT RECORDING and the meeting's real consent state — never a fabricated
          "LIVE / REC ● / TRANSCRIBING". */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-cc-ink-strong px-5 py-3 text-white">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cc-t3" aria-hidden />
          <h1 className="text-[13.5px] font-semibold">
            {meeting.service} — {meeting.name} · {meeting.company}
          </h1>
        </span>
        <span
          className="rounded-[4px] bg-white/10 px-2 py-0.5 font-cc-mono text-[10px] font-semibold"
          style={{ color: TONE_INK.amber }}
        >
          NOT RECORDING
        </span>
        <span className="font-cc-mono text-[10px] text-white/60">
          Consent: {meeting.consent}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-describedby={providerNoteId}
            className="cursor-not-allowed rounded-cc-control border border-white/20 px-2.5 py-1 text-[11.5px] font-semibold text-white/50"
          >
            Start recording
          </button>
          <button
            type="button"
            disabled
            aria-describedby={providerNoteId}
            className="cursor-not-allowed rounded-cc-control bg-cc-red/60 px-2.5 py-1 text-[11.5px] font-semibold text-white/70"
          >
            End meeting
          </button>
        </div>
      </header>

      {/* M-D03 491: the three-column workspace grid — stacks on small screens. */}
      <div className="grid grid-cols-1 gap-3.5 p-4 lg:grid-cols-[280px_1fr_420px]">
        {/* M-D03 492-499: CONTEXT · AGENDA · PINNED QUESTIONS. */}
        <section className="rounded-cc-card border border-cc-line bg-cc-surface p-[15px]">
          <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
            CONTEXT
          </h2>
          <p className="mt-2 text-[12px] leading-[1.55] text-cc-t-table">
            {meeting.company} · {meeting.service} · {meeting.platform}
          </p>
          <p className="mt-1 text-[11.5px] text-cc-t3">
            Attendees: {meeting.attendees.join(", ")}
          </p>
          <Link
            href={`/dashboard/leads/${meeting.leadId}`}
            className="mt-1 inline-block text-[11.5px] font-semibold text-cc-green-ink hover:underline"
          >
            Open lead workspace
          </Link>

          <h3 className="mt-4 font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
            AGENDA · {coveredCount}/{AGENDA.length} COVERED
          </h3>
          <ul className="mt-2 space-y-0.5">
            {AGENDA.map((item) => (
              <li key={item}>
                <label className="flex cursor-pointer items-center gap-2 rounded-cc-control px-1 py-0.5 text-[11.5px] text-cc-t2 hover:bg-cc-soft">
                  <input
                    type="checkbox"
                    checked={Boolean(covered[item])}
                    onChange={(event) =>
                      setCovered((prev) => ({ ...prev, [item]: event.target.checked }))
                    }
                    className="h-3.5 w-3.5 accent-cc-green"
                  />
                  <span className={covered[item] ? "text-cc-green-ink line-through" : undefined}>
                    {item}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10.5px] text-cc-t3">Local only — nothing here is saved.</p>

          <h3 className="mt-4 font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
            PINNED QUESTIONS
          </h3>
          <p className="mt-1.5 rounded-cc-control bg-cc-soft px-[9px] py-[7px] text-[11.5px] leading-[1.5] text-cc-t-table">
            “{PINNED}”
          </p>
        </section>

        {/* M-D03 500-511: the transcript column. Demo has no provider, so there is no
            live transcript and nothing is being captured — an honest empty state stands
            in place of the canonical live feed. */}
        <section className="flex flex-col rounded-cc-card border border-cc-line bg-cc-surface">
          <div className="flex items-center gap-2.5 border-b border-cc-line px-[15px] py-2.5">
            <h2 className="text-[12.5px] font-semibold text-cc-ink-strong">Transcript</h2>
            <span
              className="rounded-[4px] px-1.5 py-0.5 font-cc-mono text-[9.5px] font-semibold"
              style={{ color: TONE_INK.amber }}
            >
              NOT TRANSCRIBING
            </span>
          </div>
          <div className="flex-1 px-[15px] py-4">
            <RouteEmpty
              title="No live transcript"
              hint="Transcription requires a connected meeting provider. Nothing is being recorded or transcribed in demo mode."
            />
          </div>
        </section>

        {/* M-D03 512-521: the copilot. Tabs switch locally; every panel is REQUIRES
            PROVIDER because AI assistance needs a connected provider. Nothing here infers
            or asserts a fact. */}
        <section className="flex flex-col rounded-cc-card border border-cc-line bg-cc-surface">
          <div role="tablist" aria-label="Copilot" className="flex border-b border-cc-line">
            {COPILOT_TABS.map((name) => {
              const selected = tab === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  id={`copilot-tab-${name}`}
                  aria-selected={selected}
                  aria-controls={`copilot-panel-${name}`}
                  onClick={() => setTab(name)}
                  className={
                    "px-2.5 py-2.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-cc-green-border " +
                    (selected
                      ? "border-b-2 border-cc-green text-cc-ink-strong"
                      : "text-cc-t3 hover:text-cc-ink")
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
          <div
            role="tabpanel"
            id={`copilot-panel-${tab}`}
            aria-labelledby={`copilot-tab-${tab}`}
            className="flex-1 px-3.5 py-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
                {tab.toUpperCase()}
              </span>
              <span
                className="rounded-[4px] px-1.5 py-0.5 font-cc-mono text-[9px] font-semibold"
                style={{ color: TONE_INK.amber }}
              >
                REQUIRES PROVIDER
              </span>
            </div>
            <p className="mt-2 text-[11.5px] leading-[1.5] text-cc-t3">
              AI assistance needs a connected provider and an active, consented session.
              Inferred content is never shown as fact, and nothing is generated in demo mode.
            </p>
          </div>
        </section>
      </div>

      <p
        id={providerNoteId}
        className="border-t border-cc-line px-4 py-3 text-[11.5px] leading-[1.5] text-cc-t3"
      >
        No meeting provider is connected in demo mode. Recording and transcription cannot
        start without a real provider and explicit participant consent — so the session
        controls are disabled and nothing on this screen is being captured, stored, or sent.
      </p>
    </div>
  );
}
