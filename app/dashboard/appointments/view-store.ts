"use client";
// Which appointment view is showing, and which day it is centred on.
//
// The view switch is canonically part of the HEADER at tablet (T-06 969) and mobile
// (MO-07 1141 "Calendar ▾"), while the list and the calendar it switches live in the route
// body. Same problem the pipeline stage window has, and the same three-function external
// store solves it: one source of truth, so the header control and the body can never
// describe different views.
import { useCallback, useSyncExternalStore } from "react";
import { DEMO_TODAY } from "../../../lib/demo/seed";
import type { Appointment } from "../../../lib/demo/types";

export type AppointmentsView = "upcoming" | "calendar" | "past";

/** C-D11 316 lists the Apr 21 no-show under "Upcoming", so the split is by whether the
 *  appointment still needs someone to act on it — not by whether its date has passed. The
 *  header subtitle and the body list both classify through these, so the count in the
 *  subtitle is always the number of rows the list actually renders. */
export function isUpcoming(appointment: Appointment): boolean {
  return appointment.state !== "completed" && appointment.state !== "cancelled";
}

export function isPast(appointment: Appointment): boolean {
  return !isUpcoming(appointment);
}

export const VIEW_LABELS: Record<AppointmentsView, string> = {
  upcoming: "Upcoming",
  calendar: "Calendar",
  past: "Past",
};

export type ViewState = { view: AppointmentsView; date: string };

// DEMO_TODAY, not the real clock: the dataset is pinned to a reference day so "TODAY 22"
// stays 22 on every machine and every run.
const INITIAL: ViewState = { view: "upcoming", date: DEMO_TODAY };

let current: ViewState = INITIAL;
const listeners = new Set<() => void>();

function getSnapshot(): ViewState {
  return current;
}

function getServerSnapshot(): ViewState {
  return INITIAL;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function set(next: ViewState): void {
  current = next;
  for (const listener of listeners) listener();
}

/** Test-only: the store outlives a component, so one test's view would leak into the next. */
export function __resetAppointmentsView(): void {
  set(INITIAL);
}

export function useAppointmentsView(): ViewState & {
  setView: (view: AppointmentsView) => void;
  setDate: (date: string) => void;
  today: string;
} {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setView = useCallback((view: AppointmentsView) => set({ ...current, view }), []);
  const setDate = useCallback((date: string) => set({ ...current, date }), []);
  return { ...state, setView, setDate, today: DEMO_TODAY };
}
