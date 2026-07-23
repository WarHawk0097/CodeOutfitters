// Deterministic starting state for the shared demo store.
//
// Two kinds of value live here and they are labelled throughout:
//   CANONICAL — transcribed from Dashboard/Command Center Final.dc.html (line cited).
//   SYNTHETIC — deterministic filler, generated from a fixed seed so the demo replays
//               identically. Never customer data, never presented as canonical.
//
// Every record links to a lead by id, and every owner is a team-member id, so the same
// entity is the same record on every route.
import { generateLeads } from "../../mocks/fixtures/generate-leads";
import { CANONICAL_LEAD_STATUS_ORDER, type Lead, type LeadStatus } from "@command-center/contracts";
import type {
  Appointment,
  DemoState,
  EmailActivity,
  FollowUp,
  Meeting,
  Opportunity,
  PipelineStage,
  Proposal,
  SettingsSection,
  Signal,
  TeamMember,
} from "./types";

/** Bumped whenever the shape of DemoState changes; a stored state from an older
 *  version is discarded and reseeded rather than migrated. */
export const DEMO_STATE_VERSION = 1;

/** Fixed reference instant. Never the real clock — the same reason generate-leads.ts
 *  pins REFERENCE_NOW: a demo that reads Date.now() renders differently every run. */
export const DEMO_NOW = "2026-04-22T17:00:00.000Z";
export const DEMO_TODAY = "2026-04-22";

// ---------------------------------------------------------------------------
// Team — CANON 1434-1438 (teamRows). Ids match the owner ids the Leads dataset
// already uses (user-001 Priya Nair, user-002 Marc Rivera), so an owner selector on
// any route offers the same people the Leads owner facet does.
// ---------------------------------------------------------------------------
export const TEAM_SEED: TeamMember[] = [
  { id: "user-002", name: "Marc Rivera", initials: "MR", email: "marc@codeoutfitters.com", role: "Administrator", status: "Active", lastActive: "Active now" },
  { id: "user-001", name: "Priya Nair", initials: "PN", email: "priya@codeoutfitters.com", role: "Sales", status: "Active", lastActive: "12m ago" },
  { id: "user-003", name: "Jordan Hale", initials: "JH", email: "jordan@codeoutfitters.com", role: "Sales", status: "Active", lastActive: "2h ago" },
  { id: "user-004", name: "Tara Osei", initials: "TO", email: "tara@codeoutfitters.com", role: "Sales", status: "Pending", lastActive: "Invited 2d ago" },
];

/** CANON 1362: the eleven canonical stages, in canonical order. The pipeline board and
 *  the Leads status column are the same value set. */
export const PIPELINE_STAGES: readonly PipelineStage[] = CANONICAL_LEAD_STATUS_ORDER;

/** CANON 205/1382/1385/1388: the board spells three stages out where the Leads table
 *  abbreviates them. Same value, two authored labels. */
export const STAGE_LABELS: Record<PipelineStage, string> = {
  New: "New",
  Contacted: "Contacted",
  "Appt Pending": "Appointment Pending",
  "Appt Scheduled": "Appointment Scheduled",
  "Discovery Done": "Discovery Done",
  "Proposal Req.": "Proposal Required",
  "Proposal Sent": "Proposal Sent",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
  FUL: "Follow Up Later",
};

/** CANON 1379/1382/1385/1388 stage accent colours, and the four canonical stage notes. */
export const STAGE_META: Partial<Record<PipelineStage, { note: string; averageAge: string }>> = {
  Contacted: { note: "2 need action · 1 overdue", averageAge: "3.2 days" },
  "Appt Pending": { note: "3 abandoned bookings", averageAge: "2.0 days" },
  "Appt Scheduled": { note: "3 meetings today", averageAge: "1.4 days" },
  "Proposal Sent": { note: "1 viewed yesterday", averageAge: "4.8 days" },
};

// ---------------------------------------------------------------------------
// Lead index. The store does not own leads — the Leads route does — but every other
// entity references one, so the seed resolves ids against the same generated dataset.
// ---------------------------------------------------------------------------
export function buildLeadIndex(leads: readonly Lead[]): Map<string, Lead> {
  const byName = new Map<string, Lead>();
  for (const lead of leads) {
    if (!byName.has(lead.name)) byName.set(lead.name, lead);
  }
  return byName;
}

