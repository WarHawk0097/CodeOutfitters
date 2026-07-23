// Appointments route behaviour: the three canonical forms, the view switch, day and month
// navigation, filters, every mutation dialog, and the cross-route consequences of each.
//
// Assertions are plain expect() rather than jest-dom matchers — the suite carries no
// jest-dom dependency and adding one for sugar is not worth the install.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppointmentsScreen } from "./appointments-view";
import { AppointmentsMobileView, AppointmentsSubtitle, AppointmentsViewTabs } from "./appointments-header";
import { __resetAppointmentsView, isUpcoming } from "./view-store";
import { addMonths, monthGrid, timeRange } from "./date-utils";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";
import { DEMO_TODAY } from "../../../lib/demo/seed";

function setViewport(width: number) {
  window.innerWidth = width;
  fireEvent(window, new Event("resize"));
}

const appointments = () => getDemoState().appointments;
const byTitle = (needle: string) => appointments().find((a) => a.title.includes(needle))!;

/** Opens a menu button by its accessible name and clicks one of its items. */
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
  __resetAppointmentsView();
  window.innerWidth = 1440;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("date-utils", () => {
  it("formats a time range with one meridiem, and two when it crosses noon", () => {
    // C-D11 321.
    expect(timeRange("10:00", "10:45", "PST")).toBe("10:00–10:45 AM PST");
    expect(timeRange("11:30", "12:15", "PST")).toBe("11:30 AM–12:15 PM PST");
    expect(timeRange("14:00", "14:45", "PST")).toBe("2:00–2:45 PM PST");
  });

  it("clamps the day when a month has fewer of them", () => {
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("always builds six Sunday-started weeks", () => {
    const grid = monthGrid(DEMO_TODAY);
    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid.flat()).toContain(DEMO_TODAY);
  });
});

describe("Appointments header", () => {
  it("derives the canonical subtitle counts from the appointments themselves", () => {
    // CANON 316: "7 upcoming · 3 today · provider-neutral scheduling".
    render(<AppointmentsSubtitle />);
    expect(document.body.textContent).toContain("7 upcoming · 3 today");
    expect(document.body.textContent).toContain("provider-neutral scheduling");
  });

  it("keeps the subtitle equal to the number of rows the list renders", () => {
    render(<AppointmentsScreen />);
    const rendered = screen.getAllByRole("button", { name: /^Actions for / });
    expect(rendered).toHaveLength(appointments().filter(isUpcoming).length);
  });

  it("switches views from the tablist and with the arrow keys", () => {
    render(
      <>
        <AppointmentsViewTabs />
        <AppointmentsScreen />
      </>,
    );
    const upcoming = screen.getByRole("tab", { name: "Upcoming" });
    expect(upcoming.getAttribute("aria-selected")).toBe("true");
    expect(upcoming.getAttribute("aria-controls")).toBe("appointments-panel");

    fireEvent.keyDown(upcoming, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Calendar" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("grid")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Past" }));
    // Past is state-based: only the completed appointment qualifies at seed.
    expect(screen.getAllByRole("button", { name: /^Actions for / })).toHaveLength(
      appointments().filter((a) => !isUpcoming(a)).length,
    );
  });

  it("collapses the switch to a single menu at mobile", () => {
    render(
      <>
        <AppointmentsMobileView />
        <AppointmentsScreen />
      </>,
    );
    expect(screen.getByRole("button", { name: "Appointment view: Upcoming" })).toBeTruthy();
    chooseFromMenu("Appointment view: Upcoming", "Past");
    expect(screen.getByRole("button", { name: "Appointment view: Past" })).toBeTruthy();
  });
});

