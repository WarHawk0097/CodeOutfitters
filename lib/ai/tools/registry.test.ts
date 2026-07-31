// The tool registry.
//
// The ordering assertions are the important ones: a caller without the permission
// must be refused before its arguments are looked at, and a tool body must never
// run on input it did not declare. The listing assertions matter for the same
// reason — what the model is told exists is what the subject is allowed to use.

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { PermissionError, ToolError, ValidationError } from "../errors";
import { GrantListPermissionChecker } from "../permissions/checker";
import type { PermissionSubject } from "../permissions/types";
import { noopLogger } from "../observability/types";
import { ToolRegistry } from "./registry";
import { defineTool, type ToolContext } from "./types";

const SUBJECT: PermissionSubject = {
  userId: "user-1",
  workspaceId: "workspace-1",
  grants: ["CanReadCRM", "CanReadProjects"],
};

const CONTEXT: ToolContext = {
  subject: SUBJECT,
  conversationId: "conversation-1",
  logger: noopLogger,
};

const searchCrm = defineTool({
  id: "crm.search",
  name: "search_crm",
  description: "Finds a customer record by name.",
  permission: "CanReadCRM",
  schema: z.object({ query: z.string().min(1) }),
  execute: async (input) => ({ content: `found ${input.query}` }),
});

function registry(): ToolRegistry {
  return new ToolRegistry(new GrantListPermissionChecker()).register(searchCrm);
}

describe("registration", () => {
  it("rejects a name a provider API would reject", () => {
    const invalid = { ...searchCrm, name: "Search CRM" };
    expect(() => new ToolRegistry(new GrantListPermissionChecker()).register(invalid)).toThrow(
      ValidationError,
    );
  });

  it("refuses to overwrite a registered tool", () => {
    expect(() => registry().register(searchCrm)).toThrow(/already registered/);
  });
});

describe("listing", () => {
  it("hides tools the subject has no grant for", () => {
    const registered = registry().register({
      ...searchCrm,
      id: "crm.update",
      name: "update_crm",
      permission: "CanUpdateCRM",
    });

    expect(registered.listFor(SUBJECT).map((tool) => tool.name)).toEqual(["search_crm"]);
    expect(registered.list()).toHaveLength(2);
  });

  it("hides internal tools from the subject-facing listing", () => {
    const registered = registry().register({
      ...searchCrm,
      id: "crm.debug",
      name: "debug_crm",
      internal: true,
    });

    expect(registered.listFor(SUBJECT).map((tool) => tool.name)).toEqual(["search_crm"]);
    expect(registered.has("debug_crm")).toBe(true);
  });

  it("advertises JSON Schema generated from the same schema it validates against", () => {
    const [schema] = registry().schemasFor(SUBJECT);

    expect(schema?.name).toBe("search_crm");
    expect(schema?.parameters).toMatchObject({
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    });
  });

  it("advertises nothing to a subject with no grants", () => {
    expect(registry().schemasFor({ ...SUBJECT, grants: [] })).toEqual([]);
  });
});

describe("invoke", () => {
  it("runs a permitted, valid call", async () => {
    await expect(registry().invoke("search_crm", '{"query":"acme"}', CONTEXT)).resolves.toEqual({
      content: "found acme",
    });
  });

  it("treats empty arguments as an empty object", async () => {
    const noArgs = defineTool({
      ...searchCrm,
      id: "crm.count",
      name: "count_crm",
      schema: z.object({}),
      execute: async () => ({ content: "7" }),
    });

    await expect(registry().register(noArgs).invoke("count_crm", "", CONTEXT)).resolves.toEqual({
      content: "7",
    });
  });

  it("names only the requested tool when it does not exist", async () => {
    await expect(registry().invoke("delete_everything", "{}", CONTEXT)).rejects.toThrow(ToolError);
    await expect(registry().invoke("delete_everything", "{}", CONTEXT)).rejects.not.toThrow(
      /search_crm/,
    );
  });

  it("refuses an ungranted permission", async () => {
    await expect(
      registry().invoke("search_crm", '{"query":"acme"}', {
        ...CONTEXT,
        subject: { ...SUBJECT, grants: [] },
      }),
    ).rejects.toThrow(PermissionError);
  });

  it("checks the permission before it parses the arguments", async () => {
    const execute = vi.fn();
    const guarded = new ToolRegistry(new GrantListPermissionChecker()).register(
      defineTool({ ...searchCrm, execute }),
    );

    // Both the grant and the payload are wrong. The permission failure must win,
    // or a denied caller learns the tool's schema by probing it.
    await expect(
      guarded.invoke("search_crm", "}not json{", { ...CONTEXT, subject: { ...SUBJECT, grants: [] } }),
    ).rejects.toThrow(PermissionError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON as validation, not as a tool failure", async () => {
    await expect(registry().invoke("search_crm", "}not json{", CONTEXT)).rejects.toThrow(
      ValidationError,
    );
  });

  it("rejects arguments that do not match the schema, with field detail", async () => {
    let issues: readonly string[] = [];
    try {
      await registry().invoke("search_crm", '{"query":42}', CONTEXT);
    } catch (error) {
      issues = error instanceof ValidationError ? error.issues : [];
    }

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.join(" ")).toContain("query");
  });

  it("never lets a tool body see input that failed its schema", async () => {
    const execute = vi.fn();
    const strict = new ToolRegistry(new GrantListPermissionChecker()).register(
      defineTool({ ...searchCrm, execute }),
    );

    await expect(strict.invoke("search_crm", "{}", CONTEXT)).rejects.toThrow(ValidationError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("keeps a thrown tool's internal message server-side", async () => {
    const leaky = new ToolRegistry(new GrantListPermissionChecker()).register(
      defineTool({
        ...searchCrm,
        execute: async () => {
          throw new Error("connection string postgres://user:hunter2@db.internal:5432");
        },
      }),
    );

    let caught: unknown;
    try {
      await leaky.invoke("search_crm", '{"query":"acme"}', CONTEXT);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ToolError);
    const failure = caught as ToolError;
    expect(failure.message).toContain("hunter2");
    expect(failure.safeMessage).not.toContain("hunter2");
    expect(JSON.stringify(failure.toClientJSON())).not.toContain("hunter2");
  });
});
