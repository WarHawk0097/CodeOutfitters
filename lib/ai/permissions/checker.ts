// The default permission checker.
//
// It reads a grant list and answers yes or no. That is the entire implementation,
// and it staying that small is deliberate: the security property is "an unlisted
// permission is denied", and the shortest code that has that property is the
// easiest to prove correct. A policy engine can replace this later behind
// `PermissionChecker` without any caller noticing.

import { PermissionError } from "../errors";
import type {
  PermissionChecker,
  PermissionDecision,
  PermissionId,
  PermissionSubject,
} from "./types";

export class GrantListPermissionChecker implements PermissionChecker {
  check(subject: PermissionSubject, permission: PermissionId): PermissionDecision {
    if (!subject.grants.includes(permission)) {
      // The reason names the capability, never the subject's other grants —
      // an error must not become a way to enumerate someone's access.
      return { allowed: false, permission, reason: `Not granted in workspace ${subject.workspaceId}` };
    }
    return { allowed: true, permission };
  }

  filter(
    subject: PermissionSubject,
    permissions: readonly PermissionId[],
  ): readonly PermissionId[] {
    return permissions.filter((permission) => this.check(subject, permission).allowed);
  }
}

/**
 * A checker that denies everything.
 *
 * The default wherever a subject has not been established. Making "no identity"
 * behave as "no access" removes the failure mode where an unauthenticated path
 * silently inherits full capability.
 */
export class DenyAllPermissionChecker implements PermissionChecker {
  check(_subject: PermissionSubject, permission: PermissionId): PermissionDecision {
    return { allowed: false, permission, reason: "No permissions are granted in this context" };
  }

  filter(): readonly PermissionId[] {
    return [];
  }
}

export const denyAllPermissionChecker: PermissionChecker = new DenyAllPermissionChecker();

/** Throws on denial. The form the tool registry uses, where there is no fallback path. */
export function requirePermission(
  checker: PermissionChecker,
  subject: PermissionSubject,
  permission: PermissionId,
): void {
  const decision = checker.check(subject, permission);
  if (!decision.allowed) throw new PermissionError(permission, `${permission}: ${decision.reason}`);
}
