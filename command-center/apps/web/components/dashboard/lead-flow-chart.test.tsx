// Behavioural tests for the Lead-flow chart. recharts does not lay out an SVG under jsdom
// (ResponsiveContainer measures 0×0), so these cover everything AROUND the plot — states,
// terminology, the accessible summary that carries the period totals, the range selector,
// retry, and refetch-on-mutation. The plot's geometry (non-stacked areas, gradients,
// tooltip, legend) is verified live in the browser; the series labels are asserted here via
// LEAD_FLOW_SERIES and the pure aggregation is covered in lib/dashboard/lead-flow.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { generateLeads } from "../../mocks/fixtures/generate-leads";
import { __resetDemoStateForTests, updateDemoState } from "../../lib/demo/store";
import { LEAD_FLOW_SERIES } from "../../lib/dashboard/lead-flow";

const fetchLeads = vi.fn();
vi.mock("../../lib/data/leads", () => ({
  fetchLeads: (...args: unknown[]) => fetchLeads(...args),
}));

// Imported after the mock is registered.
const { LeadFlowChart } = await import("./lead-flow-chart");

const LEADS = generateLeads();

beforeEach(() => {
  __resetDemoStateForTests();
  fetchLeads.mockReset();
  fetchLeads.mockResolvedValue({ rows: LEADS });
});
afterEach(cleanup);

describe("LeadFlowChart — terminology", () => {
  it("uses CodeOutfitters lead terminology, never the demo's visitor labels", async () => {
    render(<LeadFlowChart />);
    expect(screen.getByText("Lead flow")).toBeTruthy();
    expect(screen.getByText("New and qualified leads over the selected period")).toBeTruthy();
    expect(screen.queryByText(/visitor/i)).toBeNull();
    expect(screen.queryByText(/desktop|mobile/)).toBeNull();
    // Series labels are human, never the internal data keys.
    expect(LEAD_FLOW_SERIES.newLeads.label).toBe("New leads");
    expect(LEAD_FLOW_SERIES.qualifiedLeads.label).toBe("Qualified leads");
    expect(LEAD_FLOW_SERIES.newLeads.colorVar).toBe("var(--chart-1)");
    expect(LEAD_FLOW_SERIES.qualifiedLeads.colorVar).toBe("var(--chart-2)");
    await waitFor(() => expect(fetchLeads).toHaveBeenCalled());
  });
});

describe("LeadFlowChart — states", () => {
  it("shows a loading skeleton before data arrives, then the plot", async () => {
    let resolve: (v: unknown) => void = () => {};
    fetchLeads.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    render(<LeadFlowChart />);
    // Summary announces loading while pending.
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);
    resolve({ rows: LEADS });
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(/new leads and .* qualified leads/i),
    );
  });

  it("renders an empty state when no leads fall in the period", async () => {
    fetchLeads.mockResolvedValue({ rows: [] });
    render(<LeadFlowChart />);
    await waitFor(() => expect(screen.getByText("No leads in this period")).toBeTruthy());
  });

  it("shows a deterministic error state and Retry re-requests the data", async () => {
    fetchLeads.mockRejectedValueOnce(new Error("boom"));
    render(<LeadFlowChart />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByText("Couldn’t load lead flow")).toBeTruthy();

    fetchLeads.mockResolvedValueOnce({ rows: LEADS });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(/new leads and/i),
    );
    // Retry performed an actual second request, not a blank card.
    expect(fetchLeads.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe("LeadFlowChart — accessible summary carries the totals", () => {
  it("states both period totals in text, not only in the chart", async () => {
    render(<LeadFlowChart />);
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(
        /^\d+ new leads and \d+ qualified leads during the last 3 months\.$/,
      ),
    );
  });
});

describe("LeadFlowChart — range selector", () => {
  it("exposes an accessible, always-visible period selector (no hidden class)", () => {
    render(<LeadFlowChart />);
    const trigger = screen.getByLabelText("Select lead-flow period");
    expect(trigger).toBeTruthy();
    expect(trigger.className).not.toMatch(/(^|\s)hidden(\s|$)/);
    // Default range is the widest.
    expect(trigger.textContent).toMatch(/Last 3 months/);
  });

  it("recomputes the summary when the range changes, without refetching", async () => {
    render(<LeadFlowChart />);
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(/last 3 months/i),
    );
    const callsBefore = fetchLeads.mock.calls.length;
    // Open the Radix listbox and pick a different period.
    fireEvent.click(screen.getByLabelText("Select lead-flow period"));
    fireEvent.click(await screen.findByRole("option", { name: "Last 7 days" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(/last 7 days/i),
    );
    // No network round-trip on range change — pure client recompute.
    expect(fetchLeads.mock.calls.length).toBe(callsBefore);
  });
});

describe("LeadFlowChart — reacts to shared-store mutations", () => {
  it("refetches when the demo store changes", async () => {
    render(<LeadFlowChart />);
    await waitFor(() => expect(fetchLeads).toHaveBeenCalledTimes(1));
    updateDemoState((s) => ({ ...s, nextId: s.nextId + 1 }));
    await waitFor(() => expect(fetchLeads.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
