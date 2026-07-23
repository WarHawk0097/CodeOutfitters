// Integration test setup (Work Order E Step 23). Fails LOUD if the local
// Docker Supabase / ClamAV configuration is absent — integration tests must
// never silently degrade to a mock. Run only against the LOCAL stack.
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "INQUIRY_STORAGE_MODE",
  "INQUIRY_STORAGE_BUCKET",
  "INQUIRY_FILE_SCANNER_MODE",
];

const missing = REQUIRED.filter((k) => !process.env[k] || process.env[k]!.trim() === "");
if (missing.length > 0) {
  throw new Error(
    `Integration tests require the local Docker Supabase stack env. Missing: ${missing.join(", ")}. ` +
      `Start the stack (npm run supabase:start) and export the values from 'supabase status' — see ` +
      `work/WORK-ORDER-E-LOCAL-SUPABASE-ENV-CONTRACT.md. These tests never fall back to a mock.`,
  );
}

// Guard against pointing at anything that is not local.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!/(127\.0\.0\.1|localhost)/.test(url)) {
  throw new Error(`Refusing to run integration tests against a non-local Supabase URL: ${url}`);
}
