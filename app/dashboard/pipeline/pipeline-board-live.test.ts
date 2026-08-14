// Live Pipeline board — source-surface tests, same convention as
// lib/leads/server-provider.test.ts. Defends the properties that would be a lie if this
// file regressed: no optimistic stage change, a stale PATCH response is dropped, and a
// reason-gated stage never mutates before a reason is collected.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../../", import.meta.url));
const src = readFileSync(`${repo}app/dashboard/pipeline/pipeline-board-live.tsx`, "utf8");

describe("live pipeline board (pipeline-board-live.tsx)", () => {
  it("never updates a card's stage before the PATCH resolves — no optimistic setLeads", () => {
    const beforeFetch = src.slice(src.indexOf("const doMove"), src.indexOf("res = await fetch"));
    expect(beforeFetch).not.toContain("setLeads(");
  });

  it("drops a PATCH response superseded by a later move on the same card", () => {
    expect(src.match(/tokens\.current\.get\(id\) !== myToken/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("routes a reason-required stage through the gate dialog, never straight to doMove", () => {
    const branch = src.slice(src.indexOf("const performMove"), src.indexOf("if (error) {"));
    expect(branch).toContain("REASON_REQUIRED_STATUSES.includes(toStage)");
    expect(branch.indexOf("setGate(")).toBeLessThan(branch.indexOf("void doMove"));
  });

  it("disables a card's own stage and any in-flight card in the move menu", () => {
    expect(src).toContain("disabled: stage === lead.status || move.movingId === lead.id");
  });

  it("groups cards into columns by the lead's real status, never a fixture stage", () => {
    expect(src).toContain("leads.filter((l) => l.status === stage)");
    expect(src).not.toContain("moveOpportunity");
    expect(src).not.toContain("lib/demo/store");
  });

  it("sends the card's own status as expectedStatus on every move", () => {
    expect(src).toContain("status: expectedStatus } = lead");
    expect(src).toContain("status: toStage, expectedStatus, reason, source: \"pipeline\"");
  });

  it("refetches on a stage conflict but never re-issues the original move", () => {
    const branch = src.slice(src.indexOf("if (!res.ok) {"), src.indexOf("const updated = LeadSchema.parse"));
    expect(branch).toContain('body?.error?.code === "stage_conflict"');
    expect(branch).toContain("setAttempt((n) => n + 1)");
    expect(branch).not.toContain("void doMove");
    expect(branch).not.toContain("fetch(");
  });
});