function leadIdFor(index: Map<string, Lead>, name: string): string {
  const lead = index.get(name);
  if (!lead) {
    throw new Error(
      `Demo seed references "${name}", which is not in the lead dataset. Canonical people ` +
        "who appear off the Leads screen are declared in mocks/fixtures/generate-leads.ts " +
        "(CANONICAL_EXTERNAL_LEADS) — add the name there rather than inventing a lead here.",
    );
  }
  return lead.id;
}

// ---------------------------------------------------------------------------
// Pipeline. CANON 1377-1388 defines eight cards across four stages, and CANON 213
// states the board holds 86. The eight canonical cards are transcribed verbatim; the
// remaining 78 are SYNTHETIC, drawn from real leads in id order so every card on the
// board is a lead that exists.
//
// Stage counts: the four canonical stages carry their canonical counts (11 / 7 / 9 / 7,
// CANON 1379-1388). The other seven carry a SYNTHETIC distribution — no canonical source
// states them — chosen so the board totals the canonical 86.
// ---------------------------------------------------------------------------
export const STAGE_TARGET_COUNTS: Record<PipelineStage, number> = {
  New: 16,
  Contacted: 11,
  "Appt Pending": 7,
  "Appt Scheduled": 9,
  "Discovery Done": 8,
  "Proposal Req.": 9,
  "Proposal Sent": 7,
  Negotiation: 6,
  Won: 7,
  Lost: 4,
  FUL: 2,
};

export const PIPELINE_ACTIVE_COUNT = Object.values(STAGE_TARGET_COUNTS).reduce((a, b) => a + b, 0);

type CanonicalCard = {
  name: string;
  company: string;
  service: string;
  context: string;
  owner: string;
  nextAction: string;
  signal: Signal;
  stage: PipelineStage;
};

const CANONICAL_CARDS: readonly CanonicalCard[] = [
  { stage: "Contacted", name: "Thomas Beck", company: "Cascade Fitness", service: "AI Agents", context: "No reply for six days — second touch drafted", owner: "Marc Rivera", nextAction: "Call Apr 25", signal: null },
  { stage: "Contacted", name: "Nadia Karim", company: "Ferrostar Freight", service: "Integrations", context: "Asked for security overview after intro call", owner: "Priya Nair", nextAction: "Send recap today", signal: { label: "High intent", tone: "green" } },
  { stage: "Appt Pending", name: "Ruben Ortega", company: "Northwind Logistics", service: "Workflow Automation", context: "Appointment not completed — abandoned at calendar", owner: "Priya Nair", nextAction: "Call now · overdue", signal: { label: "Overdue", tone: "red" } },
  { stage: "Appt Pending", name: "Owen Bradley", company: "Cedar Point Legal", service: "Workflow Automation", context: "Reminder email queued for this afternoon", owner: "Unassigned", nextAction: "Assign owner", signal: { label: "Missing owner", tone: "amber" } },
  { stage: "Appt Scheduled", name: "Alicia Fenwick", company: "Bright Harbor Realty", service: "Web Applications", context: "Discovery call today 10:00 — prep 6 questions", owner: "Priya Nair", nextAction: "Prepare meeting", signal: { label: "Meeting today", tone: "green" } },
  { stage: "Appt Scheduled", name: "Yusuf Adeyemi", company: "Crestline Dental", service: "AI Automation", context: "Discovery call Apr 26 · agenda confirmed", owner: "Marc Rivera", nextAction: "Join Apr 26 · 2:00", signal: null },
  { stage: "Proposal Sent", name: "Gregory Mullins", company: "Harbor & Co Accounting", service: "Integrations", context: "Proposal viewed yesterday — 3rd view, pricing page", owner: "Priya Nair", nextAction: "Follow up today", signal: { label: "Proposal viewed", tone: "blue" } },
  { stage: "Proposal Sent", name: "Sofia Marchetti", company: "Verano Hospitality", service: "AI Automation", context: "Waiting on technical requirements from IT", owner: "Marc Rivera", nextAction: "Confirm requirements", signal: null },
];

const OWNER_ID_BY_NAME: Record<string, string> = {
  "Marc Rivera": "user-002",
  "Priya Nair": "user-001",
  "Jordan Hale": "user-003",
  "Tara Osei": "user-004",
  Unassigned: "unassigned",
};

// mulberry32, same generator generate-leads.ts uses: fixed seed in, fixed sequence out.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_SEED = 20260423;

const SYNTHETIC_CONTEXTS = [
  "Waiting on a reply to the intro email",
  "Requested a written summary before the next call",
  "Reviewing scope internally this week",
  "Asked about integration effort and timeline",
  "Budget confirmed, decision maker not yet involved",
  "Follow-up call booked with the operations lead",
];
const SYNTHETIC_ACTIONS = [
  "Send recap",
  "Book discovery call",
  "Share scope outline",
  "Confirm requirements",
  "Check in this week",
  "Assign owner",
];

