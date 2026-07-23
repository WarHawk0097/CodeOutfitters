// C-D01 Overview reconstruction check (Phase 3 Step 4). jsdom has no CSS
// breakpoints, so all three frame compositions render at once; they are told
// apart by the elements that exist in only one of them.
//
// This is a structure check, not a parity check: a green run here does not
// prove visual parity. The canonical-versus-implementation screenshot
// comparison under work/evidence/phase-3-canonical-reconstruction is what
// carries that, and it is reviewed by a human.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";
import { OVERVIEW_KPIS } from "../../../mocks/fixtures/overview-canonical";

describe("C-D01 Overview", () => {
  it("shows the canonical KPI figures, not dataset-derived counts", () => {
    render(<DashboardPage />);

    // CANON 1325-1329. Desktop and tablet carry all four; mobile carries the
    // first and last only (CANON 1048-1050) — hence 3 vs 2 occurrences.
    expect(screen.getAllByText("NEW LEADS")).toHaveLength(3);
    expect(screen.getAllByText("AWAITING CONTACT")).toHaveLength(2);
    expect(screen.getAllByText("OVERDUE FOLLOW-UPS")).toHaveLength(1); // desktop label
    // 5 = the abbreviated KPI label at tablet (CANON 864) and mobile (CANON 1050),
    // plus the "OVERDUE" work-queue tag (CANON 1330) once per frame.
    expect(screen.getAllByText("OVERDUE")).toHaveLength(5);

    for (const value of ["34", "9", "7", "4"]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }

    // The superseded generic strip is gone; it summed the mock handler's facets.
    expect(screen.queryByText("Total Leads")).toBeNull();
  });

  it("replaces the static plot with the interactive store-derived Lead-flow chart", () => {
    const { container } = render(<DashboardPage />);

    // The former canonical 1090x212 plot and its mobile summary line are gone.
    expect(container.querySelectorAll('svg[viewBox="0 0 1090 212"]')).toHaveLength(0);
    expect(screen.queryByText(/35% recv→won/)).toBeNull();

    // The new chart card renders in all three breakpoint slots (desktop, tablet, mobile),
    // each with the adapted CodeOutfitters terminology — not the demo's visitor labels.
    expect(screen.getAllByText("Lead flow")).toHaveLength(3);
    expect(
      screen.getAllByText("New and qualified leads over the selected period"),
    ).toHaveLength(3);
    expect(screen.queryByText(/[Vv]isitor/)).toBeNull();

    // Accessible range selector with the required label, not the supplied "Select a value".
    expect(screen.getAllByLabelText("Select lead-flow period")).toHaveLength(3);
    expect(screen.queryByLabelText("Select a value")).toBeNull();
  });

  it("composes each frame with the regions canonical puts in it", () => {
    render(<DashboardPage />);

    // Today's work exists at all three widths, but only desktop gives rows a CTA
    // button (CANON 58 vs 868 / 1046).
    expect(screen.getAllByText("Call Ruben Ortega — first contact")).toHaveLength(3);
    expect(screen.getAllByText("Prepare")).toHaveLength(1);

    // Meetings & proposals: desktop + mobile (CANON 69 / 1053), absent at tablet.
    expect(screen.getAllByText("2 meetings need review")).toHaveLength(2);

    // Recent activity is desktop-only and canonical lists five rows (CANON 1335-1340).
    expect(screen.getAllByText(/^Priya moved Derrick Vaughn to Negotiation$/)).toHaveLength(1);

    // Pipeline Journey: rail list, tablet cards, mobile bottleneck sentence.
    expect(screen.getByText(/86 active · 6 phases · all 11 statuses inside/)).toBeTruthy();
    expect(screen.getByText(/TAP A PHASE FOR EXACT STATUSES/)).toBeTruthy();
    expect(screen.getByText(/Appointment — 3 waiting > 48h/)).toBeTruthy();
  });

  it("keeps the mobile page title in the body", () => {
    render(<DashboardPage />);
    // MO-01 1043 — the header carries the brand mark at this width instead.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Overview");
    expect(OVERVIEW_KPIS).toHaveLength(4);
  });
});
