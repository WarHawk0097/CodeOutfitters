// The provider seam.
//
// Two things are being checked. First, that the contract itself holds: every
// vendor module constructs, declares capabilities, and exposes `generate` and
// `stream` — without a network, a key or an SDK. Second, that the shared
// pre-flight and the registry behave, since both sit between every caller and
// every vendor.

import { describe, expect, it } from "vitest";
import { ConfigurationError, ProviderError, UnsupportedCapabilityError } from "../errors";
import { collectStream, type AIStreamEvent } from "../streaming/events";
import { assertSupported, costOf, resolveDescriptor } from "./dispatch";
import { MockProvider } from "./mock";
import { PROVIDER_IDS, type ProviderId } from "./message";
import { ProviderRegistry } from "./registry";
import type { AIConfig } from "../config";
import type { AIProvider, ProviderCredentials, ProviderRequest } from "./types";

const CREDENTIALS: ProviderCredentials = {
  apiKey: "test-key",
  baseUrl: "https://provider.invalid/v1",
  apiVersion: "2024-10-21",
};

const CONFIG: AIConfig = {
  provider: "mock",
  defaultModel: "mock-model",
  fallbackModel: "mock-model",
  requestTimeoutMs: 1_000,
  maxRetries: 0,
  maxToolIterations: 2,
  maxContextMessages: 10,
  requestsPerMinute: 10,
  logLevel: "silent",
  redactPrompts: true,
};

function request(overrides: Partial<ProviderRequest> = {}): ProviderRequest {
  return { model: "mock-model", messages: [{ role: "user", content: "ping" }], ...overrides };
}

async function drain(events: AsyncIterable<AIStreamEvent>): Promise<AIStreamEvent[]> {
  const collected: AIStreamEvent[] = [];
  for await (const event of events) collected.push(event);
  return collected;
}

describe("AIProvider contract", () => {
  it.each(PROVIDER_IDS)("%s satisfies the interface without touching a network", async (id) => {
    const provider = await new ProviderRegistry(CONFIG, () => CREDENTIALS).get(id);

    expect(provider.id).toBe(id);
    expect(typeof provider.generate).toBe("function");
    expect(typeof provider.stream).toBe("function");
    expect(Object.keys(provider.capabilities).sort()).toEqual([
      "jsonMode",
      "promptCaching",
      "streaming",
      "structuredOutputs",
      "toolCalling",
      "vision",
    ]);
  });
});

describe("MockProvider", () => {
  it("echoes the last user message and reports usage", async () => {
    const provider = new MockProvider();
    const response = await provider.generate(request());

    expect(response.content).toEqual([{ type: "text", text: "echo: ping" }]);
    expect(response.finishReason).toBe("stop");
    expect(response.usage).toEqual({ inputTokens: 1, outputTokens: 3 });
    expect(provider.requests).toHaveLength(1);
  });

  it("consumes scripted turns in order and repeats the last one", async () => {
    const provider = new MockProvider({ turns: [{ text: "first" }, { text: "last" }] });

    expect((await provider.generate(request())).content).toEqual([{ type: "text", text: "first" }]);
    expect((await provider.generate(request())).content).toEqual([{ type: "text", text: "last" }]);
    expect((await provider.generate(request())).content).toEqual([{ type: "text", text: "last" }]);
  });

  it("throws a scripted error from generate", async () => {
    const provider = new MockProvider({
      turns: [{ error: new ProviderError("mock", "upstream said no", { httpStatus: 503 }) }],
    });

    await expect(provider.generate(request())).rejects.toThrow(ProviderError);
  });

  it("reports a scripted error as a terminal stream event, safely", async () => {
    const provider = new MockProvider({
      turns: [{ error: new ProviderError("mock", "Authorization: Bearer secret-value") }],
    });

    const events = await drain(provider.stream(request()));
    const last = events.at(-1);

    expect(last?.type).toBe("error");
    expect(JSON.stringify(events)).not.toContain("secret-value");
  });

  it("streams deltas that reassemble into the whole answer", async () => {
    const provider = new MockProvider({ turns: [{ text: "abcdefghij" }], chunkSize: 3 });
    const events = await drain(provider.stream(request()));

    expect(events[0]?.type).toBe("start");
    expect(events.at(-1)?.type).toBe("finish");
    expect(events.filter((event) => event.type === "text-delta")).toHaveLength(4);

    const collected = await collectStream(
      (async function* () {
        yield* events;
      })(),
    );
    expect(collected.text).toBe("abcdefghij");
    expect(collected.finishReason).toBe("stop");
  });

  it("emits tool calls and finishes with tool_calls", async () => {
    const toolCall = { id: "call_1", name: "search_crm", arguments: '{"q":"acme"}' };
    const provider = new MockProvider({ turns: [{ toolCalls: [toolCall] }] });

    const collected = await collectStream(provider.stream(request()));

    expect(collected.toolCalls).toEqual([toolCall]);
    expect(collected.finishReason).toBe("tool_calls");
  });

  it("ends a stream as cancelled when the caller aborts", async () => {
    const controller = new AbortController();
    const provider = new MockProvider({ turns: [{ text: "x".repeat(64) }], chunkSize: 1 });

    const events: AIStreamEvent[] = [];
    for await (const event of provider.stream(request(), controller.signal)) {
      events.push(event);
      if (events.length === 3) controller.abort();
    }

    const last = events.at(-1);
    expect(last?.type).toBe("error");
    expect(last && last.type === "error" ? last.code : undefined).toBe("ai/cancelled");
  });

  it("refuses a request that was aborted before it started", async () => {
    const provider = new MockProvider();
    await expect(provider.generate(request(), AbortSignal.abort())).rejects.toThrow();
  });
});

