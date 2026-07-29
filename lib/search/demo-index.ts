// The deterministic demo search index.
//
// Built from the fixtures that already exist — the same lead directory the Leads route
// fetches, the same demo store every other route reads and writes. Nothing here authors a
// second copy of a record. If a task was created in this session it is findable in this
// session, because the index is derived from the live store object rather than from a
// snapshot taken at module load.
//
// Determinism, concretely: no `Math.random`, no `Date.now`, no `new Date()`. Every timestamp
// in a document is an authored fixture string. Run this twice on two machines and the arrays
// are identical, element for element — which is what lets the consistency checks in
// lib/search/model.ts be assertions rather than samples.
//
// What is deliberately NOT indexed, and why:
//
//   * A recipient's email address. `EmailActivity.to` is a real person outside this workspace;
//     `EmailActivity.body` is what was said to them. Neither is a search key. Only the subject,
//     the lead's name, the type and the delivery state are indexed.
//   * A secure proposal token, a token hash, or a proposal access link. The whole point of the
//     secure proposal release is that a link is known only to its recipient; putting one in a
//     control every member can type into would undo it. No publication, access link or client
//     response is indexed at all — not their content, not their ids.
//   * `restricted` activity. That visibility exists precisely because some history is not for
//     everyone, and an index is read by everyone.
//   * Internal notes and detail bodies. `Meeting.notes` and `Appointment.notes` are internal
//     commentary; the index carries the record's identity, not its contents.
import { LEAD_DIRECTORY } from "@/lib/demo/seed";
import type { DemoState } from "@/lib/demo/types";
import type { Lead } from "@command-center/contracts";
import { activityHref } from "@/lib/activity/model";
import { listHrefWithQuery, SEARCH_ROUTE_PATTERNS } from "./routes";
import {
  INDEXABLE_ACTIVITY_VISIBILITIES,
  type CommandCenterSearchDocument,
  type SearchEntityType,
  type SearchIndexUniverse,
} from "./model";

const INDEXABLE_VISIBILITIES = new Set<string>(INDEXABLE_ACTIVITY_VISIBILITIES);

/** Joins the parts of a body field, dropping empties so a missing optional does not leave a
 *  double space that changes a substring match. */
function body(...parts: (string | undefined | null)[]): string {
  return parts.filter((part): part is string => typeof part === "string" && part.trim() !== "").join(" · ");
}

function ownerName(state: DemoState, ownerId: string): string {
  return state.team.find((member) => member.id === ownerId)?.name ?? "";
}

/** Leads have no per-record page for store-space ids (see activityHref's note on the two id
 *  spaces), so a lead result opens the directory already narrowed to that person rather than
 *  dropping the reader on an unfiltered list of 128. */
function leadHref(lead: Lead): string {
  return listHrefWithQuery("/dashboard/leads", lead.name);
}

// ---------------------------------------------------------------------------
// Per-entity builders
// ---------------------------------------------------------------------------

function leadDocuments(state: DemoState, leads: readonly Lead[]): CommandCenterSearchDocument[] {
  return leads.map((lead) => {
    const override = state.leadOverrides[lead.id];
    const status = override?.status ?? lead.status;
    const owner = override?.ownerId ?? lead.owner;
    return {
      key: `lead:${lead.id}`,
      type: "lead" as const,
      id: lead.id,
      title: lead.name,
      subtitle: lead.company,
      body: body(lead.serviceInterest, lead.sourcePage, override?.nextStepLabel ?? lead.nextStepLabel),
      status,
      ownerLabel: ownerName(state, owner) || (lead.ownerName ?? ""),
      timestampLabel: lead.lastContactedLabel ?? lead.createdAgoLabel ?? "",
      sortKey: lead.updatedAt,
      href: leadHref(lead),
    };
  });
}

