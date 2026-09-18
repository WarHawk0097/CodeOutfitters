"use client";

// RecordingEventsPanel — the "Recording Events" status box. Renders ONLY the derived
// snapshot handed to it (lib/meetings/capture/events.ts): a row appears because the
// corresponding capture operation actually happened, and the phase chip exists because
// a persisted artifact state says so — never because a client timer claims it.
//
// Spinner behavior: only rows whose status is "active" animate. Completed rows get a
// check, queued rows a subtle pending dot, failures a warning/error icon. The elapsed
// timer is display-only chrome around the artifact's persisted created_at; it is never
// treated as proof that recording is happening (the phase chip is).
//
// Reduced motion: honored three ways, matching the app's existing resolver
// (components/motion-mode-provider.tsx): ?motion=reduced sets html[data-motion=reduced]
// whose CSS kills animations; prefers-reduced-motion has a baseline CSS guard; and the
// component itself swaps the animated spinner for a static "in progress" glyph via
// matchMedia so no animation is authored at all when reduced.
import { useEffect, useState } from "react";
import { Check, CircleDashed, LoaderCircle, OctagonAlert, TriangleAlert } from "lucide-react";
import {
  RECORDING_PHASE_LABEL,
  type CaptureEventStatus,
  type RecordingEvent,
  type RecordingEventsSnapshot,
} from "@/lib/meetings/capture/events";
import { useCommandCenterConfig } from "@/components/command-center/mode-provider";
import { useCaptureEvents } from "@/lib/meetings/capture/use-capture-events";
import { TONE_INK } from "@/components/demo/tone";
import type { Tone } from "@/lib/demo/types";

const HEADING = "font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header";

const PHASE_TONE: Record<RecordingEventsSnapshot["phase"], Tone> = {
  not_started: "neutral",
  preparing: "amber",
  recording: "green",
  paused: "amber",
  processing: "blue",
  completed: "green",
  failed: "red",
};

// Which phase keeps the panel polling live (mirrors the hook's terminal set).
const LIVE_PHASES = new Set(["preparing", "recording", "paused", "processing"]);

