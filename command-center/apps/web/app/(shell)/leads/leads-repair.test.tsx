// Regression cover for the four functional repairs of the final Phase 3 defect pass:
// the owner facet directory, CSV export, the deterministic mock error/retry scenario, and
// the Service popover's accessibility semantics.
//
// The defect that drove most of this: owner options were derived from the rows on the
// current page, so filtering to an owner and then searching for something that owner has
// none of emptied the option list — the applied filter lost its name and the chip fell back
// to "Unassigned", which is a DIFFERENT real owner.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { setupServer } from "msw/node";
import { UNKNOWN_OWNER_LABEL } from "@command-center/contracts";
import { handlers } from "../../../mocks/handlers";
import { LEAD_DATASET } from "../../../mocks/handlers/leads";
import { fetchLeads } from "../../../lib/data/leads";
import { buildLeadsCsv, csvField, exportLeadsCsv, leadsCsvFilename } from "../../../lib/leads-csv";
import { HeaderStatsProvider } from "../header-stats";
import { LeadsData } from "./leads-data";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  window.history.replaceState({}, "", "/leads");
});
afterAll(() => server.close());

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
});

const PRIYA = "user-001";
const PRIYA_LABEL = "Priya Nair";
// A search term no lead name or company contains, so owner + search matches nothing.
const NO_MATCH = "zzznotalead";

function ownerSelect(): HTMLSelectElement {
  return screen.getAllByLabelText("Filter by owner")[0] as HTMLSelectElement;
}

async function renderLeads() {
  render(
    <HeaderStatsProvider>
      <LeadsData />
    </HeaderStatsProvider>,
  );
  await screen.findByText(/of \d+$/);
}

describe("owner facets — the response carries a stable owner directory", () => {
  it("returns every selectable owner even when the result set is empty", async () => {
    const res = await fetchLeads({ owner: PRIYA, q: NO_MATCH });
    expect(res.rows).toHaveLength(0);
    expect(res.total).toBe(0);
    // The directory survives the empty page. This is the contract guarantee the whole
    // repair rests on.
    const ids = res.ownerFacets.map((f) => f.id).sort();
    expect(ids).toEqual(["unassigned", "user-001", "user-002"]);
    expect(res.ownerFacets.find((f) => f.id === PRIYA)?.label).toBe(PRIYA_LABEL);
  });

  it("is identical on every page, so labels cannot depend on which page is loaded", async () => {
    const first = await fetchLeads({ page: 1 });
    const last = await fetchLeads({ page: 13 });
    expect(last.ownerFacets.map((f) => ({ id: f.id, label: f.label }))).toEqual(
      first.ownerFacets.map((f) => ({ id: f.id, label: f.label })),
    );
  });

  it("counts with the owner dimension excluded, as the contract documents", async () => {
    // Selecting one owner must NOT collapse the other owners' counts to zero — the counts
    // answer "how many would I get if I picked this instead".
    const unfiltered = await fetchLeads({});
    const filtered = await fetchLeads({ owner: PRIYA });
    expect(filtered.ownerFacets).toEqual(unfiltered.ownerFacets);
    // And they still respond to the OTHER active filters.
    const searched = await fetchLeads({ q: "a" });
    const summed = searched.ownerFacets.reduce((n, f) => n + f.count, 0);
    expect(summed).toBe(searched.total);
    // Sanity: the selected owner's facet count matches the total when only owner is applied.
    expect(filtered.ownerFacets.find((f) => f.id === PRIYA)?.count).toBe(filtered.total);
  });

  it("keeps the selected owner named when the filtered result is empty", async () => {
    await renderLeads();
    fireEvent.change(ownerSelect(), { target: { value: PRIYA } });
    await waitFor(() => expect(ownerSelect().value).toBe(PRIYA));

    fireEvent.change(screen.getAllByLabelText(/Search leads/i)[0]!, { target: { value: NO_MATCH } });
    await waitFor(() => expect(screen.getByText("0–0 of 0")).toBeTruthy());

    // The three assertions that were FAIL before this repair.
    expect(ownerSelect().value).toBe(PRIYA);
    expect(within(ownerSelect()).getByRole("option", { name: PRIYA_LABEL })).toBeTruthy();
    expect(screen.getByText(`Owner: ${PRIYA_LABEL}`)).toBeTruthy();
    // Never the display name of a different real owner.
    expect(screen.queryByText("Owner: Unassigned")).toBeNull();
  });

  it("keeps Unassigned selectable in its own right", async () => {
    await renderLeads();
    fireEvent.change(ownerSelect(), { target: { value: "unassigned" } });
    await waitFor(() => expect(screen.getByText("Owner: Unassigned")).toBeTruthy());
    expect(ownerSelect().value).toBe("unassigned");

    fireEvent.change(screen.getAllByLabelText(/Search leads/i)[0]!, { target: { value: NO_MATCH } });
    await waitFor(() => expect(screen.getByText("0–0 of 0")).toBeTruthy());
    // Still Unassigned, because it was actually chosen — not because of a fallback.
    expect(ownerSelect().value).toBe("unassigned");
    expect(screen.getByText("Owner: Unassigned")).toBeTruthy();
  });

  it("labels an owner id the directory does not contain as unknown, never as Unassigned", async () => {
    await renderLeads();
    // An id that is not in the directory cannot be chosen through the select, so it is
    // injected the way a stale bookmark or a hand-edited query would produce it.
    const select = ownerSelect();
    const option = document.createElement("option");
    option.value = "user-999";
    select.appendChild(option);
    fireEvent.change(select, { target: { value: "user-999" } });

    await waitFor(() => expect(screen.getByText(`Owner: ${UNKNOWN_OWNER_LABEL}`)).toBeTruthy());
    expect(screen.queryByText("Owner: Unassigned")).toBeNull();
    // The control still shows a filter is applied rather than reading as "no filter".
    expect(ownerSelect().value).toBe("user-999");
  });

  it("resets to page 1 when the owner changes from a deep page", async () => {
    await renderLeads();
    fireEvent.click(screen.getByRole("button", { name: "Go to page 13" }));
    await waitFor(() => expect(screen.getByText(/^121–128 of 128$/)).toBeTruthy());
    fireEvent.change(ownerSelect(), { target: { value: PRIYA } });
    await waitFor(() => expect(screen.getByText(/^1–10 of 48$/)).toBeTruthy());
  });

  it("clears the owner filter back to the full dataset", async () => {
    await renderLeads();
    fireEvent.change(ownerSelect(), { target: { value: PRIYA } });
    await waitFor(() => expect(screen.getByText(/^1–10 of 48$/)).toBeTruthy());
    fireEvent.change(ownerSelect(), { target: { value: "" } });
    await waitFor(() => expect(screen.getByText(/^1–10 of 128$/)).toBeTruthy());
    expect(screen.queryByText(/^Owner: /)).toBeNull();
  });
});

