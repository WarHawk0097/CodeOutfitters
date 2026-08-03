import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const nonSource = [
  // build/generated (belt-and-suspenders; eslint-config-next already ignores these
  // at repo root, but nested workspaces like command-center/apps/web also emit
  // their own .next/out/build/coverage dirs that need the deep glob)
  "**/.next/**",
  "**/out/**",
  "**/build/**",
  "**/coverage/**",
  "**/dist/**",
  "next-env.d.ts",
  "public/mockServiceWorker.js",
  // archived / legacy design exports, not app source
  "_legacy-dc-backup/**",
  "CodeOutfitters homepage design Latest (4)/**",
  "CodeOutfitters-8-page-21st-aggressive-final/**",
  "CODEOUTFITTERS-FINAL-HANDOFF/**",
  // evidence, research, working notes, dashboards, tool caches
  "System-Artifacts/**",
  "repo-research/**",
  "memory/**",
  "work/**",
  "Dashboard/**",
  "graphify-out/**",
  ".claude/**",
  ".serena/**",
  ".gstack/**",
  ".task-temp/**",
  ".tokensave/**",
  ".vercel/**",
  // untracked ad-hoc QA/debug scripts at repo root, not app source
  "qa-*.mjs",
  "qa-*.js",
  "test-*.js",
  "test-*.mjs",
  "review-test.js",
  "record-demos-and-qa.mjs",
  // command-center is an independent pnpm sub-project (own packageManager,
  // own per-app eslint.config.mjs, own `pnpm -r lint`) nested in this repo,
  // not part of the root npm/Next.js app's workspaces. Linting it through the
  // root config applies the wrong ruleset (Next.js frontend config against a
  // NestJS API app) and duplicates its own lint pipeline. Lint it separately
  // via `cd command-center && pnpm -r lint`.
  "command-center/**",
  // untracked review/audit dump directories (git status: `??`), not app source.
  // NOTE: leading "#" written as "[#]" — minimatch treats a pattern starting
  // with a literal "#" as a comment and silently matches nothing.
  "[#] CodeOutfitters Project/**",
  "[#] CodeOutfitters Project Audit/**",
  "[#] CodeOutfitters Project Audit)/**",
];

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  { ignores: nonSource },
];
