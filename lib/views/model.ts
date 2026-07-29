// Saved Views — the filter state of a list, given a name.
//
// A Saved View is deliberately a very small thing: a scope, a name, a handful of enumerated
// filter values and a sort. It is NOT a stored query, not a serialized predicate, and not a
// blob of JSON that some later code will interpret. That distinction is the entire security
// design of this file.
//
// The reason: a saved view is written by one person and later read by another — a shared view
// is read by the whole workspace, and even a personal view is read back from storage that
// anything on this origin can write. If a view could carry an arbitrary key, an arbitrary
// value or an arbitrary sort expression, then "restore my view" would be "execute what
// somebody else stored". So instead:
//
//   * Every filter key must appear in the scope's declared field list. Unknown keys are
//     rejected, not ignored-and-kept.
//   * Every filter value must be either a declared enum member or a bounded free-text string.
//   * Every sort field must appear in the scope's declared sort list.
//   * `__proto__`, `constructor` and `prototype` are rejected by name before anything else, so
//     a hand-written entry cannot reach Object.prototype through a spread or an index write.
//   * Values that look like an email address, a token, a hash or a URL are rejected outright.
//     A filter is a status or an owner id; none of those shapes has any business in one, and
//     rejecting them is what keeps a saved view from becoming a place to smuggle a recipient
//     address into a shareable link.
//
// Invalid state never throws at a render. `sanitizeFilters` drops what it cannot accept and
// falls back to the scope's defaults, so a corrupt stored view produces the default list — not
// a blank screen and not a crash.
import { SENSITIVE_INDEX_PATTERNS } from "@/lib/search/model";
import type { WorkspaceRole } from "@/lib/dashboard/roles";
import { hasMinRole } from "@/lib/dashboard/roles";

// ---------------------------------------------------------------------------
// Scopes
// ---------------------------------------------------------------------------

export const SAVED_VIEW_SCOPES = [
  "myWork",
  "leads",
  "pipeline",
  "meetings",
  "proposals",
  "followUps",
  "emailActivity",
] as const;
export type SavedViewScope = (typeof SAVED_VIEW_SCOPES)[number];

export const SAVED_VIEW_SCOPE_LABELS: Record<SavedViewScope, string> = {
  myWork: "My Work",
  leads: "Leads",
  pipeline: "Pipeline",
  meetings: "Meetings",
  proposals: "Proposals",
  followUps: "Follow-ups",
  emailActivity: "Email Activity",
};

export const SAVED_VIEW_SCOPE_PATHS: Record<SavedViewScope, string> = {
  myWork: "/dashboard/my-work",
  leads: "/dashboard/leads",
  pipeline: "/dashboard/pipeline",
  meetings: "/dashboard/meetings",
  proposals: "/dashboard/proposals",
  followUps: "/dashboard/follow-ups",
  emailActivity: "/dashboard/email-activity",
};

// ---------------------------------------------------------------------------
// Field declarations
//
// These mirror, exactly, the state each route already holds. `"text"` is the free-text search
// box; a list of strings is a closed set the route's own filter menu offers. `"any"` is a
// bounded identifier — an owner id — whose values are not knowable at compile time.
// ---------------------------------------------------------------------------

export type FieldKind = "text" | "id" | "date" | readonly string[];

/** A calendar day, and nothing else. The Meetings date filter holds one (`DEMO_TODAY` is
 *  `"2026-04-22"`), and it is the only field whose values are neither enumerable at compile
 *  time nor an opaque identifier — so it gets a shape check rather than a length check. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ScopeDescriptor = {
  label: string;
  path: string;
  fields: Readonly<Record<string, FieldKind>>;
  sortFields: readonly string[];
  /** Column visibility per scope. Every list is empty because no list in this application has
   *  a working column chooser — the Leads "Columns" control is explicitly a deferred, disabled
   *  frame (app/dashboard/shell-nav.tsx). The shape exists so the release that builds one has
   *  somewhere to declare it; until then a saved view carrying columns is rejected rather than
   *  silently accepted and silently ignored. */
  columns: readonly string[];
  /** The state a route opens in. A saved view equal to this is "no filters applied". */
  defaults: Readonly<Record<string, string>>;
};