function opportunityDocuments(
  state: DemoState,
  leadIndex: ReadonlyMap<string, Lead>,
): CommandCenterSearchDocument[] {
  return state.opportunities.map((opportunity) => ({
    key: `opportunity:${opportunity.id}`,
    type: "opportunity" as const,
    id: opportunity.id,
    title: opportunity.name,
    subtitle: opportunity.company,
    body: body(opportunity.service, opportunity.context, opportunity.nextAction, opportunity.priority),
    status: opportunity.stage,
    ownerLabel: ownerName(state, opportunity.ownerId),
    timestampLabel: "",
    // An opportunity carries no date of its own, so it borrows its lead's — which is the
    // instant that actually moved it. A lead the store cannot resolve sorts last rather than
    // sorting arbitrarily.
    sortKey: leadIndex.get(opportunity.leadId)?.updatedAt ?? "",
    href: listHrefWithQuery("/dashboard/pipeline", opportunity.name),
  }));
}

function taskDocuments(state: DemoState): CommandCenterSearchDocument[] {
  return state.tasks.map((task) => ({
    key: `task:${task.id}`,
    type: "task" as const,
    id: task.id,
    title: task.title,
    subtitle: task.relation?.label ?? "General task",
    body: body(task.detail, task.priority, task.waitingOn),
    status: task.state,
    ownerLabel: ownerName(state, task.ownerId),
    timestampLabel: task.dueDate,
    sortKey: task.dueDate || task.createdOn,
    href: `/dashboard/my-work/${task.id}`,
  }));
}

function meetingDocuments(state: DemoState): CommandCenterSearchDocument[] {
  return state.meetings.map((meeting) => ({
    key: `meeting:${meeting.id}`,
    type: "meeting" as const,
    id: meeting.id,
    title: meeting.name,
    subtitle: meeting.company,
    // `notes` and `outcome` are internal commentary and stay out; platform and service are
    // how people actually look a meeting up.
    body: body(meeting.service, meeting.platform),
    status: meeting.state,
    ownerLabel: ownerName(state, meeting.ownerId),
    timestampLabel: meeting.when,
    sortKey: meeting.when,
    href: `/dashboard/meetings/${meeting.id}/review`,
  }));
}

function proposalDocuments(state: DemoState): CommandCenterSearchDocument[] {
  return state.proposals.map((proposal) => ({
    key: `proposal:${proposal.id}`,
    type: "proposal" as const,
    id: proposal.id,
    title: `${proposal.id} — ${proposal.client}`,
    subtitle: proposal.leadName,
    body: body(proposal.service, proposal.version, proposal.source),
    status: proposal.state,
    ownerLabel: ownerName(state, proposal.ownerId),
    timestampLabel: proposal.lastEvent,
    sortKey: proposal.version,
    href: `/dashboard/proposals/${proposal.id}/activity`,
  }));
}

function followUpDocuments(state: DemoState): CommandCenterSearchDocument[] {
  return state.followUps.map((followUp) => ({
    key: `followUp:${followUp.id}`,
    type: "followUp" as const,
    id: followUp.id,
    title: `${followUp.type} — ${followUp.name}`,
    subtitle: followUp.company,
    body: body(followUp.suggestion, followUp.priority, followUp.stage),
    status: followUp.state,
    ownerLabel: ownerName(state, followUp.ownerId),
    timestampLabel: followUp.due,
    sortKey: followUp.dueDate,
    href: listHrefWithQuery("/dashboard/follow-ups", followUp.name),
  }));
}

function appointmentDocuments(state: DemoState): CommandCenterSearchDocument[] {
  return state.appointments.map((appointment) => ({
    key: `appointment:${appointment.id}`,
    type: "appointment" as const,
    id: appointment.id,
    title: appointment.title,
    subtitle: appointment.company,
    body: body(appointment.service, appointment.platform, appointment.detail),
    status: appointment.state,
    ownerLabel: ownerName(state, appointment.ownerId),
    timestampLabel: `${appointment.date} ${appointment.startTime}`,
    sortKey: `${appointment.date} ${appointment.startTime}`,
    href: listHrefWithQuery("/dashboard/appointments", appointment.title),
  }));
}

