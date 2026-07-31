// Who a Copilot turn runs as.
//
// One rule: the subject comes from the session and from the workspace membership
// table, never from the request. `getDashboardContext` is the same resolver the
// authenticated dashboard pages use, so the assistant sees exactly the workspace
// the rest of the product would show this user, and RLS remains the boundary
// underneath either way.
//
// The grant set is empty on purpose. This slice registers no tools, and a grant
// that no tool consumes is a capability waiting to be picked up by the first one
// that appears. Read-only stays read-only by having nothing to grant.

import "server-only";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { createClient } from "@/lib/supabase/server";
import type { PermissionId, PermissionSubject } from "@/lib/ai";

export type CopilotSubjectResult =
  | { ok: true; subject: PermissionSubject; workspaceName: string }
  | { ok: false; reason: "unauthenticated" | "no_workspace" };

/** No capability is granted, so no tool can ever be offered on this path. */
const READ_ONLY_GRANTS: readonly PermissionId[] = [];

/**
 * Resolves the trusted subject, or the reason there is not one.
 *
 * The two failures are kept apart because they mean different things to a
 * caller: a signed-out user should sign in, and a signed-in user without an
 * active membership never will by retrying. Neither answer reveals whether an
 * account, a workspace or a membership exists.
 */
export async function resolveCopilotSubject(): Promise<CopilotSubjectResult> {
  // Demo mode has no data tier and no session; it must not reach Supabase, whose
  // client requires environment the demo deployment deliberately does not set.
  if (isDemoMode()) return { ok: false, reason: "unauthenticated" };

  const context = await getDashboardContext();
  if (context) {
    return {
      ok: true,
      subject: {
        userId: context.userId,
        workspaceId: context.workspaceId,
        grants: READ_ONLY_GRANTS,
      },
      workspaceName: context.workspaceName,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { ok: false, reason: user ? "no_workspace" : "unauthenticated" };
}
