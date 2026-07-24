"use client";
// The parts of the Appointments screen the canonical design puts in the header: the
// subtitle (C-D11 316), the Upcoming/Calendar/Past switch (T-06 969) and the mobile view
// menu (MO-07 1141 "Calendar ▾").
//
// The switch is a real tablist, not three styled spans: it changes what the body renders,
// so it has to be operable from the keyboard and report its selected state.
import { MenuButton } from "../../../components/demo/menu";
import { useDemoState } from "../../../lib/demo/store";
import { DEMO_TODAY } from "../../../lib/demo/seed";
import { isUpcoming, useAppointmentsView, VIEW_LABELS, type AppointmentsView } from "./view-store";

const VIEWS: AppointmentsView[] = ["upcoming", "calendar", "past"];

export function AppointmentsSubtitle() {
  const state = useDemoState();
  const upcoming = state.appointments.filter(isUpcoming);
  const today = upcoming.filter((a) => a.date === DEMO_TODAY).length;
  // CANON 316: "7 upcoming · 3 today · provider-neutral scheduling". The two counts are
  // derived, so they cannot drift from the list below them. The trailing clause is
  // desktop-only, matching how T-06 969 drops it.
  return (
    <>
      {upcoming.length} upcoming · {today} today
      <span className="hidden xl:inline"> · provider-neutral scheduling</span>
    </>
  );
}

export function AppointmentsViewTabs() {
  const { view, setView } = useAppointmentsView();
  return (
    <div
      role="tablist"
      aria-label="Appointment view"
      className="flex overflow-hidden rounded-cc-control border border-cc-line bg-cc-surface"
    >
      {VIEWS.map((candidate) => (
        <button
          key={candidate}
          type="button"
          role="tab"
          id={`appointments-tab-${candidate}`}
          aria-selected={candidate === view}
          aria-controls="appointments-panel"
          tabIndex={candidate === view ? 0 : -1}
          onClick={() => setView(candidate)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            event.preventDefault();
            const next = VIEWS[(VIEWS.indexOf(candidate) + (event.key === "ArrowRight" ? 1 : VIEWS.length - 1)) % VIEWS.length]!;
            setView(next);
            document.getElementById(`appointments-tab-${next}`)?.focus();
          }}
          className={
            candidate === view
              ? "bg-cc-ink-strong px-3 py-[7px] text-[11.5px] font-semibold text-white"
              : "px-3 py-[7px] text-[11.5px] text-cc-t2 hover:bg-cc-secondary"
          }
        >
          {VIEW_LABELS[candidate]}
        </button>
      ))}
    </div>
  );
}

/** MO-07 1141: the switch collapses to a single "Calendar ▾" control at mobile. */
export function AppointmentsMobileView() {
  const { view, setView } = useAppointmentsView();
  return (
    <MenuButton
      label={`${VIEW_LABELS[view]} ▾`}
      ariaLabel={`Appointment view: ${VIEW_LABELS[view]}`}
      align="right"
      width={180}
      items={VIEWS.map((candidate) => ({
        id: candidate,
        label: VIEW_LABELS[candidate],
        selected: candidate === view,
      }))}
      onSelect={(id) => setView(id as AppointmentsView)}
      className="text-[11.5px] text-cc-t2"
    />
  );
}
