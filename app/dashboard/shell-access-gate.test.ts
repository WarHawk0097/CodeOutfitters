// Regression: the dashboard shell is built from canonical fixtures (KPI strip,
// pipeline journey, rail badges), so it renders a plausible dashboard without
// reading the workspace. A signed-in account with no *active* membership must be
// sent to /access-pending by the layout, not shown that shell — the data planes
// already answer 401, but the frame around them must not imply access.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const layout = readFileSync(join(process.cwd(), "app/dashboard/layout.tsx"), "utf8");

describe("dashboard shell access gate", () => {
  it("redirects a live viewer with no active membership to /access-pending", () => {
    expect(layout).toMatch(/if \(config\.live && !viewer\) redirect\("\/access-pending"\);/);
  });

  it("imports redirect from next/navigation", () => {
    expect(layout).toMatch(/import \{ redirect \} from "next\/navigation";/);
  });

  it("leaves demo mode ungated — demo has no auth plane", () => {
    // The guard is conditioned on config.live, so a demo visit never redirects.
    expect(layout).not.toMatch(/if \(!viewer\) redirect/);
  });
});
