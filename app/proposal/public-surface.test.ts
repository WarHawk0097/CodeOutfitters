// Secure client proposal surfaces (tests 242-266).
//
// These read the source of the two screens this release adds — the public proposal page and
// the internal Client Access panel — and assert the promises the product makes on them. A
// screen is where an honest system quietly becomes a dishonest one: the data layer can be
// correct while the button above it says "Sent" and the footer says "Legally signed".
//
// Everything here is a property of the source, because these are claims in copy and in markup
// rather than values a function returns.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (relative: string) => readFileSync(join(repo, relative), "utf8");

const publicPage = read("app/proposal/[secureToken]/page.tsx");
const publicView = read("app/proposal/[secureToken]/proposal-public-view.tsx");
const publicChrome = read("app/proposal/[secureToken]/public-chrome.tsx");
const accessPage = read("app/dashboard/proposals/[proposalId]/access/page.tsx");
const accessView = read("app/dashboard/proposals/[proposalId]/access/access-view.tsx");
const middleware = read("middleware.ts");
const globals = read("app/globals.css");

const publicSurface = [publicPage, publicView, publicChrome].join("\n");
const allNew = [publicSurface, accessPage, accessView].join("\n");

/** Every source file this release could have hidden a claim in. */
function sourceFiles(): string[] {
  const roots = ["app", "components", "lib", "hooks"];
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === "node_modules" || entry === ".next") continue;
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
        // Tests are excluded: this very file names the strings it forbids, and a scan that
        // read itself would fail on its own assertions.
        found.push(full);
      }
    }
  };
  for (const root of roots) walk(join(repo, root));
  return found;
}

