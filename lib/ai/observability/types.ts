// Observability seams.
//
// Interfaces only, plus no-op implementations, because the choice of logging and
// tracing backend is not this task's to make — but the call sites are. Every
// layer takes a `Logger`, a `Tracer` and a `Metrics` by injection, so wiring
// OpenTelemetry later is a change to one composition root and nothing else.
//
// The no-ops are the default so that the stack works, and is testable, before any
// backend exists.

export type LogLevel = "debug" | "info" | "warn" | "error";

/** Structured fields only. A logger never accepts a pre-formatted string blob. */
export type LogFields = Readonly<Record<string, unknown>>;

export interface Logger {
  log(level: LogLevel, message: string, fields?: LogFields): void;
  /** Returns a logger that merges `fields` into everything it emits. */
  child(fields: LogFields): Logger;
}

/** One unit of work. Spans nest by construction, not by a global ambient context. */
export interface Span {
  setAttributes(fields: LogFields): void;
  recordError(error: unknown): void;
  end(): void;
}

export interface Tracer {
  startSpan(name: string, fields?: LogFields): Span;
}

export interface Metrics {
  increment(name: string, value?: number, tags?: LogFields): void;
  /** Milliseconds, histogram-shaped. Latency and token counts both land here. */
  record(name: string, value: number, tags?: LogFields): void;
}

/** The bundle every layer receives. One parameter instead of three. */
export type Telemetry = {
  logger: Logger;
  tracer: Tracer;
  metrics: Metrics;
};

class NoopLogger implements Logger {
  log(): void {}
  child(): Logger {
    return this;
  }
}

class NoopSpan implements Span {
  setAttributes(): void {}
  recordError(): void {}
  end(): void {}
}

class NoopTracer implements Tracer {
  startSpan(): Span {
    return new NoopSpan();
  }
}

class NoopMetrics implements Metrics {
  increment(): void {}
  record(): void {}
}

export const noopLogger: Logger = new NoopLogger();
export const noopTracer: Tracer = new NoopTracer();
export const noopMetrics: Metrics = new NoopMetrics();

export const noopTelemetry: Telemetry = {
  logger: noopLogger,
  tracer: noopTracer,
  metrics: noopMetrics,
};
