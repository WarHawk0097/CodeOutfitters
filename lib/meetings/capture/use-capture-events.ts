"use client";

// use-capture-events — the Recording Events panel's data hook. Polls the
// session-authenticated capture-events endpoint and exposes the derived snapshot.
//
// Polling discipline (Performance requirements):
//   - one in-flight request at a time; identical ticks coalesce (inFlightRef)
//   - AbortController per tick, aborted on unmount and on terminal state
//   - polling STOPS at terminal phases (completed/failed/not_started — not_started
//     still gets one initial probe, then stops, so "Recording has not started yet."
//     is verified truth, not an assumption)
//   - visibility-gated: a hidden tab does not poll (document.visibilityState), and
//     resumes with an immediate refresh when visible again
//   - no setState after unmount (mountedRef)
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordingEventsSnapshot } from "@/lib/meetings/capture/events";

const ACTIVE_POLL_MS = 5000;
const TERMINAL_PHASES = new Set(["completed", "failed", "not_started"]);
const ONE_PROBE_PHASES = new Set(["not_started"]);

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

  const refresh = useCallback(() => {
    if (mounted.current) setTick((n) => n + 1);
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
      try {
        const res = await fetch(`/api/dashboard/meetings/${encodeURIComponent(meetingId)}/capture-events`, {
          method: "GET",
          signal: local.signal,
          headers: { "cache-control": "no-cache" },
        });
        const body = (await res.json().catch(() => null)) as
          | { ok: true; phase: ApiSnapshot["phase"]; events: ApiSnapshot["events"]; entryCount: number; lastSequence: number | null; startedAt: string | null; lastError: string | null; recording: boolean }
          | { ok: false; error?: { message?: string } }
          | null;
        if (cancelled || !mounted.current) return;
        if (!res.ok || body?.ok !== true || !body || !("phase" in body)) {
          setStatus("error");
          setError(body && "error" in body ? (body.error?.message ?? "That request failed.") : "That request failed.");
          // A failing poll does NOT spin forever: back off, keep the last good data.
          timer.current = setTimeout(() => void poll(), ACTIVE_POLL_MS * 2);
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
        if (ONE_PROBE_PHASES.has(body.phase)) {
          // Give a start command arriving in another tab a bounded window, then stop.
          timer.current = setTimeout(() => void poll(), ACTIVE_POLL_MS);
          // After the next tick not_started resolves terminal; see stop below.
          return;
        }
        if (TERMINAL_PHASES.has(body.phase)) {
          return; // terminal — stop polling entirely
        }
        timer.current = setTimeout(() => void poll(), ACTIVE_POLL_MS);
      } catch {
        if (cancelled || !mounted.current) return;
        if (local.signal.aborted) return;
        setStatus("error");
        setError("Could not reach the server. Retrying…");
        timer.current = setTimeout(() => void poll(), ACTIVE_POLL_MS * 2);
      } finally {
        inFlight.current = false;
      }
    };

    void poll();

    const onVisible = () => {
      if (document.visibilityState === "visible" && !timer.current) {
        // Tab became visible while parked at a terminal one-probe state: re-probe once.
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
