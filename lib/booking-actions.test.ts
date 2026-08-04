// Proof points 3, 4, 5, 6, 7, 9, 10, 11 of the Booking Route Integration Gap
// Closure runbook. All external calls are mocked; no real booking or hosted
// Supabase project is ever contacted.
import { afterEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();
vi.mock("./supabase", () => ({
  getSupabase: () => ({ rpc: rpcMock }),
}));

import { getAvailableSlots, createBooking } from "./booking-actions";
import type { BookingFormData } from "./booking-types";

const payload: BookingFormData = {
  name: "QA Tester",
  email: "qa@example.com",
  preferredDate: "2099-01-01",
  preferredTime: "10:00",
  timezone: "America/New_York",
};

afterEach(() => {
  vi.unstubAllGlobals();
  rpcMock.mockReset();
});

describe("getAvailableSlots", () => {
  // 3
  it("invokes the get_available_slots RPC with the parsed month/year", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await getAvailableSlots("6", "2026");
    expect(rpcMock).toHaveBeenCalledWith("get_available_slots", { p_month: 6, p_year: 2026 });
  });

  // 7
  it("rejects malformed month/year without calling the RPC", async () => {
    const result = await getAvailableSlots("13", "2026");
    expect(result.error).toMatch(/Invalid month/);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("createBooking", () => {
  // 6
  it("fails closed with no fetch call when NEXT_PUBLIC_BOOKING_WORKER_URL is absent", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const prev = process.env.NEXT_PUBLIC_BOOKING_WORKER_URL;
    delete process.env.NEXT_PUBLIC_BOOKING_WORKER_URL;
    const result = await createBooking(payload);
    process.env.NEXT_PUBLIC_BOOKING_WORKER_URL = prev;
    expect(result.error).toMatch(/temporarily unavailable/);
    expect(fetch).not.toHaveBeenCalled();
  });

  // 4, 5
  it("submits only to the configured Worker URL, never to a reserve_slot endpoint", async () => {
    process.env.NEXT_PUBLIC_BOOKING_WORKER_URL = "https://booking-worker.example.workers.dev";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    await createBooking(payload);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("https://booking-worker.example.workers.dev/");
    expect(url).not.toContain("reserve_slot");
  });

  // 9
  it("returns no error on a successful Worker response", async () => {
    process.env.NEXT_PUBLIC_BOOKING_WORKER_URL = "https://booking-worker.example.workers.dev";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }));
    const result = await createBooking(payload);
    expect(result.error).toBeNull();
  });

  // 10
  it("maps a 409 conflict to a user-appropriate unavailable message", async () => {
    process.env.NEXT_PUBLIC_BOOKING_WORKER_URL = "https://booking-worker.example.workers.dev";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "slot_already_booked" }) })
    );
    const result = await createBooking(payload);
    expect(result.error).toMatch(/no longer available/);
  });

  // 11
  it("never surfaces internal error details on a 500", async () => {
    process.env.NEXT_PUBLIC_BOOKING_WORKER_URL = "https://booking-worker.example.workers.dev";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "internal", stack: "at reserve_slot db.ts:42" }),
      })
    );
    const result = await createBooking(payload);
    expect(result.error).toBe("Failed to create booking. Please try again or email hello@codeoutfitters.com.");
    expect(result.error).not.toMatch(/stack|db\.ts/);
  });
});
