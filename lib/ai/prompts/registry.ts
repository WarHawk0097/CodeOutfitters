// The prompt registry and renderer.
//
// Rendering is strict in both directions: a declared variable that is not
// supplied fails, and a supplied variable that is not declared fails. The second
// half matters more than it looks — a lenient renderer lets caller data reach a
// template that was never designed to carry it, which is how untrusted text ends
// up inside a system prompt.
//
// Interpolated values are escaped for the same reason. A workspace name of
// "{{tool_output}}" is a string, not a placeholder, and never becomes one.

import { ValidationError } from "../errors";
import {
  PROMPT_LAYER_ORDER,
  placeholdersIn,
  type PromptLayer,
  type PromptTemplate,
  type PromptVariables,
  type RenderedPrompt,
} from "./types";

export class PromptRegistry {
  private readonly templates = new Map<string, PromptTemplate>();

  constructor(templates: readonly PromptTemplate[] = []) {
    for (const template of templates) this.register(template);
  }

  /**
   * Adds a template, checking that its declaration matches its text.
   *
   * Catching the mismatch at registration rather than at render time means a
   * typo'd placeholder fails on the first import, not on the first user request
   * that happens to reach that prompt.
   */
  register(template: PromptTemplate): this {
    if (this.templates.has(template.id)) {
      throw new ValidationError(`Prompt "${template.id}" is already registered`);
    }

    const used = placeholdersIn(template.template);
    const undeclared = used.filter((name) => !template.variables.includes(name));
    const unused = template.variables.filter((name) => !used.includes(name));
    if (undeclared.length > 0 || unused.length > 0) {
      throw new ValidationError(`Prompt "${template.id}" has a variable mismatch`, [
        ...undeclared.map((name) => `{{${name}}} is used but not declared`),
        ...unused.map((name) => `"${name}" is declared but not used`),
      ]);
    }

    this.templates.set(template.id, template);
    return this;
  }

  get(id: string): PromptTemplate {
    const template = this.templates.get(id);
    if (!template) throw new ValidationError(`No such prompt: "${id}"`);
    return template;
  }

  has(id: string): boolean {
    return this.templates.has(id);
  }

  /**
   * Metadata for every prompt, with no text.
   *
   * The only listing that may cross a network boundary: an operator can see which
   * prompts exist and at what version without the confidential bodies.
   */
  describe(): readonly { id: string; layer: PromptLayer; version: number; confidential: boolean }[] {
    return [...this.templates.values()].map(({ id, layer, version, confidential }) => ({
      id,
      layer,
      version,
      confidential,
    }));
  }

  render(id: string, variables: PromptVariables = {}): RenderedPrompt {
    const template = this.get(id);
    const supplied = Object.keys(variables);

    const missing = template.variables.filter((name) => !supplied.includes(name));
    const extra = supplied.filter((name) => !template.variables.includes(name));
    if (missing.length > 0 || extra.length > 0) {
      throw new ValidationError(`Prompt "${id}" received the wrong variables`, [
        ...missing.map((name) => `missing: ${name}`),
        ...extra.map((name) => `unexpected: ${name}`),
      ]);
    }

    const text = template.template.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (_match, name: string) =>
      escapePlaceholders(String(variables[name])),
    );

    return { id: template.id, layer: template.layer, version: template.version, text };
  }
}

/**
 * Neutralises placeholder syntax inside an interpolated value.
 *
 * Substitution runs in a single pass, so a `{{...}}` in a value would not be
 * re-expanded today. It is escaped anyway: the guarantee should hold because the
 * value is data, not because of the order the replacement happens to run in.
 */
export function escapePlaceholders(value: string): string {
  return value.replace(/\{\{/g, "{ {").replace(/\}\}/g, "} }");
}

/**
 * Orders rendered layers by precedence.
 *
 * Sorting here rather than trusting call order means a caller cannot promote user
 * text above the system layer by assembling the array differently.
 */
export function orderByLayer(prompts: readonly RenderedPrompt[]): readonly RenderedPrompt[] {
  return [...prompts].sort(
    (a, b) => PROMPT_LAYER_ORDER.indexOf(a.layer) - PROMPT_LAYER_ORDER.indexOf(b.layer),
  );
}
