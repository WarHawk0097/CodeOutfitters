// Booking progressive-disclosure tests (13-22). The booking flow is a client
// component that touches document/createPortal, so its disclosure invariants are
// asserted at the source level (this repo's convention for DOM/router-bound
// files). The key guarantee: nothing of Step 2 — not even a reserved band — is
// rendered until Step 1 is complete, and Step 2 re-hides if Step 1 goes invalid.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const src = readFileSync(`${here}../../components/contact-booking-flow.tsx`, "utf8");

describe("booking progressive disclosure (tests 13-22)", () => {
  // 13
  it("Step 2 is active only once Step 1 is left", () => {
    expect(src).toContain("const step2Active = step !== 'project_details'");
  });

  // 14
  it("the Step 2 portal only mounts when Step 2 is active", () => {
    expect(src).toContain("portalTarget && step2Active && createPortal(step2Content, portalTarget)");
  });

  // 15
  it("no inactive placeholder band survives (Step 2 is fully absent before Step 1)", () => {
    expect(src).not.toContain("unlocks after Step 1");
    expect(src).not.toContain("step2Inactive");
  });

  // 16
  it("the Step 2 heading region is inside the step2Active gate", () => {
    const gate = src.indexOf("{step2Active && (");
    const heading = src.indexOf('id="booking-step2-heading"');
    expect(gate).toBeGreaterThan(-1);
    expect(heading).toBeGreaterThan(gate);
  });

  // 17
  it("a reactive effect re-hides Step 2 and clears the slot selection", () => {
    expect(src).toContain("setStep('project_details')");
    expect(src).toMatch(/setSelDate\(null\);\s*setSelSlot\(null\);\s*setFullyBookedSel\(false\)/);
  });

  // 18
  it("the reactive re-hide never disturbs the terminal request_prepared step", () => {
    expect(src).toContain("if (step === 'project_details' || step === 'request_prepared') return");
  });

  // 19
  it("a polite live region announces when scheduling options appear", () => {
    expect(src).toContain('role="status"');
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain("Scheduling options are now available.");
  });

  // 20
  it("the reveal animation respects prefers-reduced-motion", () => {
    expect(src).toContain("isReduced() ? undefined : 'bkCalRise");
  });

  // 21
  it("Step 1 must validate before Step 2 is revealed", () => {
    // Scope to continueToBooking: it bails on any Step 1 error (returning) before
    // it ever reaches setStep('choosing_slot').
    const start = src.indexOf("const continueToBooking = useCallback");
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf("const confirm = useCallback", start));
    const guard = body.indexOf("if (er.eN || er.eE || er.eB || er.eI || er.eM)");
    const advance = body.indexOf("setStep('choosing_slot')");
    expect(guard).toBeGreaterThan(-1);
    expect(advance).toBeGreaterThan(guard);
  });

  // 22
  it("Step 1 validation covers name, email, business, interest and message", () => {
    expect(src).toContain("eN: !name.trim()");
    expect(src).toContain("eE: !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)");
    expect(src).toContain("eB: !business.trim()");
    expect(src).toContain("eI: !interest");
    expect(src).toContain("eM: !message.trim()");
  });
});
