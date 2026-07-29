// The Command Center activity domain.
//
// One event shape for every record in the dashboard — leads, meetings, proposals, tasks,
// follow-ups, appointments, email activity and the workspace itself. Routes do not define
// their own event models: a proposal-activity screen, a lead timeline and the Overview all
// read the same events through the derivations below, so a count on one screen and a list
// on another can never disagree.
//
// Pure module: no React, no store import, no clock, no random source. Timestamps are read
// as strings and never parsed through the local timezone for display, so the server render
// and the client render agree.
import { CANONICAL_LEAD_STATUS_ORDER, type LeadStatus } from "@command-center/contracts";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** What kind of work an event belongs to. Drives filters and grouping. */
export const ACTIVITY_CATEGORIES = [
  "lead",
  "task",
  "meeting",
  "proposal",
  "communication",
  "followUp",
  "appointment",
  "system",
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  lead: "Lead",
  task: "Task",
  meeting: "Meeting",
  proposal: "Proposal",
  communication: "Communication",
  followUp: "Follow-up",
  appointment: "Appointment",
  system: "System",
};

/** Where the event came from. `demo_fixture` is the seeded history; `user_action` is
 *  something a person did in this session; `provider` is a live backend. Kept explicit so
 *  a screen can never present seeded history as if it were live traffic. */
export const ACTIVITY_SOURCES = [
  "user_action",
  "demo_fixture",
  "provider",
  "imported_history",
  "system_derived",
] as const;
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

export const ACTIVITY_SOURCE_LABELS: Record<ActivitySource, string> = {
  user_action: "User action",
  demo_fixture: "Demo fixture",
  provider: "Provider",
  imported_history: "Imported history",
  system_derived: "System",
};

/** Who an event may be shown to. `client_safe` is a forward contract for the Secure Client
 *  Proposal release — nothing in this release exposes a public route, and `restricted`
 *  never leaves an internal screen. */
export const ACTIVITY_VISIBILITIES = ["internal", "client_safe", "restricted"] as const;
export type ActivityVisibility = (typeof ACTIVITY_VISIBILITIES)[number];

export const ACTIVITY_IMPORTANCES = ["critical", "notable", "routine"] as const;
export type ActivityImportance = (typeof ACTIVITY_IMPORTANCES)[number];

export const ACTIVITY_IMPORTANCE_LABELS: Record<ActivityImportance, string> = {
  critical: "Needs attention",
  notable: "Notable",
  routine: "Routine",
};

/** Rank for sorting and for the Overview cut. Lower is more important. */
export const ACTIVITY_IMPORTANCE_RANK: Record<ActivityImportance, number> = {
  critical: 0,
  notable: 1,
  routine: 2,
};

/** Record kinds an event can point at. Every kind resolves to a route or to an explicit
 *  null in {@link activityHref} — there is no kind here without a decided destination. */
export const ACTIVITY_RECORD_KINDS = [
  "lead",
  "opportunity",
  "meeting",
  "proposal",
  "task",
  "followUp",
  "appointment",
  "email",
  "workspace",
] as const;
export type ActivityRecordKind = (typeof ACTIVITY_RECORD_KINDS)[number];

export const ACTIVITY_RECORD_LABELS: Record<ActivityRecordKind, string> = {
  lead: "Lead",
  opportunity: "Opportunity",
  meeting: "Meeting",
  proposal: "Proposal",
  task: "Task",
  followUp: "Follow-up",
  appointment: "Appointment",
  email: "Email",
  workspace: "Workspace",
};

// ---------------------------------------------------------------------------
// Event types
//
// Only operations this application genuinely supports. Client-side proposal events
// (viewed, accepted, declined, commented, link expired, link revoked) are deliberately
// absent: there is no secure client route yet, so there is no way to observe them, and an
// event nobody can observe is a fabrication. See UNSUPPORTED_CLIENT_EVENT_TYPES.
// ---------------------------------------------------------------------------

