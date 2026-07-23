// Privacy-safe inquiry analytics (spec §19). Emits the lifecycle events the
// inquiry engine needs WITHOUT ever carrying PII: no email, phone, free-text
// (workflowDescription/desiredOutcome), or filenames leave this module. Only
// structural dimensions (formVariant, sourcePage, step index, error code,
// file count/size) are allowed.
//
// Transport: pushes to window.dataLayer (GTM convention) when the user has
// accepted cookies, matching the existing consent gate
// (localStorage['co_cookie_consent'] === 'accepted', see components/
// cookie-consent.tsx + consent-gated.tsx). If consent is absent/declined it is
// a no-op — analytics fails closed, never buffers PII.
import type { FormVariant } from "./inquiry-schema";
import type { InquiryErrorCode } from "./inquiry-schema";

export type InquiryAnalyticsEvent =
  | "inquiry_popup_eligible"
  | "inquiry_popup_opened"
  | "inquiry_popup_dismissed"
  | "inquiry_form_started"
  | "inquiry_step_completed"
  | "inquiry_file_selected"
  | "inquiry_submit_attempted"
  | "inquiry_submit_succeeded"
  | "inquiry_submit_failed"
  | "appointment_cta_shown"
  | "appointment_started";

// The ONLY fields allowed on the wire. Deliberately excludes every free-text /
// contact field. `errorCode` is the safe taxonomy code, never a raw message.
export type InquiryAnalyticsPayload = {
  formVariant?: FormVariant;
  sourcePage?: string;
  step?: number;
  errorCode?: InquiryErrorCode;
  fileCount?: number;
  // Aggregate size in bytes — a number, never a filename.
  totalFileBytes?: number;
};

const CONSENT_KEY = "co_cookie_consent";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false; // storage blocked (private mode / policy) -> fail closed
  }
}

// Belt-and-suspenders: strip anything that isn't an allow-listed key, so a
// future caller can never accidentally widen the payload with PII.
const ALLOWED_KEYS: readonly (keyof InquiryAnalyticsPayload)[] = [
  "formVariant",
  "sourcePage",
  "step",
  "errorCode",
  "fileCount",
  "totalFileBytes",
];

function sanitize(payload: InquiryAnalyticsPayload): InquiryAnalyticsPayload {
  const clean: InquiryAnalyticsPayload = {};
  for (const key of ALLOWED_KEYS) {
    const value = payload[key];
    if (value !== undefined) {
      (clean as Record<string, unknown>)[key] = value;
    }
  }
  return clean;
}

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function trackInquiryEvent(
  event: InquiryAnalyticsEvent,
  payload: InquiryAnalyticsPayload = {},
): void {
  if (!hasAnalyticsConsent()) return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event, ...sanitize(payload) });
}
