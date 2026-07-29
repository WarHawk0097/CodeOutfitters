// Release 4 — COMMANDS (tests 41-52).
//
// The rule this file exists to enforce is that a command does what its label says. Every href
// is checked against the route registry, every create command is checked against a route that
// actually reads the create parameter, and the commands the brief names as forbidden are
// asserted absent by id and by label. A palette that offers "Send proposal by email" and then
// navigates somewhere is worse than a palette that does not offer it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ALL_COMMANDS,
  COMMAND_CREATE_PARAM,
  COMMAND_GROUPS,
  commandsFor,
  groupCommands,
  matchCommands,
} from "./commands";
import { routePatternFor } from "./model";
import type { SearchPermissionContext } from "./model";
import { SEARCH_ROUTE_PATTERNS } from "./routes";
import { TASK_VIEWS } from "../tasks/model";
import { DEMO_CURRENT_USER_ID } from "../demo/seed";

const repo = fileURLToPath(new URL("../../", import.meta.url));

function context(overrides: Partial<SearchPermissionContext> = {}): SearchPermissionContext {
  return { workspaceId: null, userId: DEMO_CURRENT_USER_ID, role: "member", live: false, ...overrides };
}

describe("command palette (tests 41-52)", () => {
  // 41
  it("every command points at a route this application implements", () => {
    for (const command of ALL_COMMANDS) {
      expect(command.href).not.toBe("#");
      expect(command.href.startsWith("/")).toBe(true);
      expect(routePatternFor(command.href, SEARCH_ROUTE_PATTERNS)).not.toBeNull();
    }
  });

  // 42
  it("every command has a unique id, a specific label and a line saying what it does", () => {
    expect(new Set(ALL_COMMANDS.map((command) => command.id)).size).toBe(ALL_COMMANDS.length);
    expect(new Set(ALL_COMMANDS.map((command) => command.label)).size).toBe(ALL_COMMANDS.length);
    for (const command of ALL_COMMANDS) {
      expect(command.label.trim()).not.toBe("");
      expect(command.detail.trim()).not.toBe("");
      // "Open" and "Go" alone are not commands; the label has to name the destination.
      expect(command.label.split(" ").length).toBeGreaterThan(1);
    }
  });

  // 43
  it("covers the navigation destinations the shell actually has", () => {
    const destinations = ALL_COMMANDS.filter((command) => command.group === "Go to" || command.group === "Workspace")
      .map((command) => command.href)
      .sort();
    expect(destinations).toEqual(
      [
        "/dashboard",
        "/dashboard/appointments",
        "/dashboard/email-activity",
        "/dashboard/follow-ups",
        "/dashboard/leads",
        "/dashboard/meetings",
        "/dashboard/my-work",
        "/dashboard/pipeline",
        "/dashboard/proposals",
        "/dashboard/settings",
        "/dashboard/team",
      ].sort(),
    );
  });

  // 44
  it("hides workspace administration from a member", () => {
    const memberCommands = commandsFor(context({ role: "member" })).map((command) => command.id);
    expect(memberCommands).not.toContain("go-team");
    expect(memberCommands).not.toContain("go-settings");
    for (const role of ["admin", "owner"] as const) {
      const ids = commandsFor(context({ role })).map((command) => command.id);
      expect(ids).toContain("go-team");
      expect(ids).toContain("go-settings");
    }
  });

  // 45
  it("withholds create commands in live mode rather than offering a form that cannot save", () => {
    const live = commandsFor(context({ live: true }));
    expect(live.some((command) => command.group === "Create")).toBe(false);
    const demo = commandsFor(context({ live: false }));
    expect(demo.some((command) => command.group === "Create")).toBe(true);
  });

  // 46
  it("every create command lands on a route that reads the create parameter", () => {
    const routeFile: Record<string, string> = {
      "/dashboard/my-work": "app/dashboard/my-work/my-work-view.tsx",
      "/dashboard/pipeline": "app/dashboard/pipeline/pipeline-board.tsx",
      "/dashboard/meetings": "app/dashboard/meetings/meetings-view.tsx",
      "/dashboard/proposals": "app/dashboard/proposals/proposals-view.tsx",
      "/dashboard/follow-ups": "app/dashboard/follow-ups/follow-ups-view.tsx",
    };
    const creates = ALL_COMMANDS.filter((command) => command.group === "Create");
    expect(creates.length).toBe(5);
    for (const command of creates) {
      const [path, query] = command.href.split("?");
      expect(query).toBe(`${COMMAND_CREATE_PARAM}=1`);
      const source = routeFile[path ?? ""];
      expect(source, `${command.id} has no known screen`).toBeDefined();
      // The promise and the thing that keeps it, checked together: the route must read the
      // parameter and open its create dialog on arrival, or the command is a navigation
      // wearing a create label.
      const src = readFileSync(`${repo}${source}`, "utf8");
      expect(src).toContain("COMMAND_CREATE_PARAM");
      expect(src).toContain("setCreateOpen(true)");
    }
  });

  // 47
  it("every view command lands on a filter the destination route reads", () => {
    const views = ALL_COMMANDS.filter((command) => command.group === "Views");
    for (const command of views) {
      const [path, query] = command.href.split("?");
      if (query === undefined) continue;
      expect(path).toBe("/dashboard/my-work");
      const [key, value] = query.split("=");
      expect(key).toBe("view");
      // The value has to be one My Work's own view vocabulary contains — checked against the
      // vocabulary itself, so renaming a view breaks the command rather than the command
      // quietly filtering to nothing.
      expect(TASK_VIEWS).toContain(value);
    }
  });

  // 48
  it("offers no command for a capability this application does not have", () => {
    const labels = ALL_COMMANDS.map((command) => command.label.toLowerCase()).join(" | ");
    for (const absent of [
      "send proposal by email",
      "run automation",
      "connect integration",
      "create invoice",
      "notify team",
      "export data",
      "add lead",
    ]) {
      expect(labels).not.toContain(absent);
    }
  });

  // 49
  it("matches on label first and on authored aliases second", () => {
    const byLabel = matchCommands(ALL_COMMANDS, "overdue");
    expect(byLabel[0]?.id).toBe("view-tasks-overdue");
    // "wip" is nobody's label; it is an authored alias for My Work, which is a decision rather
    // than a runtime synonym guess.
    const byAlias = matchCommands(ALL_COMMANDS, "wip");
    expect(byAlias[0]?.id).toBe("go-my-work");
    expect(matchCommands(ALL_COMMANDS, "zzzznothing")).toEqual([]);
  });

  // 50
  it("keeps a stable order between keystrokes that score identically", () => {
    const first = matchCommands(ALL_COMMANDS, "go");
    const second = matchCommands(ALL_COMMANDS, "go");
    expect(second.map((command) => command.id)).toEqual(first.map((command) => command.id));
    // An empty query shows the head of the catalogue in catalogue order, not a shuffle.
    expect(matchCommands(ALL_COMMANDS, "", 3).map((c) => c.id)).toEqual(
      ALL_COMMANDS.slice(0, 3).map((c) => c.id),
    );
  });

  // 51
  it("groups commands in a fixed heading order and drops empty headings", () => {
    const grouped = groupCommands(commandsFor(context({ role: "admin" })));
    expect(grouped.map((entry) => entry.group)).toEqual([...COMMAND_GROUPS]);
    expect(grouped.every((entry) => entry.commands.length > 0)).toBe(true);

    // A member has no Workspace commands, so that heading is absent rather than empty.
    const memberGroups = groupCommands(commandsFor(context({ role: "member" }))).map((e) => e.group);
    expect(memberGroups).not.toContain("Workspace");
  });

  // 52
  it("respects the caller's limit", () => {
    expect(matchCommands(ALL_COMMANDS, "go", 3).length).toBe(3);
    expect(matchCommands(ALL_COMMANDS, "go").length).toBeLessThanOrEqual(8);
  });
});
