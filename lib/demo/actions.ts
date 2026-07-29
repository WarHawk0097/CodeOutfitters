// Demo mutations, grouped by domain.
//
// Every function here writes to the local demo store only (see store.ts). None of this is
// production persistence: nothing is sent anywhere, no provider is contacted, no real
// email is delivered and no real account is created.
"use client";

import { createSeedState, DEMO_CURRENT_USER_ID, DEMO_NOW, DEMO_TODAY, LEAD_DIRECTORY, stageToLeadStatus } from "./seed";
import { getDemoState, mintId, updateDemoState, withActivity, withClientActivity } from "./store";
import { buildProposalDetail } from "@/lib/command-center/proposals/fixtures";
import {
  acceptsResponses,
  buildClientSnapshot,
  decisionConflict,
  DEMO_TOKEN_PREFIX,
  grantsContentAccess,
  resolveAccessState,
  responseMessageOf,
  responseTypeOf,
  responseTypedNameOf,
  validateResponseDraft,
  type ClientResponseType,
  type ProposalAccessLink,
  type ProposalClientResponse,
  type ProposalPublication,
  type ResponseDraft,
} from "@/lib/proposals/access/model";
import type { PublicResponseRejection } from "@/lib/proposals/access/provider";
import { DEMO_WORKSPACE_ID } from "./proposal-access-seed";
import { findLinkByDemoToken, publicationById } from "./proposal-access";
import type { ActivityRef } from "@/lib/activity/model";
import type {
  Appointment,
  AppointmentState,
  DemoState,
  EmailActivity,
  FollowUp,
  FollowUpState,
  Meeting,
  MeetingState,
  Opportunity,
  PipelineStage,
  Proposal,
  ProposalState,
  Task,
  TaskPriority,
  TaskRelation,
  TaskState,
  TeamMember,
  TeamRole,
} from "./types";

function replace<T extends { id: string }>(rows: T[], id: string, patch: Partial<T>): T[] {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

const LEAD_NAMES = new Map(LEAD_DIRECTORY.map((lead) => [lead.id, lead.name]));

/** The lead a record belongs to, as an activity reference.
 *
 *  Every pipeline record carries a leadId, so passing this as the event's `parent` is what
 *  makes a proposal edit or a meeting cancellation show up on that lead's timeline without
 *  the event being written twice. */
function leadRef(leadId: string): ActivityRef {
  return { kind: "lead", id: leadId, label: LEAD_NAMES.get(leadId) ?? "Lead" };
}

/** Where a task's history rolls up to. The lead comes first because that is the record a
 *  person opens; a task with no lead still belongs to whatever it was created from, and a
 *  standalone task belongs to nothing and says so by returning null. */
function taskParent(task: Task): ActivityRef | null {
  if (task.leadId) return leadRef(task.leadId);
  if (task.relation) {
    return { kind: task.relation.kind, id: task.relation.id, label: task.relation.label };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/** Stages the canonical board gates behind a reason (CANON 205: "gated stages ask for a
 *  reason"). Same three the API requires a reason for — see REASON_REQUIRED_STATUSES in
 *  @command-center/contracts — so the board and the Leads status control agree on which
 *  transitions are terminal. */
export const REASON_GATED_STAGES: readonly PipelineStage[] = ["Won", "Lost", "FUL"];

export function stageRequiresReason(stage: PipelineStage): boolean {
  return REASON_GATED_STAGES.includes(stage);
}

/** Move an opportunity to another stage. Writes through to the lead's status and the
 *  lead's next-step label, so Leads, Overview and the board never disagree.
 *
 *  `reason` is required by the caller for a gated stage and is recorded on the activity
 *  entry, which is the only place a demo move keeps its justification. */
export function moveOpportunity(opportunityId: string, stage: PipelineStage, reason?: string): void {
  updateDemoState((current) => {
    const opportunity = current.opportunities.find((o) => o.id === opportunityId);
    if (!opportunity || opportunity.stage === stage) return current;
    return {
      ...current,
      opportunities: replace(current.opportunities, opportunityId, { stage }),
      leadOverrides: {
        ...current.leadOverrides,
        [opportunity.leadId]: {
          ...current.leadOverrides[opportunity.leadId],
          status: stageToLeadStatus(stage),
        },
      },
      ...withActivity(current, {
        type: "lead_stage_changed",
        summary: reason
          ? `${opportunity.name} moved to ${stage} — ${reason}`
          : `${opportunity.name} moved to ${stage}`,
        related: { kind: "opportunity", id: opportunityId, label: opportunity.name },
        parent: leadRef(opportunity.leadId),
        metadata: [
          { label: "From", value: opportunity.stage },
          { label: "To", value: stage },
          ...(reason ? [{ label: "Reason", value: reason }] : []),
        ],
      }),
    };
  });
}

export function updateOpportunity(opportunityId: string, patch: Partial<Opportunity>): void {
  updateDemoState((current) => {
    const opportunity = current.opportunities.find((o) => o.id === opportunityId);
    if (!opportunity) return current;
    const next = { ...current, opportunities: replace(current.opportunities, opportunityId, patch) };
    if (patch.stage && patch.stage !== opportunity.stage) {
      next.leadOverrides = {
        ...current.leadOverrides,
        [opportunity.leadId]: { ...current.leadOverrides[opportunity.leadId], status: patch.stage },
      };
    }
    if (patch.ownerId) {
      next.leadOverrides = {
        ...next.leadOverrides,
        [opportunity.leadId]: { ...next.leadOverrides[opportunity.leadId], ownerId: patch.ownerId },
      };
    }
    return {
      ...next,
      ...withActivity(current, {
        type: "opportunity_updated",
        summary: `${opportunity.name} updated`,
        related: { kind: "opportunity", id: opportunityId, label: opportunity.name },
        parent: leadRef(opportunity.leadId),
      }),
    };
  });
}

export function createOpportunity(input: Omit<Opportunity, "id">): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "opp");
    created = id;
    const activity = withActivity({ ...current, nextId }, {
      type: "opportunity_created",
      summary: `${input.name} added to ${input.stage}`,
      related: { kind: "opportunity", id, label: input.name },
      parent: leadRef(input.leadId),
      metadata: [{ label: "Stage", value: input.stage }],
    });
    return {
      ...current,
      opportunities: [{ ...input, id }, ...current.opportunities],
      leadOverrides: {
        ...current.leadOverrides,
        [input.leadId]: { ...current.leadOverrides[input.leadId], status: input.stage },
      },
      ...activity,
    };
  });
  return created;
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

