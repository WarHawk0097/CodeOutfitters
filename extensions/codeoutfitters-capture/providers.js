// Provider-neutral meeting capture contracts. DOM selectors stay in adapters;
// the assembler and capture session consume only normalized caption events.
const PROVIDER_IDS = Object.freeze({
  GOOGLE_MEET: "google_meet",
  MICROSOFT_TEAMS: "microsoft_teams",
  ZOOM: "zoom",
  WEBEX: "webex",
  GENERIC_BROWSER: "generic_browser",
});

function normalizedCaptionEvent(provider, providerMeetingId, caption) {
  return {
    provider,
    providerMeetingId: providerMeetingId || null,
    speaker: caption?.speaker ?? null,
    text: String(caption?.text || "").trim(),
    observedAt: caption?.observedAt || new Date().toISOString(),
    isFinal: caption?.isFinal === true,
    source: caption?.source || "browser_captions",
  };
}

function createAdapter(id, matches, capabilities) {
  return Object.freeze({
    id,
    capabilities: Object.freeze({ ...capabilities }),
    detectMeeting(url = location.href) {
      return matches.some((pattern) => pattern.test(url));
    },
    getMeetingIdentity(url = location.href) {
      try { return new URL(url).pathname.replace(/^\/+|\/+$/g, "") || null; } catch { return null; }
    },
    normalizeCaption(providerMeetingId, caption) { return normalizedCaptionEvent(id, providerMeetingId, caption); },
  });
}

const PROVIDER_ADAPTERS = Object.freeze([
  createAdapter(PROVIDER_IDS.GOOGLE_MEET, [/^https:\/\/meet\.google\.com\//i], {
    supportsBrowserCaptions: true, supportsSpeakerLabels: true, supportsBrowserAudio: true,
  }),
  createAdapter(PROVIDER_IDS.MICROSOFT_TEAMS, [/teams\.microsoft\.com/i, /teams\.live\.com/i], {
    supportsBrowserCaptions: true, supportsSpeakerLabels: true, supportsBrowserAudio: true,
  }),
  createAdapter(PROVIDER_IDS.ZOOM, [/zoom\.us/i], {
    supportsBrowserCaptions: true, supportsSpeakerLabels: true, supportsBrowserAudio: true,
  }),
  createAdapter(PROVIDER_IDS.WEBEX, [/webex\.com/i], {
    supportsBrowserCaptions: true, supportsSpeakerLabels: true, supportsBrowserAudio: true,
  }),
  createAdapter(PROVIDER_IDS.GENERIC_BROWSER, [/.*/], {
    supportsBrowserCaptions: false, supportsSpeakerLabels: false, supportsBrowserAudio: true,
  }),
]);

function detectProvider(url = location.href) {
  return PROVIDER_ADAPTERS.find((adapter) => adapter.detectMeeting(url)) || PROVIDER_ADAPTERS.at(-1);
}

if (typeof globalThis !== "undefined") {
  globalThis.CodeOutfittersProviders = { PROVIDER_IDS, PROVIDER_ADAPTERS, detectProvider, normalizedCaptionEvent };
}
