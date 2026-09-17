// Regression: live-mode SSR 500 rooted in lib/demo/store.ts.
//
// SEED_STATE used to be an eager `const = createSeedState()`, evaluated the instant this
// module was imported — live mode or not — via the static chain
// command-center.tsx -> command-dialog.tsx -> use-demo-query.ts -> lib/demo/store.ts. That
// chain mounts on every dashboard page (app/dashboard/layout.tsx wraps both live and demo in
// the same CommandCenterProvider), so a live-mode SSR render generated a full demo fixture
// set and assertMockDataAllowed() threw a 500 on /dashboard/pipeline and /dashboard/leads/[id].
//
// Fix: SEED_STATE/state are now lazy (built on first actual access, not on import), and
// useDemoState() itself reads live/demo from the same CommandCenterConfig context
// command-dialog.tsx already uses, short-circuiting to a static EMPTY_DEMO_STATE — never
// createSeedState() — whenever live is true. Every test resets the module registry: an
// earlier test's cache can otherwise mask a reintroduced eager call (see
// lib/demo/seed.test.ts's own crash-site test, which this file's test 3 mirrors one layer up).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createSeedStateSpy = vi.hoisted(() => vi.fn());

vi.mock("./seed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./seed")>();
  return {
    ...actual,
    createSeedState: (...args: Parameters<typeof actual.createSeedState>) => {
      createSeedStateSpy(...args);
      return actual.createSeedState(...args);
    },
  };
});

beforeEach(() => {
  vi.resetModules();
  createSeedStateSpy.mockClear();
});

// 1. Importing the store module alone must not build the seed.
it("importing lib/demo/store does not call createSeedState()", async () => {
  await import("./store");
  expect(createSeedStateSpy).not.toHaveBeenCalled();
});

// 2. getSeedState() is lazy: built on first actual access, cached after.
it("getSeedState() calls createSeedState() on first use only", async () => {
  const { getSeedState } = await import("./store");
  expect(createSeedStateSpy).not.toHaveBeenCalled();
  const first = getSeedState();
  expect(createSeedStateSpy).toHaveBeenCalledTimes(1);
  const second = getSeedState();
  expect(createSeedStateSpy).toHaveBeenCalledTimes(1);
  expect(second).toBe(first);
});

// 3. getDemoState() is lazy the same way (no stored sessionStorage session in this node env).
it("getDemoState() calls createSeedState() on first use only", async () => {
  const { getDemoState } = await import("./store");
  expect(createSeedStateSpy).not.toHaveBeenCalled();
  getDemoState();
  expect(createSeedStateSpy).toHaveBeenCalledTimes(1);
  getDemoState();
  expect(createSeedStateSpy).toHaveBeenCalledTimes(1);
});

// 4. The reported crash chain, one layer above lib/demo/seed.ts's own coverage of the same
//    import path — proves the fix at the layer the crash actually happened.
it("importing the command dialog (the reported crash site) does not call createSeedState()", async () => {
  await import("../../components/command-center/command-dialog");
  expect(createSeedStateSpy).not.toHaveBeenCalled();
});

it("importing command-center.tsx (mounted on every dashboard page, live and demo) does not call createSeedState()", async () => {
  await import("../../components/command-center/command-center");
  expect(createSeedStateSpy).not.toHaveBeenCalled();
});

// 5. Structural proof that useDemoState() itself is mode-gated. This is the piece that
//    actually stops the crash: laziness alone only moves the eager call from import time to
//    hook-call time, since useSyncExternalStore's getServerSnapshot argument is still called
//    on every render, live or demo, unless the hook itself branches on mode. Source-surface
//    assertion, same idiom as components/command-center/command-dialog.test.ts, since this
//    repo's root vitest config runs in a node environment with no React renderer available to
//    actually mount the hook.
describe("useDemoState() never reaches the demo store in live mode", () => {
  const repo = fileURLToPath(new URL("../../", import.meta.url));
  const source = readFileSync(`${repo}lib/demo/store.ts`, "utf8");

  it("reads live mode from the same context command-dialog.tsx and mode-provider.tsx use", () => {
    expect(source).toContain(
      'import { useCommandCenterConfig } from "@/components/command-center/mode-provider";',
    );
    expect(source).toContain("const { live: configuredLive } = useCommandCenterConfig();");
    expect(source).toContain("const live = options?.live ?? configuredLive;");
  });

  it("swaps out every useSyncExternalStore argument in live mode, never just the getter", () => {
    // All three arguments must be gated — a fix that only swapped the snapshot getter would
    // still subscribe to the demo store in live mode.
    expect(source).toContain("live ? neverSubscribe : subscribeDemoState");
    expect(source).toContain("live ? getEmptyDemoState : getDemoState");
    expect(source).toContain("live ? getEmptyDemoState : getSeedState");
  });

  it("live's empty state is a static constant, never a generated fixture", () => {
    expect(source).not.toMatch(/live\s*\?\s*createSeedState/);
    expect(source).toContain("const EMPTY_DEMO_STATE: DemoState = {");
  });
});

// 6. The guard itself is untouched and still enforced — proves this fix did not weaken
//    assertMockDataAllowed(), only stopped calling it from a live-reachable path.
describe("assertMockDataAllowed() is still enforced", () => {
  const saved: Record<string, string | undefined> = {};
  const keys = ["NODE_ENV", "COMMAND_CENTER_MODE"];

  beforeEach(() => {
    for (const key of keys) saved[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("throws for direct synthetic-data generation in live mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COMMAND_CENTER_MODE", "live");
    const { generateLeads } = await import("../../mocks/fixtures/generate-leads");
    expect(() => generateLeads()).toThrow(/refusing to generate synthetic lead data in live mode/i);
    vi.unstubAllEnvs();
  });

  it("still allows demo mode to generate fixtures", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COMMAND_CENTER_MODE", "demo");
    const { generateLeads } = await import("../../mocks/fixtures/generate-leads");
    expect(() => generateLeads()).not.toThrow();
    vi.unstubAllEnvs();
  });
});
