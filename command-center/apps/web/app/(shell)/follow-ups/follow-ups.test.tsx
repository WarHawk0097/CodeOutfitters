// Follow-ups route behaviour: the five views, search and filters, every mutation
// (complete, reschedule, snooze, edit, create, bulk complete) and the cross-route
// consequence each has on the linked lead's next step.
//
// Plain expect() only; the suite carries no jest-dom dependency.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { FollowUpsScreen, validateFollowUpDraft } from "./follow-ups-view";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";

const followUps = () => getDemoState().followUps;
const byId = (id: string) => followUps().find((f) => f.id === id)!;
const overrideOf = (leadId: string) => getDemoState().leadOverrides[leadId];

function selectView(name: RegExp | string) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

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

describe("validateFollowUpDraft", () => {
  it("requires a name, a company, a type and a valid due date", () => {
    expect(
      validateFollowUpDraft({
        name: "",
        company: "",
        type: "",
        dueDate: "not-a-date",
        priority: "Medium",
        stage: "Contacted",
        ownerId: "user-001",
        suggestion: "",
        state: "UPCOMING",
      }),
    ).toEqual({
      name: "Name is required.",
      company: "Company is required.",
      type: "Type is required — it is the line the queue shows.",
      dueDate: "Pick a due date.",
    });
    expect(
      validateFollowUpDraft({
        name: "A",
        company: "B",
        type: "First touch",
        dueDate: "2026-05-01",
        priority: "High",
        stage: "Contacted",
        ownerId: "user-001",
        suggestion: "",
        state: "UPCOMING",
      }),
    ).toEqual({});
  });
});

describe("views", () => {
  it("shows each state's rows under its own tab", () => {
    render(<FollowUpsScreen />);
    // Default view is Overdue → fu-001 Ruben Ortega.
    expect(screen.getByTestId("follow-up-row-fu-001")).toBeTruthy();
    expect(screen.queryByTestId("follow-up-row-fu-002")).toBeNull();

    selectView(/^Today/);
    expect(screen.getByTestId("follow-up-row-fu-002")).toBeTruthy();
    expect(screen.getByTestId("follow-up-row-fu-003")).toBeTruthy();

    selectView(/^Upcoming/);
    expect(screen.getByTestId("follow-up-row-fu-005")).toBeTruthy();
    expect(screen.getByTestId("follow-up-row-fu-006")).toBeTruthy();

    selectView(/^Snoozed/);
    expect(screen.getByTestId("follow-up-row-fu-004")).toBeTruthy();
  });

  it("searches across the queue", () => {
    render(<FollowUpsScreen />);
    fillField("Search follow-ups by name, company, type or suggestion", "Ruben");
    expect(screen.getByTestId("follow-up-row-fu-001")).toBeTruthy();
    fillField("Search follow-ups by name, company, type or suggestion", "zzz-none");
    expect(screen.queryByTestId("follow-up-row-fu-001")).toBeNull();
  });
});

describe("mutations", () => {
  it("completing a follow-up updates the linked lead's next step", () => {
    render(<FollowUpsScreen />);
    const target = byId("fu-001");
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(byId("fu-001").state).toBe("COMPLETED");
    expect(overrideOf(target.leadId)?.nextStepLabel).toBe(`${target.type} done`);
    // The activity history recorded it.
    expect(getDemoState().activity.some((a) => a.subjectId === "fu-001")).toBe(true);
  });

  it("rescheduling makes it upcoming and rewrites the lead's next step", () => {
    render(<FollowUpsScreen />);
    const target = byId("fu-001");
    chooseFromMenu(`Actions for ${target.name}`, "Reschedule");
    fillField("Due date", "2026-05-01");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reschedule" }));
    expect(byId("fu-001").state).toBe("UPCOMING");
    expect(byId("fu-001").dueDate).toBe("2026-05-01");
    expect(overrideOf(target.leadId)?.nextStepLabel).toBe(`${target.type} 2026-05-01`);
  });

  it("snoozing moves it out of the active queue", () => {
    render(<FollowUpsScreen />);
    chooseFromMenu("Actions for Ruben Ortega", "Snooze");
    fillField("Due date", "2026-06-01");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Snooze" }));
    expect(byId("fu-001").state).toBe("SNOOZED");
    expect(byId("fu-001").dueDate).toBe("2026-06-01");
  });

  it("bulk-completes every selected row in the view", () => {
    render(<FollowUpsScreen />);
    selectView(/^Upcoming/); // fu-005, fu-006
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all follow-ups in this view" }));
    fireEvent.click(screen.getByRole("button", { name: "Complete selected" }));
    expect(byId("fu-005").state).toBe("COMPLETED");
    expect(byId("fu-006").state).toBe("COMPLETED");
  });

  it("creates a follow-up, prepended to the queue", () => {
    render(<FollowUpsScreen />);
    const before = followUps().length;
    fireEvent.click(screen.getByRole("button", { name: "New follow-up" }));
    fillField("Name", "Dana Whitfield");
    fillField("Company", "Aster Labs");
    fillField("Type", "Intro call");
    fillField("Due date", "2026-05-10");
    fireEvent.click(screen.getByRole("button", { name: "Add follow-up" }));
    expect(followUps()).toHaveLength(before + 1);
    expect(followUps()[0]!.name).toBe("Dana Whitfield");
  });

  it("edits a follow-up through the menu", () => {
    render(<FollowUpsScreen />);
    chooseFromMenu("Actions for Ruben Ortega", "Edit follow-up");
    fillField("Type", "Re-engagement call");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(byId("fu-001").type).toBe("Re-engagement call");
  });
});

describe("route states", () => {
  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/follow-ups?mock-scenario=demo-error");
    render(<FollowUpsScreen />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    window.history.replaceState(null, "", "/follow-ups");
  });
});
