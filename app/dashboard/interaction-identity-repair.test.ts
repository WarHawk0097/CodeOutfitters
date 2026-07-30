// Dashboard interaction, identity, layout and routing repair — the 63 numbered facts.
//
// What each kind of test here can honestly prove:
//   * the cards are RENDERED with react-dom/server and asserted on the resulting
//     markup, so "this control is a link to that route" is a fact about output,
//     not about a string that happens to appear in a file;
//   * the count/destination parity facts EXECUTE both sides against the real demo
//     seed, so a card claiming N and a list showing M fails here;
//   * the URL-vocabulary facts run the real parser and serializer;
//   * the remaining facts are structural prohibitions (no nested interactive
//     element, no hard-coded hostname, no fake-disabled styling), which are
//     properly source-level.
//
// None of this is a click. Real activation at five viewports is the browser QA
// pass; these tests do not claim to replace it.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MeetingsProposalsCard,
  TodaysWorkCard,
  type OperationalSummary,
  type TodaysWorkItem,
} from "@command-center/ui";
import { CURRENT_USER, displayRoleFor } from "../../lib/identity/current-user";
import { DEMO_EMAIL } from "../login/credentials";
import { createSeedState, DEMO_CURRENT_USER_ID, LEAD_DIRECTORY } from "../../lib/demo/seed";
import {
  MEETING_PREPARE_STATES,
  MEETING_REVIEW_STATES,
  PROPOSAL_ATTENTION_STATES,
  meetingsToPrepare,
  needsAttention,
  needsPreparation,
  proposalsNeedingAttention,
} from "../../lib/operations/attention";
import { leadIdsWithoutNextAction } from "../../lib/tasks/model";
import {
  SAVED_VIEW_SCOPE_PATHS,
  SCOPE_DESCRIPTORS,
  parseFilters,
  serializeFilters,
} from "../../lib/views/model";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = `${here}../../`;
const read = (rel: string) => readFileSync(`${repo}${rel}`, "utf8");

const overviewCardsSrc = read("lib/command-center/ui/overview-cards.tsx");
const operationsSrc = read("components/dashboard/overview-operations.tsx");
const sidebarSrc = read("lib/command-center/ui/sidebar.tsx");
const meetingsSrc = read("app/dashboard/meetings/meetings-view.tsx");
const proposalsSrc = read("app/dashboard/proposals/proposals-view.tsx");
const leadsDataSrc = read("app/dashboard/leads/leads-data.tsx");
const leadsHandlerSrc = read("mocks/handlers/leads.ts");

const state = createSeedState();

// ---------------------------------------------------------------------------
// Corpus + route tree
// ---------------------------------------------------------------------------
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** Product source only. Scripts and QA harnesses legitimately name a host. */
const PRODUCT_FILES = [
  ...walk(`${repo}app`),
  ...walk(`${repo}components`),
  ...walk(`${repo}lib`),
];
const PRODUCT_SOURCES = PRODUCT_FILES.map((f) => [f.slice(repo.length), readFileSync(f, "utf8")] as const);

function collectRoutes(dir: string, prefix = "", out: string[] = []): string[] {
  const entries = readdirSync(dir);
  if (entries.some((e) => /^(page|route)\.tsx?$/.test(e))) out.push(prefix === "" ? "/" : prefix);
  for (const entry of entries) {
    const full = `${dir}/${entry}`;
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("_")) continue;
    const next =
      entry.startsWith("(") && entry.endsWith(")")
        ? prefix
        : entry.startsWith("[")
          ? `${prefix}/*`
          : `${prefix}/${entry}`;
    collectRoutes(full, next, out);
  }
  return out;
}

const ROUTE_PATTERNS = collectRoutes(`${repo}app`);

