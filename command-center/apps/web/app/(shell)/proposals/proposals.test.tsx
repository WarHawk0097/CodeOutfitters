// Proposals route behaviour: the directory, its search and three filters, every state
// transition and the create/edit/duplicate/archive mutations — with the cross-route
// consequence that accepting or declining a proposal moves the linked opportunity and lead.
//
// Plain expect() only; the suite carries no jest-dom dependency.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ProposalsScreen, validateProposalDraft } from "./proposals-view";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";

const proposals = () => getDemoState().proposals;
const byId = (id: string) => proposals().find((p) => p.id === id)!;

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

describe("validateProposalDraft", () => {
  it("requires a client, a lead name, a service and a non-negative value", () => {
    expect(
      validateProposalDraft({ client: "", leadName: "", service: "", value: "-1", ownerId: "user-001", version: "v1", source: "Lead" }),
    ).toEqual({
      client: "Client is required.",
      leadName: "Lead name is required.",
      service: "Service is required.",
      value: "Enter a value of 0 or more.",
    });
    expect(
      validateProposalDraft({ client: "A", leadName: "B", service: "C", value: "0", ownerId: "user-001", version: "v1", source: "Lead" }),
    ).toEqual({});
  });
});

describe("directory", () => {
  it("lists every seeded proposal with the derived count and total value", () => {
    render(<ProposalsScreen />);
    expect(screen.getByTestId("proposal-row-PRO-2034")).toBeTruthy();
    expect(screen.getByTestId("proposal-row-PRO-2019")).toBeTruthy();
    // 5 of 5, pipeline value = 86400+42750+58200+34900+112000.
    expect(screen.getByText("5 OF 5")).toBeTruthy();
    expect(screen.getByText(/\$334,250/)).toBeTruthy();
  });

  it("filters by search, owner, status and value bucket", () => {
    render(<ProposalsScreen />);
    // Search by client.
    fillField("Search proposals by id, client, lead or service", "Titan");
    expect(screen.getByTestId("proposal-row-PRO-2019")).toBeTruthy();
    expect(screen.queryByTestId("proposal-row-PRO-2034")).toBeNull();
    fillField("Search proposals by id, client, lead or service", "");

    // Owner filter — Priya Nair (user-001) owns PRO-2031 and PRO-2019.
    chooseFromMenu("Owner: All owners", "Priya Nair");
    expect(screen.getByText("2 OF 5")).toBeTruthy();
    expect(screen.getByTestId("proposal-row-PRO-2031")).toBeTruthy();
    expect(screen.queryByTestId("proposal-row-PRO-2034")).toBeNull();
    chooseFromMenu(/^Owner: /, "All owners");

    // Status filter.
    chooseFromMenu("Status: Any status", "DRAFT");
    expect(screen.getByText("1 OF 5")).toBeTruthy();
    expect(screen.getByTestId("proposal-row-PRO-2034")).toBeTruthy();
    chooseFromMenu(/^Status: /, "Any status");

    // Value bucket — over $100k is only PRO-2019.
    chooseFromMenu("Value: Any value", "Over $100k");
    expect(screen.getByText("1 OF 5")).toBeTruthy();
    expect(screen.getByTestId("proposal-row-PRO-2019")).toBeTruthy();
  });
});

describe("state transitions", () => {
  it("marks a proposal accepted and moves the linked opportunity to Won", () => {
    // Pick a seeded proposal that actually links an opportunity, so the cross-route
    // consequence is observable.
    const target = proposals().find((p) => p.opportunityId && p.state !== "ACCEPTED")!;
    expect(target).toBeTruthy();
    render(<ProposalsScreen />);
    chooseFromMenu(`Actions for ${target.id}`, /^Mark accepted/);
    // Confirm dialog, then the confirm button of the same name.
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark accepted" }));

    expect(byId(target.id).state).toBe("ACCEPTED");
    const opp = getDemoState().opportunities.find((o) => o.id === target.opportunityId)!;
    expect(opp.stage).toBe("Won");
    expect(getDemoState().leadOverrides[target.leadId]?.status).toBe("Won");
  });

  it("marks a proposal declined (opportunity Lost) and sent (Proposal Sent)", () => {
    const linked = proposals().filter((p) => p.opportunityId);
    const declineTarget = linked.find((p) => p.state !== "REJECTED")!;
    render(<ProposalsScreen />);
    chooseFromMenu(`Actions for ${declineTarget.id}`, /^Mark declined/);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark declined" }));
    expect(byId(declineTarget.id).state).toBe("REJECTED");
    expect(getDemoState().opportunities.find((o) => o.id === declineTarget.opportunityId)!.stage).toBe("Lost");

    const sentTarget = linked.find((p) => p.id !== declineTarget.id && p.state !== "SENT")!;
    chooseFromMenu(`Actions for ${sentTarget.id}`, /^Mark sent/);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark sent" }));
    expect(byId(sentTarget.id).state).toBe("SENT");
    expect(getDemoState().opportunities.find((o) => o.id === sentTarget.opportunityId)!.stage).toBe("Proposal Sent");
  });

  it("archives straight from the menu without a confirm dialog", () => {
    render(<ProposalsScreen />);
    chooseFromMenu("Actions for PRO-2034", "Archive");
    expect(byId("PRO-2034").state).toBe("ARCHIVED");
  });
});

describe("mutations", () => {
  it("duplicates a proposal as a new DRAFT with a bumped version, prepended", () => {
    render(<ProposalsScreen />);
    const before = proposals().length;
    chooseFromMenu("Actions for PRO-2024", "Duplicate");
    expect(proposals()).toHaveLength(before + 1);
    // createProposal prepends, so the newest is at index 0.
    const created = proposals()[0]!;
    expect(created.id).toBe("PRO-2035");
    expect(created.state).toBe("DRAFT");
    expect(created.version).toBe("v4"); // PRO-2024 was v3
    expect(created.client).toBe("Petal & Stem");
  });

  it("creates a proposal from the lead picker", () => {
    render(<ProposalsScreen />);
    const before = proposals().length;
    fireEvent.click(screen.getByRole("button", { name: "New proposal" }));
    fillField("Client", "Acme Robotics");
    fillField("Value (USD)", "50000");
    fireEvent.click(screen.getByRole("button", { name: "Create proposal" }));
    expect(proposals()).toHaveLength(before + 1);
    const created = proposals()[0]!;
    expect(created.client).toBe("Acme Robotics");
    expect(created.state).toBe("DRAFT");
    expect(created.value).toBe(50000);
  });

  it("edits a proposal through the detail dialog", () => {
    render(<ProposalsScreen />);
    chooseFromMenu("Actions for PRO-2034", "Edit proposal");
    fillField("Value (USD)", "99000");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(byId("PRO-2034").value).toBe(99000);
  });
});

describe("route states", () => {
  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/proposals?mock-scenario=demo-error");
    render(<ProposalsScreen />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    window.history.replaceState(null, "", "/proposals");
  });
});
