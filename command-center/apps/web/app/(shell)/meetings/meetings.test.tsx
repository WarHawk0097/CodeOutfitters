// Meeting Intelligence route behaviour: the four canonical views, search and filters, the
// M-D02 Prepare panel, and every mutation — complete, reschedule, cancel, draft proposal,
// create — with the cross-route consequences each one has on the linked appointment and lead.
//
// Plain expect() only; the suite carries no jest-dom dependency.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MeetingsScreen, validateMeetingDraft } from "./meetings-view";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";

function setViewport(width: number) {
  window.innerWidth = width;
  fireEvent(window, new Event("resize"));
}

const meetings = () => getDemoState().meetings;
const byName = (needle: string) => meetings().find((m) => m.name.includes(needle))!;
const appointmentOf = (meetingId: string) => {
  const meeting = meetings().find((m) => m.id === meetingId)!;
  return getDemoState().appointments.find((a) => a.id === meeting.appointmentId);
};

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

describe("validateMeetingDraft", () => {
  it("requires a name, a company, a when line and at least one attendee", () => {
    expect(validateMeetingDraft({
      name: "",
      company: "",
      service: "x",
      when: "",
      ownerId: "user-001",
      platform: "Zoom",
      state: "READY",
      consent: "",
      attendees: " , ",
    })).toEqual({
      name: "Name is required.",
      company: "Company is required.",
      when: "When is required — it is the line the directory shows.",
      attendees: "List at least one attendee.",
    });
    expect(validateMeetingDraft({
      name: "A",
      company: "B",
      service: "x",
      when: "Today",
      ownerId: "user-001",
      platform: "Zoom",
      state: "READY",
      consent: "",
      attendees: "A",
    })).toEqual({});
  });
});

