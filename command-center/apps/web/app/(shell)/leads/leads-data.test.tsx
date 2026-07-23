// End-to-end Leads pagination through the real component tree: LeadsData owns the
// query, fetchLeads sends it, the msw handler answers it against all 128 records, and
// LeadsTable renders the page it was given.
//
// The defect these cover: LeadsData kept only `res.rows` and dropped `res.total`, so
// LeadsTable paginated the ten rows it held and its footer read "Page 1 of 1".
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { LEADS_PAGE_SIZE, pageCountOf } from "@command-center/contracts";
import { handlers } from "../../../mocks/handlers";
import { LEAD_DATASET } from "../../../mocks/handlers/leads";
import { LeadsData } from "./leads-data";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

const TOTAL = LEAD_DATASET.length;
const PAGE_COUNT = pageCountOf(TOTAL, LEADS_PAGE_SIZE);

// The footer renders "1–10 of 128"; read the numbers back rather than matching a
// formatted string, so a spacing change does not fail a pagination test.
function rangeText(): string {
  const el = screen.getByText(/of \d+$/);
  return el.textContent ?? "";
}

async function renderLeads() {
  render(<LeadsData />);
  await screen.findByText(/of \d+$/);
}

// T-02 908 draws the previous control as "‹", C-D05 195 as "Prev". The glyph is aria-hidden
// and the button carries aria-label="Previous page", so the accessible name is stable at
// every width and is what this suite drives.
function prevButton() {
  return screen.getByRole("button", { name: "Previous page" });
}
// One control carries both presentations (MO-02 1086): it reads "Next" at md+ and
// "Load N more · M remaining" below it, and it carries no aria-label, so its accessible
// name is whichever span CSS leaves visible. jsdom loads no CSS, so both spans count and
// the name is the concatenation — matched on the trailing "Next" rather than exactly.
function nextButton() {
  return screen.getByRole("button", { name: /Next$/ });
}

