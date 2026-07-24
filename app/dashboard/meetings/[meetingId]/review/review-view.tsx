"use client";
// M-D12 · MEETING REVIEW SUMMARY + M-D13 · CRM RECOMMENDATIONS (Command Center
// Final.dc.html lines 574-616), as a full-page, deep-linkable route. Same canonical
// review modules — the AI summary / key moments, the requirements + solution recap,
// and the CRM recommendation review — held to the honest demo posture the whole
// Command Center follows:
//
//   - No provider is connected in demo mode, so nothing on this screen was recorded,
//     transcribed, analysed, or synced. The summary, requirement count and CRM
//     recommendation count are surfaced verbatim from the deterministic demo record;
//     where the canonical frame would show provider-generated prose (executive
//     summary body, key moments, the proposed solution, AI activity) the screen shows
//     an honest REQUIRES PROVIDER empty state rather than inventing content.
//   - Nothing is persisted. Every review mutation the frame offers (approve summary,
//     edit follow-up, create proposal, and — the M-D13 headline — "Review and Apply
//     Updates") is DISABLED with a canonical unavailable reason. The verbatim M-D13
//     guard ("Nothing is applied to the CRM until you Review and Apply Updates") is
//     honoured: nothing is applied because nothing can be, and the screen says so.
//   - The full transcript lives at a SEPARATE route (/transcript, M-D14/M-D15). The
//     Transcript tab links there when the record has a ready transcript and keeps the
//     open control disabled when it has none — it never fabricates a transcript feed here.
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DemoState, Meeting } from "../../../../../lib/demo/types";
import { useDemoQuery } from "../../../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../../../components/demo/tone";
import { RouteEmpty, RouteError, RouteLoading } from "../../../../../components/demo/route-states";

// M-D12 575: the review tab strip. Every tab is a safe local switch; the tabs whose
// canonical content is provider-generated report REQUIRES PROVIDER instead of prose.
const REVIEW_TABS = ["Summary", "Transcript", "Requirements", "Solution", "Actions", "AI Activity"] as const;
type ReviewTab = (typeof REVIEW_TABS)[number];

/** Not-found logic, isolated so it is unit-testable in the node test env. */
export function findMeeting(state: DemoState, meetingId: string): Meeting | null {
  return state.meetings.find((m) => m.id === meetingId) ?? null;
}

export function ReviewView({ meetingId }: { meetingId: string }) {
  const { state, status, error, retry } = useDemoQuery();
  const meeting = findMeeting(state, meetingId);

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
      <div className="cc-scope mx-auto max-w-6xl font-cc-body">
        {back}
        <RouteLoading label="meeting review" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="cc-scope mx-auto max-w-6xl font-cc-body">
        {back}
        <RouteError label="meeting review" error={error ?? "Unknown error"} onRetry={retry} />
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
      <ReviewContent meeting={meeting} />
    </div>
  );
}

