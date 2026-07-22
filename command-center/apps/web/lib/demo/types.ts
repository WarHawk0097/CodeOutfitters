// Shared demo-data types for the Command Center dashboard UI.
//
// SCOPE: this is a DEMO data system. It never connects a production backend, never
// transmits data anywhere, and every mutation below writes to a local store in this
// browser only. Nothing here is persistence in the production sense.
//
// One typed system is used by every route that owns these entities — Pipeline,
// Appointments, Meeting Intelligence, Proposals, Follow-ups, Email Activity, Team and
// Settings all read and write the same records, so a change made on one route is the
// same record another route reads. Ids and relationships are shared: an opportunity
// carries a leadId, an appointment carries a leadId and an opportunityId, and owners are
// team-member ids drawn from the same directory the Leads route uses.
import type { LeadStatus } from "@command-center/contracts";

/** Pipeline stage. Identical value set to LeadStatus — the canonical board is
 *  "STAGES 2-5 OF 11" over the eleven canonical lead statuses (CANON 1362, 1088). */
export type PipelineStage = LeadStatus;

export type TeamRole = "Administrator" | "Sales";
export type TeamStatus = "Active" | "Pending" | "Inactive";

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  lastActive: string;
};

/** Signal chip on a pipeline card (CANON 1376 `sig`/`sigC`). */
export type Signal = { label: string; tone: Tone } | null;

/** Canonical semantic tones (design-tokens.json canonical.semantic). */
export type Tone = "green" | "amber" | "red" | "blue" | "neutral";

export type Opportunity = {
  id: string;
  leadId: string;
  name: string;
  company: string;
  service: string;
  /** Card context line (CANON 1378 `ctx`). */
  context: string;
  /** Next action label (CANON 1378 `na`). */
  nextAction: string;
  ownerId: string;
  stage: PipelineStage;
  signal: Signal;
  value: number;
  priority: "High" | "Medium" | "Low";
};

export type AppointmentState =
  | "ready"
  | "preparation_needed"
  | "no_show"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type Appointment = {
  id: string;
  leadId: string;
  opportunityId: string | null;
  title: string;
  company: string;
  service: string;
  /** Calendar day key, YYYY-MM-DD. Demo dates are fixed instants, never the real clock. */
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  platform: string;
  ownerId: string;
  state: AppointmentState;
  detail: string;
  notes: string;
};

// The four canonical states M-D01 draws (CANON 1392-1396), plus LIVE for the state its
// "Live" tab filters to and CANCELLED, which the directory needs because a meeting can be
// called off — the canonical set has no value for that and silently reusing
// "FAILED · NO-SHOW" would misreport why the meeting did not happen.
export type MeetingState = "READY" | "LIVE" | "NEEDS REVIEW" | "COMPLETED" | "FAILED · NO-SHOW" | "CANCELLED";

export type Meeting = {
  id: string;
  leadId: string;
  opportunityId: string | null;
  appointmentId: string | null;
  name: string;
  company: string;
  service: string;
  when: string;
  ownerId: string;
  platform: string;
  state: MeetingState;
  consent: string;
  transcript: string;
  ai: string;
  crm: string;
  /** Demo-only join target. Empty means no provider is configured — the UI must not
   *  claim it can join a real external meeting. */
  joinUrl: string;
  outcome: string;
  notes: string;
  attendees: string[];
};

export type ProposalState =
  | "DRAFT"
  | "INTERNAL REVIEW"
  | "APPROVED"
  | "SENT"
  | "VIEWED"
  | "CHANGES REQUESTED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "ARCHIVED";

export type Proposal = {
  id: string;
  leadId: string;
  opportunityId: string | null;
  client: string;
  leadName: string;
  service: string;
  value: number;
  ownerId: string;
  version: string;
  state: ProposalState;
  lastEvent: string;
  source: string;
};

export type FollowUpState = "OVERDUE" | "DUE TODAY" | "UPCOMING" | "SNOOZED" | "COMPLETED";

export type FollowUp = {
  id: string;
  leadId: string;
  opportunityId: string | null;
  name: string;
  company: string;
  type: string;
  /** Display due label (CANON 1408 `due`) — authored, not clock-derived. */
  due: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  stage: PipelineStage;
  state: FollowUpState;
  ownerId: string;
  suggestion: string;
};

export type EmailState = "QUEUED" | "SENT" | "DELIVERED" | "OPENED" | "FAILED" | "ARCHIVED";

export type EmailActivity = {
  id: string;
  leadId: string;
  to: string;
  leadName: string;
  type: string;
  subject: string;
  body: string;
  direction: "outbound" | "inbound";
  state: EmailState;
  sent: string;
  read: boolean;
  archived: boolean;
};

/** A settings field. `kind` decides the control the canonical form renders. */
export type SettingField = {
  id: string;
  label: string;
  value: string;
  kind: "text" | "email" | "textarea" | "select" | "toggle";
  options?: readonly string[];
  /** Provider/state chip (CANON 1440 `st`). */
  status?: string;
  statusTone?: Tone;
  /** Set on fields that would hold a real credential. Demo mode never asks for or
   *  stores a secret, so these render as a disabled explanation, not an input. */
  secret?: boolean;
  help?: string;
};

export type SettingsSection = {
  id: string;
  label: string;
  description: string;
  fields: SettingField[];
};

export type ActivityEntry = {
  id: string;
  at: string;
  subjectId: string;
  subjectKind: "lead" | "opportunity" | "appointment" | "meeting" | "proposal" | "followUp" | "email" | "team" | "settings";
  message: string;
};

/** Fields a demo mutation may push onto a lead so the Leads route reflects it. */
export type LeadOverride = {
  status?: LeadStatus;
  ownerId?: string;
  nextStepLabel?: string;
};

export type DemoState = {
  version: number;
  team: TeamMember[];
  opportunities: Opportunity[];
  appointments: Appointment[];
  meetings: Meeting[];
  proposals: Proposal[];
  followUps: FollowUp[];
  emails: EmailActivity[];
  settings: SettingsSection[];
  leadOverrides: Record<string, LeadOverride>;
  activity: ActivityEntry[];
  /** Monotonic counter used to mint ids without a clock or a random source, so a demo
   *  session replays identically. */
  nextId: number;
};
