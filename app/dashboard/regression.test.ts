// Regression guards (45-50). The navigation/booking/theme work must not disturb
// the established demo/live boundary, the canonical token defaults, or the
// public header — these lock the surrounding contract in place.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const css = readFileSync(`${here}../globals.css`, "utf8");
const layoutSrc = readFileSync(`${here}layout.tsx`, "utf8");
const loginSrc = readFileSync(`${here}../login/page.tsx`, "utf8");
const navbarSrc = readFileSync(`${here}../../components/navbar.tsx`, "utf8");
const sidebarSrc = readFileSync(`${here}../../lib/command-center/ui/sidebar.tsx`, "utf8");

describe("regression guards (tests 45-50)", () => {
  // 45
  it("keeps the canonical default Command Center green on :root", () => {
    expect(css).toContain("--cc-green: #2f7d4f;");
  });

  // 46
  it("keeps the cc-* Tailwind token mapping intact", () => {
    expect(css).toContain("--color-cc-green: var(--cc-green);");
  });

  // 47
  it("keeps the demo/live boundary: mocks gate on the server-decided config", () => {
    expect(layoutSrc).toContain("commandCenterClientConfig()");
    expect(layoutSrc).toContain("<MockBrowserInit enabled={!config.live}>");
  });

  // 48
  it("keeps the live login path enforcing real Supabase auth", () => {
    expect(loginSrc).toContain("createClient");
    expect(loginSrc).toContain("supabase.auth.getUser()");
    expect(loginSrc).toContain("action={signIn}");
  });

  // 49
  it("keeps the public Book a Call CTA to /contact", () => {
    expect(navbarSrc).toContain("Book a Call");
    expect(navbarSrc).toContain('href="/contact"');
  });

  // 50
  it("keeps the mobile nav drawer modal and its account footer", () => {
    expect(sidebarSrc).toContain('aria-modal="true"');
    expect(sidebarSrc).toContain("<AccountFooter");
  });
});
