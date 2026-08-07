// The dashboard shell's contract, asserted as behaviour rather than as bytes.
//
// `app/dashboard/shell-nav.tsx` used to be held byte-identical to the production
// baseline by test 15 of app/case-studies-official-baseline.test.ts. That guard was
// written as a historical claim — this branch starts from production and adds the
// case-studies route — but it read the working tree, so it hardened into a freeze
// on the dashboard's route registry: the one file that has to gain a line whenever
// a route behind it is built. Test 15 now keeps the frozen frontend files and makes
// its shell-nav claim over the immutable release range; the live half is here.
//
// A byte comparison is also the weaker guard of the two. It cannot tell a
// deliberate route registration from a renamed label, a rerouted destination, a
// preview URL pasted into the rail or a route registered with no page behind it —
// it fails on all four identically, and passes on all four the moment someone
// re-records the baseline. Each of those is a named test below.
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IMPLEMENTED_ROUTES, PAGE_META } from "./shell-nav";
import {
  ADMINISTRATION_NAV,
  NAV_GROUPS,
  NavList,
  OPERATIONS_NAV,
  type NavItem,
} from "@command-center/ui";

const here = fileURLToPath(new URL(".", import.meta.url));
const appDir = join(here, "..");
const repo = join(here, "../..");
const shellNavSrc = readFileSync(join(here, "shell-nav.tsx"), "utf8");
const sidebarSrc = readFileSync(join(repo, "lib/command-center/ui/sidebar.tsx"), "utf8");

/**
 * The nav exactly as production shipped it, spelled out rather than derived.
 *
 * This is what the byte lock was really protecting: a label or a destination
 * changing without anyone deciding it should. Written as data so a rename fails
 * with the old and new value side by side instead of as a diff of a whole file.
 */
const PRODUCTION_OPERATIONS_NAV: ReadonlyArray<readonly [string, string]> = [
  ["Overview", "/dashboard"],
  ["My Work", "/dashboard/my-work"],
  ["Leads", "/dashboard/leads"],
  ["Pipeline", "/dashboard/pipeline"],
  ["Appointments", "/dashboard/appointments"],
  ["Meeting Intelligence", "/dashboard/meetings"],
  ["Proposals", "/dashboard/proposals"],
  ["Follow-ups", "/dashboard/follow-ups"],
  ["Email Activity", "/dashboard/email-activity"],
];

const PRODUCTION_ADMINISTRATION_NAV: ReadonlyArray<readonly [string, string]> = [
  ["Team", "/dashboard/team"],
  ["Settings", "/dashboard/settings"],
];

/** The six the canonical rail draws (CANON 849-854). There is no seventh. */
const CANONICAL_ICONS = [
  "overview",
  "leads",
  "pipeline",
  "appointments",
  "meetings",
  "proposals",
];

const pairs = (items: readonly NavItem[]) => items.map((item) => [item.label, item.href]);

/**
 * Whether a registered route has a page file behind it.
 *
 * Route groups — `app/dashboard/(overview)` — are directories Next.js keeps out of
 * the URL, so `/dashboard` resolves through one and needs the second lookup.
 */
function pageExists(route: string): boolean {
  const segments = route.split("/").filter(Boolean);
  const dir = join(appDir, ...segments);
  if (existsSync(join(dir, "page.tsx"))) return true;
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some(
    (entry) => /^\(.+\)$/.test(entry) && existsSync(join(dir, entry, "page.tsx")),
  );
}

const render = (activeHref: string) =>
  renderToStaticMarkup(createElement(NavList, { activeHref }));

