// Newsletter form — configured and unconfigured states.
//
// The component is a client component, so this is a source-surface test in the idiom
// this repository already uses for `.tsx` (see components/command-center/saved-views.test.ts).
// What is being defended: a deployment without NEXT_PUBLIC_FORMS_WORKER_URL shows an
// honest notice instead of an enabled field that is guaranteed to fail.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NEWSLETTER_UNAVAILABLE_NOTICE } from "./newsletter";

const repo = fileURLToPath(new URL("../", import.meta.url));
const src = readFileSync(`${repo}components/newsletter.tsx`, "utf8");
/** Source with comments removed, for assertions about what the bundle actually carries. */
const code = src.replace(/^\s*\/\/.*$/gm, "");

describe("newsletter form", () => {
  it("reads the worker URL once, at module scope, and posts nowhere else", () => {
    expect(src).toContain("const WORKER_URL = process.env.NEXT_PUBLIC_FORMS_WORKER_URL");
    // One env read, so the render and the submit path can never disagree.
    expect(src.match(/process\.env\./g)?.length).toBe(1);
    expect(src.match(/fetch\(/g)?.length).toBe(1);
    expect(src).toContain("fetch(WORKER_URL.replace(/\\/+$/, '') + '/'");
    // The credential and the webhook address live in the Worker, not the bundle: the
    // only header set here is the content type, and no provider URL is embedded.
    expect(src.match(/headers: \{[^}]*\}/g)).toEqual(["headers: { 'Content-Type': 'application/json' }"]);
    expect(code).not.toMatch(/https?:\/\//);
    expect(code).not.toMatch(/secret|token|api[_-]?key/i);
  });

  it("renders an honest notice when unconfigured, with no field to type into", () => {
    expect(src).toContain("{!WORKER_URL ? (");
    expect(src).toContain("{NEWSLETTER_UNAVAILABLE_NOTICE}");
    // The notice says what is wrong and what to do instead, and promises no retry.
    expect(NEWSLETTER_UNAVAILABLE_NOTICE).toContain("temporarily unavailable");
    expect(NEWSLETTER_UNAVAILABLE_NOTICE).toContain("hello@codeoutfitters.com");
    expect(NEWSLETTER_UNAVAILABLE_NOTICE).not.toMatch(/try again/i);
    // The unconfigured branch precedes the form, so there is nothing to submit.
    const notice = src.indexOf("{!WORKER_URL ? (");
    expect(notice).toBeGreaterThan(-1);
    expect(src.indexOf("<form")).toBeGreaterThan(notice);
    // And the "no spam" promise is not made when nothing can be subscribed to.
    expect(src).toContain("{WORKER_URL && (");
  });

  it("keeps the configured path honest too — bot control, validation, states", () => {
    // Honeypot: a bot filling it sees success and nothing is sent.
    expect(src).toContain("if (honeypot) { setStatus('success'); return }");
    expect(src).toContain('aria-hidden="true"');
    expect(src).toContain('tabIndex={-1}');
    // Native validation, so an empty or malformed address is reported rather than
    // silently dropped by the guard below it.
    expect(src).toContain("type=\"email\"");
    expect(src).toContain("required");
    expect(src).toContain("/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)");
    // Loading, success and error are all rendered, and the error is announced.
    for (const state of ["'loading'", "'success'", "'error'"]) expect(src, state).toContain(state);
    expect(src).toContain('role="alert"');
    expect(src).toContain('<label htmlFor="newsletter-email" className="sr-only">');
    // No raw provider text reaches the browser: the catch discards the response.
    expect(src).toContain("if (!res.ok) throw new Error()");
    expect(src).not.toContain("res.text()");
    expect(src).not.toContain("console.log");
  });
});
