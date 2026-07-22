// Command Center background worker.
// No job handlers registered yet — BullMQ/Redis wiring lands when the
// asynchronous phases begin, per work/DEPENDENCY-PLAN.md.

export function boot() {
  // eslint-disable-next-line no-console
  console.log("command-center worker booted (no handlers registered)");
  return { status: "booted" as const };
}

// ponytail: this is the only entrypoint file for apps/worker today, so boot
// unconditionally rather than cross-platform-fragile argv/URL entrypoint
// detection. Revisit if this file is ever imported as a library module.
boot();
