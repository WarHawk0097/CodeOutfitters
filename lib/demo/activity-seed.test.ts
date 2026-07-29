// Seeded activity history (tests 58-77).
//
// The fixtures are hand-authored history, and hand-authored history is exactly the kind of
// thing that drifts into lying: a review dated before the proposal it reviews, an event on a
// record that was renamed away, a client action nobody can actually observe. These tests are
// the gate that stops a broken fixture reaching a screen.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createSeedState, DEMO_TODAY } from "./seed";
import {
  UNSUPPORTED_CLIENT_EVENT_TYPES,
  categoryOf,
  eventsFor,
  sortEvents,
  validateActivityConsistency,
  type ActivityEvent,
  type ActivityRecordIndex,
  type ActivityEventType,
  type ActivityRecordKind,
} from "@/lib/activity/model";

const CREATION_TYPES: ReadonlySet<ActivityEventType> = new Set([
  "lead_created",
  "task_created",
  "meeting_scheduled",
  "proposal_created",
  "follow_up_created",
  "appointment_booked",
  "opportunity_created",
]);

const here = fileURLToPath(new URL(".", import.meta.url));
const state = createSeedState();
const events = state.activity;

/** Every record the seed contains, so an event that points at something that is not there
 *  fails here rather than rendering as a link to nowhere. */
function buildIndex(): ActivityRecordIndex {
  const ids = new Map<ActivityRecordKind, ReadonlySet<string>>();
  ids.set("lead", new Set(state.opportunities.map((o) => o.leadId)));
  ids.set("opportunity", new Set(state.opportunities.map((o) => o.id)));
  ids.set("meeting", new Set(state.meetings.map((m) => m.id)));
  ids.set("proposal", new Set(state.proposals.map((p) => p.id)));
  ids.set("task", new Set(state.tasks.map((t) => t.id)));
  ids.set("followUp", new Set(state.followUps.map((f) => f.id)));
  ids.set("appointment", new Set(state.appointments.map((a) => a.id)));
  ids.set("email", new Set(state.emails.map((e) => e.id)));
  return { createdAt: new Map(), ids };
}

function typesOf(list: readonly ActivityEvent[]): Set<string> {
  return new Set(list.map((event) => event.type));
}