/** The next-step label the Leads route shows for a lead once this appointment is written.
 *  Every appointment mutation routes through here, so Leads and Overview can never still be
 *  advertising a meeting that Appointments has already moved, cancelled or marked no-show. */
export function appointmentNextStep(appointment: Pick<Appointment, "state" | "date" | "startTime">): string {
  switch (appointment.state) {
    case "cancelled":
      return "Rebook meeting";
    case "no_show":
      return "No-show — rebook";
    case "completed":
      return "Send follow-up";
    default:
      return `Meeting ${appointment.date} ${appointment.startTime}`;
  }
}

function withAppointmentLead(current: DemoState, leadId: string, label: string): DemoState["leadOverrides"] {
  return { ...current.leadOverrides, [leadId]: { ...current.leadOverrides[leadId], nextStepLabel: label } };
}

export function createAppointment(input: Omit<Appointment, "id">): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "apt");
    created = id;
    return {
      ...current,
      appointments: [...current.appointments, { ...input, id }],
      leadOverrides: withAppointmentLead(current, input.leadId, appointmentNextStep(input)),
      ...withActivity({ ...current, nextId }, {
        type: "appointment_booked",
        summary: `Appointment booked — ${input.title}`,
        related: { kind: "appointment", id, label: input.title },
        parent: leadRef(input.leadId),
        metadata: [{ label: "When", value: `${input.date} ${input.startTime}` }],
      }),
    };
  });
  return created;
}

export function updateAppointment(id: string, patch: Partial<Appointment>): void {
  updateDemoState((current) => {
    const appointment = current.appointments.find((a) => a.id === id);
    if (!appointment) return current;
    const next = { ...appointment, ...patch };
    return {
      ...current,
      appointments: replace(current.appointments, id, patch),
      leadOverrides: withAppointmentLead(current, next.leadId, appointmentNextStep(next)),
      ...withActivity(current, {
        type: "appointment_updated",
        summary: `${appointment.title} updated`,
        related: { kind: "appointment", id, label: appointment.title },
        parent: leadRef(next.leadId),
      }),
    };
  });
}

export function rescheduleAppointment(id: string, date: string, startTime: string, endTime: string): void {
  updateDemoState((current) => {
    const appointment = current.appointments.find((a) => a.id === id);
    if (!appointment) return current;
    return {
      ...current,
      appointments: replace(current.appointments, id, { date, startTime, endTime, state: "rescheduled" as AppointmentState, detail: `Rescheduled to ${date} ${startTime}` }),
      leadOverrides: {
        ...current.leadOverrides,
        [appointment.leadId]: { ...current.leadOverrides[appointment.leadId], nextStepLabel: `Meeting ${date} ${startTime}` },
      },
      ...withActivity(current, {
        type: "appointment_rescheduled",
        summary: `${appointment.title} rescheduled to ${date} ${startTime}`,
        related: { kind: "appointment", id, label: appointment.title },
        parent: leadRef(appointment.leadId),
        metadata: [
          { label: "From", value: `${appointment.date} ${appointment.startTime}` },
          { label: "To", value: `${date} ${startTime}` },
        ],
      }),
    };
  });
}

export function cancelAppointment(id: string, reason: string): void {
  updateDemoState((current) => {
    const appointment = current.appointments.find((a) => a.id === id);
    if (!appointment) return current;
    return {
      ...current,
      appointments: replace(current.appointments, id, { state: "cancelled" as AppointmentState, detail: reason || "Cancelled" }),
      leadOverrides: withAppointmentLead(current, appointment.leadId, appointmentNextStep({ ...appointment, state: "cancelled" })),
      ...withActivity(current, {
        type: "appointment_cancelled",
        summary: `${appointment.title} cancelled`,
        detail: reason,
        related: { kind: "appointment", id, label: appointment.title },
        parent: leadRef(appointment.leadId),
      }),
    };
  });
}

// ---------------------------------------------------------------------------
// Meeting Intelligence
// ---------------------------------------------------------------------------

export function updateMeeting(id: string, patch: Partial<Meeting>): void {
  updateDemoState((current) => {
    const meeting = current.meetings.find((m) => m.id === id);
    if (!meeting) return current;
    return {
      ...current,
      meetings: replace(current.meetings, id, patch),
      ...withActivity(current, {
        type: "meeting_updated",
        summary: `${meeting.name} — meeting updated`,
        related: { kind: "meeting", id, label: meeting.name },
        parent: leadRef(meeting.leadId),
      }),
    };
  });
}

export function createMeeting(input: Omit<Meeting, "id">): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "mtg");
    created = id;
    return {
      ...current,
      meetings: [...current.meetings, { ...input, id }],
      ...withActivity({ ...current, nextId }, {
        type: "meeting_scheduled",
        summary: `Meeting added — ${input.name}`,
        related: { kind: "meeting", id, label: input.name },
        parent: leadRef(input.leadId),
        metadata: [{ label: "When", value: input.when }],
      }),
    };
  });
  return created;
}

/** Moves the meeting and, when one is linked, the appointment it was booked from — the
 *  appointment holds the real date and time, so leaving it behind would make Appointments
 *  and Meeting Intelligence disagree about the same conversation. */