export const ACTIVITY_EVENT_TYPES = [
  // Lead
  "lead_created",
  "lead_updated",
  "lead_assigned",
  "lead_stage_changed",
  "lead_status_changed",
  "note_added",
  "opportunity_created",
  "opportunity_updated",
  // Task
  "task_created",
  "task_updated",
  "task_assignee_changed",
  "task_due_date_changed",
  "task_status_changed",
  "task_completed",
  "task_reopened",
  "task_waiting_changed",
  // Meeting
  "meeting_scheduled",
  "meeting_updated",
  "meeting_rescheduled",
  "meeting_cancelled",
  "meeting_preparation_started",
  "meeting_preparation_task_created",
  "meeting_started",
  "meeting_completed",
  "meeting_review_completed",
  "meeting_transcript_available",
  "meeting_decision_recorded",
  "meeting_action_item_created",
  // Proposal
  "proposal_created",
  "proposal_edited",
  "proposal_version_created",
  "proposal_validation_started",
  "proposal_validation_passed",
  "proposal_validation_blocked",
  "proposal_review_requested",
  "proposal_review_approved",
  "proposal_review_rejected",
  "proposal_preview_generated",
  "proposal_marked_ready",
  "proposal_status_changed",
  // Secure client access. Every one of these is now observable: publication and link
  // management happen inside the workspace, and the open/response events are produced by the
  // public /proposal/[secureToken] route rather than assumed.
  "proposal_published",
  "proposal_superseded",
  "proposal_access_link_created",
  "proposal_access_link_revoked",
  "proposal_access_link_replaced",
  "proposal_first_opened_by_client",
  "proposal_opened_by_client",
  "client_question_submitted",
  "client_comment_submitted",
  "proposal_accepted_by_client",
  "proposal_declined_by_client",
  // Follow-up
  "follow_up_created",
  "follow_up_completed",
  "follow_up_rescheduled",
  "follow_up_updated",
  // Appointment
  "appointment_booked",
  "appointment_updated",
  "appointment_rescheduled",
  "appointment_cancelled",
  // Communication
  "email_activity_recorded",
  "email_sent",
  "email_archived",
  "email_retry_queued",
  // System
  "team_member_invited",
  "team_member_removed",
  "team_updated",
  "settings_updated",
  "workspace_updated",
] as const;
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

/** Events that belong to a release that has not happened. Named here so the exclusion is
 *  testable and deliberate rather than an oversight. Nothing may emit these.
 *
 *  Client interaction — opened, questioned, accepted, declined, link revoked or expired — is
 *  no longer on this list: the secure client proposal route observes all of it, so those
 *  types are now real members of ACTIVITY_EVENT_TYPES. What remains deferred is electronic
 *  SIGNATURE, which needs a certified third-party provider this product has not integrated.
 *  Recording a "signed" event without one would be a claim about legal enforceability. */
export const UNSUPPORTED_CLIENT_EVENT_TYPES = [
  "proposal_signature_requested",
  "proposal_signed",
  "proposal_signature_declined",
  "proposal_signature_expired",
] as const;

/** The honest sentence a proposal screen shows about what its history still cannot report. */
export const SIGNATURE_ACTIVITY_UNAVAILABLE =
  "Acceptance here is a recorded decision with a typed name. Certified electronic signature is not part of this release, so no signature events appear in this history.";

type EventMeta = { category: ActivityCategory; label: string; importance: ActivityImportance };

/** Category and default importance live with the type, so no screen invents its own
 *  mapping and two screens cannot disagree about what a proposal rejection means. */
