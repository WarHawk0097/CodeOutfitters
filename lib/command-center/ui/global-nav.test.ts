// Cross-navigation tests (1-12): the persistent "View website" escape hatch in
// the dashboard shell, the public "Sign in" entry, the login → demo dashboard
// entry, and the safeReturnTo default. Pure pieces render via react-dom/server;
// source-level facts (client wiring in files that touch the DOM/router) are
// asserted by reading the source, matching this repo's established convention.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ViewWebsiteLink, ExternalLinkIcon } from "./shell-header";
import { safeReturnTo } from "@/lib/auth/return-url";

const here = fileURLToPath(new URL(".", import.meta.url));
const shellHeaderSrc = readFileSync(`${here}shell-header.tsx`, "utf8");
const sidebarSrc = readFileSync(`${here}sidebar.tsx`, "utf8");
const navbarSrc = readFileSync(`${here}../../../components/navbar.tsx`, "utf8");
const loginSrc = readFileSync(`${here}../../../app/login/page.tsx`, "utf8");
const demoLoginSrc = readFileSync(`${here}../../../app/login/demo-login-form.tsx`, "utf8");

const viewWebsiteHtml = renderToStaticMarkup(createElement(ViewWebsiteLink));

describe("cross-navigation (tests 1-12)", () => {
  // 1
  it("View website link points at the site root with a relative href (no hardcoded prod URL)", () => {
    expect(viewWebsiteHtml).toContain('href="/"');
    expect(viewWebsiteHtml).not.toContain("codeoutfitters.vercel.app");
    expect(viewWebsiteHtml).not.toContain("https://");
  });

  // 2
  it("View website opens in a new tab safely", () => {
    expect(viewWebsiteHtml).toContain('target="_blank"');
    expect(viewWebsiteHtml).toMatch(/rel="[^"]*noopener[^"]*noreferrer/);
  });

  // 3
  it("View website has an accessible name and announces the new tab", () => {
    expect(viewWebsiteHtml).toContain("View website");
    expect(viewWebsiteHtml.toLowerCase()).toContain("opens in new tab");
  });

  // 4
  it("View website carries a visible focus treatment", () => {
    expect(viewWebsiteHtml).toContain("focus-visible:outline");
  });

  // 5
  it("View website renders an external-link icon glyph", () => {
    const icon = renderToStaticMarkup(createElement(ExternalLinkIcon));
    expect(icon).toContain("<svg");
    expect(icon).toContain('aria-hidden="true"');
  });

  // 6
  it("the shell header mounts the persistent View website action on desktop", () => {
    expect(shellHeaderSrc).toContain("<ViewWebsiteLink />");
  });

  // 7
  it("the mobile nav drawer also exposes View website", () => {
    expect(sidebarSrc).toContain('href="/"');
    expect(sidebarSrc).toContain("View website");
    expect(sidebarSrc).toContain('target="_blank"');
  });

  // 8
  it("the public navbar renders a Sign in link to /login", () => {
    expect(navbarSrc).toContain("Sign in");
    expect(navbarSrc).toContain('href="/login"');
  });

  // 9
  it("Sign in is ordered ahead of the Book a Call CTA", () => {
    const signIn = navbarSrc.indexOf('href="/login"');
    const book = navbarSrc.indexOf('href="/contact"');
    expect(signIn).toBeGreaterThan(-1);
    expect(book).toBeGreaterThan(-1);
    expect(signIn).toBeLessThan(book);
  });

  // 10
  it("the demo login screen offers a working credential form and a direct demo entry", () => {
    // Complete sign-in screen, not a bare "no login" placeholder.
    expect(demoLoginSrc).toContain('type="password"');
    expect(demoLoginSrc).toContain('type="submit"');
    // Honest direct entry into the demo Command Center.
    expect(demoLoginSrc).toContain('href="/dashboard"');
    expect(demoLoginSrc).toContain("demo dashboard");
    // Social sign-in is offered but never faked: disabled, no OAuth call.
    expect(demoLoginSrc).toContain("Continue with");
    expect(demoLoginSrc).toContain('label="Google"');
    expect(demoLoginSrc).toContain('label="Apple"');
    expect(demoLoginSrc).toContain("disabled");
    expect(demoLoginSrc).not.toMatch(/signInWith(OAuth|Idp)/);
    // page.tsx still routes demo mode into this screen.
    expect(loginSrc).toContain("<DemoLoginForm");
  });

  // 11
  it("safeReturnTo defaults to /dashboard", () => {
    expect(safeReturnTo(undefined)).toBe("/dashboard");
    expect(safeReturnTo("")).toBe("/dashboard");
  });

  // 12
  it("safeReturnTo rejects absolute and scheme-smuggling targets", () => {
    expect(safeReturnTo("https://evil.example")).toBe("/dashboard");
    expect(safeReturnTo("//evil.example")).toBe("/dashboard");
    expect(safeReturnTo("/dashboard/leads")).toBe("/dashboard/leads");
  });
});