function formatElapsed(startedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function RowIcon({ status, reduced }: { status: CaptureEventStatus; reduced: boolean }) {
  const shared = "h-3.5 w-3.5 flex-shrink-0";
  switch (status) {
    case "success":
      return <Check className={`${shared} text-cc-green-ink`} aria-hidden />;
    case "active":
      // The ONLY animated icon in the panel; becomes a static glyph under reduced motion.
      return reduced ? (
        <LoaderCircle className={`${shared} text-cc-blue-ink`} aria-hidden />
      ) : (
        <LoaderCircle className={`${shared} animate-spin text-cc-blue-ink`} aria-hidden />
      );
    case "pending":
      return <CircleDashed className={`${shared} text-cc-t4`} aria-hidden />;
    case "warning":
      return <TriangleAlert className={`${shared}`} style={{ color: TONE_INK.amber }} aria-hidden />;
    case "error":
      return <OctagonAlert className={`${shared}`} style={{ color: TONE_INK.red }} aria-hidden />;
  }
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function EventRow({ event, reduced }: { event: RecordingEvent; reduced: boolean }) {
  const time = formatTime(event.timestamp);
  return (
    <li className="flex items-start gap-2 py-[3px] text-[11.5px] leading-[1.5]">
      <span className="mt-[1px]">
        <RowIcon status={event.status} reduced={reduced} />
      </span>
      <span className={event.status === "error" ? "font-medium text-cc-red-ink" : "text-cc-t2"}>
        {event.label}
        {event.description ? <span className="text-cc-t4"> — {event.description}</span> : null}
      </span>
      {time ? <span className="ml-auto font-cc-mono text-[9.5px] text-cc-t4">{time}</span> : null}
    </li>
  );
}

const VISIBLE_EVENT_CAP = 6;

export function RecordingEventsPanel({ meetingId }: { meetingId: string }) {
  const { live } = useCommandCenterConfig();
  const { snapshot, status, error, refresh } = useCaptureEvents(live, meetingId);
  const reduced = useReducedMotion();
  // Ticking clock for the elapsed readout. It is chrome around the persisted start
  // timestamp — the phase chip above it, not this timer, states whether recording is
  // real. Pauses while the document is hidden (no phantom seconds).
  const [now, setNow] = useState(() => Date.now());
  const livePhase = snapshot ? LIVE_PHASES.has(snapshot.phase) : false;

  useEffect(() => {
    if (!snapshot?.startedAt || !livePhase) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [snapshot?.startedAt, livePhase]);

  if (!live) {
    // Demo mode: the box exists but says exactly what demo is. No fabricated history —
    // the demo plane has no capture rows, so there is nothing to show.
    return (
      <section
        aria-labelledby="recording-events-heading"
        className="rounded-cc-card border border-cc-line bg-cc-surface p-[15px]"
      >
        <PanelHeading phase="not_started" reduced={reduced} />
        <p className="mt-2 text-[11.5px] leading-[1.5] text-cc-t3">
          Recording events appear here during a live capture session. Demo mode has no
          capture session, so there is no history to show.
        </p>
      </section>
    );
  }

  if (status === "error" && !snapshot) {
    return (
      <section
        aria-labelledby="recording-events-heading"
        className="rounded-cc-card border border-cc-line bg-cc-surface p-[15px]"
      >
        <PanelHeading phase="not_started" reduced={reduced} />
        <p role="alert" className="mt-2 text-[11.5px] text-cc-red-ink">
          {error ?? "Recording events are unavailable right now."}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-2 rounded-cc-control border border-cc-line px-2 py-1 text-[11px] font-semibold text-cc-t2 hover:bg-cc-soft"
        >
          Retry
        </button>
      </section>
    );
  }

  if (status === "loading" || !snapshot) {
    return (
      <section
        aria-labelledby="recording-events-heading"
        className="rounded-cc-card border border-cc-line bg-cc-surface p-[15px]"
      >
        <PanelHeading phase="not_started" reduced={reduced} />
        <p className="mt-2 text-[11.5px] text-cc-t3">Checking capture state…</p>
      </section>
    );
  }

  const visibleEvents = snapshot.events.slice(0, VISIBLE_EVENT_CAP);
  const hiddenCount = snapshot.events.length - visibleEvents.length;

  return (
    <section
      aria-labelledby="recording-events-heading"
      data-recording-phase={snapshot.phase}
      className="rounded-cc-card border border-cc-line bg-cc-surface p-[15px]"
    >
      <PanelHeading phase={snapshot.phase} reduced={reduced} elapsed={snapshot.startedAt && livePhase ? formatElapsed(snapshot.startedAt, now) : undefined} />

      {snapshot.phase === "not_started" ? (
        <p className="mt-2 text-[11.5px] leading-[1.5] text-cc-t3">
          Recording has not started yet. Start a capture session from the Meeting Capture
          extension — events will appear here as they happen.
        </p>
      ) : (
        <>
          {snapshot.lastError ? (
            <p role="alert" className="mt-2 rounded-cc-control border border-cc-red-border bg-cc-red-tint px-[9px] py-[7px] text-[11.5px] text-cc-red-ink">
              {snapshot.lastError}
            </p>
          ) : null}
          {visibleEvents.length === 0 ? (
            <p className="mt-2 text-[11.5px] leading-[1.5] text-cc-t3">Preparing recording…</p>
          ) : (
            <ul className="mt-2">
              {visibleEvents.map((event) => (
                <EventRow key={event.id} event={event} reduced={reduced} />
              ))}
            </ul>
          )}
          {hiddenCount > 0 ? (
            <p className="mt-1 font-cc-mono text-[9.5px] text-cc-t4">
              + {hiddenCount} earlier event{hiddenCount === 1 ? "" : "s"} this session
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function PanelHeading({
  phase,
  reduced,
  elapsed,
}: {
  phase: RecordingEventsSnapshot["phase"];
  reduced: boolean;
  elapsed?: string;
}) {
  const tone = PHASE_TONE[phase];
  const recording = phase === "recording";
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <h2 id="recording-events-heading" className={HEADING}>
          RECORDING EVENTS
        </h2>
        {/* The single live-work indicator beside the heading: the phase chip. It spins
            only while the phase is genuinely in progress, and goes static under
            reduced motion. */}
        {recording ? (
          reduced ? (
            <LoaderCircle className="h-3 w-3 text-cc-green-ink" aria-hidden />
          ) : (
            <LoaderCircle className="h-3 w-3 animate-spin text-cc-green-ink" aria-hidden />
          )
        ) : null}
      </div>
      <span
        data-phase={phase}
        className="rounded-[4px] px-1.5 py-0.5 font-cc-mono text-[9px] font-semibold"
        style={{ color: TONE_INK[tone] }}
      >
        {recording && elapsed ? `● ${RECORDING_PHASE_LABEL[phase]} · ${elapsed}` : RECORDING_PHASE_LABEL[phase]}
      </span>
    </div>
  );
}