describe("Appointments list", () => {
  it("renders the canonical desktop row: date chip, full status label and four actions", () => {
    render(<AppointmentsScreen />);
    const row = screen.getByTestId(`appointment-row-${byTitle("Alicia Fenwick").id}`);
    // C-D11 318: TODAY chip, "READY · PREP DONE", the full company/service detail line.
    expect(within(row).getByText("TODAY")).toBeTruthy();
    expect(within(row).getByText("READY · PREP DONE")).toBeTruthy();
    expect(row.textContent).toContain("Bright Harbor Realty · Web Applications · 10:00–10:45 AM PST · Google Meet");
    for (const action of ["Join meeting", "Open live workspace", "Open lead", "Reschedule"]) {
      expect(within(row).getByRole("button", { name: action })).toBeTruthy();
    }
    // C-D11 328: the amber row offers preparation instead.
    const amber = screen.getByTestId(`appointment-row-${byTitle("Yusuf Adeyemi").id}`);
    expect(within(amber).getByText("PREPARATION NEEDED")).toBeTruthy();
    expect(within(amber).getByRole("button", { name: "Prepare for meeting" })).toBeTruthy();
    // C-D11 336: the no-show keeps a reminder retry.
    const red = screen.getByTestId(`appointment-row-${byTitle("Ruben Ortega").id}`);
    expect(within(red).getByText("NO-SHOW")).toBeTruthy();
    expect(within(red).getByRole("button", { name: "Retry reminder" })).toBeTruthy();
  });

  it("shortens the status and the actions at tablet", () => {
    setViewport(820);
    render(<AppointmentsScreen />);
    const row = screen.getByTestId(`appointment-row-${byTitle("Alicia Fenwick").id}`);
    // T-06 972: "READY", "Join", "Live workspace" — and no company prefix on the detail line.
    expect(within(row).getByText("READY")).toBeTruthy();
    expect(within(row).getByRole("button", { name: "Join" })).toBeTruthy();
    expect(within(row).getByRole("button", { name: "Live workspace" })).toBeTruthy();
    expect(row.textContent).not.toContain("Bright Harbor Realty");
  });

  it("becomes a day planner with a four-day strip at mobile", () => {
    setViewport(390);
    render(<AppointmentsScreen />);
    // MO-07 1142: four day chips, the first selected, a dot where a day has appointments.
    expect(screen.getByRole("button", { name: /^Wednesday, April 22, 3 appointments$/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /^Saturday, April 25, 1 appointment$/ })).toBeTruthy();
    // Only the selected day's appointments render as cards.
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByTestId(`appointment-row-${byTitle("Alicia Fenwick").id}`)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Friday, April 24/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("filters by search, owner and status, and can always clear back", () => {
    render(<AppointmentsScreen />);
    const rows = () => screen.queryAllByRole("button", { name: /^Actions for / });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "crestline" } });
    expect(rows()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(rows()).toHaveLength(7);

    chooseFromMenu(/^Owner: /, "Marc Rivera");
    expect(rows().length).toBeGreaterThan(0);
    expect(rows().length).toBeLessThan(7);
    chooseFromMenu(/^Owner: /, "All owners");

    chooseFromMenu(/^Status: /, "NO-SHOW");
    expect(rows()).toHaveLength(1);
    expect(screen.getByText("NO-SHOW")).toBeTruthy();
  });

  it("says so instead of pretending it can join a real meeting", () => {
    render(<AppointmentsScreen />);
    fireEvent.click(
      within(screen.getByTestId(`appointment-row-${byTitle("Alicia Fenwick").id}`)).getByRole("button", {
        name: "Join meeting",
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("No meeting provider is connected in this demo");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows an empty state on a day with nothing scheduled", () => {
    setViewport(390);
    render(<AppointmentsScreen />);
    fireEvent.click(screen.getByRole("button", { name: /^Thursday, April 23/ }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nobody" } });
    expect(screen.getByText("No appointments to show")).toBeTruthy();
  });

  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/appointments?mock-scenario=demo-error");
    render(<AppointmentsScreen />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Actions for / })).toHaveLength(7);
    window.history.replaceState(null, "", "/appointments");
  });
});

describe("Appointments calendar", () => {
  it("navigates months and scopes the list to the day picked", () => {
    render(
      <>
        <AppointmentsViewTabs />
        <AppointmentsScreen />
      </>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Calendar" }));
    expect(screen.getByRole("heading", { name: "April 2026" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^Actions for / })).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: "May 2026" })).toBeTruthy();
    expect(screen.getByText("No appointments to show")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("gridcell", { name: /^Saturday, April 25/ }));
    expect(screen.getAllByRole("button", { name: /^Actions for / })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getAllByRole("button", { name: /^Actions for / })).toHaveLength(3);
  });
});

