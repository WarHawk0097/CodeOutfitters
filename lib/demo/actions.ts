// Demo mutations, grouped by domain.
//
// Every function here writes to the local demo store only (see store.ts). None of this is
// production persistence: nothing is sent anywhere, no provider is contacted, no real
// email is delivered and no real account is created.
"use client";

import { stageToLeadStatus } from "./seed";
import { getDemoState, mintId, updateDemoState, withActivity } from "./store";
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
  TeamMember,
  TeamRole,
} from "./types";

function replace<T extends { id: string }>(rows: T[], id: string, patch: Partial<T>): T[] {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
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
        subjectId: opportunityId,
        subjectKind: "opportunity",
        message: reason
          ? `${opportunity.name} moved to ${stage} — ${reason}`
          : `${opportunity.name} moved to ${stage}`,
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
    return { ...next, ...withActivity(current, { subjectId: opportunityId, subjectKind: "opportunity", message: `${opportunity.name} updated` }) };
  });
}

export function createOpportunity(input: Omit<Opportunity, "id">): string {
  let created = "";
  updateDemoState((current) => {
    const { id, nextId } = mintId(current, "opp");
    created = id;
    const activity = withActivity({ ...current, nextId }, {
      subjectId: id,
      subjectKind: "opportunity",
      message: `${input.name} added to ${input.stage}`,
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
      ...withActivity({ ...current, nextId }, { subjectId: id, subjectKind: "appointment", message: `Appointment booked — ${input.title}` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "appointment", message: `${appointment.title} updated` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "appointment", message: `${appointment.title} rescheduled to ${date} ${startTime}` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "appointment", message: `${appointment.title} cancelled` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "meeting", message: `${meeting.name} — meeting updated` }),
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
      ...withActivity({ ...current, nextId }, { subjectId: id, subjectKind: "meeting", message: `Meeting added — ${input.name}` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "meeting", message: `${meeting.name} — meeting rescheduled to ${next.when}` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "meeting", message: `${meeting.name} — meeting cancelled` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "meeting", message: `${meeting.name} — meeting marked complete` }),
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
    return { ...state, ...withActivity(current, { subjectId: id, subjectKind: "proposal", message: `${id} · ${proposal.client} — ${patch.lastEvent}` }) };
  });
}

export function updateProposal(id: string, patch: Partial<Proposal>): void {
  updateDemoState((current) => {
    const proposal = current.proposals.find((p) => p.id === id);
    if (!proposal) return current;
    return {
      ...current,
      proposals: replace(current.proposals, id, patch),
      ...withActivity(current, { subjectId: id, subjectKind: "proposal", message: `${id} updated` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "proposal", message: `${id} · ${input.client} created` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "followUp", message: `${followUp.name} — ${followUp.type} completed` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "followUp", message: `${followUp.name} — ${followUp.type} due ${dueDate}` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "followUp", message: `${followUp.name} — follow-up updated` }),
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
      ...withActivity({ ...current, nextId }, { subjectId: id, subjectKind: "followUp", message: `${input.name} — ${input.type} scheduled` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "email", message: `${email.subject} ${archived ? "archived" : "restored"}` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "email", message: `${email.subject} queued for retry (demo — not delivered)` }),
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
      ...withActivity({ ...current, nextId }, { subjectId: id, subjectKind: "email", message: `${input.subject} sent in demo mode — no email was delivered` }),
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
      ...withActivity({ ...current, nextId }, { subjectId: id, subjectKind: "team", message: `${name} invited in demo mode — no invitation was sent` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "team", message: `${member.name} updated` }),
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
      ...withActivity(current, { subjectId: id, subjectKind: "team", message: `${member.name} removed — owned records reassigned to Unassigned` }),
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
      ...withActivity(current, { subjectId: sectionId, subjectKind: "settings", message: `${section.label} settings saved` }),
    };
  });
}
