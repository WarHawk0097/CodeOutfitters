// Deterministic seeded activity history.
//
// The demo opens with a history because a Command Center with an empty timeline teaches a
// visitor nothing about what the timeline is for. Everything here is FIXTURE: no customer,
// no production record, no clock and no random source. The same session replays to the same
// events in the same order on every visit, which is what lets the tests assert exact ids and
// exact instants.
//
// Two rules the fixtures are built to satisfy, and that lib/activity/model.ts
// `validateActivityConsistency` re-checks in the test suite:
//
//   1. every `related` and `parent` id is a record that actually exists in the seed;
//   2. nothing happens to a record before the record exists — a lead's history opens with
//      its creation, and a proposal is never reviewed on a day before it was written.
//
// Client actions ARE represented, but never authored: every client event below is derived
// from the access fixtures (a link's openCount, a response's respondedAt), so the timeline
// cannot claim a client did something the access record does not hold. What still does not
// appear is a certified electronic signature — see UNSUPPORTED_CLIENT_EVENT_TYPES in
// lib/activity/model.ts.
import {
  categoryOf,
  defaultImportance,
  type ActivityEvent,
  type ActivityEventType,
  type ActivityMetadata,
  type ActivityRef,
} from "@/lib/activity/model";
import type {
  Appointment,
  EmailActivity,
  FollowUp,
  Meeting,
  Opportunity,
  Proposal,
  Task,
  TeamMember,
} from "./types";
import type { Lead } from "@command-center/contracts";
import type {
  ProposalAccessLink,
  ProposalClientResponse,
  ProposalPublication,
} from "@/lib/proposals/access/model";

const DAY_MS = 86_400_000;

/** A calendar day a fixed number of days before the demo's reference day.
 *
 *  Date.UTC arithmetic on the parts of an authored YYYY-MM-DD, never the wall clock: the
 *  demo has exactly one "today" (DEMO_TODAY) and every fixture is positioned relative to it,
 *  so the history stays the same distance from today no matter when it is opened. */
function daysBefore(today: string, days: number): string {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - days * DAY_MS).toISOString().slice(0, 10);
}

/** An instant on a given day. Authored hours, so the timeline reads like a working day
 *  rather than a row of identical timestamps. */
