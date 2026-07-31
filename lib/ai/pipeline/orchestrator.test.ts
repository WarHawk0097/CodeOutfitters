// The orchestrator, end to end.
//
// Every dependency here is a deterministic fake: no provider, no database, no
// network, no key. That is the whole point of the abstraction — the security
// properties of a turn are properties of this file's ordering, and they can be
// asserted exactly.
//
// The order under test is: rate limit, resolve the conversation, plan, gate the
// tool set, then a bounded loop in which every model-produced call is checked
// again. Each of those steps is a place where "the model asked for it" must not
// be sufficient reason to do it.

import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { AI_CONFIG_DEFAULTS, type AIConfig } from "../config";
import { ToolError } from "../errors";
import { InMemoryConversationStore } from "../conversation/in-memory-store";
import type { Conversation } from "../conversation/types";
import { NullKnowledgeSource } from "../knowledge/types";
import { createInMemoryMemorySystem } from "../memory/in-memory";
import { GrantListPermissionChecker } from "../permissions/checker";
import type { PermissionSubject } from "../permissions/types";
import { DefaultPlanner } from "../planner/planner";
import { CORE_PROMPTS } from "../prompts/library/core";
import { PromptRegistry } from "../prompts/registry";
import { MockProvider, type MockTurn } from "../provider/mock";
import { ProviderRegistry } from "../provider/registry";
import type { AIProvider, ProviderCapabilities } from "../provider/types";
import { InMemoryRateLimiter } from "../observability/resilience";
import type { LogFields, LogLevel, Telemetry } from "../observability/types";
import { isTerminalEvent, type AIStreamEvent } from "../streaming/events";
import { ToolRegistry } from "../tools/registry";
import { defineTool, type ToolContext } from "../tools/types";
import { Orchestrator, type CopilotRequest } from "./orchestrator";

const OWNER: PermissionSubject = {
  userId: "user-1",
  workspaceId: "workspace-1",
  grants: ["CanReadCRM", "CanSendEmail"],
};

const READER: PermissionSubject = {
  userId: "user-1",
  workspaceId: "workspace-1",
  grants: ["CanReadCRM"],
};

/** A different person in the same workspace. */
const OTHER_USER: PermissionSubject = { ...OWNER, userId: "user-2" };
/** The same person id in a different tenant. */
const OTHER_WORKSPACE: PermissionSubject = { ...OWNER, workspaceId: "workspace-2" };

type Sink = {
  logs: { level: LogLevel; message: string; fields?: LogFields }[];
  spans: LogFields[];
};

function recordingTelemetry(sink: Sink): Telemetry {
  const logger = {
    log: (level: LogLevel, message: string, fields?: LogFields) => {
      sink.logs.push({ level, message, ...(fields ? { fields } : {}) });
    },
    child: () => logger,
  };

  return {
    logger,
    tracer: {
      startSpan: (_name, fields) => {
        if (fields) sink.spans.push(fields);
        return {
          setAttributes: (next) => sink.spans.push(next),
          recordError: () => {},
          end: () => {},
        };
      },
    },
    metrics: { increment: () => {}, record: () => {} },
  };
}

type HarnessOptions = {
  turns?: readonly MockTurn[];
  config?: Partial<AIConfig>;
  provider?: AIProvider;
  /** Replaces the read tool's body, so a failing tool can be scripted. */
  onSearch?: (input: { query: string }, context: ToolContext) => Promise<{ content: string }>;
  onSend?: () => Promise<{ content: string }>;
};

