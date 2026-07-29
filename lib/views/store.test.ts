// Release 4 — SAVED VIEW UI, storage half (tests 81-89).
//
// These cover the rules the Saved View controls depend on being true: saving does not silently
// overwrite, deleting cannot leave a list opening a view that is gone, renaming carries the
// browser default with it, and a hand-edited storage key cannot shadow a shipped view or
// smuggle in a filter the route does not have.
import { describe, expect, it } from "vitest";
import {
  defaultViewFor,
  deleteView,
  EMPTY_SAVED_VIEWS_STATE,
  findView,
  nameTaken,
  parseSavedViews,
  renameView,
  saveView,
  serializeSavedViews,
  setBrowserDefault,
  viewsForScope,
  SAVED_VIEWS_LOCAL_NOTICE,
  SAVED_VIEWS_PER_SCOPE_MAX,
  SAVED_VIEWS_STORAGE_KEY,
  SAVED_VIEWS_STORAGE_VERSION,
  type SavedViewsState,
} from "./store";
import { defaultFilters, savedViewId, SAVED_VIEW_NAME_MAX, type SavedView } from "./model";
import { DEFAULT_SAVED_VIEWS, defaultViewsForScope } from "./defaults";
import { DEMO_CURRENT_USER_ID } from "../demo/seed";

function personal(name: string, filters: Record<string, string> = {}): SavedView {
  return {
    id: savedViewId("leads", name),
    scope: "leads",
    name,
    filters: { ...defaultFilters("leads"), ...filters },
    sort: null,
    columns: [],
    ownership: { kind: "personal", userId: DEMO_CURRENT_USER_ID },
  };
}

function stateWith(...views: SavedView[]): SavedViewsState {
  return { views, defaults: {} };
}