export function rescheduleMeeting(
  id: string,
  next: { date: string; startTime: string; endTime: string; when: string },
): void {
  updateDemoState((current) => {
    const meeting = current.meetings.find((m) => m.id === id);
    if (!meeting) return current;
    const appointment = current.appointments.find((a) => a.id === meeting.appointmentId);
    const rescheduled = appointment
      ? { ...appointment, date: next.date, startTime: next.startTime, endTime: next.endTime, state: "rescheduled" as AppointmentState }
      : null;
    return {
      ...current,
      meetings: replace(current.meetings, id, { when: next.when, state: "READY" }),
      appointments: rescheduled ? replace(current.appointments, rescheduled.id, rescheduled) : current.appointments,
      leadOverrides: withAppointmentLead(
        current,
        meeting.leadId,
        rescheduled ? appointmentNextStep(rescheduled) : `Meeting ${next.date} ${next.startTime}`,
      ),
      ...withActivity(current, {
        type: "meeting_rescheduled",
        summary: `${meeting.name} — meeting rescheduled to ${next.when}`,
        related: { kind: "meeting", id, label: meeting.name },
        parent: leadRef(meeting.leadId),
        metadata: [
          { label: "From", value: meeting.when },
          { label: "To", value: next.when },
        ],
      }),
    };
  });
}

export function cancelMeeting(id: string, reason: string): void {
  updateDemoState((current) => {
    const meeting = current.meetings.find((m) => m.id === id);
    if (!meeting) return current;
    const appointment = current.appointments.find((a) => a.id === meeting.appointmentId);
    return {
      ...current,
      meetings: replace(current.meetings, id, { state: "CANCELLED" as MeetingState, notes: reason }),
      appointments: appointment
        ? replace(current.appointments, appointment.id, { state: "cancelled" as AppointmentState, detail: reason })
        : current.appointments,
      leadOverrides: withAppointmentLead(current, meeting.leadId, "Rebook meeting"),
      ...withActivity(current, {
        type: "meeting_cancelled",
        summary: `${meeting.name} — meeting cancelled`,
        related: { kind: "meeting", id, label: meeting.name },
        parent: leadRef(meeting.leadId),
      }),
    };
  });
}

export function completeMeeting(id: string, outcome: string, notes: string): void {
  updateDemoState((current) => {
    const meeting = current.meetings.find((m) => m.id === id);
    if (!meeting) return current;
    return {
      ...current,
      meetings: replace(current.meetings, id, { state: "COMPLETED", outcome, notes, crm: "Applied" }),
      leadOverrides: {
        ...current.leadOverrides,
        [meeting.leadId]: { ...current.leadOverrides[meeting.leadId], nextStepLabel: outcome || "Meeting complete" },
      },
      ...withActivity(current, {
        type: "meeting_completed",
        summary: `${meeting.name} — meeting marked complete`,
        related: { kind: "meeting", id, label: meeting.name },
        parent: leadRef(meeting.leadId),
      }),
    };
  });
}

// ---------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------

const PROPOSAL_EVENT: Partial<Record<ProposalState, string>> = {
  SENT: "Sent in demo mode — no email was delivered",
  ACCEPTED: "Marked accepted",
  REJECTED: "Marked declined",
  ARCHIVED: "Archived",
  "INTERNAL REVIEW": "Sent for internal review",
  APPROVED: "Approved",
};

/** Move a proposal to a new state and carry the pipeline with it.
 *
 *  Pure, and shared with the secure-client path: a proposal accepted by a client on the public
 *  route and one marked accepted by a colleague must land the opportunity in the same place.
 *  Two copies of this transition would be two chances for the pipeline to disagree with the
 *  proposal it is supposed to be tracking. */
function applyProposalState(
  current: DemoState,
  proposal: Proposal,
  next: ProposalState,
  lastEvent: string,
): DemoState {
  const state: DemoState = {
    ...current,
    proposals: replace(current.proposals, proposal.id, { state: next, lastEvent }),
  };
  // Accepting or declining a proposal is a pipeline event, so the linked opportunity and
  // the lead follow it.
  const stage: PipelineStage | null = next === "ACCEPTED" ? "Won" : next === "REJECTED" ? "Lost" : next === "SENT" ? "Proposal Sent" : null;
  if (stage && proposal.opportunityId) {
    state.opportunities = replace(current.opportunities, proposal.opportunityId, { stage });
    state.leadOverrides = { ...current.leadOverrides, [proposal.leadId]: { ...current.leadOverrides[proposal.leadId], status: stage } };
  }
  return state;
}

export function setProposalState(id: string, next: ProposalState): void {
  updateDemoState((current) => {
    const proposal = current.proposals.find((p) => p.id === id);
    if (!proposal) return current;
    const lastEvent = PROPOSAL_EVENT[next] ?? `Moved to ${next}`;
    const state = applyProposalState(current, proposal, next, lastEvent);
    return {
      ...state,
      ...withActivity(current, {
        type: "proposal_status_changed",
        summary: `${id} · ${proposal.client} — ${lastEvent}`,
        related: { kind: "proposal", id, label: `${id} · ${proposal.client}` },
        parent: leadRef(proposal.leadId),
        metadata: [
          { label: "From", value: proposal.state },
          { label: "To", value: next },
        ],
      }),
    };
  });
}

export function updateProposal(id: string, patch: Partial<Proposal>): void {
  updateDemoState((current) => {
    const proposal = current.proposals.find((p) => p.id === id);
    if (!proposal) return current;
    return {
      ...current,
      proposals: replace(current.proposals, id, patch),
      ...withActivity(current, {
        type: "proposal_edited",
        summary: `${id} updated`,
        related: { kind: "proposal", id, label: `${id} · ${proposal.client}` },
        parent: leadRef(proposal.leadId),
      }),
    };
  });
}