// Pure presentation — the only local state is the non-persistent active tab. No hooks
// that touch window/store, so it renders under react-dom/server in the node test env
// and its markup can be asserted directly.
export function ReviewContent({ meeting }: { meeting: Meeting }) {
  const [tab, setTab] = useState<ReviewTab>("Summary");
  const noteId = useId();

  return (
    <div className="overflow-hidden rounded-cc-card border border-cc-line-strong bg-cc-surface shadow-[0_14px_40px_rgba(20,26,30,.08)]">
      {/* M-D12 574: header — who and when, the service line, and the meeting's real
          review status surfaced verbatim (never inferred). */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-cc-line px-[18px] py-[13px]">
        <div className="mr-auto">
          <h1 className="text-[15px] font-semibold text-cc-ink-strong">
            Review — {meeting.name} · {meeting.company}
          </h1>
          <p className="text-[11.5px] text-cc-t3">
            {meeting.service} · {meeting.when} · {meeting.platform}
          </p>
        </div>
        <span
          className="rounded-[4px] px-1.5 py-0.5 font-cc-mono text-[9.5px] font-semibold"
          style={{ color: TONE_INK.amber }}
          aria-label={`Review status: ${meeting.state}`}
        >
          {meeting.state}
        </span>
      </div>

      {/* M-D12 575: the review tab strip. */}
      <div role="tablist" aria-label="Meeting review" className="flex flex-wrap border-b border-cc-line px-2">
        {REVIEW_TABS.map((name) => {
          const selected = tab === name;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              id={`review-tab-${name}`}
              aria-selected={selected}
              aria-controls={`review-panel-${name}`}
              onClick={() => setTab(name)}
              className={
                "px-3 py-2.5 text-[11.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-cc-green-border " +
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
        id={`review-panel-${tab}`}
        aria-labelledby={`review-tab-${tab}`}
        className="p-4"
      >
        {tab === "Summary" && <SummaryPanel meeting={meeting} noteId={noteId} />}
        {tab === "Transcript" && <TranscriptPanel meeting={meeting} />}
        {tab === "Requirements" && <CountPanel meeting={meeting} />}
        {tab === "Solution" && (
          <RouteEmpty
            title="Proposed solution requires a provider"
            hint="The solution recap is generated from the analysed call. No provider is connected in demo mode, so there is nothing to summarise here yet."
          />
        )}
        {tab === "Actions" && <ActionsPanel noteId={noteId} />}
        {tab === "AI Activity" && (
          <RouteEmpty
            title="AI activity requires a provider"
            hint="The activity log records what the AI provider did with the call. No provider is connected in demo mode, so there is no activity to show."
          />
        )}
      </div>

      {/* Shared provider / mutation note referenced by every disabled control below. */}
      <p
        id={noteId}
        className="border-t border-cc-line px-4 py-3 text-[11.5px] leading-[1.5] text-cc-t3"
      >
        No meeting provider is connected in demo mode, so nothing on this screen was
        recorded, transcribed, analysed, or synced. Every review action is disabled and
        nothing is applied, sent, or persisted — reviewing and applying updates requires a
        real provider and an analysed call.
      </p>
    </div>
  );
}

// M-D12 576-590: EXECUTIVE SUMMARY + KEY MOMENTS. The summary prose and key moments are
// provider-generated, so where the record has no provider output we show an honest empty
// state; the review counts are surfaced verbatim. All three review actions are disabled.
function SummaryPanel({ meeting, noteId }: { meeting: Meeting; noteId: string }) {
  const hasSummary = meeting.ai.trim() !== "" && meeting.ai.trim() !== "—";
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
      <section>
        <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
          EXECUTIVE SUMMARY
        </h2>
        {hasSummary ? (
          <p className="mt-2 text-[12.5px] leading-[1.6] text-cc-t-table">{meeting.ai}</p>
        ) : (
          <div className="mt-2">
            <RouteEmpty
              title="No summary yet"
              hint="The executive summary is written from the analysed call. No provider is connected in demo mode, so there is nothing to summarise."
            />
          </div>
        )}

        <h3 className="mt-4 font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
          KEY MOMENTS
        </h3>
        <div className="mt-2">
          <RouteEmpty
            title="Key moments require a provider"
            hint="Key moments are extracted from the transcript. Nothing was recorded or transcribed in demo mode."
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <DisabledAction label="Approve summary" noteId={noteId} solid />
          <DisabledAction label="Edit follow-up draft" noteId={noteId} />
          <DisabledAction label="Create proposal" noteId={noteId} />
        </div>
      </section>

      {/* M-D13 591-604: CRM RECOMMENDATIONS. The canonical guard is honoured verbatim. */}
      <aside className="rounded-cc-card border border-cc-line bg-cc-soft p-[15px]">
        <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
          CRM RECOMMENDATIONS
        </h2>
        <p className="mt-2 text-[12px] leading-[1.55] text-cc-t-table">{meeting.crm}</p>
        <p
          className="mt-2 rounded-cc-control border px-[9px] py-[7px] text-[11px] leading-[1.5]"
          style={{
            color: TONE_INK.amber,
            backgroundColor: "var(--cc-amber-tint)",
            borderColor: "var(--cc-amber-border)",
          }}
        >
          Nothing is applied to the CRM until you Review and Apply Updates.
        </p>
        <div className="mt-2">
          <DisabledAction label="Review and Apply Updates" noteId={noteId} solid />
        </div>
      </aside>
    </div>
  );
}

// The Transcript TAB is a pointer, not the transcript. The full transcript is a separate
// canonical route (M-D14/M-D15). The full transcript opens there when the record has a
// ready transcript; a record with none keeps the open control disabled and never dead-links.
export function TranscriptPanel({ meeting }: { meeting: Meeting }) {
  const hasTranscript = meeting.transcript.trim() !== "" && meeting.transcript.trim() !== "—";
  return (
    <div>
      <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
        TRANSCRIPT
      </h2>
      <p className="mt-2 text-[12px] leading-[1.55] text-cc-t-table">
        {hasTranscript ? meeting.transcript : "No transcript — nothing was recorded in demo mode."}
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.5] text-cc-t3">
        The full transcript opens in its own detail route. No provider is connected in demo
        mode, so a record with a ready transcript shows a clearly-marked sample; a record with
        none has nothing to open.
      </p>
      {hasTranscript ? (
        <Link
          href={`/dashboard/meetings/${meeting.id}/transcript`}
          className="mt-3 inline-block rounded-cc-control border border-cc-line px-3 py-1.5 text-[12px] font-semibold text-cc-green-ink outline-none hover:bg-cc-soft focus-visible:ring-2 focus-visible:ring-cc-green-border"
        >
          Open full transcript
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-3 cursor-not-allowed rounded-cc-control border border-cc-line px-3 py-1.5 text-[12px] font-semibold text-cc-t3"
        >
          Open full transcript
        </button>
      )}
    </div>
  );
}

// M-D12 requirements recap — a count surfaced verbatim from the record, no fabricated list.
function CountPanel({ meeting }: { meeting: Meeting }) {
  const hasRequirements = meeting.ai.trim() !== "" && meeting.ai.trim() !== "—";
  return (
    <div>
      <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
        REQUIREMENTS
      </h2>
      {hasRequirements ? (
        <p className="mt-2 text-[12.5px] leading-[1.6] text-cc-t-table">{meeting.ai}</p>
      ) : (
        <div className="mt-2">
          <RouteEmpty
            title="No requirements captured"
            hint="Requirements are extracted from the analysed call. No provider is connected in demo mode."
          />
        </div>
      )}
    </div>
  );
}

// M-D12 action items — provider-generated, so an honest empty state plus a disabled create.
function ActionsPanel({ noteId }: { noteId: string }) {
  return (
    <div>
      <h2 className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
        ACTION ITEMS
      </h2>
      <div className="mt-2">
        <RouteEmpty
          title="Action items require a provider"
          hint="Action items are drafted from the analysed call. No provider is connected in demo mode, so there are none to assign yet."
        />
      </div>
      <div className="mt-3">
        <DisabledAction label="Create follow-up" noteId={noteId} solid />
      </div>
    </div>
  );
}

// Every provider-dependent review action renders as a disabled button that names its
// reason through aria-describedby — no color-only signal, and the reason is textual.
function DisabledAction({ label, noteId, solid }: { label: string; noteId: string; solid?: boolean }) {
  return (
    <button
      type="button"
      disabled
      aria-describedby={noteId}
      className={
        "cursor-not-allowed rounded-cc-control px-3 py-1.5 text-[12px] font-semibold " +
        (solid
          ? "border border-cc-green-border bg-cc-green-tint text-cc-green-ink opacity-70"
          : "border border-cc-line text-cc-t3")
      }
    >
      {label}
    </button>
  );
}