// Every list below is the route's own vocabulary, copied deliberately rather than imported.
// The reason is that these are a stored format: a saved view written today must still parse
// after somebody renames a UI constant, and an import would make that rename silently
// invalidate stored data instead of failing a test. The surface tests assert each list still
// equals its source, so the copy cannot drift unnoticed.
//
//   TASK_VIEW_VALUES      lib/tasks/model.ts        TASK_VIEWS
//   TASK_PRIORITY_VALUES  lib/tasks/model.ts        TASK_PRIORITIES
//   MEETING_VIEW_VALUES   meetings-view.tsx         MeetingsView
//   FOLLOW_UP_VIEW_VALUES follow-ups-view.tsx       FollowUpsView
//   PROPOSAL_STATE_VALUES proposals-view.tsx        STATES
//   PROPOSAL_VALUE_BUCKETS proposals-view.tsx       VALUE_BUCKETS ids
//   PROPOSAL_VIEW_VALUES  proposals-view.tsx        ProposalsView
//   LEAD_VIEW_VALUES      leads-data.tsx            LeadsView
//   EMAIL_STATE_VALUES    email-activity-view.tsx   STATES
//   LEAD_STATUS_VALUES    lib/command-center/contracts/leads.ts  LeadStatusSchema
//   LEAD_SORT_FIELDS      lib/command-center/ui/leads-table.tsx  headerCell ids
const TASK_VIEW_VALUES = ["today", "upcoming", "overdue", "assigned", "waiting", "completed"] as const;
const TASK_PRIORITY_VALUES = ["High", "Medium", "Low"] as const;
// "prepare" is a DERIVED view, not a sixth tab: it selects the same READY meetings the
// "upcoming" tab does, and exists so the Overview's "Meetings to prepare" count has an
// exact destination. The tab strip highlights Upcoming for it; the difference is the
// heading and the clearable chip, not the record set.
const MEETING_VIEW_VALUES = ["upcoming", "live", "review", "completed", "prepare"] as const;

// The two derived views that are reached only from the Overview's operational band.
// They are `view` values, deliberately NOT extra members of the `state`/`status` enums
// beside them: a proposal is never in a state called "attention", and overloading the
// state vocabulary with a question the operations screen happens to ask would make every
// stored saved view and every state filter mean two things.
const PROPOSAL_VIEW_VALUES = ["attention"] as const;
const LEAD_VIEW_VALUES = ["no-next-action"] as const;
const FOLLOW_UP_VIEW_VALUES = ["OVERDUE", "DUE TODAY", "UPCOMING", "SNOOZED", "COMPLETED"] as const;
const PROPOSAL_STATE_VALUES = [
  "DRAFT",
  "INTERNAL REVIEW",
  "APPROVED",
  "SENT",
  "VIEWED",
  "CHANGES REQUESTED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "ARCHIVED",
] as const;
const PROPOSAL_VALUE_BUCKETS = ["under50", "50to100", "over100"] as const;
const EMAIL_STATE_VALUES = ["QUEUED", "SENT", "DELIVERED", "OPENED", "FAILED", "ARCHIVED"] as const;
const LEAD_STATUS_VALUES = [
  "New",
  "Contacted",
  "Appt Pending",
  "Appt Scheduled",
  "Discovery Done",
  "Proposal Req.",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
  "FUL",
] as const;
/** The columns the Leads table actually offers a sort control on. A `sortBy` outside this list
 *  reaches the mock handler's `String(r[sortBy as keyof Lead] ?? "")`, which silently sorts
 *  every row by `""` — a saved view that appears to work and does nothing. Rejected here. */
