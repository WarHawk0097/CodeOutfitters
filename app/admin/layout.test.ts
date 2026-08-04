// Admin surface authorization boundary (test 243).
//
// There is no in-app administrator identity in this repo to check (see
// app/admin/layout.tsx for why), so this is Option 3: a development-only
// surface that returns a controlled 404 for every non-development build,
// with no client-readable password, no localStorage credential, and no
// static shared secret. These tests lock that in.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement, isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "./layout";

const here = fileURLToPath(new URL(".", import.meta.url));
const layoutSrc = readFileSync(`${here}layout.tsx`, "utf8");
const headerSrc = readFileSync(
  fileURLToPath(new URL("../../components/admin/admin-header.tsx", import.meta.url)),
  "utf8",
);

vi.mock("@/components/admin/admin-header", () => ({
  AdminHeader: () => null,
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

// AdminLayout is imported statically above (vi.mock calls are hoisted above
// it), and every test below reuses that one import instead of re-importing
// per env. A dynamic re-import after vi.stubEnv("NODE_ENV", "production")
// would re-require react/jsx-dev-runtime under that env — Node caches that
// module by its first-seen env, so a later "development" stub would still
// get back a production-shaped runtime with no jsxDEV export. AdminLayout
// reads process.env.NODE_ENV at call time anyway, so one import is enough.

afterEach(() => {
  vi.unstubAllEnvs();
  notFound.mockClear();
});

describe("app/admin/layout.tsx source (test 243a)", () => {
  it("carries no client-readable password, localStorage credential, or password UI", () => {
    // The word "password" itself is fine in a comment explaining what was removed —
    // what must never come back is the env var, the storage key, or an actual input.
    expect(layoutSrc).not.toContain("NEXT_PUBLIC_ADMIN_PASSWORD");
    expect(layoutSrc).not.toContain("co_admin_auth");
    expect(layoutSrc).not.toContain("localStorage");
    expect(layoutSrc).not.toMatch(/type=["']password["']/);
    expect(layoutSrc).not.toContain("useState");
  });

  it("is a server component (no 'use client'), so the gate can't run in the browser", () => {
    expect(layoutSrc.trimStart().startsWith("'use client'")).toBe(false);
  });

  it("denies via notFound(), not a redirect to any URL — no open-redirect surface", () => {
    expect(layoutSrc).toContain("notFound()");
    expect(layoutSrc).not.toMatch(/\bredirect\(/);
  });

  it("has no nested layout under app/admin/** that could bypass this guard", () => {
    const entries = readdirSync(here, { withFileTypes: true, recursive: true } as unknown as { withFileTypes: true });
    const layoutFiles = entries
      .filter((e) => !e.isDirectory() && /^layout\.tsx?$/.test(e.name))
      .map((e) => e.name);
    expect(layoutFiles).toEqual(["layout.tsx"]);
  });
});

describe("components/admin/admin-header.tsx source (test 243b)", () => {
  it("reads no server env var — nothing for a bundler to inline into the client", () => {
    expect(headerSrc).not.toContain("process.env");
    expect(headerSrc).not.toContain("NEXT_PUBLIC_ADMIN_PASSWORD");
  });

  it("carries no auth/session logic (no password field, no logout, no localStorage)", () => {
    expect(headerSrc).not.toContain("localStorage");
    expect(headerSrc).not.toContain("password");
    expect(headerSrc).not.toContain("Logout");
  });
});

describe("AdminLayout runtime behavior (test 243c)", () => {
  it("calls notFound() for a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => AdminLayout({ children: createElement("span", null, "child") })).toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound() for a preview/staging build (anything that isn't 'development')", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(() => AdminLayout({ children: createElement("span", null, "child") })).toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("renders children under next dev (NODE_ENV === 'development') without calling notFound()", () => {
    vi.stubEnv("NODE_ENV", "development");
    const marker = createElement("span", null, "dev-marker");
    // Inspect the returned element tree directly rather than rendering to a
    // string — sidesteps a jsx-dev-runtime/CJS interop issue in this test
    // transform that's unrelated to what this test is checking.
    const el = AdminLayout({ children: marker });
    expect(isValidElement(el)).toBe(true);
    expect(notFound).not.toHaveBeenCalled();

    const children = (el as { props: { children: unknown[] } }).props.children;
    const main = children.find(
      (child): child is { type: string; props: { children: unknown } } =>
        isValidElement(child) && (child as { type: unknown }).type === "main",
    );
    expect(main).toBeDefined();
    expect(main?.props.children).toBe(marker);
  });
});
