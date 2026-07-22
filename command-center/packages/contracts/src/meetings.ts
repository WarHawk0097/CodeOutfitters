// meetings.list, meetings.consent, transcript.stream, transcript.marker — api-contracts.json
// transcript.stream is WS /meetings/:id/transcript, providerErrors: delayed/reconnecting/failed, "REQUIRES PROVIDER"
// Phase 2 mocks this as a canned fixture sequence, not a live socket (see MeetingPlatformProvider mock).
import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, listEnvelopeSchema } from "./shared";

export const MeetingSchema = z.object({
  id: IdSchema,
  title: z.string(),
  scheduledAt: IsoDateTimeSchema,
  consentGiven: z.boolean(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const MeetingsListResponseSchema = listEnvelopeSchema(MeetingSchema);

export const MeetingsConsentRequestSchema = z.object({
  granted: z.boolean(),
});
export const MeetingsConsentResponseSchema = z.object({
  meetingId: IdSchema,
  consentGiven: z.boolean(),
  recordedAt: IsoDateTimeSchema,
});

export const TranscriptProviderErrorSchema = z.enum(["delayed", "reconnecting", "failed"]);

export const TranscriptSegmentSchema = z.object({
  segmentId: IdSchema,
  meetingId: IdSchema,
  speaker: z.string(),
  text: z.string(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().nonnegative(),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

// WS payload envelope for a mocked transcript.stream frame.
export const TranscriptStreamFrameSchema = z.union([
  z.object({ type: z.literal("segment"), segment: TranscriptSegmentSchema }),
  z.object({ type: z.literal("provider_error"), error: TranscriptProviderErrorSchema }),
]);
export type TranscriptStreamFrame = z.infer<typeof TranscriptStreamFrameSchema>;

export const TranscriptMarkerRequestSchema = z.object({
  label: z.string().min(1),
  atMs: z.number().int().nonnegative(),
});
export const TranscriptMarkerResponseSchema = z.object({
  markerId: IdSchema,
  segmentId: IdSchema,
  label: z.string(),
  atMs: z.number().int().nonnegative(),
});
