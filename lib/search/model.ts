// Unified Command Center search.
//
// One index over every record the dashboard already owns, so a person can find a meeting,
// the proposal that came out of it and the task that chases it without knowing which of the
// nine routes each one lives on.
//
// Three properties hold everything else up:
//
//   * A result is a POINTER, never a payload. A document carries a title, a context line, a
//     status and a route — the things a row renders. It does not carry a proposal's body, a
//     client's message, an internal note or a recipient's address, because a search index is
//     the one place in an application where every record is readable at once and the blast
//     radius of putting something sensitive in it is the whole workspace.
//
//   * A result's route is checked against the route registry before it is ever shown
//     (`SEARCH_ROUTE_KINDS` below and `assertIndexConsistency`). A search that offers a link
//     to a 404 is worse than a search that finds nothing.
//
//   * Ordering is a pure function of (score, sortKey, key). No clock, no random source, no
//     insertion order. The same query over the same index returns the same list in the same
//     order on every machine, which is what makes the demo index testable at all.
//
// Permission filtering lives in `permission.ts`-adjacent helpers at the bottom of this file
// and, in live mode, a second time in the database. The client filter is a convenience for
// the person typing; it is NOT the boundary. See lib/search/provider.ts.
import { activityHref, type ActivityRecordKind } from "@/lib/activity/model";
import type { WorkspaceRole } from "@/lib/dashboard/roles";
import { hasMinRole } from "@/lib/dashboard/roles";

// ---------------------------------------------------------------------------
// Entity types and groups
// ---------------------------------------------------------------------------

/** What can be found. Deliberately the record kinds that already have a route — an entity
 *  type here with no resolvable href would be a result nobody can open. */
export const SEARCH_ENTITY_TYPES = [
  "lead",
  "opportunity",
  "task",
  "meeting",
  "proposal",
  "followUp",
  "appointment",
  "email",
  "activity",
] as const;
export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

/** The heading a result sits under. Pipeline is its own group rather than folded into Leads:
 *  an opportunity is a deal on a board, a lead is a person in a directory, and filing one
 *  under the other's heading would tell the reader something untrue about where it lives. */
export const SEARCH_GROUPS = [
  "Leads",
  "Pipeline",
  "Tasks",
  "Meetings",
  "Proposals",
  "Follow-ups",
  "Appointments",
  "Communications",
  "Activity",
] as const;
export type SearchGroup = (typeof SEARCH_GROUPS)[number];

export const SEARCH_GROUP_OF: Record<SearchEntityType, SearchGroup> = {
  lead: "Leads",
  opportunity: "Pipeline",
  task: "Tasks",
  meeting: "Meetings",
  proposal: "Proposals",
  followUp: "Follow-ups",
  appointment: "Appointments",
  email: "Communications",
  activity: "Activity",
};

/** Singular, readable type name for a result row. A row states its type in words rather than
 *  by icon alone, so a screen reader announces "Proposal — Harbor Logistics", not "Harbor
 *  Logistics" with a decorative glyph beside it. */
export const SEARCH_TYPE_LABELS: Record<SearchEntityType, string> = {
  lead: "Lead",
  opportunity: "Opportunity",
  task: "Task",
  meeting: "Meeting",
  proposal: "Proposal",
  followUp: "Follow-up",
  appointment: "Appointment",
  email: "Email",
  activity: "Activity",
};

// ---------------------------------------------------------------------------
// Scopes
// ---------------------------------------------------------------------------

export const SEARCH_SCOPES = [
  "all",
  "leads",
  "tasks",
  "meetings",
  "proposals",
  "followUps",
  "communications",
] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number];

export const SEARCH_SCOPE_LABELS: Record<SearchScope, string> = {
  all: "All",
  leads: "Leads",
  tasks: "Tasks",
  meetings: "Meetings",
  proposals: "Proposals",
  followUps: "Follow-ups",
  communications: "Communications",
};

