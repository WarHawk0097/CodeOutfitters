// Source-attribution context builder (spec §5 shared capability "source
// attribution", §8 source fields, §19 analytics). Derives WHERE an inquiry came
// from — page, path, section, campaign, locale/timezone/viewport — from the
// browser at render time. Captures zero PII: only page/URL metadata the user's
// own navigation already exposed.
//
// Every form variant feeds its output into the request payload so one lead has
// consistent attribution regardless of which placement submitted it.
import type { FormVariant, ViewportClass } from "./inquiry-schema";

// The slice of the request contract this builder owns. The form controller
// merges this with the user-entered fields to form the full payload.
export type InquirySourceContext = {
  inquirySource: string;
  sourcePage: string;
  sourcePath: string;
  sourceSection?: string;
  selectedService?: string;
  selectedIndustry?: string;
  selectedCaseStudy?: string;
  campaign?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    referrer?: string;
  };
  clientContext: {
    locale?: string;
    timezone?: string;
    viewportClass?: ViewportClass;
  };
};

export type BuildSourceContextInput = {
  formVariant: FormVariant;
  // Human page name the placement knows about (e.g. "Services", "Contact").
  pageName: string;
  // Optional in-page section / selected entity the placement is contextual to.
  sourceSection?: string;
  selectedService?: string;
  selectedIndustry?: string;
  selectedCaseStudy?: string;
};

// Tailwind-ish breakpoints: <768 mobile, <1024 tablet, else desktop. Kept here
// so the reported viewportClass matches the responsive layout the user saw.
function viewportClass(width: number): ViewportClass {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function readCampaign(search: URLSearchParams, referrer: string) {
  const clean = (v: string | null) => {
    const t = v?.trim();
    return t ? t : undefined;
  };
  const campaign = {
    utmSource: clean(search.get("utm_source")),
    utmMedium: clean(search.get("utm_medium")),
    utmCampaign: clean(search.get("utm_campaign")),
    utmTerm: clean(search.get("utm_term")),
    utmContent: clean(search.get("utm_content")),
    referrer: clean(referrer) ?? undefined,
  };
  const hasAny =
    UTM_KEYS.some((k) => search.get(k)) || Boolean(campaign.referrer);
  return hasAny ? campaign : undefined;
}

// Builds the attribution context from `window`. Safe to call only in the
// browser; guarded so an accidental SSR call yields a minimal, valid context
// rather than throwing.
export function buildSourceContext(
  input: BuildSourceContextInput,
): InquirySourceContext {
  const base: InquirySourceContext = {
    inquirySource: input.formVariant,
    sourcePage: input.pageName,
    sourcePath: "/",
    sourceSection: input.sourceSection,
    selectedService: input.selectedService,
    selectedIndustry: input.selectedIndustry,
    selectedCaseStudy: input.selectedCaseStudy,
    clientContext: {},
  };

  if (typeof window === "undefined") {
    return base; // ponytail: SSR fallback; the real capture runs on submit in the browser.
  }

  const url = new URL(window.location.href);
  return {
    ...base,
    sourcePath: url.pathname,
    campaign: readCampaign(url.searchParams, document.referrer),
    clientContext: {
      locale: navigator.language || undefined,
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
      viewportClass: viewportClass(window.innerWidth),
    },
  };
}
