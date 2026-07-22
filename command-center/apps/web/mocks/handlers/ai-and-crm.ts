// msw handlers for ai.analyze, crm.apply, transcript.marker — api-contracts.json.
import { http, HttpResponse } from "msw";
import { CrmApplyRequestSchema, TranscriptMarkerRequestSchema } from "@command-center/contracts";

export const aiAndCrmHandlers = [
  http.post("/api/meetings/:id/analyze", ({ params }) => {
    return HttpResponse.json({
      meetingId: params.id,
      insights: [
        {
          insightId: "insight-001",
          meetingId: params.id,
          summary: "Client expressed interest in scheduling a follow-up meeting.",
          provenance: {
            sourceMeetingId: params.id,
            transcriptRangeStart: 0,
            transcriptRangeEnd: 4200,
            generatedAt: "2026-01-05T09:00:00.000Z",
            provider: "mock",
            model: "mock-language-model",
            confidence: 0.82,
            reviewStatus: "pending",
            reviewer: null,
            originalValue: "Client expressed interest in scheduling a follow-up meeting.",
            editedValue: null,
            approvedValue: null,
            requiresApproval: true,
          },
        },
      ],
    });
  }),

  http.post("/api/meetings/:id/crm-apply", async ({ request, params }) => {
    const body = await request.json();
    const parsed = CrmApplyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: { code: "invalid_request", message: "idempotencyKey required", status: 422 } },
        { status: 422 },
      );
    }
    return HttpResponse.json({
      meetingId: params.id,
      results: parsed.data.items.map((item) => ({ leadId: item.leadId, status: "applied" as const, error: null })),
    });
  }),

  http.post("/api/segments/:id/markers", async ({ request, params }) => {
    const body = await request.json();
    const parsed = TranscriptMarkerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: { code: "invalid_request", message: "invalid marker", status: 422 } },
        { status: 422 },
      );
    }
    return HttpResponse.json({ markerId: "marker-001", segmentId: params.id, label: parsed.data.label, atMs: parsed.data.atMs });
  }),
];
