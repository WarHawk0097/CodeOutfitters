import "server-only";
import type { InquiryRepository } from "./inquiry-repository";
import { SupabaseInquiryRepository } from "./supabase-inquiry-repository";

// Selects the persistence backend (owner directive: "use the safe local
// repository/test mode already created"). INQUIRY_REPOSITORY_MODE is a
// server-only env var (never NEXT_PUBLIC_): set it to "pglite" for local dev /
// browser QA to persist into an embedded Postgres instead of Supabase.
//
// FAIL CLOSED IN PRODUCTION: the local mode is refused when NODE_ENV is
// production, so a stray env var can never route real production traffic into an
// ephemeral in-memory database. Production always uses Supabase.
export async function createInquiryRepository(): Promise<InquiryRepository> {
  const mode = process.env.INQUIRY_REPOSITORY_MODE;

  if (mode === "pglite") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "INQUIRY_REPOSITORY_MODE=pglite is not permitted in production (fail closed).",
      );
    }
    // Dynamic import so PGlite is never pulled into the production bundle.
    const { PgliteInquiryRepository } = await import("./pglite-inquiry-repository");
    return new PgliteInquiryRepository();
  }

  return new SupabaseInquiryRepository();
}