describe("Meeting views", () => {
  it("opens on Needs review and derives that tab's count from the data", () => {
    render(<MeetingsScreen />);
    // CANON 445: the switch opens on "Needs review". The count is live, not the static "· 2"
    // the frame draws — only Priyanka Rao is NEEDS REVIEW at seed.
    const review = screen.getByRole("tab", { name: /Needs review/ });
    expect(review.getAttribute("aria-selected")).toBe("true");
    expect(review.textContent).toContain("· 1");
    expect(screen.getByTestId(`meeting-row-${byName("Priyanka").id}`)).toBeTruthy();
    expect(screen.queryByTestId(`meeting-row-${byName("Alicia").id}`)).toBeNull();
  });

  it("filters each view to the states it owns", () => {
    render(<MeetingsScreen />);
    selectView("Upcoming");
    expect(screen.getByTestId(`meeting-row-${byName("Alicia").id}`)).toBeTruthy();

    selectView("Completed");
    // Completed groups COMPLETED, FAILED · NO-SHOW and CANCELLED.
    expect(screen.getByTestId(`meeting-row-${byName("Derrick").id}`)).toBeTruthy();
    expect(screen.getByTestId(`meeting-row-${byName("Ruben").id}`)).toBeTruthy();

    selectView("Live");
    expect(screen.getByText("No meetings to show")).toBeTruthy();
  });

  it("switches views with the arrow keys", () => {
    render(<MeetingsScreen />);
    const review = screen.getByRole("tab", { name: /Needs review/ });
    fireEvent.keyDown(review, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Completed" }).getAttribute("aria-selected")).toBe("true");
  });

  it("shortens Completed to Done at mobile", () => {
    setViewport(390);
    render(<MeetingsScreen />);
    expect(screen.getByRole("tab", { name: "Done" })).toBeTruthy();
    selectView("Upcoming");
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});

describe("Meeting filters", () => {
  it("searches by name, company, service or platform and clears back", () => {
    render(<MeetingsScreen />);
    selectView("Upcoming");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bright harbor" } });
    expect(screen.getByTestId(`meeting-row-${byName("Alicia").id}`)).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nobody" } });
    expect(screen.getByText("No meetings to show")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByTestId(`meeting-row-${byName("Alicia").id}`)).toBeTruthy();
  });

  it("filters by owner", () => {
    render(<MeetingsScreen />);
    selectView("Completed");
    chooseFromMenu(/^Owner: /, "Marc Rivera");
    // Only Priyanka is Marc's, and she is NEEDS REVIEW — so Completed shows nothing of his.
    expect(screen.getByText("No meetings to show")).toBeTruthy();
    chooseFromMenu(/^Owner: /, "All owners");
    expect(screen.getByTestId(`meeting-row-${byName("Derrick").id}`)).toBeTruthy();
  });
});

describe("Meeting Prepare panel", () => {
  it("lists the pinned questions and the REQUIRES PROVIDER readiness rows", () => {
    render(<MeetingsScreen />);
    selectView("Upcoming");
    fireEvent.click(
      within(screen.getByTestId(`meeting-row-${byName("Alicia").id}`)).getByRole("button", { name: "Prepare" }),
    );
    const dialog = screen.getByRole("dialog");
    // M-D02 466-468: three of five need a provider that is not connected.
    expect(within(dialog).getAllByText("REQUIRES PROVIDER")).toHaveLength(3);
    expect(dialog.textContent).toContain("PINNED QUESTIONS · 3");
    // Questions can be dismissed and added.
    const first = within(dialog).getAllByRole("button", { name: /^Dismiss question:/ })[0]!;
    fireEvent.click(first);
    expect(dialog.textContent).toContain("PINNED QUESTIONS · 2");
    fillField("Add question", "Budget — what range are you working to?");
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(dialog.textContent).toContain("PINNED QUESTIONS · 3");
  });

  it("says so instead of pretending it can join a real meeting", () => {
    render(<MeetingsScreen />);
    selectView("Upcoming");
    fireEvent.click(
      within(screen.getByTestId(`meeting-row-${byName("Alicia").id}`)).getByRole("button", { name: "Join" }),
    );
    expect(screen.getByRole("dialog").textContent).toContain("No meeting provider is connected");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Meeting mutations", () => {
  it("marks a meeting complete, requiring an outcome, and sets the lead's next step", () => {
    render(<MeetingsScreen />);
    const target = byName("Priyanka");
    chooseFromMenu(`Actions for ${target.name}`, "Mark complete");

    fillField("Outcome", "no");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark complete" }));
    expect(screen.getByText("Give an outcome of at least 3 characters.")).toBeTruthy();
    expect(meetings().find((m) => m.id === target.id)!.state).toBe("NEEDS REVIEW");

    fillField("Outcome", "Scoped a custom portal build");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark complete" }));

    const done = meetings().find((m) => m.id === target.id)!;
    expect(done.state).toBe("COMPLETED");
    expect(done.outcome).toBe("Scoped a custom portal build");
    expect(getDemoState().leadOverrides[done.leadId]?.nextStepLabel).toBeTruthy();
  });

  it("reschedules the meeting and moves the linked appointment with it", () => {
    render(<MeetingsScreen />);
    const target = byName("Priyanka");
    const linked = appointmentOf(target.id);
    chooseFromMenu(`Actions for ${target.name}`, "Reschedule");
    const submit = () =>
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reschedule meeting" }));

    fillField("Date", "2026-05-04");
    fillField("Start time", "14:00");
    fillField("End time", "13:00");
    submit();
    expect(screen.getByText("End time must be after the start time.")).toBeTruthy();

    fillField("End time", "14:45");
    submit();

    expect(meetings().find((m) => m.id === target.id)!.state).toBe("READY");
    if (linked) {
      const moved = getDemoState().appointments.find((a) => a.id === linked.id)!;
      expect(moved.date).toBe("2026-05-04");
      expect(moved.startTime).toBe("14:00");
      expect(moved.state).toBe("rescheduled");
    }
  });

  it("cancels with a required reason and cancels the linked appointment too", () => {
    render(<MeetingsScreen />);
    const target = byName("Priyanka");
    const linked = appointmentOf(target.id);
    chooseFromMenu(`Actions for ${target.name}`, "Cancel meeting");

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel meeting" }));
    expect(screen.getByText("Give a reason of at least 3 characters.")).toBeTruthy();
    expect(meetings().find((m) => m.id === target.id)!.state).toBe("NEEDS REVIEW");

    fillField("Reason", "Client rescheduling internally");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel meeting" }));

    expect(meetings().find((m) => m.id === target.id)!.state).toBe("CANCELLED");
    if (linked) {
      expect(getDemoState().appointments.find((a) => a.id === linked.id)!.state).toBe("cancelled");
    }
  });

  it("drafts a real proposal from a completed meeting", () => {
    render(<MeetingsScreen />);
    selectView("Completed");
    const before = getDemoState().proposals.length;
    fireEvent.click(
      within(screen.getByTestId(`meeting-row-${byName("Derrick").id}`)).getByRole("button", { name: "Proposal" }),
    );
    expect(getDemoState().proposals).toHaveLength(before + 1);
    // createProposal prepends, so the newest is first.
    const created = getDemoState().proposals[0]!;
    expect(created.leadName).toContain("Derrick");
    expect(created.state).toBe("DRAFT");
    expect(screen.getByRole("status").textContent).toContain("drafted from Derrick");
  });

  it("creates a meeting from a real lead and lands it in Upcoming", () => {
    render(<MeetingsScreen />);
    const before = meetings().length;
    fireEvent.click(screen.getByRole("button", { name: "New meeting" }));

    fillField("Name", "");
    fireEvent.click(screen.getByRole("button", { name: "Add meeting" }));
    expect(screen.getByText("Name is required.")).toBeTruthy();
    expect(meetings()).toHaveLength(before);

    fillField("Name", "Discovery — Northgate");
    fireEvent.click(screen.getByRole("button", { name: "Add meeting" }));

    expect(meetings()).toHaveLength(before + 1);
    const created = meetings().at(-1)!;
    expect(created.name).toBe("Discovery — Northgate");
    expect(created.leadId).toBeTruthy();
    // The view snapped to Upcoming, where a READY meeting shows.
    expect(screen.getByRole("tab", { name: "Upcoming" }).getAttribute("aria-selected")).toBe("true");
  });

  it("opens a detail dialog carrying relationships and activity", () => {
    render(<MeetingsScreen />);
    const target = byName("Derrick");
    selectView("Completed");
    fireEvent.click(within(screen.getByTestId(`meeting-row-${target.id}`)).getByRole("button", { name: target.name }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Ironclad Security");
    expect(dialog.textContent).toContain("ACTIVITY HISTORY");
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit meeting" }));
    expect(screen.getByRole("dialog", { name: `Edit ${target.name}` })).toBeTruthy();
  });

  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/meetings?mock-scenario=demo-error");
    render(<MeetingsScreen />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    window.history.replaceState(null, "", "/meetings");
  });
});
