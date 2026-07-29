import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readJsonBody, MAX_BODY_BYTES, hashIp, buildRequestContext } from "./inquiry-request-context";
import { SupabaseInquiryRepository } from "./supabase-inquiry-repository";
import { InquiryError, notConfigured } from "./inquiry-errors";

function req(body: string, contentType = "application/json"): Request {
  return new Request("http://localhost/api/inquiries", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

describe("readJsonBody", () => {
  it("rejects a non-JSON content type (415)", async () => {
    const r = await readJsonBody(req("{}", "text/plain"));
    expect(r).toEqual({ status: 415 });
  });

  it("accepts JSON and returns the raw text", async () => {
    const r = await readJsonBody(req('{"a":1}'));
    expect(r).toEqual({ text: '{"a":1}' });
  });

  it("rejects an oversized body (413)", async () => {
    const big = JSON.stringify({ x: "a".repeat(MAX_BODY_BYTES + 100) });
    const r = await readJsonBody(req(big));
    expect(r).toEqual({ status: 413 });
  });
});

describe("request context (privacy-preserving)", () => {
  it("hashes IPs deterministically and does not return the raw IP", () => {
    const h = hashIp("203.0.113.7");
    expect(h).toBe(hashIp("203.0.113.7"));
    expect(h).not.toContain("203.0.113.7");
  });

  it("derives a correlation id + ip hash from headers", () => {
    const r = new Request("http://localhost/api/inquiries", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.9, 10.0.0.1", "user-agent": "UA" },
    });
    const ctx = buildRequestContext(r);
    expect(ctx.correlationId).toMatch(/[0-9a-f-]{36}/);
    expect(ctx.ipHash).toBe(hashIp("198.51.100.9"));
    expect(ctx.userAgent).toBe("UA");
  });
});

describe("server-only environment validation", () => {
  const saved = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SECRET_KEY,
  };
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });
  afterEach(() => {
    if (saved.url) process.env.NEXT_PUBLIC_SUPABASE_URL = saved.url;
    if (saved.secret) process.env.SUPABASE_SECRET_KEY = saved.secret;
  });

  it("fails closed when the secret key is missing (never falls back to anon)", () => {
    expect(() => new SupabaseInquiryRepository()).toThrow(InquiryError);
  });

  it("reports the unconfigured backend honestly, without promising a retry", () => {
    let thrown: unknown;
    try {
      new SupabaseInquiryRepository();
    } catch (err) {
      thrown = err;
    }
    const error = thrown as InquiryError;
    expect(error).toBeInstanceOf(InquiryError);
    // 503, not 500: retrying an unconfigured backend can never succeed.
    expect(error.status).toBe(503);
    expect(error.code).toBe("server_error");
    expect(error.publicMessage).toBe(notConfigured().publicMessage);
    expect(error.publicMessage).not.toMatch(/try again/i);
    // And the message names no variable, key or internal detail.
    for (const leak of ["SUPABASE", "SECRET", "anon", "service", "process.env"]) {
      expect(error.publicMessage, leak).not.toContain(leak);
    }
  });

  it("constructs against a configured backend", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "test-secret-key";
    expect(() => new SupabaseInquiryRepository()).not.toThrow();
  });
});
