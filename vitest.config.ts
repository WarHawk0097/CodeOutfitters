import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Root marketing-app test config. Scoped to lib/ and app/ so the separate
// command-center monorepo (its own vitest) is never collected here.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // Mirror the tsconfig `@command-center/*` paths so the ported demo plane
      // (mocks/handlers) can be unit-tested against the same contracts the app
      // build resolves.
      "@command-center/contracts": fileURLToPath(
        new URL("./lib/command-center/contracts/index.ts", import.meta.url),
      ),
      "@command-center/ui": fileURLToPath(
        new URL("./lib/command-center/ui/index.ts", import.meta.url),
      ),
      // `import "server-only"` throws outside a React Server Component build.
      // Under vitest (node) it is a no-op guard; stub it so server modules load.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts", "mocks/**/*.test.ts"],
    // Five *.pglite.test.ts suites hold an embedded Postgres each — a WASM heap the worker
    // does not hand back. Run enough of them at once and the process dies with "Fatal
    // process out of memory", which reports no failing test and names no file.
    poolOptions: { forks: { maxForks: 2 } },
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
