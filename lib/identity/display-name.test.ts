// Regression: the account footer/rail/header avatar used to read the demo
// CURRENT_USER constant unconditionally (lib/identity/current-user.ts), so any
// real, live-authenticated person saw "Marc Bryce" instead of themselves. These
// tests cover the pure precedence logic that replaced that hardcode; the
// Supabase-facing scoping is covered separately in lib/dashboard/viewer-identity.test.ts.
import { describe, expect, it } from "vitest";
import { resolveDisplayName, initialsFor } from "./display-name";

describe("resolveDisplayName", () => {
  it("a real Google-authenticated user never resolves to the demo identity", () => {
    // The exact reported bug: T. Samuel (tsamuel@souvenirphotograph.com) saw
    // "Marc Bryce". This function has no reference to CURRENT_USER at all, so
    // there is no code path back to it.
    const name = resolveDisplayName({
      profileFullName: null,
      providerFullName: "Tay Samuel",
      providerGivenName: null,
      providerFamilyName: null,
      email: "tsamuel@souvenirphotograph.com",
    });
    expect(name).toBe("Tay Samuel");
    expect(name).not.toBe("Marc Bryce");
  });

  it("two different Google users resolve to their own, distinct names", () => {
    const a = resolveDisplayName({
      profileFullName: null,
      providerFullName: "Tay Samuel",
      providerGivenName: null,
      providerFamilyName: null,
      email: "tsamuel@souvenirphotograph.com",
    });
    const b = resolveDisplayName({
      profileFullName: null,
      providerFullName: null,
      providerGivenName: "Mark",
      providerFamilyName: "Bryce",
      email: "mbryce@souvenirphotograph.com",
    });
    expect(a).toBe("Tay Samuel");
    expect(b).toBe("Mark Bryce");
    expect(a).not.toBe(b);
  });

  it("an explicit application profile wins over whatever the provider says", () => {
    const name = resolveDisplayName({
      profileFullName: "T. Samuel",
      providerFullName: "Tay Samuel",
      providerGivenName: "Tay",
      providerFamilyName: "Samuel",
      email: "tsamuel@souvenirphotograph.com",
    });
    expect(name).toBe("T. Samuel");
  });

  it("falls back to given+family name when the provider has no combined full name", () => {
    const name = resolveDisplayName({
      profileFullName: null,
      providerFullName: null,
      providerGivenName: "Grace",
      providerFamilyName: "Hopper",
      email: "grace@example.test",
    });
    expect(name).toBe("Grace Hopper");
  });

  it("falls back to the email local-part when Google supplies no name at all", () => {
    const name = resolveDisplayName({
      profileFullName: null,
      providerFullName: null,
      providerGivenName: null,
      providerFamilyName: null,
      email: "your-real-email+codeoutfitters-qa@gmail.com",
    });
    expect(name).toBe("your-real-email+codeoutfitters-qa");
  });

  it("never renders blank: falls back to a generic label with no name and no email", () => {
    const name = resolveDisplayName({
      profileFullName: null,
      providerFullName: null,
      providerGivenName: null,
      providerFamilyName: null,
      email: null,
    });
    expect(name).toBe("Account");
  });

  it("treats whitespace-only fields as absent", () => {
    const name = resolveDisplayName({
      profileFullName: "   ",
      providerFullName: "  ",
      providerGivenName: null,
      providerFamilyName: null,
      email: "person@example.test",
    });
    expect(name).toBe("person");
  });
});

describe("initialsFor", () => {
  it("takes first+last initial for a multi-word name", () => {
    expect(initialsFor("Tay Samuel")).toBe("TS");
  });
  it("takes the first two letters of a single-word name", () => {
    expect(initialsFor("Cher")).toBe("CH");
  });
  it("never crashes on an empty name", () => {
    expect(initialsFor("")).toBe("?");
  });
});
