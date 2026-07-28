"use client";
// M-D02 · PRE-CALL PREPARATION (Command Center Final.dc.html lines 454-476), as a
// full-page, deep-linkable route rather than the in-context dialog the Meetings
// directory opens. Same canonical modules, same honest provider posture:
//
//   - No provider is connected in demo mode. The readiness panel reports REQUIRES
//     PROVIDER exactly as the frame draws it (M-D02 466-468); nothing on this screen
//     is recording or transcribing, and it does not pretend otherwise. The live
//     "CONSENT RECORDED · TRANSCRIBING" / "REC ●" markers belong to M-D03 (live) and
//     are deliberately absent here.
//   - The consent message itself is APPROVED copy (M-D02 469 / CANON 1480); consent
//     is not *given* here — recording/transcription cannot activate from preparation.
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DemoState, Meeting, Tone } from "../../../../../lib/demo/types";
import { useDemoQuery } from "../../../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../../../components/demo/tone";
import { RouteEmpty, RouteError, RouteLoading } from "../../../../../components/demo/route-states";

// M-D02 466-470: the readiness list. Everything needing an external provider says
// so; the two that do not are genuinely satisfied in demo mode. Consent message is
// APPROVED copy — not an active recording state.
const READINESS: readonly { label: string; status: string; tone: Tone }[] = [
  { label: "Meeting integration", status: "REQUIRES PROVIDER", tone: "amber" },
  { label: "Transcription", status: "REQUIRES PROVIDER", tone: "amber" },
  { label: "AI provider · model", status: "REQUIRES PROVIDER", tone: "amber" },
  { label: "Consent message", status: "APPROVED", tone: "green" },
  { label: "Microphone", status: "OK", tone: "green" },
];

// M-D02 459-461.
const PINNED_QUESTIONS: readonly string[] = [
  "Problem — Which listing workflows break down first during peak season?",
  "Systems — What runs the current portal, and who maintains it?",
  "Decision — Who signs off, and by when do you want a decision?",
];

/** Not-found logic, isolated so it is unit-testable in the node test env: an unknown
 *  id resolves to null and the screen shows the canonical not-found state. */
export function findMeeting(state: DemoState, meetingId: string): Meeting | null {
  return state.meetings.find((m) => m.id === meetingId) ?? null;
}

export function PrepareView({ meetingId }: { meetingId: string }) {
  const { state, status, error, retry } = useDemoQuery();
  const meeting = useMemo(() => findMeeting(state, meetingId), [state, meetingId]);
  const [questions, setQuestions] = useState<string[]>([...PINNED_QUESTIONS]);
  const [draft, setDraft] = useState("");

  const back = (
    <Link
      href="/dashboard/meetings"
      className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to meetings
    </Link>
  );

  if (status === "loading") {
    return (
      <div className="cc-scope mx-auto max-w-4xl font-cc-body">
        {back}
        <RouteLoading label="meeting preparation" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="cc-scope mx-auto max-w-4xl font-cc-body">
        {back}
        <RouteError label="meeting preparation" error={error ?? "Unknown error"} onRetry={retry} />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="cc-scope mx-auto max-w-4xl font-cc-body">
        {back}
        <RouteEmpty
          title="Meeting not found"
          hint="This meeting is not in your directory, or the link is out of date."
        />
      </div>
    );
  }

  return (
    <div className="cc-scope mx-auto max-w-4xl font-cc-body">
      {back}
      <PrepareContent
        meeting={meeting}
        questions={questions}
        draft={draft}
        onDraftChange={setDraft}
        onAddQuestion={() => {
          const q = draft.trim();
          if (!q) return;
          setQuestions((list) => [...list, q]);
          setDraft("");
        }}
        onDismissQuestion={(q) => setQuestions((list) => list.filter((item) => item !== q))}
      />
    </div>
  );
}