function routeExists(href: string): boolean {
  const path = href.split(/[?#]/)[0]!.replace(/\/$/, "") || "/";
  const segs = path.split("/");
  return ROUTE_PATTERNS.some((pattern) => {
    const p = pattern.split("/");
    if (p.length !== segs.length) return false;
    return p.every((seg, i) => seg === "*" || seg === segs[i]);
  });
}

// ---------------------------------------------------------------------------
// Rendered fixtures
// ---------------------------------------------------------------------------
const TASK_ITEM: TodaysWorkItem = {
  title: "Send Ruben Ortega revised scope summary",
  meta: "Northwind Logistics · overdue since yesterday",
  tag: "OVERDUE",
  color: "#B4553F",
  ink: "#8A2318",
  cta: "Open",
  href: "/dashboard/my-work/task-014",
  actionLabel: "Open task: Send Ruben Ortega revised scope summary",
};

const QUEUE_HREF = "/dashboard/my-work?view=today";

function todaysWork(variant: "desktop" | "tablet" | "mobile"): string {
  return renderToStaticMarkup(
    createElement(TodaysWorkCard, {
      items: [TASK_ITEM],
      openCount: "1",
      variant,
      queueHref: QUEUE_HREF,
    }),
  );
}

const MEETINGS_SUMMARY: OperationalSummary = {
  label: "2 meetings need review",
  detail: "Priyanka Rao · Solterra Energy",
  href: "/dashboard/meetings?view=review",
  actionLabel: "Review",
  ariaLabel: "Review meetings that need review",
};

const PROPOSALS_SUMMARY: OperationalSummary = {
  label: "3 proposals awaiting action",
  detail: "PRO-2031 · VIEWED",
  href: "/dashboard/proposals?view=attention",
  actionLabel: "Open",
  ariaLabel: "Open proposals needing attention",
};

function meetingsProposals(variant: "desktop" | "mobile"): string {
  return renderToStaticMarkup(
    createElement(MeetingsProposalsCard, {
      variant,
      meetings: MEETINGS_SUMMARY,
      proposals: PROPOSALS_SUMMARY,
    }),
  );
}

/** Every `<a href="…">` in a rendered fragment. */
function anchors(html: string): string[] {
  return [...html.matchAll(/<a[^>]*href="([^"]*)"/g)].map((m) => m[1]!);
}

/** Source with comments removed: a string quoted in a comment that explains why it was
 *  deleted is not the string still being rendered. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** An anchor opened inside another anchor, or a button inside an anchor. */
function hasNestedInteractive(html: string): boolean {
  return /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<(?:a|button)\b/.test(html);
}

// ---------------------------------------------------------------------------
describe("overview interactions (1-15)", () => {
  // 1
  it("renders the desktop Today's work header control as a real link to the queue", () => {
    expect(anchors(todaysWork("desktop"))).toContain(QUEUE_HREF);
  });

  // 2
  it("renders the tablet Today's work header control as a real link to the queue", () => {
    expect(anchors(todaysWork("tablet"))).toContain(QUEUE_HREF);
  });

  // 3
  it("renders the mobile Today's work header control as a real link to the queue", () => {
    expect(anchors(todaysWork("mobile"))).toContain(QUEUE_HREF);
  });

  // 4
  it("gives the queue link an accessible name that says what queue it opens", () => {
    const html = todaysWork("desktop");
    const label = /aria-label="([^"]*)"[^>]*>View queue|View queue/.exec(html);
    expect(label).not.toBeNull();
    expect(html).toContain('aria-label="View today&#x27;s work queue in My Work"');
  });

  // 5
  it("links every desktop task row to that task's own route", () => {
    expect(anchors(todaysWork("desktop"))).toContain(TASK_ITEM.href);
  });

  // 6
  it("names the task in the row action's accessible name rather than repeating 'Open'", () => {
    expect(todaysWork("desktop")).toContain(`aria-label="${TASK_ITEM.actionLabel}"`);
    expect(TASK_ITEM.actionLabel).not.toBe(TASK_ITEM.cta);
  });

  // 7
  it("does not draw an enabled task action with disabled or muted styling", () => {
    const html = todaysWork("desktop");
    expect(html).not.toContain("disabled");
    expect(html).not.toContain("opacity-50");
    expect(html).not.toContain("cursor-not-allowed");
    // The canonical port used the neutral table ink on the action pill, which read as
    // "greyed out". The action carries the actionable green tokens now.
    expect(html).toContain("text-cc-green-ink");
  });

  // 8
  it("gives the tablet row a usable action rather than leaving it desktop-only", () => {
    expect(anchors(todaysWork("tablet"))).toContain(TASK_ITEM.href);
  });

  // 9
  it("gives the mobile row a usable action rather than leaving it desktop-only", () => {
    expect(anchors(todaysWork("mobile"))).toContain(TASK_ITEM.href);
  });

  // 10
  it("gives the touch-width row actions a touch-sized target without absolute positioning", () => {
    for (const variant of ["tablet", "mobile"] as const) {
      const html = todaysWork(variant);
      expect(html).toMatch(/min-h-\[4[46]px\]/);
      expect(html).not.toContain("absolute");
    }
  });

  // 11
  it("never nests one interactive control inside another", () => {
    for (const variant of ["desktop", "tablet", "mobile"] as const) {
      expect(hasNestedInteractive(todaysWork(variant))).toBe(false);
    }
  });

  // 12
  it("renders no placeholder destinations", () => {
    for (const variant of ["desktop", "tablet", "mobile"] as const) {
      const html = todaysWork(variant);
      expect(html).not.toContain('href="#"');
      expect(html).not.toContain("javascript:");
      for (const href of anchors(html)) expect(href.startsWith("/")).toBe(true);
    }
  });

  // 13
  it("builds the row destination from the task id, so an unknown task cannot go nowhere", () => {
    expect(operationsSrc).toContain("href: `/dashboard/my-work/${task.id}`");
    expect(routeExists("/dashboard/my-work/task-014")).toBe(true);
  });

  // 14
  it("offers exactly one control to the queue, not a card control plus a spare link", () => {
    const queueLinks = [...operationsSrc.matchAll(/TODAY_QUEUE_HREF/g)].length;
    // Once where the constant is declared, once where the card is given it.
    expect(queueLinks).toBe(2);
  });

  // 15
  it("gives every rendered control a visible keyboard focus style", () => {
    for (const variant of ["desktop", "tablet", "mobile"] as const) {
      const html = todaysWork(variant);
      for (const tag of html.match(/<a\b[^>]*>/g) ?? []) {
        expect(`${variant}:${tag.includes("focus-visible:")}`).toBe(`${variant}:true`);
      }
    }
  });
});