/** Which entity types a scope admits. `leads` covers the pipeline too: a person narrowing to
 *  "leads" is narrowing to the demand side, and hiding the opportunity that belongs to the
 *  lead they just found would be a surprising omission rather than a useful filter. */
const SCOPE_TYPES: Record<SearchScope, readonly SearchEntityType[]> = {
  all: SEARCH_ENTITY_TYPES,
  leads: ["lead", "opportunity"],
  tasks: ["task"],
  meetings: ["meeting", "appointment"],
  proposals: ["proposal"],
  followUps: ["followUp"],
  communications: ["email"],
};

export function scopeAdmits(scope: SearchScope, type: SearchEntityType): boolean {
  return SCOPE_TYPES[scope].includes(type);
}

/** Only the scopes an index actually has records for. A scope tab that always returns nothing
 *  is a control that lies about what the workspace contains. */
export function availableScopes(
  documents: readonly CommandCenterSearchDocument[],
): SearchScope[] {
  const present = new Set(documents.map((doc) => doc.type));
  return SEARCH_SCOPES.filter(
    (scope) => scope === "all" || SCOPE_TYPES[scope].some((type) => present.has(type)),
  );
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

/** Record kinds `activityHref` resolves. Every document's href is produced through it, so the
 *  route registry stays the single place that decides where a record kind opens. */
const SEARCH_ROUTE_KINDS: Record<SearchEntityType, ActivityRecordKind> = {
  lead: "lead",
  opportunity: "opportunity",
  task: "task",
  meeting: "meeting",
  proposal: "proposal",
  followUp: "followUp",
  appointment: "appointment",
  email: "email",
  activity: "workspace",
};

/**
 * One indexed record.
 *
 * `body` is the only free-text field, and it is where the discipline matters: it may hold a
 * company, a service, a stage or an authored summary. It may NOT hold a secure proposal
 * token, an access link, a recipient address, an internal note or a client's message —
 * {@link SENSITIVE_INDEX_PATTERNS} rejects those at build time rather than trusting each call
 * site to remember.
 */
export type CommandCenterSearchDocument = {
  /** `${type}:${id}`. Unique across the index; duplicates are a build error, not a dedupe. */
  key: string;
  type: SearchEntityType;
  id: string;
  title: string;
  /** The context line under the title — company, lead, or what the record is about. */
  subtitle: string;
  /** Additional matchable text. Never sensitive. See the type docstring. */
  body: string;
  /** Status chip text, already in the vocabulary the owning route uses. */
  status: string;
  /** Display name of the owner or assignee, or "" where the record has none. */
  ownerLabel: string;
  /** Authored display timestamp ("Apr 22", "Overdue"). Never derived from the real clock. */
  timestampLabel: string;
  /** Sortable instant or day key, descending. Recency tie-breaker only — never a rank. */
  sortKey: string;
  /** Where the result opens. Produced by `documentHref`, never hand-written. */
  href: string;
};

export type CommandCenterSearchResult = CommandCenterSearchDocument & {
  score: number;
  group: SearchGroup;
  typeLabel: string;
};

export type SearchResultGroup = {
  group: SearchGroup;
  results: CommandCenterSearchResult[];
};

/** The one way a document gets a route. `null` means the kind has no screen, and a document
 *  with no screen is not indexed at all. */
export function documentHref(type: SearchEntityType, id: string): string | null {
  if (type === "activity") {
    // An activity event is a fact ABOUT a record, so it opens the record. The caller supplies
    // the related ref's route directly; there is no /dashboard/activity screen to open.
    return null;
  }
  return activityHref({ kind: SEARCH_ROUTE_KINDS[type], id, label: "" });
}

// ---------------------------------------------------------------------------
// What must never reach the index
// ---------------------------------------------------------------------------

/**
 * Text shapes that must not appear in any indexed field.
 *
 * Three of these are secure-proposal material: a demo access token, a raw base64url token of
 * the length lib/proposals/access/token.ts mints, and a SHA-256 hex hash of one. Indexing any
 * of them would put a client's private link into a control that every member of the workspace
 * can type into — which is precisely the thing the secure proposal release was built to
 * prevent. The fourth is an email address: a recipient is a person outside this workspace and
 * their address is not a search key.
 */
export const SENSITIVE_INDEX_PATTERNS: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  { name: "demo access token", pattern: /demo-proposal-[a-z0-9-]+/i },
  { name: "raw access token", pattern: /\b[A-Za-z0-9_-]{40,}\b/ },
  { name: "token hash", pattern: /\b[0-9a-f]{64}\b/i },
  { name: "email address", pattern: /[^\s@]+@[^\s@]+\.[^\s@]+/ },
];

