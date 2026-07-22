// Shell reconstruction check (Phase 3 Step 3). jsdom has no CSS breakpoints, so
// both the expanded sidebar and the icon rail are in the tree at once; they are
// distinguished by their position, not by visibility.
import { describe, expect, it } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { Sidebar, ShellHeader } from "@command-center/ui";
import { ShellLink } from "./shell-nav";

function navs() {
  const [expanded, rail] = screen.getAllByRole("navigation", { name: "Primary" });
  return { expanded: expanded!, rail: rail! };
}

describe("application shell", () => {
  it("renders canonical text-only rows in the expanded sidebar", () => {
    render(<Sidebar activeHref="/leads" />);
    const { expanded } = navs();

    // CANON 33-35: the 248px aside has no icons on its rows.
    expect(within(expanded).queryByRole("img")).toBeNull();
    expect(expanded.querySelectorAll("a svg")).toHaveLength(0);

    // CANON 1312: ten destinations under two group labels.
    expect(within(expanded).getAllByRole("link")).toHaveLength(10);
    expect(within(expanded).getByText("OPERATIONS")).toBeTruthy();
    expect(within(expanded).getByText("ADMINISTRATION")).toBeTruthy();

    // CANON 1322: the active row is marked, and it is the current route.
    expect(within(expanded).getByRole("link", { current: "page" }).textContent).toContain("Leads");

    // CANON 34/36/37: brand block, Collapse affordance, account footer.
    expect(within(expanded).getByText("COMMAND CENTER")).toBeTruthy();
    expect(within(expanded).getByText("Collapse")).toBeTruthy();
    expect(within(expanded).getByText("Marc Rivera")).toBeTruthy();
  });

  it("renders exactly the six canonical icons on the tablet rail", () => {
    render(<Sidebar activeHref="/dashboard" />);
    const { rail } = navs();

    // CANON 849-854 defines six rail icons and no more.
    const links = within(rail).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("aria-label"))).toEqual([
      "Overview",
      "Leads",
      "Pipeline",
      "Appointments",
      "Meeting Intelligence",
      "Proposals",
    ]);
    expect(rail.querySelectorAll("a svg")).toHaveLength(6);
  });

  it("opens the navigation drawer from the rail and closes it on Escape", () => {
    render(<Sidebar activeHref="/dashboard" />);
    const trigger = screen.getByRole("button", { name: "Open navigation menu" });

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Navigation menu" });
    // The drawer carries the full list, including the four destinations that
    // have no canonical rail icon.
    // Name includes the canonical badge count, e.g. "Email Activity 2".
    expect(within(dialog).getByRole("link", { name: /Email Activity/ })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  // Eight of the ten canonical destinations have no page in this phase. A row
  // pointing at one used to navigate to /_not-found — an active-looking control
  // whose only outcome is an error page. It is gated instead: still listed,
  // still announced, still keyboard-reachable, but it does not navigate and it
  // says why.
  it("gates the nav rows whose routes this phase does not build", () => {
    render(<Sidebar activeHref="/leads" linkAs={ShellLink} />);
    const { expanded } = navs();
    const rows = within(expanded).getAllByRole("link");
    expect(rows).toHaveLength(10);

    const live = rows.filter((r) => r.getAttribute("aria-disabled") === null);
    expect(live.map((r) => r.getAttribute("href"))).toEqual(["/dashboard", "/leads"]);

    const gated = rows.filter((r) => r.getAttribute("aria-disabled") === "true");
    expect(gated).toHaveLength(8);
    for (const row of gated) {
      // No href: nothing to navigate to, so no 404 is reachable from here.
      expect(row.getAttribute("href")).toBeNull();
      // Still in the tab order, and it carries the reason rather than being a
      // silently dead row.
      expect(row.getAttribute("tabindex")).toBe("0");
      expect(row.getAttribute("title")).toContain("later implementation phase");
    }
  });

  it("keeps the rail tooltip on a gated icon and adds the reason to it", () => {
    render(<Sidebar activeHref="/dashboard" linkAs={ShellLink} />);
    const { rail } = navs();
    // The rail is icon-only, so the label is the accessible name and the title
    // is the tooltip; gating must not cost either.
    const pipeline = within(rail).getByRole("link", { name: "Pipeline" });
    expect(pipeline.getAttribute("aria-disabled")).toBe("true");
    expect(pipeline.getAttribute("title")).toMatch(/^Pipeline — /);
  });

  it("puts the page title in the header and opens the mobile drawer", () => {
    render(<ShellHeader activeHref="/dashboard" title="Overview" subtitle="4 items need attention" />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Overview");

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("dialog", { name: "Navigation menu" })).toBeTruthy();
  });
});