export function createProposal(input: Omit<Proposal, "id">): string {
  let created = "";
  updateDemoState((current) => {
    const highest = current.proposals.reduce((max, p) => {
      const n = Number(p.id.replace(/\D/g, ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 2000);
    const id = `PRO-${highest + 1}`;
    created = id;
    return {
      ...current,
      proposals: [{ ...input, id }, ...current.proposals],
      ...withActivity(current, {
        type: "proposal_created",
        summary: `${id} · ${input.client} created`,
        related: { kind: "proposal", id, label: `${id} · ${input.client}` },
        parent: leadRef(input.leadId),
        metadata: [{ label: "Version", value: input.version }],
      }),
    };
  });
  return created;
}

export function duplicateProposal(id: string): string {
  const source = getDemoState().proposals.find((p) => p.id === id);
  if (!source) return "";
  const version = `v${Number(source.version.replace(/\D/g, "") || 1) + 1}`;
  return createProposal({ ...source, version, state: "DRAFT", lastEvent: "Duplicated just now", source: `Revision of ${source.version}` });
}

// ---------------------------------------------------------------------------
// Secure client access
//
// Publishing, issuing links, revoking them, and everything a client does on the public route.
// All of it writes to the local demo store and nowhere else — no email is delivered, no link
// is transmitted, and no PDF is produced. The screens say so where a person can read it.
// ---------------------------------------------------------------------------

/** Demo link tokens are minted from the same monotonic counter as every other demo id, so a
 *  session replays identically. They are not secrets and are not generated the way live
 *  tokens are: a live token is 32 bytes of CSPRNG output produced server-side
 *  (lib/proposals/access/token.ts), and nothing in this browser can produce one. */
function mintDemoToken(current: DemoState): { token: string; id: string; nextId: number } {
  const { id, nextId } = mintId(current, "lnk");
  return { token: `${DEMO_TOKEN_PREFIX}${id}`, id, nextId };
}

/** Deterministic date arithmetic on an authored instant. Not a clock read: the input is
 *  always DEMO_NOW or another fixture instant, so the output is the same on every run. */
function addDays(iso: string, days: number): string {
  const shifted = new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000);
  return shifted.toISOString();
}

export const DEMO_LINK_DEFAULT_DAYS = 30;

export type PublishResult =
  | { ok: true; publicationId: string }
  | { ok: false; reason: string };

/** Publish the current version of a proposal as an immutable client-safe snapshot.
 *
 *  A proposal that fails its own validation cannot be published, and the reason returned is
 *  the validation's own blocking reason rather than a generic failure — the staff member is
 *  inside the workspace and is entitled to know exactly what is wrong. (A client is not; the
 *  public route never surfaces any of this.)
 *
 *  Publishing again supersedes the previous version instead of editing it. The document a
 *  client was sent stays exactly as it was sent, because that is the only version of events
 *  they can be held to. */
export function publishProposal(proposalId: string): PublishResult {
  let result: PublishResult = { ok: false, reason: "That proposal is no longer available." };
  updateDemoState((current) => {
    const proposal = current.proposals.find((p) => p.id === proposalId);
    if (!proposal) return current;

    const detail = buildProposalDetail(proposal);
    if (detail.blockedReason) {
      result = { ok: false, reason: detail.blockedReason };
      return current;
    }

    const existing = current.publications.filter((p) => p.internalProposalId === proposalId);
    const previous = existing.reduce<ProposalPublication | null>(
      (latest, p) => (latest && latest.versionNumber >= p.versionNumber ? latest : p),
      null,
    );

    const { id, nextId } = mintId(current, "pub");
    const publication: ProposalPublication = {
      id,
      workspaceId: DEMO_WORKSPACE_ID,
      internalProposalId: proposalId,
      versionNumber: (previous?.versionNumber ?? 0) + 1,
      versionLabel: proposal.version,
      title: detail.title,
      clientOrganisation: proposal.client,
      status: "published",
      publishedAt: DEMO_NOW,
      publishedByUserId: DEMO_CURRENT_USER_ID,
      publishedByLabel: current.team.find((m) => m.id === DEMO_CURRENT_USER_ID)?.name ?? "You",
      supersededByPublicationId: null,
      snapshot: buildClientSnapshot({ detail, clientOrganisation: proposal.client }),
    };
    result = { ok: true, publicationId: id };

    const publications = current.publications.map((p) =>
      p.internalProposalId === proposalId && p.status === "published"
        ? { ...p, status: "superseded" as const, supersededByPublicationId: id }
        : p,
    );

    const related: ActivityRef = { kind: "proposal", id: proposalId, label: `${proposalId} · ${proposal.client}` };
    const withPublish = withActivity({ ...current, nextId }, {
      type: "proposal_published",
      summary: `${proposalId} ${proposal.version} published for client access`,
      detail: "Published in demo mode — nothing was delivered to the client.",
      related,
      parent: leadRef(proposal.leadId),
      metadata: [
        { label: "Version", value: proposal.version },
        { label: "Sections", value: String(publication.snapshot.sections.length) },
      ],
    });

    if (!previous) {
      return { ...current, publications: [...publications, publication], ...withPublish };
    }
    // Superseding is its own event: a client holding the old link needs somebody in the
    // workspace to know their version was replaced, and "published v3" does not say that.
    const withSupersede = withActivity(
      { ...current, nextId: withPublish.nextId, activity: withPublish.activity },
      {
        type: "proposal_superseded",
        summary: `${proposalId} ${previous.versionLabel} superseded by ${proposal.version}`,
        related,
        parent: leadRef(proposal.leadId),
        metadata: [
          { label: "Superseded", value: previous.versionLabel },
          { label: "Current", value: proposal.version },
        ],
      },
    );
    return { ...current, publications: [...publications, publication], ...withSupersede };
  });
  return result;
}

export type CreateLinkInput = {
  publicationId: string;
  recipientName: string;
  recipientEmail: string;
  expiresInDays?: number;
  replacesAccessLinkId?: string;
};

export type CreateLinkResult =
  | { ok: true; linkId: string; token: string }
  | { ok: false; reason: string };

/** Issue a secure access link to one named recipient.
 *
 *  One link per recipient, always — a shared link cannot be revoked for one person without
 *  revoking it for everybody, and cannot say who opened it. When this replaces an existing
 *  link, the old one is revoked in the same operation so there is never a window where both
 *  are live. */
export function createProposalAccessLink(input: CreateLinkInput): CreateLinkResult {
  let result: CreateLinkResult = { ok: false, reason: "That published version is no longer available." };
  updateDemoState((current) => {
    const publication = current.publications.find((p) => p.id === input.publicationId);
    if (!publication) return current;
    const proposal = current.proposals.find((p) => p.id === publication.internalProposalId);
    if (!proposal) return current;

    const { token, id, nextId } = mintDemoToken(current);
    const replaced = input.replacesAccessLinkId
      ? current.accessLinks.find((link) => link.id === input.replacesAccessLinkId) ?? null
      : null;

    const link: ProposalAccessLink = {
      id,
      publicationId: publication.id,
      workspaceId: DEMO_WORKSPACE_ID,
      recipientName: input.recipientName.trim(),
      recipientEmail: input.recipientEmail.trim(),
      tokenHash: "",
      demoToken: token,
      expiresAt: addDays(DEMO_NOW, input.expiresInDays ?? DEMO_LINK_DEFAULT_DAYS),
      createdAt: DEMO_NOW,
      createdByUserId: DEMO_CURRENT_USER_ID,
      revokedAt: null,
      revokedByUserId: null,
      firstOpenedAt: null,
      lastOpenedAt: null,
      openCount: 0,
      decision: "none",
      decidedAt: null,
      decidedByName: null,
      replacesAccessLinkId: replaced?.id ?? null,
      replacedByAccessLinkId: null,
    };
    result = { ok: true, linkId: id, token };

    const accessLinks = current.accessLinks.map((existing) =>
      existing.id === replaced?.id
        ? {
            ...existing,
            revokedAt: DEMO_NOW,
            revokedByUserId: DEMO_CURRENT_USER_ID,
            replacedByAccessLinkId: id,
          }
        : existing,
    );

    const related: ActivityRef = {
      kind: "proposal",
      id: proposal.id,
      label: `${proposal.id} · ${proposal.client}`,
    };
    const activity = withActivity({ ...current, nextId }, {
      type: replaced ? "proposal_access_link_replaced" : "proposal_access_link_created",
      summary: replaced
        ? `Client access for ${link.recipientName} reissued on ${proposal.id}`
        : `Client access granted to ${link.recipientName} on ${proposal.id}`,
      detail: "The link was created in this browser. Nothing was emailed.",
      related,
      parent: leadRef(proposal.leadId),
      // The token is not recorded on the event, in demo or anywhere else. An activity log is
      // read by more people than a proposal is, and a link in it is a link that leaked.
      metadata: [
        { label: "Recipient", value: link.recipientName },
        { label: "Version", value: publication.versionLabel },
      ],
    });

    // A published proposal a client can now reach has been sent, whatever the row said before.
    const next = proposal.state === "DRAFT" || proposal.state === "INTERNAL REVIEW" || proposal.state === "APPROVED"
      ? applyProposalState(current, proposal, "SENT", "Client access link issued in demo mode")
      : current;

    return { ...next, accessLinks: [...accessLinks, link], ...activity };
  });
  return result;
}

/** Withdraw a link. The recipient's page stops showing the document immediately and says the
 *  link is no longer active — it does not say why, because why is workspace business. */
export function revokeProposalAccessLink(linkId: string): void {
  updateDemoState((current) => {
    const link = current.accessLinks.find((l) => l.id === linkId);
    if (!link || link.revokedAt) return current;
    const publication = current.publications.find((p) => p.id === link.publicationId);
    const proposal = publication
      ? current.proposals.find((p) => p.id === publication.internalProposalId)
      : null;
    if (!proposal) return current;

    return {
      ...current,
      accessLinks: replace(current.accessLinks, linkId, {
        revokedAt: DEMO_NOW,
        revokedByUserId: DEMO_CURRENT_USER_ID,
      }),
      ...withActivity(current, {
        type: "proposal_access_link_revoked",
        summary: `Client access revoked for ${link.recipientName} on ${proposal.id}`,
        related: { kind: "proposal", id: proposal.id, label: `${proposal.id} · ${proposal.client}` },
        parent: leadRef(proposal.leadId),
        metadata: [{ label: "Recipient", value: link.recipientName }],
      }),
    };
  });
}

/** Record that the client opened the proposal.
 *
 *  Called once per reader session by the public page — a reload, a prefetch or a second tab
 *  must not inflate the count, or "viewed 4×" stops meaning anything to the person reading it.
 *  An open of a link that is not currently readable records nothing: a revoked link that
 *  somebody clicks was not a proposal view. */
export function recordProposalOpen(token: string): void {
  updateDemoState((current) => {
    const link = findLinkByDemoToken(current, token);
    if (!link) return current;
    const publication = publicationById(current, link.publicationId);
    if (!publication) return current;
    if (!grantsContentAccess(resolveAccessState({ link, publication, now: DEMO_NOW }))) return current;
    const proposal = current.proposals.find((p) => p.id === publication.internalProposalId);
    if (!proposal) return current;

    const first = link.firstOpenedAt === null;
    const state: DemoState = {
      ...current,
      accessLinks: replace(current.accessLinks, link.id, {
        firstOpenedAt: link.firstOpenedAt ?? DEMO_NOW,
        lastOpenedAt: DEMO_NOW,
        openCount: link.openCount + 1,
      }),
    };

    const activity = withClientActivity(state, {
      type: first ? "proposal_first_opened_by_client" : "proposal_opened_by_client",
      actorLabel: link.recipientName,
      summary: first
        ? `${link.recipientName} opened ${proposal.id} for the first time`
        : `${link.recipientName} reopened ${proposal.id}`,
      related: { kind: "proposal", id: proposal.id, label: `${proposal.id} · ${proposal.client}` },
      parent: leadRef(proposal.leadId),
      metadata: [{ label: "Version", value: publication.versionLabel }],
    });

    // The first open is the only one that changes what the workspace knows.
    const moved = first && proposal.state === "SENT"
      ? applyProposalState(state, proposal, "VIEWED", `Opened by ${link.recipientName} in demo mode`)
      : state;

    return { ...moved, ...activity };
  });
}

export type SubmitResult = { ok: true } | { ok: false; reason: PublicResponseRejection };

/** Record a question, comment, acceptance or decline submitted from the public route.
 *
 *  Validation runs here as well as in the form. The form's copy is a courtesy; this is the
 *  boundary, and in live mode its counterpart runs on the server for the same reason — a
 *  client-side check is a suggestion to anybody willing to skip the page.
 *
 *  A decision is written once. A second, conflicting decision is refused rather than applied:
 *  a proposal that was accepted and then declined by the same link is not a state this
 *  product can report honestly to either party. */
export function submitProposalResponse(token: string, draft: ResponseDraft): SubmitResult {
  let result: SubmitResult = { ok: false, reason: "not_available" };
  updateDemoState((current) => {
    const link = findLinkByDemoToken(current, token);
    if (!link) return current;
    const publication = publicationById(current, link.publicationId);
    if (!publication) return current;
    const proposal = current.proposals.find((p) => p.id === publication.internalProposalId);
    if (!proposal) return current;

    const state = resolveAccessState({ link, publication, now: DEMO_NOW });
    if (!acceptsResponses(state)) {
      result = { ok: false, reason: state === "accepted" || state === "declined" ? "conflicting_decision" : "closed" };
      return current;
    }
    if (Object.keys(validateResponseDraft(draft)).length > 0) {
      result = { ok: false, reason: "invalid" };
      return current;
    }
    const responseType = responseTypeOf(draft);
    if (decisionConflict(link, responseType)) {
      result = { ok: false, reason: "conflicting_decision" };
      return current;
    }

    const { id, nextId } = mintId(current, "res");
    const typedName = responseTypedNameOf(draft);
    const response: ProposalClientResponse = {
      id,
      accessLinkId: link.id,
      publicationId: publication.id,
      workspaceId: DEMO_WORKSPACE_ID,
      responseType,
      message: responseMessageOf(draft),
      typedName,
      authorizationConfirmed: draft.type === "acceptance" ? draft.authorised : false,
      idempotencyKey: id,
      respondedAt: DEMO_NOW,
      createdAt: DEMO_NOW,
    };
    result = { ok: true };

    const decided = responseType === "acceptance" || responseType === "decline";
    const linkPatch: Partial<ProposalAccessLink> = decided
      ? {
          decision: responseType === "acceptance" ? "accepted" : "declined",
          decidedAt: DEMO_NOW,
          // Only acceptance asks for a typed name, so a decline records none rather than
          // borrowing the recipient's name for a signature-shaped field nobody filled in.
          decidedByName: responseType === "acceptance" ? typedName : null,
        }
      : {};

    const next: DemoState = {
      ...current,
      accessLinks: decided ? replace(current.accessLinks, link.id, linkPatch) : current.accessLinks,
      clientResponses: [...current.clientResponses, response],
    };

    const related: ActivityRef = {
      kind: "proposal",
      id: proposal.id,
      label: `${proposal.id} · ${proposal.client}`,
    };
    const activity = withClientActivity({ ...next, nextId }, {
      type:
        responseType === "question" ? "client_question_submitted"
        : responseType === "comment" ? "client_comment_submitted"
        : responseType === "acceptance" ? "proposal_accepted_by_client"
        : "proposal_declined_by_client",
      actorLabel: link.recipientName,
      summary: `${link.recipientName} ${CLIENT_RESPONSE_SUMMARY[responseType]} ${proposal.id}`,
      // The client's own words belong on the event: a question the workspace cannot read is
      // a notification, not activity.
      detail: response.message,
      related,
      parent: leadRef(proposal.leadId),
      metadata: [{ label: "Version", value: publication.versionLabel }],
    });

    const moved = decided
      ? applyProposalState(
          next,
          proposal,
          responseType === "acceptance" ? "ACCEPTED" : "REJECTED",
          responseType === "acceptance"
            ? `Accepted by ${typedName} in demo mode`
            : `Declined by ${link.recipientName} in demo mode`,
        )
      : next;

    return { ...moved, ...activity };
  });
  return result;
}

const CLIENT_RESPONSE_SUMMARY: Record<ClientResponseType, string> = {
  question: "asked a question on",
  comment: "commented on",
  acceptance: "accepted",
  decline: "declined",
};

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

export function completeFollowUp(id: string): void {
  updateDemoState((current) => {
    const followUp = current.followUps.find((f) => f.id === id);
    if (!followUp || followUp.state === "COMPLETED") return current;
    return {
      ...current,
      followUps: replace(current.followUps, id, { state: "COMPLETED" as FollowUpState, due: "Completed" }),
      leadOverrides: {
        ...current.leadOverrides,
        [followUp.leadId]: { ...current.leadOverrides[followUp.leadId], nextStepLabel: `${followUp.type} done` },
      },
      ...withActivity(current, {
        type: "follow_up_completed",
        summary: `${followUp.name} — ${followUp.type} completed`,
        related: { kind: "followUp", id, label: `${followUp.name} — ${followUp.type}` },
        parent: leadRef(followUp.leadId),
      }),
    };
  });
}

export function rescheduleFollowUp(id: string, dueDate: string, state: FollowUpState = "UPCOMING"): void {
  updateDemoState((current) => {
    const followUp = current.followUps.find((f) => f.id === id);
    if (!followUp) return current;
    return {
      ...current,
      followUps: replace(current.followUps, id, { dueDate, due: dueDate, state }),
      leadOverrides: {
        ...current.leadOverrides,
        [followUp.leadId]: { ...current.leadOverrides[followUp.leadId], nextStepLabel: `${followUp.type} ${dueDate}` },
      },
      ...withActivity(current, {
        type: "follow_up_rescheduled",
        summary: `${followUp.name} — ${followUp.type} due ${dueDate}`,
        related: { kind: "followUp", id, label: `${followUp.name} — ${followUp.type}` },
        parent: leadRef(followUp.leadId),
        metadata: [
          { label: "From", value: followUp.dueDate },
          { label: "To", value: dueDate },
        ],
      }),
    };
  });
}

export function snoozeFollowUp(id: string, dueDate: string): void {
  rescheduleFollowUp(id, dueDate, "SNOOZED");
}

export function updateFollowUp(id: string, patch: Partial<FollowUp>): void {
  updateDemoState((current) => {
    const followUp = current.followUps.find((f) => f.id === id);
    if (!followUp) return current;
    return {
      ...current,
      followUps: replace(current.followUps, id, patch),
      ...withActivity(current, {
        type: "follow_up_updated",
        summary: `${followUp.name} — follow-up updated`,
        related: { kind: "followUp", id, label: `${followUp.name} — ${followUp.type}` },
        parent: leadRef(followUp.leadId),
      }),
    };
  });
}

export function createFollowUp(input: Omit<FollowUp, "id">): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "fu");
    created = id;
    return {
      ...current,
      followUps: [{ ...input, id }, ...current.followUps],
      ...withActivity({ ...current, nextId }, {
        type: "follow_up_created",
        summary: `${input.name} — ${input.type} scheduled`,
        related: { kind: "followUp", id, label: `${input.name} — ${input.type}` },
        parent: leadRef(input.leadId),
        metadata: [{ label: "Due", value: input.dueDate }],
      }),
    };
  });
  return created;
}

