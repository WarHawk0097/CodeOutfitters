const CODEOUTFITTERS_PROVIDER_IDS = Object.freeze([
  "google_meet",
  "microsoft_teams",
  "zoom",
  "webex",
  "generic_browser",
]);

function isMeetingProviderId(value) {
  return typeof value === "string" && CODEOUTFITTERS_PROVIDER_IDS.includes(value);
}

function normalizeCaptionEvent(event) {
  if (!event || !isMeetingProviderId(event.provider)) return null;
  const providerMeetingId = typeof event.providerMeetingId === "string" ? event.providerMeetingId.trim() : "";
  const text = typeof event.text === "string" ? event.text.trim() : "";
  const observedAt = typeof event.observedAt === "string" ? event.observedAt : "";
  if (!providerMeetingId || !text || !Number.isFinite(Date.parse(observedAt))) return null;
  if (typeof event.isFinal !== "boolean") return null;
  if (event.source !== "browser_captions" && event.source !== "provider_transcript") return null;
  return Object.freeze({
    provider: event.provider,
    providerMeetingId,
    speaker: typeof event.speaker === "string" && event.speaker.trim() ? event.speaker.trim() : null,
    text,
    observedAt,
    isFinal: event.isFinal,
    source: event.source,
  });
}

if (typeof globalThis !== "undefined") {
  globalThis.CodeOutfittersContracts = { CODEOUTFITTERS_PROVIDER_IDS, isMeetingProviderId, normalizeCaptionEvent };
}
