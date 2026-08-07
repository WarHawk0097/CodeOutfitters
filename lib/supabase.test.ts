// Proof points for the config-safety fix: getSupabase() must use only the
// configured NEXT_PUBLIC_SUPABASE_* values and fail closed when either is
// missing — no hardcoded project URL or key fallback.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn(() => ({ rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  vi.resetModules();
  createClientMock.mockClear();
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
});

describe("getSupabase", () => {
  // 1, 2
  it("initializes the client with the configured URL and anon key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://rsxdhwtprmuhzuocycxu.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "configured-anon-key";
    const { getSupabase } = await import("./supabase");
    getSupabase();
    expect(createClientMock).toHaveBeenCalledWith(
      "https://rsxdhwtprmuhzuocycxu.supabase.co",
      "configured-anon-key"
    );
  });

  // 3
  it("throws instead of silently falling back when the URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "configured-anon-key";
    const { getSupabase } = await import("./supabase");
    expect(() => getSupabase()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  // 3
  it("throws instead of silently falling back when the anon key is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://rsxdhwtprmuhzuocycxu.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabase } = await import("./supabase");
    expect(() => getSupabase()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});

describe("runtime source safety", () => {
  const supabaseSrc = readFileSync(join(__dirname, "supabase.ts"), "utf8");
  const bookingActionsSrc = readFileSync(join(__dirname, "booking-actions.ts"), "utf8");

  // 4
  it("never contains the incorrect Supabase project reference", () => {
    expect(supabaseSrc).not.toContain("rsxdhwtprmuhzuocyxcu");
    expect(bookingActionsSrc).not.toContain("rsxdhwtprmuhzuocyxcu");
  });

  // 4
  it("never hardcodes any Supabase project URL", () => {
    expect(supabaseSrc).not.toMatch(/https:\/\/[a-z0-9]+\.supabase\.co/);
  });

  // 6
  it("never reads or embeds a service-role/server-only credential", () => {
    // supabase.ts is the client browser bundle entry point: it must not even
    // mention service-role, let alone use it.
    expect(supabaseSrc).not.toMatch(/service_role/i);
    // booking-actions.ts documents (in comments) that the Worker holds the
    // service-role key server-side — that's expected. What must never appear
    // here is an actual read of the credential or a literal secret value.
    expect(bookingActionsSrc).not.toMatch(/process\.env\.[A-Z_]*SERVICE_ROLE[A-Z_]*/);
    expect(bookingActionsSrc).not.toMatch(/sb_secret_[A-Za-z0-9]/);
  });
});