describe("meetings & proposals module and the operational cards (16-27)", () => {
  // 16
  it("no longer carries a hard-coded count in its source", () => {
    expect(code(overviewCardsSrc)).not.toContain("2 meetings need review");
    expect(code(overviewCardsSrc)).not.toContain("3 proposals awaiting action");
  });

  // 17
  it("no longer carries hard-coded record labels in its source", () => {
    expect(code(overviewCardsSrc)).not.toContain("Solterra discovery · Northwind no-show");
    expect(code(overviewCardsSrc)).not.toContain("1 internal review · 1 viewed · 1 expiring Fri");
  });

  // 18
  it("renders the counts and labels it is given", () => {
    for (const variant of ["desktop", "mobile"] as const) {
      const html = meetingsProposals(variant);
      expect(html).toContain(MEETINGS_SUMMARY.label);
      expect(html).toContain(PROPOSALS_SUMMARY.label);
    }
  });

  // 19
  it("sends the meetings row to the meetings review view", () => {
    expect(anchors(meetingsProposals("desktop"))).toContain("/dashboard/meetings?view=review");
    expect(anchors(meetingsProposals("mobile"))).toContain("/dashboard/meetings?view=review");
  });

  // 20
  it("sends the proposals row to the proposal attention view", () => {
    expect(anchors(meetingsProposals("desktop"))).toContain("/dashboard/proposals?view=attention");
    expect(anchors(meetingsProposals("mobile"))).toContain("/dashboard/proposals?view=attention");
  });

  // 21
  it("gives the two rows distinct accessible names", () => {
    const html = meetingsProposals("desktop");
    expect(html).toContain(`aria-label="${MEETINGS_SUMMARY.ariaLabel}"`);
    expect(html).toContain(`aria-label="${PROPOSALS_SUMMARY.ariaLabel}"`);
    expect(MEETINGS_SUMMARY.ariaLabel).not.toBe(PROPOSALS_SUMMARY.ariaLabel);
  });

  // 22
  it("derives both counts from the same collections the destinations filter", () => {
    const review = state.meetings.filter((m) => MEETING_REVIEW_STATES.includes(m.state));
    const attention = proposalsNeedingAttention(state.proposals);
    expect(review.length).toBe(state.meetings.filter((m) => m.state === "NEEDS REVIEW").length);
    expect(attention.every(needsAttention)).toBe(true);
    expect(operationsSrc).toContain("meetingsNeedingReview(state.meetings)");
    expect(operationsSrc).toContain("proposalsNeedingAttention(state.proposals)");
  });

  // 23
  it("names real seeded records in the sub-line rather than design copy", () => {
    const review = state.meetings.filter((m) => MEETING_REVIEW_STATES.includes(m.state));
    expect(review.length).toBeGreaterThan(0);
    expect(operationsSrc).toContain("`${meeting.name} · ${meeting.company}`");
  });

  // 24
  it("counts in grammatical singular and plural", () => {
    expect(operationsSrc).toContain("function plural(");
    expect(operationsSrc).toContain('count === 1 ? singular : pluralForm');
  });

  // 25
  it("never nests one interactive control inside another", () => {
    for (const variant of ["desktop", "mobile"] as const) {
      expect(hasNestedInteractive(meetingsProposals(variant))).toBe(false);
    }
  });

  // 26
  it("labels each operational disclosure for the list it expands", () => {
    for (const noun of [
      "overdue tasks",
      "waiting-on-client tasks",
      "meetings to prepare",
      "proposals needing attention",
      "leads without next actions",
    ]) {
      expect(operationsSrc).toContain(`noun="${noun}"`);
    }
    expect(operationsSrc).toContain("`Hide ${noun}`");
    expect(operationsSrc).toContain("`Show ${noun}`");
  });

  // 27
  it("labels each operational navigation control for its own destination", () => {
    expect(operationsSrc).toContain("`Open ${noun}`");
    // Five cards must not all say "Open".
    expect(operationsSrc).not.toMatch(/>\s*Open\s*<\/Link>/);
  });
});

