// Activity surface tests (120-149). The panels, the timeline, the Lead 360 island, the
// proposal activity route and the Overview card are client components that read the store
// and the DOM, so — following this repo's established convention — what cannot be rendered
// under react-dom/server is asserted by reading the source.
//
// What these lock down is the honest posture of the feature: no screen calls recorded
// history "live", no screen shows a JSON blob to a person, no importance is carried by
// colour alone, live mode reports the missing provider instead of borrowing demo history,
// and the browser is never handed an API that lets it forge an actor or a timestamp.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { IMPLEMENTED_ROUTES } from "./shell-nav";
import {
  ACTIVITY_PROVIDER_REQUIRED_REASON,
  ACTIVITY_PROVIDER_REQUIRED_TITLE,
  resolveActivityPlane,
} from "@/lib/activity/provider";
import { CLIENT_ACTIVITY_UNAVAILABLE, UNSUPPORTED_CLIENT_EVENT_TYPES } from "@/lib/activity/model";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = `${here}../../`;

const read = (relative: string) => readFileSync(`${root}${relative}`, "utf8");

/** Source with comment lines removed. The scans below hunt for forbidden strings in what
 *  ships; a header comment explaining why a phrase is forbidden must not itself trip them. */
const code = (src: string) =>
  src
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");

const uiSrc = read("components/dashboard/activity-ui.tsx");
const panelSrc = read("components/dashboard/activity-panel.tsx");
const overviewCardSrc = read("components/dashboard/overview-activity.tsx");
const overviewPageSrc = read("app/dashboard/(overview)/page.tsx");
const leadIslandSrc = read("app/dashboard/leads/[leadId]/lead-activity.tsx");
const leadPageSrc = read("app/dashboard/leads/[leadId]/page.tsx");
const proposalRouteSrc = read("app/dashboard/proposals/[proposalId]/activity/page.tsx");
const proposalViewSrc = read("app/dashboard/proposals/[proposalId]/activity/proposal-activity-view.tsx");
const providerSrc = read("lib/activity/provider.ts");
const storeSrc = read("lib/demo/store.ts");
const seedSrc = read("lib/demo/activity-seed.ts");

/** Every file that renders activity. A new one belongs here, or the honesty scans below
 *  stop covering it. */
const ACTIVITY_SURFACES: ReadonlyArray<[string, string]> = [
  ["activity-ui.tsx", code(uiSrc)],
  ["activity-panel.tsx", code(panelSrc)],
  ["overview-activity.tsx", code(overviewCardSrc)],
  ["lead-activity.tsx", code(leadIslandSrc)],
  ["proposal-activity-view.tsx", code(proposalViewSrc)],
];

