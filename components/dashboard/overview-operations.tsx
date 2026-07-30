"use client";
// The task-backed half of the Overview.
//
// Two pieces:
//   TodaysWorkLive — the canonical Today's work card, fed from the real task collection
//                    instead of the four-row design sample, plus a control that opens the
//                    exact same records in My Work.
//   OperationsBand — the five remaining operational questions, each with a count and a
//                    drill-down to the exact records the count is made of.
//
// Nothing here is a headline number without a record set behind it: every count is a
// length, and the expander below it lists precisely the rows that were counted. A number
// nobody can click through to is decoration, and decoration on an operations screen is
// how work gets missed.
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  MeetingsProposalsCard,
  TodaysWorkCard,
  type OperationalSummary,
  type TodaysWorkItem,
} from "@command-center/ui";
import { useDemoState } from "../../lib/demo/store";
import { DEMO_CURRENT_USER_ID, DEMO_TODAY, LEAD_DIRECTORY } from "../../lib/demo/seed";
import type { Task } from "../../lib/demo/types";
import {
  meetingsNeedingReview,
  meetingsToPrepare,
  proposalsNeedingAttention,
} from "../../lib/operations/attention";
import {
  dueLabel,
  dueTone,
  filterByView,
  isDueToday,
  isOverdue,
  leadIdsWithoutNextAction,
  sortTasks,
} from "../../lib/tasks/model";
import { resolveTaskPlane } from "../../lib/tasks/provider";
import { useCommandCenterConfig } from "../command-center/mode-provider";
import { TONE_BASE, TONE_INK } from "../demo/tone";

// Every operational destination in this file is a canonical list route with an explicit
// `view` parameter, never a page of its own. Named here so the Overview and the tests
// that check the counts against the destinations read the same strings.
const TODAY_QUEUE_HREF = "/dashboard/my-work?view=today";
const OVERDUE_HREF = "/dashboard/my-work?view=overdue";
const WAITING_HREF = "/dashboard/my-work?view=waiting";
const MEETINGS_PREPARE_HREF = "/dashboard/meetings?view=prepare";
const MEETINGS_REVIEW_HREF = "/dashboard/meetings?view=review";
const PROPOSALS_ATTENTION_HREF = "/dashboard/proposals?view=attention";
const LEADS_NO_NEXT_ACTION_HREF = "/dashboard/leads?view=no-next-action";

const CONTROL_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cc-green";

/** "3 proposals", "1 proposal". A count read aloud as "1 proposals" is a tell that the
 *  string was written by hand and never derived. */
function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** The first few records behind a count, named — the sub-line the canonical card used to
 *  hard-code. Truncated with a remainder rather than silently cut. */
function nameRecords(labels: readonly string[], limit = 2): string {
  if (labels.length === 0) return "";
  if (labels.length <= limit) return labels.join(" · ");
  return `${labels.slice(0, limit).join(" · ")} · +${labels.length - limit} more`;
}

function taskToWorkItem(task: Task, meta: string): TodaysWorkItem {
  return {
    title: task.title,
    meta,
    tag: dueLabel(task, DEMO_TODAY).toUpperCase(),
    color: TONE_BASE[dueTone(task, DEMO_TODAY)],
    cta: "Open",
    href: `/dashboard/my-work/${task.id}`,
    actionLabel: `Open task: ${task.title}`,
  };
}

export function TodaysWorkLive({ variant }: { variant: "desktop" | "tablet" | "mobile" }) {
  const { live } = useCommandCenterConfig();
  const plane = resolveTaskPlane(live);
  const state = useDemoState();

  const attention = useMemo(
    () => sortTasks(state.tasks.filter((task) => isOverdue(task, DEMO_TODAY) || isDueToday(task, DEMO_TODAY))),
    [state.tasks],
  );

  if (plane.kind === "provider_required") {
    return (
      <div className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
        <h3 className="text-[12.5px] font-semibold text-cc-ink">Today&apos;s work</h3>
        <p className="mt-1.5 text-[11.5px] leading-[1.55] text-cc-t2">{plane.reason}</p>
      </div>
    );
  }

  // The canonical card draws four rows; more than that is what My Work is for.
  const items = attention.slice(0, 4).map((task) =>
    taskToWorkItem(
      task,
      task.relation
        ? task.relation.label
        : (state.team.find((member) => member.id === task.ownerId)?.name ?? "Unassigned"),
    ),
  );

  // One control to the queue, not two. The card's own "View queue" used to be inert, and a
  // second link was added underneath the card to compensate — two controls, one
  // destination, and the one the eye goes to was the broken one.
  return (
    <div className="flex min-h-0 flex-col">
      <TodaysWorkCard
        items={items}
        openCount={String(attention.length)}
        variant={variant}
        queueHref={TODAY_QUEUE_HREF}
        linkAs={Link}
      />
    </div>
  );
}

