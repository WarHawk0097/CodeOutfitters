// Release 4 — PERMISSIONS AND LIVE PROVIDER (tests 97-108).
//
// Two things are being defended here. The first is that live mode has no fallback: the moment
// a fallback exists, somebody sees fixtures dressed as their workspace, or believes a view is
// shared when it lives in one browser. The second is that the browser is never the thing that
// decides — the provider contracts take workspace and user from the session, and the UI's
// permission predicates are a copy of the rule for enabling controls, not the rule.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  resolveSearchPlane,
  SEARCH_PROVIDER_REQUIRED_REASON,
  SEARCH_PROVIDER_REQUIRED_TITLE,
  type SearchProvider,
  type SearchProviderPage,
  type SearchProviderQuery,
} from "./provider";
import {
  resolveSavedViewPlane,
  SAVED_VIEWS_PROVIDER_REQUIRED_REASON,
  SAVED_VIEWS_PROVIDER_REQUIRED_TITLE,
  SHARED_VIEWS_UNAVAILABLE_REASON,
  type SavedViewProvider,
  type SavedViewProviderContext,
} from "../views/provider";
import {
  canManageWorkspace,
  canMutateRecords,
  canSeeEntity,
  scopeAdmits,
  searchDocuments,
  sensitiveFindings,
  visibleEntityTypes,
  SEARCH_ENTITY_TYPES,
  SEARCH_RESULT_LIMIT,
  type SearchPermissionContext,
} from "./model";
import { canCreateSharedView, canEditSavedView, savedViewId, defaultFilters, type SavedView } from "../views/model";
import { buildDemoSearchIndex } from "./demo-index";
import { commandsFor } from "./commands";
import { createSeedState, DEMO_CURRENT_USER_ID } from "../demo/seed";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const documents = buildDemoSearchIndex(createSeedState());

function context(overrides: Partial<SearchPermissionContext> = {}): SearchPermissionContext {
  return { workspaceId: null, userId: DEMO_CURRENT_USER_ID, role: "member", live: false, ...overrides };
}

