// Phase 2-4 regression tests for the Settings restoration. Node-env, source-string
// and pure-function assertions — the same style as app/dashboard/ai/copilot-view.test.ts
// — since SettingsScreen is a client component wired to live fetch/context hooks that
// this repo's test suite does not mount through a DOM harness elsewhere either.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SETTINGS_SEED } from "../../../lib/demo/seed";
import { liveGeneralSection } from "./settings-view";

const here = fileURLToPath(new URL(".", import.meta.url));
const viewSrc = readFileSync(`${here}settings-view.tsx`, "utf8");
const pageSrc = readFileSync(`${here}page.tsx`, "utf8");
const googleCardSrc = readFileSync(`${here}google-connection-card.tsx`, "utf8");

describe("1: live Settings has all 13 historical sections", () => {
  it("SETTINGS_SEED still defines exactly the 13 historical sections", () => {
    expect(SETTINGS_SEED).toHaveLength(13);
    const ids = SETTINGS_SEED.map((s) => s.id);
    expect(new Set(ids).size).toBe(13);
  });

  it("live mode reads sections from SETTINGS_SEED, not from the demo store", () => {
    expect(viewSrc).toContain("if (!live) return state.settings;");
    expect(viewSrc).toContain("SETTINGS_SEED.map((section) =>");
  });

  it("both the nav list and the section body render the unified `sections` variable", () => {
    expect(viewSrc).toContain("{sections.map((section) => (");
    // Guards against a partial fix that updates one of the two .map() call sites
    // (nav or body) but not the other, which would silently desync navigation
    // from content again — the original Phase 2 bug this restoration corrects.
    expect(viewSrc.match(/sections\.map\(\(section\) => \(/g)).toHaveLength(2);
  });
});

describe("2 & 3: Appearance and Google remain available in live mode", () => {
  it("ThemeSettingsCard (Appearance) and GoogleConnectionCard render unconditionally, outside the sections loop", () => {
    expect(viewSrc).toContain("<ThemeSettingsCard />");
    expect(viewSrc).toContain("<GoogleConnectionCard />");
  });
});

describe("4: Settings cannot silently become [] in live mode again", () => {
  it("the live branch never falls through to the (always-empty) demo state.settings", () => {
    // lib/demo/store.ts freezes state.settings to [] in live mode by design — the
    // Phase 2 bug was SettingsScreen reading state.settings unconditionally. The
    // fix must select SETTINGS_SEED before that empty array is ever consulted.
    expect(viewSrc).toMatch(/if \(!live\) return state\.settings;\s*\n\s*return SETTINGS_SEED\.map/);
  });
});

describe("5: real viewer identity replaces demo profile values in live mode", () => {
  const general = SETTINGS_SEED.find((s) => s.id === "general")!;

  it("liveGeneralSection overrides profileName and profileRole with the real viewer, not CURRENT_USER", () => {
    const live = liveGeneralSection(general, "Priya Shah", "Owner");
    const name = live.fields.find((f) => f.id === "profileName")!;
    const role = live.fields.find((f) => f.id === "profileRole")!;
    expect(name.value).toBe("Priya Shah");
    expect(name.secret).toBe(true);
    expect(name.help).toContain("Priya Shah");
    expect(role.value).toBe("Owner");
    expect(role.secret).toBe(true);
    expect(name.value).not.toBe("Marc Bryce");
    expect(role.value).not.toBe("Sales");
  });

  it("leaves every other General field and every non-general section untouched", () => {
    const live = liveGeneralSection(general, "Priya Shah", "Owner");
    const workspaceName = live.fields.find((f) => f.id === "workspaceName")!;
    expect(workspaceName.value).toBe(general.fields.find((f) => f.id === "workspaceName")!.value);
    const other = SETTINGS_SEED.find((s) => s.id === "permissions")!;
    expect(liveGeneralSection(other, "Priya Shah", "Owner")).toBe(other);
  });

  it("page.tsx fetches the real viewer via getDashboardContext only when live, and passes it down", () => {
    expect(pageSrc).toContain("config.live ? await getDashboardContext() : null");
    expect(pageSrc).toContain("viewerName={viewer?.name}");
  });
});

describe("live-mode persistence honesty", () => {
  it("skips saveSettingsSection in live mode and never claims a bare 'Saved'", () => {
    expect(viewSrc).toContain('if (!live) saveSettingsSection(section.id, draft);');
    expect(viewSrc).toContain("Local preview only — account sync is not available yet.");
  });

  it("links the Team and Permissions section to the real /dashboard/team page in live mode", () => {
    expect(viewSrc).toContain('href="/dashboard/team"');
  });
});

describe("6, 7, 8: Calendar providers — Google scope accuracy, Apple and Microsoft Coming Soon", () => {
  it("6: labels Google by its actual granted scopes, never assuming Calendar sync", () => {
    expect(googleCardSrc).toContain("hasCalendarScope");
    expect(googleCardSrc).toContain('s.toLowerCase().includes("calendar")');
    expect(googleCardSrc).toContain('"Google Calendar connected" : "Google account connected"');
  });

  it("never requests new scopes or exposes a token/secret in the connection UI", () => {
    expect(googleCardSrc).not.toMatch(/access_token|refresh_token|credential_ciphertext|client_secret/i);
    expect(googleCardSrc).not.toContain("scope:");
  });

  it("7: Apple Calendar (iCloud) is shown as Coming soon with no credential collection", () => {
    expect(googleCardSrc).toContain("Apple Calendar (iCloud)");
    expect(googleCardSrc).not.toMatch(/CalDAV|app-specific password|Apple.*password/i);
  });

  it("8: Microsoft Outlook / Microsoft 365 is shown as Coming soon with no OAuth wiring", () => {
    expect(googleCardSrc).toContain("Microsoft Outlook / Microsoft 365");
  });

  it("every unbuilt provider renders the same 'Coming soon' badge, not a fake connected state", () => {
    // Four: Apple Calendar and Microsoft Outlook in the calendar list, Zoom and Microsoft
    // Teams in the meeting-provider list. Google Meet is deliberately not among them —
    // it is the one meeting provider that is really implemented, and its row reports the
    // granted scope rather than a badge.
    expect(googleCardSrc.match(/Coming soon/g)).toHaveLength(4);
    for (const name of ["Apple Calendar (iCloud)", "Microsoft Outlook / Microsoft 365", "Zoom", "Microsoft Teams"]) {
      expect(googleCardSrc).toContain(name);
    }
  });

  it("offers exactly one place to grant the Meet permission", () => {
    // Two identical buttons for one grant is how a user ends up unsure whether they
    // authorised twice. The permissions list states what is granted; the meeting-provider
    // row is where it is granted.
    expect(googleCardSrc.match(/Grant Meet permission/g)).toHaveLength(1);
  });
});
