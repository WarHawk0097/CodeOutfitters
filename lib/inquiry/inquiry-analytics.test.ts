import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { trackInquiryEvent } from "./inquiry-analytics";

// Manual window stub (config env is node) so we can flip the consent gate and
// inspect what actually reaches window.dataLayer.
function stubWindow(consent?: string) {
  const store = new Map<string, string>();
  if (consent) store.set("co_cookie_consent", consent);
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    },
  };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("trackInquiryEvent consent gate", () => {
  it("no-ops without consent (fails closed)", () => {
    stubWindow(undefined);
    trackInquiryEvent("inquiry_form_started", { formVariant: "global_popup" });
    expect((window as unknown as { dataLayer?: unknown[] }).dataLayer).toBeUndefined();
  });

  it("pushes when consent accepted", () => {
    stubWindow("accepted");
    trackInquiryEvent("inquiry_submit_succeeded", { formVariant: "services_compact", sourcePage: "Services" });
    const layer = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer!;
    expect(layer).toHaveLength(1);
    expect(layer[0]).toEqual({
      event: "inquiry_submit_succeeded",
      formVariant: "services_compact",
      sourcePage: "Services",
    });
  });
});

describe("payload sanitisation (no PII)", () => {
  it("strips any non-allow-listed key", () => {
    stubWindow("accepted");
    trackInquiryEvent("inquiry_submit_failed", {
      formVariant: "contact_full",
      // @ts-expect-error - deliberately smuggling PII to prove it is dropped
      workEmail: "leak@example.com",
      phone: "555-0100",
      workflowDescription: "secret free text",
    });
    const entry = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer[0];
    expect(entry).toEqual({ event: "inquiry_submit_failed", formVariant: "contact_full" });
    expect(JSON.stringify(entry)).not.toContain("leak@example.com");
  });
});
