import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url).pathname;
const read = (path: string) => readFileSync(`${root}${path}`, "utf8");

describe("dashboard surfaces do not present demo records as live data", () => {
  it.each([
    ["appointments", "AppointmentsScreen"],
    ["team", "TeamScreen"],
    ["email activity", "EmailActivityScreen"],
    ["follow-ups", "FollowUpsScreen"],
    ["meetings", "MeetingsScreen"],
    ["proposals", "ProposalsScreen"],
  ])("gates %s behind an explicit live provider state", (_label, screen) => {
    const source = read(
      screen === "AppointmentsScreen"
          ? "app/dashboard/appointments/appointments-view.tsx"
          : screen === "TeamScreen"
            ? "app/dashboard/team/team-view.tsx"
            : screen === "EmailActivityScreen"
              ? "app/dashboard/email-activity/email-activity-view.tsx"
              : screen === "FollowUpsScreen"
                ? "app/dashboard/follow-ups/follow-ups-view.tsx"
                : screen === "MeetingsScreen"
                  ? "app/dashboard/meetings/meetings-view.tsx"
                  : "app/dashboard/proposals/proposals-view.tsx",
    );
    expect(source).toContain("useCommandCenterConfig");
    expect(source).toContain("if (live)");
    expect(source).toContain("<LiveProviderRequired");
  });
});
