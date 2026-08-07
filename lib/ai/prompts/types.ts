// Prompt management.
//
// Prompts are versioned assets, not string literals scattered through call sites.
// Giving them ids and versions is what makes it possible to say which prompt
// produced a given answer, to change one without grepping for its text, and to
// keep them out of the client bundle entirely.
//
// Four layers, in a fixed precedence order. The order is the contract: workspace
// customisation can extend behaviour but never outrank the system layer, and user
// text is always the least privileged input in the stack.

/**
 * Precedence, highest first.
 *
 * - `system`: product-level rules. Never sourced from any request.
 * - `developer`: feature-level instructions from the calling code.
 * - `workspace`: per-tenant customisation. Configured by an admin, not a prompt.
 * - `user`: the message typed by the human.
 */
export type PromptLayer = "system" | "developer" | "workspace" | "user";

export const PROMPT_LAYER_ORDER: readonly PromptLayer[] = [
  "system",
  "developer",
  "workspace",
  "user",
];

/** Variables a template may interpolate. Scalars only — no nested rendering. */
export type PromptVariables = Readonly<Record<string, string | number | boolean>>;

export type PromptTemplate = {
  id: string;
  layer: PromptLayer;
  /** Bumped whenever the text changes, so a logged version identifies exact text. */
  version: number;
  /** `{{name}}` placeholders. Every one must appear in `variables`. */
  template: string;
  /** Declared placeholders. Rendering is strict against this list in both directions. */
  variables: readonly string[];
  /**
   * Marks a prompt as never disclosable, even to an authenticated dashboard user.
   * System and developer prompts are product; exposing them hands over the design
   * and reveals the tool surface.
   */
  confidential: boolean;
};

/** A rendered layer, ready to be turned into a message. */
export type RenderedPrompt = {
  id: string;
  layer: PromptLayer;
  version: number;
  text: string;
};

export const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/** The placeholders actually written in a template. Used to validate declarations. */
export function placeholdersIn(template: string): readonly string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}
