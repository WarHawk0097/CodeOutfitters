// Header controls on the Leads route: the implemented Export CSV button and the deferred
// Columns control.
//
// The rule this enforces: no control may look enabled and do nothing. Export CSV is
// implemented, so it must actually export; Columns is Phase 4, so it must carry real
// disabled semantics rather than being a silent no-op.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { HeaderStatsProvider } from "./header-stats";
import { ShellHeaderBar } from "./shell-nav";
import { LeadsData } from "./leads/leads-data";

vi.mock("next/navigation", () => ({ usePathname: () => "/leads" }));

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

// jsdom implements neither, and both are the download path rather than the data path.
const downloads: { filename: string }[] = [];
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
  downloads.length = 0;
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ filename: this.download });
  });
});

// The header reads the query the Leads island publishes, so both are rendered — that bridge
// is the thing under test as much as the button is.
async function renderHeaderWithLeads() {
  render(
    <HeaderStatsProvider>
      <ShellHeaderBar />
      <LeadsData />
    </HeaderStatsProvider>,
  );
  await screen.findByText(/of \d+$/);
}

function exportButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "Export CSV" }) as HTMLButtonElement;
}

describe("Export CSV header control", () => {
  it("is a real button, not a presentation span", async () => {
    await renderHeaderWithLeads();
    const button = exportButton();
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("aria-disabled")).toBe("false");
  });

  it("exports the whole filtered result set and names the file deterministically", async () => {
    await renderHeaderWithLeads();
    fireEvent.click(exportButton());
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0]!.filename).toBe("leads-export-128-rows.csv");
    // Announced through the live region, not only through the download.
    await screen.findByText("Exported 128 leads to leads-export-128-rows.csv");
  });

  it("follows the active filter rather than the visible page", async () => {
    await renderHeaderWithLeads();
    fireEvent.change(screen.getAllByLabelText("Filter by owner")[0]!, { target: { value: "user-001" } });
    await screen.findByText(/^1–10 of 48$/);

    fireEvent.click(exportButton());
    await waitFor(() => expect(downloads).toHaveLength(1));
    // 48 matching rows, not the 10 on screen and not all 128.
    expect(downloads[0]!.filename).toBe("leads-export-48-rows.csv");
  });

  it("cannot start a second download while one is preparing", async () => {
    await renderHeaderWithLeads();
    const button = exportButton();
    // The claim is about SIMULTANEOUS downloads, so the export has to still be in flight
    // when the later clicks land. Without added latency an export finishes between clicks
    // and three clicks legitimately produce three files — which is what the browser run
    // showed and is not a defect.
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (...args: Parameters<typeof fetch>) => {
      await new Promise((r) => setTimeout(r, 80));
      return realFetch(...args);
    });
    // Clicks spaced far enough apart that React has re-rendered and rebound the handler in
    // between: a guard held in state rather than a ref reads a stale `false` here.
    fireEvent.click(button);
    await new Promise((r) => setTimeout(r, 10));
    fireEvent.click(button);
    await new Promise((r) => setTimeout(r, 10));
    fireEvent.click(button);
    // Settle first, then count — `waitFor(length === 1)` resolves the instant the first
    // download lands and would never observe a second one.
    await waitFor(() => expect(button.getAttribute("aria-disabled")).toBe("false"), { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 100));
    expect(downloads).toHaveLength(1);
  });

  it("announces a failure instead of failing silently", async () => {
    await renderHeaderWithLeads();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    fireEvent.click(exportButton());
    await screen.findByText("Export failed: network down");
    expect(downloads).toHaveLength(0);
  });
});

describe("deferred header controls", () => {
  it("gives Columns real disabled semantics and no keyboard activation", async () => {
    await renderHeaderWithLeads();
    const columns = screen.getByRole("button", { name: "Columns ▾" });
    expect(columns.getAttribute("aria-disabled")).toBe("true");
    expect(columns.getAttribute("tabindex")).toBe("-1");
    // An explanation, so it is not a control that is merely dead.
    expect(columns.getAttribute("title")).toContain("later implementation phase");
  });

  it("has no href=\"#\" anywhere in the header", async () => {
    await renderHeaderWithLeads();
    expect(document.querySelectorAll('a[href="#"]')).toHaveLength(0);
  });
});
