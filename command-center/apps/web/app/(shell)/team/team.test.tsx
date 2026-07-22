// Team route behaviour: the member table, search and role/status filters, invite (a demo
// invite — no email sent), edit, and remove (which reassigns owned records to Unassigned).
//
// Plain expect() only; the suite carries no jest-dom dependency.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TeamScreen, validateTeamDraft } from "./team-view";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";

const team = () => getDemoState().team;
const byId = (id: string) => team().find((m) => m.id === id);

function chooseFromMenu(triggerName: RegExp | string, itemName: RegExp | string) {
  fireEvent.click(screen.getByRole("button", { name: triggerName }));
  fireEvent.click(screen.getByRole("menuitem", { name: itemName }));
}

function fillField(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
  __resetDemoStateForTests();
  window.innerWidth = 1440;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("validateTeamDraft", () => {
  it("requires a name and a valid email", () => {
    expect(validateTeamDraft({ name: "", email: "nope", role: "Sales", status: "Pending" })).toEqual({
      name: "Name is required.",
      email: "Enter a valid email.",
    });
    expect(validateTeamDraft({ name: "Dana Fox", email: "dana@fox.com", role: "Sales", status: "Active" })).toEqual({});
  });
});

describe("directory", () => {
  it("lists every seeded member", () => {
    render(<TeamScreen />);
    expect(screen.getByTestId("team-row-user-002")).toBeTruthy(); // Marc Rivera
    expect(screen.getByTestId("team-row-user-004")).toBeTruthy(); // Tara Osei
    expect(screen.getByText("4 OF 4 MEMBERS")).toBeTruthy();
  });

  it("searches by name", () => {
    render(<TeamScreen />);
    fillField("Search team by name or email", "priya");
    expect(screen.getByTestId("team-row-user-001")).toBeTruthy();
    expect(screen.queryByTestId("team-row-user-002")).toBeNull();
    expect(screen.getByText("1 OF 4 MEMBERS")).toBeTruthy();
  });

  it("filters by role and by status", () => {
    render(<TeamScreen />);
    // Administrator → only Marc Rivera (user-002).
    chooseFromMenu("Role: All roles", "Administrator");
    expect(screen.getByTestId("team-row-user-002")).toBeTruthy();
    expect(screen.queryByTestId("team-row-user-001")).toBeNull();
    chooseFromMenu(/^Role: /, "All roles");

    // Pending → only Tara Osei (user-004).
    chooseFromMenu("Status: Any status", "Pending");
    expect(screen.getByTestId("team-row-user-004")).toBeTruthy();
    expect(screen.queryByTestId("team-row-user-002")).toBeNull();
  });
});

describe("mutations", () => {
  it("invites a member as a Pending demo invite, appended to the directory", () => {
    render(<TeamScreen />);
    const before = team().length;
    fireEvent.click(screen.getByRole("button", { name: "Invite member" }));
    fillField("Name", "Dana Fox");
    fillField("Email", "dana@fox.com");
    fireEvent.click(screen.getByRole("button", { name: "Send invite (demo)" }));
    expect(team()).toHaveLength(before + 1);
    const created = team()[team().length - 1]!;
    expect(created.name).toBe("Dana Fox");
    expect(created.status).toBe("Pending");
  });

  it("edits a member's role", () => {
    render(<TeamScreen />);
    expect(byId("user-001")!.role).toBe("Sales");
    chooseFromMenu("Actions for Priya Nair", /^Edit member/);
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "Administrator" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(byId("user-001")!.role).toBe("Administrator");
  });

  it("removes a member and reassigns every record they own to Unassigned", () => {
    render(<TeamScreen />);
    chooseFromMenu("Actions for Priya Nair", /^Remove member/);
    fireEvent.click(screen.getByRole("button", { name: "Remove member" }));
    expect(byId("user-001")).toBeUndefined();
    const state = getDemoState();
    const stillOwned = [state.opportunities, state.appointments, state.meetings, state.proposals, state.followUps]
      .flat()
      .filter((r) => (r as { ownerId: string }).ownerId === "user-001");
    expect(stillOwned).toHaveLength(0);
  });
});

describe("route states", () => {
  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/team?mock-scenario=demo-error");
    render(<TeamScreen />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    window.history.replaceState(null, "", "/team");
  });
});
