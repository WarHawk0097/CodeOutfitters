// Contract-compliance smoke test for msw handlers, run via msw/node (no network).
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import {
  LeadsListResponseSchema,
  LoginResponseSchema,
  MeetingsListResponseSchema,
  MeetingsConsentResponseSchema,
  AiAnalyzeResponseSchema,
  CrmApplyResponseSchema,
  TranscriptMarkerResponseSchema,
  ProposalsCreateResponseSchema,
  ProposalsValidateResponseSchema,
  ProposalsReviewResponseSchema,
  ProposalsPdfResponseSchema,
  ProposalsSendResponseSchema,
  ClientProposalViewSchema,
  ClientAcceptResponseSchema,
} from "@command-center/contracts";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { handlers } from "./handlers";
import { LEAD_DATASET, computeStatusFacets } from "./handlers/leads";
import { LEAD_FIXTURES } from "./fixtures/leads";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("msw handlers (Phase 2 mock layer)", () => {
  it("GET /api/leads returns a leads.list-compliant envelope", async () => {
    const res = await fetch("/api/leads");
    const body = await res.json();
    expect(() => LeadsListResponseSchema.parse(body)).not.toThrow();
  });

  // Evidence-integrity regression tests. A previous revision returned an eleven-entry
  // status `facetCounts` map summing to 137 against a claimed total of 128 — impossible
  // for a mutually exclusive breakdown. Schema validation passed anyway, because the
  // schema constrains shape, not arithmetic. These assert the arithmetic.
  it("GET /api/leads facet counts equal counts computed from the served dataset", async () => {
    const res = await fetch("/api/leads");
    const body = await res.json();
    expect(body.facetCounts).toEqual(computeStatusFacets(LEAD_DATASET));
  });

  it("GET /api/leads mutually exclusive status facets sum to the total lead count", async () => {
    const res = await fetch("/api/leads");
    const body = await res.json();
    const sum = Object.values(body.facetCounts as Record<string, number>).reduce(
      (a, b) => a + b,
      0,
    );
    // Facets describe the whole matched set, so they sum to `total`, not to the page.
    // `rows` is one page of that set — this previously asserted total === rows.length,
    // which only held while the handler ignored pagination entirely.
    expect(sum).toBe(body.total);
    expect(body.total).toBe(LEAD_DATASET.length);
    expect(body.rows.length).toBe(10);
  });

  it("GET /api/leads page 1 is the canonical C-D05 rows", async () => {
    const res = await fetch("/api/leads");
    const body = await res.json();
    // qualifiedAt is a derived milestone timestamp; the canonical fields are unchanged.
    expect(body.rows.map(({ qualifiedAt, ...rest }: Record<string, unknown>) => rest)).toEqual(
      LEAD_FIXTURES,
    );
  });

  it("GET /api/leads facet keys are all real statuses present in the dataset", async () => {
    const res = await fetch("/api/leads");
    const body = await res.json();
    const datasetStatuses = new Set(LEAD_DATASET.map((l) => l.status));
    for (const key of Object.keys(body.facetCounts)) {
      expect(datasetStatuses.has(key as never)).toBe(true);
    }
  });

  it("GET /api/leads paginates and filters against the same stable dataset", async () => {
    const page2 = await (await fetch("/api/leads?page=2&pageSize=10")).json();
    expect(page2.rows).toHaveLength(10);
    expect(page2.total).toBe(LEAD_DATASET.length);
    // Same request twice returns the same rows — the dataset does not shift between calls.
    const again = await (await fetch("/api/leads?page=2&pageSize=10")).json();
    expect(again.rows).toEqual(page2.rows);

    const won = await (await fetch("/api/leads?status=Won")).json();
    expect(won.total).toBe(LEAD_DATASET.filter((l) => l.status === "Won").length);
  });

  it("leads handler source asserts no unsupported canonical authority for facet values", async () => {
    // Resolved from cwd (apps/web) rather than import.meta.url: the jsdom test
    // environment reports a non-file:// import.meta.url, so fileURLToPath throws.
    const src = await readFile(resolve("mocks/handlers/leads.ts"), "utf8");
    // The canonical popover is a SERVICE facet (AI Automation 21 / Workflow Automation
    // 17 / Web Applications 14), documented in work/CANONICAL-FACET-REFERENCE.md. It
    // defines no status counts, so no status count may claim canonical provenance.
    expect(src).not.toMatch(/canonical popover values/i);
    expect(src).not.toMatch(/facetCounts:\s*\{\s*\n?\s*New:\s*\d+/);
  });

  it("POST /api/auth/login returns a auth.login-compliant response", async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "sales@codeoutfitters.test", password: "x" }),
    });
    const body = await res.json();
    expect(() => LoginResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/auth/login with locked email returns 423", async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "locked@example.test", password: "x" }),
    });
    expect(res.status).toBe(423);
  });

  it("GET /api/meetings returns a meetings.list-compliant envelope", async () => {
    const res = await fetch("/api/meetings");
    const body = await res.json();
    expect(() => MeetingsListResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/meetings/:id/consent returns a meetings.consent-compliant response", async () => {
    const res = await fetch("/api/meetings/meeting-001/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ granted: true }),
    });
    const body = await res.json();
    expect(() => MeetingsConsentResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/meetings/:id/analyze returns an ai.analyze-compliant response", async () => {
    const res = await fetch("/api/meetings/meeting-001/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: "meeting-001" }),
    });
    const body = await res.json();
    expect(() => AiAnalyzeResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/meetings/:id/crm-apply returns a crm.apply-compliant response", async () => {
    const res = await fetch("/api/meetings/meeting-001/crm-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingId: "meeting-001",
        idempotencyKey: "idem-001",
        approvedBy: "user-001",
        // lead-001 is Dana Whitfield, status "New" (mocks/fixtures/leads.ts). This
        // previously read value:"Qualified" and still passed, because the assertion
        // only checks response shape — it never compared against the fixture.
        items: [{ leadId: "lead-001", field: "status", value: "Contacted" }],
      }),
    });
    const body = await res.json();
    expect(() => CrmApplyResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/segments/:id/markers returns a transcript.marker-compliant response", async () => {
    const res = await fetch("/api/segments/segment-001/markers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "key moment", atMs: 1200 }),
    });
    const body = await res.json();
    expect(() => TranscriptMarkerResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/proposals returns a proposals.create-compliant response", async () => {
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: "lead-001" }),
    });
    const body = await res.json();
    expect(() => ProposalsCreateResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/proposals/:id/validate returns a proposals.validate-compliant response", async () => {
    const res = await fetch("/api/proposals/proposal-001/validate", { method: "POST" });
    const body = await res.json();
    expect(() => ProposalsValidateResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/proposals/:id/review returns a proposals.review-compliant response", async () => {
    const res = await fetch("/api/proposals/proposal-001/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approverId: "user-002", ownerId: "user-001" }),
    });
    const body = await res.json();
    expect(() => ProposalsReviewResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/proposals/:id/pdf returns a proposals.pdf-compliant response", async () => {
    const res = await fetch("/api/proposals/proposal-001/pdf", { method: "POST" });
    const body = await res.json();
    expect(() => ProposalsPdfResponseSchema.parse(body)).not.toThrow();
  });

  it("POST /api/proposals/:id/send returns a proposals.send-compliant response", async () => {
    const res = await fetch("/api/proposals/proposal-001/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idempotencyKey: "idem-002", confirmed: true }),
    });
    const body = await res.json();
    expect(() => ProposalsSendResponseSchema.parse(body)).not.toThrow();
  });

  it("GET /api/proposal/:token returns a client.view-compliant response", async () => {
    const res = await fetch("/api/proposal/token-001");
    const body = await res.json();
    expect(() => ClientProposalViewSchema.parse(body)).not.toThrow();
  });

  it("POST /api/proposal/:token/accept returns a client.accept-compliant response", async () => {
    const res = await fetch("/api/proposal/token-001/accept", { method: "POST" });
    const body = await res.json();
    expect(() => ClientAcceptResponseSchema.parse(body)).not.toThrow();
  });
});
