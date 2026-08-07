// What a tool is.
//
// A tool is the only way the assistant reaches anything real, so its shape is
// where the safety properties are fixed: a required permission that is not
// optional, a zod schema that is the sole source of both validation and the JSON
// Schema advertised to the model, and an executor that receives already-validated
// input and an authenticated subject.
//
// No business logic lives in this layer or anywhere under it in this branch —
// only the contract that future tools will satisfy.

import type { z } from "zod";
import type { PermissionId, PermissionSubject } from "../permissions/types";
import type { Logger } from "../observability/types";

/**
 * What an executor is given besides its input.
 *
 * The subject is here rather than in the input schema so that identity can never
 * be supplied by the model: everything in `input` originated as generated text,
 * everything in the context originated server-side.
 */
export type ToolContext = {
  subject: PermissionSubject;
  conversationId: string;
  /** Aborts when the caller disconnects. Long-running tools must honour it. */
  signal?: AbortSignal;
  logger: Logger;
};

/**
 * A tool's output.
 *
 * `content` is the text fed back to the model. `data` is the structured value for
 * the application — a UI can render a real table instead of re-parsing prose.
 * `isError` marks a handled failure that the model should see and react to,
 * as opposed to a thrown `ToolError`, which ends the turn.
 */
export type ToolResult = {
  content: string;
  data?: unknown;
  isError?: boolean;
};

export type ToolDefinition<TInput> = {
  /** Stable identity, used in logs and audit records. Survives renames of `name`. */
  id: string;
  /** What the model calls. Must match `TOOL_NAME_PATTERN`. */
  name: string;
  /** Written for the model: when to use this, and when not to. */
  description: string;
  /** Required capability. Deny-by-default means there is no "public" tool. */
  permission: PermissionId;
  /** Validation and JSON Schema, from one declaration. */
  schema: z.ZodType<TInput>;
  /**
   * Hides the tool from listings and from any client-facing surface, while
   * leaving it callable internally. Prevents the tool inventory from becoming a
   * map of the business for anyone who can reach a chat box.
   */
  internal?: boolean;
  /** Runs only after the permission check and schema validation have both passed. */
  execute: (input: TInput, context: ToolContext) => Promise<ToolResult>;
};

/**
 * The heterogeneous form used for storage.
 *
 * A registry holds tools with different input types; TypeScript has no existential
 * type to express that directly. Narrowing the stored type to `unknown` input is
 * sound because the registry only ever invokes a tool through `execute` after
 * parsing with that tool's own schema.
 */
export type RegisteredTool = ToolDefinition<unknown>;

/** Provider APIs accept this character set; enforcing it early avoids a 400 later. */
export const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;

/**
 * Identity helper that preserves the inferred input type.
 *
 * Without it, `schema: z.object({...})` and `execute(input)` are inferred
 * independently and `input` degrades to the schema's output type at the call
 * site. With it, one generic ties them together.
 */
export function defineTool<TInput>(tool: ToolDefinition<TInput>): ToolDefinition<TInput> {
  return tool;
}
