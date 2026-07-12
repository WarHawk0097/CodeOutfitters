# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# CLAUDE_CODE_STATIC_PROMPT.md

```text
ROLE
You are Claude Code / OpenCode implementing the static CodeOutfitters homepage.

SOURCE OF TRUTH
Use the design-package folder, exported assets, and reference screenshots from OpenDesign / Claude Design.

STRICT RULES
- Do not design.
- Do not redesign.
- Do not add animation yet.
- Do not add new sections.
- Do not use full-section image slices.
- Do not flatten cards/buttons/navbars as images.
- Use real editable React/components.
- Use exported assets only for complex visuals, icons, and decorative images.
- Match the reference screenshots.

TASK
Implement the static responsive homepage.

BUILD
- Create real components for navbar, hero, trust strip, service cards, process timeline, CTA.
- Use tokens from TOKENS.md.
- Use layout rules from LAYOUT_SPEC.md and RESPONSIVE_SPEC.md.
- Use assets according to ASSET_MANIFEST.md.
- Respect DO_NOT_CHANGE.md and BANNED_PATTERNS.md.

STOP BEFORE
- advanced animation
- CMS
- backend integrations
- form submission logic beyond placeholder route
- redesigning any visual

VERIFY
Run:
- lint
- typecheck
- build

SCREENSHOTS
Capture:
- desktop 1440px
- tablet 768px
- mobile 390px

REPORT
Return:
- changed files list
- build/lint/typecheck proof
- screenshot paths
- mismatches vs reference
- remaining risks
```
