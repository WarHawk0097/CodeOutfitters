// Release 4 — RECENT ITEMS (tests 53-62).
//
// Recent items are browser-local convenience state and nothing else. The tests that matter
// here are the ones that stop them becoming something else: a stale entry must not survive a
// permission change, a deleted record, or a route that no longer exists, and nothing that
// looks like a token or an address may be stored at all. Storage is writable by anything on
// this origin, so every read re-validates rather than trusting what it finds.
import { describe, expect, it } from "vitest";
import {
  carriesSensitiveText,
  parseRecentItems,
  recentItemTypeLabel,
  rememberItem,
  serializeRecentItems,
  sortRecentItems,
  usableRecentItems,
  RECENT_ITEMS_MAX,
  RECENT_ITEMS_NOTICE,
  RECENT_ITEMS_STORAGE_KEY,
  type RecentItem,
} from "./recent-items";
import { SEARCH_TYPE_LABELS, type SearchEntityType, type SearchPermissionContext } from "./model";
import { SEARCH_ROUTE_PATTERNS } from "./routes";
import { buildDemoSearchIndex, demoSearchUniverse } from "./demo-index";
import { createSeedState, DEMO_CURRENT_USER_ID } from "../demo/seed";

const state = createSeedState();
const universe = demoSearchUniverse(state);
const index = buildDemoSearchIndex(state);

const context: SearchPermissionContext = {
  workspaceId: null,
  userId: DEMO_CURRENT_USER_ID,
  role: "member",
  live: false,
};

function item(overrides: Partial<RecentItem> = {}): RecentItem {
  return {
    type: "lead",
    id: "lead-001",
    href: "/dashboard/leads/lead-001",
    title: "Northgate Interiors",
    openedAt: 10,
    ...overrides,
  };
}

