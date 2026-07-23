// Canonical-frame parity for the Leads screen: C-D05 (desktop, Command Center Final.dc.html
// 142-195), T-02 (885-913), MO-02 (1068-1087).
//
// jsdom loads no stylesheets, so every breakpoint's markup is in the DOM at once. These tests
// therefore evaluate Tailwind's display utilities themselves (`displayAt`) rather than asking
// jsdom what is visible — which is also the only way to assert that ONE toolbar DOM order
// yields the desktop order AND the tablet order, the claim the implementation rests on.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { setupServer } from "msw/node";
import { LeadSchema, LEAD_STATUS_LABELS } from "@command-center/contracts";
import { handlers } from "../../../mocks/handlers";
import { LEAD_DATASET } from "../../../mocks/handlers/leads";
import {
  AWAITING_FIRST_CONTACT_COUNT,
  NEW_THIS_WEEK_COUNT,
  TOTAL_LEAD_COUNT,
} from "../../../mocks/fixtures/generate-leads";
import { HeaderStatsProvider } from "../header-stats";
import { ShellHeaderBar } from "../shell-nav";
import { LeadsData } from "./leads-data";

vi.mock("next/navigation", () => ({ usePathname: () => "/leads" }));

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.unstubAllEnvs();
  window.history.replaceState({}, "", "/leads");
});
afterAll(() => server.close());

type Width = "mobile" | "tablet" | "desktop";

// A minimal Tailwind display cascade: base, then md:, then xl:. Enough for the four utilities
// this screen uses to gate chrome per frame (`hidden`, `md:hidden`, `md:block`/`md:flex`,
// `xl:hidden`, `xl:inline`).
const SHOWN = /^(block|inline|inline-block|flex|grid)$/;
function displayAt(el: Element, width: Width): boolean {
  const tokens = el.className.toString().split(/\s+/);
  let visible = !tokens.includes("hidden");
  if (width === "mobile") return visible;
  if (tokens.includes("md:hidden")) visible = false;
  else if (tokens.some((t) => t.startsWith("md:") && SHOWN.test(t.slice(3)))) visible = true;
  if (width === "tablet") return visible;
  if (tokens.includes("xl:hidden")) visible = false;
  else if (tokens.some((t) => t.startsWith("xl:") && SHOWN.test(t.slice(3)))) visible = true;
  return visible;
}

async function renderCanonical() {
  vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
  window.history.replaceState({}, "", "/leads?visual-state=canonical");
  render(
    <HeaderStatsProvider>
      <ShellHeaderBar />
      <LeadsData />
    </HeaderStatsProvider>,
  );
  await screen.findAllByText(LEAD_DATASET[0]!.name);
}

// Two pieces of the staged frame are gated on a real media query rather than on a Tailwind
// utility — the desktop search placeholder and the staged facet popover — and the setup stub
// reports every query as unmatched. This runs a body with the query matched, so those two can
// be asserted at the width the canonical frame is drawn at.
async function atDesktop<T>(body: () => Promise<T>): Promise<T> {
  const real = window.matchMedia;
  window.matchMedia = ((q: string) => ({ ...real(q), matches: true })) as typeof window.matchMedia;
  try {
    return await body();
  } finally {
    window.matchMedia = real;
  }
}

// The toolbar is the search field's grandparent; no test-only attribute is added for this.
function toolbar(): HTMLElement {
  return screen.getByLabelText("Search leads").closest("label")!.parentElement!;
}

// Direct children of the toolbar, in DOM order, reduced to a stable label. The results count
// and the facet popover are excluded: neither is a filter control, and the count is `ml-auto`
// pinned to the far end at every width.
function toolbarOrder(width: Width): string[] {
  return [...toolbar().children]
    .filter((el) => displayAt(el, width))
    .map((el) => {
      if (el.querySelector('input[type="search"]')) return "Search";
      if (el.getAttribute("role") === "dialog") return "";
      if (el.className.toString().includes("ml-auto")) return "";
      // The filter selects sit inside a positioning wrapper that carries the caret glyph and
      // the responsive visibility classes, so the toolbar child is the wrapper and the label
      // is one level down.
      const aria = el.getAttribute("aria-label") ?? el.querySelector("select")?.getAttribute("aria-label");
      if (aria === "Filter by status") return "Status";
      if (aria === "Filter by owner") return "Owner";
      if (aria === "Sort leads") return "Sort";
      return (el.textContent ?? "").trim();
    })
    .filter(Boolean);
}