describe("Leads pagination, end to end", () => {
  it("shows the dataset total, not the number of rows loaded", async () => {
    await renderLeads();
    expect(rangeText()).toBe(`1–${LEADS_PAGE_SIZE} of ${TOTAL}`);
    expect(TOTAL).toBe(128);
  });

  it("offers the last page as a direct target", async () => {
    await renderLeads();
    expect(PAGE_COUNT).toBe(13);
    expect(screen.getByRole("button", { name: `Go to page ${PAGE_COUNT}` })).toBeTruthy();
  });

  it("Next requests the next page and the table rows change", async () => {
    await renderLeads();
    const firstRowName = LEAD_DATASET[0]!.name;
    expect(screen.getAllByText(firstRowName).length).toBeGreaterThan(0);

    fireEvent.click(nextButton());
    await waitFor(() => expect(rangeText()).toBe(`11–20 of ${TOTAL}`));
    // Scoped to the grid: the mobile card list below it is cumulative by design (MO-02
    // 1084), so page 1's names stay on screen there and a document-wide query would
    // assert the opposite of the intended mobile behaviour.
    const gridText = screen.getAllByRole("row").map((r) => r.textContent ?? "");
    expect(gridText.some((t) => t.includes(firstRowName))).toBe(false);
  });

  it("Prev requests the previous page", async () => {
    await renderLeads();
    fireEvent.click(nextButton());
    await waitFor(() => expect(rangeText()).toBe(`11–20 of ${TOTAL}`));

    fireEvent.click(prevButton());
    await waitFor(() => expect(rangeText()).toBe(`1–${LEADS_PAGE_SIZE} of ${TOTAL}`));
  });

  it("navigates to the last page, which holds the remaining eight rows", async () => {
    await renderLeads();
    fireEvent.click(screen.getByRole("button", { name: `Go to page ${PAGE_COUNT}` }));
    await waitFor(() => expect(rangeText()).toBe(`121–${TOTAL} of ${TOTAL}`));
    expect(TOTAL - 120).toBe(8);
  });

  it("disables Prev on the first page and Next on the last", async () => {
    await renderLeads();
    expect((prevButton() as HTMLButtonElement).disabled).toBe(true);
    expect((nextButton() as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: `Go to page ${PAGE_COUNT}` }));
    await waitFor(() => expect(rangeText()).toBe(`121–${TOTAL} of ${TOTAL}`));
    expect((nextButton() as HTMLButtonElement).disabled).toBe(true);
    expect((prevButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("filtering by status returns to page 1 and narrows the whole dataset", async () => {
    await renderLeads();
    fireEvent.click(nextButton());
    await waitFor(() => expect(rangeText()).toBe(`11–20 of ${TOTAL}`));

    const expected = LEAD_DATASET.filter((r) => r.status === "Contacted").length;
    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "Contacted" } });
    await waitFor(() => expect(rangeText()).toBe(`1–${LEADS_PAGE_SIZE} of ${expected}`));
    // Narrowed against all 128 records, not against the ten that were on screen.
    expect(expected).toBeGreaterThan(LEADS_PAGE_SIZE);
    expect(expected).toBeLessThan(TOTAL);
  });

  // The Service popover is the one filter that is a disclosure rather than a
  // native select, so dismissal is ours to implement — a menu that only closes by
  // choosing something is a trap.
  it("closes the Service popover on Escape and hands focus back to the trigger", async () => {
    await renderLeads();
    const trigger = screen.getByRole("button", { name: "Service ▾" });
    fireEvent.click(trigger);
    expect(screen.getByRole("group", { name: "Service faceted counts" })).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("group", { name: "Service faceted counts" })).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the Service popover on a click outside it", async () => {
    await renderLeads();
    const trigger = screen.getByRole("button", { name: "Service ▾" });
    fireEvent.click(trigger);
    const panel = screen.getByRole("group", { name: "Service faceted counts" });

    // A pointer inside the panel must NOT dismiss it, or picking a service would
    // close the menu before the click landed.
    fireEvent.pointerDown(panel);
    expect(screen.queryByRole("group", { name: "Service faceted counts" })).toBeTruthy();

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByRole("group", { name: "Service faceted counts" })).toBeNull());
  });

  it("names the filter chip by what removing it does, not by its glyph", async () => {
    await renderLeads();
    const owner = LEAD_DATASET[0]!.owner;
    fireEvent.change(screen.getByLabelText("Filter by owner"), { target: { value: owner } });

    const chip = await screen.findByRole("button", { name: /^Remove filter / });
    // The ✕ is decoration and must not reach the accessible name.
    expect(chip.getAttribute("aria-label")).not.toContain("✕");
    fireEvent.click(chip);
    await waitFor(() => expect(rangeText()).toBe(`1–${LEADS_PAGE_SIZE} of ${TOTAL}`));
  });

  it("filtering by owner returns to page 1 and narrows the whole dataset", async () => {
    await renderLeads();
    fireEvent.click(nextButton());
    await waitFor(() => expect(rangeText()).toBe(`11–20 of ${TOTAL}`));

    const owner = LEAD_DATASET[0]!.owner;
    const expected = LEAD_DATASET.filter((r) => r.owner === owner).length;
    fireEvent.change(screen.getByLabelText("Filter by owner"), { target: { value: owner } });
    await waitFor(() => expect(rangeText()).toBe(`1–${LEADS_PAGE_SIZE} of ${expected}`));
    expect(expected).toBeGreaterThan(LEADS_PAGE_SIZE);
  });

  it("searching returns to page 1 and matches beyond the loaded page", async () => {
    await renderLeads();
    fireEvent.click(nextButton());
    await waitFor(() => expect(rangeText()).toBe(`11–20 of ${TOTAL}`));

    // A name that exists only outside page 1 — proof the search reached the dataset.
    const target = LEAD_DATASET[TOTAL - 1]!.name;
    fireEvent.change(screen.getByLabelText("Search leads"), { target: { value: target } });
    await waitFor(() => expect(rangeText()).toMatch(/^1–\d+ of \d+$/));
    expect(screen.getAllByText(target).length).toBeGreaterThan(0);
  });

  it("sorting is applied by the server and stays deterministic", async () => {
    await renderLeads();
    fireEvent.click(screen.getAllByRole("button", { name: /^Lead/ })[0]!);
    await waitFor(() => expect(rangeText()).toBe(`1–${LEADS_PAGE_SIZE} of ${TOTAL}`));
    const sortedNames = [...LEAD_DATASET].map((r) => r.name).sort();
    expect(screen.getAllByText(sortedNames[0]!).length).toBeGreaterThan(0);
  });

  // A query matching nothing rendered the header row over blank space. The counters said
  // "0 results", but the rows area said nothing at all.
  it("states the empty result instead of rendering an empty rows area", async () => {
    await renderLeads();
    fireEvent.change(screen.getByLabelText("Search leads"), { target: { value: "zzznotalead" } });
    await waitFor(() => expect(rangeText()).toBe("0–0 of 0"));

    const empty = screen.getAllByRole("status");
    expect(empty.length).toBeGreaterThan(0);
    expect(empty[0]!.textContent).toBe("No leads match the current search and filters.");
    // Announced beside the table, not smuggled in as a row: no data row survives, and the
    // only rows left are the header rows (one per rendering, jsdom shows them all).
    expect(screen.queryAllByLabelText(/^Select row /)).toHaveLength(0);
    expect(screen.getAllByRole("row").every((r) => r.querySelector('[role="columnheader"]'))).toBe(true);
  });

  // Two of ten selected is exactly the state a tri-state box exists for. The header box
  // reported a flat "not checked", so assistive technology could not tell it from none.
  it("reports the select-all box as mixed while only some rows are selected", async () => {
    await renderLeads();
    const all = screen.getAllByLabelText("Select all rows")[0] as HTMLInputElement;
    expect(all.indeterminate).toBe(false);

    fireEvent.click(screen.getAllByLabelText(/^Select row /)[0]!);
    await waitFor(() => expect(all.indeterminate).toBe(true));
    expect(all.checked).toBe(false);

    // Every row selected is a determinate state again, not a mixed one.
    fireEvent.click(all);
    await waitFor(() => expect(all.checked).toBe(true));
    expect(all.indeterminate).toBe(false);
  });

  it("renders no raw enum values or owner ids", async () => {
    await renderLeads();
    const text = document.body.textContent ?? "";
    for (const raw of ["not_started", "no_show", "user-001", "user-002", "user-003"]) {
      expect(text).not.toContain(raw);
    }
    // "FUL" is the contract value; the canonical ST map labels it "Follow Up Later".
    expect(screen.getAllByText("Follow Up Later").length).toBeGreaterThan(0);
  });
});