describe("dashboard nav contract", () => {
  it("keeps both groups, with Administration still the admin-only one", () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual(["OPERATIONS", "ADMINISTRATION"]);
    expect(NAV_GROUPS.find((group) => group.label === "OPERATIONS")?.adminOnly).toBeUndefined();
    expect(NAV_GROUPS.find((group) => group.label === "ADMINISTRATION")?.adminOnly).toBe(true);
  });

  it("changes no label, destination or position production shipped", () => {
    // Copilot is appended, so every production row keeps its index as well as its
    // text: a reorder fails here even though every label still exists.
    expect(pairs(OPERATIONS_NAV).slice(0, PRODUCTION_OPERATIONS_NAV.length)).toEqual(
      PRODUCTION_OPERATIONS_NAV.map((pair) => [...pair]),
    );
    expect(pairs(ADMINISTRATION_NAV)).toEqual(
      PRODUCTION_ADMINISTRATION_NAV.map((pair) => [...pair]),
    );
  });

  it("removes nothing: every production destination is still reachable", () => {
    const hrefs = new Set([...OPERATIONS_NAV, ...ADMINISTRATION_NAV].map((item) => item.href));
    for (const [label, href] of [
      ...PRODUCTION_OPERATIONS_NAV,
      ...PRODUCTION_ADMINISTRATION_NAV,
    ]) {
      expect(hrefs.has(href), label).toBe(true);
    }
  });

  it("adds exactly one row, and it is Copilot", () => {
    const added = pairs(OPERATIONS_NAV).slice(PRODUCTION_OPERATIONS_NAV.length);
    expect(added).toEqual([["Copilot", "/dashboard/ai"]]);
    expect(ADMINISTRATION_NAV).toHaveLength(PRODUCTION_ADMINISTRATION_NAV.length);
  });

  it("puts the assistant in Operations, where it is not admin-gated", () => {
    expect(OPERATIONS_NAV.some((item) => item.href === "/dashboard/ai")).toBe(true);
    expect(ADMINISTRATION_NAV.some((item) => item.href === "/dashboard/ai")).toBe(false);
  });

  it("names the assistant once, with no second AI entry beside it", () => {
    const all = [...OPERATIONS_NAV, ...ADMINISTRATION_NAV];
    const aiish = all.filter((item) =>
      /\b(ai|assistant|copilot|chat)\b/i.test(item.label) || item.href.startsWith("/dashboard/ai"),
    );
    expect(aiish.map((item) => item.label)).toEqual(["Copilot"]);
    // The near-miss labels a second pass tends to add.
    for (const duplicate of ["AI", "Assistant", "AI Assistant", "Copilot Chat"]) {
      expect(all.filter((item) => item.label === duplicate), duplicate).toHaveLength(0);
    }
  });

  it("adds no icon, and no nav row invents one outside the canonical six", () => {
    expect(OPERATIONS_NAV.find((item) => item.href === "/dashboard/ai")?.icon).toBeUndefined();
    for (const item of [...OPERATIONS_NAV, ...ADMINISTRATION_NAV]) {
      if (item.icon) expect(CANONICAL_ICONS, item.label).toContain(item.icon);
    }
    expect(
      [...OPERATIONS_NAV, ...ADMINISTRATION_NAV].filter((item) => item.icon),
    ).toHaveLength(CANONICAL_ICONS.length);
  });

  it("gives the assistant no badge, since nothing is waiting in a conversation", () => {
    expect(OPERATIONS_NAV.find((item) => item.href === "/dashboard/ai")?.badge).toBeUndefined();
  });
});

describe("dashboard route registry", () => {
  it("has a page behind every route it calls implemented", () => {
    // The invariant the count was standing in for. A route registered with nothing
    // behind it renders an enabled link to a 404, which is the exact failure the
    // gated-link posture exists to prevent.
    for (const route of IMPLEMENTED_ROUTES) {
      expect(pageExists(route), route).toBe(true);
    }
  });

  it("registers the Copilot route against the page that backs it", () => {
    expect(IMPLEMENTED_ROUTES.has("/dashboard/ai")).toBe(true);
    expect(existsSync(join(here, "ai/page.tsx"))).toBe(true);
  });

  it("registers every nav destination, so no rail row is gated by accident", () => {
    for (const item of [...OPERATIONS_NAV, ...ADMINISTRATION_NAV]) {
      expect(IMPLEMENTED_ROUTES.has(item.href), item.label).toBe(true);
    }
  });

  it("keeps the gated-link posture for anything not registered", () => {
    expect(shellNavSrc).toContain("if (!IMPLEMENTED_ROUTES.has(href))");
    expect(shellNavSrc).toContain('aria-disabled="true"');
  });
});

