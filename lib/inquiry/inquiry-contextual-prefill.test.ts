import { describe, expect, it } from "vitest";
import {
  CASE_STUDY_PREFILLS,
  INDUSTRY_LABELS,
  SECURITY_TOPIC,
  SERVICE_LABELS,
  caseStudyPrefill,
  industryPrefill,
  securityPrefill,
  servicePrefill,
} from "./inquiry-contextual-prefill";

describe("servicePrefill", () => {
  it("maps every known service id to its label", () => {
    for (const id of Object.keys(SERVICE_LABELS)) {
      const p = servicePrefill(id);
      expect(p.selectedService).toBe(SERVICE_LABELS[id as keyof typeof SERVICE_LABELS]);
      expect(p.sourceSection).toBe(`services-card-${id}`);
      expect(p.selectedIndustry).toBeUndefined();
    }
  });
  it("returns an undefined label for an unknown id (no crash, no guess)", () => {
    expect(servicePrefill("nope").selectedService).toBeUndefined();
  });
});

describe("industryPrefill", () => {
  it("maps every known industry id to its label", () => {
    for (const id of Object.keys(INDUSTRY_LABELS)) {
      const p = industryPrefill(id);
      expect(p.selectedIndustry).toBe(INDUSTRY_LABELS[id as keyof typeof INDUSTRY_LABELS]);
      expect(p.sourceSection).toBe(`industries-card-${id}`);
    }
  });
});

describe("caseStudyPrefill", () => {
  it("maps each case study to its title and related service", () => {
    for (const [id, entry] of Object.entries(CASE_STUDY_PREFILLS)) {
      const p = caseStudyPrefill(id);
      expect(p.selectedCaseStudy).toBe(entry.caseStudy);
      expect(p.selectedService).toBe(entry.service);
      expect(p.sourceSection).toBe(`case-studies-card-${id}`);
    }
  });
  it("returns empty for an unknown case study id", () => {
    expect(caseStudyPrefill("nope")).toEqual({});
  });
});

describe("securityPrefill", () => {
  it("carries a stable topic value, not a page path", () => {
    expect(securityPrefill().selectedService).toBe(SECURITY_TOPIC);
    expect(SECURITY_TOPIC).not.toMatch(/^\//);
  });
});
