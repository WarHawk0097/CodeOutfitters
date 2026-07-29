"use client";
// The filterable activity panel: a record's whole history, plus the controls to cut it down.
//
// It is a client island because in demo mode the history is the demo store, which a person
// changes while they are looking at it — completing a task has to show up in the timeline
// underneath it, or the two halves of the screen disagree.
//
// In live mode it renders the contract, not the data: there is no activity provider yet, so
// it says that plainly instead of quietly showing demo history a workspace never produced.
import { useMemo, useState } from "react";
import {
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_IMPORTANCES,
  ACTIVITY_IMPORTANCE_LABELS,
  EMPTY_ACTIVITY_FILTER,
  actorsIn,
  categoryCounts,
  filterEvents,
  isFilterActive,
  type ActivityCategory,
  type ActivityEvent,
  type ActivityFilter,
} from "@/lib/activity/model";
import {
  ACTIVITY_PROVIDER_REQUIRED_REASON,
  ACTIVITY_PROVIDER_REQUIRED_TITLE,
  resolveActivityPlane,
} from "@/lib/activity/provider";
import { ActivityTimeline } from "./activity-ui";

export function ActivityProviderRequired() {
  return (
    <div className="rounded-cc-card border border-cc-line bg-cc-secondary p-4">
      <h3 className="text-[13px] font-medium text-cc-ink">{ACTIVITY_PROVIDER_REQUIRED_TITLE}</h3>
      <p className="mt-1 text-[11.5px] leading-relaxed text-cc-t2">
        {ACTIVITY_PROVIDER_REQUIRED_REASON}
      </p>
    </div>
  );
}

function Chip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-cc-control border px-2 py-1 text-[11px] transition-colors ${
        active
          ? "border-cc-line-strong bg-cc-soft text-cc-ink"
          : "border-cc-line bg-cc-surface text-cc-t2 hover:text-cc-ink"
      }`}
    >
      {label}
      {count === undefined ? null : <span className="ml-1 text-cc-t3">{count}</span>}
    </button>
  );
}

export function ActivityPanel({
  events,
  today,
  live,
  title = "Activity",
  emptyLabel,
  showRecord = true,
}: {
  events: readonly ActivityEvent[];
  today: string;
  live: boolean;
  title?: string;
  emptyLabel: string;
  showRecord?: boolean;
}) {
  const [filter, setFilter] = useState<ActivityFilter>(EMPTY_ACTIVITY_FILTER);

  const counts = useMemo(() => categoryCounts(events), [events]);
  const actors = useMemo(() => actorsIn(events), [events]);
  const shown = useMemo(() => filterEvents(events, filter), [events, filter]);

  // Only categories this record actually produced are offered. A filter that can only ever
  // return nothing is a control that wastes a click.
  const categories = useMemo(
    () => (Object.keys(counts) as ActivityCategory[]).filter((category) => counts[category] > 0),
    [counts],
  );

  if (live) return <ActivityProviderRequired />;
  // resolveActivityPlane is the single decision; asserting it here keeps this component from
  // becoming a second place that decides whether demo data may be shown.
  if (resolveActivityPlane(false).kind !== "demo") return <ActivityProviderRequired />;

  const active = isFilterActive(filter);

  return (
    <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-medium text-cc-ink">{title}</h2>
        <p className="text-[11px] text-cc-t3" role="status" aria-live="polite">
          {active ? `${shown.length} of ${events.length} events` : `${events.length} events`}
        </p>
      </div>

      {events.length > 0 ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {categories.map((category) => (
              <Chip
                key={category}
                label={ACTIVITY_CATEGORY_LABELS[category]}
                count={counts[category]}
                active={filter.categories.includes(category)}
                onClick={() =>
                  setFilter((current) => ({
                    ...current,
                    categories: current.categories.includes(category)
                      ? current.categories.filter((candidate) => candidate !== category)
                      : [...current.categories, category],
                  }))
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by importance">
            {ACTIVITY_IMPORTANCES.map((importance) => (
              <Chip
                key={importance}
                label={ACTIVITY_IMPORTANCE_LABELS[importance]}
                active={filter.importance === importance}
                onClick={() =>
                  setFilter((current) => ({
                    ...current,
                    importance: current.importance === importance ? null : importance,
                  }))
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-cc-t3">
              Person
              <select
                value={filter.actorId ?? ""}
                onChange={(event) =>
                  setFilter((current) => ({ ...current, actorId: event.target.value || null }))
                }
                className="rounded-cc-control border border-cc-line bg-cc-surface px-1.5 py-1 text-[11px] text-cc-ink"
              >
                <option value="">Anyone</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-1 items-center gap-1.5 text-[11px] text-cc-t3">
              <span className="sr-only sm:not-sr-only">Search</span>
              <input
                type="search"
                value={filter.query}
                placeholder="Search this history"
                onChange={(event) =>
                  setFilter((current) => ({ ...current, query: event.target.value }))
                }
                className="min-w-0 flex-1 rounded-cc-control border border-cc-line bg-cc-surface px-2 py-1 text-[11px] text-cc-ink"
              />
            </label>

            {active ? (
              <button
                type="button"
                onClick={() => setFilter(EMPTY_ACTIVITY_FILTER)}
                className="text-[11px] text-cc-blue-ink underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-2">
        <ActivityTimeline
          events={shown}
          today={today}
          showRecord={showRecord}
          emptyLabel={
            active
              ? "No events match these filters."
              : emptyLabel
          }
        />
      </div>
    </section>
  );
}