export const ACTIVITY_EVENT_META: Record<ActivityEventType, EventMeta> = {
  lead_created: { category: "lead", label: "Lead created", importance: "notable" },
  lead_updated: { category: "lead", label: "Lead updated", importance: "routine" },
  lead_assigned: { category: "lead", label: "Lead assigned", importance: "notable" },
  lead_stage_changed: { category: "lead", label: "Stage changed", importance: "notable" },
  lead_status_changed: { category: "lead", label: "Status changed", importance: "notable" },
  note_added: { category: "lead", label: "Note added", importance: "routine" },
  opportunity_created: { category: "lead", label: "Opportunity created", importance: "notable" },
  opportunity_updated: { category: "lead", label: "Opportunity updated", importance: "routine" },

  task_created: { category: "task", label: "Next action created", importance: "notable" },
  task_updated: { category: "task", label: "Task updated", importance: "routine" },
  task_assignee_changed: { category: "task", label: "Assignee changed", importance: "routine" },
  task_due_date_changed: { category: "task", label: "Due date changed", importance: "routine" },
  task_status_changed: { category: "task", label: "Task status changed", importance: "routine" },
  task_completed: { category: "task", label: "Task completed", importance: "notable" },
  task_reopened: { category: "task", label: "Task reopened", importance: "notable" },
  task_waiting_changed: { category: "task", label: "Waiting on client changed", importance: "notable" },

  meeting_scheduled: { category: "meeting", label: "Meeting scheduled", importance: "notable" },
  meeting_updated: { category: "meeting", label: "Meeting updated", importance: "routine" },
  meeting_rescheduled: { category: "meeting", label: "Meeting rescheduled", importance: "notable" },
  meeting_cancelled: { category: "meeting", label: "Meeting cancelled", importance: "critical" },
  meeting_preparation_started: { category: "meeting", label: "Preparation started", importance: "routine" },
  meeting_preparation_task_created: { category: "meeting", label: "Preparation task created", importance: "routine" },
  meeting_started: { category: "meeting", label: "Meeting started", importance: "routine" },
  meeting_completed: { category: "meeting", label: "Meeting completed", importance: "notable" },
  meeting_review_completed: { category: "meeting", label: "Review completed", importance: "notable" },
  meeting_transcript_available: { category: "meeting", label: "Transcript available", importance: "routine" },
  meeting_decision_recorded: { category: "meeting", label: "Decision recorded", importance: "critical" },
  meeting_action_item_created: { category: "meeting", label: "Action item created", importance: "notable" },

  proposal_created: { category: "proposal", label: "Proposal created", importance: "notable" },
  proposal_edited: { category: "proposal", label: "Proposal edited", importance: "routine" },
  proposal_version_created: { category: "proposal", label: "Version created", importance: "notable" },
  proposal_validation_started: { category: "proposal", label: "Validation started", importance: "routine" },
  proposal_validation_passed: { category: "proposal", label: "Validation passed", importance: "notable" },
  proposal_validation_blocked: { category: "proposal", label: "Validation blocked", importance: "critical" },
  proposal_review_requested: { category: "proposal", label: "Review requested", importance: "notable" },
  proposal_review_approved: { category: "proposal", label: "Review approved", importance: "critical" },
  proposal_review_rejected: { category: "proposal", label: "Review rejected", importance: "critical" },
  proposal_preview_generated: { category: "proposal", label: "Preview generated", importance: "routine" },
  proposal_marked_ready: { category: "proposal", label: "Marked ready", importance: "notable" },
  proposal_status_changed: { category: "proposal", label: "Status changed", importance: "notable" },
  proposal_published: { category: "proposal", label: "Version published", importance: "critical" },
  proposal_superseded: { category: "proposal", label: "Version superseded", importance: "notable" },
  proposal_access_link_created: { category: "proposal", label: "Client access granted", importance: "notable" },
  proposal_access_link_revoked: { category: "proposal", label: "Client access revoked", importance: "critical" },
  proposal_access_link_replaced: { category: "proposal", label: "Client access replaced", importance: "notable" },
  // The first open is the one that changes what the workspace knows — the proposal has
  // reached the client. Every open after that is ordinary traffic, and filing all of them as
  // notable would bury the events that matter under a read counter.
  proposal_first_opened_by_client: { category: "proposal", label: "Opened by client", importance: "critical" },
  proposal_opened_by_client: { category: "proposal", label: "Reopened by client", importance: "routine" },
  client_question_submitted: { category: "proposal", label: "Question from client", importance: "critical" },
  client_comment_submitted: { category: "proposal", label: "Comment from client", importance: "notable" },
  proposal_accepted_by_client: { category: "proposal", label: "Accepted by client", importance: "critical" },
  proposal_declined_by_client: { category: "proposal", label: "Declined by client", importance: "critical" },

  follow_up_created: { category: "followUp", label: "Follow-up created", importance: "notable" },
  follow_up_completed: { category: "followUp", label: "Follow-up completed", importance: "notable" },
  follow_up_rescheduled: { category: "followUp", label: "Follow-up rescheduled", importance: "routine" },
  follow_up_updated: { category: "followUp", label: "Follow-up updated", importance: "routine" },

  appointment_booked: { category: "appointment", label: "Appointment booked", importance: "notable" },
  appointment_updated: { category: "appointment", label: "Appointment updated", importance: "routine" },
  appointment_rescheduled: { category: "appointment", label: "Appointment rescheduled", importance: "routine" },
  appointment_cancelled: { category: "appointment", label: "Appointment cancelled", importance: "critical" },

  email_activity_recorded: { category: "communication", label: "Email activity recorded", importance: "routine" },
  email_sent: { category: "communication", label: "Email sent", importance: "notable" },
  email_archived: { category: "communication", label: "Email archived", importance: "routine" },
  email_retry_queued: { category: "communication", label: "Email retry queued", importance: "routine" },

  team_member_invited: { category: "system", label: "Team member invited", importance: "notable" },
  team_member_removed: { category: "system", label: "Team member removed", importance: "critical" },
  team_updated: { category: "system", label: "Team updated", importance: "routine" },
  settings_updated: { category: "system", label: "Settings updated", importance: "routine" },
  workspace_updated: { category: "system", label: "Workspace updated", importance: "routine" },
};

