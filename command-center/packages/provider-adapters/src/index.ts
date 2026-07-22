// Provider adapter interfaces + deterministic mocks.
// Mock implementations populated in Phase 2 (Contract-first mock layer)
// per work/PROVIDER-ADAPTER-PLAN.md. Real provider wiring deferred to Phase 15
// (PHASE0-DECISION-CLOSURE.md DECISION 3): no SDKs, no accounts, no keys, no live calls.
export * from "./types";
export * from "./email";
export * from "./calendar";
export * from "./meeting-platform";
export * from "./transcription";
export * from "./language-model";
export * from "./object-storage";
export * from "./pdf-rendering";
export * from "./proposal-acceptance";
