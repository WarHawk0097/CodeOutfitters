// Resilience and redaction.
//
// These are the two modules whose failure is silent. A retry that fires on a
// validation error costs money and changes nothing; a redaction seam that is
// never wired up looks perfect until the day a real log backend is attached and
// yesterday's prompts are already in it.
//
// Clocks, sleeps and sinks are all injected. No test waits, and the recording
// logger is what makes "was this actually redacted" an assertion rather than an
// intention.

import { describe, expect, it, vi } from "vitest";
import {
  CancelledError,
  ConfigurationError,
  PermissionError,
  ProviderError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "../errors";
import {
  REDACTED,
  redactFields,
  redactSecrets,
  redactingTelemetry,
  summarizeText,
} from "./redaction";
import { InMemoryRateLimiter, startDeadline, withRetry, withTimeout } from "./resilience";
import type { LogFields, LogLevel, Telemetry } from "./types";

const instantSleep = async (): Promise<void> => {};

describe("withTimeout", () => {
  it("aborts the work it is waiting on and reports a timeout", async () => {
    let observed: AbortSignal | undefined;

    await expect(
      withTimeout(5, (signal) => {
        observed = signal;
        // Settles only on abort, the way a `fetch` given this signal would.
        return new Promise<never>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        });
      }),
    ).rejects.toBeInstanceOf(TimeoutError);

    // Cancellation, not abandonment: a socket left open costs tokens.
    expect(observed?.aborted).toBe(true);
  });

  it("returns the value when the work finishes in time", async () => {
    await expect(withTimeout(1_000, async () => "done")).resolves.toBe("done");
  });

  it("does not relabel a caller's cancellation as a timeout", async () => {
    const controller = new AbortController();
    const pending = withTimeout(
      60_000,
      (signal) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new CancelledError()));
        }),
      controller.signal,
    );
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(CancelledError);
  });

  it("leaves an unrelated failure exactly as it was thrown", async () => {
    const failure = new ValidationError("nope");
    await expect(withTimeout(1_000, async () => Promise.reject(failure))).rejects.toBe(failure);
  });
});

describe("startDeadline", () => {
  it("aborts immediately for a caller that has already cancelled", () => {
    const deadline = startDeadline(60_000, AbortSignal.abort());
    expect(deadline.signal.aborted).toBe(true);
    expect(deadline.expired()).toBe(false);
    deadline.release();
  });

  it("leaves a failure it did not cause untouched", () => {
    const deadline = startDeadline(60_000);
    const failure = new Error("unrelated");
    expect(deadline.toError(failure)).toBe(failure);
    deadline.release();
  });

  it("survives being released more than once", () => {
    const deadline = startDeadline(60_000);
    expect(() => {
      deadline.release();
      deadline.release();
    }).not.toThrow();
  });
});