describe("assertSupported", () => {
  const capabilities = new MockProvider().capabilities;

  it("accepts a request both the model and the transport can serve", () => {
    expect(() =>
      assertSupported(request(), resolveDescriptor("mock-model"), capabilities, true),
    ).not.toThrow();
  });

  it("rejects images for a text-only model", () => {
    const withImage = request({
      model: "llama-3.3-70b-local",
      messages: [
        { role: "user", content: [{ type: "image", mediaType: "image/png", url: "https://x.invalid/a.png" }] },
      ],
    });

    expect(() =>
      assertSupported(withImage, resolveDescriptor("llama-3.3-70b-local"), capabilities, false),
    ).toThrow(UnsupportedCapabilityError);
  });

  it("rejects tools when the transport cannot call them", () => {
    const withTools = request({
      tools: [{ name: "t", description: "d", parameters: { type: "object" } }],
    });

    expect(() =>
      assertSupported(withTools, resolveDescriptor("mock-model"), { ...capabilities, toolCalling: false }, false),
    ).toThrow(UnsupportedCapabilityError);
  });

  it("rejects structured outputs the transport cannot guarantee", () => {
    const withSchema = request({
      responseFormat: { type: "json_schema", name: "r", schema: { type: "object" } },
    });

    expect(() =>
      assertSupported(
        withSchema,
        resolveDescriptor("mock-model"),
        { ...capabilities, structuredOutputs: false },
        false,
      ),
    ).toThrow(UnsupportedCapabilityError);
  });

  it("rejects an output budget larger than the model allows", () => {
    const tooLong = request({ params: { maxOutputTokens: 4_096 } });

    expect(() =>
      assertSupported(tooLong, resolveDescriptor("mock-model"), capabilities, false),
    ).toThrow(ConfigurationError);
  });

  it("names the unknown model rather than failing anonymously", () => {
    expect(() => resolveDescriptor("gpt-imaginary")).toThrow('"gpt-imaginary"');
  });
});

describe("costOf", () => {
  it("bills cached input at the cached rate instead of on top of it", () => {
    const model = resolveDescriptor("gpt-5");

    expect(costOf(model, { inputTokens: 1_000_000, outputTokens: 0 })).toBeCloseTo(1.25, 10);
    expect(
      costOf(model, { inputTokens: 1_000_000, outputTokens: 0, cachedInputTokens: 1_000_000 }),
    ).toBeCloseTo(0.125, 10);
  });

  it("costs nothing for a local model", () => {
    expect(costOf(resolveDescriptor("llama-3.3-70b-local"), { inputTokens: 5_000, outputTokens: 5_000 })).toBe(0);
  });
});

describe("ProviderRegistry", () => {
  it("serves the configured provider by default", async () => {
    const registry = new ProviderRegistry(CONFIG, () => CREDENTIALS);
    expect((await registry.getDefault()).id).toBe("mock");
  });

  it("caches one instance per provider", async () => {
    const registry = new ProviderRegistry(CONFIG, () => CREDENTIALS);
    expect(await registry.get("openai")).toBe(await registry.get("openai"));
  });

  it("resolves credentials once per instance and never exposes them", async () => {
    const seen: ProviderId[] = [];
    const registry = new ProviderRegistry(CONFIG, (id) => {
      seen.push(id);
      return CREDENTIALS;
    });

    await registry.get("anthropic");
    await registry.get("anthropic");

    expect(seen).toEqual(["anthropic"]);
    expect(JSON.stringify(registry)).not.toContain(CREDENTIALS.apiKey);
  });

  it("prefers an override, which is how the stack runs against a fake", async () => {
    const substitute = new MockProvider() as AIProvider;
    const registry = new ProviderRegistry(CONFIG, () => CREDENTIALS).override("openai", substitute);

    expect(await registry.get("openai")).toBe(substitute);
  });

  it("drops cached instances after a rotation", async () => {
    const registry = new ProviderRegistry(CONFIG, () => CREDENTIALS);
    const first = await registry.get("gemini");
    registry.clear();

    expect(await registry.get("gemini")).not.toBe(first);
  });
});
