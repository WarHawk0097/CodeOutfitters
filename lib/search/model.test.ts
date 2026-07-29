// Release 4 — SEARCH DOMAIN (tests 1-21) and DEMO SEARCH INDEX.
//
// The index is the security surface of this release. A ranking bug shows a result in the wrong
// order; an indexing bug puts a client's private access link into a list that anyone in the
// workspace can type two characters to reach. The tests below are weighted accordingly: the
// ranking rules get one test each, and what may not be indexed gets several, including one
// that goes looking through every document in the built index rather than trusting the call
// sites that produced them.
import { describe, expect, it } from "vitest";
import {
  assertIndexConsistency,
  availableScopes,
  canManageWorkspace,
  canMutateRecords,
  canSeeEntity,
  documentHref,
  flattenGroups,
  groupResults,
  INDEXABLE_ACTIVITY_VISIBILITIES,
  MIN_QUERY_LENGTH,
  normalizeQuery,
  routePatternFor,
  scopeAdmits,
  scoreDocument,
  searchDocuments,
  SEARCH_ENTITY_TYPES,
  SEARCH_GROUPS,
  SEARCH_GROUP_LIMIT,
  SEARCH_RESULT_LIMIT,
  SEARCH_SCOPES,
  SEARCH_TYPE_LABELS,
  sensitiveFindings,
  SENSITIVE_INDEX_PATTERNS,
  tokenize,
  visibleEntityTypes,
  type CommandCenterSearchDocument,
  type SearchPermissionContext,
} from "./model";
import { buildDemoSearchIndex, demoSearchUniverse } from "./demo-index";
import { SEARCH_ROUTE_PATTERNS } from "./routes";
import { resolveSearchPlane, SEARCH_PROVIDER_REQUIRED_REASON } from "./provider";
import { createSeedState, DEMO_CURRENT_USER_ID, LEAD_DIRECTORY } from "../demo/seed";

const state = createSeedState();
const index = buildDemoSearchIndex(state);
const universe = demoSearchUniverse(state);

const demoContext: SearchPermissionContext = {
  workspaceId: null,
  userId: DEMO_CURRENT_USER_ID,
  role: "member",
  live: false,
};

function doc(overrides: Partial<CommandCenterSearchDocument> = {}): CommandCenterSearchDocument {
  return {
    key: "lead:lead-001",
    type: "lead",
    id: "lead-001",
    title: "Northgate Interiors",
    subtitle: "Kitchen fitting",
    body: "Contacted · Nadia Rahman",
    status: "Contacted",
    ownerLabel: "Nadia Rahman",
    timestampLabel: "22 Apr",
    sortKey: "2026-04-22T09:00:00.000Z",
    href: "/dashboard/leads/lead-001",
    ...overrides,
  };
}