describe("withRetry", () => {
  it("retries a retryable failure and returns the eventual success", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ProviderError("openai", "flaky", { retryable: true }))
      .mockResolvedValueOnce("ok");

    await expect(
      withRetry(operation, { maxRetries: 3, sleep: instantSleep, random: () => 0.5 }),
    ).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["validation", new ValidationError("bad input")],
    ["permission", new PermissionError("CanSendEmail", "denied")],
    ["configuration", new ConfigurationError("missing key")],
    ["cancellation", new CancelledError()],
  ])("never retries a %s failure", async (_case, failure) => {
    const operation = vi.fn(async () => Promise.reject(failure));

    await expect(withRetry(operation, { maxRetries: 5, sleep: instantSleep })).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("stops at the configured budget rather than retrying indefinitely", async () => {
    const operation = vi.fn(async () =>
      Promise.reject(new ProviderError("openai", "still down", { retryable: true })),
    );

    await expect(withRetry(operation, { maxRetries: 2, sleep: instantSleep })).rejects.toBeInstanceOf(
      ProviderError,
    );
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("performs no retry at all when the budget is zero", async () => {
    const operation = vi.fn(async () =>
      Promise.reject(new ProviderError("openai", "down", { retryable: true })),
    );

    await expect(withRetry(operation, { maxRetries: 0, sleep: instantSleep })).rejects.toBeInstanceOf(
      ProviderError,
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("backs off exponentially, jittered, and never beyond the cap", async () => {
    const delays: number[] = [];
    const operation = async (): Promise<never> =>
      Promise.reject(new ProviderError("openai", "down", { retryable: true }));

    await expect(
      withRetry(operation, {
        maxRetries: 4,
        baseDelayMs: 100,
        maxDelayMs: 400,
        // Full jitter with the maximum draw, so the ceiling is observable.
        random: () => 0.999_999,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }),
    ).rejects.toBeInstanceOf(ProviderError);

    expect(delays).toEqual([99, 199, 399, 399]);
  });

  it("prefers the provider's own retry-after to the computed delay", async () => {
    const delays: number[] = [];
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new RateLimitError("slow down", { retryAfterMs: 1_234 }))
      .mockResolvedValueOnce("ok");

    await withRetry(operation, {
      maxRetries: 1,
      sleep: async (ms) => {
        delays.push(ms);
      },
    });

    expect(delays).toEqual([1_234]);
  });
});

describe("InMemoryRateLimiter", () => {
  it("allows up to the limit and then refuses", () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(2, 60_000, () => now);

    limiter.consume("workspace-1:user-1");
    limiter.consume("workspace-1:user-1");
    expect(() => limiter.consume("workspace-1:user-1")).toThrow(RateLimitError);
  });

  it("counts each subject separately", () => {
    const limiter = new InMemoryRateLimiter(1, 60_000, () => 0);
    limiter.consume("workspace-1:user-1");
    expect(() => limiter.consume("workspace-1:user-2")).not.toThrow();
  });

  it("reopens the window once it has passed", () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(1, 1_000, () => now);

    limiter.consume("k");
    now = 1_000;
    expect(() => limiter.consume("k")).not.toThrow();
  });

  it("does not grow without bound as subjects come and go", () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(1, 1_000, () => now);

    // More distinct subjects than the sweep threshold, each in its own window.
    for (let index = 0; index < 12_000; index += 1) {
      now = index;
      limiter.consume(`subject-${index}`);
    }

    // Every key from more than one window ago has expired, so the sweep that
    // fires on allocation must have reclaimed them.
    const size = (limiter as unknown as { hits: Map<string, unknown> }).hits.size;
    expect(size).toBeLessThan(12_000);
  });
});

describe("redactSecrets", () => {
  it.each([
    ["sk-abcdefghijklmnopqrstuvwxyz012345", "an OpenAI-style key"],
    ["Bearer abcdefghijklmnopqrstuvwxyz", "a bearer token"],
  ])("removes %s (%s)", (secret) => {
    expect(redactSecrets(`value=${secret}`)).not.toContain(secret);
  });
});

describe("redactFields", () => {
  it("drops credential-shaped keys without touching the rest", () => {
    expect(
      redactFields({ apiKey: "sk-live-1", authorization: "Bearer x", model: "gpt-5" }),
    ).toEqual({ apiKey: REDACTED, authorization: REDACTED, model: "gpt-5" });
  });

  it("reaches nested objects and arrays", () => {
    expect(
      redactFields({ outer: { inner: [{ token: "t-1", safe: 2 }] } }),
    ).toEqual({ outer: { inner: [{ token: REDACTED, safe: 2 }] } });
  });

  it("leaves the caller's object untouched", () => {
    const original = { apiKey: "sk-live-1", nested: { token: "t" } };
    redactFields(original);
    expect(original).toEqual({ apiKey: "sk-live-1", nested: { token: "t" } });
  });

  it("keeps an error's classification rather than flattening it away", () => {
    const redacted = redactFields({ error: new ProviderError("openai", "down") }) as {
      error: { name: string; message: string };
    };
    expect(redacted.error.name).toBe("ProviderError");
  });

  it("bounds recursion on a cyclic payload", () => {
    const cyclic: Record<string, unknown> = { name: "loop" };
    cyclic.self = cyclic;
    expect(() => redactFields(cyclic)).not.toThrow();
  });

  it("summarises message bodies only when prompt redaction is on", () => {
    const fields = { prompt: "the customer's private question" };

    expect(redactFields(fields, 0, false)).toEqual(fields);
    expect(redactFields(fields, 0, true)).toEqual({ prompt: summarizeText(fields.prompt) });
  });
});

/** A sink that keeps everything it is handed, so the tests can inspect it. */
function recordingTelemetry(): {
  telemetry: Telemetry;
  logs: { level: LogLevel; message: string; fields?: LogFields }[];
  attributes: LogFields[];
  tags: LogFields[];
  errors: unknown[];
} {
  const logs: { level: LogLevel; message: string; fields?: LogFields }[] = [];
  const attributes: LogFields[] = [];
  const tags: LogFields[] = [];
  const errors: unknown[] = [];

  const logger = {
    log: (level: LogLevel, message: string, fields?: LogFields) => {
      logs.push({ level, message, ...(fields ? { fields } : {}) });
    },
    child: () => logger,
  };

  return {
    logs,
    attributes,
    tags,
    errors,
    telemetry: {
      logger,
      tracer: {
        startSpan: (_name, fields) => {
          if (fields) attributes.push(fields);
          return {
            setAttributes: (next) => attributes.push(next),
            recordError: (error) => errors.push(error),
            end: () => {},
          };
        },
      },
      metrics: {
        increment: (_name, _value, next) => {
          if (next) tags.push(next);
        },
        record: (_name, _value, next) => {
          if (next) tags.push(next);
        },
      },
    },
  };
}

describe("redactingTelemetry", () => {
  it("redacts credentials before they reach the logger", () => {
    const sink = recordingTelemetry();
    const telemetry = redactingTelemetry(sink.telemetry, { redactPrompts: true });

    telemetry.logger.log("info", "calling provider", {
      apiKey: "sk-live-abcdefghijklmnopqrstuvwxyz",
      authorization: "Bearer abcdefghijklmnopqrstuvwxyz",
      headers: { "x-api-key": "sk-live-abcdefghijklmnopqrstuvwxyz" },
    });

    const serialised = JSON.stringify(sink.logs);
    expect(serialised).not.toContain("sk-live-abcdefghijklmnopqrstuvwxyz");
    expect(serialised).toContain(REDACTED);
  });

  it("redacts a secret interpolated into the message itself", () => {
    const sink = recordingTelemetry();
    redactingTelemetry(sink.telemetry, { redactPrompts: true }).logger.log(
      "error",
      "openai returned 401: sk-live-abcdefghijklmnopqrstuvwxyz",
    );

    expect(sink.logs[0]?.message).not.toContain("sk-live-abcdefghijklmnopqrstuvwxyz");
  });

  it("replaces prompt text with its shape when prompt redaction is on", () => {
    const sink = recordingTelemetry();
    redactingTelemetry(sink.telemetry, { redactPrompts: true }).logger.log("info", "turn", {
      text: "the customer's private question",
      messages: [{ role: "user", content: "another private thing" }],
    });

    const serialised = JSON.stringify(sink.logs);
    expect(serialised).not.toContain("private question");
    expect(serialised).not.toContain("another private thing");
  });

  it("keeps the operational fields an on-call engineer needs", () => {
    const sink = recordingTelemetry();
    redactingTelemetry(sink.telemetry, { redactPrompts: true }).logger.log("warn", "slow turn", {
      providerId: "openai",
      model: "gpt-5",
      latencyMs: 4_210,
      usage: { inputTokens: 900, outputTokens: 120 },
      code: "ai/timeout",
      retryable: true,
    });

    expect(sink.logs[0]?.fields).toEqual({
      providerId: "openai",
      model: "gpt-5",
      latencyMs: 4_210,
      usage: { inputTokens: 900, outputTokens: 120 },
      code: "ai/timeout",
      retryable: true,
    });
  });

  it("passes prompt text through when redaction is deliberately disabled", () => {
    const sink = recordingTelemetry();
    redactingTelemetry(sink.telemetry, { redactPrompts: false }).logger.log("debug", "turn", {
      text: "local debugging",
    });

    expect(sink.logs[0]?.fields).toEqual({ text: "local debugging" });
  });

  it("filters records below the configured level, and drops everything when silent", () => {
    const sink = recordingTelemetry();
    const warnAndAbove = redactingTelemetry(sink.telemetry, {
      redactPrompts: true,
      logLevel: "warn",
    });

    warnAndAbove.logger.log("debug", "noise");
    warnAndAbove.logger.log("info", "noise");
    warnAndAbove.logger.log("warn", "kept");
    warnAndAbove.logger.log("error", "kept");
    expect(sink.logs.map((entry) => entry.message)).toEqual(["kept", "kept"]);

    const silent = redactingTelemetry(sink.telemetry, { redactPrompts: true, logLevel: "silent" });
    silent.logger.log("error", "never emitted");
    expect(sink.logs).toHaveLength(2);
  });

  it("redacts span attributes and metric tags too", () => {
    const sink = recordingTelemetry();
    const telemetry = redactingTelemetry(sink.telemetry, { redactPrompts: true });

    const span = telemetry.tracer.startSpan("ai.turn", { token: "t-secret" });
    span.setAttributes({ prompt: "private text" });
    telemetry.metrics.increment("ai.turn.error", 1, { apiKey: "sk-live-1" });

    const serialised = JSON.stringify([sink.attributes, sink.tags]);
    expect(serialised).not.toContain("t-secret");
    expect(serialised).not.toContain("private text");
    expect(serialised).not.toContain("sk-live-1");
  });

  it("does not mutate the fields object the caller still owns", () => {
    const sink = recordingTelemetry();
    const fields = { apiKey: "sk-live-1", text: "private" };

    redactingTelemetry(sink.telemetry, { redactPrompts: true }).logger.log("info", "turn", fields);
    expect(fields).toEqual({ apiKey: "sk-live-1", text: "private" });
  });

  it("still records the error object a span needs for classification", () => {
    const sink = recordingTelemetry();
    const telemetry = redactingTelemetry(sink.telemetry, { redactPrompts: true });
    const failure = new TimeoutError(1_000);

    telemetry.tracer.startSpan("ai.turn").recordError(failure);
    expect(sink.errors).toEqual([failure]);
  });
});
