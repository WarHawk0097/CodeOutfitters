// Dashboard sign-out control. Reuses the existing signOut() server action
// (app/login/actions.ts) — asserts it is threaded through the nav chain
// (Sidebar / ShellHeader / ShellNav / ShellHeaderBar) into a real submit
// button, not a decorative link, without disturbing the account footer
// contract locked by regression.test.ts and interaction-identity-repair.test.ts.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const sidebarSrc = readFileSync(`${here}../../lib/command-center/ui/sidebar.tsx`, "utf8");
const shellHeaderSrc = readFileSync(`${here}../../lib/command-center/ui/shell-header.tsx`, "utf8");
const shellNavSrc = readFileSync(`${here}shell-nav.tsx`, "utf8");
const loginActionsSrc = readFileSync(`${here}../login/actions.ts`, "utf8");

describe("dashboard sign-out control", () => {
  it("renders a real submit button, not a decorative icon, when wired", () => {
    expect(sidebarSrc).toContain("onSignOut?: (formData: FormData) => void | Promise<void>");
    expect(sidebarSrc).toContain("<form action={onSignOut}>");
    expect(sidebarSrc).toContain('aria-label="Sign out"');
    expect(sidebarSrc).toContain('type="submit"');
  });

  it("keeps the decorative fallback when no onSignOut is supplied (back-compat)", () => {
    expect(sidebarSrc).toContain("logout ? (");
  });

  it("threads onSignOut into both NavDrawer call sites and ExpandedSidebar", () => {
    expect(sidebarSrc).toContain("<AccountFooter avatar={v.avatar} role={v.role} logout onSignOut={onSignOut} />");
    expect(sidebarSrc).toContain("<AccountFooter logout onSignOut={onSignOut} />");
  });

  it("threads onSignOut through the mobile header drawer", () => {
    expect(shellHeaderSrc).toContain("onSignOut?: (formData: FormData) => void | Promise<void>");
    expect(shellHeaderSrc).toContain("onSignOut={onSignOut}");
  });

  it("wires the real signOut() server action from app/login/actions.ts, not a duplicate", () => {
    expect(shellNavSrc).toContain('import { signOut } from "@/app/login/actions"');
    expect(shellNavSrc).toContain("onSignOut={signOut}");
    expect(loginActionsSrc).toContain("export async function signOut()");
    expect(loginActionsSrc).toContain("await supabase.auth.signOut()");
    expect(loginActionsSrc).toContain("redirect('/login')");
  });
});