function emailDocuments(state: DemoState): CommandCenterSearchDocument[] {
  // `to` and `body` are absent on purpose — see the file header. The subject is what a person
  // remembers and searches for; the address and the message are not the index's business.
  return state.emails.map((email) => ({
    key: `email:${email.id}`,
    type: "email" as const,
    id: email.id,
    title: email.subject,
    subtitle: email.leadName,
    body: body(email.type, email.direction),
    status: email.state,
    ownerLabel: "",
    timestampLabel: email.sent,
    sortKey: email.sent,
    href: listHrefWithQuery("/dashboard/email-activity", email.subject),
  }));
}

function activityDocuments(state: DemoState): CommandCenterSearchDocument[] {
  const documents: CommandCenterSearchDocument[] = [];
  for (const event of state.activity) {
    // Restricted history is not indexed. Written as an allowlist rather than
    // `!== "restricted"` so a visibility added later is excluded until somebody decides it
    // belongs, rather than included because nobody remembered this line.
    if (!INDEXABLE_VISIBILITIES.has(event.visibility)) continue;
    // An event is a fact about a record, so it opens that record. An event about the
    // workspace itself has nothing to open and is not indexed.
    const href = activityHref(event.related);
    if (href === null) continue;
    documents.push({
      key: `activity:${event.id}`,
      type: "activity",
      id: event.id,
      title: event.summary,
      subtitle: event.related.label,
      // `detail` and `metadata` stay out: they are the internal specifics of a change, and the
      // index carries identity, not contents.
      body: "",
      status: event.importance,
      ownerLabel: event.actorLabel,
      timestampLabel: event.occurredAt,
      sortKey: event.occurredAt,
      href,
    });
  }
  return documents;
}

// ---------------------------------------------------------------------------
// The index
// ---------------------------------------------------------------------------

/**
 * Build the whole index from a demo state.
 *
 * Order is fixed — leads, pipeline, tasks, meetings, proposals, follow-ups, appointments,
 * communications, activity — because `searchDocuments` breaks a full tie on document key and a
 * stable input makes that last tie-break reproducible rather than merely defined.
 */
export function buildDemoSearchIndex(
  state: DemoState,
  leads: readonly Lead[] = LEAD_DIRECTORY,
): CommandCenterSearchDocument[] {
  const leadIndex = new Map(leads.map((lead) => [lead.id, lead]));
  return [
    ...leadDocuments(state, leads),
    ...opportunityDocuments(state, leadIndex),
    ...taskDocuments(state),
    ...meetingDocuments(state),
    ...proposalDocuments(state),
    ...followUpDocuments(state),
    ...appointmentDocuments(state),
    ...emailDocuments(state),
    ...activityDocuments(state),
  ];
}

/** Everything the consistency checks need to decide whether a document points at something
 *  real: the id universe per type, and the routes this application implements. */
export function demoSearchUniverse(
  state: DemoState,
  leads: readonly Lead[] = LEAD_DIRECTORY,
): SearchIndexUniverse {
  const ids = new Map<SearchEntityType, ReadonlySet<string>>([
    ["lead", new Set(leads.map((lead) => lead.id))],
    ["opportunity", new Set(state.opportunities.map((record) => record.id))],
    ["task", new Set(state.tasks.map((record) => record.id))],
    ["meeting", new Set(state.meetings.map((record) => record.id))],
    ["proposal", new Set(state.proposals.map((record) => record.id))],
    ["followUp", new Set(state.followUps.map((record) => record.id))],
    ["appointment", new Set(state.appointments.map((record) => record.id))],
    ["email", new Set(state.emails.map((record) => record.id))],
    ["activity", new Set(state.activity.map((record) => record.id))],
  ]);
  return { ids, routes: SEARCH_ROUTE_PATTERNS };
}
