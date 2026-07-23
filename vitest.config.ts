import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Root marketing-app test config. Scoped to lib/ and app/ so the separate
// command-center monorepo (its own vitest) is never collected here.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // `import "server-only"` throws outside a React Server Component build.
      // Under vitest (node) it is a no-op guard; stub it so server modules load.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
    // Integration tests (real Docker Supabase + ClamAV) run only via
    // vitest.integration.config.ts — never in the fast unit sweep.
    exclude: [
      "node_modules/**",
      "command-center/**",
      "**/*.selfcheck.ts",
      "**/*.integration.test.ts",
    ],
  },
});