function harness(options: HarnessOptions = {}) {
  const config: AIConfig = {
    ...AI_CONFIG_DEFAULTS,
    provider: "mock",
    defaultModel: "mock-model",
    logLevel: "debug",
    ...options.config,
  };

  const sendEmail = vi.fn(
    options.onSend ?? (async () => ({ content: "sent" })),
  );
  const searchCrm = vi.fn(
    options.onSearch ?? (async () => ({ content: "Acme Corp, 3 open deals" })),
  );

  const tools = new ToolRegistry(new GrantListPermissionChecker())
    .register(
      defineTool({
        id: "tool.search_crm",
        name: "search_crm",
        description: "Looks up a customer record.",
        permission: "CanReadCRM",
        schema: z.object({ query: z.string() }),
        execute: searchCrm,
      }),
    )
    .register(
      defineTool({
        id: "tool.send_email",
        name: "send_email",
        description: "Sends an email on the user's behalf.",
        permission: "CanSendEmail",
        schema: z.object({ to: z.string(), body: z.string() }),
        execute: sendEmail,
      }),
    );

  const provider = options.provider ?? new MockProvider({ turns: options.turns ?? [] });
  const providers = new ProviderRegistry(config, () => ({
    apiKey: "unused",
    baseUrl: "https://provider.invalid",
  })).override("mock", provider);

  const conversations = new InMemoryConversationStore();
  const sink: Sink = { logs: [], spans: [] };
  const rateLimiter = new InMemoryRateLimiter(config.requestsPerMinute, 60_000, () => 0);

  let ids = 0;
  const orchestrator = new Orchestrator({
    config,
    providers,
    tools,
    prompts: new PromptRegistry([...CORE_PROMPTS]),
    planner: new DefaultPlanner({
      maxToolIterations: config.maxToolIterations,
      permissionForTool: (name) => tools.list().find((tool) => tool.name === name)?.permission,
    }),
    conversations,
    memory: createInMemoryMemorySystem(() => 0),
    knowledge: new NullKnowledgeSource(),
    telemetry: recordingTelemetry(sink),
    rateLimiter,
    clock: () => new Date("2026-01-01T00:00:00.000Z"),
    newId: () => `id-${(ids += 1)}`,
  });

  const run = async (request: Partial<CopilotRequest> = {}): Promise<AIStreamEvent[]> => {
    const events: AIStreamEvent[] = [];
    for await (const event of orchestrator.run({
      subject: OWNER,
      text: "find the acme record",
      workspaceName: "Acme",
      ...request,
    })) {
      events.push(event);
    }
    return events;
  };

  return { config, conversations, orchestrator, provider, rateLimiter, run, searchCrm, sendEmail, sink, tools };
}

const errorOf = (events: readonly AIStreamEvent[]) =>
  events.find((event): event is Extract<AIStreamEvent, { type: "error" }> => event.type === "error");

const toolNames = (provider: MockProvider, index = 0): readonly string[] =>
  (provider.requests[index]?.tools ?? []).map((tool) => tool.name);

const textOfEvents = (events: readonly AIStreamEvent[]): string =>
  events
    .filter((event): event is Extract<AIStreamEvent, { type: "text-delta" }> => event.type === "text-delta")
    .map((event) => event.text)
    .join("");

const toolCall = (name: string, args: string) => ({ id: `call-${name}`, name, arguments: args });

describe("rate limiting", () => {
  it("refuses the turn before the provider is ever reached", async () => {
    const { provider, run } = harness({ config: { requestsPerMinute: 1 } });

    await run();
    const events = await run();

    expect(errorOf(events)?.code).toBe("ai/rate_limit");
    // One turn's worth of calls, not two.
    expect((provider as MockProvider).requests).toHaveLength(1);
  });

  it("does not create a conversation for a turn it refuses", async () => {
    const { conversations, run } = harness({ config: { requestsPerMinute: 1 } });

    await run();
    await run();

    await expect(conversations.list("workspace-1", "user-1")).resolves.toHaveLength(1);
  });

  it("counts each subject separately", async () => {
    const { run } = harness({ config: { requestsPerMinute: 1 } });

    await run();
    const events = await run({ subject: OTHER_USER });

    expect(errorOf(events)).toBeUndefined();
  });
});

