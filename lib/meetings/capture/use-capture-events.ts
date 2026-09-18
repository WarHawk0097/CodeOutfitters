"use client";

// use-capture-events — the Recording Events panel's data hook. Polls the
// session-authenticated capture-events endpoint and exposes the derived snapshot.
//
// Polling discipline (Performance requirements) — the timing decisions all live in
// ./poll-policy (single home, unit-tested); this hook applies them:
//   - one in-flight request at a time; identical ticks coalesce (inFlightRef)
//   - AbortController per tick, aborted on unmount and on terminal state
//   - terminal phases (completed/failed) stop polling entirely; not_started gets the
//     initial probe plus ONE bounded follow-up (so a start command landing in another
//     tab is picked up), then polling stops — no perpetual idle polling. Explicit
//     refresh or a visibility transition resets that probe budget on purpose.
//   - visibility-gated: a hidden tab does not poll (document.visibilityState), and
//     resumes with an immediate refresh when visible again
//   - no setState after unmount (mountedRef)
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordingEventsSnapshot } from "@/lib/meetings/capture/events";
import { decideNextPoll } from "./poll-policy";

export type UseCaptureEventsResult = {
  snapshot: RecordingEventsSnapshot | null;
  status: "loading" | "ready" | "error";
  error: string | null;
  refresh: () => void;
};

type ApiSnapshot = RecordingEventsSnapshot;

export function useCaptureEvents(enabled: boolean, meetingId: string): UseCaptureEventsResult {
  const [snapshot, setSnapshot] = useState<ApiSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Consecutive not_started probes, INCLUDING the one that just resolved. Reset by an
  // explicit refresh or a visibility transition; enforced by decideNextPoll.
  const notStartedProbes = useRef(0);

  const refresh = useCallback(() => {
    if (!mounted.current) return;
    // An explicit user action is a fresh probe budget, not idle polling.
    notStartedProbes.current = 0;
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !meetingId) return;
    let cancelled = false;

    const poll = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      controller.current?.abort();
      const local = new AbortController();
      controller.current = local;
      // The ONLY place a next poll is ever armed: the policy decides, and a "stop"
      // decision arms nothing. No other setTimeout(…poll) exists in this hook.
      const armNextPoll = (phase: "error" | ApiSnapshot["phase"]) => {
        const decision = decideNextPoll(phase, notStartedProbes.current);
        if (decision.action === "stop") return;
        timer.current = setTimeout(() => void poll(), decision.delayMs);
      };
      try {
        const res = await fetch(`/api/dashboard/meetings/${encodeURIComponent(meetingId)}/capture-events`, {
          method: "GET",
          signal: local.signal,
          headers: { "cache-control": "no-cache" },
        });
        const body = (await res.json().catch(() => null)) as
          | ({ ok: true } & ApiSnapshot)
          | { ok: false; error?: { message?: string } }
          | null;
        if (cancelled || !mounted.current) return;
        if (!res.ok || body?.ok !== true || !body || !("phase" in body)) {
          setStatus("error");
          setError(body && "error" in body ? (body.error?.message ?? "That request failed.") : "That request failed.");
          // A failing poll does NOT spin forever: back off, keep the last good data.
          armNextPoll("error");
          return;
        }
        setSnapshot({
          phase: body.phase,
          recording: body.recording,
          entryCount: body.entryCount,
          lastSequence: body.lastSequence,
          startedAt: body.startedAt,
          lastError: body.lastError,
          events: body.events,
        });
        setStatus("ready");
        setError(null);
        if (body.phase === "not_started") notStartedProbes.current += 1;
        else notStartedProbes.current = 0;
        armNextPoll(body.phase);
        // A "stop" decision arms no timer: terminal phases and the exhausted
        // not_started budget end polling entirely. The visibility listener below
        // re-probes once when the tab returns, with a fresh budget.
      } catch {
        if (cancelled || !mounted.current) return;
        if (local.signal.aborted) return;
        setStatus("error");
        setError("Could not reach the server. Retrying…");
        armNextPoll("error");
      } finally {
        inFlight.current = false;
      }
    };

    void poll();

    const onVisible = () => {
      if (document.visibilityState === "visible" && !timer.current && !inFlight.current) {
        // Tab returned while parked at a terminal/exhausted state: one explicit probe
        // with a fresh budget — user-visible attention, not idle polling.
        notStartedProbes.current = 0;
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, meetingId, tick]);

  return { snapshot, status, error, refresh };
}