const LEAD_SORT_FIELDS = [
  "name",
  "serviceInterest",
  "status",
  "owner",
  "appointmentStatus",
  "nextFollowUpAt",
  "createdAt",
] as const;

export const SCOPE_DESCRIPTORS: Record<SavedViewScope, ScopeDescriptor> = {
  myWork: {
    label: SAVED_VIEW_SCOPE_LABELS.myWork,
    path: SAVED_VIEW_SCOPE_PATHS.myWork,
    fields: { view: TASK_VIEW_VALUES, q: "text", owner: "id", priority: TASK_PRIORITY_VALUES },
    sortFields: [],
    columns: [],
    defaults: { view: "today", q: "", owner: "", priority: "" },
  },
  leads: {
    label: SAVED_VIEW_SCOPE_LABELS.leads,
    path: SAVED_VIEW_SCOPE_PATHS.leads,
    // `service` and `owner` are opaque ids drawn from the response's facets and directory, so
    // they cannot be enumerated here; `status` can and is.
    fields: { view: LEAD_VIEW_VALUES, q: "text", status: LEAD_STATUS_VALUES, service: "id", owner: "id" },
    sortFields: LEAD_SORT_FIELDS,
    columns: [],
    // No default view: the canonical Leads list is every lead. `view` is only ever
    // present when a derived operational question was asked.
    defaults: { view: "", q: "", status: "", service: "", owner: "" },
  },
  pipeline: {
    label: SAVED_VIEW_SCOPE_LABELS.pipeline,
    path: SAVED_VIEW_SCOPE_PATHS.pipeline,
    fields: { q: "text", owner: "id", service: "id", priority: TASK_PRIORITY_VALUES },
    sortFields: [],
    columns: [],
    defaults: { q: "", owner: "", service: "", priority: "" },
  },
  meetings: {
    label: SAVED_VIEW_SCOPE_LABELS.meetings,
    path: SAVED_VIEW_SCOPE_PATHS.meetings,
    fields: { view: MEETING_VIEW_VALUES, q: "text", owner: "id", date: "date" },
    sortFields: [],
    columns: [],
    defaults: { view: "review", q: "", owner: "", date: "" },
  },
  proposals: {
    label: SAVED_VIEW_SCOPE_LABELS.proposals,
    path: SAVED_VIEW_SCOPE_PATHS.proposals,
    fields: {
      view: PROPOSAL_VIEW_VALUES,
      q: "text",
      owner: "id",
      state: PROPOSAL_STATE_VALUES,
      value: PROPOSAL_VALUE_BUCKETS,
    },
    sortFields: [],
    columns: [],
    // No default view: the canonical Proposals list is every proposal, in every state.
    defaults: { view: "", q: "", owner: "", state: "", value: "" },
  },
  followUps: {
    label: SAVED_VIEW_SCOPE_LABELS.followUps,
    path: SAVED_VIEW_SCOPE_PATHS.followUps,
    fields: { view: FOLLOW_UP_VIEW_VALUES, q: "text", owner: "id", priority: TASK_PRIORITY_VALUES },
    sortFields: [],
    columns: [],
    defaults: { view: "OVERDUE", q: "", owner: "", priority: "" },
  },
  emailActivity: {
    label: SAVED_VIEW_SCOPE_LABELS.emailActivity,
    path: SAVED_VIEW_SCOPE_PATHS.emailActivity,
    fields: {
      q: "text",
      direction: ["outbound", "inbound"],
      state: EMAIL_STATE_VALUES,
      read: ["read", "unread"],
    },
    sortFields: [],
    columns: [],
    defaults: { q: "", direction: "", state: "", read: "" },
  },
};