// ---------------------------------------------------------------------------
// The event
// ---------------------------------------------------------------------------

export type ActivityRef = { kind: ActivityRecordKind; id: string; label: string };

/** Displayable metadata. A list of label/value pairs, never a JSON blob: a person reading
 *  their own lead history should not be shown a serialized object. */
export type ActivityMetadata = readonly { label: string; value: string }[];

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  category: ActivityCategory;
  source: ActivitySource;
  visibility: ActivityVisibility;
  importance: ActivityImportance;
  /** Team-member id, or null when the workspace itself did it. Never client-supplied. */
  actorId: string | null;
  actorLabel: string;
  /** Fixed ISO instant. Never clock-derived. */
  occurredAt: string;
  summary: string;
  detail: string;
  /** The record this event is about. */
  related: ActivityRef;
  /** The record the timeline rolls up to — usually the lead. */
  parent: ActivityRef | null;
  metadata: ActivityMetadata;
};

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

export function categoryOf(type: ActivityEventType): ActivityCategory {
  return ACTIVITY_EVENT_META[type].category;
}

export function eventTypeLabel(type: ActivityEventType): string {
  return ACTIVITY_EVENT_META[type].label;
}

export function defaultImportance(type: ActivityEventType): ActivityImportance {
  return ACTIVITY_EVENT_META[type].importance;
}

/** Newest first. Ties break on id descending so the order is total and stable — two events
 *  stamped at the same fixed instant must not swap places between renders. */
export function sortEvents(events: readonly ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((a, b) => {
    if (a.occurredAt !== b.occurredAt) return a.occurredAt < b.occurredAt ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
}

/** Events about a record, including the ones that roll up to it (a proposal event on a
 *  lead timeline, a task event on a meeting). */
export function eventsFor(
  events: readonly ActivityEvent[],
  kind: ActivityRecordKind,
  id: string,
): ActivityEvent[] {
  return sortEvents(
    events.filter(
      (event) =>
        (event.related.kind === kind && event.related.id === id) ||
        (event.parent?.kind === kind && event.parent.id === id),
    ),
  );
}

/** Events about exactly this record — no roll-up. Used where a module must not inherit a
 *  whole lead's history (the compact modules on related records). */
export function eventsOn(
  events: readonly ActivityEvent[],
  kind: ActivityRecordKind,
  id: string,
): ActivityEvent[] {
  return sortEvents(events.filter((event) => event.related.kind === kind && event.related.id === id));
}

export type ActivityFilter = {
  categories: readonly ActivityCategory[];
  actorId: string | null;
  importance: ActivityImportance | null;
  query: string;
};

export const EMPTY_ACTIVITY_FILTER: ActivityFilter = {
  categories: [],
  actorId: null,
  importance: null,
  query: "",
};

export function isFilterActive(filter: ActivityFilter): boolean {
  return (
    filter.categories.length > 0 ||
    filter.actorId !== null ||
    filter.importance !== null ||
    filter.query.trim() !== ""
  );
}

export function matchesQuery(event: ActivityEvent, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return (
    event.summary.toLowerCase().includes(needle) ||
    event.detail.toLowerCase().includes(needle) ||
    event.related.label.toLowerCase().includes(needle) ||
    event.actorLabel.toLowerCase().includes(needle) ||
    eventTypeLabel(event.type).toLowerCase().includes(needle)
  );
}

export function filterEvents(
  events: readonly ActivityEvent[],
  filter: ActivityFilter,
): ActivityEvent[] {
  return sortEvents(
    events.filter((event) => {
      if (filter.categories.length > 0 && !filter.categories.includes(event.category)) return false;
      if (filter.actorId !== null && event.actorId !== filter.actorId) return false;
      if (filter.importance !== null && event.importance !== filter.importance) return false;
      return matchesQuery(event, filter.query);
    }),
  );
}

/** Category counts over a set — the numbers a filter control shows. A category with no
 *  events is still present with 0, so a filter never appears that would empty the list. */
export function categoryCounts(
  events: readonly ActivityEvent[],
): Record<ActivityCategory, number> {
  const counts = Object.fromEntries(ACTIVITY_CATEGORIES.map((category) => [category, 0])) as Record<
    ActivityCategory,
    number
  >;
  for (const event of events) counts[event.category] += 1;
  return counts;
}

/** Actors present in a set, in display order. Only actors that actually appear — a filter
 *  listing someone with nothing to show is a dead control. */
export function actorsIn(
  events: readonly ActivityEvent[],
): { id: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const event of sortEvents(events)) {
    if (event.actorId && !seen.has(event.actorId)) seen.set(event.actorId, event.actorLabel);
  }
  return [...seen].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
}

// ---------------------------------------------------------------------------
// Time — string-sliced, never parsed through the local timezone
// ---------------------------------------------------------------------------

/** YYYY-MM-DD from a fixed ISO instant. String slicing, not Date parsing: parsing would
 *  render one day on a UTC server and another in a western browser, which is a hydration
 *  mismatch and a wrong date at the same time. */
export function dayKey(occurredAt: string): string {
  return occurredAt.slice(0, 10);
}

/** HH:MM in UTC, labelled as such so the number is not silently wrong for a reader in
 *  another zone. */
export function timeLabel(occurredAt: string): string {
  return `${occurredAt.slice(11, 16)} UTC`;
}

function dayNumber(day: string): number {
  return Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
}

/** "Today" / "Yesterday" / the date, relative to the demo's fixed today. */
export function dayLabel(day: string, today: string): string {
  if (day === today) return "Today";
  const diff = (dayNumber(today) - dayNumber(day)) / 86_400_000;
  if (diff === 1) return "Yesterday";
  return day;
}

export type ActivityDayGroup = { day: string; label: string; events: ActivityEvent[] };

/** Newest day first, newest event first inside a day. Grouping is what makes a long
 *  timeline readable; it is not decoration. */
export function groupByDay(
  events: readonly ActivityEvent[],
  today: string,
): ActivityDayGroup[] {
  const groups = new Map<string, ActivityEvent[]>();
  for (const event of sortEvents(events)) {
    const day = dayKey(event.occurredAt);
    const bucket = groups.get(day);
    if (bucket) bucket.push(event);
    else groups.set(day, [event]);
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, dayEvents]) => ({ day, label: dayLabel(day, today), events: dayEvents }));
}

