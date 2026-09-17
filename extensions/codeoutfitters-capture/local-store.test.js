import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(__dirname, "local-store.js"), "utf8");
const context = {};
new Function("globalThis", source)(context);
const { createMemoryCaptureStore } = context.CodeOutfittersLocalStore;

describe("durable local capture store contract", () => {
  it("deduplicates events and preserves sequence order across recovery", async () => {
    const store = createMemoryCaptureStore();
    await store.saveSession({ id: "local-1", status: "active", createdAt: new Date().toISOString() });
    await store.enqueueEvent("local-1", { sequence: 2, text: "second" });
    await store.enqueueEvent("local-1", { sequence: 1, text: "first" });
    await store.enqueueEvent("local-1", { sequence: 1, text: "duplicate" });
    expect((await store.listPendingEvents("local-1")).map((entry) => entry.text)).toEqual(["first", "second"]);
    expect((await store.listRecoverableSessions()).map((session) => session.id)).toEqual(["local-1"]);
  });

  it("marks only acknowledged sequences and cleans after completion", async () => {
    const store = createMemoryCaptureStore();
    await store.saveSession({ id: "local-2", status: "active", createdAt: new Date().toISOString() });
    await store.enqueueEvent("local-2", { sequence: 1, text: "kept" });
    await store.enqueueEvent("local-2", { sequence: 2, text: "pending" });
    await store.markSynced("local-2", [1]);
    expect((await store.listPendingEvents("local-2")).map((entry) => entry.sequence)).toEqual([2]);
    await store.saveSession({ id: "local-2", status: "complete", createdAt: new Date().toISOString() });
    await store.removeSession("local-2");
    expect(await store.getSession("local-2")).toBeNull();
  });

  it("uses IndexedDB and bounded retention constants in the production implementation", () => {
    expect(source).toContain("indexedDBFactory.open");
    expect(context.CodeOutfittersLocalStore.MAX_EVENTS).toBe(20_000);
    expect(context.CodeOutfittersLocalStore.MAX_EVENT_BYTES).toBe(8 * 1024 * 1024);
  });
});
