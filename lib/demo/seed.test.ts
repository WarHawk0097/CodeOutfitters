// Regression: live mode must never generate demo lead data.
//
// The reported crash was command-dialog.tsx -> lib/search/demo-index.ts -> lib/demo/seed.ts,
// where LEAD_DIRECTORY used to be an eager `const = generateLeads()` — evaluated the instant any
// of those modules was imported, live mode or not, which is exactly what assertMockDataAllowed()
// exists to forbid. generateLeads() is now reached only through getLeadDirectory(), called lazily
// and only from demo-mode code paths. These tests spy on the real generateLeads() (not a stub) so
// a regression that reintroduces an eager call, anywhere in the import graph below, fails here
// instead of in a live workspace.
import { beforeEach, describe, expect, it, vi } from "vitest";

const generateLeadsSpy = vi.hoisted(() => vi.fn());

vi.mock("../../mocks/fixtures/generate-leads", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../mocks/fixtures/generate-leads")>();
  return {
    ...actual,
    generateLeads: (...args: Parameters<typeof actual.generateLeads>) => {
      generateLeadsSpy(...args);
      return actual.generateLeads(...args);
    },
  };
});

beforeEach(() => {
  generateLeadsSpy.mockClear();
});

// 1. Importing seed.ts alone must not build the lead directory.
it("importing lib/demo/seed does not call generateLeads()", async () => {
  await import("./seed");
  expect(generateLeadsSpy).not.toHaveBeenCalled();
});

// 2. getLeadDirectory() is lazy: only the call site should trigger generation, and only once.
it("getLeadDirectory() calls generateLeads() on first use only", async () => {
  const { getLeadDirectory } = await import("./seed");
  expect(generateLeadsSpy).not.toHaveBeenCalled();
  getLeadDirectory();
  expect(generateLeadsSpy).toHaveBeenCalledTimes(1);
  getLeadDirectory();
  expect(generateLeadsSpy).toHaveBeenCalledTimes(1);
});

// 3. The reported crash chain: importing the live command dialog must not reach generateLeads().
it("importing the command dialog (the reported crash site) does not call generateLeads()", async () => {
  await import("../../components/command-center/command-dialog");
  expect(generateLeadsSpy).not.toHaveBeenCalled();
});

// 4. The other live-reachable import chain: lib/command-center/data.ts -> demo-data.ts, used by
//    11 real dashboard routes including Lead Detail.
it("importing the command-center demo-data module does not call generateLeads()", async () => {
  await import("../command-center/demo-data");
  expect(generateLeadsSpy).not.toHaveBeenCalled();
});

// 5. Every other real-app module that reads the lead directory: none may do so at import time.
describe("no real-app consumer generates the lead directory merely by being imported", () => {
  const modules = [
    "../../lib/search/demo-index",
    "../../lib/demo/actions",
    "../../app/dashboard/email-activity/email-activity-view",
    "../../app/dashboard/pipeline/pipeline-board",
    "../../app/dashboard/appointments/appointments-view",
    "../../app/dashboard/meetings/meetings-view",
    "../../app/dashboard/proposals/proposals-view",
    "../../app/dashboard/follow-ups/follow-ups-view",
    "../../components/dashboard/overview-operations",
  ];

  for (const path of modules) {
    it(path, async () => {
      await import(path);
      expect(generateLeadsSpy).not.toHaveBeenCalled();
    });
  }
});
