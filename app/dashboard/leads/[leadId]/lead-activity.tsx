"use client";
// Lead 360 — everything that has happened to this lead, in one place.
//
// "360" is the whole point: the meetings, proposals, tasks, follow-ups, appointments and
// email activity that belong to this lead are not separate histories that happen to be
// nearby, they are one history read through one filter. eventsFor() collects both the events
// recorded against the lead itself and the events recorded against its records, which is why
// completing a task on My Work shows up here without anything being written twice.
import { useMemo } from "react";
import { useDemoState } from "@/lib/demo/store";
import { DEMO_TODAY } from "@/lib/demo/seed";
import { eventsFor } from "@/lib/activity/model";
import { ActivityPanel } from "@/components/dashboard/activity-panel";

export function LeadActivity({ leadId, live }: { leadId: string; live: boolean }) {
  const state = useDemoState();
  const events = useMemo(() => eventsFor(state.activity, "lead", leadId), [state.activity, leadId]);

  return (
    <ActivityPanel
      events={events}
      today={DEMO_TODAY}
      live={live}
      title="Activity"
      emptyLabel="Nothing has happened on this lead yet. Work recorded against it — meetings, proposals, tasks and follow-ups — appears here."
    />
  );
}
