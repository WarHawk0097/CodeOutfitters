"use client";
// Shared activity presentation.
//
// Every screen that shows history — the Lead 360 timeline, a proposal's activity page, the
// compact panel inside a record dialog, the Overview summary — renders through here, so an
// event reads the same wherever it appears and there is one place where importance,
// timestamps and metadata are formatted.
//
// What this file deliberately does NOT do:
//   - it never invents a label; every string comes from lib/activity/model.ts
//   - it never renders a JSON blob; metadata is labelled pairs or it is not shown
//   - it never links to a route that does not exist; activityHref returns null instead
//   - it never says "live" — this is recorded history, not a subscription
import Link from "next/link";
import {
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_IMPORTANCE_LABELS,
  ACTIVITY_RECORD_LABELS,
  activityHref,
  eventTypeLabel,
  groupByDay,
  timeLabel,
  type ActivityEvent,
  type ActivityImportance,
} from "@/lib/activity/model";

// Colour carries no meaning on its own: each dot is paired with the importance word in the
// accessible name, so the distinction survives a greyscale screen and a screen reader.
const IMPORTANCE_DOT: Record<ActivityImportance, string> = {
  critical: "bg-cc-red-ink",
  notable: "bg-cc-blue",
  routine: "bg-cc-secondary border border-cc-line-strong",
};

function ImportanceDot({ importance }: { importance: ActivityImportance }) {
  return (
    <span
      className={`mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full ${IMPORTANCE_DOT[importance]}`}
      role="img"
      aria-label={`${ACTIVITY_IMPORTANCE_LABELS[importance]} event`}
    />
  );
}

/** The record an event points at, as a link when that record has a screen and as plain text
 *  when it does not. A label that looks like a link and goes nowhere is worse than a label. */
function RecordLink({ event }: { event: ActivityEvent }) {
  const href = activityHref(event.related);
  const label = `${ACTIVITY_RECORD_LABELS[event.related.kind]} · ${event.related.label}`;
  if (!href) return <span className="text-cc-t3">{label}</span>;
  return (
    <Link href={href} className="text-cc-blue-ink underline-offset-2 hover:underline">
      {label}
    </Link>
  );
}

function Metadata({ event }: { event: ActivityEvent }) {
  if (event.metadata.length === 0) return null;
  return (
    <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
      {event.metadata.map((pair) => (
        <div key={pair.label} className="flex gap-1">
          <dt className="text-[11px] text-cc-t3">{pair.label}</dt>
          <dd className="text-[11px] text-cc-t-table">{pair.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One event, at full detail. Used by the timeline and the proposal activity page. */
export function ActivityLine({
  event,
  showRecord = true,
}: {
  event: ActivityEvent;
  showRecord?: boolean;
}) {
  return (
    <li className="flex gap-2 py-2">
      <ImportanceDot importance={event.importance} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[12.5px] text-cc-ink">{event.summary}</span>
          <span className="font-cc-mono text-[10px] text-cc-t3">{timeLabel(event.occurredAt)}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-cc-t3">
          {eventTypeLabel(event.type)} · {ACTIVITY_CATEGORY_LABELS[event.category]} · {event.actorLabel}
          {showRecord ? <> · <RecordLink event={event} /></> : null}
        </p>
        {event.detail ? <p className="mt-1 text-[11.5px] text-cc-t-table">{event.detail}</p> : null}
        <Metadata event={event} />
      </div>
    </li>
  );
}

/** A full history, grouped by the day it happened on.
 *
 *  Days are grouped from the ISO string rather than a parsed Date, so the server render and
 *  the browser render agree about which day an event belongs to regardless of where the
 *  browser is. */
export function ActivityTimeline({
  events,
  today,
  emptyLabel,
  showRecord = true,
}: {
  events: readonly ActivityEvent[];
  today: string;
  emptyLabel: string;
  showRecord?: boolean;
}) {
  if (events.length === 0) {
    return <p className="py-3 text-[11.5px] text-cc-t3">{emptyLabel}</p>;
  }
  return (
    <div>
      {groupByDay(events, today).map((group) => (
        <section key={group.day} className="border-t border-cc-line first:border-t-0">
          <h4 className="sticky top-0 bg-cc-surface py-1.5 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
            {group.label.toUpperCase()}
          </h4>
          <ul className="divide-y divide-cc-line-inner">
            {group.events.map((event) => (
              <ActivityLine key={event.id} event={event} showRecord={showRecord} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** The compact panel a record's own screen shows: the last few things that happened to it,
 *  with a way through to the whole history rather than a truncated list that pretends to be
 *  complete. */
export function RecordActivity({
  events,
  emptyLabel,
  limit = 5,
  moreHref,
}: {
  events: readonly ActivityEvent[];
  emptyLabel: string;
  limit?: number;
  moreHref?: string;
}) {
  const shown = events.slice(0, limit);
  return (
    <div>
      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">ACTIVITY HISTORY</h3>
      {shown.length === 0 ? (
        <p className="mt-1 text-[11.5px] text-cc-t3">{emptyLabel}</p>
      ) : (
        <ul className="mt-1 divide-y divide-cc-line-inner">
          {shown.map((event) => (
            <ActivityLine key={event.id} event={event} showRecord={false} />
          ))}
        </ul>
      )}
      {moreHref && events.length > shown.length ? (
        <Link
          href={moreHref}
          className="mt-2 inline-block text-[11px] text-cc-blue-ink underline-offset-2 hover:underline"
        >
          View all {events.length} events
        </Link>
      ) : null}
    </div>
  );
}
