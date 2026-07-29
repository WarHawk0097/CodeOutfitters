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
import { TodaysWorkCard, type TodaysWorkItem } from "@command-center/ui";
import { useDemoState } from "../../lib/demo/store";
import { DEMO_CURRENT_USER_ID, DEMO_TODAY, LEAD_DIRECTORY } from "../../lib/demo/seed";
import type { Task } from "../../lib/demo/types";
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

/** Proposal states that mean somebody has to do something. ACCEPTED, REJECTED, EXPIRED and
 *  ARCHIVED are settled; SENT and APPROVED are correctly parked with the other side. */
const PROPOSAL_ATTENTION = new Set(["DRAFT", "INTERNAL REVIEW", "CHANGES REQUESTED", "VIEWED"]);

function taskToWorkItem(task: Task, meta: string): TodaysWorkItem {
  return {
    title: task.title,
    meta,
    tag: dueLabel(task, DEMO_TODAY).toUpperCase(),
    color: TONE_BASE[dueTone(task, DEMO_TODAY)],
    cta: "Open",
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

  return (
    <div className="flex min-h-0 flex-col gap-1.5">
      <TodaysWorkCard items={items} openCount={String(attention.length)} variant={variant} />
      <Link
        href="/dashboard/my-work?view=today"
        className="self-start text-[11.5px] font-semibold text-cc-green underline decoration-cc-line underline-offset-2"
      >
        Open in My Work
      </Link>
    </div>
  );
}

type ModuleRecord = { id: string; label: string; href: string; tag?: string; tone?: string };

function OperationsModule({
  label,
  records,
  href,
  emptyHint,
  total = records.length,
}: {
  label: string;
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
        <span className="text-[12px] font-semibold text-cc-t2">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 pt-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          disabled={records.length === 0}
          className="text-[11.5px] font-semibold text-cc-t2 underline decoration-cc-line underline-offset-2 disabled:no-underline disabled:opacity-50"
        >
          {records.length === 0 ? emptyHint : open ? "Hide the list" : "Show the list"}
        </button>
        <Link
          href={href}
          className="text-[11.5px] font-semibold text-cc-green underline decoration-cc-line underline-offset-2"
        >
          Open
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

    // READY meetings are the ones with a prepare screen to walk into.
    const toPrepare = state.meetings.filter((meeting) => meeting.state === "READY");

    const proposals = state.proposals.filter((proposal) => PROPOSAL_ATTENTION.has(proposal.state));

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
    <section aria-labelledby="operations-band-heading" className="mt-4">
      <h2 id="operations-band-heading" className="mb-2 font-cc-mono text-[10px] tracking-[.08em] text-cc-t3">
        WHAT NEEDS A DECISION
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <OperationsModule
          label="Overdue tasks"
          records={modules.overdue}
          href="/dashboard/my-work?view=overdue"
          emptyHint="Nothing overdue"
        />
        <OperationsModule
          label="Waiting on client"
          records={modules.waiting}
          href="/dashboard/my-work?view=waiting"
          emptyHint="Not waiting on anyone"
        />
        <OperationsModule
          label="Meetings to prepare"
          records={modules.toPrepare}
          href="/dashboard/meetings"
          emptyHint="Nothing to prepare"
        />
        <OperationsModule
          label="Proposals needing attention"
          records={modules.proposals}
          href="/dashboard/proposals"
          emptyHint="No proposal is waiting on us"
        />
        <OperationsModule
          label="Leads with no next action"
          records={modules.leads}
          total={modules.uncoveredTotal}
          href="/dashboard/leads"
          emptyHint="Every lead has a next action"
        />
      </div>
    </section>
  );
}