describe("derived operational views on the canonical lists (28-35)", () => {
  // 28
  it("accepts the meetings prepare view", () => {
    const parsed = parseFilters("meetings", new URLSearchParams("view=prepare"));
    expect(parsed.view).toBe("prepare");
  });

  // 29
  it("falls back safely when a view value is not one this screen supports", () => {
    expect(parseFilters("meetings", new URLSearchParams("view=nonsense")).view).toBe("review");
    expect(parseFilters("proposals", new URLSearchParams("view=nonsense")).view).toBe("");
    expect(parseFilters("leads", new URLSearchParams("view=nonsense")).view).toBe("");
  });

  // 30
  it("accepts the proposal attention view without touching the proposal state vocabulary", () => {
    expect(parseFilters("proposals", new URLSearchParams("view=attention")).view).toBe("attention");
    const states = SCOPE_DESCRIPTORS.proposals.fields.state as readonly string[];
    expect(states).not.toContain("attention");
  });

  // 31
  it("accepts the leads no-next-action view without touching the lead status vocabulary", () => {
    expect(parseFilters("leads", new URLSearchParams("view=no-next-action")).view).toBe(
      "no-next-action",
    );
    const statuses = SCOPE_DESCRIPTORS.leads.fields.status as readonly string[];
    expect(statuses).not.toContain("no-next-action");
  });

  // 32
  it("selects the same meetings on the Overview and on the prepare view", () => {
    const fromOverview = meetingsToPrepare(state.meetings);
    // The destination filters on the same exported constant.
    expect(meetingsSrc).toContain("prepare: [...MEETING_PREPARE_STATES]");
    expect(fromOverview.every(needsPreparation)).toBe(true);
    expect(fromOverview.length).toBe(
      state.meetings.filter((m) => MEETING_PREPARE_STATES.includes(m.state)).length,
    );
  });

  // 33
  it("selects the same proposals on the Overview and on the attention view", () => {
    expect(proposalsSrc).toContain('viewFilter === "attention" && !needsAttention(proposal)');
    expect(proposalsNeedingAttention(state.proposals).length).toBe(
      state.proposals.filter((p) => PROPOSAL_ATTENTION_STATES.includes(p.state)).length,
    );
  });

  // 34
  it("answers the leads view over the whole dataset, with the Overview's own predicate", () => {
    expect(leadsHandlerSrc).toContain('params.get("view") === "no-next-action"');
    expect(leadsHandlerSrc).toContain("leadIdsWithoutNextAction(");
    expect(leadsDataSrc).toContain("view: leadsView ?? undefined");
    // The predicate itself: a lead covered by an open task is never in the set.
    const ids = LEAD_DIRECTORY.map((l) => l.id);
    const uncovered = new Set(leadIdsWithoutNextAction(state.tasks, ids));
    const covered = state.tasks
      .filter((t) => t.state !== "COMPLETED" && t.leadId)
      .map((t) => t.leadId!);
    for (const id of covered) expect(uncovered.has(id)).toBe(false);
  });

  // 35
  it("drops the derived view from the URL when it is cleared", () => {
    const cleared = serializeFilters("proposals", { ...SCOPE_DESCRIPTORS.proposals.defaults }, null);
    expect(cleared).not.toContain("view=");
    const applied = serializeFilters(
      "proposals",
      { ...SCOPE_DESCRIPTORS.proposals.defaults, view: "attention" },
      null,
    );
    expect(applied).toContain("view=attention");
  });
});