// Pure presentation — no hooks, no window, no store — so it renders under
// react-dom/server in the node test env and its markup can be asserted directly.
export function PrepareContent({
  meeting,
  questions,
  draft,
  onDraftChange,
  onAddQuestion,
  onDismissQuestion,
}: {
  meeting: Meeting;
  questions: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAddQuestion: () => void;
  onDismissQuestion: (question: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-cc-card border border-cc-line-strong bg-cc-surface shadow-[0_14px_40px_rgba(20,26,30,.08)]">
      {/* M-D02 455: header — who and when, then the goal / company / service line. */}
      <div className="border-b border-cc-line px-[18px] py-[13px]">
        <h1 className="text-[15px] font-semibold text-cc-ink-strong">
          Prepare — {meeting.name} · {meeting.when}
        </h1>
        <p className="text-[11.5px] text-cc-t3">
          Goal: discovery · {meeting.company} · {meeting.service}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* M-D02 457-463: PINNED QUESTIONS, editable but non-persistent. */}
        <section className="border-b border-cc-line px-4 py-[13px] md:border-b-0 md:border-r">
          <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
            PINNED QUESTIONS · {questions.length}
          </h2>
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
                  onClick={() => onDismissQuestion(question)}
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
              onAddQuestion();
            }}
          >
            <label className="flex-1 text-[11px] font-medium text-cc-t3">
              Add question
              <input
                type="text"
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                className="mt-1 block w-full rounded-cc-control border border-cc-line px-2 py-1 text-[12px] text-cc-ink outline-none focus:border-cc-green-border"
              />
            </label>
            {/* Disabled while the field is empty, with the reason announced:
                previously it stayed enabled and silently did nothing. */}
            <button
              type="submit"
              disabled={draft.trim() === ""}
              aria-describedby="prepare-add-question-reason"
              className="mb-1 rounded-cc-control border border-cc-green-border bg-cc-green-tint px-3 py-1.5 text-[12px] font-semibold text-cc-green-ink disabled:cursor-not-allowed disabled:border-cc-line disabled:bg-cc-secondary disabled:text-cc-t3"
            >
              Add
            </button>
            {draft.trim() === "" ? (
              <span id="prepare-add-question-reason" className="sr-only">
                Type a question to add it.
              </span>
            ) : null}
          </form>
        </section>

        {/* M-D02 465-473: READINESS, LEAD CONTEXT, and the transition to the live workspace. */}
        <section className="px-4 py-[13px]">
          <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
            READINESS
          </h2>
          <ul className="mt-1">
            {READINESS.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between py-[5px] text-[11.5px] text-cc-t2"
              >
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

          <div className="mt-2 border-t border-cc-line pt-2">
            <h3 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
              LEAD CONTEXT
            </h3>
            <p className="mt-1 text-[11.5px] leading-[1.5] text-cc-t3">
              {meeting.company} · {meeting.service} · {meeting.platform}
            </p>
            <Link
              href={`/dashboard/leads/${meeting.leadId}`}
              className="mt-1 inline-block text-[11.5px] font-semibold text-cc-green-ink hover:underline"
            >
              Open lead workspace
            </Link>
          </div>

          {/* M-D02 472: "Open live workspace" — the canonical prepare → live transition
              (M-D03). Opening the workspace never starts recording or transcription on its
              own; the live screen stays provider- and consent-gated, so this is a safe,
              non-destructive navigation. */}
          <Link
            href={`/dashboard/meetings/${meeting.id}/live`}
            aria-describedby="prepare-provider-note"
            className="mt-3 block w-full rounded-cc-control bg-cc-green px-3 py-1.5 text-center text-[12.5px] font-semibold text-white outline-none transition-transform focus-visible:ring-2 focus-visible:ring-cc-green-border active:scale-[.99]"
          >
            Open live workspace
          </Link>
          <p
            id="prepare-provider-note"
            className="mt-2 border-t border-cc-line pt-2 text-[11.5px] leading-[1.5] text-cc-t3"
          >
            No meeting provider is connected in demo mode, so three of the five readiness
            checks require an external provider and there is nothing to record or transcribe
            yet. Recording and transcription never start from preparation — they require
            explicit consent in the live workspace.
          </p>
        </section>
      </div>
    </div>
  );
}
