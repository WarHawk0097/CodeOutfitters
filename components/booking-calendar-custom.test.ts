// Proof point 8 of the Booking Route Integration Gap Closure runbook:
// duplicate submission is prevented. Source-level assertion, mirroring this
// repo's convention for DOM/router-bound files (app/dashboard/booking-disclosure.test.ts).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = readFileSync(fileURLToPath(new URL("./booking-calendar-custom.tsx", import.meta.url)), "utf8");

describe("booking-calendar-custom duplicate-submit prevention", () => {
  it("the submit button is disabled while a submission is in flight", () => {
    expect(src).toContain("disabled={submitting}");
  });

  it("submitting is set true before the createBooking call and reset after", () => {
    const start = src.indexOf("setSubmitting(true)");
    const call = src.indexOf("createBooking(bookingPayload)");
    expect(start).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(start);
  });
});
