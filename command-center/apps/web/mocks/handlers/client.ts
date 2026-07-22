// msw handlers for client.view / client.accept — api-contracts.json.
// Client-facing: response never carries AI provenance/review fields.
import { http, HttpResponse } from "msw";

export const clientHandlers = [
  http.get("/api/proposal/:token", () => {
    return HttpResponse.json({
      proposalId: "proposal-001",
      clientName: "Acme Co",
      lineItems: [{ description: "Automation setup", amount: 1000 }],
      total: 1000,
      status: "sent",
    });
  }),

  http.post("/api/proposal/:token/accept", () => {
    return HttpResponse.json({
      proposalId: "proposal-001",
      acceptedAt: "2026-01-05T09:10:00.000Z",
      auditEvent: "proposal_accepted",
    });
  }),
];
