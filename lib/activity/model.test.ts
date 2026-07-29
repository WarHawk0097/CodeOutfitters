// Activity domain tests (75-119). Every screen that shows history renders through these
// functions, so this file is where "the timeline is true" is actually enforced: one
// mapping from type to category, a total order that cannot swap between renders, day
// keys that survive a browser in another timezone, and a route for every record kind.
import { describe, expect, it } from "vitest";
import { createSeedState, DEMO_TODAY } from "../demo/seed";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_EVENT_META,
  ACTIVITY_EVENT_TYPES,
  ACTIVITY_IMPORTANCES,
  ACTIVITY_IMPORTANCE_LABELS,
  ACTIVITY_IMPORTANCE_RANK,
  ACTIVITY_RECORD_KINDS,
  ACTIVITY_RECORD_LABELS,
  ACTIVITY_SOURCES,
  ACTIVITY_SOURCE_LABELS,
  ACTIVITY_VISIBILITIES,
  SIGNATURE_ACTIVITY_UNAVAILABLE,
  EMPTY_ACTIVITY_FILTER,
  UNSUPPORTED_CLIENT_EVENT_TYPES,
  actorsIn,
  activityHref,
  categoryCounts,
  categoryOf,
  dayKey,
  dayLabel,
  defaultImportance,
  eventTypeLabel,
  eventsFor,
  eventsOn,
  filterEvents,
  groupByDay,
  isFilterActive,
  isImportant,
  isResolvableLeadId,
  matchesQuery,
  recentImportant,
  sortEvents,
  timeLabel,
  validateActivityConsistency,
  validateStageSequence,
  type ActivityEvent,
  type ActivityEventType,
  type ActivityRecordIndex,
} from "./model";

function event(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  const type: ActivityEventType = overrides.type ?? "note_added";
  return {
    id: "act-0001",
    type,
    category: categoryOf(type),
    source: "demo_fixture",
    visibility: "internal",
    importance: defaultImportance(type),
    actorId: "user-002",
    actorLabel: "Priya Raman",
    occurredAt: "2026-04-20T09:00:00.000Z",
    summary: "A thing happened",
    detail: "",
    related: { kind: "lead", id: "lead-001", label: "Acme" },
    parent: null,
    metadata: [],
    ...overrides,
  };
}

const seeded = createSeedState().activity;

describe("activity taxonomy (tests 75-84)", () => {
  // 75
  it("every event type has category, label and default importance", () => {
    for (const type of ACTIVITY_EVENT_TYPES) {
      const meta = ACTIVITY_EVENT_META[type];
      expect(ACTIVITY_CATEGORIES).toContain(meta.category);
      expect(ACTIVITY_IMPORTANCES).toContain(meta.importance);
      expect(meta.label.trim().length).toBeGreaterThan(0);
    }
  });

  // 76
  it("categoryOf and eventTypeLabel read the same single mapping", () => {
    for (const type of ACTIVITY_EVENT_TYPES) {
      expect(categoryOf(type)).toBe(ACTIVITY_EVENT_META[type].category);
      expect(eventTypeLabel(type)).toBe(ACTIVITY_EVENT_META[type].label);
      expect(defaultImportance(type)).toBe(ACTIVITY_EVENT_META[type].importance);
    }
  });

  // 77
  it("no event type is declared twice", () => {
    expect(new Set(ACTIVITY_EVENT_TYPES).size).toBe(ACTIVITY_EVENT_TYPES.length);
  });

  // 78
  it("deferred signature events are not in the supported set", () => {
    for (const type of UNSUPPORTED_CLIENT_EVENT_TYPES) {
      expect(ACTIVITY_EVENT_TYPES as readonly string[]).not.toContain(type);
      expect(type).toMatch(/signature|signed/);
    }
  });

  // 79
  it("the signature notice claims no certification and no legal effect", () => {
    expect(SIGNATURE_ACTIVITY_UNAVAILABLE).toMatch(/not part of this release/i);
    expect(SIGNATURE_ACTIVITY_UNAVAILABLE).not.toMatch(/live|real-?time|synced|legally/i);
  });

  // 80
  it("every category, importance, source, visibility and record kind has a label", () => {
    for (const category of ACTIVITY_CATEGORIES) {
      expect(ACTIVITY_CATEGORY_LABELS[category]).toBeTruthy();
    }
    for (const importance of ACTIVITY_IMPORTANCES) {
      expect(ACTIVITY_IMPORTANCE_LABELS[importance]).toBeTruthy();
    }
    for (const source of ACTIVITY_SOURCES) expect(ACTIVITY_SOURCE_LABELS[source]).toBeTruthy();
    for (const kind of ACTIVITY_RECORD_KINDS) expect(ACTIVITY_RECORD_LABELS[kind]).toBeTruthy();
    expect(ACTIVITY_VISIBILITIES).toContain("internal");
  });

  // 81
  it("importance rank orders critical above notable above routine", () => {
    expect(ACTIVITY_IMPORTANCE_RANK.critical).toBeLessThan(ACTIVITY_IMPORTANCE_RANK.notable);
    expect(ACTIVITY_IMPORTANCE_RANK.notable).toBeLessThan(ACTIVITY_IMPORTANCE_RANK.routine);
  });

  // 82
  it("importance labels say what the reader should do, not just a colour name", () => {
    expect(ACTIVITY_IMPORTANCE_LABELS.critical).toBe("Needs attention");
    for (const label of Object.values(ACTIVITY_IMPORTANCE_LABELS)) {
      expect(label).not.toMatch(/red|green|blue|amber/i);
    }
  });

  // 83
  it("a cancellation is critical and a plain edit is not", () => {
    expect(defaultImportance("meeting_cancelled")).toBe("critical");
    expect(defaultImportance("lead_updated")).toBe("routine");
    expect(defaultImportance("task_updated")).toBe("routine");
  });

  // 84
  it("demo fixture is a distinct source from provider traffic", () => {
    expect(ACTIVITY_SOURCES).toContain("demo_fixture");
    expect(ACTIVITY_SOURCES).toContain("provider");
    expect(ACTIVITY_SOURCE_LABELS.demo_fixture).not.toBe(ACTIVITY_SOURCE_LABELS.provider);
  });
});

