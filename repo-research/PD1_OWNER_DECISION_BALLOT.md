# PD1 Owner Decision Ballot

> **Status:** Optional support file for `docs/PD1_DECISION_LOCK.md`. One row per decision. The owner returns this file (or the equivalent in chat) with the chosen option for each row. PD1 is a decision-lock package; PD1 does not start D0.
>
> **Usage:** for each row, the owner replies with **Accept** (the recommended default), **Override** (and names the alternative + one-line rationale), or **Defer** (and names the phase the decision is parked to).

## Section A — Primary decisions (LOCKED DEFAULT unless overridden)

| ID | Topic | Recommended Default | Owner Choice (Accept / Override / Defer) |
|---|---|---|---|
| D-015 | Package manager | `npm` | |
| D-016 | Product launch identity | Real business site first, with portfolio-safe language until real case studies exist | |
| D-017 | Admin scope | Internal-only admin | |
| D-018 | Security before any non-internal launch | Required | |
| D-019 | Booking correctness before any non-internal launch | Required | |
| D-020 | Supabase RLS before any non-internal launch | Required | |
| D-021 | Tooling order (TS0 / RDG0) | Repomix → Graphify → Context7 MCP → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil Kowalski → Tree-sitter / codebase-memory | |
| D-022 | UIX0 / MOTION0 priority | High priority after security, booking, RLS, observability baseline, and tooling approvals | |
| D-023 | BeFluence usage | Reference only | |
| D-024 | Impeccable / Emil Kowalski adoption scope | Use later, after TS0 / RDG0 approval. Per-project when approved. | |
| D-025 | Recent proposals scope | Later admin phase, after auth and proposal-persistence decisions | |
| D-026 | Observability vendor / channel | Sentry (errors) + UptimeRobot (uptime) + email alerts to `hello@codeoutfitters.com` | |
| D-027 | Git / repo root status | `git init` at `F:\CodeOutfitters` in Setup phase, only if owner confirms `F:\CodeOutfitters` is the real repo root | |

### Section A.1 — Additional tooling candidate (NOT APPROVED)

| ID | Topic | Recommended Default | Owner Choice (Accept / Override / Defer) |
|---|---|---|---|
| Ponytail | Third-party dev / AI tool, candidate only. Exact official GitHub repo URL not yet provided. | **NOT APPROVED.** Recorded as a candidate for the future TS0 / RDG0 submission only. Do not install, clone, configure, or add to `package.json` in this batch or any pre-approval phase. | |

## Section B — Architectural-path decisions (NEEDS OWNER APPROVAL)

| ID | Question | Recommended Default | Owner Choice (Accept / Override / Defer) |
|---|---|---|---|
| D-019a | Anthropic protection path | Cloudflare Worker proxy (if Cloudflare Pages / static export remains) | |
| D-020a | Admin auth path | Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized | |
| D-019b | Booking MVP write path | A first (UI reads `available_slots` and blocks booked slots), then C (n8n handles booking validation) | |
| D-022a | Performance budget specifics | Accept §8.7 as written (LCP unchanged, CLS = 0, INP in "good" range, +0 KB JS net for first slice) | |
| D-021a | Test runner form | Both (real Playwright test runner in CI + Playwright MCP / Chrome DevTools MCP for visual QA loop) | |
| D-021b | Q-19 vendor choice | Sentry + UptimeRobot (GlitchTip / Better Stack as fallback) | |

## Section C — Bundled follow-up items (Q-13..Q-21)

| ID | Question | Recommended Default | Owner Choice (Accept / Override / Defer) |
|---|---|---|---|
| Q-13 | Delete legacy `DEPLOY.md` (root) in Cleanup A, or keep and reconcile? | Delete in Cleanup A | |
| Q-14 | Add `source: "contact"` to contact form in Cleanup A? | Yes, in Cleanup A | |
| Q-15 | Auth model (Cloudflare Access / Supabase Auth / etc.) | See D-020a | |
| Q-16 | Performance budget (UIX0 / MOTION0) | See D-022a | |
| Q-17 | Taste acceptance rubric | Use the D-012 avoid / prefer list verbatim, plus Impeccable + Emil Kowalski review at end of first slice | |
| Q-18 | Test runner form (real / MCP / both) | See D-021a | |
| Q-19 | Observability vendor (Sentry / GlitchTip; UptimeRobot / Better Stack) | See D-021b | |
| Q-20 | Brand "All systems operational" footer: live or static? | Keep static in MVP. Document as a known limitation (R-035). Replace with a live badge when the observability phase ships. | |
| Q-21 | Confirm `F:\CodeOutfitters` is the real repo root | If yes, `git init` in Setup phase | |

### Section C.1 — Ponytail owner input (REQUIRED before TS0 / RDG0 evaluation)

| Question | Owner response |
|---|---|
| Exact official GitHub repo URL for Ponytail (canonical upstream) | |
| Pinned version or commit SHA | |
| Scope preference: global / per-project / reference-only (default: reference-only) | |
| Use case in this repo (one line) | |
| Free / open-source? (Y / N) | |

## Section D — Authorization to proceed

| Question | Owner Choice (Y / N) |
|---|---|
| Authorize D0 to start with the accepted defaults? | |
| If a default was overridden, name the new choice + rationale per row above | |

## Safety confirmation (this file)

- This file is documentation only. No code, no installs, no config.
- No source / runtime / config files were modified to produce this file.
- This file lives in the allowed change zone (`repo-research/`).
- PD1 does not start D0. PD1 does not code. PD1 does not install. PD1 does not configure tooling. PD1 stops and waits for ChatGPT Control Room.
- **Ponytail** is recorded as a candidate only. It is not installed, cloned, configured, or added to `package.json`. It is gated to TS0 / RDG0.
