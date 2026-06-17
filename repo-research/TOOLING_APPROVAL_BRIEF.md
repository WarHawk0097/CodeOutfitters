# TOOLING APPROVAL BRIEF

> The owner has asked about several developer / AI tools. None are installed. None are approved. This brief is input for PM1. **Do not run `npx`, `npm install`, `pnpm install`, or any MCP-setup command in the current batch.**

## 1. Tooling Requested By Owner

| Tool | Category | Triggered by |
|---|---|---|
| Playwright MCP | MCP / browser QA | owner direction in D-011, D-012 |
| Chrome DevTools MCP | MCP / browser QA | owner direction in D-011, D-012 |
| Graphify | external code-to-graph | Universal Agent-Based Project Planning & Delivery System v3.5 |
| Repomix | external code-to-context | Universal Agent-Based Project Planning & Delivery System v3.5 |
| Context7 MCP | MCP / library docs lookup | Universal Agent-Based Project Planning & Delivery System v3.5 |
| Tree-sitter | external / structural parser | Universal Agent-Based Project Planning & Delivery System v3.5 |
| codebase-memory MCP | MCP / code memory | Universal Agent-Based Project Planning & Delivery System v3.5 |
| Impeccable | design / skill | owner direction D-012 |
| Emil Kowalski / Agents with Taste | design / skill | owner direction D-012 |
| ECC / affaan-m/ecc | developer / AI agent harness tooling (candidate) | owner-asked during D0 review; D0 ECC addendum |

## 2. Tool Purpose Matrix

| Tool | Purpose | Dev tool or runtime? | Install needed? | Gate required | Risk |
|---|---|---|---|---|---|
| Playwright MCP | Drive a real browser from the agent for visual / smoke / motion QA. Clicks, screenshots, accessibility tree, network log. | dev | yes (MCP server) | TS0 / RDG0 | Low. Read-only when used for QA. Mutating when used for dogfooding. |
| Chrome DevTools MCP | Lower-level browser introspection. Performance, console, DOM, network. | dev | yes (MCP server) | TS0 / RDG0 | Low. Read-only by default. |
| Graphify | Turn any input (code, docs, papers, images) into a knowledge graph with god nodes, community detection, and query tools. | dev | yes | TS0 / RDG0 | Low. Pure dev surface. |
| Repomix | Pack a repo into a single LLM-friendly bundle. | dev | yes | TS0 / RDG0 | Low. Pure dev surface. |
| Context7 MCP | Pull up-to-date library / framework docs into the agent's context. | dev | yes (MCP server) | TS0 / RDG0 | Low. Read-only. |
| Tree-sitter | Structural code parsing. | dev | yes (per project) | TS0 / RDG0 | Low. Pure dev surface. |
| codebase-memory MCP | Persistent memory of the codebase across sessions. | dev | yes (MCP server) | TS0 / RDG0 | Low-medium. The "memory of record" for the agent. Must be careful not to write secrets. |
| Impeccable | Frontend design review. Avoids generic AI UI. | dev / skill | yes (per project) | TS0 / RDG0 | Low. Skill is a prompt and checklist. |
| Emil Kowalski / Agents with Taste | Motion / animation taste reference. | dev / skill | yes (per project) | TS0 / RDG0 | Low. Skill is a prompt and checklist. |
| ECC / affaan-m/ecc | Developer / AI agent harness tooling. May be relevant because the owner uses Codex, OpenCode, Claude Code, and multiple agents. May overlap with Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, codebase-memory. | dev (if approved) | unknown (per project / global / reference-only — owner must specify) | TS0 / RDG0 | Low-medium. Must be evaluated before adoption. Not approved. Candidate only. Do not install, clone, copy configs from, configure, or evaluate until TS0 / RDG0. |

All nine plus ECC are developer / AI tooling. None are runtime dependencies by default. None ship to the deployed app. **ECC** is a candidate only; not approved; not installed; not cloned; not copied; not configured; not added to `package.json`; not added to `devDependencies`; not evaluated.

## 3. Recommended Installation Order Later

This is a recommendation, not a decision. The owner must approve each step.

1. **Repomix** — fastest win. Helps every other step because it gives the agent the full repo in one context.
2. **Graphify** — gives a persistent knowledge graph of the repo. Useful for cross-cutting investigations.
3. **Context7 MCP** — up-to-date library docs. Avoids hallucinated framework APIs.
4. **Playwright MCP** — first browser-QA tool. Visual + smoke + accessibility.
5. **Chrome DevTools MCP** — deeper browser introspection. Pairs with Playwright MCP.
6. **Impeccable** — design review skill. Used at design + review time.
7. **Emil Kowalski / Agents with Taste** — motion taste skill. Used at motion + review time.
8. **Tree-sitter + codebase-memory MCP** — only if needed by future phases. Both are "nice to have" once the prior seven are in.

The order is opinionated: cheapest, broadest, most-generally-useful tools first. Browser-based QA is split (Playwright before Chrome DevTools) so the team gets something working early. Design skills come after the team has the tools to test the output. The last two are reserved for later phases if at all.

## 4. Free / Open-Source First Rule

- All nine are free or open-source. None require a paid license today.
- If any tool becomes paid in the future, the default response is: do not upgrade. Find a free alternative. Per D-009.
- If a paid tool is the only viable option, surface the cost to the owner before installing.

## 5. What Must Not Happen

- No `npm install` / `pnpm install` / `yarn install` in any non-approved phase.
- No `npx` in any non-approved phase.
- No `npx skills add` for any skill.
- No `npx impeccable install`.
- No MCP server configuration in `.mcp.json` or any other config file.
- No `package.json` `devDependencies` change for these tools.
- No adding browser binaries (Playwright install) until the MCP server is approved.
- No scraping, cloning, or copying assets from `befluence.pro` or any other reference site.
- No `git clone` of ECC / affaan-m/ecc.
- No copy of ECC config folders (including `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs) into this repo.
- No install, configure, copy, or evaluate ECC / affaan-m/ecc in any pre-approval phase.

## 6. TS0 / RDG0 Questions

For a TS0 / RDG0 submission, the agent will need to answer:

- Which tool, which version, which scope (global vs per-project)?
- What is the use case, with a concrete scenario in this repo?
- What is the cost (must be zero today)?
- What new entry points does it create (config files, scripts, env vars)?
- What is the rollback path?
- Does it touch the deployed app? (Default expectation: no.)
- Does it write to disk outside the project? (Default expectation: no.)
- Does it transmit repo contents off-machine? (Repomix and codebase-memory MCP can; document the destination and the trust model.)

## 7. Acceptance Criteria For Tooling Setup Later

A future tooling-setup phase is complete when:

1. Each tool the owner approved is installed in a separate, small PR.
2. Each PR updates `package.json` `devDependencies` (or the equivalent MCP / skill config) with a pinned version.
3. Each PR adds a smoke test or a documented manual verification step.
4. Each PR updates `INTEGRATION_NOTES.md` (if the tool is an integration), `ai/AI_CONTEXT_RULES.md` (if the tool changes agent behavior), and the relevant `docs/` file.
5. No production config file (`public/_headers`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, lockfiles) is changed for the sake of the tool unless that change is strictly required and documented.
6. The free / open-source-first rule is preserved.

**No install in this batch. No MCP setup. No skill install. No package edit.**