// ---------------------------------------------------------------------------
// Email activity — demo only. No provider is connected and nothing is delivered.
// ---------------------------------------------------------------------------

export function setEmailRead(id: string, read: boolean): void {
  updateDemoState((current) => ({ ...current, emails: replace(current.emails, id, { read }) }));
}

export function setEmailArchived(id: string, archived: boolean): void {
  updateDemoState((current) => {
    const email = current.emails.find((e) => e.id === id);
    if (!email) return current;
    return {
      ...current,
      emails: replace(current.emails, id, { archived, state: archived ? "ARCHIVED" : email.state }),
      ...withActivity(current, {
        type: "email_archived",
        summary: `${email.subject} ${archived ? "archived" : "restored"}`,
        related: { kind: "email", id, label: email.subject },
        parent: leadRef(email.leadId),
      }),
    };
  });
}

export function retryEmail(id: string): void {
  updateDemoState((current) => {
    const email = current.emails.find((e) => e.id === id);
    if (!email) return current;
    return {
      ...current,
      emails: replace(current.emails, id, { state: "QUEUED", sent: "just now" }),
      ...withActivity(current, {
        type: "email_retry_queued",
        summary: `${email.subject} queued for retry (demo — not delivered)`,
        related: { kind: "email", id, label: email.subject },
        parent: leadRef(email.leadId),
      }),
    };
  });
}

