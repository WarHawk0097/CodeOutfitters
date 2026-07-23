import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Docker-Supabase integration test config (Work Order E Step 23). These tests
// run against the REAL local stack (Postgres + Storage + ClamAV). They MUST
// fail when the stack is unhealthy — the setup file asserts required env is
// present and never falls back to a mock.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.integration.test.ts", "app/**/*.integration.test.ts"],
    exclude: ["node_modules/**", "command-center/**"],
    setupFiles: ["./test/integration-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Serial: shared local DB/bucket state.
    fileParallelism: false,
  },
});