describe("conversation ownership", () => {
  async function seeded() {
    const context = harness();
    const events = await context.run();
    const start = events.find(
      (event): event is Extract<AIStreamEvent, { type: "start" }> => event.type === "start",
    );
    return { ...context, conversationId: start?.conversationId ?? "" };
  }

  it("generates the id server-side when the caller supplies none", async () => {
    const { conversationId, conversations } = await seeded();

    expect(conversationId).toBe("id-1");
    const stored = (await conversations.get(conversationId)) as Conversation;
    expect(stored.workspaceId).toBe("workspace-1");
    expect(stored.userId).toBe("user-1");
  });

  it("lets the owner continue their own conversation", async () => {
    const { conversationId, run } = await seeded();

    const events = await run({ conversationId, text: "find the beta record" });
    expect(errorOf(events)).toBeUndefined();
  });

  it("refuses a conversation belonging to another user", async () => {
    const { conversationId, provider, run } = await seeded();
    const before = (provider as MockProvider).requests.length;

    const events = await run({ subject: OTHER_USER, conversationId });

    expect(errorOf(events)?.code).toBe("ai/cancelled");
    expect((provider as MockProvider).requests).toHaveLength(before);
  });

  it("refuses a conversation belonging to another workspace", async () => {
    const { conversationId, run } = await seeded();

    expect(errorOf(await run({ subject: OTHER_WORKSPACE, conversationId }))?.code).toBe(
      "ai/cancelled",
    );
  });

  it("re-checks ownership on every turn, not only on the first", async () => {
    const { conversationId, run } = await seeded();

    // Two legitimate turns first, so the check cannot be passing merely because
    // the conversation is fresh.
    await run({ conversationId });
    await run({ conversationId });

    expect(errorOf(await run({ subject: OTHER_USER, conversationId }))?.code).toBe("ai/cancelled");
  });

  it("tells an unknown id and someone else's id apart with the same message", async () => {
    const { conversationId, run } = await seeded();

    const mine = errorOf(await run({ subject: OTHER_USER, conversationId }));
    const nobodys = errorOf(await run({ conversationId: "conversation-does-not-exist" }));

    // An endpoint that answered differently would enumerate real ids.
    expect(nobodys?.code).toBe(mine?.code);
    expect(nobodys?.message).toBe(mine?.message);
  });

  it("never creates a conversation at an id the client chose", async () => {
    const { conversations, run } = harness();

    const events = await run({ conversationId: "attacker-chosen-id" });

    expect(errorOf(events)?.code).toBe("ai/cancelled");
    await expect(conversations.get("attacker-chosen-id")).resolves.toBeUndefined();
    // Not created under a different id either — the turn stopped.
    await expect(conversations.list("workspace-1", "user-1")).resolves.toEqual([]);
  });

  it("does not squat a future id after a failed lookup", async () => {
    const { conversations, run } = harness();

    await run({ conversationId: "id-1" });
    // The id the server would have generated is still free.
    await expect(conversations.get("id-1")).resolves.toBeUndefined();
  });
});