export function isSavedViewScope(value: unknown): value is SavedViewScope {
  return typeof value === "string" && (SAVED_VIEW_SCOPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

export type SavedViewFilterState = Readonly<Record<string, string>>;
export type SavedViewSortState = { field: string; direction: "asc" | "desc" } | null;
export type SavedViewColumnState = readonly string[];

/**
 * Who a view belongs to.
 *
 * The two are not variations on a theme. A personal view is device state — it lives in this
 * browser, nobody else can see it, and losing it costs a person thirty seconds. A shared view
 * is workspace data — it is authored once and read by everybody, which makes it a thing that
 * needs a database, an owner recorded server-side, and a role check before it can be changed.
 * Only the first exists in this release; see lib/views/provider.ts.
 */
export type SavedViewOwnership =
  /** A view the product ships with (lib/views/defaults.ts). It is code, not workspace data:
   *  selectable and usable as the starting point for "Save as new", never renamed, edited or
   *  deleted. Modelled as an ownership rather than as a `builtIn` flag beside an owner so that
   *  "shipped, but owned by user-002" is not a state this type can express. */
  | { kind: "builtIn" }
  | { kind: "personal"; userId: string }
  | { kind: "shared"; workspaceId: string };

export type SavedView = {
  id: string;
  scope: SavedViewScope;
  name: string;
  filters: SavedViewFilterState;
  sort: SavedViewSortState;
  columns: SavedViewColumnState;
  ownership: SavedViewOwnership;
};

export function isBuiltIn(view: SavedView): boolean {
  return view.ownership.kind === "builtIn";
}

export const SAVED_VIEW_NAME_MAX = 60;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Keys that must never reach an object literal or an index write. Checked by name, first,
 *  before any value inspection, because the damage from these is structural rather than
 *  informational. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Free text is a search box, not an essay. Longer than this and it is either a paste
 *  accident or somebody using a filter as a storage field. */
const TEXT_VALUE_MAX = 120;

/** A URL in a filter value is the open-redirect shape: a saved view is shareable, and a value
 *  that survives into a link and is later treated as a destination is exactly how one starts. */
const URL_SHAPED = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_KEYS.has(key);
}

/** Why a value may not be stored, or `null` if it may. Returned as a sentence so the UI can
 *  show it rather than a code. */
export function sensitiveValueProblem(key: string, value: string): string | null {
  if (URL_SHAPED.test(value)) {
    return `The ${key} filter cannot hold a URL.`;
  }
  for (const { name, pattern } of SENSITIVE_INDEX_PATTERNS) {
    if (pattern.test(value)) return `The ${key} filter cannot hold what looks like a ${name}.`;
  }
  return null;
}

export type SavedViewDraft = {
  scope: SavedViewScope;
  name: string;
  filters: Readonly<Record<string, unknown>>;
  sort?: SavedViewSortState;
  columns?: readonly string[];
};

/** Problems with a draft, as sentences. Empty means it is valid. */
export function validateSavedViewDraft(draft: SavedViewDraft): string[] {
  const problems: string[] = [];

  if (!isSavedViewScope(draft.scope)) {
    return [`"${String(draft.scope)}" is not a list this application has.`];
  }
  const descriptor = SCOPE_DESCRIPTORS[draft.scope];

  const name = draft.name.trim();
  if (name === "") problems.push("A view needs a name.");
  else if (name.length > SAVED_VIEW_NAME_MAX) {
    problems.push(`A view name can be at most ${SAVED_VIEW_NAME_MAX} characters.`);
  }

  for (const [key, raw] of Object.entries(draft.filters)) {
    if (isForbiddenKey(key)) {
      problems.push(`"${key}" is not a filter name that may be stored.`);
      continue;
    }
    const kind = descriptor.fields[key];
    if (kind === undefined) {
      problems.push(`${descriptor.label} has no "${key}" filter.`);
      continue;
    }
    if (typeof raw !== "string") {
      problems.push(`The ${key} filter must be text.`);
      continue;
    }
    const sensitive = sensitiveValueProblem(key, raw);
    if (sensitive !== null) {
      problems.push(sensitive);
      continue;
    }
    if (kind === "text" || kind === "id") {
      if (raw.length > TEXT_VALUE_MAX) problems.push(`The ${key} filter is too long.`);
    } else if (kind === "date") {
      if (raw !== "" && !ISO_DATE.test(raw)) problems.push(`The ${key} filter must be a date.`);
    } else if (raw !== "" && !kind.includes(raw)) {
      problems.push(`"${raw}" is not a value the ${key} filter accepts.`);
    }
  }

  if (draft.sort != null) {
    if (!descriptor.sortFields.includes(draft.sort.field)) {
      problems.push(`${descriptor.label} cannot be sorted by "${draft.sort.field}".`);
    }
    if (draft.sort.direction !== "asc" && draft.sort.direction !== "desc") {
      problems.push(`"${String(draft.sort.direction)}" is not a sort direction.`);
    }
  }

  for (const column of draft.columns ?? []) {
    if (!descriptor.columns.includes(column)) {
      problems.push(`${descriptor.label} has no "${column}" column to save.`);
    }
  }

  return problems;
}

/**
 * Coerce whatever was stored into filter state that is safe to apply.
 *
 * This is the read path, and it never throws. Anything unrecognised is dropped and the scope's
 * default takes its place, so a saved view written by an older build, a hand-edited storage
 * key or a truncated write all degrade to "the list as it opens" rather than to an error
 * boundary.
 */
export function sanitizeFilters(
  scope: SavedViewScope,
  raw: unknown,
): SavedViewFilterState {
  const descriptor = SCOPE_DESCRIPTORS[scope];
  const result: Record<string, string> = { ...descriptor.defaults };
  if (typeof raw !== "object" || raw === null) return result;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (isForbiddenKey(key)) continue;
    const kind = descriptor.fields[key];
    if (kind === undefined) continue;
    if (typeof value !== "string") continue;
    if (sensitiveValueProblem(key, value) !== null) continue;
    if (kind === "text" || kind === "id") {
      if (value.length > TEXT_VALUE_MAX) continue;
      result[key] = value;
    } else if (kind === "date") {
      if (value !== "" && !ISO_DATE.test(value)) continue;
      result[key] = value;
    } else if (value === "" || kind.includes(value)) {
      result[key] = value;
    }
  }
  return result;
}

