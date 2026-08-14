// Lead detail "Update" control — source-surface tests, same convention as
// app/dashboard/pipeline/pipeline-board-live.test.ts. Defends the properties that would be
// a lie if this file regressed: every status save asserts expectedStatus, a stage_conflict
// never resends the same patch, and the dropdown re-syncs to the server's real status
// instead of keeping a stale selection on screen.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../../../", import.meta.url));
const src = readFileSync(`${repo}app/dashboard/leads/[leadId]/lead-update-controls.tsx`, "utf8");

describe("lead detail update controls (lead-update-controls.tsx)", () => {
  it("sends the loaded status as expectedStatus whenever status is changing", () => {
    const branch = src.slice(src.indexOf("const patch:"), src.indexOf("if (owner !=="));
    expect(branch).toContain("patch.status = status;");
    expect(branch).toContain("patch.expectedStatus = currentStatus;");
  });

  it("on a stage conflict, refreshes and never resends the same patch", () => {
    const branch = src.slice(src.indexOf('body?.error?.code === "stage_conflict"'), src.indexOf("setError(body?.error?.message"));
    expect(branch).toContain("router.refresh()");
    expect(branch).toContain("return;");
    expect(branch).not.toContain("fetch(");
  });

  it("re-syncs the status dropdown from the server prop instead of trusting a stale local selection", () => {
    expect(src).toContain("if (currentStatus !== prevCurrentStatus) {");
    expect(src).toContain("setPrevCurrentStatus(currentStatus);");
    expect(src).toContain("setStatus(currentStatus);");
  });

  it("leaves owner-only saves untouched by the status conflict path — no expectedOwner", () => {
    expect(src).not.toContain("expectedOwner");
  });
});