/** Activity visibilities a search index may carry. `restricted` is excluded by name: it exists
 *  precisely because some history is not for everyone, and an index is read by everyone. */
export const INDEXABLE_ACTIVITY_VISIBILITIES = ["internal", "client_safe"] as const;

/** Returns the problems in a document's text, as sentences. Empty means it is safe to index. */
export function sensitiveFindings(document: CommandCenterSearchDocument): string[] {
  const problems: string[] = [];
  const fields: readonly [string, string][] = [
    ["title", document.title],
    ["subtitle", document.subtitle],
    ["body", document.body],
    ["status", document.status],
    ["ownerLabel", document.ownerLabel],
  ];
  for (const [field, value] of fields) {
    for (const { name, pattern } of SENSITIVE_INDEX_PATTERNS) {
      if (pattern.test(value)) {
        problems.push(`${document.key} carries what looks like a ${name} in ${field}.`);
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Index consistency
//
// The demo index is built from fixtures, and fixtures drift. These checks run in the test
// suite and return problems as sentences, so a broken index fails loudly rather than
// rendering a list of links that quietly go nowhere.
// ---------------------------------------------------------------------------

export type SearchIndexUniverse = {
  /** Every id that exists, by entity type. */
  ids: ReadonlyMap<SearchEntityType, ReadonlySet<string>>;
  /** Routes the application implements. A document's href must resolve inside it. */
  routes: ReadonlySet<string>;
};

/** Turn a concrete href back into the registry pattern it satisfies, or `null` if nothing in
 *  the registry can serve it. `/dashboard/my-work/task-004` → `/dashboard/my-work/[taskId]`. */
export function routePatternFor(href: string, routes: ReadonlySet<string>): string | null {
  if (href === "" || href.startsWith("#")) return null;
  const [path] = href.split("?");
  if (path === undefined) return null;
  if (routes.has(path)) return path;
  const segments = path.split("/");
  for (const candidate of routes) {
    const candidateSegments = candidate.split("/");
    if (candidateSegments.length !== segments.length) continue;
    const matches = candidateSegments.every(
      (segment, i) => segment === segments[i] || (segment.startsWith("[") && segment.endsWith("]")),
    );
    if (matches) return candidate;
  }
  return null;
}

export function assertIndexConsistency(
  documents: readonly CommandCenterSearchDocument[],
  universe: SearchIndexUniverse,
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const document of documents) {
    if (document.key !== `${document.type}:${document.id}`) {
      problems.push(`${document.key} does not match its own type and id.`);
    }
    if (seen.has(document.key)) {
      problems.push(`${document.key} is indexed more than once.`);
    }
    seen.add(document.key);

    const known = universe.ids.get(document.type);
    if (!known?.has(document.id)) {
      problems.push(`${document.key} does not resolve to a record that exists.`);
    }

    if (document.href === "" || document.href === "#") {
      problems.push(`${document.key} has no route — a result must open something.`);
    } else if (routePatternFor(document.href, universe.routes) === null) {
      problems.push(`${document.key} points at ${document.href}, which is not an implemented route.`);
    }

    if (document.title.trim() === "") {
      problems.push(`${document.key} has no title.`);
    }

    problems.push(...sensitiveFindings(document));
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Query normalization
// ---------------------------------------------------------------------------

/** Below this, a textual search is not run: two characters over nine collections is a scan
 *  that returns most of the workspace, which is noise rather than an answer. Recent items and
 *  commands still show, so the dialog is never empty-handed. */
export const MIN_QUERY_LENGTH = 2;

/** Total results returned, and the most any one group may contribute. Both are caps on what a
 *  person reads, not on what the index holds. */
export const SEARCH_RESULT_LIMIT = 30;
export const SEARCH_GROUP_LIMIT = 6;

/** Lower-case, trim, collapse runs of whitespace. Punctuation becomes a separator rather than
 *  a character to match, so "harbor-logistics", "Harbor Logistics" and "harbor, logistics"
 *  are the same query. */
export function normalizeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenize(raw: string): string[] {
  const normalized = normalizeQuery(raw);
  return normalized === "" ? [] : normalized.split(" ");
}

/** The same normalization applied to indexed text, so both sides of a comparison have been
 *  through the identical transform. */
function normalizeField(value: string): string {
  return normalizeQuery(value);
}

// ---------------------------------------------------------------------------
// Ranking
//
// Fixed integers rather than a tuned float. A title match must beat a body match by a margin
// no amount of body text can close, which is easier to reason about — and to test — as
// separated bands than as weights that happen to come out in the right order.
// ---------------------------------------------------------------------------

const SCORE_TITLE_EXACT = 1000;
const SCORE_TITLE_PREFIX = 800;
const SCORE_TITLE_WORD_PREFIX = 600;
const SCORE_TITLE_SUBSTRING = 400;
const SCORE_IDENTITY_EXACT = 350;
const SCORE_IDENTITY_PREFIX = 300;
const SCORE_IDENTITY_SUBSTRING = 200;
const SCORE_BODY = 100;

function wordPrefixHit(haystack: string, token: string): boolean {
  return haystack.split(" ").some((word) => word.startsWith(token));
}

/** How well one token matches one document. `0` means no match at all, which — because
 *  matching is AND across tokens — removes the document from the result set entirely. */
export function scoreToken(document: CommandCenterSearchDocument, token: string): number {
  const title = normalizeField(document.title);
  if (title === token) return SCORE_TITLE_EXACT;
  if (title.startsWith(token)) return SCORE_TITLE_PREFIX;
  if (wordPrefixHit(title, token)) return SCORE_TITLE_WORD_PREFIX;
  if (title.includes(token)) return SCORE_TITLE_SUBSTRING;

  // Identity fields: the id a person quotes from a ticket, the status they are hunting for,
  // the owner whose queue they are checking, the company on the record.
  const identity = [document.id, document.status, document.ownerLabel, document.subtitle];
  let best = 0;
  for (const raw of identity) {
    const value = normalizeField(raw);
    if (value === "") continue;
    if (value === token) best = Math.max(best, SCORE_IDENTITY_EXACT);
    else if (value.startsWith(token) || wordPrefixHit(value, token)) {
      best = Math.max(best, SCORE_IDENTITY_PREFIX);
    } else if (value.includes(token)) best = Math.max(best, SCORE_IDENTITY_SUBSTRING);
  }
  if (best > 0) return best;

  return normalizeField(document.body).includes(token) ? SCORE_BODY : 0;
}

/** Every token must land somewhere. Typing a second word narrows the list; it never widens
 *  it, which is what people expect from a search box and not what OR semantics would give. */
export function scoreDocument(document: CommandCenterSearchDocument, tokens: readonly string[]): number {
  let total = 0;
  for (const token of tokens) {
    const score = scoreToken(document, token);
    if (score === 0) return 0;
    total += score;
  }
  return total;
}

// ---------------------------------------------------------------------------
// The query
// ---------------------------------------------------------------------------

export type SearchQuery = {
  text: string;
  scope: SearchScope;
  limit?: number;
};

export type SearchFilter = {
  /** Restrict to these types regardless of scope. Used by the live provider to apply a
   *  permission decision the client cannot make for itself. */
  types?: readonly SearchEntityType[];
};

function toResult(document: CommandCenterSearchDocument, score: number): CommandCenterSearchResult {
  return {
    ...document,
    score,
    group: SEARCH_GROUP_OF[document.type],
    typeLabel: SEARCH_TYPE_LABELS[document.type],
  };
}

/**
 * Rank an index against a query.
 *
 * Ordering, in full: score descending, then `sortKey` descending, then `key` ascending. The
 * third key is not decorative — two records authored on the same demo day tie on the first
 * two, and without a final total order the list would depend on array position, which is the
 * kind of thing that passes locally and reorders in CI.
 */
export function searchDocuments(
  documents: readonly CommandCenterSearchDocument[],
  query: SearchQuery,
  filter: SearchFilter = {},
): CommandCenterSearchResult[] {
  const tokens = tokenize(query.text);
  if (tokens.length === 0 || normalizeQuery(query.text).length < MIN_QUERY_LENGTH) return [];

  const limit = query.limit ?? SEARCH_RESULT_LIMIT;
  const allowedTypes = filter.types ? new Set(filter.types) : null;

  const scored: CommandCenterSearchResult[] = [];
  for (const document of documents) {
    if (!scopeAdmits(query.scope, document.type)) continue;
    if (allowedTypes && !allowedTypes.has(document.type)) continue;
    const score = scoreDocument(document, tokens);
    if (score === 0) continue;
    scored.push(toResult(document, score));
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.sortKey !== b.sortKey) return a.sortKey < b.sortKey ? 1 : -1;
    return a.key < b.key ? -1 : 1;
  });

  return scored.slice(0, limit);
}

/** Fixed heading order, empty headings dropped. A heading with nothing under it reads as a
 *  section that failed to load rather than a section with no matches. */
export function groupResults(results: readonly CommandCenterSearchResult[]): SearchResultGroup[] {
  const groups: SearchResultGroup[] = [];
  for (const group of SEARCH_GROUPS) {
    const inGroup = results.filter((result) => result.group === group).slice(0, SEARCH_GROUP_LIMIT);
    if (inGroup.length > 0) groups.push({ group, results: inGroup });
  }
  return groups;
}

/** The flat, keyboard-navigable order — grouped order read top to bottom. The dialog moves the
 *  active option through this list so Down from the last row of one group lands on the first
 *  row of the next, rather than escaping the listbox. */
export function flattenGroups(groups: readonly SearchResultGroup[]): CommandCenterSearchResult[] {
  return groups.flatMap((group) => group.results);
}

// ---------------------------------------------------------------------------
// Permissions
//
// A predicate, used by the dialog to hide what a role may not open and by the live provider
// to decide what it may return at all. Hiding in the client is a courtesy; the provider and
// RLS are the boundary. See lib/search/provider.ts.
// ---------------------------------------------------------------------------

export type SearchPermissionContext = {
  /** Null in demo mode — there is no workspace, and nothing is workspace-scoped. In live mode
   *  this is the authenticated membership's workspace, resolved server-side. */
  workspaceId: string | null;
  userId: string;
  role: WorkspaceRole;
  /** True when the workspace runs against the live data plane. */
  live: boolean;
};

/** Entity types a role may see at all. Every current role may READ every record kind in the
 *  workspace — the differences between roles in this application are about what you may
 *  change, not what you may find. Stated as a function anyway, so the release that introduces
 *  a restricted record kind has one place to change rather than nine call sites. */
export function visibleEntityTypes(context: SearchPermissionContext): SearchEntityType[] {
  void context;
  return [...SEARCH_ENTITY_TYPES];
}

export function canSeeEntity(context: SearchPermissionContext, type: SearchEntityType): boolean {
  return visibleEntityTypes(context).includes(type);
}

/** Whether a context may perform workspace administration — managing members, editing
 *  workspace settings, and owning shared Saved Views. */
export function canManageWorkspace(context: SearchPermissionContext): boolean {
  return hasMinRole(context.role, "admin");
}

/** Whether a context may create records. `member` is the working role, so it can. */
export function canMutateRecords(context: SearchPermissionContext): boolean {
  return hasMinRole(context.role, "member");
}