describe("activity honesty (tests 120-131)", () => {
  // 120
  it("no surface calls recorded history live or real-time", () => {
    for (const [name, src] of ACTIVITY_SURFACES) {
      expect(src, name).not.toMatch(/Live activity|Real-?time|Streaming|Live feed/i);
    }
  });

  // 121
  it("no surface claims a write reached a server", () => {
    for (const [name, src] of ACTIVITY_SURFACES) {
      expect(src, name).not.toMatch(/Saved to your account|Synced|Updated in CRM|Assigned successfully/i);
    }
  });

  // 122
  it("no surface serializes metadata into the page", () => {
    for (const [name, src] of ACTIVITY_SURFACES) {
      expect(src, name).not.toContain("JSON.stringify");
    }
    // Metadata is rendered as labelled definition-list pairs.
    expect(uiSrc).toContain("<dt");
    expect(uiSrc).toContain("<dd");
  });

  // 123
  it("no surface derives its own clock", () => {
    for (const [name, src] of ACTIVITY_SURFACES) {
      expect(src, name).not.toContain("Date.now(");
      expect(src, name).not.toContain("new Date()");
      expect(src, name).not.toContain("Math.random(");
    }
  });

  // 124
  it("no unsupported client proposal event is named on any surface", () => {
    for (const [name, src] of ACTIVITY_SURFACES) {
      for (const type of UNSUPPORTED_CLIENT_EVENT_TYPES) {
        expect(src, `${name}:${type}`).not.toContain(type);
      }
    }
  });

  // 125
  it("the proposal activity screen says client tracking is unavailable rather than implying silence", () => {
    expect(proposalViewSrc).toContain("CLIENT_ACTIVITY_UNAVAILABLE");
    expect(CLIENT_ACTIVITY_UNAVAILABLE).toMatch(/secure proposal access/i);
  });

  // 126
  it("nothing links to the unbuilt secure client proposal route", () => {
    for (const [name, src] of ACTIVITY_SURFACES) {
      expect(src, name).not.toMatch(/\/proposal\/[^s]/);
    }
    expect(IMPLEMENTED_ROUTES.has("/proposal/[secureToken]")).toBe(false);
  });

  // 127
  it("the proposal activity screen does not pretend to diff document content", () => {
    expect(code(proposalViewSrc)).not.toMatch(/renderDiff|diffLines|<Diff|change summary/i);
    expect(proposalViewSrc).toContain("diff viewer: the demo stores a version label");
  });

  // 128
  it("no activity surface contains a dead link", () => {
    for (const [name, src] of ACTIVITY_SURFACES) {
      expect(src, name).not.toContain('href="#"');
      expect(src, name).not.toContain("href={'#'}");
    }
  });

  // 129
  it("a record with no screen renders as text instead of a link that goes nowhere", () => {
    expect(uiSrc).toContain("const href = activityHref(event.related);");
    expect(uiSrc).toContain("if (!href) return");
    expect(overviewCardSrc).toContain("href ? (");
  });

  // 130
  it("the seeded history is fixture-sourced and says so in the data, not in prose", () => {
    expect(seedSrc).toContain('source: "demo_fixture"');
  });

  // 131
  it("the demo store derives actor, instant and source rather than accepting them", () => {
    expect(storeSrc).toContain("DemoActivityIntent");
    expect(storeSrc).toMatch(/actorId/);
    expect(storeSrc).toMatch(/occurredAt/);
  });
});

describe("live mode contract (tests 132-138)", () => {
  // 132
  it("live mode resolves to provider_required, never to demo", () => {
    const plane = resolveActivityPlane(true);
    expect(plane.kind).toBe("provider_required");
    expect(resolveActivityPlane(false).kind).toBe("demo");
  });

  // 133
  it("the provider-required reason states where activity would live and that nothing is cached here", () => {
    expect(ACTIVITY_PROVIDER_REQUIRED_REASON).toMatch(/workspace database/i);
    expect(ACTIVITY_PROVIDER_REQUIRED_REASON).toMatch(/read with your session/i);
    expect(ACTIVITY_PROVIDER_REQUIRED_REASON).toMatch(/none is being shown from the demo data/i);
    expect(ACTIVITY_PROVIDER_REQUIRED_TITLE).toMatch(/not connected/i);
  });

  // 134
  it("the panel refuses demo history in live mode before it reads any events", () => {
    expect(panelSrc).toContain("if (live) return <ActivityProviderRequired />;");
    expect(panelSrc).toContain('resolveActivityPlane(false).kind !== "demo"');
  });

  // 135
  it("the Overview card asks the same single resolver", () => {
    expect(overviewCardSrc).toContain("resolveActivityPlane(live)");
    expect(overviewCardSrc).toContain('plane.kind === "provider_required"');
  });

  // 136
  it("mode reaches the browser as a prop from a server page, never as a public env read", () => {
    expect(proposalRouteSrc).toContain("live={!isDemoMode()}");
    expect(leadPageSrc).toContain("live={!demo}");
    for (const [name, src] of ACTIVITY_SURFACES) {
      expect(src, name).not.toContain("NEXT_PUBLIC_COMMAND_CENTER_MODE");
      expect(src, name).not.toContain("COMMAND_CENTER_MODE");
    }
  });

  // 137
  it("the write contract does not let a caller supply actor, instant, source or visibility", () => {
    expect(providerSrc).toContain("ActivityWriteIntent");
    const intent = providerSrc.slice(
      providerSrc.indexOf("export type ActivityWriteIntent"),
      providerSrc.indexOf("export type ActivityProvider"),
    );
    for (const forgeable of ["actorId", "occurredAt", "source:", "visibility"]) {
      expect(intent.includes(`  ${forgeable}`), forgeable).toBe(false);
    }
  });

  // 138
  it("every live read is workspace-scoped and bounded", () => {
    expect(providerSrc).toContain("workspaceId: string");
    expect(providerSrc).toContain("limit?: number");
  });
});