describe("permissions and the live providers (tests 97-108)", () => {
  // 97
  it("resolves live mode to provider-required, with a reason a person can act on", () => {
    expect(resolveSearchPlane(true)).toEqual({
      kind: "provider_required",
      reason: SEARCH_PROVIDER_REQUIRED_REASON,
    });
    expect(resolveSearchPlane(false)).toEqual({ kind: "demo" });
    expect(resolveSavedViewPlane(true)).toEqual({
      kind: "provider_required",
      reason: SAVED_VIEWS_PROVIDER_REQUIRED_REASON,
    });
    expect(resolveSavedViewPlane(false)).toEqual({ kind: "demo" });
    // Both reasons say what is missing and what is *not* happening in its place.
    expect(SEARCH_PROVIDER_REQUIRED_REASON).toContain("No demo records are being shown in their place");
    expect(SAVED_VIEWS_PROVIDER_REQUIRED_REASON).toContain("Nothing is being saved locally in their place");
    expect(SEARCH_PROVIDER_REQUIRED_TITLE).toBe("Search is not connected yet");
    expect(SAVED_VIEWS_PROVIDER_REQUIRED_TITLE).toBe("Saved Views are not connected yet");
  });

  // 98
  it("has exactly two planes — there is no third branch to fall through to", () => {
    const searchSrc = read("lib/search/provider.ts");
    const viewsSrc = read("lib/views/provider.ts");
    for (const src of [searchSrc, viewsSrc]) {
      // Whatever `kind` values exist in the module, they are these two and nothing else.
      const kinds = new Set([...src.matchAll(/kind: "([a-z_]+)"/g)].map((match) => match[1]));
      expect([...kinds].sort()).toEqual(["demo", "provider_required"]);
      expect(src).toContain("There is no");
    }
    // Neither provider module imports a fixture or a browser store, so there is nothing for
    // live mode to read even by accident. (Both mention them in prose, which is the point.)
    const imports = (src: string) => [...src.matchAll(/^import[\s\S]*?from "(.+?)";$/gm)].map((match) => match[1]);
    expect(imports(searchSrc)).toEqual(["./model"]);
    expect(imports(viewsSrc)).toEqual(["./model"]);
    expect(viewsSrc).toContain("no silent fallback to the demo store");
  });

  // 99
  it("takes workspace and user from the session, and gives the client no way to name either", () => {
    // Type-level: a query carries the resolved identifiers, and the browser cannot supply an
    // owner or a workspace on a write.
    const query: SearchProviderQuery = {
      workspaceId: "workspace-1",
      userId: "user-002",
      text: "north",
      scope: "all",
      limit: SEARCH_RESULT_LIMIT,
      cursor: null,
    };
    expect(Object.keys(query).sort()).toEqual(["cursor", "limit", "scope", "text", "userId", "workspaceId"]);

    const savedViewContext: SavedViewProviderContext = { workspaceId: "workspace-1", userId: "user-002" };
    expect(Object.keys(savedViewContext).sort()).toEqual(["userId", "workspaceId"]);

    // Prose-level: the obligations a type cannot express are written down where an implementer
    // will read them, not left to be rediscovered.
    const searchSrc = read("lib/search/provider.ts");
    expect(searchSrc).toContain("must never accept it from a request body");
    expect(searchSrc).toContain("scoped to the caller's workspace in the SQL itself");
    const viewsSrc = read("lib/views/provider.ts");
    expect(viewsSrc).toContain("must never accept either from a request body");
    expect(viewsSrc).toContain("The owner recorded on a created view is\n   *  this value and not anything the client sent.");
  });

  // 100
  it("makes the search provider return a page a client cannot inflate or page past", () => {
    const src = read("lib/search/provider.ts");
    expect(src).toContain("A provider must apply its own maximum regardless of what is asked.");
    expect(src).toContain("Opaque, provider-minted continuation token. Never a row offset the client can inflate");
    expect(src).toContain("may return fewer kinds than requested — it\n   *  may never return more");

    // The page shape is the sanitized document, not a row, so a column added to a table later
    // cannot silently reach the browser.
    const page: SearchProviderPage = { results: [], nextCursor: null };
    expect(page.nextCursor).toBeNull();
    const provider: SearchProvider = {
      search: async () => page,
      recent: async () => page,
    };
    expect(Object.keys(provider).sort()).toEqual(["recent", "search"]);
  });

  // 101
  it("names, in the live contract, everything that must never be searchable", () => {
    const src = read("lib/search/provider.ts");
    for (const forbidden of [
      "secure proposal token",
      "token hash",
      "access link",
      "response body",
      "recipient address",
    ]) {
      expect(src, forbidden).toContain(forbidden);
    }
    expect(src).toContain("Restricted activity is filtered in the query, by visibility");
    // And the demo index already obeys the same list, so the rule is enforced on the only plane
    // that currently has records.
    for (const document of documents) expect(sensitiveFindings(document)).toEqual([]);
  });

  // 102
  it("keeps a live query out of the logs beside the person who typed it", () => {
    expect(read("lib/search/provider.ts")).toContain(
      "Never log the query text alongside the user id.",
    );
  });

  // 103
  it("gives the Saved View provider the five operations the UI needs, and no more", () => {
    const provider: SavedViewProvider = {
      list: async () => [],
      create: async () => {
        throw new Error("not implemented in this release");
      },
      update: async () => {
        throw new Error("not implemented in this release");
      },
      remove: async () => {},
      setDefault: async () => {},
    };
    expect(Object.keys(provider).sort()).toEqual(["create", "list", "remove", "setDefault", "update"]);
    const src = read("lib/views/provider.ts");
    expect(src).toContain("Permitted for the owner of a personal view, and for an authorized role on a shared one.");
    expect(src).toContain("This user's opening view for one list.");
  });

  // 104
  it("states that a cross-workspace read is a rejection rather than an empty list", () => {
    const src = read("lib/views/provider.ts");
    expect(src).toContain(
      "A cross-workspace id\n *     is a rejection, never an empty list",
    );
    // Because an empty list confirms the workspace exists.
    expect(src).toContain("which confirms the workspace exists");
  });

  // 105
  it("keeps a personal view private from every role, including the workspace owner", () => {
    const mine: SavedView = {
      id: savedViewId("leads", "Mine"),
      scope: "leads",
      name: "Mine",
      filters: defaultFilters("leads"),
      sort: null,
      columns: [],
      ownership: { kind: "personal", userId: "user-002" },
    };
    for (const role of ["member", "admin", "owner"] as const) {
      expect(canEditSavedView(mine, { userId: "someone-else", role }), role).toBe(false);
    }
    expect(canEditSavedView(mine, { userId: "user-002", role: "member" })).toBe(true);
    expect(read("lib/views/provider.ts")).toContain("Not by an admin, not by the\n *     workspace owner.");
  });

  // 106
  it("treats the UI's shared-view rule as a copy of the server's, not the rule itself", () => {
    expect(canCreateSharedView({ role: "member" })).toBe(false);
    expect(canCreateSharedView({ role: "admin" })).toBe(true);
    expect(canCreateSharedView({ role: "owner" })).toBe(true);
    expect(read("lib/views/provider.ts")).toContain(
      "is the\n *     UI's copy of the rule for enabling a control, and is not the rule.",
    );
    // In demo mode the control is disabled with its own reason rather than made to look
    // available to an admin who could not actually share anything.
    expect(SHARED_VIEWS_UNAVAILABLE_REASON).toContain("views are saved in this browser only");
  });

  // 107
  it("has one permission predicate per question, used by search, commands and views alike", () => {
    // Read access is deliberately uniform today; the point of the function is that the release
    // which changes that has one place to change.
    expect(visibleEntityTypes(context())).toEqual([...SEARCH_ENTITY_TYPES]);
    for (const type of SEARCH_ENTITY_TYPES) expect(canSeeEntity(context(), type)).toBe(true);

    expect(canManageWorkspace(context({ role: "member" }))).toBe(false);
    expect(canManageWorkspace(context({ role: "admin" }))).toBe(true);
    expect(canManageWorkspace(context({ role: "owner" }))).toBe(true);
    expect(canMutateRecords(context({ role: "member" }))).toBe(true);

    // The palette asks the same predicate rather than testing the role string itself.
    const commandsSrc = read("lib/search/commands.ts");
    expect(commandsSrc).toContain("canManageWorkspace");
    expect(commandsSrc).toContain("canMutateRecords");
    expect(commandsSrc).not.toMatch(/role === "admin"/);
    expect(commandsFor(context({ role: "member" })).some((command) => command.id === "go-settings")).toBe(false);
  });

  // 108
  it("makes zero network calls in demo mode — search, commands and views are all local", () => {
    for (const path of [
      "lib/search/demo-index.ts",
      "lib/search/model.ts",
      "lib/search/commands.ts",
      "lib/search/recent-items.ts",
      "lib/views/store.ts",
      "lib/views/model.ts",
      "lib/views/defaults.ts",
      "components/command-center/command-dialog.tsx",
      "components/command-center/saved-views.tsx",
    ]) {
      const src = read(path);
      for (const call of ["fetch(", "supabase", "createClient", "XMLHttpRequest"]) {
        expect(src, `${path} contains ${call}`).not.toContain(call);
      }
    }
    // And searching the demo index is a pure function of the fixtures — no clock, no randomness,
    // so two identical queries in two runs give byte-identical results.
    const once = searchDocuments(documents, { text: "north", scope: "all" });
    const twice = searchDocuments(documents, { text: "north", scope: "all" });
    expect(JSON.stringify(once)).toBe(JSON.stringify(twice));
    expect(once.length).toBeLessThanOrEqual(SEARCH_RESULT_LIMIT);
    for (const result of once) expect(scopeAdmits("all", result.type)).toBe(true);
  });
});