export function sendEmail(input: Omit<EmailActivity, "id">): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "eml");
    created = id;
    return {
      ...current,
      emails: [{ ...input, id }, ...current.emails],
      ...withActivity({ ...current, nextId }, {
        type: "email_sent",
        summary: `${input.subject} sent in demo mode — no email was delivered`,
        related: { kind: "email", id, label: input.subject },
        parent: leadRef(input.leadId),
      }),
    };
  });
  return created;
}

// ---------------------------------------------------------------------------
// Team — demo only. No real account is created and no external invitation is sent.
// ---------------------------------------------------------------------------

export function inviteTeamMember(name: string, email: string, role: TeamRole): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "user");
    created = id;
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?";
    const member: TeamMember = { id, name, initials, email, role, status: "Pending", lastActive: "Invited just now" };
    return {
      ...current,
      team: [...current.team, member],
      ...withActivity({ ...current, nextId }, {
        type: "team_member_invited",
        summary: `${name} invited in demo mode — no invitation was sent`,
        related: { kind: "workspace", id, label: name },
      }),
    };
  });
  return created;
}

export function updateTeamMember(id: string, patch: Partial<TeamMember>): void {
  updateDemoState((current) => {
    const member = current.team.find((m) => m.id === id);
    if (!member) return current;
    return {
      ...current,
      team: replace(current.team, id, patch),
      ...withActivity(current, {
        type: "team_updated",
        summary: `${member.name} updated`,
        related: { kind: "workspace", id, label: member.name },
      }),
    };
  });
}