describe("ordering and selection (tests 85-96)", () => {
  // 85
  it("sortEvents puts the newest first", () => {
    const sorted = sortEvents([
      event({ id: "act-0001", occurredAt: "2026-04-01T09:00:00.000Z" }),
      event({ id: "act-0002", occurredAt: "2026-04-03T09:00:00.000Z" }),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(["act-0002", "act-0001"]);
  });

  // 86
  it("sortEvents breaks ties on id so the order is total", () => {
    const same = "2026-04-03T09:00:00.000Z";
    const sorted = sortEvents([
      event({ id: "act-0007", occurredAt: same }),
      event({ id: "act-0009", occurredAt: same }),
      event({ id: "act-0008", occurredAt: same }),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(["act-0009", "act-0008", "act-0007"]);
  });

  // 87
  it("sortEvents does not mutate its input", () => {
    const input = [
      event({ id: "act-0001", occurredAt: "2026-04-01T09:00:00.000Z" }),
      event({ id: "act-0002", occurredAt: "2026-04-03T09:00:00.000Z" }),
    ];
    sortEvents(input);
    expect(input.map((e) => e.id)).toEqual(["act-0001", "act-0002"]);
  });

  // 88
  it("eventsFor includes events that roll up to the record", () => {
    const events = [
      event({ id: "act-0001", related: { kind: "lead", id: "lead-001", label: "Acme" } }),
      event({
        id: "act-0002",
        type: "proposal_created",
        related: { kind: "proposal", id: "PRO-1", label: "PRO-1" },
        parent: { kind: "lead", id: "lead-001", label: "Acme" },
      }),
    ];
    expect(eventsFor(events, "lead", "lead-001").map((e) => e.id)).toEqual([
      "act-0002",
      "act-0001",
    ]);
  });

  // 89
  it("eventsOn excludes roll-ups so a record cannot inherit a whole lead's history", () => {
    const events = [
      event({ id: "act-0001", related: { kind: "lead", id: "lead-001", label: "Acme" } }),
      event({
        id: "act-0002",
        type: "proposal_created",
        related: { kind: "proposal", id: "PRO-1", label: "PRO-1" },
        parent: { kind: "lead", id: "lead-001", label: "Acme" },
      }),
    ];
    expect(eventsOn(events, "lead", "lead-001").map((e) => e.id)).toEqual(["act-0001"]);
  });

  // 90
  it("eventsFor on an unknown id returns nothing rather than everything", () => {
    expect(eventsFor(seeded, "lead", "no-such-lead")).toEqual([]);
  });

  // 91
  it("an empty filter is not active and keeps every event", () => {
    expect(isFilterActive(EMPTY_ACTIVITY_FILTER)).toBe(false);
    expect(filterEvents(seeded, EMPTY_ACTIVITY_FILTER)).toHaveLength(seeded.length);
  });

  // 92
  it("a whitespace-only query does not count as an active filter", () => {
    expect(isFilterActive({ ...EMPTY_ACTIVITY_FILTER, query: "   " })).toBe(false);
  });

  // 93
  it("filters compose: category, actor, importance and query all narrow", () => {
    const sample = seeded.find((e) => e.category === "proposal" && e.actorId);
    expect(sample).toBeDefined();
    const narrowed = filterEvents(seeded, {
      categories: ["proposal"],
      actorId: sample!.actorId,
      importance: sample!.importance,
      query: "",
    });
    expect(narrowed.length).toBeGreaterThan(0);
    for (const e of narrowed) {
      expect(e.category).toBe("proposal");
      expect(e.actorId).toBe(sample!.actorId);
      expect(e.importance).toBe(sample!.importance);
    }
  });

  // 94
  it("matchesQuery searches summary, detail, record label, actor and type label", () => {
    const e = event({
      summary: "Sent version 2",
      detail: "Pricing revised",
      related: { kind: "proposal", id: "PRO-9", label: "Northwind" },
      actorLabel: "Priya Raman",
      type: "proposal_created",
    });
    expect(matchesQuery(e, "version")).toBe(true);
    expect(matchesQuery(e, "pricing")).toBe(true);
    expect(matchesQuery(e, "northwind")).toBe(true);
    expect(matchesQuery(e, "priya")).toBe(true);
    expect(matchesQuery(e, "Proposal created")).toBe(true);
    expect(matchesQuery(e, "zzz")).toBe(false);
  });

  // 95
  it("categoryCounts reports every category, including the empty ones", () => {
    const counts = categoryCounts(seeded);
    expect(Object.keys(counts).sort()).toEqual([...ACTIVITY_CATEGORIES].sort());
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(seeded.length);
  });

  // 96
  it("actorsIn lists only actors that appear, once each, sorted by label", () => {
    const actors = actorsIn(seeded);
    const ids = actors.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(actors.map((a) => a.label)).toEqual(
      [...actors.map((a) => a.label)].sort((a, b) => a.localeCompare(b)),
    );
    for (const actor of actors) {
      expect(seeded.some((e) => e.actorId === actor.id)).toBe(true);
    }
  });
});

describe("time and grouping (tests 97-104)", () => {
  // 97
  it("dayKey slices the ISO string instead of parsing a Date", () => {
    expect(dayKey("2026-04-22T23:30:00.000Z")).toBe("2026-04-22");
    expect(dayKey("2026-04-22T00:10:00.000Z")).toBe("2026-04-22");
  });

  // 98
  it("timeLabel is UTC and says so", () => {
    expect(timeLabel("2026-04-22T14:05:00.000Z")).toBe("14:05 UTC");
  });

  // 99
  it("dayLabel names today and yesterday relative to the fixed demo today", () => {
    expect(dayLabel(DEMO_TODAY, DEMO_TODAY)).toBe("Today");
    expect(dayLabel("2026-04-21", "2026-04-22")).toBe("Yesterday");
  });

  // 100
  it("dayLabel falls back to the date rather than an invented phrase", () => {
    expect(dayLabel("2026-04-02", "2026-04-22")).toBe("2026-04-02");
  });

  // 101
  it("dayLabel crosses a month boundary correctly", () => {
    expect(dayLabel("2026-03-31", "2026-04-01")).toBe("Yesterday");
  });

  // 102
  it("groupByDay returns newest day first with newest event first inside it", () => {
    const groups = groupByDay(seeded, DEMO_TODAY);
    const days = groups.map((g) => g.day);
    expect(days).toEqual([...days].sort().reverse());
    for (const group of groups) {
      expect(group.events.map((e) => e.id)).toEqual(sortEvents(group.events).map((e) => e.id));
    }
  });

  // 103
  it("every seeded event lands in exactly one day group", () => {
    const groups = groupByDay(seeded, DEMO_TODAY);
    const total = groups.reduce((sum, g) => sum + g.events.length, 0);
    expect(total).toBe(seeded.length);
  });

  // 104
  it("grouping an empty history produces no groups rather than an empty day", () => {
    expect(groupByDay([], DEMO_TODAY)).toEqual([]);
  });
});

describe("the Overview cut (tests 105-108)", () => {
  // 105
  it("routine events are not news", () => {
    expect(isImportant(event({ type: "lead_updated" }))).toBe(false);
    expect(isImportant(event({ type: "meeting_cancelled" }))).toBe(true);
  });

  // 106
  it("recentImportant never surfaces a routine event", () => {
    for (const e of recentImportant(seeded, 20)) expect(e.importance).not.toBe("routine");
  });

  // 107
  it("recentImportant is bounded and deterministic", () => {
    const first = recentImportant(seeded, 5);
    expect(first).toHaveLength(5);
    expect(recentImportant(seeded, 5).map((e) => e.id)).toEqual(first.map((e) => e.id));
  });

  // 108
  it("recentImportant puts critical before notable regardless of recency", () => {
    const events = [
      event({ id: "act-0002", type: "lead_created", occurredAt: "2026-04-22T09:00:00.000Z" }),
      event({ id: "act-0001", type: "meeting_cancelled", occurredAt: "2026-04-01T09:00:00.000Z" }),
    ];
    expect(recentImportant(events, 2).map((e) => e.id)).toEqual(["act-0001", "act-0002"]);
  });
});

describe("routes (tests 109-113)", () => {
  // 109
  it("every record kind resolves to a decided destination", () => {
    for (const kind of ACTIVITY_RECORD_KINDS) {
      const href = activityHref({ kind, id: "x", label: "X" });
      expect(href === null || href.startsWith("/dashboard")).toBe(true);
    }
  });

  // 110
  it("a workspace event links nowhere rather than to a route that does not exist", () => {
    expect(activityHref({ kind: "workspace", id: "w", label: "Workspace" })).toBeNull();
  });

  // 111
  it("a store lead id opens the list and a resolvable uuid deep-links", () => {
    expect(activityHref({ kind: "lead", id: "lead-001", label: "Acme" })).toBe("/dashboard/leads");
    const uuid = "3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
    expect(activityHref({ kind: "lead", id: uuid, label: "Acme" })).toBe(`/dashboard/leads/${uuid}`);
  });

  // 112
  it("isResolvableLeadId accepts only a uuid", () => {
    expect(isResolvableLeadId("3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d")).toBe(true);
    expect(isResolvableLeadId("lead-001")).toBe(false);
    expect(isResolvableLeadId("")).toBe(false);
  });

  // 113
  it("a proposal event opens the proposal activity route that exists", () => {
    expect(activityHref({ kind: "proposal", id: "PRO-2031", label: "PRO-2031" })).toBe(
      "/dashboard/proposals/PRO-2031/activity",
    );
    expect(activityHref({ kind: "task", id: "task-001", label: "T" })).toBe(
      "/dashboard/my-work/task-001",
    );
  });
});

describe("consistency checks (tests 114-119)", () => {
  const index: ActivityRecordIndex = {
    createdAt: new Map([["lead-001", "2026-04-01T09:00:00.000Z"]]),
    ids: new Map([["lead", new Set(["lead-001"])]]),
  };

  // 114
  it("a clean history reports no problems", () => {
    expect(validateActivityConsistency([event({ type: "lead_created" })], index)).toEqual([]);
  });

  // 115
  it("a duplicate id is a problem", () => {
    const problems = validateActivityConsistency([event(), event()], index);
    expect(problems.some((p) => p.includes("duplicate event id"))).toBe(true);
  });

  // 116
  it("a category that disagrees with its type is a problem", () => {
    const problems = validateActivityConsistency([event({ category: "system" })], index);
    expect(problems.some((p) => p.includes("claims category"))).toBe(true);
  });

  // 117
  it("an event pointing at a record that does not exist is a problem", () => {
    const problems = validateActivityConsistency(
      [event({ related: { kind: "lead", id: "lead-999", label: "Ghost" } })],
      index,
    );
    expect(problems.some((p) => p.includes("missing lead lead-999"))).toBe(true);
  });

  // 118
  it("an event before its record existed is a problem", () => {
    const problems = validateActivityConsistency(
      [event({ occurredAt: "2026-03-01T09:00:00.000Z" })],
      index,
    );
    expect(problems.some((p) => p.includes("predates its record"))).toBe(true);
  });

  // 119
  it("a lead's stage history must move forward or land on a terminal status", () => {
    expect(validateStageSequence(["Contacted", "Appt Scheduled"])).toEqual([]);
    expect(validateStageSequence(["Appt Scheduled", "Contacted"]).length).toBeGreaterThan(0);
    expect(validateStageSequence(["Contacted", "Discovery Done", "Lost"])).toEqual([]);
  });
});
