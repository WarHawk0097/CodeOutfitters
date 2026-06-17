# Procedural Memory

How we do things on this project. Recurring procedures, conventions, and rules.

## Phase discipline

1. Every phase produces a short report in the exact structure required by the orchestrating brief.
2. State files (`PROJECT_CONTROL_LOG.md`, `memory/CURRENT_STATE.md`, `docs/51_AGENT_HANDOFF_LOG.md`) are updated **before** the agent stops.
3. A phase never starts the next phase. It always stops and waits for ChatGPT Control Room.
4. If a phase discovers a blocker, it is logged but not fixed.

## Documentation policy

- `docs/` is the canonical home for prose documentation.
- The root `README.md` is the operator's first stop. It must match the actual scripts and ports.
- `DEPLOY.md` was moved into `docs/DEPLOYMENT.md` (this phase). Root `DEPLOY.md` should be deleted in a future cleanup, not in this phase.

## Code conventions (observed)

- Path alias: `@/*` → `./*` (see `tsconfig.json`).
- Tailwind tokens via CSS variables in `app/globals.css`. No Tailwind config file; v4 uses `@theme inline`.
- shadcn/ui components are not in `components/ui/`. The `components.json` file declares the alias but no shadcn components have been generated into the project. Treat the file as a future scaffold, not as a current dependency surface.
- Most components are `'use client'`. Server components are page files under `app/`.
- Forms follow the same pattern: client-side validation, honeypot field, POST to `NEXT_PUBLIC_N8N_WEBHOOK_URL`, generic error message on failure.

## State synchronization procedure

When a new agent starts:

1. Read `PROJECT_CONTROL_LOG.md`.
2. Read `docs/51_AGENT_HANDOFF_LOG.md`.
3. Read `memory/CURRENT_STATE.md`.
4. Read `memory/WORKING_MEMORY.md`.
5. Read `memory/IMPORTANT_DECISIONS.md`.
6. Only then read source files.

If a state file conflicts with a source file, the source file wins. Update the state file before stopping.

## Tooling installation procedure (when eventually approved)

1. Request TS0 or RDG0 approval from ChatGPT Control Room. State the tool, the version pin, the use case, and the cost (must be free or already licensed).
2. On approval, install. Pin the version. Add to `package.json` only after install succeeds.
3. Document the tool in `ai/AI_CONTEXT_RULES.md` and `INTEGRATION_NOTES.md` as relevant.
4. Add a smoke test or CI check if the tool warrants it.

## Repair procedure (for documented issues)

1. Confirm the issue is in `docs/ROADMAP.md` or `docs/SECURITY.md` or `memory/IMPORTANT_DECISIONS.md`.
2. Confirm the fix is in scope for the current phase.
3. If yes: implement, test, update docs.
4. If no: log the deferral, do not implement.
