"use client";
// M-D14 · TRANSCRIPT DETAIL + M-D15 · LEAD MEETING HISTORY (Command Center Final.dc.html
// lines 595-616), as a full-page, deep-linkable route. The canonical M-D14 detail panel —
// retention/redaction/download banner, speaker + marker filters, local search, timestamped
// speaker-attributed entries with marker badges and jump-to-time controls — held to the
// honest demo posture of the whole Command Center:
//
//   - No provider is connected in demo mode, so nothing here was recorded, transcribed, or
//     analysed from a real call. Meetings whose record has no ready transcript show an
//     honest "transcript unavailable · requires provider" state, never a fabricated feed.
//   - Where the canonical frame draws a ready transcript, a deterministic, read-only SAMPLE
//     fixture stands in, clearly labelled as demo sample content. It is never described as
//     generated from a real recorded meeting.
//   - Search and speaker filtering are safe local, deterministic interactions. Every
//     provider-dependent action (export, download source audio, save redactions) is
//     disabled with a canonical unavailable reason. No audio player, waveform, timer, or
//     download link to a nonexistent file is rendered.
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DemoState, Meeting, Tone } from "../../../../../lib/demo/types";
import { useDemoQuery } from "../../../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../../../components/demo/tone";
import { RouteEmpty, RouteError, RouteLoading } from "../../../../../components/demo/route-states";

type Marker = "REQUIREMENT" | "CONFIRMED" | "OBJECTION";
export type TranscriptEntry = {
  time: string;
  speaker: string;
  role: "client" | "us";
  text: string;
  marker: Marker | null;
};

// M-D14 590-593 fixture (dc.html transcript[]). Deterministic, fictional, read-only — a
// clearly-marked SAMPLE, not output from any real recorded call.
export const SAMPLE_TRANSCRIPT: readonly TranscriptEntry[] = [
  { time: "00:14:22", speaker: "Priyanka Rao", role: "client", text: "The dispatch team re-keys every work order into three systems — that’s where most errors come from.", marker: "REQUIREMENT" },
  { time: "00:14:58", speaker: "Marc Rivera", role: "us", text: "How many orders a day are we talking about, roughly?", marker: null },
  { time: "00:15:06", speaker: "Priyanka Rao", role: "client", text: "Around 220 on weekdays, spikes to 400 in storm season.", marker: "CONFIRMED" },
  { time: "00:16:40", speaker: "Priyanka Rao", role: "client", text: "Honestly, our concern is ERP integration — the last vendor never got it stable.", marker: "OBJECTION" },
  { time: "00:17:12", speaker: "Marc Rivera", role: "us", text: "Understood. We’d propose a read-only phase first, then controlled writes behind approvals.", marker: null },
];

const MARKER_TONE: Record<Marker, Tone> = {
  REQUIREMENT: "green",
  CONFIRMED: "blue",
  OBJECTION: "amber",
};

/** Whether a meeting has a ready transcript. Demo records carry a status string
 *  ("Ready · 48 min" vs "—"); only ready records show the M-D14 detail. */
export function hasReadyTranscript(meeting: Meeting): boolean {
  return /ready/i.test(meeting.transcript);
}

/** Not-found logic, isolated so it is unit-testable in the node test env. */
export function findMeeting(state: DemoState, meetingId: string): Meeting | null {
  return state.meetings.find((m) => m.id === meetingId) ?? null;
}

/** Local, deterministic transcript search + speaker filter — pure, so the exact filtering
 *  behaviour (including the no-results case) is unit-testable without a DOM. Speaker ""
 *  means all speakers; query is a case-insensitive substring over the entry text. */