describe("C-D05 header subtitle", () => {
  // CANON 143. Every figure is an aggregate the API computed over the matched set; the header
  // renders what it was handed. Asserted against counts taken from the dataset here, so a
  // literal in the component or in the handler fails this test.
  it("derives all three figures from the dataset", async () => {
    await renderCanonical();
    const expected = `${TOTAL_LEAD_COUNT} total · ${NEW_THIS_WEEK_COUNT} new this week · ${AWAITING_FIRST_CONTACT_COUNT} awaiting first contact`;
    const subtitle = await screen.findByText(expected);
    expect(subtitle.textContent).toBe("128 total · 12 new this week · 9 awaiting first contact");
    // T-02 888 is a bare "Leads": the second line is desktop-only.
    expect(displayAt(subtitle, "tablet")).toBe(false);
    expect(displayAt(subtitle, "desktop")).toBe(true);
  });

  it("narrows with the query instead of restating a canonical literal", async () => {
    await renderCanonical();
    await screen.findByText(/128 total/);
    const expected = LEAD_DATASET.filter((r) => r.status === "Contacted").length;
    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "Contacted" } });
    // "Contacted" is by definition contacted, so the awaiting figure must fall to zero.
    await waitFor(() => expect(screen.getByText(new RegExp(`^${expected} total`))).toBeTruthy());
    expect(screen.getByText(/awaiting first contact$/).textContent).toContain("0 awaiting");
  });
});

describe("toolbar order, one DOM for three frames", () => {
  // CANON 148-153.
  it("is Search, Status, Service · 2, Owner, Source, Appointment, Created · Last 30d at desktop", async () => {
    await renderCanonical();
    expect(toolbarOrder("desktop")).toEqual([
      "Search",
      "Status",
      "Service · 2 ▾",
      "Owner",
      "Source ▾",
      "Appointment ▾",
      "Created · Last 30d ▾",
    ]);
  });

  // T-02 890-892: Status, Source, Appointment and Created are all dropped, and Service still
  // precedes Owner. Derived from the same children as the desktop assertion above.
  it("is Search, Service · 2, Owner at tablet", async () => {
    await renderCanonical();
    expect(toolbarOrder("tablet")).toEqual(["Search", "Service · 2 ▾", "Owner"]);
  });

  // MO-02 1071-1074: Search / Filters · 2 / Sort, and no Status control in the bar.
  it("is Search, Filters · 2, Sort at mobile", async () => {
    await renderCanonical();
    expect(toolbarOrder("mobile")).toEqual(["Search", "Filters · 2", "Sort"]);
  });

  // CANON 153 spells the trigger with the range already applied. That is the visual-QA state,
  // not the default view, which has no range selected.
  it("applies the Created range only in the staged state", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
    render(<LeadsData />);
    await screen.findAllByText(LEAD_DATASET[0]!.name);
    expect(toolbarOrder("desktop")).toContain("Created ▾");
    expect(toolbarOrder("desktop")).not.toContain("Created · Last 30d ▾");
  });
});