describe("saved view storage (tests 81-89)", () => {
  // 81
  it("is stored under one named key and says, in words, that it is local", () => {
    expect(SAVED_VIEWS_STORAGE_KEY).toBe("codeoutfitters.command-center.saved-views");
    expect(SAVED_VIEWS_LOCAL_NOTICE).toBe("Saved in this browser");
    // Nothing in the copy may imply an account, a sync or a colleague seeing it.
    const lowered = SAVED_VIEWS_LOCAL_NOTICE.toLowerCase();
    for (const word of ["account", "synced", "everyone", "team"]) expect(lowered).not.toContain(word);
  });

  // 82
  it("shows the shipped views first and this browser's own after them", () => {
    const mine = personal("Mine");
    const list = viewsForScope(stateWith(mine), "leads");
    expect(list.slice(0, defaultViewsForScope("leads").length)).toEqual(defaultViewsForScope("leads"));
    expect(list.at(-1)).toEqual(mine);
    // Views for another list never leak into this one.
    expect(viewsForScope(stateWith(mine), "proposals").some((view) => view.id === mine.id)).toBe(false);
  });

  // 83
  it("refuses to overwrite an existing view unless the caller says to replace it", () => {
    const mine = personal("Open work");
    const state = stateWith(mine);
    const again = saveView(state, personal("Open work", { status: "Contacted" }));
    expect(again.ok).toBe(false);
    expect(again.ok === false && again.problem).toBe('A view named "Open work" already exists.');

    const replaced = saveView(state, personal("Open work", { status: "Contacted" }), { replace: true });
    expect(replaced.ok).toBe(true);
    expect(replaced.ok === true && replaced.state.views.length).toBe(1);
    expect(replaced.ok === true && replaced.state.views[0]?.filters.status).toBe("Contacted");
  });

  // 84
  it("refuses to let a personal view take a shipped view's name or edit a shipped view", () => {
    const shipped = defaultViewsForScope("leads")[0]!;
    const impostor: SavedView = { ...shipped, ownership: { kind: "personal", userId: DEMO_CURRENT_USER_ID } };
    const taken = saveView(EMPTY_SAVED_VIEWS_STATE, impostor);
    expect(taken.ok).toBe(false);
    expect(taken.ok === false && taken.problem).toContain(shipped.name);

    const shippedEdit = saveView(EMPTY_SAVED_VIEWS_STATE, shipped);
    expect(shippedEdit.ok).toBe(false);
    expect(shippedEdit.ok === false && shippedEdit.problem).toBe(
      "The views the product ships with cannot be changed.",
    );
    expect(nameTaken(EMPTY_SAVED_VIEWS_STATE, "leads", shipped.name)).toBe(true);
  });

  // 85
  it("caps how many views one list can hold in this browser, and says so", () => {
    let state = EMPTY_SAVED_VIEWS_STATE;
    for (let n = 0; n < SAVED_VIEWS_PER_SCOPE_MAX; n += 1) {
      const write = saveView(state, personal(`View ${n}`));
      expect(write.ok).toBe(true);
      if (write.ok) state = write.state;
    }
    const overflow = saveView(state, personal("One too many"));
    expect(overflow.ok).toBe(false);
    expect(overflow.ok === false && overflow.problem).toContain(String(SAVED_VIEWS_PER_SCOPE_MAX));
    // The cap is per list, so a full Leads menu does not block saving a Proposals view.
    const other: SavedView = { ...personal("Elsewhere"), scope: "proposals", id: savedViewId("proposals", "Elsewhere"), filters: defaultFilters("proposals") };
    expect(saveView(state, other).ok).toBe(true);
  });

  // 86
  it("clears a browser default when the view it points at is deleted", () => {
    const mine = personal("Mine");
    const withDefault = setBrowserDefault(stateWith(mine), "leads", mine.id);
    expect(defaultViewFor(withDefault, "leads")?.id).toBe(mine.id);
    const after = deleteView(withDefault, mine.id);
    expect(after.views).toEqual([]);
    expect(defaultViewFor(after, "leads")).toBeNull();
    // Deleting something that is not there changes nothing.
    expect(deleteView(after, "sv-leads-ghost")).toBe(after);
  });

  // 87
  it("moves a browser default with the view when it is renamed", () => {
    const mine = personal("Mine");
    const withDefault = setBrowserDefault(stateWith(mine), "leads", mine.id);
    const renamed = renameView(withDefault, mine.id, "Ours");
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) return;
    expect(renamed.view.id).toBe(savedViewId("leads", "Ours"));
    expect(defaultViewFor(renamed.state, "leads")?.id).toBe(renamed.view.id);
    // The filters travel unchanged; a rename is a label change, not a redefinition.
    expect(renamed.view.filters).toEqual(mine.filters);
  });

  // 88
  it("rejects a rename that is empty, too long, a collision, or aimed at a shipped view", () => {
    const mine = personal("Mine");
    const other = personal("Other");
    const state = stateWith(mine, other);
    expect(renameView(state, mine.id, "   ")).toEqual({ ok: false, problem: "A view needs a name." });
    expect(renameView(state, mine.id, "x".repeat(SAVED_VIEW_NAME_MAX + 1))).toEqual({
      ok: false,
      problem: `A view name can be at most ${SAVED_VIEW_NAME_MAX} characters.`,
    });
    expect(renameView(state, mine.id, "Other")).toEqual({
      ok: false,
      problem: 'A view named "Other" already exists.',
    });
    expect(renameView(state, DEFAULT_SAVED_VIEWS[0]!.id, "Anything")).toEqual({
      ok: false,
      problem: "That view is not one this browser saved.",
    });
    // Renaming to the same name is a no-op that succeeds rather than a self-collision.
    expect(renameView(state, mine.id, "Mine").ok).toBe(true);
  });

  // 89
  it("re-validates everything it reads back, and drops a default that no longer resolves", () => {
    const mine = personal("Mine", { status: "Contacted" });
    const round = parseSavedViews(
      serializeSavedViews(setBrowserDefault(stateWith(mine), "leads", mine.id)),
      DEMO_CURRENT_USER_ID,
    );
    expect(round.views).toEqual([mine]);
    expect(round.defaults.leads).toBe(mine.id);

    // Corrupt, wrong-version and hand-edited payloads all yield empty state rather than throwing.
    expect(parseSavedViews(null, DEMO_CURRENT_USER_ID)).toEqual(EMPTY_SAVED_VIEWS_STATE);
    expect(parseSavedViews("not json", DEMO_CURRENT_USER_ID)).toEqual(EMPTY_SAVED_VIEWS_STATE);
    expect(
      parseSavedViews(JSON.stringify({ version: SAVED_VIEWS_STORAGE_VERSION + 1, views: [] }), DEMO_CURRENT_USER_ID),
    ).toEqual(EMPTY_SAVED_VIEWS_STATE);

    const hostile = JSON.stringify({
      version: SAVED_VIEWS_STORAGE_VERSION,
      views: [
        // Claims a shipped view's identity.
        { scope: "leads", name: DEFAULT_SAVED_VIEWS.find((v) => v.scope === "leads")!.name, filters: {} },
        // Carries a filter Leads does not have, plus a prototype key.
        { scope: "leads", name: "Sneaky", filters: { priority: "High", __proto__: "x", status: "Contacted" } },
        { scope: "notAScope", name: "Nowhere", filters: {} },
      ],
      defaults: { leads: "sv-leads-deleted-long-ago", proposals: 42 },
    });
    const parsed = parseSavedViews(hostile, DEMO_CURRENT_USER_ID);
    expect(parsed.views.map((view) => view.name)).toEqual(["Sneaky"]);
    expect(parsed.views[0]?.filters).toEqual({ ...defaultFilters("leads"), status: "Contacted" });
    expect(Object.keys(parsed.views[0]!.filters)).not.toContain("priority");
    expect(parsed.defaults).toEqual({});
    // Ownership is the reader's, whatever the payload said.
    expect(parsed.views[0]?.ownership).toEqual({ kind: "personal", userId: DEMO_CURRENT_USER_ID });
    expect(findView(parsed, "sv-leads-sneaky")?.name).toBe("Sneaky");
  });
});