describe("seeded activity history (tests 58-77)", () => {
  // 58
  it("the demo opens with a history rather than an empty timeline", () => {
    expect(events.length).toBeGreaterThan(30);
  });

  // 59
  it("every seeded event is internally consistent and points at a record that exists", () => {
    expect(validateActivityConsistency(events, buildIndex())).toEqual([]);
  });

  // 60
  it("ids are act-NNNN and unique", () => {
    for (const event of events) expect(event.id).toMatch(/^act-\d{4}$/);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });

  // 61
  it("the stored order is newest first, so a reader sees the latest thing first", () => {
    expect(events.map((event) => event.id)).toEqual(sortEvents(events).map((event) => event.id));
  });

  // 62
  it("nothing in the seeded history happens after the demo's today", () => {
    for (const event of events) {
      expect(event.occurredAt.slice(0, 10) <= DEMO_TODAY, event.id).toBe(true);
    }
  });

  // 63
  it("every seeded event is marked as fixture, not as something a user just did", () => {
    for (const event of events) expect(event.source).toBe("demo_fixture");
  });

  // 64
  it("a category is never authored by hand — it is always the one its type implies", () => {
    for (const event of events) expect(event.category).toBe(categoryOf(event.type));
  });

  // 65
  it("no seeded event claims a client action the system cannot observe", () => {
    const claimed = events.filter((event) =>
      (UNSUPPORTED_CLIENT_EVENT_TYPES as readonly string[]).includes(event.type),
    );
    expect(claimed).toEqual([]);
  });

  // 66
  it("at least three leads have a real history, not one lead carrying the demo", () => {
    const leadIds = new Set(
      events.flatMap((event) => {
        const refs = [event.related, event.parent].filter(Boolean);
        return refs.filter((ref) => ref!.kind === "lead").map((ref) => ref!.id);
      }),
    );
    expect(leadIds.size).toBeGreaterThanOrEqual(3);
    for (const leadId of leadIds) {
      expect(eventsFor(events, "lead", leadId).length, leadId).toBeGreaterThanOrEqual(2);
    }
  });

  // 67
  it("a narrated lead's history opens with the lead being created", () => {
    const leadIds = new Set(
      events.filter((event) => event.type === "lead_created").map((event) => event.related.id),
    );
    expect(leadIds.size).toBeGreaterThanOrEqual(3);
    for (const leadId of leadIds) {
      const history = eventsFor(events, "lead", leadId);
      expect(history[history.length - 1]?.type, leadId).toBe("lead_created");
    }
  });

  // 68
  it("at least two meetings and two proposals carry history", () => {
    const meetings = new Set(
      events.filter((e) => e.related.kind === "meeting").map((e) => e.related.id),
    );
    const proposals = new Set(
      events.filter((e) => e.related.kind === "proposal").map((e) => e.related.id),
    );
    expect(meetings.size).toBeGreaterThanOrEqual(2);
    expect(proposals.size).toBeGreaterThanOrEqual(2);
  });

  // 69
  it("the Release 1 tasks, a follow-up, an appointment and email activity are all represented", () => {
    const kinds = new Set(events.map((event) => event.related.kind));
    expect(kinds.has("task")).toBe(true);
    expect(kinds.has("followUp")).toBe(true);
    expect(kinds.has("appointment")).toBe(true);
    expect(kinds.has("email")).toBe(true);
  });

  // 70
  it("a task's seeded history matches the state the task is actually in", () => {
    for (const task of state.tasks) {
      const history = eventsFor(events, "task", task.id);
      if (history.length === 0) continue;
      const types = typesOf(history);
      expect(types.has("task_created"), task.id).toBe(true);
      // A completed task says so; an open one is never narrated as finished.
      expect(types.has("task_completed"), task.id).toBe(task.state === "COMPLETED");
    }
  });

  // 71
  it("a proposal is never narrated past the state it is in", () => {
    for (const proposal of state.proposals) {
      const types = typesOf(eventsFor(events, "proposal", proposal.id));
      if (types.size === 0) continue;
      if (proposal.state === "DRAFT") {
        expect(types.has("proposal_review_requested"), proposal.id).toBe(false);
        expect(types.has("proposal_review_approved"), proposal.id).toBe(false);
      }
      if (proposal.state === "INTERNAL REVIEW") {
        expect(types.has("proposal_review_approved"), proposal.id).toBe(false);
      }
    }
  });

  // 72
  it("no event about a record predates the event that created that record", () => {
    const creation = new Map<string, string>();
    for (const event of events) {
      // The types that create the record they point at — mirroring CREATION_TYPES in
      // lib/activity/model.ts. Matching on a "_created" suffix instead reads
      // proposal_access_link_created as the birth of the proposal, which it is not: the
      // link is created, the proposal existed long before it.
      if (CREATION_TYPES.has(event.type)) {
        creation.set(`${event.related.kind}:${event.related.id}`, event.occurredAt);
      }
    }
    for (const event of events) {
      const born = creation.get(`${event.related.kind}:${event.related.id}`);
      if (!born) continue;
      expect(event.occurredAt >= born, `${event.id} ${event.type}`).toBe(true);
    }
  });

  // 73
  it("a child record's history never starts before its lead arrived", () => {
    const arrival = new Map<string, string>();
    for (const event of events) {
      if (event.type === "lead_created") arrival.set(event.related.id, event.occurredAt);
    }
    for (const event of events) {
      const parent = event.parent;
      if (!parent || parent.kind !== "lead") continue;
      const born = arrival.get(parent.id);
      if (!born) continue;
      expect(event.occurredAt >= born, `${event.id} on ${parent.id}`).toBe(true);
    }
  });

  // 74
  it("every event names an actor from the team, never an anonymous or forged one", () => {
    const team = new Set(state.team.map((member) => member.id));
    for (const event of events) {
      if (event.actorId === null) continue;
      expect(team.has(event.actorId), event.id).toBe(true);
    }
  });

  // 75
  it("metadata is labelled pairs, never a blob a user would have to read as JSON", () => {
    for (const event of events) {
      for (const pair of event.metadata) {
        expect(pair.label.trim(), event.id).not.toBe("");
        expect(pair.value.trim(), event.id).not.toBe("");
        expect(pair.value, event.id).not.toMatch(/^[[{]/);
      }
    }
  });

  // 76
  it("the id counter continues past the seeded history so a live write cannot collide", () => {
    expect(state.nextId).toBe(events.length + 1);
  });

  // 77
  it("no fixture reads a wall clock or a random source", () => {
    // The demo replays identically on every visit, which is what makes every fixed instant
    // above assertable. A Date.now() here would quietly break all of it.
    const source = readFileSync(`${here}activity-seed.ts`, "utf8")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join("\n");
    expect(source).not.toMatch(/Date\.now\(/);
    expect(source).not.toMatch(/Math\.random\(/);
    expect(source).not.toMatch(/new Date\(\)/);
  });
});
