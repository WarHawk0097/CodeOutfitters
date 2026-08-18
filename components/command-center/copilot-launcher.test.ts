// Phase D — global Copilot launcher. Source-surface tests in this repository's existing
// idiom for client components (see command-dialog.test.ts): the properties worth guarding
// are invisible when correct and expensive when wrong — the accessibility wiring, and the
// mount-once/toggle-visibility shape that keeps CopilotScreen's state alive.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const launcher = read("components/command-center/copilot-launcher.tsx");
const layout = read("app/dashboard/layout.tsx");

describe("global Copilot launcher", () => {
  it("is mounted once, globally, in the dashboard shell", () => {
    expect(layout).toContain("<CopilotLauncher />");
    expect(launcher.match(/export function CopilotLauncher/g)?.length).toBe(1);
  });

  it("is a labelled modal dialog that closes on Escape and on backdrop click", () => {
    expect(launcher).toContain('role="dialog"');
    expect(launcher).toContain('aria-modal="true"');
    expect(launcher).toContain("aria-labelledby={titleId}");
    expect(launcher).toContain('if (event.key === "Escape")');
    expect(launcher).toContain("onClick={() => setOpen(false)}");
  });

  it("moves focus into the panel on open and back to the trigger on close", () => {
    expect(launcher).toContain("closeRef.current?.focus();");
    expect(launcher).toContain("triggerRef.current?.focus();");
  });

  it("locks page scroll while open and restores it on close", () => {
    expect(launcher).toContain('document.body.style.overflow = "hidden";');
    expect(launcher).toContain("document.body.style.overflow = previousOverflow;");
  });

  it("mounts CopilotScreen once on first open and thereafter toggles visibility, never unmounts it", () => {
    // Mount gate: nothing is fetched until the user actually opens it once.
    expect(launcher).toContain("everOpened ? (");
    expect(launcher).toContain("setEverOpened(true);");
    // Visibility after that is a class toggle, not conditional rendering — CopilotScreen's
    // draft/conversation state must survive close/reopen and route changes.
    expect(launcher).toContain('${open ? "" : "hidden"}');
    expect(launcher).not.toContain("{open ? (\n      <div");
  });

  it("hides its own trigger on the full Copilot page instead of opening a second conversation", () => {
    expect(launcher).toContain('usePathname() === "/dashboard/ai"');
    expect(launcher).toContain("onFullCopilotPage ? null : (");
    expect(launcher).toContain("setOpen(false);");
  });

  it("links out to the full Copilot page and closes the drawer on click", () => {
    expect(launcher).toContain('href="/dashboard/ai"');
    expect(launcher).toContain("Open full Copilot");
  });

  it("widens for CopilotScreen's own lg two-column breakpoint instead of squeezing it", () => {
    expect(launcher).toContain("sm:w-[420px]");
    expect(launcher).toContain("lg:w-[640px]");
  });
});
