// Email Activity route behaviour: the log, its search and filters, load-more paging, the
// thread panel, read/unread, archive, retry and a local compose. No provider is connected
// and nothing is delivered — every send is a demo record.
//
// Plain expect() only; the suite carries no jest-dom dependency.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EmailActivityScreen, validateComposeDraft } from "./email-activity-view";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";

const emails = () => getDemoState().emails;
const byId = (id: string) => emails().find((e) => e.id === id)!;

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

describe("validateComposeDraft", () => {
  it("requires a valid recipient, a subject and a body", () => {
    expect(validateComposeDraft({ leadId: "l1", to: "nope", leadName: "X", subject: "", body: "" })).toEqual({
      to: "Enter a valid recipient email.",
      subject: "Subject is required.",
      body: "Message is required.",
    });
    expect(validateComposeDraft({ leadId: "l1", to: "a@b.com", leadName: "X", subject: "Hi", body: "Text" })).toEqual({});
  });
});

describe("log", () => {
  it("pages the first four rows and loads the rest", () => {
    render(<EmailActivityScreen />);
    expect(screen.getByTestId("email-row-eml-001")).toBeTruthy();
    expect(screen.getByTestId("email-row-eml-004")).toBeTruthy();
    // Page size is 4, so eml-005/006 are behind load-more.
    expect(screen.queryByTestId("email-row-eml-005")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Load more/ }));
    expect(screen.getByTestId("email-row-eml-005")).toBeTruthy();
    expect(screen.getByTestId("email-row-eml-006")).toBeTruthy();
  });

  it("filters by direction, status and read state", () => {
    render(<EmailActivityScreen />);
    // Inbound → only eml-006 (Alicia Fenwick).
    chooseFromMenu("Direction: All directions", "Inbound");
    expect(screen.getByTestId("email-row-eml-006")).toBeTruthy();
    expect(screen.queryByTestId("email-row-eml-001")).toBeNull();
    chooseFromMenu(/^Direction: /, "All directions");

    // Status FAILED → only eml-002.
    chooseFromMenu("Status: Any status", "FAILED");
    expect(screen.getByTestId("email-row-eml-002")).toBeTruthy();
    expect(screen.queryByTestId("email-row-eml-001")).toBeNull();
    chooseFromMenu(/^Status: /, "Any status");

    // Read = Read → eml-001 (read) shows, eml-002 (unread) does not.
    chooseFromMenu("Read: Read & unread", "Read");
    expect(screen.getByTestId("email-row-eml-001")).toBeTruthy();
    expect(screen.queryByTestId("email-row-eml-002")).toBeNull();
  });
});

describe("thread + row actions", () => {
  it("opening an unread thread marks it read", () => {
    render(<EmailActivityScreen />);
    expect(byId("eml-002").read).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Finish scheduling your call" }));
    expect(screen.getByRole("dialog", { name: "Finish scheduling your call" })).toBeTruthy();
    expect(byId("eml-002").read).toBe(true);
  });

  it("toggles read from the menu", () => {
    render(<EmailActivityScreen />);
    chooseFromMenu("Actions for We received your request", "Mark unread");
    expect(byId("eml-001").read).toBe(false);
  });

  it("archives from the menu", () => {
    render(<EmailActivityScreen />);
    chooseFromMenu("Actions for We received your request", "Archive");
    expect(byId("eml-001").archived).toBe(true);
    expect(byId("eml-001").state).toBe("ARCHIVED");
  });

  it("retries a failed send back to queued", () => {
    render(<EmailActivityScreen />);
    expect(byId("eml-002").state).toBe("FAILED");
    chooseFromMenu("Actions for Finish scheduling your call", /^Retry send/);
    expect(byId("eml-002").state).toBe("QUEUED");
  });
});

describe("compose", () => {
  it("records a demo send, prepended to the log", () => {
    render(<EmailActivityScreen />);
    const before = emails().length;
    fireEvent.click(screen.getByRole("button", { name: "Compose" }));
    fillField("Recipient email", "new@lead.com");
    fillField("Subject", "Intro from CodeOutfitters");
    fillField("Message", "Hello there, following up.");
    fireEvent.click(screen.getByRole("button", { name: "Send (demo)" }));
    expect(emails()).toHaveLength(before + 1);
    const created = emails()[0]!;
    expect(created.subject).toBe("Intro from CodeOutfitters");
    expect(created.state).toBe("SENT");
    expect(created.direction).toBe("outbound");
  });
});

describe("route states", () => {
  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/email-activity?mock-scenario=demo-error");
    render(<EmailActivityScreen />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    window.history.replaceState(null, "", "/email-activity");
  });
});