describe("service facet popover", () => {
  // CANON 156-158. PRESENTATION_TEST_STATE_REFERENCE_DATA: the exact three rows the canonical
  // frame prints, and only those three.
  it("shows exactly the three canonical reference rows in the staged state", async () => {
    await atDesktop(async () => {
      await renderCanonical();
      const popover = await screen.findByRole("group", { name: "Service faceted counts" });
      const rows = within(popover)
        .getAllByRole("button")
        .map((b) => (b.textContent ?? "").trim())
        .filter((t) => t !== "Clear");
      expect(rows).toEqual(["AI Automation21", "Workflow Automation17", "Web Applications14"]);
    });
  });

  it("is a service facet, not a status facet", async () => {
    await atDesktop(async () => {
      await renderCanonical();
      const popover = await screen.findByRole("group", { name: "Service faceted counts" });
      for (const label of Object.values(LEAD_STATUS_LABELS)) {
        expect(within(popover).queryByText(label)).toBeNull();
      }
    });
  });

  // CANON 154-160 opens this on C-D05 only; T-02 891 shows the trigger active with no popover.
  // The staged panel is therefore not mounted below xl, so the trigger cannot advertise
  // `aria-expanded="true"` while pointing at a dialog that is not there.
  it("is not staged below xl, and the trigger says so", async () => {
    await renderCanonical();
    expect(screen.queryByRole("group", { name: "Service faceted counts" })).toBeNull();
    const trigger = document.querySelector('button[aria-haspopup="dialog"]')!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  // Normal mode keeps deriving the popover from the server's facet counts over the matched
  // set — the staged reference data never replaces it.
  it("falls back to the server's derived facets outside the staged state", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
    render(<LeadsData />);
    await screen.findAllByText(LEAD_DATASET[0]!.name);
    // By the popover relationship, not by name: "Service" is also a sortable column header.
    fireEvent.click(document.querySelector('button[aria-controls="leads-service-facet-panel"]')!);
    const popover = await screen.findByRole("group", { name: "Service faceted counts" });
    const rows = within(popover)
      .getAllByRole("button")
      .map((b) => (b.textContent ?? "").trim())
      .filter((t) => t !== "Clear");
    // The generated dataset carries seven services, so the canonical three cannot be what
    // this renders — and every figure matches a real count.
    expect(rows.length).toBe(7);
    for (const [service, count] of Object.entries(
      LEAD_DATASET.reduce<Record<string, number>>((acc, r) => {
        if (r.serviceInterest) acc[r.serviceInterest] = (acc[r.serviceInterest] ?? 0) + 1;
        return acc;
      }, {}),
    )) {
      expect(rows).toContain(`${service}${count}`);
    }
  });
});

describe("bulk action bar", () => {
  function bulkBar(): HTMLElement {
    return screen.getByText("2 selected").parentElement!;
  }
  function actionsAt(width: Width): string[] {
    return [...bulkBar().children]
      .filter((el) => displayAt(el, width))
      .map((el) => (el.textContent ?? "").trim())
      .filter(Boolean);
  }

  // CANON 169-172.
  it("carries the four desktop actions with a separator after the count", async () => {
    await renderCanonical();
    expect(actionsAt("desktop")).toEqual([
      "2 selected",
      "Assign",
      "Change status",
      "Schedule follow-up",
      "Export",
      "Clear",
    ]);
    const separator = [...bulkBar().children].find((el) => (el.textContent ?? "") === "");
    expect(separator).toBeTruthy();
    expect(displayAt(separator!, "desktop")).toBe(true);
  });

  // T-02 896, read from the tablet frame itself: three shortened labels, no Export, and no
  // separator element. Not the desktop bar restyled.
  it("carries the three shortened tablet actions and no separator", async () => {
    await renderCanonical();
    expect(actionsAt("tablet")).toEqual(["2 selected", "Assign", "Status", "Follow-up", "Clear"]);
    const separator = [...bulkBar().children].find((el) => (el.textContent ?? "") === "");
    expect(displayAt(separator!, "tablet")).toBe(false);
  });

  // MO-02 has no bulk bar at all.
  it("is absent at mobile", async () => {
    await renderCanonical();
    expect(displayAt(bulkBar(), "mobile")).toBe(false);
  });
});

describe("mobile toolbar", () => {
  // MO-02 1071. The visible placeholder is the short canonical form; the accessible name stays
  // descriptive. The failure this pins is a truncated long placeholder ("Search name, email,
  // con…"), which is what a single desktop string produces in a 390px field.
  it("shows the short placeholder below xl and keeps the descriptive accessible name", async () => {
    await renderCanonical();
    const input = screen.getByLabelText("Search leads") as HTMLInputElement;
    expect(input.placeholder).toBe("Search…");
    expect(input.placeholder).not.toContain("Search name, email, con");
    expect(input.getAttribute("aria-label")).toBe("Search leads");
  });

  it("shows the full placeholder at desktop", async () => {
    const real = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...real(q), matches: true })) as typeof window.matchMedia;
    try {
      await renderCanonical();
      expect((screen.getByLabelText("Search leads") as HTMLInputElement).placeholder).toBe(
        "Search name, email, company…",
      );
    } finally {
      window.matchMedia = real;
    }
  });

  // MO-02 1073. The chip is a real disclosure, not decoration: status and owner filtering is
  // still reachable at mobile even though the Status pill is desktop-only.
  it("keeps Filters · 2 interactive", async () => {
    await renderCanonical();
    const trigger = screen.getByRole("button", { name: "Filters · 2" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    // Two of each now: the desktop pills plus the ones inside the disclosure.
    expect(screen.getAllByLabelText("Filter by status")).toHaveLength(2);
    expect(screen.getAllByLabelText("Filter by owner")).toHaveLength(2);
  });
});