export function filterTranscript(
  entries: readonly TranscriptEntry[],
  query: string,
  speaker: string,
): TranscriptEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((e) => {
    if (speaker && e.speaker !== speaker) return false;
    if (q && !e.text.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function TranscriptView({ meetingId }: { meetingId: string }) {
  const { state, status, error, retry } = useDemoQuery();
  const meeting = findMeeting(state, meetingId);

  const back = (
    <Link
      href={`/dashboard/meetings/${meetingId}/review`}
      className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to review
    </Link>
  );

  if (status === "loading") {
    return (
      <div className="cc-scope mx-auto max-w-4xl font-cc-body">
        {back}
        <RouteLoading label="meeting transcript" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="cc-scope mx-auto max-w-4xl font-cc-body">
        {back}
        <RouteError label="meeting transcript" error={error ?? "Unknown error"} onRetry={retry} />
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
      <TranscriptContent meeting={meeting} />
    </div>
  );
}

// Pure presentation — the only local state is non-persistent UI (search query, speaker
// filter, selected excerpt). No hooks that touch window/store, so it renders under
// react-dom/server in the node test env and its markup can be asserted directly.
export function TranscriptContent({ meeting }: { meeting: Meeting }) {
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const noteId = useId();
  const searchId = useId();

  const ready = hasReadyTranscript(meeting);
  const speakers = useMemo(
    () => [...new Set(SAMPLE_TRANSCRIPT.map((e) => e.speaker))],
    [],
  );
  const markerCount = SAMPLE_TRANSCRIPT.filter((e) => e.marker).length;
  const filtered = useMemo(() => filterTranscript(SAMPLE_TRANSCRIPT, query, speaker), [query, speaker]);

  // No ready transcript for this record: honest provider-required state, never a fake feed.
  if (!ready) {
    return (
      <div className="overflow-hidden rounded-cc-card border border-cc-line-strong bg-cc-surface shadow-[0_14px_40px_rgba(20,26,30,.08)]">
        <div className="border-b border-cc-line px-[18px] py-[13px]">
          <h1 className="text-[15px] font-semibold text-cc-ink-strong">
            Transcript — {meeting.name} · {meeting.company}
          </h1>
          <p className="text-[11.5px] text-cc-t3">{meeting.service} · {meeting.when}</p>
        </div>
        <div className="px-4 py-6">
          <RouteEmpty
            title="Transcript unavailable"
            hint="No transcript exists for this meeting. Recording and transcription require a connected provider and explicit consent — nothing was recorded in demo mode."
          />
        </div>
        <p id={noteId} className="border-t border-cc-line px-4 py-3 text-[11.5px] leading-[1.5] text-cc-t3">
          No meeting provider is connected in demo mode. NOT RECORDING · NOT TRANSCRIBING — there
          is no captured audio or transcript to show, and nothing here is generated.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-cc-card border border-cc-line-strong bg-cc-surface shadow-[0_14px_40px_rgba(20,26,30,.08)]">
      {/* M-D14 599: detail header + retention / redaction / download governance line. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-cc-line px-[18px] py-[13px]">
        <div className="mr-auto">
          <h1 className="text-[15px] font-semibold text-cc-ink-strong">
            Transcript — detail · {meeting.name}
          </h1>
          <p className="text-[11.5px] text-cc-t3">{meeting.company} · {meeting.service} · {meeting.when}</p>
        </div>
        <span className="font-cc-mono text-[9px] font-semibold tracking-[.06em] text-cc-t3">
          RETENTION 12 MO · REDACTION AVAILABLE · DOWNLOAD: ADMIN ONLY
        </span>
      </div>

      {/* Honest sample banner — this content is a deterministic demo fixture, not a real call. */}
      <p
        className="border-b border-cc-line px-[18px] py-2 text-[11px] leading-[1.5]"
        style={{ color: TONE_INK.amber }}
      >
        Sample transcript — a deterministic demo fixture. It was not generated from a real
        recorded or transcribed meeting; no provider is connected in demo mode.
      </p>

      {/* M-D14 600-601: search + speaker/marker filters. All local and deterministic. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cc-line px-[18px] py-2.5">
        <label htmlFor={searchId} className="text-[11px] font-medium text-cc-t3">
          Search transcript
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search text…"
          className="w-40 rounded-cc-control border border-cc-line px-2 py-1 text-[12px] text-cc-ink outline-none focus:border-cc-green-border"
        />
        {query.trim() !== "" && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[11px] font-semibold text-cc-t3 outline-none hover:text-cc-ink focus-visible:ring-2 focus-visible:ring-cc-green-border"
          >
            Clear search
          </button>
        )}
        <span className="mr-2 text-[11px] text-cc-t3" aria-live="polite">
          {filtered.length} of {SAMPLE_TRANSCRIPT.length} lines
        </span>

        <span className="text-cc-line" aria-hidden>|</span>
        {[{ label: "All speakers", value: "" }, ...speakers.map((s) => ({ label: `${s} only`, value: s }))].map((chip) => {
          const active = speaker === chip.value;
          return (
            <button
              key={chip.value || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => setSpeaker(chip.value)}
              className={
                "rounded-cc-control px-2.5 py-1 text-[10.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cc-green-border " +
                (active
                  ? "bg-cc-ink-strong text-white"
                  : "border border-cc-line text-cc-t2 hover:text-cc-ink")
              }
            >
              {chip.label}
            </button>
          );
        })}
        <span className="rounded-cc-control border border-cc-line px-2.5 py-1 font-cc-mono text-[10px] font-semibold text-cc-t3">
          Markers · {markerCount}
        </span>
      </div>

      {/* M-D14 602-605: the timestamped, speaker-attributed entries. */}
      {filtered.length === 0 ? (
        <div className="px-4 py-6">
          <RouteEmpty
            title="No matching lines"
            hint="No transcript lines match your search. Clear the search to see the full sample transcript."
          />
        </div>
      ) : (
        <ul className="divide-y divide-cc-line">
          {filtered.map((entry) => {
            const isSelected = selected === entry.time;
            return (
              <li
                key={entry.time}
                aria-current={isSelected ? "true" : undefined}
                className={"px-[18px] py-3 " + (isSelected ? "bg-cc-soft" : "")}
              >
                <article className="flex gap-3">
                  <span className="flex-shrink-0 pt-0.5 font-cc-mono text-[10px] text-cc-t3">
                    <span className="sr-only">Timestamp </span>
                    {entry.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11.5px] font-bold text-cc-ink-strong">{entry.speaker}</span>
                      {entry.marker && (
                        <span
                          className="rounded-[3px] px-1.5 py-0.5 font-cc-mono text-[8px] font-semibold"
                          style={{ color: TONE_INK[MARKER_TONE[entry.marker]] }}
                        >
                          {entry.marker}
                        </span>
                      )}
                      {isSelected && <span className="sr-only">(selected excerpt)</span>}
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.55] text-cc-t-table">
                      <Highlight text={entry.text} query={query} />
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelected(isSelected ? null : entry.time)}
                      aria-pressed={isSelected}
                      className="mt-1.5 text-[10.5px] font-semibold text-cc-green-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-cc-green-border"
                    >
                      {isSelected ? "Clear selection" : `Jump to ${entry.time}`}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {/* M-D15 review linkage + provider-dependent actions (all disabled in demo). */}
      <div className="flex flex-wrap items-center gap-2 border-t border-cc-line px-4 py-3">
        <Link
          href={`/dashboard/meetings/${meeting.id}/review`}
          className="rounded-cc-control border border-cc-line px-3 py-1.5 text-[12px] font-semibold text-cc-t2 outline-none hover:text-cc-ink focus-visible:ring-2 focus-visible:ring-cc-green-border"
        >
          Back to review
        </Link>
        <span className="mr-auto" />
        <DisabledAction label="Export transcript" noteId={noteId} />
        <DisabledAction label="Download source audio" noteId={noteId} />
        <DisabledAction label="Save redactions" noteId={noteId} />
      </div>

      <p id={noteId} className="border-t border-cc-line px-4 py-3 text-[11.5px] leading-[1.5] text-cc-t3">
        No meeting provider is connected in demo mode, so nothing here was recorded, transcribed,
        or analysed. Export, source-audio download, and redaction changes require a real provider,
        an analysed call, and admin permission — so those actions are disabled and nothing is sent,
        downloaded, or persisted.
      </p>
    </div>
  );
}

// Local search highlight — wraps case-insensitive matches in <mark>. Pure, no state.
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded-[2px] bg-cc-amber-tint px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// Provider-dependent actions render disabled with a textual reason via aria-describedby.
function DisabledAction({ label, noteId }: { label: string; noteId: string }) {
  return (
    <button
      type="button"
      disabled
      aria-describedby={noteId}
      className="cursor-not-allowed rounded-cc-control border border-cc-line px-3 py-1.5 text-[12px] font-semibold text-cc-t3"
    >
      {label}
    </button>
  );
}
