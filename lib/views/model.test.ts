// Release 4 — SAVED VIEW DOMAIN (tests 63-80).
//
// A Saved View is a stored filter that later gets applied to a list and turned into a link.
// That makes it three things at once: a preference, an input to a query, and a URL. The tests
// below treat it as all three — the vocabulary tests check it describes lists this application
// actually has, the sanitizer tests check that a hand-edited stored view cannot introduce a
// filter or a destination the product does not offer, and the serialization tests check the
// round trip is stable enough for "unsaved changes" to be a string comparison.
import { describe, expect, it } from "vitest";
import {
  canCreateSharedView,
  canEditSavedView,
  defaultFilters,
  duplicateName,
  isBuiltIn,
  isDefaultState,
  isDirty,
  isForbiddenKey,
  isSavedViewScope,
  nameCollision,
  parseFilters,
  parseSort,
  sanitizeFilters,
  sanitizeSort,
  savedViewHref,
  savedViewId,
  SAVED_VIEW_NAME_MAX,
  SAVED_VIEW_SCOPES,
  SAVED_VIEW_SCOPE_LABELS,
  SAVED_VIEW_SCOPE_PATHS,
  SCOPE_DESCRIPTORS,
  sensitiveValueProblem,
  serializeFilters,
  slugify,
  validateSavedViewDraft,
  type SavedView,
  type SavedViewScope,
} from "./model";
import { DEFAULT_SAVED_VIEWS, defaultViewsForScope, UNBUILDABLE_DEFAULT_VIEWS } from "./defaults";

function personal(scope: SavedViewScope, name: string, filters: Record<string, string> = {}): SavedView {
  return {
    id: savedViewId(scope, name),
    scope,
    name,
    filters: { ...defaultFilters(scope), ...filters },
    sort: null,
    columns: [],
    ownership: { kind: "personal", userId: "user-002" },
  };
}

