// Tasks — list (+ workspace roster) and create, scoped to the caller's authenticated
// workspace. Same shape as app/api/dashboard/saved-views/route.ts: authenticate, validate,
// hand off to the provider, map the result — RLS is the boundary underneath either way.
//
// GET always returns the full workspace task list (no server-side view/sort filtering) —
// lib/tasks/model.ts's pure functions do that client-side, same data either plane uses.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/tasks/api-response";
import { serverTaskProvider, listWorkspaceTeam, TaskError } from "@/lib/tasks/server-provider";
import type { TaskPriority, TaskRelationKind } from "@/lib/demo/types";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Tasks are not available.";
const TASK_PRIORITIES: readonly TaskPriority[] = ["High", "Medium", "Low"];
const TASK_RELATION_KINDS: readonly TaskRelationKind[] = [
  "lead",
  "opportunity",
  "appointment",
  "meeting",
  "proposal",
  "followUp",
];

function statusForCode(code: TaskError["code"]): number {
  switch (code) {
    case "invalid":
      return 422;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
  }
}

function normalizeRelation(raw: unknown): { kind: TaskRelationKind; id: string; label: string } | undefined | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const candidate = raw as Record<string, unknown>;
  if (!TASK_RELATION_KINDS.includes(candidate.kind as TaskRelationKind)) return undefined;
  if (typeof candidate.id !== "string" || candidate.id === "") return undefined;
  if (typeof candidate.label !== "string" || candidate.label === "") return undefined;
  return { kind: candidate.kind as TaskRelationKind, id: candidate.id, label: candidate.label };
}

export async function GET(): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  try {
    const [tasks, team] = await Promise.all([
      serverTaskProvider.list({ workspaceId: context.workspaceId }),
      listWorkspaceTeam(context.workspaceId),
    ]);
    return jsonOk({ tasks, team, viewer: { userId: context.userId, role: context.role } }, correlationId);
  } catch (error) {
    if (error instanceof TaskError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(422, "validation", "That request was not valid JSON.", correlationId);
  }
  if (typeof body !== "object" || body === null) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId);
  }
  const candidate = body as Record<string, unknown>;

  if (typeof candidate.title !== "string" || candidate.title.trim() === "") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      title: "A task needs a title.",
    });
  }
  if (typeof candidate.ownerId !== "string" || candidate.ownerId === "") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      ownerId: "A task needs an owner.",
    });
  }
  if (candidate.detail !== undefined && typeof candidate.detail !== "string") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      detail: "Detail must be text.",
    });
  }
  if (candidate.priority !== undefined && !TASK_PRIORITIES.includes(candidate.priority as TaskPriority)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      priority: "That is not a valid priority.",
    });
  }
  if (candidate.dueDate !== undefined && typeof candidate.dueDate !== "string") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      dueDate: "That is not a valid date.",
    });
  }
  if (candidate.leadId !== undefined && candidate.leadId !== null && typeof candidate.leadId !== "string") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      leadId: "That is not a valid lead.",
    });
  }
  const relation = normalizeRelation(candidate.relation);
  if (relation === undefined) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      relation: "That is not a valid related record.",
    });
  }

  try {
    const task = await serverTaskProvider.create({
      workspaceId: context.workspaceId,
      title: candidate.title,
      detail: candidate.detail as string | undefined,
      ownerId: candidate.ownerId,
      priority: candidate.priority as TaskPriority | undefined,
      dueDate: candidate.dueDate as string | undefined,
      leadId: candidate.leadId as string | null | undefined,
      relation: relation ?? undefined,
    });
    return jsonOk({ task }, correlationId);
  } catch (error) {
    if (error instanceof TaskError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