describe("CSV export", () => {
  it("escapes commas, quotes and newlines per RFC 4180", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a,b")).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("line1\nline2")).toBe('"line1\nline2"');
    expect(csvField(undefined)).toBe("");
  });

  it("emits a headers-only file for an empty result set", () => {
    const csv = buildLeadsCsv([], []);
    expect(csv).toBe("Lead,Company,Service,Status,Owner,Appointment,Next Step,Created\r\n");
  });

  it("preserves Unicode in names", () => {
    const lead = { ...LEAD_DATASET[0]!, name: "Zoë Ångström", company: "Café, Inc." };
    const csv = buildLeadsCsv([lead], []);
    expect(csv).toContain("Zoë Ångström");
    expect(csv).toContain('"Café, Inc."');
  });

  it("exports every matching row across all pages, not just the visible page", async () => {
    const { csv, rowCount, filename } = await exportLeadsCsv({});
    expect(rowCount).toBe(128);
    // 1 header + 128 data rows, trailing terminator.
    expect(csv.trimEnd().split("\r\n")).toHaveLength(129);
    expect(filename).toBe("leads-export-128-rows.csv");
    expect(leadsCsvFilename(48)).toBe("leads-export-48-rows.csv");
  });

  it("respects the active filters and sort", async () => {
    const { csv, rowCount } = await exportLeadsCsv({ owner: PRIYA, sortBy: "name", sortDir: "asc" });
    expect(rowCount).toBe(48);
    const dataRows = csv.trimEnd().split("\r\n").slice(1);
    expect(dataRows).toHaveLength(48);
    // Every row belongs to the filtered owner...
    expect(dataRows.every((line) => line.includes(PRIYA_LABEL))).toBe(true);
    // ...and the server's sort order survived into the file.
    const names = dataRows.map((line) => (line.startsWith('"') ? line.slice(1, line.indexOf('"', 1)) : line.split(",")[0]!));
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });

  it("writes human-facing values, never raw ids or snake_case enums", async () => {
    const { csv } = await exportLeadsCsv({});
    expect(csv).not.toMatch(/user-\d{3}/);
    expect(csv).not.toMatch(/\bLD-\d+/);
    expect(csv).not.toMatch(/not_started|no_show|appt_pending/);
    expect(csv.split("\r\n")[0]).toBe("Lead,Company,Service,Status,Owner,Appointment,Next Step,Created");
  });
});

