// Settings route behaviour: every section renders, non-secret fields save to the local demo
// store, and secret fields render as a notice — never as an input, and never written.
//
// Plain expect() only; the suite carries no jest-dom dependency.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SettingsScreen } from "./settings-view";
import { __resetDemoStateForTests, getDemoState } from "../../../lib/demo/store";

const section = (id: string) => getDemoState().settings.find((s) => s.id === id)!;
const field = (sectionId: string, fieldId: string) => section(sectionId).fields.find((f) => f.id === fieldId)!;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE", "mock");
  __resetDemoStateForTests();
  window.innerWidth = 1440;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("sections", () => {
  it("renders every settings section", () => {
    render(<SettingsScreen />);
    expect(screen.getAllByRole("region")).toHaveLength(getDemoState().settings.length);
    expect(screen.getByRole("region", { name: "General" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Security" })).toBeTruthy();
  });
});

describe("saving", () => {
  it("keeps Save disabled until a field is edited, then persists the change", () => {
    render(<SettingsScreen />);
    const general = screen.getByRole("region", { name: "General" });
    const save = within(general).getByRole("button", { name: "Save changes" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.change(within(general).getByLabelText("Workspace name"), { target: { value: "Acme Corp" } });
    expect(save.disabled).toBe(false);

    fireEvent.click(save);
    expect(field("general", "workspaceName").value).toBe("Acme Corp");
    expect(save.disabled).toBe(true); // dirty cleared after save
  });

  it("persists a toggle as on/off", () => {
    render(<SettingsScreen />);
    const notifications = screen.getByRole("region", { name: "Notifications" });
    const toggle = within(notifications).getByLabelText("New lead") as HTMLInputElement;
    expect(toggle.checked).toBe(true); // seeded "on"

    fireEvent.click(toggle);
    fireEvent.click(within(notifications).getByRole("button", { name: "Save changes" }));
    expect(field("notifications", "notifyNewLead").value).toBe("off");
  });
});

describe("secret fields", () => {
  it("renders a secret field as a notice, never an input, and never writes it", () => {
    render(<SettingsScreen />);
    const email = screen.getByRole("region", { name: "Email" });
    // No control is bound to the secret provider field...
    expect(within(email).queryByLabelText("Email provider")).toBeNull();
    // ...but the notice still explains it, and a non-secret sibling is a real input.
    expect(within(email).getByText("Email provider")).toBeTruthy();
    expect(within(email).getByLabelText("From name")).toBeTruthy();
    // The secret field keeps its seeded value; nothing here can change it.
    expect(field("email", "emailProvider").secret).toBe(true);
  });
});

describe("route states", () => {
  it("shows the deliberate demo error with a Retry that clears it", () => {
    window.history.replaceState(null, "", "/settings?mock-scenario=demo-error");
    render(<SettingsScreen />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("alert")).toBeNull();
    window.history.replaceState(null, "", "/settings");
  });
});