describe("owner identity (36-43)", () => {
  // 36
  it("names the signed-in user once, in one module", () => {
    expect(CURRENT_USER.name).toBe("Marc Bryce");
    expect(CURRENT_USER.initials).toBe("MB");
    expect(CURRENT_USER.email).toBe("marc@gmail.com");
    expect(CURRENT_USER.displayRole).toBe("Owner");
  });

  // 37
  it("shows that identity in the sidebar account footer", () => {
    expect(sidebarSrc).toContain("{CURRENT_USER.initials}");
    expect(sidebarSrc).toContain("{CURRENT_USER.name}");
    expect(sidebarSrc).toContain("role = CURRENT_USER.displayRole");
  });

  // 38
  it("shows the same identity in the tablet and mobile drawers", () => {
    expect(sidebarSrc).toContain("role: CURRENT_USER.displayRole");
    expect(sidebarSrc).toContain("role: `${CURRENT_USER.displayRole} · Sign out`");
    expect(sidebarSrc).not.toContain('"Administrator"');
  });

  // 39
  it("seeds the team member from the same identity", () => {
    const me = state.team.find((m) => m.id === DEMO_CURRENT_USER_ID);
    expect(me).toBeDefined();
    expect(me!.name).toBe(CURRENT_USER.name);
    expect(me!.initials).toBe(CURRENT_USER.initials);
    expect(me!.email).toBe(CURRENT_USER.email);
  });

  // 40
  it("shows the same identity on the settings profile", () => {
    const fields = state.settings.flatMap((group) => group.fields);
    const name = fields.find((f) => f.id === "profileName");
    const role = fields.find((f) => f.id === "profileRole");
    expect(name?.value).toBe(CURRENT_USER.name);
    expect(role?.value).toBe(CURRENT_USER.displayRole);
  });

  // 41
  it("leaves no copy of the previous identity anywhere in product source", () => {
    const stale = PRODUCT_SOURCES.filter(([, src]) => src.includes("Marc Rivera")).map(([f]) => f);
    expect(stale).toEqual([]);
  });

  // 42
  it("changes the label without changing the authority", () => {
    // The permission model keeps its own vocabulary: this user is still a TeamRole
    // "Administrator", which is what the admin gate compares against.
    const me = state.team.find((m) => m.id === DEMO_CURRENT_USER_ID);
    expect(me!.role).toBe("Administrator");
    expect(read("components/command-center/command-dialog.tsx")).toContain(
      'member?.role === "Administrator" ? "admin" : "member"',
    );
    // …and only this user is relabelled.
    expect(displayRoleFor(DEMO_CURRENT_USER_ID, "Administrator")).toBe("Owner");
    expect(displayRoleFor("user-001", "Sales")).toBe("Sales");
  });

  // 43
  it("signs in as the person it then says you are", () => {
    expect(DEMO_EMAIL).toBe(CURRENT_USER.email);
  });
});

