// Typed contextual-prefill mapping (Work Order D contextual repair). One place
// that turns a STABLE placement id (service / industry / case-study / security
// topic) into the human-readable attribution label(s) the shared inquiry engine
// carries: selectedService / selectedIndustry / selectedCaseStudy.
//
// These labels are free text on the wire (InquirySubmissionRequestSchema treats
// them as optionalText), NEVER database enums. This module is the single layer
// where display copy is attached to a stable id, so a CTA passes an id and the
// engine gets a consistent label — no arbitrary copy encoded at the DB layer.

export type ContextualPrefill = {
  selectedService?: string;
  selectedIndustry?: string;
  selectedCaseStudy?: string;
  sourceSection?: string;
};

// Services page card ids -> canonical service label (matches the cards).
export const SERVICE_LABELS = {
  whatsapp: "WhatsApp Lead Automation",
  email: "Email Workflow Automation",
  support: "Support Chat Systems",
  booking: "Booking & Scheduling Bots",
  invoice: "Invoice & Order Automation",
  custom: "Custom Integration Builds",
} as const;
export type ServiceId = keyof typeof SERVICE_LABELS;

export function servicePrefill(id: string): ContextualPrefill {
  const label = SERVICE_LABELS[id as ServiceId];
  return { selectedService: label, sourceSection: `services-card-${id}` };
}

// Industries page ids -> canonical industry label.
export const INDUSTRY_LABELS = {
  "home-services": "Home Services / HVAC",
  healthcare: "Healthcare Clinics / Med-Spas",
  "real-estate": "Real Estate",
  ecommerce: "E-commerce / Retail",
  "professional-services": "Professional Services",
  education: "Education / Training",
  "local-service": "Local Service Businesses",
} as const;
export type IndustryId = keyof typeof INDUSTRY_LABELS;

export function industryPrefill(id: string): ContextualPrefill {
  const label = INDUSTRY_LABELS[id as IndustryId];
  return { selectedIndustry: label, sourceSection: `industries-card-${id}` };
}

// Case-study ids -> { case-study title, related service where authoritative }.
// The related service is the one the case study actually implemented, so an
// inquiry from a case study carries both the story and the mapped system.
export const CASE_STUDY_PREFILLS = {
  "real-estate-whatsapp": {
    caseStudy: "How a Real Estate Agency Doubled Lead Response Rate",
    service: "WhatsApp Lead Automation",
  },
  "ecommerce-invoice": {
    caseStudy: "Invoice Processing Reduced from 4 Hours to 8 Minutes Daily",
    service: "Invoice & Order Automation",
  },
  "healthcare-booking": {
    caseStudy: "Medical Clinic Eliminates 90% of Phone-Based Scheduling",
    service: "Booking & Scheduling Bots",
  },
  "legal-intake": {
    caseStudy: "Law Firm Cuts Client Intake From Half a Week to Minutes",
    service: "Custom Integration Builds",
  },
  "logistics-dispatch": {
    caseStudy: "Logistics Company Automates Dispatch in Six Days",
    service: "Custom Integration Builds",
  },
  "hvac-whatsapp": {
    caseStudy: "HVAC Company Triples Review Volume With an Automated Follow-Up",
    service: "WhatsApp Lead Automation",
  },
} as const;
export type CaseStudyId = keyof typeof CASE_STUDY_PREFILLS;

export function caseStudyPrefill(id: string): ContextualPrefill {
  const entry = CASE_STUDY_PREFILLS[id as CaseStudyId];
  if (!entry) return {};
  return {
    selectedCaseStudy: entry.caseStudy,
    selectedService: entry.service,
    sourceSection: `case-studies-card-${id}`,
  };
}

// Security placement carries a stable topic instead of only the page path, so
// every security inquiry is attributed to the same reviewable context value.
export const SECURITY_TOPIC = "Security & Compliance Review";

export function securityPrefill(): ContextualPrefill {
  return { selectedService: SECURITY_TOPIC, sourceSection: "security-inline" };
}
