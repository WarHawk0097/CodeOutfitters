// The two read-only history endpoints, exercised through their HTTP surface.
//
// One seam is replaced and nothing else: the subject resolver, because there is
// no session in a unit test. The store behind both handlers is the real
// `SupabaseConversationStore` over the `FakeSupabase` stand-in, so the mapping
// from row to response — and, just as importantly, everything the mapping leaves
// out — is the deployed one. No test reaches the network.
//
// The properties worth stating up front, because most assertions below are one of
// them: a caller cannot name a workspace or a user, a caller cannot see a field
// the projection does not list, and every denial past authentication is the same
// sentence with the same status.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FakeSupabase } from "@/test/fake-supabase";
import { MAX_HISTORY_LIMIT } from "@/lib/ai/server/copilot-history";
import type { CopilotSubjectResult } from "@/lib/ai/server/copilot-subject";
import type { PermissionSubject } from "@/lib/ai";
// Loaded after the `vi.mock` calls, which are hoisted above every import here.
import { GET as list } from "./route";
import { GET as detail } from "./[conversationId]/route";

const WORKSPACE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_WORKSPACE = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER = "11111111-1111-4111-8111-111111111111";
const COLLEAGUE = "22222222-2222-4222-8222-222222222222";

const MISSING_ENV = "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY";

const state = vi.hoisted(() => ({
  identity: undefined as unknown as CopilotSubjectResult,
  client: undefined as SupabaseClient | undefined,
}));

vi.mock("@/lib/ai/server/copilot-subject", () => ({
  resolveCopilotSubject: async (): Promise<CopilotSubjectResult> => state.identity,
}));

// The request-scoped SSR client. Replaced because a unit test has no cookie
// store, not because the store is being avoided: the store under test is real.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    if (!state.client) throw new Error(MISSING_ENV);
    return state.client;
  },
}));

const SUBJECT: PermissionSubject = { userId: USER, workspaceId: WORKSPACE, grants: [] };

const signedIn = (subject: PermissionSubject = SUBJECT): CopilotSubjectResult => ({
  ok: true,
  subject,
  workspaceName: "Acme Studio",
});

type ErrorBody = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};
type Summary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};
type Detail = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: { id: string; role: string; content: string; createdAt: string }[];
};

function listRequest(query = ""): Request {
  return new Request(`https://example.test/api/ai/copilot/conversations${query}`);
}

async function callDetail(conversationId: string): Promise<Response> {
  return detail(new Request(`https://example.test/api/ai/copilot/conversations/${conversationId}`), {
    params: Promise.resolve({ conversationId }),
  });
}

async function conversations(response: Response): Promise<Summary[]> {
  return ((await response.json()) as { conversations: Summary[] }).conversations;
}

async function errorBody(response: Response): Promise<ErrorBody> {
  return (await response.json()) as ErrorBody;
}

let fake: FakeSupabase;

/** A conversation row plus its messages, written the way the store would. */
function seed(options: {
  id?: string;
  title?: string;
  workspaceId?: string;
  userId?: string;
  updatedAt?: string;
  messages?: { role: string; content: string; toolCallId?: string; toolCalls?: unknown }[];
}): string {
  const id = options.id ?? randomUUID();
  fake.seedConversation({
    id,
    workspace_id: options.workspaceId ?? WORKSPACE,
    user_id: options.userId ?? USER,
    title: options.title ?? "Quarterly numbers",
    created_at: "2026-08-01T09:00:00.000Z",
    updated_at: options.updatedAt ?? "2026-08-01T09:00:00.000Z",
  });
  (options.messages ?? []).forEach((message, index) => {
    fake.messages.push({
      id: `${id}-m${index}`,
      conversation_id: id,
      seq: index + 1,
      role: message.role,
      content: message.content,
      tool_calls: message.toolCalls ?? null,
      tool_call_id: message.toolCallId ?? null,
      metadata: {},
      provider_id: message.role === "assistant" ? "openai" : null,
      model: message.role === "assistant" ? "gpt-5-mini" : null,
      input_tokens: message.role === "assistant" ? 120 : null,
      output_tokens: message.role === "assistant" ? 34 : null,
      cached_input_tokens: null,
      reasoning_tokens: null,
      cost_usd: message.role === "assistant" ? 0.00042 : null,
      latency_ms: message.role === "assistant" ? 910 : null,
      finish_reason: message.role === "assistant" ? "stop" : null,
      created_at: `2026-08-01T09:0${index}:00.000Z`,
    });
  });
  return id;
}

