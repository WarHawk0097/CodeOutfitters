// What the production composition root actually wires a Copilot turn to.
//
// The interesting property is not that a Supabase store exists; it is that the
// deployed path uses it, that it is built per request rather than held for the
// process, and that a turn's messages really land in it. So this file composes the
// orchestrator the way the route does — no conversation override — and then reads
// the database stand-in afterwards.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  InMemoryConversationStore,
  InMemoryRateLimiter,
  loadAIConfig,
  noopTelemetry,
  type AIConfig,
  type AIStreamEvent,
  type Orchestrator,
  type PermissionSubject,
} from "@/lib/ai";
import { FakeSupabase } from "@/test/fake-supabase";
import { SupabaseConversationStore } from "@/lib/ai/conversation/supabase-store";
import { createCopilotOrchestrator, createRequestConversationStore } from "./create-copilot-orchestrator";

const WORKSPACE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER = "11111111-1111-4111-8111-111111111111";

const MISSING_ENV = "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY";

const state = vi.hoisted(() => ({
  client: undefined as unknown,
  /** How many request-scoped clients the composition asked for. */
  clients: 0,
}));

// The request-scoped SSR client. Replaced because a unit test has no cookie store,
// not because the store is being avoided: the store under test is the real one.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    state.clients += 1;
    if (!state.client) throw new Error(MISSING_ENV);
    return state.client;
  },
}));

const CONFIG: AIConfig = loadAIConfig({});
const SUBJECT: PermissionSubject = { userId: USER, workspaceId: WORKSPACE, grants: [] };

function baseOverrides() {
  return {
    config: CONFIG,
    rateLimiter: new InMemoryRateLimiter(1_000, 60_000),
    telemetry: noopTelemetry,
  };
}

async function runTurn(
  orchestrator: Orchestrator,
  text = "How did Q2 close?",
  conversationId?: string,
): Promise<AIStreamEvent[]> {
  const events: AIStreamEvent[] = [];
  for await (const event of orchestrator.run({
    subject: SUBJECT,
    workspaceName: "Acme Studio",
    text,
    ...(conversationId ? { conversationId } : {}),
  })) {
    events.push(event);
  }
  return events;
}

function startedConversation(events: readonly AIStreamEvent[]): string {
  const start = events.find((event) => event.type === "start");
  if (!start || start.type !== "start") throw new Error("no start event");
  return start.conversationId;
}

let fake: FakeSupabase;

beforeEach(() => {
  fake = new FakeSupabase({ workspaceId: WORKSPACE, userId: USER });
  state.client = fake;
  state.clients = 0;
});

describe("Copilot composition — persistence", () => {
  it("hands the deployed orchestrator a Supabase-backed store", async () => {
    expect(await createRequestConversationStore()).toBeInstanceOf(SupabaseConversationStore);
    expect(state.clients).toBe(1);
  });

  it("persists a whole turn through the composition the route uses", async () => {
    const orchestrator = await createCopilotOrchestrator({
      correlationId: "correlation-1",
      overrides: baseOverrides(),
    });

    const events = await runTurn(orchestrator);

    expect(events.at(-1)?.type).toBe("finish");
    // The conversation the stream announced is the row that exists afterwards.
    expect(fake.conversations).toHaveLength(1);
    expect(fake.conversations[0]).toMatchObject({
      id: startedConversation(events),
      workspace_id: WORKSPACE,
      user_id: USER,
    });
    // Both halves of the turn, in order, with the answer carrying the accounting.
    expect(fake.messages.map((row) => row.role)).toEqual(["user", "assistant"]);
    expect(fake.messages[1]).toMatchObject({ provider_id: CONFIG.provider });
    expect(fake.messages[1]?.model).toBeTruthy();
    expect(fake.messages[1]?.finish_reason).toBeTruthy();
  });

  it("continues an existing conversation from the database on the next request", async () => {
    const first = await createCopilotOrchestrator({
      correlationId: "correlation-1",
      overrides: baseOverrides(),
    });
    const conversationId = startedConversation(await runTurn(first));

    // A second request, a second composition, a second client — and the history is
    // still there, which is the entire point of the change.
    const second = await createCopilotOrchestrator({
      correlationId: "correlation-2",
      overrides: baseOverrides(),
    });
    const events = await runTurn(second, "And Q1?", conversationId);

    expect(events.at(-1)?.type).toBe("finish");
    expect(startedConversation(events)).toBe(conversationId);
    expect(fake.conversations).toHaveLength(1);
    expect(fake.messages).toHaveLength(4);
    expect(state.clients).toBe(2);
  });

  it("builds one client per composition and never keeps one for the process", async () => {
    await createCopilotOrchestrator({ correlationId: "a", overrides: baseOverrides() });
    await createCopilotOrchestrator({ correlationId: "b", overrides: baseOverrides() });

    expect(state.clients).toBe(2);
  });

  it("does not touch Supabase at all when a store is injected", async () => {
    const conversations = new InMemoryConversationStore();

    const orchestrator = await createCopilotOrchestrator({
      correlationId: "correlation-1",
      overrides: { ...baseOverrides(), conversations },
    });
    await runTurn(orchestrator);

    // The seam is dependency injection, not an environment check — there is no
    // `NODE_ENV === "test"` anywhere on this path.
    expect(state.clients).toBe(0);
    expect(fake.conversations).toHaveLength(0);
    expect(await conversations.list(WORKSPACE, USER)).toHaveLength(1);
  });

  it("fails the composition rather than falling back to a store that forgets", async () => {
    state.client = undefined;

    await expect(
      createCopilotOrchestrator({ correlationId: "correlation-1", overrides: baseOverrides() }),
    ).rejects.toThrow(MISSING_ENV);
  });
});

describe("Copilot composition — source", () => {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const composition = readFileSync(`${here}create-copilot-orchestrator.ts`, "utf8");
  const route = readFileSync(
    fileURLToPath(new URL("../../../app/api/ai/copilot/route.ts", import.meta.url)),
    "utf8",
  );

  it("keeps no cross-request conversation state in the module", () => {
    // A process-held store is how a conversation id outlives the session that
    // authorised it. The in-process implementation stays available for tests, but
    // nothing in the deployed path constructs one.
    expect(composition).not.toContain("new InMemoryConversationStore");
    expect(composition).not.toContain('NODE_ENV === "test"');
  });

  it("authenticates before it ever reaches the database", () => {
    // Identity first, body second, composition third. A store built before the
    // subject is resolved would open a database connection for an anonymous caller.
    const identity = route.indexOf("resolveCopilotSubject(");
    const body = route.indexOf("readJsonBody(");
    const composed = route.indexOf("createCopilotOrchestrator({");
    expect(identity).toBeGreaterThan(-1);
    expect(identity).toBeLessThan(body);
    expect(body).toBeLessThan(composed);
  });

  it("keeps database access out of the handler", () => {
    expect(route).not.toContain("supabase");
    expect(route).not.toContain("ai_conversations");
    expect(route).not.toContain("SupabaseConversationStore");
  });
});
