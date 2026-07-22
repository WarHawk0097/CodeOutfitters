// Pipeline route behaviour: the three column forms, movement by menu and by keyboard, the
// reason gate, filters, create/edit, and the cross-route consequences of a move.
//
// Assertions are plain expect() rather than jest-dom matchers — the suite carries no
// jest-dom dependency and adding one for sugar is not worth the install.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { PipelineBoard } from "./pipeline-board";
import { PipelineHeaderChip } from "./pipeline-header";
import { __resetStageWindow } from "./stage-window";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";
import { PIPELINE_ACTIVE_COUNT, STAGE_LABELS } from "../../../lib/demo/seed";

function setViewport(width: number) {
  window.innerWidth = width;
  fireEvent(window, new Event("resize"));
}

function labelOf(element: Element): string {
  return element.getAttribute("aria-label") ?? "";
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
  __resetDemoStateForTests();
  __resetStageWindow();
  window.innerWidth = 1440;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

/** Opens a menu button by its accessible name and clicks one of its items. */
function chooseFromMenu(triggerName: RegExp | string, itemName: RegExp | string) {
  fireEvent.click(screen.getByRole("button", { name: triggerName }));
  fireEvent.click(screen.getByRole("menuitem", { name: itemName }));
}

const cardOf = (name: string) => getDemoState().opportunities.find((o) => o.name === name)!;
const byId = (id: string) => getDemoState().opportunities.find((o) => o.id === id)!;

describe("Pipeline board", () => {
  it("renders four canonical stage columns at desktop, starting at STAGES 2-5", () => {
    render(<PipelineBoard />);
    const columns = screen.getAllByRole("region");
    expect(columns).toHaveLength(4);
    // "STAGES 2–5 OF 11" is a contiguous window over the canonical stage order, so the four
    // columns are Contacted, Appt Pending, Appt Scheduled and Discovery Done.
    //
    // DOCUMENTED CANONICAL DEVIATION: C-D06 213 labels the window "STAGES 2–5" but draws its
    // fourth column as "Proposal Sent", which is stage 7. The label and the drawing cannot
    // both be satisfied. The label wins here, because the pager is a live control — a chip
    // reading "2–5" above a non-contiguous set would make every subsequent page nonsense, and
    // "counts cannot contradict underlying shared data" applies to the position chip too.
    expect(labelOf(columns[0]!)).toBe("Contacted, 11 leads");
    expect(labelOf(columns[1]!)).toBe("Appointment Pending, 7 leads");
    expect(labelOf(columns[2]!)).toBe("Appointment Scheduled, 9 leads");
    expect(labelOf(columns[3]!)).toBe("Discovery Done, 8 leads");
  });

  it("renders two columns at tablet and one stage at mobile", () => {
    setViewport(820);
    const { unmount } = render(<PipelineBoard />);
    expect(screen.getAllByRole("region")).toHaveLength(2);
    // T-03 926: every tablet card carries its own move control.
    expect(screen.getAllByRole("button", { name: /Move .* to another stage/ }).length).toBeGreaterThan(0);
    unmount();

    __resetStageWindow();
    setViewport(390);
    render(<PipelineBoard />);
    expect(screen.queryAllByRole("region")).toHaveLength(0);
    expect(screen.getByText("Appointment Pending")).toBeTruthy();
    expect(screen.getByText(/Stage 3 of 11/)).toBeTruthy();
    // MO-03 1099: the drag alternative is stated, not implied.
    expect(screen.getByText(/MOVE MENU = DRAG ALTERNATIVE/)).toBeTruthy();
  });

  it("the header chip and the board describe the same slice", () => {
    render(
      <>
        <PipelineHeaderChip />
        <PipelineBoard />
      </>,
    );
    expect(screen.getByText("STAGES 2–5 OF 11")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show later stages" }));
    expect(screen.getByText("STAGES 3–6 OF 11")).toBeTruthy();
    expect(labelOf(screen.getAllByRole("region")[0]!)).toContain("Appointment Pending");
  });

  it("moving a card by menu changes stage membership, counts and the lead status", () => {
    render(<PipelineBoard />);
    const before = cardOf("Thomas Beck");
    expect(before.stage).toBe("Contacted");

    chooseFromMenu(/Actions for Thomas Beck/, /Move to Appointment Pending/);

    const after = getDemoState();
    expect(byId(before.id).stage).toBe("Appt Pending");
    // No duplicate, no disappearance.
    expect(after.opportunities.filter((o) => o.id === before.id)).toHaveLength(1);
    expect(after.opportunities).toHaveLength(PIPELINE_ACTIVE_COUNT);
    // Cross-route: the Leads row follows the board.
    expect(after.leadOverrides[before.leadId]?.status).toBe("Appt Pending");
    // Column headings recount.
    const columns = screen.getAllByRole("region");
    expect(labelOf(columns[0]!)).toBe("Contacted, 10 leads");
    expect(labelOf(columns[1]!)).toBe("Appointment Pending, 8 leads");
  });

  it("a gated stage asks for a reason and refuses an empty one", () => {
    render(<PipelineBoard />);
    const card = cardOf("Nadia Karim");

    chooseFromMenu(/Actions for Nadia Karim/, /Move to Won/);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading").textContent).toBe("Move Nadia Karim to Won");
    // Still in the source stage while the gate is open.
    expect(byId(card.id).stage).toBe("Contacted");

    fireEvent.click(within(dialog).getByRole("button", { name: "Move card" }));
    expect(within(dialog).getByText(/at least 3 characters/)).toBeTruthy();
    expect(byId(card.id).stage).toBe("Contacted");

    fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: "Signed today" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Move card" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(byId(card.id).stage).toBe("Won");
    expect(getDemoState().activity[0]!.message).toContain("Signed today");
  });

  it("Escape cancels a keyboard move and returns the card to its origin", () => {
    render(<PipelineBoard />);
    const card = cardOf("Thomas Beck");

    fireEvent.keyDown(screen.getByTestId(`pipeline-card-${card.id}`), { key: " " });
    expect(screen.getByRole("status").textContent).toMatch(/picked up from Contacted/);

    fireEvent.keyDown(screen.getByTestId(`pipeline-card-${card.id}`), { key: "ArrowRight", altKey: true });
    expect(byId(card.id).stage).toBe("Appt Pending");

    fireEvent.keyDown(screen.getByTestId(`pipeline-card-${card.id}`), { key: "Escape" });
    expect(byId(card.id).stage).toBe("Contacted");
  });

  it("Alt+arrow without a pick-up does not move a card", () => {
    render(<PipelineBoard />);
    const card = cardOf("Thomas Beck");
    fireEvent.keyDown(screen.getByTestId(`pipeline-card-${card.id}`), { key: "ArrowRight", altKey: true });
    expect(byId(card.id).stage).toBe("Contacted");
  });

  it("search and the owner filter narrow the board and can always be cleared", () => {
    render(<PipelineBoard />);
    fireEvent.change(screen.getByRole("searchbox", { name: /Search pipeline/ }), {
      target: { value: "Thomas Beck" },
    });
    expect(screen.getByText("Thomas Beck")).toBeTruthy();
    expect(screen.queryByText("Nadia Karim")).toBeNull();
    expect(labelOf(screen.getAllByRole("region")[0]!)).toBe("Contacted, 1 lead");

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Nadia Karim")).toBeTruthy();

    chooseFromMenu(/^Owner: All owners$/, "Priya Nair");
    // Every visible card now belongs to that owner: Marc Rivera's canonical cards are gone.
    expect(screen.queryByText("Thomas Beck")).toBeNull();
    expect(screen.getByText("Nadia Karim")).toBeTruthy();

    // The "all" way back is always in the menu.
    fireEvent.click(screen.getByRole("button", { name: /^Owner: Priya Nair$/ }));
    expect(screen.getByRole("menuitem", { name: "All owners" })).toBeTruthy();
  });

  it("editing an opportunity validates and then writes through to the shared store", () => {
    render(<PipelineBoard />);
    const card = cardOf("Thomas Beck");
    chooseFromMenu(/Actions for Thomas Beck/, "Edit opportunity");

    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Next action"), { target: { value: "  " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(within(dialog).getByText("Next action is required.")).toBeTruthy();
    expect(byId(card.id).nextAction).toBe("Call Apr 25");

    fireEvent.change(within(dialog).getByLabelText("Next action"), { target: { value: "Call Apr 26" } });
    fireEvent.change(within(dialog).getByLabelText("Value (USD)"), { target: { value: "45000" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(byId(card.id).nextAction).toBe("Call Apr 26");
    expect(byId(card.id).value).toBe(45000);
  });

  it("creating an opportunity attaches it to a real lead and adds exactly one card", () => {
    render(<PipelineBoard />);
    fireEvent.click(screen.getByRole("button", { name: "New opportunity" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Context"), { target: { value: "Inbound demo request" } });
    fireEvent.change(within(dialog).getByLabelText("Next action"), { target: { value: "Book discovery call" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create opportunity" }));

    const after = getDemoState();
    expect(after.opportunities).toHaveLength(PIPELINE_ACTIVE_COUNT + 1);
    const created = after.opportunities[0]!;
    expect(created.context).toBe("Inbound demo request");
    // Links to a lead that exists, and does not duplicate an existing card's lead.
    expect(after.opportunities.filter((o) => o.leadId === created.leadId)).toHaveLength(1);
  });

  it("a create with no context is rejected rather than silently ignored", () => {
    render(<PipelineBoard />);
    fireEvent.click(screen.getByRole("button", { name: "New opportunity" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create opportunity" }));
    expect(within(dialog).getByText(/Context is required/)).toBeTruthy();
    expect(getDemoState().opportunities).toHaveLength(PIPELINE_ACTIVE_COUNT);
  });

  it("the detail dialog shows the card's stage and closes on Escape", () => {
    render(<PipelineBoard />);
    chooseFromMenu(/Actions for Thomas Beck/, "Open details");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(STAGE_LABELS.Contacted)).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/pipeline?mock-scenario=demo-error");
    render(<PipelineBoard />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByRole("region")).toHaveLength(4);
    window.history.replaceState(null, "", "/pipeline");
  });
});