// MO-02 1084-1086. The mobile frame has no pager: one full-width control appends the next
// batch to the cards already on screen. Same query, same dataset, same server ordering as the
// desktop pager above it — only the retention differs.
//
// jsdom loads no CSS, so the desktop grid and the mobile card list are both in the DOM. The
// card list is the only <ul> in the component, so listitem role isolates it from the table.
function mobileCardNames(): string[] {
  return screen.getAllByRole("listitem").map((li) => li.querySelector("span")?.textContent ?? "");
}

describe("mobile load-more, end to end", () => {
  it("labels the control from the count actually loaded, not from a literal", async () => {
    await renderLeads();
    expect(mobileCardNames().length).toBe(LEADS_PAGE_SIZE);
    // 128 − 10 loaded = 118. Derived; the canonical literal is staged elsewhere.
    expect(nextButton().textContent).toContain(`Load ${LEADS_PAGE_SIZE} more · ${TOTAL - LEADS_PAGE_SIZE} remaining`);
  });

  it("appends the next batch, keeps the order and duplicates nothing", async () => {
    await renderLeads();
    fireEvent.click(nextButton());
    await waitFor(() => expect(mobileCardNames().length).toBe(2 * LEADS_PAGE_SIZE));

    const names = mobileCardNames();
    expect(names).toEqual(LEAD_DATASET.slice(0, 2 * LEADS_PAGE_SIZE).map((r) => r.name));
    expect(new Set(names).size).toBe(names.length);
    expect(nextButton().textContent).toContain(`· ${TOTAL - 2 * LEADS_PAGE_SIZE} remaining`);
  });

  it("reaches every record and then reports nothing remaining", async () => {
    await renderLeads();
    for (let i = 1; i < PAGE_COUNT; i++) {
      fireEvent.click(nextButton());
      await waitFor(() => expect(mobileCardNames().length).toBe(Math.min((i + 1) * LEADS_PAGE_SIZE, TOTAL)));
    }
    expect(mobileCardNames().length).toBe(TOTAL);
    expect(nextButton().textContent).toContain("No more results");
    expect((nextButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("restarts the list when the query changes", async () => {
    await renderLeads();
    fireEvent.click(nextButton());
    await waitFor(() => expect(mobileCardNames().length).toBe(2 * LEADS_PAGE_SIZE));

    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "Contacted" } });
    await waitFor(() => expect(mobileCardNames().length).toBe(LEADS_PAGE_SIZE));
    for (const name of mobileCardNames()) {
      expect(LEAD_DATASET.find((r) => r.name === name)?.status).toBe("Contacted");
    }
  });
});

// The mock/test-only canonical visual state (`?visual-state=canonical`). Two properties matter:
// it is inert outside mock mode, and inside mock mode it changes presentation only — the total,
// the page size and the rows the server answered are untouched.
describe("canonical visual state gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    window.history.replaceState({}, "", "/leads");
  });

  async function renderWith(mode: string | undefined, search: string) {
    if (mode === undefined) vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "");
    else vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", mode);
    window.history.replaceState({}, "", `/leads${search}`);
    render(<LeadsData />);
    await screen.findAllByText(LEAD_DATASET[0]!.name);
  }

  it("stays inert outside mock mode even with the parameter present", async () => {
    await renderWith(undefined, "?visual-state=canonical");
    expect(screen.queryByText(/selected$/i)).toBeNull();
    expect(screen.queryByText("Service: AI Automation ✕")).toBeNull();
    expect(screen.queryByText(/Possible duplicate/)).toBeNull();
    expect(rangeText()).toBe(`1–${LEADS_PAGE_SIZE} of ${TOTAL}`);
  });

  it("stays inert in mock mode without the parameter", async () => {
    await renderWith("mock", "");
    expect(screen.queryByText(/selected$/i)).toBeNull();
    expect(screen.queryByText(/Possible duplicate/)).toBeNull();
  });

  it("stages the canonical presentation in mock mode, without changing total or rows", async () => {
    await renderWith("mock", "?visual-state=canonical");
    await waitFor(() => expect(screen.getByText("2 selected")).toBeTruthy());
    expect(screen.getByText("Service: AI Automation ✕")).toBeTruthy();
    expect(screen.getByText(/Possible duplicate — matching phone on LD-4820/)).toBeTruthy();
    // Presentation only: still one unfiltered page of ten out of the full 128.
    expect(screen.getByText(/of 128/)).toBeTruthy();
    // jsdom applies no CSS, so the desktop and tablet tables are both in the DOM: two header
    // rows plus two pages of ten. The count also proves the staged skeleton is NOT exposed as
    // an eleventh row — 22, not 23.
    expect(screen.getAllByRole("row").length).toBe(2 * (1 + LEADS_PAGE_SIZE));
    expect(screen.getAllByText(LEAD_DATASET[1]!.name).length).toBeGreaterThan(0);
  });

  // CANON 1077/1490: the mobile card loop is `rows.slice(0, 7)` — seven card elements exist,
  // none is hidden, and Derrick Vaughn (row 8) is simply not emitted.
  it("renders exactly the canonical seven mobile cards, ending at Sofia Marchetti", async () => {
    await renderWith("mock", "?visual-state=canonical");
    const names = mobileCardNames();
    expect(names.length).toBe(7);
    expect(names.at(-1)).toBe("Sofia Marchetti");
    expect(names).not.toContain("Derrick Vaughn");
    // Not a second dataset: the desktop grid beside it still holds the full page of ten.
    expect(screen.getAllByText("Derrick Vaughn").length).toBeGreaterThan(0);
  });

  // CANONICAL_PRESENTATION_INCONSISTENCY. 128 − 7 = 121, but the canonical label is a bare
  // text node reading 118 — the ten-record page size the desktop and tablet frames use. The
  // literal is reproduced as PRESENTATION_TEST_STATE_REFERENCE_DATA and is NOT claimed to be
  // derived from the seven cards; the derived form is asserted in the suite above.
  it("reproduces the canonical load-more literal verbatim in the staged state", async () => {
    await renderWith("mock", "?visual-state=canonical");
    expect(nextButton().textContent).toContain("Load 10 more · 118 remaining");
  });
});
