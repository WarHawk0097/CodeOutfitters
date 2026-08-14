"use client";
// Lead 360 — everything that has happened to this lead, in one place.
//
// Demo mode: eventsFor() collects both the events recorded against the lead itself and the
// events recorded against its records (meetings, proposals, tasks, follow-ups), which is why
// completing a task on My Work shows up here without anything being written twice.
//
// Live mode: reads the same real activity_events table (lib/activity/server-provider.ts) via
// GET /api/dashboard/activity?kind=lead&id=<leadId> — the query's own `record` rollup gives
// the identical "own events + events whose parent is this lead" shape eventsFor() computes in
// the demo store, so ActivityPanel renders one contract from either source. Not a second
// Activity system: same table, same provider, same panel — just live's own supply of events.
import { useMemo } from "react";
import { useDemoState } from "@/lib/demo/store";
import { DEMO_TODAY } from "@/lib/demo/seed";
import { eventsFor } from "@/lib/activity/model";
import { resolveActivityPlane } from "@/lib/activity/provider";
import { useLiveActivity } from "@/lib/activity/use-live-activity";
import { ActivityPanel } from "@/components/dashboard/activity-panel";

const EMPTY_LABEL =
  "Nothing has happened on this lead yet. Work recorded against it — meetings, proposals, tasks and follow-ups — appears here.";

export function LeadActivity({ leadId, live }: { leadId: string; live: boolean }) {
  const plane = resolveActivityPlane(live);
  const state = useDemoState();
  const liveActivity = useLiveActivity(plane.kind === "live", 200, { kind: "lead", id: leadId });

  const demoEvents = useMemo(() => eventsFor(state.activity, "lead", leadId), [state.activity, leadId]);

  if (plane.kind === "live" && liveActivity.status === "loading") {
    return <p className="text-[11.5px] leading-[1.55] text-cc-t2">Loading activity…</p>;
  }
  if (plane.kind === "live" && liveActivity.status === "error") {
    return (
      <p className="text-[11.5px] leading-[1.55] text-cc-t2">
        Activity could not be loaded ({liveActivity.error}).
      </p>
    );
  }

  return (
    <ActivityPanel
      events={plane.kind === "live" ? liveActivity.events : demoEvents}
      today={DEMO_TODAY}
      live={live}
      connected={plane.kind === "live"}
      title="Activity"
      emptyLabel={EMPTY_LABEL}
    />
  );
}