describe("responsive layout of the repaired rows (44-51)", () => {
  // 44
  it("lets the title and the related record shrink instead of pushing the row", () => {
    const html = todaysWork("desktop");
    expect((html.match(/min-w-0/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect((html.match(/truncate/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  // 45
  it("keeps the action column at its own width", () => {
    for (const variant of ["desktop", "tablet", "mobile"] as const) {
      expect(todaysWork(variant)).toContain("shrink-0");
    }
  });

  // 46
  it("positions nothing absolutely and overlaps nothing", () => {
    for (const html of [
      todaysWork("desktop"),
      todaysWork("tablet"),
      todaysWork("mobile"),
      meetingsProposals("desktop"),
      meetingsProposals("mobile"),
    ]) {
      expect(html).not.toMatch(/\babsolute\b/);
      expect(html).not.toMatch(/\bfixed\b/);
      expect(html).not.toMatch(/-?translate-/);
    }
  });

  // 47
  it("introduces no arbitrary stacking contexts", () => {
    expect(overviewCardsSrc).not.toMatch(/z-\[\d+\]/);
    expect(operationsSrc).not.toMatch(/z-\[\d+\]/);
  });

  // 48
  it("keeps the touch rows at a touch-sized height", () => {
    expect(todaysWork("tablet")).toContain("min-h-[46px]");
    expect(todaysWork("mobile")).toContain("min-h-[44px]");
    expect(meetingsProposals("mobile")).toContain("min-h-[44px]");
  });

  // 49
  it("truncates the long strings on the Meetings & proposals rows too", () => {
    const html = meetingsProposals("desktop");
    expect(html).toContain("min-w-0");
    expect(html).toContain("truncate");
  });

  // 50
  it("truncates the card headings rather than letting them push the header control out", () => {
    for (const variant of ["desktop", "tablet"] as const) {
      expect(todaysWork(variant)).toMatch(/min-w-0 truncate/);
    }
  });

  // 51
  it("keeps the operational card heading shrinkable beside its count", () => {
    expect(operationsSrc).toContain('className="min-w-0 text-[12px] font-semibold text-cc-t2"');
  });
});

describe("canonical routing (52-63)", () => {
  const CANONICAL = [
    "/",
    "/login",
    "/dashboard",
    "/dashboard/my-work",
    "/dashboard/my-work?view=today",
    "/dashboard/my-work?view=overdue",
    "/dashboard/leads",
    "/dashboard/leads?view=no-next-action",
    "/dashboard/meetings",
    "/dashboard/meetings?view=prepare",
    "/dashboard/meetings?view=review",
    "/dashboard/proposals",
    "/dashboard/proposals?view=attention",
    "/dashboard/settings",
    "/dashboard/team",
    "/proposal/token-123",
  ];

  // 52
  it("writes every internal destination as a root-relative path", () => {
    for (const [file, src] of PRODUCT_SOURCES) {
      for (const m of src.matchAll(/href=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const raw = m[1] ?? m[2] ?? "";
        if (raw === "" || raw.startsWith("#")) continue;
        if (/^(mailto:|tel:|https?:)/.test(raw)) continue;
        expect(`${file}:${raw}`).toBe(`${file}:${raw.startsWith("/") ? raw : "MUST_BE_ROOT_RELATIVE"}`);
      }
    }
  });

  // 53
  it("hard-codes no deployment hostname in product source", () => {
    const banned = /codeoutfitters\.vercel\.app|\.vercel\.app|vercel\.sh|localhost:\d+|127\.0\.0\.1/;
    // lib/routing/public-origin.ts is the one module allowed to name the canonical
    // origin; every other file must still route through the constant it exports.
    const offenders = PRODUCT_SOURCES.filter(
      ([f, src]) => f !== "lib/routing/public-origin.ts" && banned.test(src),
    ).map(([f]) => f);
    expect(offenders).toEqual([]);
  });

  // 54
  it("has no m-dot or second hostname for the same product", () => {
    const offenders = PRODUCT_SOURCES.filter(([, src]) => /https?:\/\/m\./.test(src)).map(([f]) => f);
    expect(offenders).toEqual([]);
  });

  // 55
  it("writes no duplicated slashes into a path", () => {
    for (const [file, src] of PRODUCT_SOURCES) {
      for (const m of src.matchAll(/href=(?:"(\/[^"]*)"|\{`(\/[^`]*)`\})/g)) {
        const raw = m[1] ?? m[2] ?? "";
        expect(`${file}:${raw.includes("//")}`).toBe(`${file}:false`);
      }
    }
  });

  // 56
  it("never doubles the dashboard segment", () => {
    for (const [file, src] of PRODUCT_SOURCES) {
      expect(`${file}:${src.includes("/dashboard/dashboard")}`).toBe(`${file}:false`);
    }
  });

  // 57
  it("has a real route file behind every canonical path", () => {
    for (const href of CANONICAL) expect(`${href}:${routeExists(href)}`).toBe(`${href}:true`);
  });

  // 58
  it("keeps every derived view on the canonical list route, not on a page of its own", () => {
    for (const href of CANONICAL.filter((h) => h.includes("?view="))) {
      const base = href.split("?")[0]!;
      expect(routeExists(base)).toBe(true);
    }
    // No parallel "prepare"/"attention"/"no-next-action" list pages were created. Asked as
    // a question about the tree rather than about routeExists, which would answer yes for
    // any single segment that the sibling [meetingId]/[leadId] route already claims.
    for (const dir of [
      "app/dashboard/meetings/prepare",
      "app/dashboard/proposals/attention",
      "app/dashboard/leads/no-next-action",
    ]) {
      expect(`${dir}:${existsSync(`${repo}${dir}`)}`).toBe(`${dir}:false`);
    }
  });

  // 59
  it("sends View website to the site root, on this origin", () => {
    const shell = read("lib/command-center/ui/sidebar.tsx");
    expect(shell).toContain('href="/"');
  });

  // 60
  it("sends a successful demo sign-in to /dashboard", () => {
    expect(read("app/login/login-form.tsx")).toContain('"/dashboard"');
  });

  // 61
  it("keeps the public proposal route on the same origin as the product", () => {
    expect(routeExists("/proposal/abc")).toBe(true);
  });

  // 62
  it("declares every saved-view scope path as a root-relative dashboard route", () => {
    for (const path of Object.values(SAVED_VIEW_SCOPE_PATHS)) {
      expect(path.startsWith("/dashboard")).toBe(true);
      expect(routeExists(path)).toBe(true);
    }
  });

  // 63
  it("opens no new tab without the opener protection", () => {
    for (const [file, src] of PRODUCT_SOURCES) {
      if (!src.includes('target="_blank"')) continue;
      expect(`${file}:${/rel="[^"]*noopener[^"]*noreferrer/.test(src)}`).toBe(`${file}:true`);
    }
  });
});
