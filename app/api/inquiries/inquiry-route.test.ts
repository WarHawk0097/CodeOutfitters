import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";

// Control the repository behavior without a database. The route constructs
// `new SupabaseInquiryRepository()`; we replace that class with a fake.
const state = vi.hoisted(() => ({
  persist: async () => ({
    leadId: "lead-1",
    submissionId: "sub-1",
    status: "received" as const,
    replay: false,
  }),
}));

vi.mock("@/lib/inquiry/server/supabase-inquiry-repository", () => ({
  SupabaseInquiryRepository: class {
    persist = () => state.persist();
    markEmailEvent = async () => {};
  },
}));

import { POST } from "./route";
import { idempotencyConflict } from "@/lib/inquiry/server/inquiry-errors";

function jsonReq(body: unknown, contentType = "application/json"): Request {
  return new Request("http://localhost/api/inquiries", {
    method: "POST",
    headers: { "content-type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: randomUUID(),
    formVariant: "contact_full",
    inquirySource: "contact_full",
    sourcePage: "Contact",
    sourcePath: "/contact",
    firstName: "Ada",
    workEmail: "ada@example.com",
    businessName: "Lovelace Ltd",
    workflowDescription: "Automate the weekly reporting pipeline end to end.",
    consent: { privacyAccepted: true, marketingOptIn: false },
    clientContext: { viewportClass: "desktop" },
    ...overrides,
  };
}

describe("POST /api/inquiries", () => {
  beforeEach(() => {
    state.persist = async () => ({
      leadId: "lead-1",
      submissionId: "sub-1",
      status: "received" as const,
      replay: false,
    });
  });

  it("201 for a newly persisted inquiry", async () => {
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, status: "received", leadId: "lead-1" });
    expect(res.headers.get("x-correlation-id")).toBeTruthy();
  });

  it("200 for an idempotent replay", async () => {
    state.persist = async () => ({
      leadId: "lead-1",
      submissionId: "sub-1",
      status: "received" as const,
      replay: true,
    });
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(200);
  });

  it("409 on idempotency conflict", async () => {
    state.persist = async () => {
      throw idempotencyConflict();
    };
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("duplicate");
  });

  it("422 on schema validation failure (missing required field)", async () => {
    const bad = validBody();
    delete (bad as Record<string, unknown>).workflowDescription;
    const res = await POST(jsonReq(bad));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("validation");
    expect(body.error.fields).toBeTruthy();
  });

  it("422 rejects an unknown field (strict)", async () => {
    const res = await POST(jsonReq(validBody({ isAdmin: true })));
    expect(res.status).toBe(422);
  });

  it("400 on honeypot fill", async () => {
    const res = await POST(jsonReq(validBody({ _hp: "i am a bot" })));
    expect(res.status).toBe(400);
  });

  it("400 on malformed JSON", async () => {
    const res = await POST(jsonReq("{not json", "application/json"));
    expect(res.status).toBe(400);
  });

  it("415 on unsupported content type", async () => {
    const res = await POST(jsonReq(validBody(), "text/plain"));
    expect(res.status).toBe(415);
  });

  it("413 on oversized body", async () => {
    const huge = JSON.stringify(validBody({ workflowDescription: "a".repeat(70_000) }));
    const res = await POST(jsonReq(huge));
    expect(res.status).toBe(413);
  });

  it("never leaks internals on unexpected error (safe 500)", async () => {
    state.persist = async () => {
      throw new Error("secret db dsn postgres://user:pw@host");
    };
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("postgres://");
    expect(text).not.toContain("secret db dsn");
  });
});
