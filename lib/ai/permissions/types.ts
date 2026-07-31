// What the assistant is allowed to do, on whose behalf.
//
// The rule this layer exists to enforce: the model never calls a business
// function. It emits a tool name, and something with an identity — a signed-in
// user, in a workspace — is checked against a required permission before that
// name resolves to code. A prompt injection can therefore make the model *ask*
// for anything, and still not reach a capability the human running the session
// does not have.
//
// Deny-by-default is structural, not a policy setting: a grant set is a list of
// what is allowed, an unlisted permission is denied, and there is no wildcard.

/**
 * The capability vocabulary.
 *
 * A closed union rather than free strings so that a typo in a tool definition is
 * a compile error instead of a permission that can never be granted. Adding a
 * capability is a deliberate, reviewable edit to this list.
 */
export type PermissionId =
  | "CanReadCRM"
  | "CanUpdateCRM"
  | "CanReadProjects"
  | "CanUpdateProjects"
  | "CanCreateTask"
  | "CanSendEmail"
  | "CanCreateProposal"
  | "CanViewFinance"
  | "CanCreateInvoice"
  | "CanSearchDocumentation"
  | "CanSummarizeMeeting"
  | "CanReadAnalytics";

export const PERMISSION_IDS: readonly PermissionId[] = [
  "CanReadCRM",
  "CanUpdateCRM",
  "CanReadProjects",
  "CanUpdateProjects",
  "CanCreateTask",
  "CanSendEmail",
  "CanCreateProposal",
  "CanViewFinance",
  "CanCreateInvoice",
  "CanSearchDocumentation",
  "CanSummarizeMeeting",
  "CanReadAnalytics",
];

export function isPermissionId(value: string): value is PermissionId {
  return (PERMISSION_IDS as readonly string[]).includes(value);
}

/**
 * Whether a capability changes state.
 *
 * Mutating tools are the ones worth confirming with a human before they run, so
 * the distinction is declared once here rather than inferred from tool names.
 */
export const MUTATING_PERMISSIONS: readonly PermissionId[] = [
  "CanUpdateCRM",
  "CanUpdateProjects",
  "CanCreateTask",
  "CanSendEmail",
  "CanCreateProposal",
  "CanCreateInvoice",
];

export function isMutating(permission: PermissionId): boolean {
  return MUTATING_PERMISSIONS.includes(permission);
}

/**
 * Who a request runs as.
 *
 * Assembled server-side from the session — never from the request body, and
 * never from anything the model produced. `workspaceId` is carried because
 * grants are per-workspace: the same person may read the CRM in one workspace
 * and not in another.
 */
export type PermissionSubject = {
  userId: string;
  workspaceId: string;
  /** Exactly what this subject may do. Absent means denied; there is no wildcard. */
  grants: readonly PermissionId[];
};

/** The outcome of a check. `allowed: false` always carries a reason for the audit log. */
export type PermissionDecision =
  | { allowed: true; permission: PermissionId }
  | { allowed: false; permission: PermissionId; reason: string };

/**
 * The check itself.
 *
 * An interface rather than a function so a database-backed or policy-engine
 * implementation can replace the in-memory one without touching the tool
 * registry. Synchronous by design: a grant set is resolved once per request, and
 * an await inside the tool loop would invite per-call round trips.
 */
export interface PermissionChecker {
  check(subject: PermissionSubject, permission: PermissionId): PermissionDecision;
  /** Narrows a set of capabilities to those granted. Used to filter tool listings. */
  filter(subject: PermissionSubject, permissions: readonly PermissionId[]): readonly PermissionId[];
}
