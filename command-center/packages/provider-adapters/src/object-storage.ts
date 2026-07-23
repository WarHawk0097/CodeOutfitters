// ObjectStorageProvider — work/PROVIDER-ADAPTER-PLAN.md row 6
// Shape: putObject, getObject, getSignedUrl. Mock strategy: in-memory fake store.
import type { ProviderStatus } from "./types";

export interface ObjectStorageProvider {
  status: ProviderStatus;
  putObject(key: string, bytes: Uint8Array): Promise<{ key: string }>;
  getObject(key: string): Promise<Uint8Array | null>;
  getSignedUrl(key: string): Promise<string>;
}

export class MockObjectStorageProvider implements ObjectStorageProvider {
  status: ProviderStatus = "NOT_CONFIGURED";
  private readonly store = new Map<string, Uint8Array>();

  async putObject(key: string, bytes: Uint8Array): Promise<{ key: string }> {
    this.store.set(key, bytes);
    return { key };
  }

  async getObject(key: string): Promise<Uint8Array | null> {
    return this.store.get(key) ?? null;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `https://mock.storage.test/${key}?signed=1`;
  }
}
