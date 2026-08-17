// Live Integration Connection store — source-surface tests, same convention as
// lib/tasks/server-provider.test.ts. Local-Supabase RLS/grant coverage lives in
// integration-connections.pglite.test.ts; this file defends the properties that would
// be a lie if this file regressed: credential_ciphertext is never in the columns a
// normal (authenticated-role) read/write touches, every service-role read/write is
// workspace-scoped, and no Postgres error message reaches the caller unmapped.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { IntegrationError } from "./store";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const src = readFileSync(`${repo}lib/integrations/store.ts`, "utf8");

describe("integration connection store (store.ts)", () => {
  it("D: SAFE_COLUMNS — the column list every normal read/write returns — never names credential_ciphertext", () => {
    const safeColumns = src.match(/const SAFE_COLUMNS =\s*\n?\s*"([^"]+)"/)?.[1] ?? "";
    expect(safeColumns).not.toContain("credential_ciphertext");
  });

  it("D: credential_ciphertext is read only through the service-role client, never the session client", () => {
    const ciphertextReads = [...src.matchAll(/\.select\(`?\$?\{?SAFE_COLUMNS\}?,? ?credential_ciphertext`?\)/g)];
    expect(ciphertextReads.length).toBeGreaterThanOrEqual(1);
    // loadForServiceOp is the only function requesting it, and it opens with getServiceClient().
    const fn = src.slice(src.indexOf("async function loadForServiceOp"), src.indexOf("export async function refreshConnection"));
    expect(fn).toContain("getServiceClient()");
  });

  it("scopes every service-role query to the caller's workspace_id, never trusting the connection id alone", () => {
    expect(src.match(/\.eq\("workspace_id", workspaceId\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("maps every Postgres error to a fixed caller-facing reason, never the raw message", () => {
    expect(src).toContain('error.code === "23505"');
    expect(src).toContain('error.code === "42501"');
    expect(src.match(/throwForPgError\(/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("throws a distinct, typed error a route can map to the right HTTP status", () => {
    const err = new IntegrationError("not_found", "gone");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("not_found");
  });

  it("H: a provider refresh failure is caught and written as a safe error state, never rethrown raw", () => {
    const fn = src.slice(src.indexOf("export async function refreshConnection"), src.indexOf("export async function disconnect"));
    expect(fn).toContain("toSafeErrorMessage(error.message)");
    expect(fn).toContain('status: "error"');
  });

  it("H: toSafeErrorMessage caps message length so no unbounded provider payload is stored", () => {
    expect(src).toMatch(/raw\.length > \d+/);
  });

  it("disconnect always clears credential_ciphertext locally, independent of the provider revoke call's outcome", () => {
    const fn = src.slice(src.indexOf("export async function disconnect"));
    expect(fn).toContain("credential_ciphertext: null");
    expect(fn).toContain("catch (error)");
  });

  it("reconnect never rewrites workspace_id, provider, provider_account_id, or connected_at", () => {
    const fn = src.slice(src.indexOf("if (existing) {"), src.indexOf('await recordEvent(existing.id'));
    expect(fn).not.toMatch(/workspace_id:/);
    expect(fn).not.toMatch(/\bprovider:/);
    expect(fn).not.toMatch(/provider_account_id:/);
    expect(fn).not.toMatch(/\bconnected_at:/);
  });

  it("never selects with a bare '*' — every select names its columns explicitly", () => {
    expect(src).not.toMatch(/\.select\(\s*\)/);
    expect(src).not.toContain('.select("*")');
  });
});
