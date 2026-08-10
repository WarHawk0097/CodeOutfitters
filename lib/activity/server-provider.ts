import "server-only";

// Live ActivityProvider — server-only. Mirrors lib/tasks/server-provider.ts: every query is
// workspace-scoped in the SQL itself as defense in depth, not the whole of the boundary (RLS
// in supabase/migrations/20260730000000_command_center_activity.sql is). Never forwards the
// raw Postgres message to a caller. actor_id/occurred_at/created_at are never set on insert —
// activity_events_derive_actor overwrites them from the session and the database clock, and
// source/visibility are left to their column defaults for the same reason.
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_EVENT_META } from "./model";
import type {
  ActivityCategory,
  ActivityEvent,
  ActivityEventType,
  ActivityImportance,
  ActivityRecordKind,
  ActivitySource,
  ActivityVisibility,
} from "./model";
import type { ActivityProvider, ActivityQuery, ActivityWriteIntent } from "./provider";

export type ActivityErrorCode = "invalid" | "forbidden";

export class ActivityError extends Error {
  constructor(
    public readonly code: ActivityErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ActivityError";
  }
}

function throwForPgError(error: { code?: string; message: string }): never {
  if (error.code === "42501") throw new ActivityError("forbidden", "You do not have permission to do that.");
  throw new ActivityError("invalid", "That activity request could not be completed.");
}

type ActivityRow = {
  id: string;
  event_type: string;
  category: ActivityCategory;
  importance: ActivityImportance;
  source: ActivitySource;
  visibility: ActivityVisibility;
  actor_id: string | null;
  actor_label: string;
  related_kind: ActivityRecordKind;
  related_id: string;
  related_label: string;
  parent_kind: ActivityRecordKind | null;
  parent_id: string | null;
  parent_label: string | null;
  summary: string;
  detail: string;
  metadata: { label: string; value: string }[];
  occurred_at: string;
};

const SELECT_COLUMNS =
  "id, event_type, category, importance, source, visibility, actor_id, actor_label, related_kind, related_id, related_label, parent_kind, parent_id, parent_label, summary, detail, metadata, occurred_at";

function rowToEvent(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    type: row.event_type as ActivityEventType,
    category: row.category,
    source: row.source,
    visibility: row.visibility,
    importance: row.importance,
    actorId: row.actor_id,
    actorLabel: row.actor_label,
    occurredAt: row.occurred_at,
    summary: row.summary,
    detail: row.detail,
    related: { kind: row.related_kind, id: row.related_id, label: row.related_label },
    parent:
      row.parent_kind && row.parent_id && row.parent_label
        ? { kind: row.parent_kind, id: row.parent_id, label: row.parent_label }
        : null,
    metadata: row.metadata ?? [],
  };
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const serverActivityProvider: ActivityProvider = {
  async list(query: ActivityQuery): Promise<ActivityEvent[]> {
    const supabase = await createClient();
    let request = supabase.from("activity_events").select(SELECT_COLUMNS).eq("workspace_id", query.workspaceId);

    // A record's own events, plus the events that roll up to it — same definition as
    // lib/activity/model.ts's eventsFor(), reproduced in SQL instead of fetched-then-filtered.
    if (query.record) {
      const { kind, id } = query.record;
      request = request.or(
        `and(related_kind.eq.${kind},related_id.eq.${id}),and(parent_kind.eq.${kind},parent_id.eq.${id})`,
      );
    }
    if (query.categories && query.categories.length > 0) {
      request = request.in("category", query.categories as string[]);
    }

    const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const { data, error } = await request.order("occurred_at", { ascending: false }).limit(limit);
    if (error) throwForPgError(error);
    return (data ?? []).map(rowToEvent);
  },

  async record(intent: ActivityWriteIntent): Promise<ActivityEvent> {
    const summary = intent.summary.trim();
    if (summary === "") throw new ActivityError("invalid", "An activity event needs a summary.");
    const meta = ACTIVITY_EVENT_META[intent.operation];
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_events")
      .insert({
        workspace_id: intent.workspaceId,
        event_type: intent.operation,
        category: meta.category,
        importance: meta.importance,
        related_kind: intent.target.kind,
        related_id: intent.target.id,
        related_label: intent.target.label,
        parent_kind: intent.parent?.kind ?? null,
        parent_id: intent.parent?.id ?? null,
        parent_label: intent.parent?.label ?? null,
        summary,
        detail: intent.detail?.trim() ?? "",
        metadata: intent.metadata ?? [],
        // actor_id, occurred_at, created_at: trigger-derived. source, visibility: column
        // defaults. None of the five is set here — see the file header.
      })
      .select(SELECT_COLUMNS)
      .single();
    if (error) throwForPgError(error);
    return rowToEvent(data);
  },
};
