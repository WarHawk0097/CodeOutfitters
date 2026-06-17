# repo-research

Scratchpad for repo-level research done across sessions. Append-only by convention. Each entry should have a date, a question, a method, and a finding.

This folder is empty by design in DOC-MEMORY-REPAIR. Future agents should add entries here as they investigate the repo, rather than scattering notes across `memory/` or `docs/`.

## Conventions

- One file per research question, named with a slug, e.g. `why-are-there-three-gsap-hooks.md`.
- Each file has these sections: **Question**, **Method**, **Findings**, **Implications**, **References**.
- Cite line numbers in the form `path/to/file.ext:line` or `path/to/file.ext:start-end`.
- Do not delete prior entries. If a finding is wrong, add a new entry that supersedes it.
- Repo research findings can be promoted into `docs/` or `memory/` if they become durable, but the original entry stays.

## When to add an entry

- You are about to make a change and you need to know the blast radius.
- You find something the existing docs do not cover.
- You resolve a question that took more than 10 minutes of repo reading.
- You find a contradiction between source code and existing docs.
