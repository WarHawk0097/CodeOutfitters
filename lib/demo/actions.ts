// Demo mutations, grouped by domain.
//
// Every function here writes to the local demo store only (see store.ts). None of this is
// production persistence: nothing is sent anywhere, no provider is contacted, no real
// email is delivered and no real account is created.
"use client";

import { createSeedState, DEMO_TODAY, LEAD_DIRECTORY, stageToLeadStatus } from "./seed";
import { getDemoState, mintId, updateDemoState, withActivity } from "./store";
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

export function setProposalState(id: string, next: ProposalState): void {
  updateDemoState((current) => {
    const proposal = current.proposals.find((p) => p.id === id);
    if (!proposal) return current;
    const patch: Partial<Proposal> = { state: next, lastEvent: PROPOSAL_EVENT[next] ?? `Moved to ${next}` };
    const state: DemoState = { ...current, proposals: replace(current.proposals, id, patch) };
    // Accepting or declining a proposal is a pipeline event, so the linked opportunity and
    // the lead follow it.
    const stage: PipelineStage | null = next === "ACCEPTED" ? "Won" : next === "REJECTED" ? "Lost" : next === "SENT" ? "Proposal Sent" : null;
    if (stage && proposal.opportunityId) {
      state.opportunities = replace(current.opportunities, proposal.opportunityId, { stage });
      state.leadOverrides = { ...current.leadOverrides, [proposal.leadId]: { ...current.leadOverrides[proposal.leadId], status: stage } };
    }
    return {
      ...state,
      ...withActivity(current, {
        type: "proposal_status_changed",
        summary: `${id} · ${proposal.client} — ${patch.lastEvent}`,
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
