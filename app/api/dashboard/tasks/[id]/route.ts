// Tasks — update one task (edit, complete, reopen, mark/stop waiting, reassign). No DELETE:
// the tasks table grants none, so this route offers none either. Same identity and
// error-mapping shape as app/api/dashboard/saved-views/[id]/route.ts.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { isUuid } from "@/lib/dashboard/validation";
import { jsonError, jsonOk } from "@/lib/tasks/api-response";
import { serverTaskProvider, TaskError } from "@/lib/tasks/server-provider";
import type { TaskPriority, TaskState } from "@/lib/demo/types";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Tasks are not available.";
const TASK_PRIORITIES: readonly TaskPriority[] = ["High", "Medium", "Low"];
const TASK_STATES: readonly TaskState[] = ["OPEN", "WAITING", "COMPLETED"];

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;
  if (!isUuid(id)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      id: "That is not a valid task id.",
    });
  }

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

  const patch: Record<string, unknown> = {};

  if (candidate.title !== undefined) {
    if (typeof candidate.title !== "string" || candidate.title.trim() === "") {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        title: "A task needs a title.",
      });
    }
    patch.title = candidate.title;
  }
  if (candidate.detail !== undefined) {
    if (typeof candidate.detail !== "string") {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        detail: "Detail must be text.",
      });
    }
    patch.detail = candidate.detail;
  }
  if (candidate.ownerId !== undefined) {
    if (typeof candidate.ownerId !== "string" || candidate.ownerId === "") {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        ownerId: "That is not a valid owner.",
      });
    }
    patch.ownerId = candidate.ownerId;
  }
  if (candidate.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(candidate.priority as TaskPriority)) {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        priority: "That is not a valid priority.",
      });
    }
    patch.priority = candidate.priority;
  }
  if (candidate.dueDate !== undefined) {
    if (typeof candidate.dueDate !== "string") {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        dueDate: "That is not a valid date.",
      });
    }
    patch.dueDate = candidate.dueDate;
  }
  if (candidate.state !== undefined) {
    if (!TASK_STATES.includes(candidate.state as TaskState)) {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        state: "That is not a valid state.",
      });
    }
    patch.state = candidate.state;
  }
  if (candidate.waitingOn !== undefined) {
    if (typeof candidate.waitingOn !== "string") {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        waitingOn: "That is not valid.",
      });
    }
    patch.waitingOn = candidate.waitingOn;
  }

  try {
    const task = await serverTaskProvider.update({ workspaceId: context.workspaceId, taskId: id, patch });
    return jsonOk({ task }, correlationId);
  } catch (error) {
    if (error instanceof TaskError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