/** Remove a member. Anything they own becomes Unassigned rather than pointing at a person
 *  who is no longer in the directory. */
export function removeTeamMember(id: string): void {
  updateDemoState((current) => {
    const member = current.team.find((m) => m.id === id);
    if (!member) return current;
    const reassign = <T extends { ownerId: string }>(rows: T[]): T[] =>
      rows.map((row) => (row.ownerId === id ? { ...row, ownerId: "unassigned" } : row));
    return {
      ...current,
      team: current.team.filter((m) => m.id !== id),
      opportunities: reassign(current.opportunities),
      appointments: reassign(current.appointments),
      meetings: reassign(current.meetings),
      proposals: reassign(current.proposals),
      followUps: reassign(current.followUps),
      ...withActivity(current, {
        type: "team_member_removed",
        summary: `${member.name} removed — owned records reassigned to Unassigned`,
        related: { kind: "workspace", id, label: member.name },
      }),
    };
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Save one section. Fields marked `secret` are never written — demo mode does not accept
 *  or store a credential. */
export function saveSettingsSection(sectionId: string, values: Record<string, string>): void {
  updateDemoState((current) => {
    const section = current.settings.find((s) => s.id === sectionId);
    if (!section) return current;
    return {
      ...current,
      settings: current.settings.map((candidate) =>
        candidate.id !== sectionId
          ? candidate
          : {
              ...candidate,
              fields: candidate.fields.map((field) =>
                field.secret || values[field.id] === undefined ? field : { ...field, value: values[field.id]! },
              ),
            },
      ),
      ...withActivity(current, {
        type: "settings_updated",
        summary: `${section.label} settings saved`,
        related: { kind: "workspace", id: sectionId, label: section.label },
      }),
    };
  });
}

// ---------------------------------------------------------------------------
// Tasks
//
// These are the only writes My Work performs. Like every other action in this file they
// change a record in this browser's demo store and nothing else: no request is made, no
// account is updated, and the copy in the UI says so.
// ---------------------------------------------------------------------------

/** Fields a caller supplies when creating a task. Everything else is derived, so a create
 *  form cannot invent a completion date or a state. */
export type NewTaskInput = {
  title: string;
  detail?: string;
  ownerId: string;
  priority?: TaskPriority;
  dueDate?: string;
  leadId?: string | null;
  relation?: TaskRelation;
};

export function createTask(input: NewTaskInput): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "task");
    created = id;
    const task: Task = {
      id,
      title: input.title.trim(),
      detail: input.detail?.trim() ?? "",
      ownerId: input.ownerId,
      state: "OPEN",
      priority: input.priority ?? "Medium",
      dueDate: input.dueDate ?? "",
      leadId: input.leadId ?? null,
      relation: input.relation ?? null,
      waitingOn: "",
      completedOn: "",
      createdOn: DEMO_TODAY,
    };
    return {
      ...current,
      tasks: [task, ...current.tasks],
      ...withActivity({ ...current, nextId }, {
        type: "task_created",
        summary: `Task created — ${task.title}`,
        detail: task.detail,
        related: { kind: "task", id, label: task.title },
        parent: taskParent(task),
        metadata: task.dueDate ? [{ label: "Due", value: task.dueDate }] : [],
      }),
    };
  });
  return created;
}