describe("mock error scenario and retry", () => {
  it("is ignored outside mock mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "real");
    window.history.replaceState({}, "", "/leads?mock-scenario=initial-error");
    // The parameter never reaches the wire, so the request succeeds.
    const res = await fetchLeads({}, { mockScenario: "initial-error" });
    expect(res.rows.length).toBeGreaterThan(0);
  });

  it("fails the first load, announces it, and recovers on Retry", async () => {
    window.history.replaceState({}, "", "/leads?mock-scenario=initial-error");
    render(
      <HeaderStatsProvider>
        <LeadsData />
      </HeaderStatsProvider>,
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("leads.list failed: 500");

    const retry = within(alert).getByRole("button", { name: "Retry" });
    fireEvent.click(retry);

    // The retry drops the scenario parameter, so it succeeds deterministically.
    await screen.findByText(/of \d+$/);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText(/^1–10 of 128$/)).toBeTruthy();
  });

  it("stays usable after recovery — filters still work", async () => {
    window.history.replaceState({}, "", "/leads?mock-scenario=initial-error");
    render(
      <HeaderStatsProvider>
        <LeadsData />
      </HeaderStatsProvider>,
    );
    fireEvent.click(within(await screen.findByRole("alert")).getByRole("button", { name: "Retry" }));
    await screen.findByText(/of \d+$/);

    fireEvent.change(ownerSelect(), { target: { value: PRIYA } });
    await waitFor(() => expect(screen.getByText(/^1–10 of 48$/)).toBeTruthy());
  });

  it("fails a filter request under the filter-error scenario and recovers", async () => {
    window.history.replaceState({}, "", "/leads?mock-scenario=filter-error");
    render(
      <HeaderStatsProvider>
        <LeadsData />
      </HeaderStatsProvider>,
    );
    // The initial load is untouched by this scenario.
    await screen.findByText(/^1–10 of 128$/);

    fireEvent.change(ownerSelect(), { target: { value: PRIYA } });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("leads.list failed: 500");

    fireEvent.click(within(alert).getByRole("button", { name: "Retry" }));
    // Recovers WITH the filter applied — the retry re-sends the query, not the initial one.
    await waitFor(() => expect(screen.getByText(/^1–10 of 48$/)).toBeTruthy());
  });

  it("is reproducible rather than sticky — a fresh mount fails again", async () => {
    window.history.replaceState({}, "", "/leads?mock-scenario=initial-error");
    const first = render(
      <HeaderStatsProvider>
        <LeadsData />
      </HeaderStatsProvider>,
    );
    await screen.findByRole("alert");
    first.unmount();

    render(
      <HeaderStatsProvider>
        <LeadsData />
      </HeaderStatsProvider>,
    );
    // Not "already used up": the handler is stateless, so the scenario is deterministic.
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});

describe("Service facet popover accessibility", () => {
  it("relates the trigger to the panel and does not claim dialog semantics", async () => {
    await renderLeads();
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-controls="leads-service-facet-panel"]',
    )!;
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // The panel is a group of toggles, not a dialog, so the trigger must not advertise one.
    expect(trigger.getAttribute("aria-haspopup")).toBeNull();

    fireEvent.click(trigger);
    const panel = await screen.findByRole("group", { name: "Service faceted counts" });
    expect(panel.id).toBe("leads-service-facet-panel");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    // Each facet reports its own state; Clear stays reachable and named.
    const facets = within(panel).getAllByRole("button").filter((b) => b.textContent?.trim() !== "Clear");
    expect(facets.length).toBeGreaterThan(0);
    expect(facets.every((b) => b.getAttribute("aria-pressed") === "false")).toBe(true);
    expect(within(panel).getByRole("button", { name: "Clear" })).toBeTruthy();

    fireEvent.click(facets[0]!);
    await waitFor(() => {
      const reopened = document.querySelector('#leads-service-facet-panel [aria-pressed="true"]');
      expect(reopened).toBeTruthy();
    });
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    await renderLeads();
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-controls="leads-service-facet-panel"]',
    )!;
    fireEvent.click(trigger);
    await screen.findByRole("group", { name: "Service faceted counts" });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("group", { name: "Service faceted counts" })).toBeNull(),
    );
    expect(document.activeElement).toBe(trigger);
  });
});