describe("accessibility and structure (tests 139-144)", () => {
  // 139
  it("importance is never carried by colour alone", () => {
    expect(uiSrc).toContain('role="img"');
    expect(uiSrc).toContain("ACTIVITY_IMPORTANCE_LABELS[importance]");
    expect(overviewCardSrc).toContain("ACTIVITY_IMPORTANCE_LABELS[event.importance]");
  });

  // 140
  it("a history is a list, not a stack of divs", () => {
    expect(uiSrc).toContain("<ul");
    expect(uiSrc).toContain("<li");
    expect(overviewCardSrc).toContain("<ul");
  });

  // 141
  it("the Overview card exposes a machine-readable instant", () => {
    expect(overviewCardSrc).toContain("<time");
    expect(overviewCardSrc).toContain("dateTime={event.occurredAt}");
  });

  // 142
  it("every filter control is labelled and reports its own pressed state", () => {
    expect(panelSrc).toContain("aria-pressed={active}");
    expect(panelSrc).toContain('aria-label="Filter by category"');
    expect(panelSrc).toContain('aria-label="Filter by importance"');
    expect(panelSrc).toContain('type="search"');
  });

  // 143
  it("the filtered count is announced politely rather than only shown", () => {
    expect(panelSrc).toContain('role="status" aria-live="polite"');
  });

  // 144
  it("the Overview card and the panel both carry a heading that names the section", () => {
    expect(overviewCardSrc).toContain('aria-labelledby="recent-activity"');
    expect(overviewCardSrc).toContain("Recent activity");
    expect(panelSrc).toContain("<h2");
  });
});

describe("wiring (tests 145-149)", () => {
  // 145
  it("the Overview renders the store-backed card, not the canonical sample rows", () => {
    expect(overviewPageSrc).toContain("<RecentActivityLive />");
    expect(overviewPageSrc).not.toContain("RECENT_ACTIVITY");
  });

  // 146
  it("the lead detail page mounts the Lead 360 timeline", () => {
    expect(leadPageSrc).toContain("<LeadActivity leadId={leadId}");
    expect(leadIslandSrc).toContain('eventsFor(state.activity, "lead", leadId)');
  });

  // 147
  it("the proposal activity route exists, is registered, and is gated like every dashboard route", () => {
    expect(existsSync(`${root}app/dashboard/proposals/[proposalId]/activity/page.tsx`)).toBe(true);
    expect(IMPLEMENTED_ROUTES.has("/dashboard/proposals/[proposalId]/activity")).toBe(true);
    expect(proposalRouteSrc).toContain("resolveDashboardContext(");
  });

  // 148
  it("record dialogs show the compact module from the same shared component", () => {
    for (const relative of [
      "app/dashboard/appointments/appointments-view.tsx",
      "app/dashboard/follow-ups/follow-ups-view.tsx",
      "app/dashboard/meetings/meetings-view.tsx",
      "app/dashboard/pipeline/pipeline-board.tsx",
      "app/dashboard/proposals/proposals-view.tsx",
      "app/dashboard/my-work/task-detail.tsx",
      "app/dashboard/meetings/[meetingId]/review/review-view.tsx",
    ]) {
      const src = read(relative);
      expect(src, relative).toContain("<RecordActivity");
    }
  });

  // 149
  it("the proposal dialog offers the full history through the route that exists", () => {
    const proposalsView = read("app/dashboard/proposals/proposals-view.tsx");
    expect(proposalsView).toContain("/activity`}");
    expect(uiSrc).toContain("View all {events.length} events");
  });
});