describe("Appointment mutations", () => {
  it("books an appointment, refuses an invalid one, and links it to a real lead", () => {
    render(<AppointmentsScreen />);
    const before = appointments().length;
    fireEvent.click(screen.getByRole("button", { name: "New appointment" }));

    // Validation first: an end time before the start and no detail must both be reported.
    fillField("End time", "09:00");
    fillField("Detail", "");
    fireEvent.click(screen.getByRole("button", { name: "Book appointment" }));
    expect(screen.getByText("End time must be after the start time.")).toBeTruthy();
    expect(screen.getByText("Detail is required — it is the line the list shows.")).toBeTruthy();
    expect(appointments()).toHaveLength(before);

    fillField("End time", "11:00");
    fillField("Detail", "Intro scoping call");
    fireEvent.click(screen.getByRole("button", { name: "Book appointment" }));

    expect(appointments()).toHaveLength(before + 1);
    const created = appointments().at(-1)!;
    expect(created.detail).toBe("Intro scoping call");
    expect(created.date).toBe(DEMO_TODAY);
    // Cross-route: the lead it was booked against now advertises the meeting.
    expect(getDemoState().leadOverrides[created.leadId]?.nextStepLabel).toBe(
      `Meeting ${created.date} ${created.startTime}`,
    );
  });

  it("edits an appointment and reflects the change in the row", () => {
    render(<AppointmentsScreen />);
    const target = byTitle("Gregory Mullins");
    chooseFromMenu(`Actions for ${target.title}`, "Edit appointment");
    fillField("Title", "Gregory Mullins — rescoped call");
    fillField("Detail", "Rescoped after the intro email");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const saved = appointments().find((a) => a.id === target.id)!;
    expect(saved.title).toBe("Gregory Mullins — rescoped call");
    expect(screen.getByTestId(`appointment-row-${target.id}`).textContent).toContain("Rescoped after the intro email");
  });

  it("reschedules, refuses a no-op reschedule, and updates the lead's next step", () => {
    render(<AppointmentsScreen />);
    const target = byTitle("Yusuf Adeyemi");
    chooseFromMenu(`Actions for ${target.title}`, "Reschedule");
    // Scoped to the dialog: every open row also offers a "Reschedule" action.
    const submit = () =>
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reschedule" }));

    submit();
    expect(screen.getByText("Pick a different date or time.")).toBeTruthy();
    expect(appointments().find((a) => a.id === target.id)!.date).toBe(target.date);

    fillField("Date", "2026-04-27");
    fillField("Start time", "09:15");
    fillField("End time", "10:00");
    submit();

    const moved = appointments().find((a) => a.id === target.id)!;
    expect(moved.date).toBe("2026-04-27");
    expect(moved.startTime).toBe("09:15");
    expect(getDemoState().leadOverrides[moved.leadId]?.nextStepLabel).toBe("Meeting 2026-04-27 09:15");
  });

  it("cancels with a required reason, drops the row out of Upcoming, and rebooks the lead", () => {
    render(<AppointmentsScreen />);
    const target = byTitle("Gregory Mullins");
    chooseFromMenu(`Actions for ${target.title}`, "Cancel appointment");

    fireEvent.click(screen.getByRole("button", { name: "Cancel appointment" }));
    expect(screen.getByText("Give a reason of at least 3 characters.")).toBeTruthy();
    expect(appointments().find((a) => a.id === target.id)!.state).toBe("ready");

    fillField("Reason", "Client asked to push it a week");
    fireEvent.click(screen.getByRole("button", { name: "Cancel appointment" }));

    expect(appointments().find((a) => a.id === target.id)!.state).toBe("cancelled");
    expect(screen.queryByTestId(`appointment-row-${target.id}`)).toBeNull();
    expect(getDemoState().leadOverrides[target.leadId]?.nextStepLabel).toBe("Rebook meeting");
  });

  it("changes status from the row menu and from the Prepare action", () => {
    render(<AppointmentsScreen />);
    const target = byTitle("Yusuf Adeyemi");
    fireEvent.click(
      within(screen.getByTestId(`appointment-row-${target.id}`)).getByRole("button", { name: "Prepare for meeting" }),
    );
    expect(appointments().find((a) => a.id === target.id)!.state).toBe("ready");

    chooseFromMenu(`Actions for ${target.title}`, "Mark no-show");
    const marked = appointments().find((a) => a.id === target.id)!;
    expect(marked.state).toBe("no_show");
    expect(getDemoState().leadOverrides[marked.leadId]?.nextStepLabel).toBe("No-show — rebook");
  });

  it("re-queues the real failed reminder rather than inventing a new email", () => {
    render(<AppointmentsScreen />);
    const target = byTitle("Ruben Ortega");
    const failed = getDemoState().emails.find((e) => e.leadId === target.leadId && e.state === "FAILED");
    const before = getDemoState().emails.length;
    fireEvent.click(
      within(screen.getByTestId(`appointment-row-${target.id}`)).getByRole("button", { name: "Retry reminder" }),
    );
    if (failed) {
      expect(getDemoState().emails.find((e) => e.id === failed.id)!.state).toBe("QUEUED");
      expect(getDemoState().emails).toHaveLength(before);
    } else {
      expect(getDemoState().emails).toHaveLength(before + 1);
    }
    expect(screen.getByRole("status").textContent).toContain("No email was delivered");
  });

  it("opens a detail dialog carrying the record's relationships and activity", () => {
    render(<AppointmentsScreen />);
    const target = byTitle("Alicia Fenwick");
    chooseFromMenu(`Actions for ${target.title}`, "Mark prep needed");
    fireEvent.click(screen.getByRole("button", { name: target.title }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Bright Harbor Realty");
    expect(dialog.textContent).toContain("10:00–10:45 AM PST");
    expect(dialog.textContent).toContain("ACTIVITY HISTORY");
    expect(dialog.textContent).toContain(`${target.title} updated`);

    fireEvent.click(within(dialog).getByRole("button", { name: "Edit appointment" }));
    expect(screen.getByRole("dialog", { name: `Edit ${target.title}` })).toBeTruthy();
  });
});