function buildOpportunities(leads: readonly Lead[], index: Map<string, Lead>): Opportunity[] {
  const random = mulberry32(DEMO_SEED);
  const out: Opportunity[] = [];
  const usedLeadIds = new Set<string>();
  let n = 0;

  // Canonical cards first, so each canonical stage renders its canonical cards at the
  // top of the column exactly as the frame shows them.
  for (const card of CANONICAL_CARDS) {
    const leadId = leadIdFor(index, card.name);
    usedLeadIds.add(leadId);
    n += 1;
    out.push({
      id: `opp-${String(n).padStart(3, "0")}`,
      leadId,
      name: card.name,
      company: card.company,
      service: card.service,
      context: card.context,
      nextAction: card.nextAction,
      ownerId: OWNER_ID_BY_NAME[card.owner] ?? "unassigned",
      stage: card.stage,
      signal: card.signal,
      value: 20000 + Math.floor(random() * 90) * 1000,
      priority: card.signal?.tone === "red" ? "High" : card.signal ? "Medium" : "Low",
    });
  }

  // Then fill each stage up to its target from leads not already on the board.
  const pool = leads.filter((lead) => !usedLeadIds.has(lead.id));
  let cursor = 0;
  for (const stage of PIPELINE_STAGES) {
    const have = out.filter((o) => o.stage === stage).length;
    const want = STAGE_TARGET_COUNTS[stage];
    for (let i = have; i < want; i += 1) {
      const lead = pool[cursor];
      cursor += 1;
      if (!lead) break;
      n += 1;
      out.push({
        id: `opp-${String(n).padStart(3, "0")}`,
        leadId: lead.id,
        name: lead.name,
        company: lead.company,
        service: lead.serviceInterest ?? "Custom Software",
        context: SYNTHETIC_CONTEXTS[Math.floor(random() * SYNTHETIC_CONTEXTS.length)]!,
        nextAction: SYNTHETIC_ACTIONS[Math.floor(random() * SYNTHETIC_ACTIONS.length)]!,
        ownerId: lead.owner,
        stage,
        signal: null,
        value: 12000 + Math.floor(random() * 110) * 1000,
        priority: random() < 0.25 ? "High" : random() < 0.6 ? "Medium" : "Low",
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Appointments — CANON 313-330 (C-D11) and 1140-1154 (MO-07).
// ---------------------------------------------------------------------------
function buildAppointments(index: Map<string, Lead>, opportunities: readonly Opportunity[]): Appointment[] {
  const oppFor = (leadId: string) => opportunities.find((o) => o.leadId === leadId)?.id ?? null;
  const rows: Array<Omit<Appointment, "id" | "leadId" | "opportunityId"> & { person: string }> = [
    { person: "Alicia Fenwick", title: "Alicia Fenwick — discovery call", company: "Bright Harbor Realty", service: "Web Applications", date: "2026-04-22", startTime: "10:00", endTime: "10:45", timezone: "PST", platform: "Google Meet", ownerId: "user-001", state: "ready", detail: "Prep complete · 6 questions pinned", notes: "" },
    { person: "Yusuf Adeyemi", title: "Yusuf Adeyemi — discovery call", company: "Crestline Dental", service: "AI Automation", date: "2026-04-22", startTime: "14:00", endTime: "14:45", timezone: "PST", platform: "Zoom", ownerId: "user-002", state: "preparation_needed", detail: "Agenda not yet prepared", notes: "" },
    // CANON 316: "7 upcoming · 3 today". Two of the three same-day appointments are drawn
    // (C-D11 318-332); this third one is SYNTHETIC and exists so the derived counts match
    // the canonical subtitle instead of contradicting it.
    { person: "Sofia Marchetti", title: "Sofia Marchetti — automation scoping", company: "Verano Hospitality", service: "AI Automation", date: "2026-04-22", startTime: "16:00", endTime: "16:45", timezone: "PST", platform: "Google Meet", ownerId: "user-002", state: "ready", detail: "Scoping questions prepared", notes: "" },
    { person: "Ruben Ortega", title: "Ruben Ortega — first call", company: "Northwind Logistics", service: "Workflow Automation", date: "2026-04-21", startTime: "09:30", endTime: "10:00", timezone: "PST", platform: "Google Meet", ownerId: "user-001", state: "no_show", detail: "Marked no-show · reminder email failed", notes: "" },
    { person: "Priyanka Rao", title: "Priyanka Rao — discovery review", company: "Solterra Energy", service: "Custom Software", date: "2026-04-21", startTime: "13:30", endTime: "14:18", timezone: "PST", platform: "Zoom", ownerId: "user-002", state: "completed", detail: "48 min · transcript ready · 6 CRM recommendations", notes: "" },
    { person: "Gregory Mullins", title: "Gregory Mullins — proposal walkthrough", company: "Harbor & Co Accounting", service: "Integrations", date: "2026-04-23", startTime: "11:00", endTime: "11:30", timezone: "PST", platform: "Google Meet", ownerId: "user-001", state: "ready", detail: "Pricing questions expected", notes: "" },
    { person: "Nadia Karim", title: "Nadia Karim — security overview", company: "Ferrostar Freight", service: "Integrations", date: "2026-04-24", startTime: "09:00", endTime: "09:45", timezone: "PST", platform: "Zoom", ownerId: "user-001", state: "preparation_needed", detail: "Send security overview before the call", notes: "" },
    { person: "Derrick Vaughn", title: "Derrick Vaughn — negotiation call", company: "Ironclad Security", service: "Business Systems", date: "2026-04-25", startTime: "15:00", endTime: "15:45", timezone: "PST", platform: "Zoom", ownerId: "user-001", state: "ready", detail: "Contract terms review", notes: "" },
  ];
  return rows.map((row, i) => {
    const leadId = leadIdFor(index, row.person);
    const { person: _person, ...rest } = row;
    return { id: `apt-${String(i + 1).padStart(3, "0")}`, leadId, opportunityId: oppFor(leadId), ...rest };
  });
}

// ---------------------------------------------------------------------------
// Meeting Intelligence — CANON 1395-1399 (meetings).
//
// joinUrl is empty on every record. The canonical readiness panel states the meeting
// platform is "NOT CONFIGURED — provider-neutral" (CANON 1440), so there is no real
// external meeting to join and the UI must not pretend otherwise.
// ---------------------------------------------------------------------------
function buildMeetings(index: Map<string, Lead>, opportunities: readonly Opportunity[], appointments: readonly Appointment[]): Meeting[] {
  const rows: Array<Omit<Meeting, "id" | "leadId" | "opportunityId" | "appointmentId" | "joinUrl" | "outcome" | "notes" | "attendees"> & { person: string; attendees: string[] }> = [
    { person: "Alicia Fenwick", name: "Alicia Fenwick", company: "Bright Harbor Realty", service: "Web Applications", when: "Today · 10:00 AM PST", ownerId: "user-001", platform: "Google Meet", state: "READY", consent: "Consent pending", transcript: "—", ai: "—", crm: "—", attendees: ["Alicia Fenwick", "Priya Nair"] },
    { person: "Priyanka Rao", name: "Priyanka Rao", company: "Solterra Energy", service: "Custom Software", when: "Yesterday · 1:30 PM", ownerId: "user-002", platform: "Zoom", state: "NEEDS REVIEW", consent: "Recorded w/ consent", transcript: "Ready · 48 min", ai: "14 requirements", crm: "6 recommendations", attendees: ["Priyanka Rao", "Marc Rivera"] },
    { person: "Derrick Vaughn", name: "Derrick Vaughn", company: "Ironclad Security", service: "Business Systems", when: "Apr 18 · 3:00 PM", ownerId: "user-001", platform: "Zoom", state: "COMPLETED", consent: "Recorded w/ consent", transcript: "Ready · 52 min", ai: "Approved", crm: "Applied", attendees: ["Derrick Vaughn", "Priya Nair"] },
    { person: "Ruben Ortega", name: "Ruben Ortega", company: "Northwind Logistics", service: "Workflow Automation", when: "Apr 21 · 9:30 AM", ownerId: "user-001", platform: "Google Meet", state: "FAILED · NO-SHOW", consent: "—", transcript: "—", ai: "—", crm: "—", attendees: ["Ruben Ortega", "Priya Nair"] },
  ];
  return rows.map((row, i) => {
    const leadId = leadIdFor(index, row.person);
    const { person: _person, ...rest } = row;
    return {
      id: `mtg-${String(i + 1).padStart(3, "0")}`,
      leadId,
      opportunityId: opportunities.find((o) => o.leadId === leadId)?.id ?? null,
      appointmentId: appointments.find((a) => a.leadId === leadId)?.id ?? null,
      joinUrl: "",
      outcome: "",
      notes: "",
      ...rest,
    };
  });
}

// ---------------------------------------------------------------------------
// Proposals — CANON 1428-1433 (props).
// ---------------------------------------------------------------------------
function buildProposals(index: Map<string, Lead>, opportunities: readonly Opportunity[]): Proposal[] {
  const rows: Array<Omit<Proposal, "leadId" | "opportunityId"> & { person: string }> = [
    { id: "PRO-2034", person: "Priyanka Rao", client: "Solterra Energy", leadName: "Priyanka Rao", service: "Custom Software", value: 86400, ownerId: "user-002", version: "v1", state: "DRAFT", lastEvent: "32m ago", source: "Meeting · Solution Canvas" },
    { id: "PRO-2031", person: "Gregory Mullins", client: "Harbor & Co Accounting", leadName: "Gregory Mullins", service: "Integrations", value: 42750, ownerId: "user-001", version: "v2", state: "VIEWED", lastEvent: "Sent Apr 18 · viewed 3×", source: "Template · Integrations" },
    { id: "PRO-2029", person: "Sofia Marchetti", client: "Verano Hospitality", leadName: "Sofia Marchetti", service: "AI Automation", value: 58200, ownerId: "user-002", version: "v1", state: "INTERNAL REVIEW", lastEvent: "2 comments open", source: "Lead" },
    { id: "PRO-2024", person: "Hannah Liu", client: "Petal & Stem", leadName: "Hannah Liu", service: "Web Applications", value: 34900, ownerId: "user-002", version: "v3", state: "ACCEPTED", lastEvent: "Accepted Apr 12", source: "Revision of v2" },
    { id: "PRO-2019", person: "Marcus Cole", client: "Titan Manufacturing", leadName: "Marcus Cole", service: "Custom Software", value: 112000, ownerId: "user-001", version: "v1", state: "REJECTED", lastEvent: "Went in-house", source: "Meeting" },
  ];
  return rows.map((row) => {
    const leadId = leadIdFor(index, row.person);
    const { person: _person, ...rest } = row;
    return { ...rest, leadId, opportunityId: opportunities.find((o) => o.leadId === leadId)?.id ?? null };
  });
}

// ---------------------------------------------------------------------------
// Follow-ups — CANON 1408-1412 (fuRows).
// ---------------------------------------------------------------------------
function buildFollowUps(index: Map<string, Lead>, opportunities: readonly Opportunity[]): FollowUp[] {
  const rows: Array<Omit<FollowUp, "id" | "leadId" | "opportunityId"> & { person: string }> = [
    { person: "Ruben Ortega", name: "Ruben Ortega", company: "Northwind Logistics", type: "First contact", due: "Yesterday 4:00 PM", dueDate: "2026-04-21", priority: "High", stage: "Appt Pending", state: "OVERDUE", ownerId: "user-001", suggestion: "Call, then re-send booking link" },
    { person: "Gregory Mullins", name: "Gregory Mullins", company: "Harbor & Co", type: "Proposal follow-up", due: "Today 2:00 PM", dueDate: "2026-04-22", priority: "High", stage: "Proposal Sent", state: "DUE TODAY", ownerId: "user-001", suggestion: "Reference 3rd proposal view" },
    { person: "Priyanka Rao", name: "Priyanka Rao", company: "Solterra Energy", type: "Meeting review", due: "Today 5:00 PM", dueDate: "2026-04-22", priority: "Medium", stage: "Discovery Done", state: "DUE TODAY", ownerId: "user-002", suggestion: "Approve CRM recommendations" },
    { person: "Elena Sokolova", name: "Elena Sokolova", company: "Lumen Health", type: "Reconnect later", due: "Jun 15", dueDate: "2026-06-15", priority: "Low", stage: "FUL", state: "SNOOZED", ownerId: "user-002", suggestion: "New budget cycle opens June" },
    { person: "Nadia Karim", name: "Nadia Karim", company: "Ferrostar Freight", type: "Send security overview", due: "Apr 24 9:00 AM", dueDate: "2026-04-24", priority: "Medium", stage: "Contacted", state: "UPCOMING", ownerId: "user-001", suggestion: "Attach the security overview PDF" },
    { person: "Thomas Beck", name: "Thomas Beck", company: "Cascade Fitness", type: "Second touch", due: "Apr 25 10:00 AM", dueDate: "2026-04-25", priority: "Medium", stage: "Contacted", state: "UPCOMING", ownerId: "user-002", suggestion: "Six days with no reply — call instead of email" },
  ];
  return rows.map((row, i) => {
    const leadId = leadIdFor(index, row.person);
    const { person: _person, ...rest } = row;
    return { id: `fu-${String(i + 1).padStart(3, "0")}`, leadId, opportunityId: opportunities.find((o) => o.leadId === leadId)?.id ?? null, ...rest };
  });
}

// ---------------------------------------------------------------------------
// Email activity — CANON 1402-1407 (emailRows). CANON 358 marks the screen
// "PROVIDER-NEUTRAL · REQUIRES PROVIDER": no provider is connected and nothing here
// was ever delivered to a real address.
// ---------------------------------------------------------------------------
function buildEmails(index: Map<string, Lead>): EmailActivity[] {
  const rows: Array<Omit<EmailActivity, "id" | "leadId"> & { person: string }> = [
    { person: "Dana Whitfield", to: "dana@meridiandental.com", leadName: "Dana Whitfield", type: "Inquiry confirmation", subject: "We received your request", body: "Thanks for getting in touch — we've received your request and will reply within one business day.", direction: "outbound", state: "DELIVERED", sent: "2h", read: true, archived: false },
    { person: "Ruben Ortega", to: "r.ortega@northwind.co", leadName: "Ruben Ortega", type: "Abandoned booking", subject: "Finish scheduling your call", body: "It looks like the booking didn't complete. Here's the link again if you'd like to pick a time.", direction: "outbound", state: "FAILED", sent: "5h", read: false, archived: false },
    { person: "Gregory Mullins", to: "greg@harborco.com", leadName: "Gregory Mullins", type: "Proposal delivery", subject: "Your CodeOutfitters proposal — PRO-2031", body: "Your proposal is ready. The secure link below expires on May 9 and can be revoked at any time.", direction: "outbound", state: "OPENED", sent: "4d", read: true, archived: false },
    { person: "Priyanka Rao", to: "p.rao@solterra.io", leadName: "Priyanka Rao", type: "Meeting recap", subject: "Recap + next steps from today's call", body: "Recap of today's discovery call, the confirmed requirements, and the two open questions.", direction: "outbound", state: "QUEUED", sent: "—", read: false, archived: false },
    { person: "Sofia Marchetti", to: "sofia@veranohotels.com", leadName: "Sofia Marchetti", type: "Follow-up", subject: "Following up on your proposal", body: "Checking in on the proposal — happy to walk through the technical requirements with your IT team.", direction: "outbound", state: "SENT", sent: "1d", read: false, archived: false },
    { person: "Alicia Fenwick", to: "alicia@brightharbor.com", leadName: "Alicia Fenwick", type: "Inbound reply", subject: "Re: Discovery call agenda", body: "The agenda works for us. Our operations lead will join as well.", direction: "inbound", state: "DELIVERED", sent: "1d", read: false, archived: false },
  ];
  return rows.map((row, i) => {
    const { person, ...rest } = row;
    return { id: `eml-${String(i + 1).padStart(3, "0")}`, leadId: leadIdFor(index, person), ...rest };
  });
}

// ---------------------------------------------------------------------------
// Settings — CANON 1439 (settingsNav), 1440-1446 (aiSettings), 1447-1453 (propSettings).
//
// No field below accepts a credential. The canonical integration rows are rendered as
// state, not as a secret input: demo mode never requests, stores or transmits an API
// key, and no provider is actually connected.
// ---------------------------------------------------------------------------
export const SETTINGS_SEED: SettingsSection[] = [
  {
    id: "general",
    label: "General",
    description: "Workspace profile and company details.",
    fields: [
      { id: "workspaceName", label: "Workspace name", value: "CodeOutfitters", kind: "text" },
      { id: "companyLegalName", label: "Company legal name", value: "CodeOutfitters Ltd", kind: "text" },
      { id: "contactEmail", label: "Contact email", value: "hello@codeoutfitters.com", kind: "email" },
      { id: "timezone", label: "Default timezone", value: "America/Los_Angeles", kind: "select", options: ["America/Los_Angeles", "America/New_York", "Europe/London", "UTC"] },
      { id: "profileName", label: "Your display name", value: "Marc Rivera", kind: "text" },
      { id: "profileRole", label: "Your role", value: "Administrator", kind: "select", options: ["Administrator", "Sales"] },
    ],
  },
  {
    id: "services",
    label: "Services",
    description: "The service list offered on lead and proposal forms.",
    fields: [
      { id: "services", label: "Offered services", value: "AI Automation, Workflow Automation, Web Applications, AI Agents, Custom Software, Integrations, Business Systems", kind: "textarea", help: "Comma separated. Used by the lead and proposal service selectors." },
      { id: "defaultService", label: "Default service", value: "AI Automation", kind: "select", options: ["AI Automation", "Workflow Automation", "Web Applications", "AI Agents", "Custom Software", "Integrations", "Business Systems"] },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    description: "Board behaviour and stage gating.",
    fields: [
      { id: "defaultStage", label: "Stage for new leads", value: "New", kind: "select", options: [...PIPELINE_STAGES] },
      { id: "reasonRequired", label: "Require a reason for Won, Lost and Follow Up Later", value: "on", kind: "toggle" },
      { id: "staleAfterDays", label: "Flag a card as stale after (days)", value: "5", kind: "text" },
    ],
  },
  {
    id: "appointments",
    label: "Appointments",
    description: "Scheduling defaults. Provider-neutral — no calendar is connected.",
    fields: [
      { id: "defaultDuration", label: "Default duration (minutes)", value: "45", kind: "select", options: ["15", "30", "45", "60"] },
      { id: "calendarProvider", label: "Calendar provider", value: "Not configured — provider-neutral", kind: "text", status: "NOT CONFIGURED", statusTone: "amber", secret: true, help: "Connecting a real calendar requires production backend integration, which this demo does not perform." },
      { id: "reminderLead", label: "Send reminder before (hours)", value: "24", kind: "select", options: ["1", "4", "24", "48"] },
    ],
  },
  {
    id: "email",
    label: "Email",
    description: "Outbound email defaults. Provider-neutral — nothing is delivered.",
    fields: [
      { id: "fromName", label: "From name", value: "CodeOutfitters", kind: "text" },
      { id: "replyTo", label: "Reply-to address", value: "hello@codeoutfitters.com", kind: "email" },
      { id: "emailProvider", label: "Email provider", value: "Not configured — provider-neutral", kind: "text", status: "REQUIRES PROVIDER", statusTone: "amber", secret: true, help: "No provider is connected. Composing and sending in this demo changes local state only." },
      { id: "signature", label: "Signature", value: "— The CodeOutfitters team", kind: "textarea" },
    ],
  },
  {
    id: "follow-ups",
    label: "Follow-ups",
    description: "Work-queue defaults.",
    fields: [
      { id: "defaultSnooze", label: "Default snooze (days)", value: "3", kind: "select", options: ["1", "3", "7", "14"] },
      { id: "overdueEscalation", label: "Escalate to the owner's manager when overdue", value: "off", kind: "toggle" },
      { id: "workQueueSize", label: "Work queue size", value: "10", kind: "select", options: ["5", "10", "20"] },
    ],
  },
  {
    id: "ai",
    label: "AI & Meeting Intelligence",
    description: "Transcription, analysis and CRM recommendations.",
    fields: [
      { id: "meetingPlatform", label: "Meeting platform", value: "Not configured — provider-neutral", kind: "text", status: "NOT CONFIGURED", statusTone: "amber", secret: true, help: "Provider-neutral by design. No meeting platform is connected." },
      { id: "transcriptionProvider", label: "Transcription provider", value: "Pending selection", kind: "text", status: "NOT CONFIGURED", statusTone: "amber", secret: true, help: "No transcription provider is connected." },
      { id: "aiProvider", label: "AI provider · approved model", value: "Provider-neutral (Claude or OpenAI compatible)", kind: "text", status: "REQUIRES PROVIDER", statusTone: "amber", secret: true, help: "No model provider is connected and no key is stored." },
      { id: "consentMessage", label: "Consent message", value: "This call is transcribed to prepare your proposal — OK?", kind: "textarea", status: "APPROVED COPY", statusTone: "green" },
      { id: "retention", label: "Retention", value: "Transcripts retained 12 months · redaction on request", kind: "text", status: "POLICY SET", statusTone: "green" },
      { id: "crmReview", label: "CRM recommendations always require human review", value: "on", kind: "toggle", status: "ENFORCED", statusTone: "green", help: "Enforced. A recommendation is never applied without a person approving it." },
    ],
  },
  {
    id: "proposals",
    label: "Proposal Settings",
    description: "Proposal generation and delivery defaults.",
    fields: [
      { id: "defaultTemplate", label: "Default template", value: "CodeOutfitters Executive Solution Proposal", kind: "text" },
      { id: "format", label: "Format", value: "A4 + US Letter", kind: "select", options: ["A4 + US Letter", "A4", "US Letter"] },
      { id: "validity", label: "Default validity (days)", value: "21", kind: "select", options: ["7", "14", "21", "30"] },
      { id: "approvalBeforeSend", label: "Approval before send — reviewer other than owner", value: "on", kind: "toggle" },
      { id: "clientAcceptance", label: "Client acceptance · typed-name acceptance", value: "on", kind: "toggle" },
      { id: "secureLink", label: "Secure link", value: "Expiring token · revocable", kind: "text" },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "What the Command Center tells you about.",
    fields: [
      { id: "notifyNewLead", label: "New lead", value: "on", kind: "toggle" },
      { id: "notifyOverdue", label: "Overdue follow-up", value: "on", kind: "toggle" },
      { id: "notifyProposalViewed", label: "Proposal viewed", value: "on", kind: "toggle" },
      { id: "notifyMeetingReview", label: "Meeting ready for review", value: "off", kind: "toggle" },
      { id: "digest", label: "Daily digest", value: "08:00", kind: "select", options: ["Off", "08:00", "12:00", "17:00"] },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard preferences",
    description: "Default view when the Command Center opens.",
    fields: [
      { id: "landingRoute", label: "Open on", value: "Overview", kind: "select", options: ["Overview", "Leads", "Pipeline", "Follow-ups"] },
      { id: "defaultRange", label: "Default date range", value: "30D", kind: "select", options: ["7D", "30D", "90D"] },
      { id: "density", label: "Table density", value: "Comfortable", kind: "select", options: ["Comfortable", "Compact"] },
    ],
  },
  {
    id: "permissions",
    label: "Team and Permissions",
    description: "Who can reach Team and Settings.",
    fields: [
      { id: "adminOnlyAdministration", label: "Administrator access required for Team and Settings", value: "on", kind: "toggle", status: "ENFORCED", statusTone: "green" },
      { id: "salesCanExport", label: "Sales role may export CSV", value: "on", kind: "toggle" },
      { id: "salesCanDelete", label: "Sales role may delete records", value: "off", kind: "toggle" },
    ],
  },
  {
    id: "security",
    label: "Security",
    description: "Session and access policy.",
    fields: [
      { id: "sessionTimeout", label: "Session timeout (minutes)", value: "60", kind: "select", options: ["15", "30", "60", "240"] },
      { id: "twoFactor", label: "Require two-factor authentication", value: "on", kind: "toggle" },
      { id: "ssoProvider", label: "Single sign-on", value: "Not configured", kind: "text", status: "NOT CONFIGURED", statusTone: "amber", secret: true, help: "Single sign-on requires production backend integration. No credential is requested or stored here." },
    ],
  },
  {
    id: "data",
    label: "Data and Export",
    description: "Export and demo-data controls.",
    fields: [
      { id: "exportFormat", label: "Export format", value: "CSV", kind: "select", options: ["CSV", "JSON"] },
      { id: "retentionPolicy", label: "Record retention", value: "36 months", kind: "select", options: ["12 months", "24 months", "36 months"] },
    ],
  },
];

/** The lead directory every demo route links against. Built once: a route that has to
 *  attach a new record to a lead picks from this list rather than inventing an id, which is
 *  what keeps "every record links to a real lead" true after a create as well as at seed. */
export const LEAD_DIRECTORY: readonly Lead[] = generateLeads();

export function createSeedState(leads?: readonly Lead[]): DemoState {
  const dataset = leads ?? LEAD_DIRECTORY;
  const index = buildLeadIndex(dataset);
  const opportunities = buildOpportunities(dataset, index);
  const appointments = buildAppointments(index, opportunities);
  const meetings = buildMeetings(index, opportunities, appointments);
  return {
    version: DEMO_STATE_VERSION,
    team: TEAM_SEED.map((member) => ({ ...member })),
    opportunities,
    appointments,
    meetings,
    proposals: buildProposals(index, opportunities),
    followUps: buildFollowUps(index, opportunities),
    emails: buildEmails(index),
    settings: SETTINGS_SEED.map((section) => ({ ...section, fields: section.fields.map((f) => ({ ...f })) })),
    leadOverrides: {},
    activity: [],
    nextId: 1,
  };
}

/** Status a lead takes when its opportunity moves. The board stage and the lead status
 *  are the same value set (CANON 1362), so a move writes straight through. */
export function stageToLeadStatus(stage: PipelineStage): LeadStatus {
  return stage;
}
