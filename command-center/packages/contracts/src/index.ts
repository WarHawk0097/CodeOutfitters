// Shared Zod contract schemas (frontend/backend boundary).
// Organized by domain per work/PHASED-IMPLEMENTATION-PLAN.md Phase 2.
// Source of truth: Dashboard/integration-layer/api-contracts.json (16 operationIds).
export const CONTRACTS_PACKAGE_VERSION = "0.2.0";

export * from "./shared";
export * from "./auth";
export * from "./leads";
export * from "./meetings";
export * from "./ai";
export * from "./crm";
export * from "./proposals";
export * from "./client";
