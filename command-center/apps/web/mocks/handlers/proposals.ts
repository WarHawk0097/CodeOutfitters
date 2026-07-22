// msw handlers for proposals.create/validate/review/pdf/send — api-contracts.json.
import { http, HttpResponse } from "msw";
import { ProposalsSendRequestSchema, ProposalsReviewRequestSchema } from "@command-center/contracts";

export const proposalsHandlers = [
  http.post("/api/proposals", async ({ request }) => {
    const body = (await request.json()) as { leadId: string };
    return HttpResponse.json({
      id: "proposal-001",
      leadId: body.leadId,
      status: "draft",
      validationStatus: "PENDING",
      pdfGeneratedAt: null,
      createdAt: "2026-01-05T09:00:00.000Z",
    });
  }),

  http.post("/api/proposals/:id/validate", ({ params }) => {
    return HttpResponse.json({ proposalId: params.id, validationStatus: "READY", issues: [] });
  }),

  http.post("/api/proposals/:id/review", async ({ request, params }) => {
    const body = await request.json();
    const parsed = ProposalsReviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: { code: "approver_must_differ_from_owner", message: "approver must differ from owner", status: 422 } },
        { status: 422 },
      );
    }
    return HttpResponse.json({
      proposalId: params.id,
      status: "approved",
      approvedBy: parsed.data.approverId,
      approvedAt: "2026-01-05T09:00:00.000Z",
    });
  }),

  http.post("/api/proposals/:id/pdf", ({ params }) => {
    return HttpResponse.json({
      proposalId: params.id,
      pdfUrl: "https://mock.storage.test/proposals/proposal-mock-001.pdf",
      generatedAt: "2026-01-05T09:00:00.000Z",
    });
  }),

  http.post("/api/proposals/:id/send", async ({ request, params }) => {
    const body = await request.json();
    const parsed = ProposalsSendRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: { code: "confirmation_required", message: "must CONFIRM & SEND", status: 422 } },
        { status: 422 },
      );
    }
    return HttpResponse.json({ proposalId: params.id, status: "sent", sentAt: "2026-01-05T09:05:00.000Z" });
  }),
];
