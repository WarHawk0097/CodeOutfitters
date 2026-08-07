// The tool registry.
//
// Every call from a model passes through `invoke`, and `invoke` performs the same
// four steps in the same order every time: resolve the name, check the
// permission, validate the arguments, then execute. The ordering is the security
// property — a caller without the permission never reaches schema parsing, and a
// tool body never sees input it did not declare.
//
// The registry is also the only place that decides what the model is told exists.
// Internal tools are omitted from `schemasFor`, and ungranted tools are omitted
// per subject, so the advertised inventory is already the allowed inventory.

import { z } from "zod";
import { ToolError, ValidationError } from "../errors";
import { requirePermission } from "../permissions/checker";
import type { PermissionChecker, PermissionSubject } from "../permissions/types";
import type { ToolSchema } from "../provider/types";
import {
  TOOL_NAME_PATTERN,
  type RegisteredTool,
  type ToolContext,
  type ToolDefinition,
  type ToolResult,
} from "./types";

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  constructor(private readonly permissions: PermissionChecker) {}

  /**
   * Adds a tool. Duplicate names are rejected rather than overwritten: silently
   * replacing a registered tool is how a permission check gets swapped out.
   */
  register<TInput>(tool: ToolDefinition<TInput>): this {
    if (!TOOL_NAME_PATTERN.test(tool.name)) {
      throw new ValidationError(`Invalid tool name "${tool.name}"`, [
        `Tool names must match ${TOOL_NAME_PATTERN}`,
      ]);
    }
    if (this.tools.has(tool.name)) {
      throw new ValidationError(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool as unknown as RegisteredTool);
    return this;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Every registered tool, including internal ones. Server-side callers only. */
  list(): readonly RegisteredTool[] {
    return [...this.tools.values()];
  }

  /**
   * The tools a subject may actually use, minus internal ones.
   *
   * This is what a UI is allowed to show. It is derived from the same grant check
   * that `invoke` enforces, so a listing can never drift from reality.
   */
  listFor(subject: PermissionSubject): readonly RegisteredTool[] {
    return this.list().filter(
      (tool) => !tool.internal && this.permissions.check(subject, tool.permission).allowed,
    );
  }

  /**
   * The model-facing view: name, description, JSON Schema.
   *
   * Generated from the zod schema rather than hand-written, so the schema the
   * model is shown and the schema the input is validated against cannot diverge.
   * `io: "input"` matters for schemas with defaults or transforms — the model
   * must be told what to send, not what comes out.
   */
  schemasFor(subject: PermissionSubject): readonly ToolSchema[] {
    return this.listFor(subject).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.schema, { io: "input", target: "draft-7" }) as Record<
        string,
        unknown
      >,
    }));
  }

  /**
   * Runs one tool call.
   *
   * `rawArguments` is the model's JSON text, untrusted in every respect: it may be
   * malformed, may name a tool that does not exist, and may have been steered by
   * content in the conversation. Each of those is a typed failure the caller can
   * report back to the model without ending the turn.
   */
  async invoke(
    name: string,
    rawArguments: string,
    context: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      // Names the requested tool only — never the inventory, which would let a
      // crafted prompt enumerate capabilities the caller cannot use.
      throw new ToolError(name, `No such tool: "${name}"`);
    }

    requirePermission(this.permissions, context.subject, tool.permission);

    let parsedArguments: unknown;
    try {
      parsedArguments = rawArguments.trim() === "" ? {} : JSON.parse(rawArguments);
    } catch (error) {
      throw new ValidationError(`Tool "${name}" received arguments that are not valid JSON`, [], {
        cause: error,
      });
    }

    const result = tool.schema.safeParse(parsedArguments);
    if (!result.success) {
      throw new ValidationError(
        `Tool "${name}" received arguments that do not match its schema`,
        result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
      );
    }

    try {
      return await tool.execute(result.data, context);
    } catch (error) {
      if (error instanceof ToolError) throw error;
      // The tool's own message may quote internal state, so it stays server-side
      // in `message` while the client sees `ToolError`'s constant safe text.
      throw new ToolError(name, error instanceof Error ? error.message : String(error), {
        cause: error,
      });
    }
  }
}
