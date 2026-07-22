import { describe, expect, it } from "vitest";
import { MockObjectStorageProvider } from "./object-storage";

describe("MockObjectStorageProvider", () => {
  it("defaults to NOT_CONFIGURED", () => {
    expect(new MockObjectStorageProvider().status).toBe("NOT_CONFIGURED");
  });

  it("round-trips a put/get", async () => {
    const provider = new MockObjectStorageProvider();
    await provider.putObject("key-1", new Uint8Array([1, 2, 3]));
    const result = await provider.getObject("key-1");
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("returns null for a missing key", async () => {
    const result = await new MockObjectStorageProvider().getObject("missing");
    expect(result).toBeNull();
  });

  it("does not leak state between instances", async () => {
    const first = new MockObjectStorageProvider();
    await first.putObject("key-1", new Uint8Array([9]));
    const second = new MockObjectStorageProvider();
    expect(await second.getObject("key-1")).toBeNull();
  });
});