beforeEach(() => {
  fake = new FakeSupabase({ workspaceId: WORKSPACE, userId: USER });
  state.client = fake as unknown as SupabaseClient;
  state.identity = signedIn();
});

/* ---------------------------------------------------------------- list route -- */

describe("GET /api/ai/copilot/conversations", () => {
  it("refuses a signed-out caller before touching the database", async () => {
    state.identity = { ok: false, reason: "unauthenticated" };
    state.client = undefined;

    const response = await list(listRequest());

    expect(response.status).toBe(401);
    expect((await errorBody(response)).error.code).toBe("unauthorized");
    expect(fake.calls).toEqual([]);
  });

  it("refuses a signed-in caller with no active workspace", async () => {
    state.identity = { ok: false, reason: "no_workspace" };

    const response = await list(listRequest());

    expect(response.status).toBe(403);
    expect((await errorBody(response)).error.code).toBe("forbidden");
    expect(fake.calls).toEqual([]);
  });

  it("returns this user's conversations, most recently updated first", async () => {
    seed({ title: "Oldest", updatedAt: "2026-08-01T09:00:00.000Z" });
    seed({ title: "Newest", updatedAt: "2026-08-03T09:00:00.000Z" });
    seed({ title: "Middle", updatedAt: "2026-08-02T09:00:00.000Z" });

    const response = await list(listRequest());

    expect(response.status).toBe(200);
    expect((await conversations(response)).map((row) => row.title)).toEqual([
      "Newest",
      "Middle",
      "Oldest",
    ]);
  });

  it("shows nothing belonging to a colleague or to another workspace", async () => {
    seed({ title: "Mine" });
    seed({ title: "Theirs", userId: COLLEAGUE });
    seed({ title: "Elsewhere", workspaceId: OTHER_WORKSPACE });

    const rows = await conversations(await list(listRequest()));

    expect(rows.map((row) => row.title)).toEqual(["Mine"]);
  });

  it("returns only the safe fields, and none of the private ones", async () => {
    seed({
      messages: [
        { role: "user", content: "How did Q2 close?" },
        { role: "assistant", content: "Up 12%." },
      ],
    });

    const [row] = await conversations(await list(listRequest()));

    expect(Object.keys(row!).sort()).toEqual([
      "createdAt",
      "id",
      "messageCount",
      "title",
      "updatedAt",
    ]);
    expect(row?.messageCount).toBe(2);
    // Named individually rather than by a key count, so adding a column to the
    // schema cannot quietly start returning it.
    const serialised = JSON.stringify(row);
    for (const forbidden of [
      "workspaceId",
      "userId",
      "workspace_id",
      "user_id",
      "providerId",
      "provider_id",
      "model",
      "usage",
      "costUsd",
      "cost_usd",
      "latencyMs",
      "finishReason",
      "totals",
      "messages",
      "metadata",
      "toolCalls",
    ]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it("counts only the messages the transcript would render", async () => {
    seed({
      messages: [
        { role: "system", content: "You are a copilot." },
        { role: "developer", content: "Be terse." },
        { role: "user", content: "How did Q2 close?" },
        { role: "assistant", content: "" },
        { role: "tool", content: "{\"rows\":1}", toolCallId: "call_1" },
        { role: "assistant", content: "Up 12%." },
      ],
    });

    expect((await conversations(await list(listRequest())))[0]?.messageCount).toBe(2);
  });

  it("honours a bounded limit", async () => {
    for (let i = 0; i < 4; i += 1) seed({ title: `C${i}`, updatedAt: `2026-08-0${i + 1}T09:00:00.000Z` });

    expect(await conversations(await list(listRequest("?limit=2")))).toHaveLength(2);
    expect(await conversations(await list(listRequest(`?limit=${MAX_HISTORY_LIMIT}`)))).toHaveLength(4);
  });

  it("rejects a limit that is not a whole number in range", async () => {
    for (const query of [
      "?limit=0",
      `?limit=${MAX_HISTORY_LIMIT + 1}`,
      "?limit=-1",
      "?limit=2.5",
      "?limit=abc",
      "?limit=",
      "?limit=1e3",
      "?limit=%204",
    ]) {
      const response = await list(listRequest(query));
      expect(response.status, query).toBe(422);
      const body = await errorBody(response);
      expect(body.error.code, query).toBe("validation");
      expect(body.error.fields?.limit, query).toBeTruthy();
    }
  });

  it("accepts no filter or sort parameter, and ignores anything else sent", async () => {
    seed({ title: "Mine" });
    seed({ title: "Theirs", userId: COLLEAGUE });

    // A caller naming somebody else gets their own history, not an error and not
    // the other user's: the parameters simply do not exist.
    const rows = await conversations(
      await list(listRequest(`?userId=${COLLEAGUE}&workspaceId=${OTHER_WORKSPACE}&sort=title`)),
    );

    expect(rows.map((row) => row.title)).toEqual(["Mine"]);
  });

  it("sanitises a persistence failure and never echoes the driver's text", async () => {
    fake.failNext("ai_conversations", {
      code: "42501",
      message: 'new row violates row-level security policy for table "ai_conversations"',
    });

    const response = await list(listRequest());
    const body = await errorBody(response);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("unavailable");
    expect(JSON.stringify(body)).not.toMatch(/ai_conversations|row-level|42501|policy/);
  });

  it("answers 503 rather than an empty history when the deployment is misconfigured", async () => {
    state.client = undefined;

    const response = await list(listRequest());
    const body = await errorBody(response);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("configuration");
    expect(JSON.stringify(body)).not.toMatch(/SUPABASE|NEXT_PUBLIC|anon key/i);
  });

  it("carries a correlation id and forbids caching on every answer", async () => {
    const ok = await list(listRequest());
    state.identity = { ok: false, reason: "unauthenticated" };
    const denied = await list(listRequest());

    for (const response of [ok, denied]) {
      expect(response.headers.get("x-correlation-id")).toMatch(/^[0-9a-f-]{36}$/);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("content-type")).toBe("application/json");
    }
    expect(ok.headers.get("x-correlation-id")).not.toBe(denied.headers.get("x-correlation-id"));
  });
});

/* -------------------------------------------------------------- detail route -- */

describe("GET /api/ai/copilot/conversations/[conversationId]", () => {
  it("refuses a signed-out caller before touching the database", async () => {
    state.identity = { ok: false, reason: "unauthenticated" };
    state.client = undefined;

    const response = await callDetail(randomUUID());

    expect(response.status).toBe(401);
    expect(fake.calls).toEqual([]);
  });

  it("refuses a signed-in caller with no active workspace", async () => {
    state.identity = { ok: false, reason: "no_workspace" };

    expect((await callDetail(randomUUID())).status).toBe(403);
  });

  it("returns an owned conversation with its user and assistant turns in order", async () => {
    const id = seed({
      title: "Quarterly numbers",
      messages: [
        { role: "user", content: "How did Q2 close?" },
        { role: "assistant", content: "Up 12%." },
        { role: "user", content: "And Q1?" },
        { role: "assistant", content: "Up 4%." },
      ],
    });

    const response = await callDetail(id);
    const body = (await response.json()) as { ok: true; conversation: Detail };

    expect(response.status).toBe(200);
    expect(body.conversation.id).toBe(id);
    expect(body.conversation.title).toBe("Quarterly numbers");
    expect(body.conversation.messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "How did Q2 close?"],
      ["assistant", "Up 12%."],
      ["user", "And Q1?"],
      ["assistant", "Up 4%."],
    ]);
  });

  it("omits the roles and payloads this screen has no renderer for", async () => {
    const id = seed({
      messages: [
        { role: "system", content: "You are a copilot." },
        { role: "developer", content: "Be terse." },
        { role: "user", content: "How did Q2 close?" },
        { role: "assistant", content: "", toolCalls: [{ id: "call_1", name: "lookup", arguments: {} }] },
        { role: "tool", content: "{\"rows\":1}", toolCallId: "call_1" },
        { role: "assistant", content: "Up 12%." },
      ],
    });

    const response = await callDetail(id);
    const serialised = JSON.stringify(await response.json());
    const body = JSON.parse(serialised) as { conversation: Detail };

    expect(body.conversation.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    for (const forbidden of [
      "You are a copilot",
      "Be terse",
      "call_1",
      "lookup",
      "rows",
      "system",
      "developer",
      "toolCalls",
      "toolCallId",
      "providerId",
      "gpt-5-mini",
      "openai",
      "costUsd",
      "latencyMs",
      "finishReason",
      "totals",
      "workspaceId",
      "userId",
      WORKSPACE,
      USER,
    ]) {
      expect(serialised, forbidden).not.toContain(forbidden);
    }
  });

  it("exposes only the four fields per message the transcript renders", async () => {
    const id = seed({ messages: [{ role: "user", content: "How did Q2 close?" }] });

    const body = (await (await callDetail(id)).json()) as { conversation: Detail };

    expect(Object.keys(body.conversation).sort()).toEqual([
      "createdAt",
      "id",
      "messages",
      "title",
      "updatedAt",
    ]);
    expect(Object.keys(body.conversation.messages[0]!).sort()).toEqual([
      "content",
      "createdAt",
      "id",
      "role",
    ]);
  });

  it("rejects a malformed id without asking the database about it", async () => {
    for (const bad of ["not-a-uuid", "../../etc", "1", "%00"]) {
      const response = await callDetail(bad);
      expect(response.status, bad).toBe(422);
      const body = await errorBody(response);
      expect(body.error.code, bad).toBe("validation");
      expect(body.error.fields?.conversationId, bad).toBeTruthy();
    }
    expect(fake.calls).toEqual([]);
  });

  it("answers identically for a missing, a colleague's and another workspace's conversation", async () => {
    const missing = randomUUID();
    const colleagues = seed({ userId: COLLEAGUE });
    const elsewhere = seed({ workspaceId: OTHER_WORKSPACE });

    const answers = await Promise.all([missing, colleagues, elsewhere].map(callDetail));

    for (const response of answers) {
      expect(response.status).toBe(404);
      const body = await errorBody(response);
      expect(body.error.code).toBe("not_found");
      expect(body.error.message).toBe("That conversation is not available.");
    }
  });

  it("hides a conversation this user owns in a workspace they are not currently in", async () => {
    // Reachable through RLS — same owner, and they are a member of both — but not
    // part of the history the active workspace shows.
    const elsewhere = seed({ userId: USER, workspaceId: OTHER_WORKSPACE });
    fake.signIn({ workspaceId: OTHER_WORKSPACE, userId: USER });

    const response = await callDetail(elsewhere);

    expect(response.status).toBe(404);
    expect((await errorBody(response)).error.message).toBe("That conversation is not available.");
  });

  it("sanitises a persistence failure and never echoes the driver's text", async () => {
    const id = seed({});
    fake.failNext("ai_conversations", {
      code: "08006",
      message: 'connection to server at "db.acme.supabase.co" failed',
    });

    const response = await callDetail(id);
    const body = await errorBody(response);

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("unavailable");
    expect(JSON.stringify(body)).not.toMatch(/supabase\.co|connection|08006/);
  });

  it("carries a correlation id and forbids caching on every answer", async () => {
    const id = seed({});

    for (const response of [await callDetail(id), await callDetail(randomUUID())]) {
      expect(response.headers.get("x-correlation-id")).toMatch(/^[0-9a-f-]{36}$/);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  });
});

/* -------------------------------------------------------------------- source -- */

describe("Copilot history routes — source", () => {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const listSrc = readFileSync(`${here}route.ts`, "utf8");
  const detailSrc = readFileSync(`${here}[conversationId]/route.ts`, "utf8");

  it("keeps database access and identity decisions out of the handlers", () => {
    for (const src of [listSrc, detailSrc]) {
      expect(src).not.toContain("SupabaseConversationStore");
      expect(src).not.toContain("service_role");
      expect(src).not.toContain("SUPABASE_SERVICE");
      expect(src).not.toContain("ai_conversations");
      // The workspace and the user are resolved, never read from the request.
      expect(src).not.toMatch(/searchParams\.get\("(workspaceId|userId)"\)/);
    }
  });

  it("authenticates before it reads a parameter or builds a store", () => {
    for (const src of [listSrc, detailSrc]) {
      const identity = src.indexOf("resolveCopilotSubject()");
      const store = src.indexOf("createCopilotConversationStore()");
      expect(identity).toBeGreaterThan(-1);
      expect(identity).toBeLessThan(store);
    }
    // The id is validated before the store is built, so a malformed one never
    // opens a database connection.
    expect(detailSrc.indexOf("isUuid(")).toBeLessThan(
      detailSrc.indexOf("createCopilotConversationStore()"),
    );
  });

  it("does not compose the orchestrator to read a conversation", () => {
    for (const src of [listSrc, detailSrc]) {
      expect(src).not.toContain("createCopilotOrchestrator");
      expect(src).not.toContain("ProviderRegistry");
    }
  });

  it("is read-only: neither route exports a mutating handler", () => {
    for (const src of [listSrc, detailSrc]) {
      expect(src).toMatch(/export async function GET\(/);
      expect(src).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)\(/);
    }
  });
});