function at(day: string, hour: number, minute: number): string {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${day}T${hh}:${mm}:00.000Z`;
}

type Draft = {
  type: ActivityEventType;
  occurredAt: string;
  summary: string;
  detail?: string;
  related: ActivityRef;
  parent?: ActivityRef | null;
  metadata?: ActivityMetadata;
  actorId: string;
  /** Set only for events a CLIENT produced. A client has no team-member id, so the label
   *  cannot be resolved from the directory — and attributing their action to whichever
   *  colleague happens to be in `actorId` would put a name on a decision that was not theirs.
   *  When this is present the event carries a null actorId and this label. */
  actorLabel?: string;
};

export type ActivitySeedInput = {
  today: string;
  team: readonly TeamMember[];
  leads: readonly Lead[];
  opportunities: readonly Opportunity[];
  appointments: readonly Appointment[];
  meetings: readonly Meeting[];
  proposals: readonly Proposal[];
  followUps: readonly FollowUp[];
  tasks: readonly Task[];
  emails: readonly EmailActivity[];
  publications: readonly ProposalPublication[];
  accessLinks: readonly ProposalAccessLink[];
  clientResponses: readonly ProposalClientResponse[];
};

/** How many leads open with a full history. The demo does not need all 128 narrated — a
 *  handful of deep histories shows what the timeline does, and 128 shallow ones would push
 *  every interesting event past the store's 200-event cap. */
const NARRATED_LEADS = 8;

export function buildActivityEvents(input: ActivitySeedInput): ActivityEvent[] {
  const { today, team, leads } = input;
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const ownerName = (id: string) => team.find((member) => member.id === id)?.name ?? "Unassigned";

  const leadRef = (leadId: string): ActivityRef => ({
    kind: "lead",
    id: leadId,
    label: leadById.get(leadId)?.name ?? "Lead",
  });

  // Only leads the demo actually has records for get narrated. A lead with no meeting, no
  // proposal and no task has no history to tell, and inventing one would be the fabrication
  // this file exists to avoid.
  const recordCount = new Map<string, number>();
  const bump = (leadId: string) => recordCount.set(leadId, (recordCount.get(leadId) ?? 0) + 1);
  for (const meeting of input.meetings) bump(meeting.leadId);
  for (const proposal of input.proposals) bump(proposal.leadId);
  for (const followUp of input.followUps) bump(followUp.leadId);
  for (const appointment of input.appointments) bump(appointment.leadId);

  const narrated = [...recordCount.entries()]
    .filter(([leadId]) => leadById.has(leadId))
    // Richest histories first, then by id so the choice never depends on map order.
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, NARRATED_LEADS)
    .map(([leadId]) => leadId);

  const rank = new Map(narrated.map((leadId, index) => [leadId, index]));
  const included = (leadId: string | null | undefined): boolean =>
    leadId != null && rank.has(leadId);

  /** The day a lead arrived. Older leads are further back, so the board's later-stage work
   *  has had time to happen and the timeline spans real days rather than one afternoon. */
  const arrivalDay = (leadId: string): string => daysBefore(today, 44 - (rank.get(leadId) ?? 0) * 5);

  const drafts: Draft[] = [];

  for (const leadId of narrated) {
    const lead = leadById.get(leadId);
    if (!lead) continue;
    const day = arrivalDay(leadId);
    const owner = input.opportunities.find((o) => o.leadId === leadId)?.ownerId ?? team[0].id;
    drafts.push({
      type: "lead_created",
      occurredAt: at(day, 9, 5),
      summary: `${lead.name} arrived from ${lead.sourcePage ?? "the website"}`,
      related: leadRef(leadId),
      actorId: owner,
      metadata: lead.serviceInterest ? [{ label: "Service", value: lead.serviceInterest }] : [],
    });
    drafts.push({
      type: "lead_assigned",
      occurredAt: at(day, 9, 40),
      summary: `${lead.name} assigned to ${ownerName(owner)}`,
      related: leadRef(leadId),
      actorId: owner,
      metadata: [{ label: "Owner", value: ownerName(owner) }],
    });
  }

  for (const opportunity of input.opportunities) {
    if (!included(opportunity.leadId)) continue;
    const day = daysBefore(arrivalDay(opportunity.leadId), -1);
    drafts.push({
      type: "opportunity_created",
      occurredAt: at(day, 11, 20),
      summary: `${opportunity.name} opened on the board`,
      related: { kind: "opportunity", id: opportunity.id, label: opportunity.name },
      parent: leadRef(opportunity.leadId),
      actorId: opportunity.ownerId,
      metadata: [
        { label: "Stage", value: opportunity.stage },
        { label: "Service", value: opportunity.service },
      ],
    });
  }

  for (const appointment of input.appointments) {
    if (!included(appointment.leadId)) continue;
    drafts.push({
      type: "appointment_booked",
      occurredAt: at(daysBefore(appointment.date, 6), 14, 10),
      summary: `${appointment.title} booked for ${appointment.date}`,
      related: { kind: "appointment", id: appointment.id, label: appointment.title },
      parent: leadRef(appointment.leadId),
      actorId: appointment.ownerId,
      metadata: [
        { label: "When", value: `${appointment.date} ${appointment.startTime}` },
        { label: "Platform", value: appointment.platform },
      ],
    });
    if (appointment.state === "no_show") {
      drafts.push({
        type: "appointment_cancelled",
        occurredAt: at(appointment.date, 17, 30),
        summary: `${appointment.title} — nobody joined`,
        related: { kind: "appointment", id: appointment.id, label: appointment.title },
        parent: leadRef(appointment.leadId),
        actorId: appointment.ownerId,
      });
    }
  }

  for (const meeting of input.meetings) {
    if (!included(meeting.leadId)) continue;
    // A meeting's own day is authored as a display string ("Apr 24, 10:00"), so the fixture
    // anchors to the lead's arrival instead of parsing a label that was written to be read.
    const scheduled = daysBefore(arrivalDay(meeting.leadId), -3);
    const held = daysBefore(arrivalDay(meeting.leadId), -8);
    const ref: ActivityRef = { kind: "meeting", id: meeting.id, label: meeting.name };
    drafts.push({
      type: "meeting_scheduled",
      occurredAt: at(scheduled, 10, 15),
      summary: `${meeting.name} scheduled`,
      related: ref,
      parent: leadRef(meeting.leadId),
      actorId: meeting.ownerId,
      metadata: [
        { label: "When", value: meeting.when },
        { label: "Platform", value: meeting.platform },
      ],
    });
    if (meeting.state === "COMPLETED" || meeting.state === "NEEDS REVIEW") {
      drafts.push({
        type: "meeting_completed",
        occurredAt: at(held, 11, 5),
        summary: `${meeting.name} held`,
        detail: meeting.outcome,
        related: ref,
        parent: leadRef(meeting.leadId),
        actorId: meeting.ownerId,
      });
      if (meeting.transcript) {
        drafts.push({
          type: "meeting_transcript_available",
          occurredAt: at(held, 11, 40),
          summary: `Transcript ready for ${meeting.name}`,
          related: ref,
          parent: leadRef(meeting.leadId),
          actorId: meeting.ownerId,
          metadata: [{ label: "Transcript", value: meeting.transcript }],
        });
      }
    }
    if (meeting.state === "COMPLETED" && meeting.outcome) {
      drafts.push({
        type: "meeting_decision_recorded",
        occurredAt: at(held, 12, 15),
        summary: `Decision recorded — ${meeting.name}`,
        detail: meeting.outcome,
        related: ref,
        parent: leadRef(meeting.leadId),
        actorId: meeting.ownerId,
      });
    }
    if (meeting.state === "FAILED · NO-SHOW") {
      drafts.push({
        type: "meeting_cancelled",
        occurredAt: at(held, 10, 30),
        summary: `${meeting.name} — nobody joined`,
        related: ref,
        parent: leadRef(meeting.leadId),
        actorId: meeting.ownerId,
      });
    }
  }

  for (const proposal of input.proposals) {
    if (!included(proposal.leadId)) continue;
    const written = daysBefore(arrivalDay(proposal.leadId), -12);
    const ref: ActivityRef = {
      kind: "proposal",
      id: proposal.id,
      label: `${proposal.id} · ${proposal.client}`,
    };
    drafts.push({
      type: "proposal_created",
      occurredAt: at(written, 15, 20),
      summary: `${proposal.id} drafted for ${proposal.client}`,
      related: ref,
      parent: leadRef(proposal.leadId),
      actorId: proposal.ownerId,
      metadata: [
        { label: "Version", value: proposal.version },
        { label: "Service", value: proposal.service },
      ],
    });
    // The state the proposal is actually in, told as the step that put it there. Nothing is
    // narrated past the current state, so the timeline and the record never disagree.
    if (proposal.state !== "DRAFT") {
      drafts.push({
        type: "proposal_review_requested",
        occurredAt: at(daysBefore(written, -1), 9, 30),
        summary: `${proposal.id} sent for internal review`,
        related: ref,
        parent: leadRef(proposal.leadId),
        actorId: proposal.ownerId,
      });
    }
    if (proposal.state === "APPROVED") {
      drafts.push({
        type: "proposal_review_approved",
        occurredAt: at(daysBefore(written, -2), 16, 45),
        summary: `${proposal.id} approved internally`,
        related: ref,
        parent: leadRef(proposal.leadId),
        actorId: proposal.ownerId,
      });
    }
    if (proposal.state === "CHANGES REQUESTED") {
      drafts.push({
        type: "proposal_review_rejected",
        occurredAt: at(daysBefore(written, -2), 12, 0),
        summary: `${proposal.id} sent back with changes requested`,
        detail: proposal.lastEvent,
        related: ref,
        parent: leadRef(proposal.leadId),
        actorId: proposal.ownerId,
      });
    }
    // States past internal review — SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED — are recorded
    // on the proposal itself and are NOT narrated as events here. The demo has no secure
    // client proposal route, so it cannot observe a client opening, accepting or declining
    // anything, and an event claiming otherwise would be an invented client action. The
    // status change is stated as a status change, with no actor attributed to the client.
    if (proposal.state !== "DRAFT" && proposal.state !== "INTERNAL REVIEW") {
      drafts.push({
        type: "proposal_status_changed",
        occurredAt: at(daysBefore(written, -4), 9, 15),
        summary: `${proposal.id} is ${proposal.state.toLowerCase()}`,
        detail: proposal.lastEvent,
        related: ref,
        parent: leadRef(proposal.leadId),
        actorId: proposal.ownerId,
        metadata: [{ label: "Status", value: proposal.state }],
      });
    }
  }

  for (const followUp of input.followUps) {
    if (!included(followUp.leadId)) continue;
    const created = daysBefore(followUp.dueDate, 5);
    const ref: ActivityRef = {
      kind: "followUp",
      id: followUp.id,
      label: `${followUp.name} — ${followUp.type}`,
    };
    drafts.push({
      type: "follow_up_created",
      occurredAt: at(created, 13, 25),
      summary: `${followUp.type} scheduled for ${followUp.name}`,
      detail: followUp.suggestion,
      related: ref,
      parent: leadRef(followUp.leadId),
      actorId: followUp.ownerId,
      metadata: [{ label: "Due", value: followUp.dueDate }],
    });
    if (followUp.state === "COMPLETED") {
      drafts.push({
        type: "follow_up_completed",
        occurredAt: at(followUp.dueDate, 16, 20),
        summary: `${followUp.type} completed for ${followUp.name}`,
        related: ref,
        parent: leadRef(followUp.leadId),
        actorId: followUp.ownerId,
      });
    }
  }

  // The Release 1 task collection. Every task the demo opens with says where it came from,
  // so a lead's timeline shows the work as well as the correspondence.
  for (const task of input.tasks) {
    const parent: ActivityRef | null = included(task.leadId)
      ? leadRef(task.leadId as string)
      : null;
    if (!parent) continue;
    const ref: ActivityRef = { kind: "task", id: task.id, label: task.title };
    drafts.push({
      type: "task_created",
      occurredAt: at(task.createdOn, 8, 45),
      summary: `Task created — ${task.title}`,
      detail: task.detail,
      related: ref,
      parent,
      actorId: task.ownerId,
      metadata: task.dueDate ? [{ label: "Due", value: task.dueDate }] : [],
    });
    if (task.state === "COMPLETED" && task.completedOn) {
      drafts.push({
        type: "task_completed",
        occurredAt: at(task.completedOn, 17, 10),
        summary: `Task completed — ${task.title}`,
        related: ref,
        parent,
        actorId: task.ownerId,
      });
    }
    if (task.state === "WAITING" && task.waitingOn) {
      drafts.push({
        type: "task_waiting_changed",
        occurredAt: at(task.createdOn, 15, 30),
        summary: `Waiting on ${task.waitingOn} — ${task.title}`,
        related: ref,
        parent,
        actorId: task.ownerId,
        metadata: [{ label: "Waiting on", value: task.waitingOn }],
      });
    }
  }

  for (const email of input.emails) {
    if (!included(email.leadId)) continue;
    drafts.push({
      type: "email_activity_recorded",
      occurredAt: at(daysBefore(arrivalDay(email.leadId), -6), 12, 35),
      summary:
        email.direction === "inbound"
          ? `Reply received — ${email.subject}`
          : `Email sent — ${email.subject}`,
      related: { kind: "email", id: email.id, label: email.subject },
      parent: leadRef(email.leadId),
      actorId: email.direction === "inbound" ? team[0].id : team[0].id,
      metadata: [{ label: "Status", value: email.state }],
    });
  }

  // ── Secure client access ────────────────────────────────────────────────────────────────
  //
  // Derived entirely from the access fixtures rather than authored a second time. A timeline
  // that said a client opened a proposal on a day the link says they did not is the exact
  // contradiction this whole file is written to avoid, so every instant below is read off the
  // record it describes.
  const proposalById = new Map(input.proposals.map((proposal) => [proposal.id, proposal]));
  const publicationById = new Map(input.publications.map((p) => [p.id, p]));

  const proposalRefFor = (internalProposalId: string): ActivityRef | null => {
    const proposal = proposalById.get(internalProposalId);
    return proposal
      ? { kind: "proposal", id: proposal.id, label: `${proposal.id} · ${proposal.client}` }
      : null;
  };
  const proposalParent = (internalProposalId: string): ActivityRef | null => {
    const proposal = proposalById.get(internalProposalId);
    return proposal ? leadRef(proposal.leadId) : null;
  };

  for (const publication of input.publications) {
    const related = proposalRefFor(publication.internalProposalId);
    if (!related) continue;
    drafts.push({
      type: "proposal_published",
      occurredAt: publication.publishedAt,
      summary: `${publication.internalProposalId} ${publication.versionLabel} published for client access`,
      related,
      parent: proposalParent(publication.internalProposalId),
      actorId: publication.publishedByUserId,
      metadata: [{ label: "Version", value: publication.versionLabel }],
    });

    // The supersede event is dated by the version that replaced it, not by the one replaced:
    // a version is superseded at the moment its successor is published.
    const successor = publication.supersededByPublicationId
      ? publicationById.get(publication.supersededByPublicationId)
      : undefined;
    if (successor) {
      drafts.push({
        type: "proposal_superseded",
        occurredAt: successor.publishedAt,
        summary: `${publication.internalProposalId} ${publication.versionLabel} superseded by ${successor.versionLabel}`,
        related,
        parent: proposalParent(publication.internalProposalId),
        actorId: successor.publishedByUserId,
        metadata: [
          { label: "Superseded", value: publication.versionLabel },
          { label: "Current", value: successor.versionLabel },
        ],
      });
    }
  }

  for (const link of input.accessLinks) {
    const publication = publicationById.get(link.publicationId);
    if (!publication) continue;
    const related = proposalRefFor(publication.internalProposalId);
    if (!related) continue;
    const parent = proposalParent(publication.internalProposalId);
    // The token is not on any of these events, here or anywhere else. An activity log is read
    // by more people than a proposal is, and a link recorded in one is a link that leaked.
    const recipient = [{ label: "Recipient", value: link.recipientName }];

    drafts.push({
      type: link.replacesAccessLinkId ? "proposal_access_link_replaced" : "proposal_access_link_created",
      occurredAt: link.createdAt,
      summary: link.replacesAccessLinkId
        ? `Client access for ${link.recipientName} reissued on ${publication.internalProposalId}`
        : `Client access granted to ${link.recipientName} on ${publication.internalProposalId}`,
      related,
      parent,
      actorId: link.createdByUserId,
      metadata: recipient,
    });

    if (link.revokedAt && link.revokedByUserId) {
      drafts.push({
        type: "proposal_access_link_revoked",
        occurredAt: link.revokedAt,
        summary: `Client access revoked for ${link.recipientName} on ${publication.internalProposalId}`,
        related,
        parent,
        actorId: link.revokedByUserId,
        metadata: recipient,
      });
    }

    if (link.firstOpenedAt) {
      drafts.push({
        type: "proposal_first_opened_by_client",
        occurredAt: link.firstOpenedAt,
        summary: `${link.recipientName} opened ${publication.internalProposalId} for the first time`,
        related,
        parent,
        actorId: "",
        actorLabel: link.recipientName,
        metadata: [{ label: "Version", value: publication.versionLabel }],
      });
    }

    // Only the most recent reopen is narrated, because the most recent is the only other
    // instant the record holds. The timeline does not claim to list every open — the total
    // is stated on the event, and the link is where the count lives.
    if (link.lastOpenedAt && link.lastOpenedAt !== link.firstOpenedAt) {
      drafts.push({
        type: "proposal_opened_by_client",
        occurredAt: link.lastOpenedAt,
        summary: `${link.recipientName} reopened ${publication.internalProposalId}`,
        detail: `Most recent of ${link.openCount} opens recorded on this link.`,
        related,
        parent,
        actorId: "",
        actorLabel: link.recipientName,
        metadata: [{ label: "Opens", value: String(link.openCount) }],
      });
    }
  }

  const linkById = new Map(input.accessLinks.map((link) => [link.id, link]));
  const CLIENT_RESPONSE_EVENT = {
    question: "client_question_submitted",
    comment: "client_comment_submitted",
    acceptance: "proposal_accepted_by_client",
    decline: "proposal_declined_by_client",
  } as const;

  for (const response of input.clientResponses) {
    const link = linkById.get(response.accessLinkId);
    const publication = publicationById.get(response.publicationId);
    if (!link || !publication) continue;
    const related = proposalRefFor(publication.internalProposalId);
    if (!related) continue;
    const verb =
      response.responseType === "question" ? "asked a question on"
      : response.responseType === "comment" ? "commented on"
      : response.responseType === "acceptance" ? "accepted"
      : "declined";
    drafts.push({
      type: CLIENT_RESPONSE_EVENT[response.responseType],
      occurredAt: response.respondedAt,
      summary: `${link.recipientName} ${verb} ${publication.internalProposalId}`,
      // The client's own words. A question the workspace cannot read is a notification, not
      // activity.
      detail: response.message,
      related,
      parent: proposalParent(publication.internalProposalId),
      actorId: "",
      actorLabel: link.recipientName,
      metadata: [{ label: "Version", value: publication.versionLabel }],
    });
  }

  // Ids are minted last, in chronological order, so act-0001 is the oldest thing that
  // happened. A fixture inserted in the middle later renumbers the ones after it — which is
  // correct for a fixture and is exactly why nothing outside the tests hard-codes an id.
  return drafts
    .slice()
    .sort((a, b) => (a.occurredAt === b.occurredAt ? 0 : a.occurredAt < b.occurredAt ? -1 : 1))
    .map((draft, index) => {
      const client = draft.actorLabel !== undefined;
      const actor = client ? null : team.find((member) => member.id === draft.actorId) ?? null;
      const event: ActivityEvent = {
        id: `act-${String(index + 1).padStart(4, "0")}`,
        type: draft.type,
        category: categoryOf(draft.type),
        source: "demo_fixture",
        // A client wrote it, so a client may be shown it. Everything else here is internal.
        visibility: client ? "client_safe" : "internal",
        importance: defaultImportance(draft.type),
        actorId: actor?.id ?? null,
        actorLabel: draft.actorLabel ?? actor?.name ?? "Unassigned",
        occurredAt: draft.occurredAt,
        summary: draft.summary,
        detail: draft.detail ?? "",
        related: draft.related,
        parent: draft.parent ?? null,
        metadata: draft.metadata ?? [],
      };
      return event;
    })
    .reverse();
}