/**
 * Meetings & proposals, counted rather than asserted.
 *
 * The canonical card shipped with "2 meetings need review", "Solterra discovery ·
 * Northwind no-show" and "3 proposals awaiting action" written into the markup. Those
 * were true of the design file and of nothing else: the demo state has held different
 * meetings and a different number of them since the first mutation anyone made on the
 * Meetings screen. Both rows are now derived from the same collections the operational
 * band counts, using the same predicates the destination screens filter on.
 */
export function MeetingsProposalsLive({ variant }: { variant: "desktop" | "mobile" }) {
  const { live } = useCommandCenterConfig();
  const plane = resolveTaskPlane(live);
  const state = useDemoState();

  const summaries = useMemo(() => {
    const review = meetingsNeedingReview(state.meetings);
    const attention = proposalsNeedingAttention(state.proposals);
    const meetings: OperationalSummary = {
      label: `${plural(review.length, "meeting")} need${review.length === 1 ? "s" : ""} review`,
      detail: nameRecords(review.map((meeting) => `${meeting.name} · ${meeting.company}`)),
      href: MEETINGS_REVIEW_HREF,
      actionLabel: "Review",
      ariaLabel: "Review meetings that need review",
    };
    const proposals: OperationalSummary = {
      label: `${plural(attention.length, "proposal")} awaiting action`,
      detail: nameRecords(attention.map((proposal) => `${proposal.id} · ${proposal.state}`)),
      href: PROPOSALS_ATTENTION_HREF,
      actionLabel: "Open",
      ariaLabel: "Open proposals needing attention",
    };
    return { meetings, proposals };
  }, [state.meetings, state.proposals]);

  if (plane.kind === "provider_required") return null;

  return (
    <MeetingsProposalsCard
      variant={variant}
      meetings={summaries.meetings}
      proposals={summaries.proposals}
      linkAs={Link}
    />
  );
}

type ModuleRecord = { id: string; label: string; href: string; tag?: string; tone?: string };