describe("the public proposal route (tests 242-251)", () => {
  // 242
  it("exists at a token-addressed path and nowhere else", () => {
    expect(existsSync(join(repo, "app/proposal/[secureToken]/page.tsx"))).toBe(true);
    expect(existsSync(join(repo, "app/proposal/[secureToken]/proposal-public-view.tsx"))).toBe(true);
    // No id-addressed public variant that could be walked.
    expect(existsSync(join(repo, "app/proposal/[proposalId]"))).toBe(false);
    expect(existsSync(join(repo, "app/proposal/page.tsx"))).toBe(false);
  });

  // 243
  it("is not behind the dashboard middleware, and the middleware still guards the dashboard", () => {
    // The matcher is wider than /dashboard since the canonical host redirect, so the
    // guard is read from the session path list the middleware actually branches on.
    expect(middleware).toContain("const SESSION_PATHS = ['/dashboard', '/login', '/access-pending', '/auth']");
    expect(middleware).toContain("if (needsSession(request.nextUrl.pathname)) return updateSession(request)");
    expect(middleware).not.toContain("/proposal/:path*");
    expect(middleware).not.toContain("/proposal/");
  });

  // 244
  it("renders from the token alone — no proposal id, workspace or account is an input", () => {
    expect(publicPage).toContain("secureToken");
    expect(publicPage).not.toContain("resolveDashboardContext");
    expect(publicPage).not.toContain("searchParams");
    expect(publicView).not.toContain("workspaceId");
    expect(publicView).not.toContain("internalProposalId");
  });

  // 245
  it("makes no Supabase call and reaches no provider directly from the public client island", () => {
    for (const forbidden of ["@supabase/", "createClient", "service_role", "SUPABASE_"]) {
      expect(publicSurface.includes(forbidden), forbidden).toBe(false);
    }
  });

  // 246
  it("shows the general notice, not a reason, when the plane cannot serve a document", () => {
    expect(publicPage).toContain("PUBLIC_TEMPORARILY_UNAVAILABLE_TITLE");
    expect(publicPage).toContain("PUBLIC_TEMPORARILY_UNAVAILABLE_DETAIL");
    expect(publicView).toContain("grantsContentAccess(view.state)");
    expect(publicView).toContain("PublicNotice heading={view.heading} detail={view.detail}");
  });

  // 247
  it("renders no activity, no internal note and no team member on the public page", () => {
    // Matched on imports and on rendered fields rather than on the words: the header comments
    // on these files discuss activity and internal notes precisely in order to say they are
    // absent, and a bare substring scan would fail on the explanation.
    expect(publicSurface).not.toMatch(/from ['"]@\/lib\/activity/);
    expect(publicSurface).not.toMatch(/from ['"]@\/lib\/demo\/activity/);
    for (const forbidden of ["ActivityEvent", "ACTIVITY_EVENT_META", "internalNote", "recipientEmail", ".team"]) {
      expect(publicSurface.includes(forbidden), forbidden).toBe(false);
    }
  });

  // 248
  it("offers browser printing and explicitly denies that it is a generated PDF", () => {
    expect(publicView).toContain("window.print()");
    expect(publicView).toContain("It is not a generated PDF");
    // No control offering a PDF. The phrase appears in the source only inside the comment
    // explaining why there is no such control, so the check is on rendered label text.
    expect(publicSurface).not.toMatch(/>\s*Download PDF/i);
    expect(publicSurface).not.toContain(".pdf");
    expect(publicSurface).not.toContain("application/pdf");
  });

  // 249
  it("has no enabled control that sends, emails, signs or delivers anything", () => {
    const lowered = publicSurface.toLowerCase();
    for (const claim of ["send email", "email this", "resend", "e-sign", "docusign", "legally binding", "legally enforceable"]) {
      expect(lowered, claim).not.toContain(claim);
    }
    expect(publicSurface).not.toContain('href="#"');
  });

  // 250
  it("states, where the person clicking can read it, that a demo response stays in this browser", () => {
    expect(publicView).toContain("Saved in browser.");
    expect(publicView).toContain("nothing was sent to CodeOutfitters and no email was delivered");
    for (const lie of ["Saved to your account", "Synced", "Updated in CRM", "Sent to", "Delivered"]) {
      expect(publicView.includes(lie), lie).toBe(false);
    }
  });

  // 251
  it("counts one open per reader session rather than one per render", () => {
    expect(publicView).toContain("cc-proposal-open:${token}");
    expect(publicView).toContain("recorded.current");
    expect(publicView).toContain("sessionStorage.getItem(key)");
  });
});

describe("the public response form (tests 252-257)", () => {
  // 252
  it("validates on the shared rules rather than inventing its own", () => {
    expect(publicView).toContain("validateResponseDraft");
    expect(publicView).toContain("MAX_MESSAGE_LENGTH");
    expect(publicView).toContain("MAX_NOTE_LENGTH");
  });

  // 253
  it("does not rely on client-side validation alone — the store refuses a bad draft too", () => {
    expect(publicView).toContain("submitProposalResponse");
    expect(publicView).toContain("PUBLIC_RESPONSE_REJECTION_MESSAGES");
  });

  // 254
  it("marks the selected response tab for assistive technology, not with colour alone", () => {
    expect(publicView).toContain("aria-pressed");
  });

  // 255
  it("ties each field error to its field", () => {
    expect(publicView).toContain("aria-invalid");
    expect(publicView).toContain("aria-describedby");
  });

  // 256
  it("announces the result through a polite live region", () => {
    expect(publicView).toContain('role="status"');
    expect(publicView).toContain('aria-live="polite"');
  });

  // 257
  it("asks for an explicit authorisation confirmation and calls acceptance a recorded decision", () => {
    expect(publicView).toContain("ACCEPTANCE_AUTHORISATION_LABEL");
    expect(publicView).toContain("ACCEPTANCE_RECORD_NOTICE");
    expect(publicView).toContain("DECLINE_CONFIRMATION_LABEL");
    expect(publicView.toLowerCase()).not.toContain("signature");
  });
});

describe("the internal Client Access panel (tests 258-262)", () => {
  // 258
  it("resolves the session and workspace on the server before anything renders", () => {
    expect(accessPage).toContain("resolveDashboardContext");
    expect(accessPage).toContain("await params");
    expect(accessPage).toContain("isDemoMode()");
  });

  // 259
  it("disables publishing with the blocking reason shown, rather than failing on click", () => {
    expect(accessView).toContain("disabled");
    expect(accessView).toContain("blockedReason");
    expect(accessView).toContain("Publish for client access");
  });

  // 260
  it("does not claim a link was delivered, and offers no enabled send-email control", () => {
    expect(accessView).toContain("Saved in browser");
    const lowered = accessView.toLowerCase();
    // "Nothing is emailed" is the panel telling the truth, so the scan is for the claim that
    // something WAS delivered, not for the word.
    expect(accessView).toContain("Nothing is emailed");
    expect(accessView).toContain("nothing was delivered to the client");
    for (const claim of ["send email", "was emailed", "sent to the client", "synced"]) {
      expect(lowered, claim).not.toContain(claim);
    }
  });

  // 261
  it("builds the copyable link from the current origin, never from a hardcoded hostname", () => {
    expect(accessView).toContain("window.location.origin");
    expect(accessView).toContain("proposalAccessPath(");
  });

  // 262
  it("announces publish, copy and revoke results through a polite live region", () => {
    expect(accessView).toContain('role="status"');
    expect(accessView).toContain('aria-live="polite"');
  });
});

describe("what no file in the tree may contain (tests 263-266)", () => {
  // 263
  it("no source file hardcodes a deployment hostname", () => {
    for (const file of sourceFiles()) {
      const src = readFileSync(file, "utf8");
      // lib/routing/public-origin.ts declares the canonical origin every other file
      // imports; it is the single exception, and only for the hostname.
      const isOriginModule = file.replace(/\\/g, "/").endsWith("lib/routing/public-origin.ts");
      expect(isOriginModule || !src.includes("vercel.app"), file).toBe(true);
      expect(src.includes("codeoutfitters.com/proposal"), file).toBe(false);
    }
  });

  // 264
  it("no source file logs or reports a raw access token", () => {
    for (const file of sourceFiles()) {
      const src = readFileSync(file, "utf8");
      for (const leak of ["console.log(token", "console.error(token", "console.warn(token"]) {
        expect(src.includes(leak), `${file}: ${leak}`).toBe(false);
      }
    }
    // No analytics or tracking anywhere on the secure-proposal surfaces. The marketing site
    // has its own consented analytics; a client reading a priced proposal through a private
    // link is not a marketing audience, and none of it may reach here.
    for (const tracker of ["gtag(", "fbq(", "dataLayer.push", "analytics.track", "posthog"]) {
      expect(allNew.includes(tracker), tracker).toBe(false);
    }
    expect(allNew).not.toMatch(/from ['"]next\/script['"]/);
  });

  // 265
  it("the raw token is persisted nowhere: only a hash is stored, and only on the server", () => {
    const token = read("lib/proposals/access/token.ts");
    expect(token).toContain('import "server-only"');
    // `rawToken` appears in the provider contract as an argument and as the one-time return
    // of link creation. What must not exist is a raw token on the stored record — the
    // persisted type carries a hash and, for fixtures only, a separately named demo field, so
    // "the live plane never persists a raw token" is true of the type, not of a convention.
    const model = read("lib/proposals/access/model.ts");
    expect(model).toContain("tokenHash: string");
    expect(model).toContain("demoToken: string | null");
    expect(model).not.toContain("rawToken");
  });

  // 266
  it("the print rules live with the public chrome, are scoped to print, and drop the chrome", () => {
    expect(publicChrome).toContain("@media print");
    expect(publicChrome).toContain(".pp-bar, .pp-foot { display: none; }");
    // The dashboard stylesheet is untouched by this release's print support.
    expect(globals.toLowerCase()).not.toContain("pdf");
  });
});
