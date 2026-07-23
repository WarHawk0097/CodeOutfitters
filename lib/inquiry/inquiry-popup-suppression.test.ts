import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DISMISS_COOLDOWN_MS,
  POPUP_VERSION,
  canAutoShowPopup,
  isExcludedPath,
  markDismissed,
  markSubmitted,
} from "./inquiry-popup-suppression";

function stubWindow() {
  const store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    },
  };
  return store;
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("isExcludedPath", () => {
  it("matches excluded prefixes and their subpaths", () => {
    expect(isExcludedPath("/contact")).toBe(true);
    expect(isExcludedPath("/contact/thanks")).toBe(true);
    expect(isExcludedPath("/dashboard/leads")).toBe(true);
    expect(isExcludedPath("/sign-in")).toBe(true);
  });
  it("does not match unrelated paths", () => {
    expect(isExcludedPath("/services")).toBe(false);
    expect(isExcludedPath("/contact-us")).toBe(false); // not a prefix boundary
    expect(isExcludedPath("/")).toBe(false);
  });
});

describe("canAutoShowPopup", () => {
  const NOW = 1_700_000_000_000;

  it("allows on an eligible page with clean state", () => {
    stubWindow();
    expect(canAutoShowPopup({ pathname: "/services", now: NOW })).toBe(true);
  });

  it("blocks on excluded paths, open modal, submitting, and dashboard user", () => {
    stubWindow();
    expect(canAutoShowPopup({ pathname: "/contact", now: NOW })).toBe(false);
    expect(canAutoShowPopup({ pathname: "/services", now: NOW, anotherModalOpen: true })).toBe(false);
    expect(canAutoShowPopup({ pathname: "/services", now: NOW, submitting: true })).toBe(false);
    expect(canAutoShowPopup({ pathname: "/services", now: NOW, isAuthenticatedDashboardUser: true })).toBe(false);
  });

  it("suppresses inside the 7-day dismiss cooldown, re-allows after", () => {
    stubWindow();
    markDismissed(NOW);
    expect(canAutoShowPopup({ pathname: "/services", now: NOW + 1000 })).toBe(false);
    expect(canAutoShowPopup({ pathname: "/services", now: NOW + DISMISS_COOLDOWN_MS + 1 })).toBe(true);
  });

  it("never re-shows after a successful submit", () => {
    stubWindow();
    markSubmitted();
    expect(canAutoShowPopup({ pathname: "/services", now: NOW + DISMISS_COOLDOWN_MS * 100 })).toBe(false);
  });

  it("resets when the stored version differs from POPUP_VERSION", () => {
    const store = stubWindow();
    store.set(
      "co_workflow_audit_popup",
      JSON.stringify({ version: POPUP_VERSION + 1, dismissedAt: NOW }),
    );
    // Stale-version state is ignored -> popup allowed again.
    expect(canAutoShowPopup({ pathname: "/services", now: NOW + 1000 })).toBe(true);
  });
});