describe("dashboard header copy", () => {
  it("resolves Copilot's title and says what the screen is for", () => {
    expect(PAGE_META["/dashboard/ai"]?.title).toBe("Copilot");
    expect(PAGE_META["/dashboard/ai"]?.subtitle).toBe(
      "A read-only assistant. It answers questions and changes no business records.",
    );
  });

  it("names no provider or model in any page's header copy", () => {
    const copy = JSON.stringify(
      Object.values(PAGE_META).map((meta) => [meta.title, meta.subtitle]),
    ).toLowerCase();
    for (const detail of ["openai", "gpt", "anthropic", "claude", "gemini", "llm", "token"]) {
      expect(copy, detail).not.toContain(detail);
    }
  });

  it("writes header copy only for routes that exist", () => {
    for (const route of Object.keys(PAGE_META)) {
      expect(IMPLEMENTED_ROUTES.has(route), route).toBe(true);
    }
  });

  it("still falls back rather than rendering an empty title", () => {
    expect(shellNavSrc).toContain('meta?.title ?? "Command Center"');
  });
});

describe("dashboard nav rendering", () => {
  it("renders the Copilot row as a real link in the list every viewport shares", () => {
    // One NavList feeds the desktop aside, the tablet overlay and the mobile
    // drawer, so asserting it once asserts all three.
    const html = render("/dashboard");
    expect(html).toContain('href="/dashboard/ai"');
    expect(html).toContain(">Copilot</span>");
  });

  it("marks the current route, and only the current route", () => {
    const onCopilot = render("/dashboard/ai");
    expect(onCopilot).toMatch(/href="\/dashboard\/ai" aria-current="page"/);
    expect(onCopilot.match(/aria-current="page"/g)).toHaveLength(1);

    const onLeads = render("/dashboard/leads");
    expect(onLeads).toMatch(/href="\/dashboard\/leads" aria-current="page"/);
    expect(onLeads).not.toMatch(/href="\/dashboard\/ai" aria-current="page"/);
  });

  it("matches the active route exactly, as every other row does", () => {
    // Nested paths do not light the parent row anywhere in this rail — a record
    // under /dashboard/leads does not highlight Leads either — so Copilot behaves
    // the same rather than inventing prefix matching for one entry.
    const nested = render("/dashboard/ai/some-thread");
    expect(nested).not.toContain('aria-current="page"');
    expect(render("/dashboard/leads/lead-1")).not.toContain('aria-current="page"');
  });

  it("keeps the rail's every row a link with a visible focus ring", () => {
    const html = render("/dashboard/ai");
    const rows = html.match(/<a /g) ?? [];
    expect(rows).toHaveLength(OPERATIONS_NAV.length + ADMINISTRATION_NAV.length);
    expect(html).not.toContain('href="#"');
    expect(html).toContain("focus-visible:outline-2");
  });

  it("still announces what a badge counts, rather than a bare number", () => {
    const html = render("/dashboard");
    expect(html).toContain("needing attention");
    expect(html).toContain('class="sr-only"');
  });
});

describe("dashboard shell stays what it was", () => {
  it("points at no external or preview host", () => {
    for (const [name, src] of [
      ["shell-nav.tsx", shellNavSrc],
      ["sidebar.tsx", sidebarSrc],
    ] as const) {
      expect(src, name).not.toMatch(/https?:\/\//);
      expect(src, name).not.toMatch(/vercel\.app|ngrok|localhost:\d+|\.preview\./);
    }
    expect(render("/dashboard")).not.toMatch(/https?:\/\//);
  });

  it("reaches no authentication, database or migration code", () => {
    for (const [name, src] of [
      ["shell-nav.tsx", shellNavSrc],
      ["sidebar.tsx", sidebarSrc],
    ] as const) {
      expect(src, name).not.toMatch(/from ["'][^"']*supabase/);
      expect(src, name).not.toMatch(/createBrowserClient|createServerClient|getSession/);
      expect(src, name).not.toMatch(/process\.env/);
    }
  });

  it("leaves the theme and the shell's own structure alone", () => {
    // The three shell files with no registry in them are still byte-locked to
    // production by test 15; this only asserts the nav did not grow a way around
    // that by rendering its own provider or route boundary.
    expect(shellNavSrc).not.toContain("ThemeProvider");
    expect(shellNavSrc).toContain('import { Sidebar, ShellHeader } from "@command-center/ui"');
  });
});
