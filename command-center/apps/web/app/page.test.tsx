import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

describe("Home (Phase 3 root redirect)", () => {
  it("redirects to /dashboard", async () => {
    const { default: Home } = await import("./page");
    Home();
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
