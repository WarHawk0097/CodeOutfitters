// The permission system.
//
// Deny-by-default is a structural claim, so it is tested structurally: every
// permission in the vocabulary is denied to a subject with no grants, and a
// denial reason never becomes a way to read the rest of someone's access.

import { describe, expect, it } from "vitest";
import { PermissionError } from "../errors";
import {
  DenyAllPermissionChecker,
  GrantListPermissionChecker,
  denyAllPermissionChecker,
  requirePermission,
} from "./checker";
import {
  MUTATING_PERMISSIONS,
  PERMISSION_IDS,
  isMutating,
  isPermissionId,
  type PermissionSubject,
} from "./types";

const SUBJECT: PermissionSubject = {
  userId: "user-1",
  workspaceId: "workspace-1",
  grants: ["CanReadCRM", "CanViewFinance"],
};

const EMPTY: PermissionSubject = { ...SUBJECT, grants: [] };

describe("the vocabulary", () => {
  it("is a closed set with no duplicates", () => {
    expect(new Set(PERMISSION_IDS).size).toBe(PERMISSION_IDS.length);
  });

  it("recognises only its own members", () => {
    expect(isPermissionId("CanReadCRM")).toBe(true);
    expect(isPermissionId("CanDoAnything")).toBe(false);
  });

  it("classifies every mutating capability as a write", () => {
    expect(MUTATING_PERMISSIONS.every((permission) => isMutating(permission))).toBe(true);
    expect(isMutating("CanReadCRM")).toBe(false);
  });

  it("treats read capabilities as non-mutating", () => {
    const reads = PERMISSION_IDS.filter((permission) => !MUTATING_PERMISSIONS.includes(permission));
    expect(reads.some((permission) => isMutating(permission))).toBe(false);
  });
});

describe("GrantListPermissionChecker", () => {
  const checker = new GrantListPermissionChecker();

  it("allows exactly what is granted", () => {
    expect(checker.check(SUBJECT, "CanReadCRM")).toEqual({ allowed: true, permission: "CanReadCRM" });
  });

  it("denies everything else, with no wildcard", () => {
    const denied = PERMISSION_IDS.filter((permission) => !SUBJECT.grants.includes(permission));
    expect(denied.every((permission) => !checker.check(SUBJECT, permission).allowed)).toBe(true);
  });

  it("denies every permission to a subject with no grants", () => {
    expect(PERMISSION_IDS.every((permission) => !checker.check(EMPTY, permission).allowed)).toBe(true);
  });

  it("never names the subject's other grants in a denial", () => {
    const decision = checker.check(SUBJECT, "CanSendEmail");
    const reason = decision.allowed ? "" : decision.reason;

    expect(reason).toContain(SUBJECT.workspaceId);
    for (const grant of SUBJECT.grants) expect(reason).not.toContain(grant);
  });

  it("narrows a list to the granted subset, preserving order", () => {
    expect(checker.filter(SUBJECT, ["CanSendEmail", "CanViewFinance", "CanReadCRM"])).toEqual([
      "CanViewFinance",
      "CanReadCRM",
    ]);
  });
});

describe("DenyAllPermissionChecker", () => {
  it("denies even a granted permission, because there is no identity to trust", () => {
    expect(new DenyAllPermissionChecker().check(SUBJECT, "CanReadCRM").allowed).toBe(false);
  });

  it("filters everything away", () => {
    expect(denyAllPermissionChecker.filter(SUBJECT, PERMISSION_IDS)).toEqual([]);
  });
});

describe("requirePermission", () => {
  const checker = new GrantListPermissionChecker();

  it("returns silently when the grant exists", () => {
    expect(() => requirePermission(checker, SUBJECT, "CanReadCRM")).not.toThrow();
  });

  it("throws a typed, client-safe refusal", () => {
    let caught: unknown;
    try {
      requirePermission(checker, SUBJECT, "CanSendEmail");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PermissionError);
    const failure = caught as PermissionError;
    expect(failure.permission).toBe("CanSendEmail");
    expect(failure.retryable).toBe(false);
    expect(failure.toClientJSON()).toEqual({
      code: "ai/permission",
      message: "You do not have access to that.",
      retryable: false,
    });
  });
});
