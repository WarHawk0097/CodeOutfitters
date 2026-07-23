// Provider adapter interfaces. All 8 categories DEFERRED_PENDING_SELECTION
// per work/PHASE0-DECISION-CLOSURE.md section 6. No SDKs installed.
export type ProviderStatus = "NOT_CONFIGURED" | "CONFIGURED_UNVERIFIED" | "CONFIGURED_VERIFIED";

export const PROVIDER_CATEGORIES = [
  "EmailProvider",
  "CalendarProvider",
  "MeetingPlatformProvider",
  "TranscriptionProvider",
  "LanguageModelProvider",
  "ObjectStorageProvider",
  "PdfRenderingProvider",
  "ProposalAcceptanceProvider",
] as const;
