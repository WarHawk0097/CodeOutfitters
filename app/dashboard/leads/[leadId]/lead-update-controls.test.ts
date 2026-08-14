// Lead detail "Update" controls — source-surface tests, same convention as
// app/dashboard/pipeline/pipeline-board-live.test.ts. Status and owner are two independent
// mutations (see the file's header comment for why); these tests defend that independence —
// the old combined-Save design let change_lead_stage() succeed while the owner UPDATE failed
// (or the reverse) with no honest way to report which one actually happened. Every property
// checked below is a way that ambiguity could quietly come back.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../../../", import.meta.url));
const src = readFileSync(`${repo}app/dashboard/leads/[leadId]/lead-update-controls.tsx`, "utf8");

const saveStatusFn = src.slice(src.indexOf("async function saveStatus"), src.indexOf("async function saveOwner"));
const saveOwnerFn = src.slice(src.indexOf("async function saveOwner"), src.indexOf("return (\n    <div"));

describe("lead detail update controls — status and owner are independent mutations", () => {
  it("renders two independent Save controls, wired to two independent functions", () => {
    expect(src).toContain("onClick={saveStatus}");
    expect(src).toContain("onClick={saveOwner}");
    expect(src).toContain("Save stage");
    expect(src).toContain("Save owner");
  });

  it("[A] a status-only save sends status/expectedStatus and never mentions owner", () => {
    expect(saveStatusFn).toContain("status,");
    expect(saveStatusFn).toContain("expectedStatus: currentStatus,");
    expect(saveStatusFn).not.toContain("owner");
  });

  it("[B] an owner-only save sends only owner and never mentions status", () => {
    expect(saveOwnerFn).toContain("body: JSON.stringify({ owner })");
    expect(saveOwnerFn).not.toContain("status");
    expect(saveOwnerFn).not.toContain("expectedStatus");
  });

  it("[C/D/G/H] status and owner dirty state are computed independently of each other", () => {
    expect(src).toContain("const statusDirty = status !== currentStatus;");
    expect(src).toContain('const ownerDirty = owner !== "" && owner !== currentOwner;');
  });

  it("[C/D/G/H] each Save button is gated only on its own mutation's dirty/saving state", () => {
    const statusButton = src.slice(src.indexOf("disabled={!statusDirty"), src.indexOf("onClick={saveStatus}"));
    expect(statusButton).not.toContain("ownerSaving");
    expect(statusButton).not.toContain("ownerDirty");
    const ownerButton = src.slice(src.indexOf("disabled={!ownerDirty"), src.indexOf("onClick={saveOwner}"));
    expect(ownerButton).not.toContain("statusSaving");
    expect(ownerButton).not.toContain("statusDirty");
  });

  it("[E] on a stage conflict, refreshes without resending and never touches owner state", () => {
    const branch = src.slice(
      src.indexOf('body?.error?.code === "stage_conflict"'),
      src.indexOf("setStatusError(body?.error?.message"),
    );
    expect(branch).toContain("router.refresh()");
    expect(branch).toContain("return;");
    expect(branch).not.toContain("setOwner");
    expect(branch).not.toContain("fetch(");
  });

  it("[F] an owner failure sets ownerError only, leaving statusError untouched", () => {
    expect(saveOwnerFn).toContain("setOwnerError(body?.error?.message");
    expect(saveOwnerFn).not.toContain("setStatusError");
  });

  it("[I] a reason-required status still blocks the status save with no reason", () => {
    expect(saveStatusFn).toContain('if (needsReason && reason.trim() === "") {');
  });

  it("[J] each mutation announces its own distinct result, not one generic message", () => {
    expect(src).toContain('setAnnouncement("Lead stage updated.");');
    expect(src).toContain('setAnnouncement("Lead owner updated.");');
    expect(src).not.toMatch(/setAnnouncement\("Lead updated\."\)/);
  });

  it("re-syncs the status dropdown from the server prop instead of trusting a stale local selection", () => {
    expect(src).toContain("if (currentStatus !== prevCurrentStatus) {");
    expect(src).toContain("setPrevCurrentStatus(currentStatus);");
    expect(src).toContain("setStatus(currentStatus);");
  });

  it("leaves owner untouched by the status conflict path — no expectedOwner concept exists", () => {
    expect(src).not.toContain("expectedOwner");
  });
});