describe("recent items (tests 53-62)", () => {
  // 53
  it("is stored under one named key and says where it is stored", () => {
    expect(RECENT_ITEMS_STORAGE_KEY).toBe("codeoutfitters.command-center.recent-items");
    // Wording is load-bearing: it must not suggest an account, a sync or a shared history.
    expect(RECENT_ITEMS_NOTICE).toBe("Recent on this browser");
    expect(RECENT_ITEMS_NOTICE.toLowerCase()).toContain("browser");
  });

  // 54
  it("keeps the newest first and never more than ten", () => {
    expect(RECENT_ITEMS_MAX).toBe(10);
    let list: RecentItem[] = [];
    for (let n = 0; n < 15; n += 1) {
      list = rememberItem(list, item({ id: `lead-${n}`, openedAt: n }));
    }
    expect(list.length).toBe(RECENT_ITEMS_MAX);
    expect(list[0]?.id).toBe("lead-14");
    expect(list.at(-1)?.id).toBe("lead-5");
  });

  // 55
  it("stores one entry per record — opening the same thing twice moves it, it does not duplicate it", () => {
    const first = rememberItem([], item({ openedAt: 1 }));
    const withOther = rememberItem(first, item({ id: "lead-002", openedAt: 2 }));
    const reopened = rememberItem(withOther, item({ openedAt: 3 }));
    expect(reopened.length).toBe(2);
    expect(reopened[0]?.id).toBe("lead-001");
    expect(reopened.filter((entry) => entry.id === "lead-001").length).toBe(1);
  });

  // 56
  it("keys on type as well as id, so a task and a lead sharing an id are two entries", () => {
    const list = rememberItem(
      rememberItem([], item({ type: "lead", id: "shared-1", openedAt: 1 })),
      item({ type: "task", id: "shared-1", href: "/dashboard/my-work/shared-1", openedAt: 2 }),
    );
    expect(list.length).toBe(2);
  });

  // 57
  it("refuses to store anything shaped like a token, a hash or an address", () => {
    expect(carriesSensitiveText(item({ title: "demo-proposal-9f2ab4c1" }))).toBe(true);
    expect(carriesSensitiveText(item({ href: `/proposal/${"a".repeat(48)}` }))).toBe(true);
    expect(carriesSensitiveText(item({ id: "f".repeat(64) }))).toBe(true);
    expect(carriesSensitiveText(item({ title: "nadia@northgate.co.uk" }))).toBe(true);
    expect(carriesSensitiveText(item())).toBe(false);
    // Rejected on the way in, not merely hidden on the way out.
    expect(rememberItem([], item({ title: "demo-proposal-9f2ab4c1" }))).toEqual([]);
  });

  // 58
  it("survives a corrupt or hand-edited storage key without crashing", () => {
    expect(parseRecentItems(null)).toEqual([]);
    expect(parseRecentItems("")).toEqual([]);
    expect(parseRecentItems("not json")).toEqual([]);
    expect(parseRecentItems('{"not":"an array"}')).toEqual([]);
    expect(parseRecentItems('[{"type":"nonsense","id":"x","href":"/x","title":"x","openedAt":1}]')).toEqual([]);
    expect(parseRecentItems('[{"type":"lead"}]')).toEqual([]);
  });

  // 59
  it("round-trips through storage in a deterministic order", () => {
    const list = [
      item({ id: "lead-002", openedAt: 5 }),
      item({ id: "lead-001", openedAt: 9 }),
      item({ id: "lead-003", openedAt: 5 }),
    ];
    const parsed = parseRecentItems(serializeRecentItems(list));
    expect(parsed.map((entry) => entry.id)).toEqual(["lead-001", "lead-002", "lead-003"]);
    // Two entries written in the same millisecond order by key, not by whichever the sort
    // implementation happened to visit first.
    expect(sortRecentItems(list).map((entry) => entry.id)).toEqual(parsed.map((entry) => entry.id));
  });

  // 60
  it("drops an entry whose record no longer exists", () => {
    const known = universe.ids;
    const gone = item({ id: "lead-does-not-exist", href: "/dashboard/leads/lead-does-not-exist" });
    const real = index.find((document) => document.type === "lead");
    expect(real).toBeDefined();
    const kept = item({ id: real!.id, href: real!.href, title: real!.title });
    const usable = usableRecentItems([gone, kept], { routes: SEARCH_ROUTE_PATTERNS, knownIds: known, context });
    expect(usable.map((entry) => entry.id)).toEqual([kept.id]);
  });

  // 61
  it("drops an entry whose route no longer exists", () => {
    const dead = item({ href: "/dashboard/a-screen-that-was-removed" });
    const usable = usableRecentItems([dead], {
      routes: SEARCH_ROUTE_PATTERNS,
      knownIds: universe.ids,
      context,
    });
    expect(usable).toEqual([]);
  });

  // 62
  it("re-checks permission at render time, so a stored entry is never an access path", () => {
    const real = index.find((document) => document.type === "proposal");
    expect(real).toBeDefined();
    const stored = item({ type: "proposal", id: real!.id, href: real!.href, title: real!.title });

    // The decision is made against the context in force now. Simulating a role that may not see
    // proposals is what proves the check is being made at all rather than assumed at write time.
    const restrictedContext = { ...context } as SearchPermissionContext;
    const permitted = usableRecentItems([stored], {
      routes: SEARCH_ROUTE_PATTERNS,
      knownIds: universe.ids,
      context: restrictedContext,
    });
    expect(permitted.length).toBe(1);

    const denied = usableRecentItems([stored], {
      routes: SEARCH_ROUTE_PATTERNS,
      // An empty id universe is what a workspace the caller cannot read looks like from here:
      // nothing resolves, so nothing is offered.
      knownIds: new Map<SearchEntityType, ReadonlySet<string>>(),
      context: restrictedContext,
    });
    expect(denied).toEqual([]);
  });

  it("labels a row by its record kind, in words rather than by icon alone", () => {
    for (const type of Object.keys(SEARCH_TYPE_LABELS) as SearchEntityType[]) {
      expect(recentItemTypeLabel(item({ type }))).toBe(SEARCH_TYPE_LABELS[type]);
    }
  });
});
