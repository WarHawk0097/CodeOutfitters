// recordActivity() failure semantics (PART 5 of the Activity producer work order): an activity
// row describes something that already happened, so a failed insert must never surface as a
// failed request. This is the one thing every producer (Tasks, Saved Views) relies on emit.ts
// to guarantee, so it is tested once here instead of once per producer.
import { describe, expect, it, vi, afterEach } from "vitest";
import { recordActivity } from "./emit";
import { serverActivityProvider } from "./server-provider";
import type { ActivityWriteIntent } from "./provider";

vi.mock("./server-provider", () => ({ serverActivityProvider: { record: vi.fn() } }));

const intent: ActivityWriteIntent = {
  workspaceId: "ws-1",
  operation: "task_created",
  summary: "Task created — Test",
  target: { kind: "task", id: "task-1", label: "Test" },
};

afterEach(() => {
  vi.mocked(serverActivityProvider.record).mockReset();
});

describe("recordActivity (emit.ts)", () => {
  it("resolves normally when the insert succeeds", async () => {
    vi.mocked(serverActivityProvider.record).mockResolvedValue({} as never);
    await expect(recordActivity(intent)).resolves.toBeUndefined();
  });

  it("never throws when the insert fails — the mutation it describes must still stand", async () => {
    vi.mocked(serverActivityProvider.record).mockRejectedValue(new Error("insert failed"));
    await expect(recordActivity(intent)).resolves.toBeUndefined();
  });

  it("logs the failure server-side instead of swallowing it silently", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(serverActivityProvider.record).mockRejectedValue(new Error("insert failed"));
    await recordActivity(intent);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("task_created"), expect.any(Error));
    spy.mockRestore();
  });
});