describe("saved view domain (tests 63-80)", () => {
  // 63
  it("has a scope for each list surface that supports views, and no others", () => {
    expect([...SAVED_VIEW_SCOPES]).toEqual([
      "myWork",
      "leads",
      "pipeline",
      "meetings",
      "proposals",
      "followUps",
      "emailActivity",
    ]);
    // Appointments is absent on purpose: its state is a day, not a filter set.
    expect(SAVED_VIEW_SCOPES).not.toContain("appointments");
    expect(isSavedViewScope("leads")).toBe(true);
    expect(isSavedViewScope("nonsense")).toBe(false);
  });

  // 64
  it("gives every scope a label and a real route", () => {
    for (const scope of SAVED_VIEW_SCOPES) {
      expect(SAVED_VIEW_SCOPE_LABELS[scope].trim()).not.toBe("");
      expect(SAVED_VIEW_SCOPE_PATHS[scope].startsWith("/dashboard")).toBe(true);
    }
    expect(new Set(Object.values(SAVED_VIEW_SCOPE_PATHS)).size).toBe(SAVED_VIEW_SCOPES.length);
  });

  // 65
  it("declares, per scope, only the filters that scope's screen offers", () => {
    // The vocabulary is the contract between a stored view and a list. Spot-checked against
    // the controls each screen renders.
    expect(Object.keys(SCOPE_DESCRIPTORS.myWork.fields).sort()).toEqual(["owner", "priority", "q", "view"]);
    expect(Object.keys(SCOPE_DESCRIPTORS.leads.fields).sort()).toEqual(["owner", "q", "service", "status", "view"]);
    expect(Object.keys(SCOPE_DESCRIPTORS.proposals.fields).sort()).toEqual(["owner", "q", "state", "value", "view"]);
    expect(Object.keys(SCOPE_DESCRIPTORS.emailActivity.fields).sort()).toEqual(["direction", "q", "read", "state"]);
    for (const scope of SAVED_VIEW_SCOPES) {
      const descriptor = SCOPE_DESCRIPTORS[scope];
      for (const key of Object.keys(descriptor.defaults)) {
        expect(descriptor.fields[key]).toBeDefined();
      }
    }
  });

  // 66
  it("rejects a name that is missing or too long", () => {
    expect(validateSavedViewDraft({ scope: "leads", name: "  ", filters: {} })).toContain("A view needs a name.");
    const long = "x".repeat(SAVED_VIEW_NAME_MAX + 1);
    expect(validateSavedViewDraft({ scope: "leads", name: long, filters: {} })).toContain(
      `A view name can be at most ${SAVED_VIEW_NAME_MAX} characters.`,
    );
    expect(validateSavedViewDraft({ scope: "leads", name: "Open work", filters: {} })).toEqual([]);
  });

  // 67
  it("rejects a filter the scope does not have, and a scope that is not a list", () => {
    expect(validateSavedViewDraft({ scope: "leads", name: "x", filters: { priority: "High" } })).toContain(
      'Leads has no "priority" filter.',
    );
    expect(
      validateSavedViewDraft({ scope: "notAScope" as SavedViewScope, name: "x", filters: {} }).length,
    ).toBe(1);
  });

  // 68
  it("refuses prototype-shaped filter names outright", () => {
    for (const key of ["__proto__", "constructor", "prototype"]) {
      expect(isForbiddenKey(key)).toBe(true);
      expect(validateSavedViewDraft({ scope: "leads", name: "x", filters: { [key]: "y" } })).toContain(
        `"${key}" is not a filter name that may be stored.`,
      );
      // And they never survive sanitization either — validation is the message, this is the wall.
      expect(Object.keys(sanitizeFilters("leads", { [key]: "y" }))).not.toContain(key);
    }
  });

  // 69
  it("refuses a filter value that is a URL, a token, a hash or an address", () => {
    expect(sensitiveValueProblem("q", "https://example.com/steal")).toBe("The q filter cannot hold a URL.");
    expect(sensitiveValueProblem("q", "//example.com")).toBe("The q filter cannot hold a URL.");
    expect(sensitiveValueProblem("q", "demo-proposal-9f2ab4c1")).toContain("demo access token");
    expect(sensitiveValueProblem("q", "f".repeat(64))).toContain("raw access token");
    expect(sensitiveValueProblem("q", "nadia@northgate.co.uk")).toContain("email address");
    expect(sensitiveValueProblem("q", "kitchen fitting")).toBeNull();
  });

  // 70
  it("discards an unknown or invalid stored filter instead of throwing", () => {
    // A stored view is untrusted input. Every one of these is a plausible hand-edit.
    expect(sanitizeFilters("leads", null)).toEqual(defaultFilters("leads"));
    expect(sanitizeFilters("leads", "not an object")).toEqual(defaultFilters("leads"));
    expect(sanitizeFilters("leads", { unknownField: "x" })).toEqual(defaultFilters("leads"));
    expect(sanitizeFilters("leads", { status: 42 })).toEqual(defaultFilters("leads"));
    // A value outside the declared vocabulary is dropped, not stored and later acted on.
    expect(sanitizeFilters("leads", { status: "Invented" }).status).toBe("");
    expect(sanitizeFilters("leads", { status: "Contacted" }).status).toBe("Contacted");
    expect(sanitizeFilters("meetings", { date: "not-a-date" }).date).toBe("");
    expect(sanitizeFilters("meetings", { date: "2026-04-22" }).date).toBe("2026-04-22");
    expect(sanitizeFilters("leads", { q: "x".repeat(500) }).q).toBe("");
  });

  // 71
  it("accepts only a sort field the scope can sort by", () => {
    expect(sanitizeSort("leads", { field: "name", direction: "asc" })).toEqual({ field: "name", direction: "asc" });
    expect(sanitizeSort("leads", { field: "name", direction: "sideways" })).toBeNull();
    expect(sanitizeSort("leads", { field: "secretColumn", direction: "asc" })).toBeNull();
    expect(sanitizeSort("leads", null)).toBeNull();
  });

  // 72
  it("derives an id from the scope and the name, so the same view is the same view", () => {
    expect(savedViewId("leads", "New and uncontacted")).toBe("sv-leads-new-and-uncontacted");
    expect(savedViewId("leads", "New and uncontacted")).toBe(savedViewId("leads", "new and UNCONTACTED"));
    expect(savedViewId("leads", "   ")).toBe("sv-leads-untitled");
    expect(slugify("Waiting on client!")).toBe("waiting-on-client");
  });

  // 73
  it("names a collision rather than silently overwriting a view", () => {
    const views = [personal("leads", "Open work")];
    expect(nameCollision(views, "leads", "Open work")).toBe(true);
    expect(nameCollision(views, "leads", "Open work", views[0]?.id)).toBe(false);
    expect(nameCollision(views, "proposals", "Open work")).toBe(false);
  });

  // 74
  it("produces deterministic duplicate names", () => {
    const first = duplicateName([personal("leads", "Overdue")], "leads", "Overdue");
    expect(first).toBe("Overdue (copy)");
    const second = duplicateName(
      [personal("leads", "Overdue"), personal("leads", "Overdue (copy)")],
      "leads",
      "Overdue",
    );
    expect(second).toBe("Overdue (copy 2)");
  });

  // 75
  it("serializes filters in a stable order and omits defaults", () => {
    const filters = { ...defaultFilters("leads"), status: "Contacted", q: "northgate" };
    expect(serializeFilters("leads", filters)).toBe("q=northgate&status=Contacted");
    // Same state, different key insertion order — same string, or "unsaved changes" would
    // flicker on for no reason a person can see.
    const reordered = { owner: "", status: "Contacted", service: "", q: "northgate" };
    expect(serializeFilters("leads", reordered)).toBe(serializeFilters("leads", filters));
    expect(serializeFilters("leads", defaultFilters("leads"))).toBe("");
    expect(serializeFilters("myWork", defaultFilters("myWork"))).toBe("");
  });

  // 76
  it("round-trips through a query string, ignoring parameters it does not own", () => {
    const filters = { ...defaultFilters("leads"), status: "Contacted", q: "northgate & sons" };
    const params = new URLSearchParams(serializeFilters("leads", filters));
    expect(parseFilters("leads", params)).toEqual(filters);

    // A URL carries other things: a create flag, a mock scenario, a visual-state switch. A list
    // that refused to load because it met one of them would be brittle.
    const noisy = new URLSearchParams("status=Contacted&mock-scenario=filter-error&new=1");
    expect(parseFilters("leads", noisy).status).toBe("Contacted");

    const sorted = new URLSearchParams("sort=name:desc");
    expect(parseSort("leads", sorted)).toEqual({ field: "name", direction: "desc" });
    expect(parseSort("leads", new URLSearchParams("sort=nonsense:desc"))).toBeNull();
  });

  // 77
  it("builds a same-origin route that no stored value can steer", () => {
    const view = personal("leads", "Contacted", { status: "Contacted" });
    expect(savedViewHref(view)).toBe("/dashboard/leads?status=Contacted");
    // Even a stored filter that got through carrying a URL cannot move the destination: the
    // base is a constant and the value is encoded into the query.
    const hostile = { ...view, filters: { ...view.filters, q: "https://evil.example" } };
    const href = savedViewHref(hostile);
    expect(href.startsWith("/dashboard/leads")).toBe(true);
    expect(href).not.toContain("//evil.example");
  });

  // 78
  it("knows when the list differs from the view it has selected", () => {
    const view = personal("leads", "Contacted", { status: "Contacted" });
    expect(isDirty("leads", view, view.filters)).toBe(false);
    expect(isDirty("leads", view, { ...view.filters, q: "northgate" })).toBe(true);
    // With no view selected, any filter at all is unsaved state.
    expect(isDirty("leads", null, defaultFilters("leads"))).toBe(false);
    expect(isDirty("leads", null, { ...defaultFilters("leads"), q: "x" })).toBe(true);
    expect(isDefaultState("leads", defaultFilters("leads"))).toBe(true);
  });

  // 79
  it("lets a person edit their own view, and nobody else's", () => {
    const mine = personal("leads", "Mine");
    const theirs: SavedView = { ...mine, ownership: { kind: "personal", userId: "user-009" } };
    const shared: SavedView = { ...mine, ownership: { kind: "shared", workspaceId: "workspace-1" } };
    const builtIn = DEFAULT_SAVED_VIEWS[0]!;

    expect(canEditSavedView(mine, { userId: "user-002", role: "member" })).toBe(true);
    // A personal view is a bookmark, not a record: an admin does not get to edit it either.
    expect(canEditSavedView(theirs, { userId: "user-002", role: "admin" })).toBe(false);
    expect(canEditSavedView(shared, { userId: "user-002", role: "member" })).toBe(false);
    expect(canEditSavedView(shared, { userId: "user-002", role: "admin" })).toBe(true);
    expect(canEditSavedView(builtIn, { userId: "user-002", role: "owner" })).toBe(false);
    expect(isBuiltIn(builtIn)).toBe(true);

    expect(canCreateSharedView({ role: "member" })).toBe(false);
    expect(canCreateSharedView({ role: "admin" })).toBe(true);
  });

  // 80
  it("ships only default views whose filters the list can actually express", () => {
    for (const view of DEFAULT_SAVED_VIEWS) {
      expect(isBuiltIn(view)).toBe(true);
      const problems = validateSavedViewDraft({ scope: view.scope, name: view.name, filters: view.filters });
      expect(problems, `${view.id}: ${problems.join(" ")}`).toEqual([]);
      // A shipped view must survive its own sanitizer unchanged, or it would apply differently
      // than it reads.
      expect(sanitizeFilters(view.scope, view.filters)).toEqual(view.filters);
    }

    // And the ones that sound useful but cannot be built are recorded with the reason, rather
    // than shipped as views that quietly return the wrong rows.
    expect(UNBUILDABLE_DEFAULT_VIEWS.length).toBeGreaterThan(0);
    for (const entry of UNBUILDABLE_DEFAULT_VIEWS) {
      expect(SAVED_VIEW_SCOPES).toContain(entry.scope);
      expect(entry.reason.trim().length).toBeGreaterThan(40);
      // It is not both unbuildable and shipped.
      expect(defaultViewsForScope(entry.scope).some((view) => view.name === entry.name)).toBe(false);
    }
  });
});