export function sanitizeSort(scope: SavedViewScope, raw: unknown): SavedViewSortState {
  if (typeof raw !== "object" || raw === null) return null;
  const candidate = raw as Record<string, unknown>;
  const field = candidate.field;
  const direction = candidate.direction;
  if (typeof field !== "string" || !SCOPE_DESCRIPTORS[scope].sortFields.includes(field)) return null;
  if (direction !== "asc" && direction !== "desc") return null;
  return { field, direction };
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * A view's id, derived from what it is rather than minted from a random source.
 *
 * Deriving it means the same view saved on two machines, or rebuilt after a storage wipe, has
 * the same id — which is what makes "is this the view I had selected?" answerable after a
 * reload. It also means two views in one scope cannot share a name, which
 * {@link nameCollision} turns into an explicit validation message rather than a silent
 * overwrite.
 */
export function savedViewId(scope: SavedViewScope, name: string): string {
  const slug = slugify(name);
  return `sv-${scope}-${slug === "" ? "untitled" : slug}`;
}

export function nameCollision(
  views: readonly SavedView[],
  scope: SavedViewScope,
  name: string,
  ignoreId?: string,
): boolean {
  const id = savedViewId(scope, name);
  return views.some((view) => view.scope === scope && view.id === id && view.id !== ignoreId);
}

/** "Overdue" → "Overdue (copy)" → "Overdue (copy 2)". Deterministic, so duplicating twice
 *  produces predictable names rather than a counter that depends on click order. */
export function duplicateName(views: readonly SavedView[], scope: SavedViewScope, name: string): string {
  const base = `${name} (copy)`;
  if (!nameCollision(views, scope, base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${name} (copy ${n})`;
    if (!nameCollision(views, scope, candidate)) return candidate;
  }
  return `${name} (copy 99)`;
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * A view's filter state as a query string.
 *
 * Deterministic by construction: keys are emitted in the scope's declared order, and any value
 * equal to the scope's default is omitted entirely. So the default state serializes to `""`
 * — a clean URL for an unfiltered list — and two equal states always produce byte-identical
 * strings, which is what makes {@link isDirty} a string comparison rather than a deep one.
 */
export function serializeFilters(
  scope: SavedViewScope,
  filters: SavedViewFilterState,
  sort: SavedViewSortState = null,
): string {
  const descriptor = SCOPE_DESCRIPTORS[scope];
  const parts: string[] = [];
  for (const key of Object.keys(descriptor.fields)) {
    const value = filters[key] ?? "";
    if (value === "" || value === descriptor.defaults[key]) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  if (sort != null && descriptor.sortFields.includes(sort.field)) {
    parts.push(`sort=${encodeURIComponent(`${sort.field}:${sort.direction}`)}`);
  }
  return parts.join("&");
}

/** The inverse, over anything with a `get`. Unknown parameters are ignored rather than
 *  rejected: a URL carries other things — `mock-scenario`, `visual-state`, a create flag — and
 *  a list that refused to load because it did not recognise one of them would be brittle. */
export function parseFilters(
  scope: SavedViewScope,
  params: { get(name: string): string | null },
): SavedViewFilterState {
  const descriptor = SCOPE_DESCRIPTORS[scope];
  const raw: Record<string, unknown> = {};
  for (const key of Object.keys(descriptor.fields)) {
    const value = params.get(key);
    if (value !== null) raw[key] = value;
  }
  return sanitizeFilters(scope, raw);
}

export function parseSort(
  scope: SavedViewScope,
  params: { get(name: string): string | null },
): SavedViewSortState {
  const raw = params.get("sort");
  if (raw === null) return null;
  const [field, direction] = raw.split(":");
  return sanitizeSort(scope, { field, direction });
}

/** The route to open with this view applied. Always a same-origin path — the base is a
 *  constant from {@link SAVED_VIEW_SCOPE_PATHS}, never anything a stored value contributes,
 *  so this cannot be steered into an off-site destination. */
export function savedViewHref(view: SavedView): string {
  const query = serializeFilters(view.scope, view.filters, view.sort);
  const path = SAVED_VIEW_SCOPE_PATHS[view.scope];
  return query === "" ? path : `${path}?${query}`;
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/** True when the list currently shows something other than what the selected view saved. The
 *  comparison is over the serialized form, so a filter set back to its default reads as clean
 *  rather than as "changed to empty". */
export function isDirty(
  scope: SavedViewScope,
  view: SavedView | null,
  filters: SavedViewFilterState,
  sort: SavedViewSortState = null,
): boolean {
  const current = serializeFilters(scope, filters, sort);
  if (view === null) return current !== "";
  return current !== serializeFilters(scope, view.filters, view.sort);
}

/** True when the list is in the state it opens in. */
export function isDefaultState(
  scope: SavedViewScope,
  filters: SavedViewFilterState,
  sort: SavedViewSortState = null,
): boolean {
  return serializeFilters(scope, filters, sort) === "";
}

export function defaultFilters(scope: SavedViewScope): SavedViewFilterState {
  return { ...SCOPE_DESCRIPTORS[scope].defaults };
}

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

/** A personal view belongs to exactly one person; nobody else may change it, including an
 *  owner. Shared views are workspace configuration and need `admin`. Both decisions are
 *  re-made server-side by the provider and again by RLS — this is the UI's copy of the rule,
 *  not the rule. */
export function canEditSavedView(
  view: SavedView,
  actor: { userId: string; role: WorkspaceRole },
): boolean {
  if (view.ownership.kind === "builtIn") return false;
  if (view.ownership.kind === "personal") return view.ownership.userId === actor.userId;
  return hasMinRole(actor.role, "admin");
}

export function canCreateSharedView(actor: { role: WorkspaceRole }): boolean {
  return hasMinRole(actor.role, "admin");
}
