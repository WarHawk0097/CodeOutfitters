"use client";
// The Overview's Recent activity card, fed from the recorded activity log.
//
// "Recent activity" and not "Live activity": nothing here is a subscription. These are
// events already written to the log, rendered on the next state read — the wording must not
// promise a push channel this application does not have.
//
// The cut is recentImportant(), so the card carries things somebody has to know about rather
// than every routine edit. Each row opens the record it happened to, and a row whose record
// has no screen renders as text instead of a link that goes nowhere.
import Link from "next/link";
import { useMemo } from "react";
import {
  ACTIVITY_IMPORTANCE_LABELS,
  activityHref,
  dayKey,
  dayLabel,
  recentImportant,
  timeLabel,
  type ActivityEvent,
  type ActivityImportance,
} from "../../lib/activity/model";
import { resolveActivityPlane } from "../../lib/activity/provider";
import { DEMO_TODAY } from "../../lib/demo/seed";
import { useDemoState } from "../../lib/demo/store";
import { useCommandCenterConfig } from "../command-center/mode-provider";

const CARD = "rounded-cc-card border border-cc-line bg-cc-surface";

// Colour is never the only carrier: the importance word is in the dot's accessible name.
const DOT: Record<ActivityImportance, string> = {
  critical: "bg-cc-red-ink",
  notable: "bg-cc-blue",
  routine: "bg-cc-secondary border border-cc-line-strong",
};

/** How many rows the canonical card has room for before it clips. */
const LIMIT = 5;

function Row({ event }: { event: ActivityEvent }) {
  const href = activityHref(event.related);
  const when = `${dayLabel(dayKey(event.occurredAt), DEMO_TODAY)} · ${timeLabel(event.occurredAt)}`;
  const body = (
    <span className="flex-1 text-[12px] leading-[1.45] text-cc-t-table">{event.summary}</span>
  );
  return (
    <li className="flex items-start gap-[11px] border-b border-cc-soft px-4 py-1.5">
      <i
        className={`mt-1 h-2 w-2 shrink-0 rounded-[2px] ${DOT[event.importance]}`}
        role="img"
        aria-label={`${ACTIVITY_IMPORTANCE_LABELS[event.importance]} event`}
      />
      {href ? (
        <Link href={href} className="flex-1 underline-offset-2 hover:underline">
          {body}
        </Link>
      ) : (
        body
      )}
      <time
        dateTime={event.occurredAt}
        className="shrink-0 font-cc-mono text-[10px] text-cc-t4"
      >
        {when}
      </time>
    </li>
  );
}

export function RecentActivityLive() {
  const { live } = useCommandCenterConfig();
  const plane = resolveActivityPlane(live);
  const state = useDemoState();

  const events = useMemo(() => recentImportant(state.activity, LIMIT), [state.activity]);

  return (
    <section className={`${CARD} min-h-0 flex-1 overflow-hidden`} aria-labelledby="recent-activity">
      <h3
        id="recent-activity"
        className="border-b border-cc-line-inner px-4 py-3 text-[13px] font-semibold text-cc-ink"
      >
        Recent activity
      </h3>
      {plane.kind === "provider_required" ? (
        <p className="px-4 py-3 text-[11.5px] leading-[1.55] text-cc-t2">{plane.reason}</p>
      ) : events.length === 0 ? (
        <p className="px-4 py-3 text-[11.5px] leading-[1.55] text-cc-t2">
          Nothing needing attention has been recorded yet. Meetings, proposals and follow-ups
          appear here as they happen.
        </p>
      ) : (
        <ul>
          {events.map((event) => (
            <Row key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  );
}
