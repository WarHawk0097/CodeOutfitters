// The owner's role is displayed as "Owner" and enforced as "Administrator".
//
// Two things share one word in most codebases: what a person is called and what they are
// allowed to do. These tests hold them apart — the display mapping may change the label on
// any surface, and must change no stored value, no filter comparison and no gate.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CURRENT_USER, displayRoleFor, getTeamRoleDisplayLabel } from "../../lib/identity/current-user";
import { createSeedState, DEMO_CURRENT_USER_ID } from "../../lib/demo/seed";
import { DEMO_EMAIL } from "../login/credentials";

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (rel: string) => readFileSync(`${here}../../${rel}`, "utf8");

const teamSrc = read("app/dashboard/team/team-view.tsx");
const commandSrc = read("components/command-center/command-dialog.tsx");
const state = createSeedState();
const owner = state.team.find((m) => m.id === DEMO_CURRENT_USER_ID)!;

describe("owner role display", () => {
  // 1
  it("maps the administrator role to Owner for display", () => {
    expect(getTeamRoleDisplayLabel("Administrator")).toBe("Owner");
    expect(CURRENT_USER.displayRole).toBe("Owner");
  });

  // 2
  it("stores the administrator role unchanged", () => {
    expect(owner.role).toBe("Administrator");
  });

  // 3
  it("shows the display label in the Team directory, on both widths", () => {
    expect(teamSrc).toContain("<span>{getTeamRoleDisplayLabel(member.role)}</span>");
    expect(teamSrc).toContain(
      '<span className="w-[110px] flex-shrink-0 text-[12px] text-cc-t2">{getTeamRoleDisplayLabel(member.role)}</span>',
    );
    expect(teamSrc).not.toMatch(/>\{member\.role\}</);
  });

  // 4
  it("filters the Team directory on the stored role, not on the label", () => {
    // The option id is the value compared against `member.role`; only the menu text is mapped.
    expect(teamSrc).toContain("options={ROLES.map((r) => ({ id: r, label: getTeamRoleDisplayLabel(r) }))}");
    expect(teamSrc).toContain("if (roleFilter && member.role !== roleFilter) return false;");
    const matches = state.team.filter((m) => m.role === "Administrator");
    expect(matches).toContain(owner);
  });

  // 5
  it("writes the stored role from the invite and edit forms, not the label", () => {
    expect(teamSrc).toContain("options={ROLES.map((r) => ({ value: r, label: getTeamRoleDisplayLabel(r) }))}");
    expect(teamSrc).toContain('const ROLES: TeamRole[] = ["Administrator", "Sales"];');
  });

  // 6
  it("leaves the admin gate comparing against the stored role", () => {
    expect(commandSrc).toContain('member?.role === "Administrator" ? "admin" : "member"');
    expect(commandSrc).not.toContain('=== "Owner"');
  });

  // 7
  it("regresses no other role's label", () => {
    expect(getTeamRoleDisplayLabel("Sales")).toBe("Sales");
    for (const member of state.team.filter((m) => m.role !== "Administrator")) {
      expect(getTeamRoleDisplayLabel(member.role)).toBe(member.role);
    }
  });

  // 8
  it("says the same word on the sidebar, in Settings and in the directory", () => {
    const profileRole = state.settings.flatMap((g) => g.fields).find((f) => f.id === "profileRole");
    expect(profileRole?.value).toBe("Owner");
    expect(displayRoleFor(owner.id, owner.role)).toBe("Owner");
    expect(getTeamRoleDisplayLabel(owner.role)).toBe("Owner");
  });

  // 9
  it("names the owner and their address the same way everywhere", () => {
    expect(owner.name).toBe("Marc Bryce");
    expect(owner.email).toBe("marc@gmail.com");
    expect(DEMO_EMAIL).toBe("marc@gmail.com");
    const profileName = state.settings.flatMap((g) => g.fields).find((f) => f.id === "profileName");
    expect(profileName?.value).toBe("Marc Bryce");
  });

  // 10
  it("shows the display label wherever a member's role is read aloud beside their name", () => {
    for (const file of ["app/dashboard/my-work/my-work-view.tsx", "app/dashboard/my-work/task-detail.tsx"]) {
      const src = read(file);
      expect(src, file).toContain("${getTeamRoleDisplayLabel(member.role)}");
      expect(src, file).not.toContain("${member.name} · ${member.role}");
    }
  });
});
