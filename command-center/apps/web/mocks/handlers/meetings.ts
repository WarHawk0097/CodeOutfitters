// msw handlers for meetings.list / meetings.consent — api-contracts.json.
// transcript.stream (WS) is not handled here — it is mocked via
// packages/provider-adapters MockTranscriptionProvider, not msw HTTP interception.
import { http, HttpResponse } from "msw";
import { MEETING_FIXTURES } from "../fixtures/meetings";

export const meetingsHandlers = [
  http.get("/api/meetings", () => {
    return HttpResponse.json({ rows: MEETING_FIXTURES, total: MEETING_FIXTURES.length, facetCounts: {} });
  }),

  http.post("/api/meetings/:id/consent", async ({ request, params }) => {
    const body = (await request.json()) as { granted: boolean };
    const meeting = MEETING_FIXTURES.find((m) => m.id === params.id);
    if (!meeting) {
      return HttpResponse.json(
        { error: { code: "not_found", message: "meeting not found", status: 404 } },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      meetingId: meeting.id,
      consentGiven: body.granted,
      recordedAt: "2026-01-05T09:00:00.000Z",
    });
  }),
];
