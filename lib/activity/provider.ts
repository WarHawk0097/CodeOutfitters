// The live activity contract.
//
// Two planes, decided in one place:
//   demo      deterministic seeded history in this browser, zero Supabase requests
//   live      a workspace-scoped provider reading with the caller's session
//
// There is no third plane and no fallback. If the live provider is not connected the
// screens say so; they do not quietly show demo history, because history a workspace did
// not produce is not history, it is a fabrication with timestamps on it.
import type { ActivityCategory, ActivityEvent, ActivityRecordKind } from "./model";

/** Reads are always workspace-scoped. The workspace comes from the authenticated session
 *  on the server — it is a parameter here because the provider is an interface, not
 *  because a browser may choose it. */
export type ActivityQuery = {
  workspaceId: string;
  /** Limit to one record's history, including events that roll up to it. */
  record?: { kind: ActivityRecordKind; id: string };
  categories?: readonly ActivityCategory[];
  /** Newest N. The caller always bounds the read: an unbounded activity query on a busy
   *  workspace is a slow page and a large payload. */
  limit?: number;
};

/** A domain operation that produced history — never a free-form event.
 *
 *  Deliberately absent: `actorId`, `occurredAt`, `source`, `visibility`. A client that can
 *  set those can forge who did what and when. The server derives the actor from the
 *  session, the instant from the database, the source from the fact that it arrived through
 *  an authenticated operation, and the visibility from the event type. */
export type ActivityWriteIntent = {
  workspaceId: string;
  /** The operation the user actually performed, e.g. "task_completed". */
  operation: ActivityEvent["type"];
  target: { kind: ActivityRecordKind; id: string };
  parent?: { kind: ActivityRecordKind; id: string };
  /** Values the operation genuinely carries (old/new stage, version number). Rendered as
   *  labelled pairs; never a JSON blob shown to a user. */
  metadata?: readonly { label: string; value: string }[];
};

export type ActivityProvider = {
  list(query: ActivityQuery): Promise<ActivityEvent[]>;
  /** Record history produced by a domain operation. Returns the stored event so the caller
   *  renders exactly what was written rather than an optimistic guess. */
  record(intent: ActivityWriteIntent): Promise<ActivityEvent>;
};

export type ActivityPlane =
  | { kind: "demo" }
  | { kind: "provider_required"; reason: string };

export const ACTIVITY_PROVIDER_REQUIRED_TITLE = "Activity history is not connected yet";

export const ACTIVITY_PROVIDER_REQUIRED_REASON =
  "This workspace is running in live mode. Activity is stored in the workspace database and read with your session, so it is not available until the activity service is connected. No history is being kept in this browser, and none is being shown from the demo data.";

/** Live mode never resolves to demo. The absence of a backend is reported, not papered
 *  over. */
export function resolveActivityPlane(live: boolean): ActivityPlane {
  return live
    ? { kind: "provider_required", reason: ACTIVITY_PROVIDER_REQUIRED_REASON }
    : { kind: "demo" };
}