/** Partial edit. State transitions go through the dedicated functions below so that the
 *  fields which must move together (state, waitingOn, completedOn) always do. */
export function updateTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "detail" | "ownerId" | "priority" | "dueDate" | "relation" | "leadId">>,
): void {
  updateDemoState((current) => {
    const task = current.tasks.find((candidate) => candidate.id === id);
    if (!task) return current;
    return {
      ...current,
      tasks: replace<Task>(current.tasks, id, patch),
      ...withActivity(current, {
        type: "task_updated",
        summary: `Task updated — ${patch.title ?? task.title}`,
        related: { kind: "task", id, label: patch.title ?? task.title },
        parent: taskParent({ ...task, ...patch }),
      }),
    };
  });
}

export function completeTask(id: string): void {
  updateDemoState((current) => {
    const task = current.tasks.find((candidate) => candidate.id === id);
    if (!task || task.state === "COMPLETED") return current;
    return {
      ...current,
      tasks: replace(current.tasks, id, {
        state: "COMPLETED" as TaskState,
        completedOn: DEMO_TODAY,
        waitingOn: "",
      }),
      ...withActivity(current, {
        type: "task_completed",
        summary: `Task completed — ${task.title}`,
        related: { kind: "task", id, label: task.title },
        parent: taskParent(task),
      }),
    };
  });
}

export function reopenTask(id: string): void {
  updateDemoState((current) => {
    const task = current.tasks.find((candidate) => candidate.id === id);
    if (!task || task.state === "OPEN") return current;
    return {
      ...current,
      tasks: replace(current.tasks, id, { state: "OPEN" as TaskState, completedOn: "", waitingOn: "" }),
      ...withActivity(current, {
        type: "task_reopened",
        summary: `Task reopened — ${task.title}`,
        related: { kind: "task", id, label: task.title },
        parent: taskParent(task),
      }),
    };
  });
}

/** Park a task on someone else. `waitingOn` is required, because "waiting" without a
 *  named party is not a status, it is an excuse. */
export function setTaskWaiting(id: string, waitingOn: string): void {
  const party = waitingOn.trim();
  if (party === "") return;
  updateDemoState((current) => {
    const task = current.tasks.find((candidate) => candidate.id === id);
    if (!task || task.state === "COMPLETED") return current;
    return {
      ...current,
      tasks: replace(current.tasks, id, { state: "WAITING" as TaskState, waitingOn: party, completedOn: "" }),
      ...withActivity(current, {
        type: "task_waiting_changed",
        summary: `Task waiting on ${party} — ${task.title}`,
        related: { kind: "task", id, label: task.title },
        parent: taskParent(task),
        metadata: [{ label: "Waiting on", value: party }],
      }),
    };
  });
}

export function reassignTask(id: string, ownerId: string): void {
  updateDemoState((current) => {
    const task = current.tasks.find((candidate) => candidate.id === id);
    const owner = current.team.find((member) => member.id === ownerId);
    if (!task || !owner || task.ownerId === ownerId) return current;
    return {
      ...current,
      tasks: replace(current.tasks, id, { ownerId }),
      ...withActivity(current, {
        type: "task_assignee_changed",
        summary: `Task moved to ${owner.name} — ${task.title}`,
        related: { kind: "task", id, label: task.title },
        parent: taskParent(task),
        metadata: [{ label: "Assignee", value: owner.name }],
      }),
    };
  });
}

/** Restore the seeded tasks and drop every task created in this browser. Scoped to tasks
 *  on purpose: the demo toolbar's full reset already exists for everything else. */
export function resetDemoTasks(): void {
  updateDemoState((current) => ({
    ...current,
    tasks: createSeedState().tasks,
    ...withActivity(current, {
      type: "workspace_updated",
      summary: "Demo tasks reset",
      related: { kind: "workspace", id: "demo-tasks", label: "Demo tasks" },
    }),
  }));
}