describe("T-02 pager", () => {
  // The literal the staged mobile state prints (MO-02 1086); duplicated here rather than
  // exported, so a change in the component fails this test instead of silently tracking it.
  const CANONICAL_LOAD_MORE_TEXT = "Load 10 more · 118 remaining";
  // T-02 908: "‹ 1 2 3 … 13 ›" in IBM Plex Mono. C-D05 195 keeps the words. One DOM, two
  // presentations, chosen by width — the same rule the toolbar follows.
  function visibleSpans(button: HTMLElement, width: Width): string[] {
    return [...button.querySelectorAll("span")]
      .filter((s) => displayAt(s, width))
      .map((s) => (s.textContent ?? "").trim())
      .filter(Boolean);
  }

  it("renders chevrons at tablet and words at desktop", async () => {
    await renderCanonical();
    const prev = screen.getByRole("button", { name: "Previous page" });
    const next = screen.getByRole("button", { name: /Next$/ });

    expect(visibleSpans(prev, "tablet")).toEqual(["‹"]);
    expect(visibleSpans(next, "tablet")).toEqual(["›"]);
    expect(visibleSpans(prev, "desktop")).toEqual(["Prev"]);
    expect(visibleSpans(next, "desktop")).toEqual(["Next"]);
    // MO-02 1086 is untouched: below md the control is the load-more button.
    expect(visibleSpans(next, "mobile")).toEqual([CANONICAL_LOAD_MORE_TEXT]);
  });

  it("uses U+2039 and U+203A, and hides both glyphs from assistive technology", async () => {
    await renderCanonical();
    const prev = screen.getByRole("button", { name: "Previous page" });
    const next = screen.getByRole("button", { name: /Next$/ });
    const chevrons = [
      [...prev.querySelectorAll("span")].find((s) => s.textContent?.trim() === "‹")!,
      [...next.querySelectorAll("span")].find((s) => s.textContent?.trim() === "›")!,
    ];
    for (const glyph of chevrons) {
      expect(glyph).toBeTruthy();
      expect(glyph.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("keeps the pager accessible names at md and up", async () => {
    await atDesktop(async () => {
      await renderCanonical();
      expect(screen.getByRole("button", { name: "Previous page" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Next page" })).toBeTruthy();
    });
  });

  it("leaves the mobile control named by its own copy", async () => {
    // matchMedia is unmatched here, which is the mobile branch: no aria-label, so the
    // accessible name is the visible load-more text rather than "Next page".
    await renderCanonical();
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
    const next = screen.getByRole("button", { name: /Next$/ });
    expect(next.getAttribute("aria-label")).toBeNull();
    expect(next.textContent).toContain(CANONICAL_LOAD_MORE_TEXT);
  });

  // The glyph run is 86px wide in T-02 908 with 6-9px of clear space between items (mean 7.3).
  // Inheriting the 5px mobile gap made it 107px and was the last failing tablet difference.
  // jsdom computes no layout, so the measured result is pinned as the class contract that
  // produced it: 1px gap + the items' own md:px-[3px] on each side lands on 7px. Desktop and
  // mobile are accepted frames, so both keep their own value.
  it("spaces the tablet pager to the measured canonical gap", async () => {
    await renderCanonical();
    const pager = screen.getByRole("button", { name: "Go to page 1" }).parentElement!;
    const tokens = pager.className.split(/\s+/);
    expect(tokens).toContain("gap-[5px]");
    expect(tokens).toContain("md:gap-px");
    expect(tokens).toContain("xl:gap-[5px]");
  });

  it("keeps page-number semantics and disabled edges", async () => {
    await renderCanonical();
    const prev = screen.getByRole("button", { name: "Previous page" });
    expect((prev as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Go to page 13" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to page 1" }).getAttribute("aria-current")).toBe("page");
  });
});

describe("duplicate warning", () => {
  // MO-02 1076. Deterministic mock/test presentation metadata. No contract field carries
  // duplicate detection and none is added for visual parity.
  it("adds no duplicate-detection field to the Lead contract", () => {
    for (const key of Object.keys(LeadSchema.shape)) {
      expect(key).not.toMatch(/duplicate/i);
    }
  });

  it("renders only in the staged mobile state", async () => {
    await renderCanonical();
    const banner = screen.getByText("Possible duplicate — matching phone on LD-4820");
    expect(displayAt(banner.parentElement!, "mobile")).toBe(true);
    expect(displayAt(banner.parentElement!, "tablet")).toBe(false);

    cleanup();
    vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
    window.history.replaceState({}, "", "/leads");
    render(<LeadsData />);
    await screen.findAllByText(LEAD_DATASET[0]!.name);
    expect(screen.queryByText(/Possible duplicate/)).toBeNull();
  });
});
