import "server-only";

// Emit-after-mutation helper for Tasks and Saved Views (see lib/tasks/server-provider.ts,
// lib/views/server-provider.ts). Never call this before the primary mutation has committed.
//
// Failure semantics: an activity row is a record of something that already happened, not a
// condition for it happening. If the insert fails, the mutation it describes must still stand
// — so the error is logged, never rethrown, and never reaches the caller as a failed request.
import { serverActivityProvider } from "./server-provider";
import type { ActivityWriteIntent } from "./provider";

export async function recordActivity(intent: ActivityWriteIntent): Promise<void> {
  try {
    await serverActivityProvider.record(intent);
  } catch (error) {
    console.error(`[activity] failed to record ${intent.operation} for ${intent.workspaceId}`, error);
  }
}
