import { describe, it, expect, afterEach } from "vitest";
import {
  getProviderAdapter,
  __overrideProviderAdapterForTests,
  __clearProviderAdaptersForTests,
} from "./registry";
import { IntegrationProviderError, type IntegrationProviderAdapter } from "./provider";

describe("integrations/registry", () => {
  afterEach(() => {
    __clearProviderAdaptersForTests();
  });

  it("loads and caches the local_test adapter", async () => {
    const first = await getProviderAdapter("local_test");
    const second = await getProviderAdapter("local_test");
    expect(first).toBe(second);
    expect(first.id).toBe("local_test");
  });

  it("F: an unimplemented provider (google_calendar) fails closed, not silently", async () => {
    await expect(getProviderAdapter("google_calendar")).rejects.toThrow(IntegrationProviderError);
    await expect(getProviderAdapter("gmail")).rejects.toThrow(IntegrationProviderError);
  });

  it("__overrideProviderAdapterForTests swaps the cached instance", async () => {
    const fake: IntegrationProviderAdapter = {
      id: "local_test",
      exchangeCode: async () => {
        throw new Error("unused");
      },
      refresh: async () => {
        throw new Error("unused");
      },
      revoke: async () => {},
      inspect: async () => ({ health: "healthy" }),
    };
    __overrideProviderAdapterForTests("local_test", fake);
    expect(await getProviderAdapter("local_test")).toBe(fake);
  });
});
