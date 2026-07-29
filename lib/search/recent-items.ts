// Recently opened records, kept in this browser.
//
// What this is: a convenience list, so the record you were looking at five minutes ago is one
// keystroke away instead of one search away.
//
// What this is NOT, and the copy in the dialog says so in as many words: an account feature.
// It is not synced, it is not shared, it does not follow you to another machine, and — the
// part that matters for security rather than for expectations — it does not authorize
// anything. A stored entry is a title and a route. Opening it issues the same request any
// other navigation issues, and the server makes the same decision it would have made if the
// entry had been typed by hand. An attacker who edits this key in devtools gets a different
// list in their own dialog and no additional access. See `usableRecentItems`, which re-checks
// every entry against the current permission context on read rather than trusting what was
// written.
//
// Deliberately absent from the stored shape: secure proposal tokens, proposal access links,
// client response bodies, recipient email addresses, and any activity metadata. A record's
// identity and its route are enough to re-open it; everything else would be a copy of
// workspace data sitting in localStorage, which is the one place it should never be.
import {
  routePatternFor,
  SEARCH_ENTITY_TYPES,
  SEARCH_TYPE_LABELS,
  SENSITIVE_INDEX_PATTERNS,
  canSeeEntity,
  type SearchEntityType,
  type SearchPermissionContext,
} from "./model";

export const RECENT_ITEMS_STORAGE_KEY = "codeoutfitters.command-center.recent-items";

/** Ten is what fits under a dialog heading without scrolling and without turning a shortcut
 *  list into a second search problem. */
export const RECENT_ITEMS_MAX = 10;

/** Shown above the list, every time it renders. The wording is load-bearing: it must not
 *  suggest an account, a sync, or a shared history. */
export const RECENT_ITEMS_NOTICE = "Recent on this browser";

export type RecentItem = {
  type: SearchEntityType;
  id: string;
  /** The route it opens. Re-validated against the route registry on read. */
  href: string;
  /** Epoch milliseconds. Supplied by the caller, never read from the clock in here, so the
   *  ordering rules below are testable without freezing time. */
  openedAt: number;
  /** What to show in the row. A title only — never a body, a message or an address. */
  title: string;
};

const ENTITY_TYPES = new Set<string>(SEARCH_ENTITY_TYPES);

/** A stored entry is untrusted input: it came from localStorage, which anything on this origin
 *  can write. Everything about it is re-checked. */
function isWellFormed(value: unknown): value is RecentItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.type !== "string" || !ENTITY_TYPES.has(item.type)) return false;
  if (typeof item.id !== "string" || item.id.trim() === "") return false;
  if (typeof item.href !== "string" || item.href.trim() === "") return false;
  if (typeof item.title !== "string" || item.title.trim() === "") return false;
  if (typeof item.openedAt !== "number" || !Number.isFinite(item.openedAt)) return false;
  return true;
}

/** Refuses to store anything shaped like a token, a hash or an email address. This is belt and
 *  braces — no call site passes one — but the cost of the check is nothing and the cost of a
 *  client's private link ending up in localStorage is a security incident. */
export function carriesSensitiveText(item: RecentItem): boolean {
  return SENSITIVE_INDEX_PATTERNS.some(
    ({ pattern }) => pattern.test(item.title) || pattern.test(item.href) || pattern.test(item.id),
  );
}

/**
 * Add one entry to a list, returning the new list.
 *
 * Pure: the caller owns storage and the clock. Newest first, one entry per (type, id) — a
 * record opened twice moves to the front rather than appearing twice — and never longer than
 * {@link RECENT_ITEMS_MAX}.
 */
export function rememberItem(current: readonly RecentItem[], item: RecentItem): RecentItem[] {
  if (!isWellFormed(item) || carriesSensitiveText(item)) return [...current];
  const withoutDuplicate = current.filter(
    (existing) => !(existing.type === item.type && existing.id === item.id),
  );
  return [item, ...withoutDuplicate].slice(0, RECENT_ITEMS_MAX);
}

/** Parse whatever is in storage into a list that is safe to render, discarding anything that
 *  is not. A corrupt or hand-edited key yields an empty list, never a crash. */
export function parseRecentItems(raw: string | null): RecentItem[] {
  if (raw === null || raw === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const kept: RecentItem[] = [];
  const seen = new Set<string>();
  for (const candidate of parsed) {
    if (!isWellFormed(candidate) || carriesSensitiveText(candidate)) continue;
    const key = `${candidate.type}:${candidate.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push({
      type: candidate.type,
      id: candidate.id,
      href: candidate.href,
      title: candidate.title,
      openedAt: candidate.openedAt,
    });
  }
  return sortRecentItems(kept).slice(0, RECENT_ITEMS_MAX);
}

/** Newest first, then by key so two entries written in the same millisecond have a stable
 *  order rather than depending on the sort implementation. */
export function sortRecentItems(items: readonly RecentItem[]): RecentItem[] {
  return [...items].sort((a, b) => {
    if (a.openedAt !== b.openedAt) return b.openedAt - a.openedAt;
    const left = `${a.type}:${a.id}`;
    const right = `${b.type}:${b.id}`;
    return left < right ? -1 : 1;
  });
}

export function serializeRecentItems(items: readonly RecentItem[]): string {
  return JSON.stringify(sortRecentItems(items).slice(0, RECENT_ITEMS_MAX));
}

/**
 * The list that may actually be rendered, right now, for this person.
 *
 * Three things are re-checked on every read, because all three can have changed since the
 * entry was written:
 *
 *   * the route still exists — a record kind whose screen was removed leaves dead entries;
 *   * the record still exists — `knownIds` is the current index, so a deleted record drops out
 *     rather than offering a link to nothing;
 *   * the current role may still see this kind of record.
 *
 * The third is the important one. It is why a stale entry cannot become an access path: the
 * decision is made against the context in force at render time, not the one in force when the
 * entry was stored.
 */
export function usableRecentItems(
  items: readonly RecentItem[],
  options: {
    routes: ReadonlySet<string>;
    knownIds: ReadonlyMap<SearchEntityType, ReadonlySet<string>>;
    context: SearchPermissionContext;
  },
): RecentItem[] {
  return sortRecentItems(items).filter((item) => {
    if (!canSeeEntity(options.context, item.type)) return false;
    if (routePatternFor(item.href, options.routes) === null) return false;
    const known = options.knownIds.get(item.type);
    return known?.has(item.id) === true;
  });
}

export function recentItemTypeLabel(item: RecentItem): string {
  return SEARCH_TYPE_LABELS[item.type];
}
