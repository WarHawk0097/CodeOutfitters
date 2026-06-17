# AI Contracts

Formal contracts between the human operator, the agents, and ChatGPT Control Room.

## Contract 1 — Human ↔ ChatGPT Control Room

- The human may request a phase, a scope change, or a decision.
- ChatGPT Control Room is the only entity authorized to approve a gate transition, a tooling install, or a budget item.
- The human's verbal approval is not sufficient for gate transitions. The approval must be recorded in `docs/51_AGENT_HANDOFF_LOG.md`.

## Contract 2 — ChatGPT Control Room ↔ Agent

- An agent may not begin a phase without the prior phase's report being on file.
- An agent may not transition to the next phase on its own. The transition requires a new approval.
- An agent must report blockers. ChatGPT Control Room decides whether to expand scope, change plan, or stop.

## Contract 3 — Agent ↔ Repo

- An agent may only write to files in its allowed set (see `ai/AI_FILE_OWNERSHIP.md`).
- An agent must leave the repo in a consistent state on stop. No half-finished files, no undocumented decisions.
- An agent must update state files before stopping.

## Contract 4 — Phase ↔ Phase

- A phase's deliverable is the input to the next phase.
- A phase that produces a plan must also produce a verification list. The next phase's first action is to verify the deliverable.
- A phase that discovers drift between its deliverable and the repo must reconcile it in this phase, not the next.

## Contract 5 — Tooling ↔ Repo

- A tool is not in scope until TS0 or RDG0 approval is recorded.
- A tool's installation is an implementation action, not a planning action.
- A tool's configuration lives in the repo only after install succeeds. Until then, it is documented in `ai/AI_CONTEXT_RULES.md` and the relevant `docs/` file.

## Contract 6 — Documentation ↔ Code

- When code changes, the matching `docs/`, `memory/`, and `ai/` files must change in the same commit (or PR).
- When docs change, the code they describe must be verified to still match.
- `memory/SEMANTIC_MEMORY.md` and `docs/ARCHITECTURE.md` are the slowest-changing; if they need an update, the decision belongs in `memory/IMPORTANT_DECISIONS.md`.

## Contract 7 — Failure modes

- An agent that loses repo context must reload from `PROJECT_CONTROL_LOG.md` + `docs/51_AGENT_HANDOFF_LOG.md` + `memory/CURRENT_STATE.md` before continuing.
- An agent that finds the repo in an inconsistent state must stop and report. It does not silently repair the inconsistency.
- An agent that needs to violate a rule must stop and request approval. It does not proceed with a justified exception.