describe("confirmation", () => {
  const WRITE = "send an email to the acme contact";

  it("withholds mutating tools until a human has confirmed", async () => {
    const { provider, run } = harness();

    const events = await run({ text: WRITE });

    expect(events).toContainEqual({ type: "step", step: 2, label: "awaiting-confirmation" });
    expect(toolNames(provider as MockProvider)).not.toContain("send_email");
  });

  it("keeps read-only tools available while confirmation is pending", async () => {
    const { provider, run } = harness();

    await run({ text: WRITE });

    expect(toolNames(provider as MockProvider)).toContain("search_crm");
  });

  it("offers the mutating tool once the request is confirmed", async () => {
    const { provider, run } = harness();

    const events = await run({ text: WRITE, confirmed: true });

    expect(toolNames(provider as MockProvider)).toContain("send_email");
    expect(events).not.toContainEqual({ type: "step", step: 2, label: "awaiting-confirmation" });
  });

  it("does not ask for confirmation when nothing on offer can change state", async () => {
    const { provider, run } = harness();

    const events = await run({ subject: READER, text: "find the acme record" });

    expect(events).not.toContainEqual({ type: "step", step: 2, label: "awaiting-confirmation" });
    expect(toolNames(provider as MockProvider)).toEqual(["search_crm"]);
  });

  it("still withholds the tool when the model asks for it during a pending turn", async () => {
    const { run, sendEmail } = harness({
      turns: [
        { toolCalls: [toolCall("send_email", '{"to":"a@b.c","body":"hi"}')] },
        { text: "I need confirmation first." },
      ],
    });

    const events = await run({ text: WRITE });
    const result = events.find(
      (event): event is Extract<AIStreamEvent, { type: "tool-result" }> =>
        event.type === "tool-result",
    );

    expect(result?.isError).toBe(true);
    expect(result?.result).toContain("not available in this context");
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("the second permission gate", () => {
  it("refuses a call to a tool the subject was never offered", async () => {
    const { run, sendEmail } = harness({
      turns: [
        { toolCalls: [toolCall("send_email", '{"to":"a@b.c","body":"hi"}')] },
        { text: "Cannot do that." },
      ],
    });

    // READER holds no CanSendEmail grant, so the tool is not in the inventory.
    const events = await run({ subject: READER, text: "find the acme record" });
    const result = events.find(
      (event): event is Extract<AIStreamEvent, { type: "tool-result" }> =>
        event.type === "tool-result",
    );

    expect(result?.isError).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("refuses a call to a tool that does not exist at all", async () => {
    const { run } = harness({
      turns: [
        { toolCalls: [toolCall("delete_everything", "{}")] },
        { text: "No such capability." },
      ],
    });

    const events = await run();
    const result = events.find(
      (event): event is Extract<AIStreamEvent, { type: "tool-result" }> =>
        event.type === "tool-result",
    );

    expect(result?.isError).toBe(true);
    expect(result?.result).toContain("not available in this context");
  });

  it("does not reach the tool registry for a refused call", async () => {
    const context = harness({
      turns: [{ toolCalls: [toolCall("send_email", "{}")] }, { text: "done" }],
    });
    const invoke = vi.spyOn(context.tools, "invoke");

    await context.run({ subject: READER, text: "find the acme record" });

    expect(invoke).not.toHaveBeenCalled();
  });

  it("denies on permission before it parses arguments at all", async () => {
    const { tools } = harness();

    // Malformed JSON *and* an ungranted permission. The permission must win:
    // parsing first would let an unauthorised caller probe the schema layer.
    await expect(
      tools.invoke("send_email", "{not json", {
        subject: READER,
        conversationId: "c1",
        logger: { log: () => {}, child: () => ({ log: () => {}, child: () => ({}) as never }) },
      }),
    ).rejects.toMatchObject({ code: "ai/permission" });
  });

  it("runs a permitted tool and records the call and its result", async () => {
    const { conversations, run, searchCrm } = harness({
      turns: [
        { toolCalls: [toolCall("search_crm", '{"query":"acme"}')] },
        { text: "Acme has 3 open deals." },
      ],
    });

    const events = await run();
    const conversation = (await conversations.list("workspace-1", "user-1"))[0] as Conversation;
    const stored = (await conversations.get(conversation.id)) as Conversation;

    expect(searchCrm).toHaveBeenCalledTimes(1);
    expect(events.some((event) => event.type === "tool-result")).toBe(true);

    // The request and its result are both persisted: a transcript with results
    // that nothing asked for is one several providers reject on reload.
    const assistantWithCalls = stored.messages.find(
      (message) => message.role === "assistant" && message.toolCalls?.length,
    );
    expect(assistantWithCalls?.toolCalls?.[0]?.name).toBe("search_crm");
    expect(stored.messages.some((message) => message.role === "tool")).toBe(true);
  });

  it("stores the final answer once, not once per iteration", async () => {
    const { conversations, run } = harness({
      turns: [
        { toolCalls: [toolCall("search_crm", '{"query":"acme"}')] },
        { text: "Acme has 3 open deals." },
      ],
    });

    await run();
    const conversation = (await conversations.list("workspace-1", "user-1"))[0] as Conversation;
    const stored = (await conversations.get(conversation.id)) as Conversation;
    const finals = stored.messages.filter(
      (message) => message.role === "assistant" && message.metrics,
    );

    expect(finals).toHaveLength(1);
    expect(finals[0]?.content).toBe("Acme has 3 open deals.");
  });
});

describe("error handling", () => {
  /** A provider that fails the way a real one does: with its internals attached. */
  const explodingProvider = (): AIProvider => ({
    id: "mock",
    capabilities: {
      streaming: true,
      toolCalling: true,
      vision: true,
      jsonMode: true,
      structuredOutputs: true,
      promptCaching: false,
    } satisfies ProviderCapabilities,
    generate: async () => {
      throw new Error("POST https://api.openai.com failed: Authorization: Bearer sk-live-secret");
    },
    // eslint-disable-next-line require-yield
    stream: async function* () {
      throw new Error("POST https://api.openai.com failed: Authorization: Bearer sk-live-secret");
    },
  });

  it("turns a raw provider exception into a typed, safe error event", async () => {
    const { run } = harness({ provider: explodingProvider() });

    const failure = errorOf(await run());

    expect(failure?.code).toBe("ai/provider");
    expect(failure?.message).not.toContain("sk-live-secret");
    expect(failure?.message).not.toContain("api.openai.com");
  });

  it("ends the stream on the error event and emits nothing after it", async () => {
    const { run } = harness({ provider: explodingProvider() });

    const events = await run();

    expect(isTerminalEvent(events[events.length - 1] as AIStreamEvent)).toBe(true);
    expect(events.filter((event) => event.type === "finish")).toEqual([]);
  });

  it("does not persist an assistant message for a turn that failed", async () => {
    const { conversations, run } = harness({ provider: explodingProvider() });

    await run();
    const conversation = (await conversations.list("workspace-1", "user-1"))[0] as Conversation;
    const stored = (await conversations.get(conversation.id)) as Conversation;

    expect(stored.messages.map((message) => message.role)).toEqual(["user"]);
  });

  it("reports a provider error event without inventing a completion", async () => {
    const { run } = harness({
      turns: [
        {
          error: new ToolError("search_crm", "internal: row 42 missing"),
          text: "",
        },
      ],
    });

    const events = await run();
    expect(errorOf(events)).toBeDefined();
    expect(errorOf(events)?.message).not.toContain("row 42");
  });

  it("keeps a tool's internal failure out of the transcript", async () => {
    const { conversations, run } = harness({
      turns: [
        { toolCalls: [toolCall("search_crm", '{"query":"acme"}')] },
        { text: "I could not look that up." },
      ],
      onSearch: async () => {
        throw new Error("pg: relation \"crm_accounts\" does not exist at 10.0.0.4:5432");
      },
    });

    const events = await run();
    const result = events.find(
      (event): event is Extract<AIStreamEvent, { type: "tool-result" }> =>
        event.type === "tool-result",
    );
    const conversation = (await conversations.list("workspace-1", "user-1"))[0] as Conversation;
    const stored = (await conversations.get(conversation.id)) as Conversation;

    expect(result?.isError).toBe(true);
    expect(result?.result).not.toContain("10.0.0.4");
    expect(result?.result).not.toContain("crm_accounts");
    // The model reads the transcript, so the redaction has to hold there too.
    expect(JSON.stringify(stored.messages)).not.toContain("10.0.0.4");
    // A failed tool does not end the turn.
    expect(textOfEvents(events)).toBe("I could not look that up.");
  });

  it("refuses a model that the configured provider does not serve", async () => {
    const { run } = harness({ config: { defaultModel: "gpt-5" } });

    expect(errorOf(await run())?.code).toBe("ai/configuration");
  });
});

describe("finish reason", () => {
  it("reports what the provider actually said rather than assuming success", async () => {
    const { conversations, run } = harness({
      turns: [{ text: "A truncated ans", finishReason: "length" }],
    });

    const events = await run();
    const finish = events.find(
      (event): event is Extract<AIStreamEvent, { type: "finish" }> => event.type === "finish",
    );
    const conversation = (await conversations.list("workspace-1", "user-1"))[0] as Conversation;
    const stored = (await conversations.get(conversation.id)) as Conversation;
    const assistant = stored.messages.find((message) => message.metrics);

    expect(finish?.finishReason).toBe("length");
    // Persisted too: a UI decides whether to offer "continue" from the record.
    expect(assistant?.metrics?.finishReason).toBe("length");
  });

  it("reports a clean stop as a stop", async () => {
    const { run } = harness({ turns: [{ text: "Done." }] });

    const finish = (await run()).find(
      (event): event is Extract<AIStreamEvent, { type: "finish" }> => event.type === "finish",
    );

    expect(finish?.finishReason).toBe("stop");
  });
});

describe("telemetry", () => {
  const SECRET = "the acme merger closes on the 14th";

  it("never traces the user's text, only its shape", async () => {
    const { run, sink } = harness();

    await run({ text: SECRET });

    expect(JSON.stringify(sink.spans)).not.toContain("merger");
    // Something is still recorded, or the trace would be useless.
    expect(JSON.stringify(sink.spans)).toContain("workspace-1");
  });

  it("redacts what a tool logs, because tools get their logger from here", async () => {
    const { run, sink } = harness({
      turns: [
        { toolCalls: [toolCall("search_crm", '{"query":"acme"}')] },
        { text: "Found it." },
      ],
      // A tool that logs carelessly. It gets the orchestrator's redacted logger,
      // so carelessness here cannot become a credential in the log backend.
      onSearch: async (_input, context) => {
        context.logger.log("info", "calling crm", {
          apiKey: "sk-live-abcdefghijklmnopqrstuvwxyz",
          query: SECRET,
        });
        return { content: "ok" };
      },
    });

    await run({ text: SECRET });

    const logged = JSON.stringify(sink.logs);
    expect(logged).toContain("calling crm");
    expect(logged).not.toContain("sk-live-abcdefghijklmnopqrstuvwxyz");
    expect(logged).not.toContain("merger");
  });

  it("keeps the user's text out of the logs on the refusal path too", async () => {
    const { run, sink } = harness({
      turns: [
        { toolCalls: [toolCall("delete_everything", "{}")] },
        { text: "no" },
      ],
    });

    await run({ text: SECRET });

    expect(JSON.stringify(sink.logs)).not.toContain("merger");
    expect(JSON.stringify(sink.spans)).not.toContain("merger");
  });
});