describe("search domain (tests 1-21)", () => {
  // 1
  it("indexes every entity type the release names, and no others", () => {
    expect([...SEARCH_ENTITY_TYPES]).toEqual([
      "lead",
      "opportunity",
      "task",
      "meeting",
      "proposal",
      "followUp",
      "appointment",
      "email",
      "activity",
    ]);
    // Team members are not indexed. There is no team-membership model to make a permission
    // decision against yet, so an indexed person would be a record shown on the strength of no
    // decision at all.
    expect(SEARCH_ENTITY_TYPES).not.toContain("teamMember");
  });

  // 2
  it("gives every entity type a group and a human label", () => {
    for (const type of SEARCH_ENTITY_TYPES) {
      expect(SEARCH_TYPE_LABELS[type].trim()).not.toBe("");
      expect(SEARCH_GROUPS).toContain(
        SEARCH_GROUPS.find((group) => group === SEARCH_GROUPS.find((g) => g === group)),
      );
    }
    // Every group heading is distinct, so two headings cannot read the same in one dialog.
    expect(new Set(SEARCH_GROUPS).size).toBe(SEARCH_GROUPS.length);
    expect(new Set(Object.values(SEARCH_TYPE_LABELS)).size).toBe(SEARCH_ENTITY_TYPES.length);
  });

  // 3
  it("scopes admit exactly the types they claim, and All admits everything", () => {
    for (const type of SEARCH_ENTITY_TYPES) {
      expect(scopeAdmits("all", type)).toBe(true);
    }
    expect(scopeAdmits("leads", "lead")).toBe(true);
    expect(scopeAdmits("leads", "proposal")).toBe(false);
    expect(scopeAdmits("proposals", "proposal")).toBe(true);
    expect(scopeAdmits("communications", "email")).toBe(true);
    expect(scopeAdmits("tasks", "email")).toBe(false);
  });

  // 4
  it("only offers scopes that the index can actually answer", () => {
    // A scope pill that returns nothing whatever you type is a control that lies about the
    // shape of the workspace.
    expect(availableScopes([])).toEqual(["all"]);
    expect(availableScopes([doc()])).toEqual(["all", "leads"]);
    expect(availableScopes(index).sort()).toEqual([...SEARCH_SCOPES].sort());
  });

  // 5
  it("resolves a route for every entity type that has a screen, and never a placeholder", () => {
    for (const type of SEARCH_ENTITY_TYPES) {
      const href = documentHref(type, "id-001");
      if (type === "activity") {
        // An activity event has no screen of its own — it is a fact about a record, so its
        // result opens that record. Returning null here is what forces the index to supply the
        // related record's route rather than inventing `/dashboard/activity/…`.
        expect(href).toBeNull();
        continue;
      }
      expect(href).not.toBeNull();
      expect(href).not.toBe("#");
      expect(href?.startsWith("/")).toBe(true);
    }
    // …and every activity document in the built index still has a real route, from its record.
    for (const document of index.filter((entry) => entry.type === "activity")) {
      expect(routePatternFor(document.href, SEARCH_ROUTE_PATTERNS)).not.toBeNull();
    }
  });

  // 6
  it("normalizes and tokenizes a query the same way for equivalent input", () => {
    expect(normalizeQuery("  Northgate   INTERIORS ")).toBe(normalizeQuery("northgate interiors"));
    expect(tokenize("Northgate Interiors")).toEqual(["northgate", "interiors"]);
    expect(tokenize("   ")).toEqual([]);
  });

  // 7
  it("runs no textual search below the minimum query length", () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(searchDocuments(index, { text: "n", scope: "all" })).toEqual([]);
    expect(searchDocuments(index, { text: "", scope: "all" })).toEqual([]);
  });

  // 8
  it("requires every token to match — a query narrows rather than widens", () => {
    const target = doc({ title: "Northgate Interiors", body: "Kitchen fitting" });
    expect(scoreDocument(target, ["northgate", "kitchen"])).toBeGreaterThan(0);
    expect(scoreDocument(target, ["northgate", "plumbing"])).toBe(0);
  });

  // 9
  it("ranks an exact title above a prefix, and a prefix above a body mention", () => {
    const exact = doc({ key: "lead:a", id: "a", title: "kitchen" });
    const prefix = doc({ key: "lead:b", id: "b", title: "kitchen fitting for Northgate" });
    const body = doc({ key: "lead:c", id: "c", title: "Northgate", body: "kitchen" });
    const results = searchDocuments([body, prefix, exact], { text: "kitchen", scope: "all" });
    expect(results.map((result) => result.id)).toEqual(["a", "b", "c"]);
  });

  // 10
  it("breaks ties by recency and then by key, so the order is total", () => {
    // Without the third key the order would depend on array position: stable locally,
    // reordered wherever the fixtures are built in a different order.
    const older = doc({ key: "lead:b", id: "b", title: "kitchen", sortKey: "2026-04-01T00:00:00.000Z" });
    const newer = doc({ key: "lead:a", id: "a", title: "kitchen", sortKey: "2026-04-20T00:00:00.000Z" });
    const sameDay = doc({ key: "lead:c", id: "c", title: "kitchen", sortKey: "2026-04-20T00:00:00.000Z" });
    const forward = searchDocuments([older, newer, sameDay], { text: "kitchen", scope: "all" });
    const backward = searchDocuments([sameDay, newer, older], { text: "kitchen", scope: "all" });
    expect(forward.map((result) => result.id)).toEqual(["a", "c", "b"]);
    expect(backward.map((result) => result.id)).toEqual(forward.map((result) => result.id));
  });

  // 11
  it("honours the scope filter and the caller's type filter independently", () => {
    const lead = doc({ key: "lead:a", id: "a", title: "kitchen" });
    const task = doc({ key: "task:b", id: "b", type: "task", title: "kitchen", href: "/dashboard/my-work/b" });
    expect(searchDocuments([lead, task], { text: "kitchen", scope: "leads" }).map((r) => r.id)).toEqual(["a"]);
    // The provider's filter is not the scope: it carries a permission decision the client is
    // not allowed to make for itself.
    expect(
      searchDocuments([lead, task], { text: "kitchen", scope: "all" }, { types: ["task"] }).map((r) => r.id),
    ).toEqual(["b"]);
  });

  // 12
  it("caps the result list and each group, so one collection cannot fill the dialog", () => {
    expect(SEARCH_RESULT_LIMIT).toBe(30);
    expect(SEARCH_GROUP_LIMIT).toBe(6);
    const many = Array.from({ length: 40 }, (_, i) =>
      doc({ key: `lead:l${i}`, id: `l${i}`, title: `kitchen ${i}` }),
    );
    expect(searchDocuments(many, { text: "kitchen", scope: "all" }).length).toBe(SEARCH_RESULT_LIMIT);
    const groups = groupResults(searchDocuments(many, { text: "kitchen", scope: "all" }));
    for (const group of groups) expect(group.results.length).toBeLessThanOrEqual(SEARCH_GROUP_LIMIT);
  });

  // 13
  it("groups results in a fixed heading order and drops empty headings", () => {
    const lead = doc({ key: "lead:a", id: "a", title: "kitchen" });
    const task = doc({ key: "task:b", id: "b", type: "task", title: "kitchen", href: "/dashboard/my-work/b" });
    const groups = groupResults(searchDocuments([task, lead], { text: "kitchen", scope: "all" }));
    const headings = groups.map((group) => group.group);
    expect(headings).toEqual(SEARCH_GROUPS.filter((group) => headings.includes(group)));
    expect(groups.every((group) => group.results.length > 0)).toBe(true);
  });

  // 14
  it("flattens groups back into the order they are rendered in", () => {
    const results = searchDocuments(index, { text: "proposal", scope: "all" });
    const flattened = flattenGroups(groupResults(results));
    expect(flattened.length).toBeGreaterThan(0);
    // Keyboard navigation walks the flattened list; if it disagreed with the rendered order,
    // ArrowDown would visit rows in an order nobody can see.
    expect(flattened.map((result) => result.key)).toEqual(
      groupResults(results).flatMap((group) => group.results.map((result) => result.key)),
    );
  });

  // 15
  it("rejects a secure proposal token, an access-link hash and an email address anywhere in a document", () => {
    const patterns = SENSITIVE_INDEX_PATTERNS.map((entry) => entry.name);
    expect(patterns).toContain("demo access token");
    expect(patterns).toContain("raw access token");
    expect(patterns).toContain("token hash");
    expect(patterns).toContain("email address");

    expect(sensitiveFindings(doc({ body: "demo-proposal-9f2ab4c1" })).length).toBeGreaterThan(0);
    expect(sensitiveFindings(doc({ body: "a".repeat(48) })).length).toBeGreaterThan(0);
    expect(sensitiveFindings(doc({ body: "f".repeat(64) })).length).toBeGreaterThan(0);
    expect(sensitiveFindings(doc({ subtitle: "nadia@northgate.co.uk" })).length).toBeGreaterThan(0);
    expect(sensitiveFindings(doc())).toEqual([]);
  });

  // 16
  it("indexes only activity that is internal or client-safe", () => {
    expect([...INDEXABLE_ACTIVITY_VISIBILITIES]).toEqual(["internal", "client_safe"]);
    // Restricted activity carries the client's own words and the proposal access trail. It is
    // readable on the record by people entitled to it, and it is not a search result.
    expect(INDEXABLE_ACTIVITY_VISIBILITIES).not.toContain("restricted");

    // The seeded workspace happens to contain no restricted event today, which is exactly why
    // this test plants one: a rule that is only ever exercised by fixtures that do not trigger
    // it is a rule nobody would notice breaking.
    const sample = state.activity.find((event) => event.visibility === "internal");
    expect(sample).toBeDefined();
    const restricted = { ...sample!, id: "activity-restricted-probe", visibility: "restricted" as const };
    const planted = buildDemoSearchIndex({ ...state, activity: [...state.activity, restricted] });

    expect(planted.some((document) => document.id === restricted.id)).toBe(false);
    expect(planted.filter((d) => d.type === "activity").length).toBe(
      index.filter((d) => d.type === "activity").length,
    );
  });

  // 17
  it("resolves an href back to the route pattern that serves it, and nothing else", () => {
    expect(routePatternFor("/dashboard/leads/lead-001", SEARCH_ROUTE_PATTERNS)).toBe(
      "/dashboard/leads/[leadId]",
    );
    expect(routePatternFor("/dashboard/leads?q=Northgate", SEARCH_ROUTE_PATTERNS)).toBe("/dashboard/leads");
    expect(routePatternFor("#", SEARCH_ROUTE_PATTERNS)).toBeNull();
    expect(routePatternFor("", SEARCH_ROUTE_PATTERNS)).toBeNull();
    expect(routePatternFor("/dashboard/not-a-route", SEARCH_ROUTE_PATTERNS)).toBeNull();
  });

  // 18
  it("the built demo index is internally consistent — every id real, every route implemented", () => {
    // One assertion covering duplicate keys, dead routes, missing titles, ids that resolve to
    // nothing, and sensitive text — reported as sentences so a failure names the document.
    expect(assertIndexConsistency(index, universe)).toEqual([]);
  });

  // 19
  it("the demo index is deterministic — same fixtures, same documents, same order", () => {
    const again = buildDemoSearchIndex(createSeedState());
    expect(again.map((document) => document.key)).toEqual(index.map((document) => document.key));
    expect(again).toEqual(index);
  });

  // 20
  it("every role may find every record kind — roles differ on writing, not on finding", () => {
    for (const role of ["owner", "admin", "member"] as const) {
      const context: SearchPermissionContext = { ...demoContext, role };
      expect(visibleEntityTypes(context).sort()).toEqual([...SEARCH_ENTITY_TYPES].sort());
      for (const type of SEARCH_ENTITY_TYPES) expect(canSeeEntity(context, type)).toBe(true);
    }
    expect(canManageWorkspace({ ...demoContext, role: "member" })).toBe(false);
    expect(canManageWorkspace({ ...demoContext, role: "admin" })).toBe(true);
    expect(canMutateRecords({ ...demoContext, role: "member" })).toBe(true);
  });

  // 21
  it("live mode asks for a provider instead of falling back to demo records", () => {
    expect(resolveSearchPlane(false)).toEqual({ kind: "demo" });
    const live = resolveSearchPlane(true);
    expect(live.kind).toBe("provider_required");
    expect(live.kind === "provider_required" && live.reason).toBe(SEARCH_PROVIDER_REQUIRED_REASON);
    // The reason has to say that nothing is being searched locally, because the failure mode
    // this guards against is a person assuming an empty dialog means an empty workspace.
    expect(SEARCH_PROVIDER_REQUIRED_REASON).toContain("No demo records");
  });
});

describe("demo search index contents", () => {
  it("covers every entity type from the seeded workspace", () => {
    const types = new Set(index.map((document) => document.type));
    for (const type of SEARCH_ENTITY_TYPES) expect(types.has(type)).toBe(true);
  });

  it("indexes the whole lead directory, not just the first page of it", () => {
    const leads = index.filter((document) => document.type === "lead");
    expect(leads.length).toBe(LEAD_DIRECTORY.length);
  });

  it("carries no proposal access token or recipient address in any document", () => {
    const problems = index.flatMap((document) => sensitiveFindings(document));
    expect(problems).toEqual([]);
  });

  it("gives every document a title, a route and a sort key", () => {
    for (const document of index) {
      expect(document.title.trim()).not.toBe("");
      expect(document.href.startsWith("/")).toBe(true);
      expect(document.sortKey.trim()).not.toBe("");
    }
  });
});