function OperationsModule({
  label,
  noun,
  records,
  href,
  emptyHint,
  total = records.length,
}: {
  label: string;
  /** What this module is about, in the lower case that reads correctly inside a control
   *  label: "overdue tasks" gives "Show overdue tasks" / "Open overdue tasks". Five cards
   *  each labelled "Open" is five identical accessible names for five destinations. */
  noun: string;
  records: readonly ModuleRecord[];
  /** Where the whole set opens. Every value is a route that exists. */
  href: string;
  emptyHint: string;
  /** True size of the set when the inline list is capped. The headline number is always
   *  the true size — a capped list must never quietly become a smaller count. */
  total?: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `ops-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  return (
    <div className="rounded-cc-card border border-cc-line bg-cc-surface">
      <div className="flex items-baseline gap-2 px-4 pt-3">
        <span className="text-[22px] font-semibold leading-none text-cc-ink-strong">{total}</span>
        <span className="min-w-0 text-[12px] font-semibold text-cc-t2">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 pt-2">
        {/* Two controls that do genuinely different things, so both stay — one expands the
            list in place, the other leaves for the full list. They are labelled for what
            they do rather than both saying "Open". */}
        {records.length === 0 ? (
          <span className="text-[11.5px] font-semibold text-cc-t3">{emptyHint}</span>
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((current) => !current)}
            className={`text-[11.5px] font-semibold text-cc-t2 underline decoration-cc-line underline-offset-2 hover:text-cc-ink ${CONTROL_FOCUS}`}
          >
            {open ? `Hide ${noun}` : `Show ${noun}`}
          </button>
        )}
        <Link
          href={href}
          className={`text-[11.5px] font-semibold text-cc-green-ink underline decoration-cc-line underline-offset-2 hover:decoration-cc-green ${CONTROL_FOCUS}`}
        >
          {`Open ${noun}`}
        </Link>
      </div>
      {open && records.length > 0 ? (
        <ul id={panelId} className="border-t border-cc-line">
          {total > records.length ? (
            <li className="border-b border-cc-soft px-4 py-2 text-[11px] text-cc-t3">
              Showing the first {records.length} of {total}. Open for the rest.
            </li>
          ) : null}
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-2 border-b border-cc-soft px-4 py-2 last:border-b-0">
              <Link href={record.href} className="min-w-0 truncate text-[11.5px] text-cc-t2 hover:text-cc-ink hover:underline">
                {record.label}
              </Link>
              {record.tag ? (
                <span
                  className="flex-shrink-0 font-cc-mono text-[9px] font-semibold"
                  style={{ color: record.tone ?? TONE_INK.neutral }}
                >
                  {record.tag}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function OperationsBand() {
  const { live } = useCommandCenterConfig();
  const plane = resolveTaskPlane(live);
  const state = useDemoState();

  const modules = useMemo(() => {
    const taskRecord = (task: Task): ModuleRecord => ({
      id: task.id,
      label: task.title,
      href: `/dashboard/my-work/${task.id}`,
      tag: dueLabel(task, DEMO_TODAY).toUpperCase(),
      tone: TONE_INK[dueTone(task, DEMO_TODAY)],
    });

    const overdue = sortTasks(filterByView(state.tasks, "overdue", DEMO_TODAY, DEMO_CURRENT_USER_ID));
    const waiting = sortTasks(filterByView(state.tasks, "waiting", DEMO_TODAY, DEMO_CURRENT_USER_ID));

    // A lead nobody owes anything to is a lead going quiet. The set is exact: every lead in
    // the directory with no open task against it.
    const uncovered = new Set(
      leadIdsWithoutNextAction(
        state.tasks,
        LEAD_DIRECTORY.map((lead) => lead.id),
      ),
    );
    const leads = LEAD_DIRECTORY.filter((lead) => uncovered.has(lead.id)).slice(0, 12);

    // Both predicates come from lib/operations/attention.ts, which is also what
    // /dashboard/meetings?view=prepare and /dashboard/proposals?view=attention filter on,
    // so these counts and those lists cannot describe different sets.
    const toPrepare = meetingsToPrepare(state.meetings);
    const proposals = proposalsNeedingAttention(state.proposals);

    return {
      overdue: overdue.map(taskRecord),
      waiting: waiting.map(taskRecord),
      leads: leads.map((lead) => ({
        id: lead.id,
        label: `${lead.name} · ${lead.company}`,
        href: "/dashboard/leads",
      })),
      toPrepare: toPrepare.map((meeting) => ({
        id: meeting.id,
        label: `${meeting.name} · ${meeting.company}`,
        href: `/dashboard/meetings/${meeting.id}/prepare`,
        tag: meeting.when.toUpperCase(),
      })),
      proposals: proposals.map((proposal) => ({
        id: proposal.id,
        label: `${proposal.id} · ${proposal.client}`,
        href: `/dashboard/proposals/${proposal.id}/edit`,
        tag: proposal.state,
      })),
      uncoveredTotal: uncovered.size,
    };
  }, [state.tasks, state.meetings, state.proposals]);

  if (plane.kind === "provider_required") return null;

  return (
    // The desktop composition above is pinned to the frame height, so this band starts at
    // the fold. The rule keeps its heading attached to its own cards rather than reading as
    // a stray label under whatever section happens to end there.
    <section aria-labelledby="operations-band-heading" className="mt-4 border-t border-cc-line pt-4">
      <h2 id="operations-band-heading" className="mb-2 font-cc-mono text-[10px] tracking-[.08em] text-cc-t3">
        WHAT NEEDS A DECISION
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <OperationsModule
          label="Overdue tasks"
          noun="overdue tasks"
          records={modules.overdue}
          href={OVERDUE_HREF}
          emptyHint="Nothing overdue"
        />
        <OperationsModule
          label="Waiting on client"
          noun="waiting-on-client tasks"
          records={modules.waiting}
          href={WAITING_HREF}
          emptyHint="Not waiting on anyone"
        />
        <OperationsModule
          label="Meetings to prepare"
          noun="meetings to prepare"
          records={modules.toPrepare}
          href={MEETINGS_PREPARE_HREF}
          emptyHint="Nothing to prepare"
        />
        <OperationsModule
          label="Proposals needing attention"
          noun="proposals needing attention"
          records={modules.proposals}
          href={PROPOSALS_ATTENTION_HREF}
          emptyHint="No proposal is waiting on us"
        />
        <OperationsModule
          label="Leads with no next action"
          noun="leads without next actions"
          records={modules.leads}
          total={modules.uncoveredTotal}
          href={LEADS_NO_NEXT_ACTION_HREF}
          emptyHint="Every lead has a next action"
        />
      </div>
    </section>
  );
}
