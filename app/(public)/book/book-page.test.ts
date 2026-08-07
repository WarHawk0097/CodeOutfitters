// /book route tests (proof points 1, 2, 5, 12, 13 of the Booking Route
// Integration Gap Closure runbook). Source-level assertions, mirroring this
// repo's convention for DOM/router-bound files (app/dashboard/booking-disclosure.test.ts).
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pageFile = fileURLToPath(new URL("./page.tsx", import.meta.url));
const src = readFileSync(pageFile, "utf8");

describe("/book route", () => {
  // 1
  it("the route file exists", () => {
    expect(existsSync(pageFile)).toBe(true);
  });

  // 2
  it("renders the existing booking hero and calendar, unmodified", () => {
    expect(src).toContain("import { PageHero } from '@/components/page-hero'");
    expect(src).toContain(
      "import { BookingCalendarCustom } from '@/components/booking-calendar-custom'"
    );
    expect(src).toContain("<PageHero");
    expect(src).toContain("<BookingCalendarCustom />");
  });

  // page metadata present
  it("exports page metadata", () => {
    expect(src).toContain("export const metadata: Metadata");
    expect(src).toContain("title:");
  });

  // 5 (no direct reserve_slot call), 12 (no secret env var referenced)
  it("never calls reserve_slot directly and references no secret env var", () => {
    expect(src).not.toContain("reserve_slot");
    expect(src).not.toMatch(/SUPABASE_SECRET_KEY|SERVICE_ROLE/);
  });

  // 13 (no service-role value in this file)
  it("contains no service-role or secret key literal", () => {
    expect(src).not.toMatch(/service_role/i);
  });
});