// ---------------------------------------------------------------------------
// Importance cut
// ---------------------------------------------------------------------------

/** What the Overview is allowed to surface: things somebody has to know about. A routine
 *  edit is real history but it is not news. */
export function isImportant(event: ActivityEvent): boolean {
  return event.importance !== "routine";
}

/** The Overview cut. Deterministic: importance first, then recency, then id. */
export function recentImportant(
  events: readonly ActivityEvent[],
  limit: number,
): ActivityEvent[] {
  return sortEvents(events.filter(isImportant))
    .sort((a, b) => {
      const rank = ACTIVITY_IMPORTANCE_RANK[a.importance] - ACTIVITY_IMPORTANCE_RANK[b.importance];
      if (rank !== 0) return rank;
      if (a.occurredAt !== b.occurredAt) return a.occurredAt < b.occurredAt ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    })
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Where a referenced record opens. Returns null when the kind has no per-record route in
 *  this application — the caller then renders a label instead of a link, because a link to
 *  a route that does not exist is worse than no link.
 *
 *  Leads are the one deliberate asymmetry: the lead-detail route resolves the
 *  server-side lead universe, while the demo store's own lead directory is a different id
 *  space (documented in work/FULL-COMMAND-CENTER-CANONICAL-DEVIATIONS.md). A store lead id
 *  therefore opens the list, and only a resolvable lead id deep-links. */
export function activityHref(ref: ActivityRef): string | null {
  switch (ref.kind) {
    case "lead":
      return isResolvableLeadId(ref.id) ? `/dashboard/leads/${ref.id}` : "/dashboard/leads";
    // The board is the opportunity's only screen; there is no per-opportunity route to
    // deep-link to, so the event opens the board rather than nothing.
    case "opportunity":
      return "/dashboard/pipeline";
    case "meeting":
      return `/dashboard/meetings/${ref.id}/review`;
    case "proposal":
      return `/dashboard/proposals/${ref.id}/activity`;
    case "task":
      return `/dashboard/my-work/${ref.id}`;
    case "followUp":
      return "/dashboard/follow-ups";
    case "appointment":
      return "/dashboard/appointments";
    case "email":
      return "/dashboard/email-activity";
    case "workspace":
      return null;
  }
}

/** The lead-detail route resolves UUID lead ids. The demo store's directory uses
 *  `lead-001`-style ids, which that route cannot open. */
export function isResolvableLeadId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ---------------------------------------------------------------------------
// Consistency
//
// The fixtures are hand-authored history. Hand-authored history drifts: a review dated
// before its proposal, a completion before its creation, an id that no longer exists.
// These checks run in the test suite and return problems as sentences, so a broken fixture
// fails loudly instead of rendering a timeline that quietly lies.
// ---------------------------------------------------------------------------

export type ActivityRecordIndex = {
  /** id -> earliest instant the record can have any history. */
  createdAt: ReadonlyMap<string, string>;
  /** Every id that exists, by kind. */
  ids: ReadonlyMap<ActivityRecordKind, ReadonlySet<string>>;
};

const CREATION_TYPES: ReadonlySet<ActivityEventType> = new Set([
  "lead_created",
  "task_created",
  "meeting_scheduled",
  "proposal_created",
  "follow_up_created",
  "appointment_booked",
]);

/** Events that cannot precede the creation of the record they are about. */
const MUST_FOLLOW_CREATION: ReadonlySet<ActivityEventType> = new Set([
  ...CREATION_TYPES,
  "task_completed",
  "task_reopened",
  "task_status_changed",
  "meeting_completed",
  "meeting_review_completed",
  "meeting_started",
  "proposal_review_requested",
  "proposal_review_approved",
  "proposal_review_rejected",
  "proposal_version_created",
  "proposal_status_changed",
  "follow_up_completed",
]);

export function validateActivityConsistency(
  events: readonly ActivityEvent[],
  index: ActivityRecordIndex,
): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();
  const firstSeen = new Map<string, string>();

  for (const event of sortEvents(events).slice().reverse()) {
    if (seenIds.has(event.id)) problems.push(`duplicate event id ${event.id}`);
    seenIds.add(event.id);

    if (!/^act-\d{4}$/.test(event.id)) problems.push(`event id ${event.id} is not a stable act-NNNN id`);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(event.occurredAt)) {
      problems.push(`event ${event.id} has a non-fixed timestamp ${event.occurredAt}`);
    }
    if (categoryOf(event.type) !== event.category) {
      problems.push(`event ${event.id} claims category ${event.category} for type ${event.type}`);
    }
    if (event.summary.trim() === "") problems.push(`event ${event.id} has no summary`);

    const known = index.ids.get(event.related.kind);
    if (known && !known.has(event.related.id)) {
      problems.push(`event ${event.id} points at missing ${event.related.kind} ${event.related.id}`);
    }
    if (event.parent) {
      const parents = index.ids.get(event.parent.kind);
      if (parents && !parents.has(event.parent.id)) {
        problems.push(`event ${event.id} rolls up to missing ${event.parent.kind} ${event.parent.id}`);
      }
    }

    const recordKey = `${event.related.kind}:${event.related.id}`;
    if (CREATION_TYPES.has(event.type)) {
      if (firstSeen.has(recordKey) && firstSeen.get(recordKey)! < event.occurredAt) {
        problems.push(`event ${event.id} creates ${recordKey} after it already had history`);
      }
      firstSeen.set(recordKey, event.occurredAt);
    } else if (MUST_FOLLOW_CREATION.has(event.type)) {
      const created = firstSeen.get(recordKey);
      if (created && event.occurredAt < created) {
        problems.push(`event ${event.id} predates the creation of ${recordKey}`);
      }
    }

    const recordCreated = index.createdAt.get(event.related.id);
    if (recordCreated && event.occurredAt < recordCreated) {
      problems.push(`event ${event.id} predates its record ${event.related.id}`);
    }
  }

  return problems;
}

/** Lead stage history must move forward through the canonical order, or land on a terminal
 *  status. A demo that walks a lead backwards through the funnel teaches the wrong thing. */
export function validateStageSequence(stages: readonly LeadStatus[]): string[] {
  const problems: string[] = [];
  const terminal: readonly LeadStatus[] = ["Won", "Lost", "FUL"];
  let previous = -1;
  for (const [position, stage] of stages.entries()) {
    const index = CANONICAL_LEAD_STATUS_ORDER.indexOf(stage);
    if (index === -1) {
      problems.push(`unknown lead stage ${stage}`);
      continue;
    }
    if (index <= previous && !terminal.includes(stage)) {
      problems.push(`stage ${stage} at position ${position} does not move the lead forward`);
    }
    previous = index;
  }
  return problems;
}
