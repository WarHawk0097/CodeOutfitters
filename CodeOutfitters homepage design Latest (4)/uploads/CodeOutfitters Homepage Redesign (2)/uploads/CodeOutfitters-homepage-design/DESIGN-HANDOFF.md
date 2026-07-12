# CodeOutfitters homepage design implementation handoff

This archive is the source of truth for turning the design into production code. Start from `CodeOutfitters Homepage v2.dc.html`, then preserve the visual system, responsive behavior, and interactions found in the exported files.

## Implementation target
- Build production UI from the exported design, not a loose reinterpretation.
- Preserve typography scale, spacing rhythm, color tokens, border radii, shadows, motion timing, and component states.
- Replace static placeholders only when the target app has real data or functional equivalents.
- Keep generated product UI free of Open Design chrome, preview labels, or design-process annotations.
- Treat this handoff as a visual contract: if implementation choices conflict, match the exported pixels and behavior first, then refactor internals.

## Source map
- Primary entry: `CodeOutfitters Homepage v2.dc.html`
- HTML screens detected: 3
- Stylesheets detected: 0
- Script/component files detected: 1
- Supporting assets detected: 50

## Responsive contract
Validate the implementation across this 2025–2026 viewport matrix:
- Mobile compact: 360×800
- Mobile standard: 390×844
- Mobile large: 430×932
- Foldable / small tablet: 600×960
- Tablet portrait: 820×1180
- Tablet landscape: 1024×768
- Laptop: 1366×768
- Desktop: 1440×900
- Wide desktop: 1920×1080

For responsive web exports, treat these as a modern breakpoint system for one adaptive web experience, not three fixed screenshots. Do not split responsive web into unrelated native app screens unless the project explicitly includes native targets. Use semantic layout thresholds, fluid `clamp()` type/spacing, and container queries where component width matters more than viewport width. Preserve any CSS media queries, container queries, fluid `clamp()` scales, and layout changes already present in the exported files.

## Design fidelity contract
- Extract reusable tokens before writing components: background, surface, foreground, muted text, border, accent, radius, shadow, spacing, type scale, and motion duration/easing.
- Map product screens, in-app modules/components, optional landing page, and optional OS widget surfaces before coding. Keep these surfaces separate in the target architecture.
- Match layout geometry: max-widths, gutters, grid columns, card proportions, sticky/fixed elements, and viewport-specific navigation.
- Preserve real copy, labels, and data shown in the export. Do not replace specific text with generic marketing filler.
- Preserve interactive affordances: hover, focus, pressed, disabled, loading, validation, copy/share, tab/accordion, modal/sheet, and keyboard states where present.
- Preserve accessibility semantics when converting: headings stay hierarchical, controls remain buttons/links/inputs, focus states stay visible.
- Do not keep prototype-only annotations, frame labels, or Open Design chrome in the production UI.

## CJX-ready UX contract
- Use `DESIGN-MANIFEST.json` as the machine-readable map for screens, app modules, OS widgets, landing pages, tokens, interactions, and viewport checks.
- Screen-file-first: when multiple user-facing surfaces exist, implement each HTML screen as its own route/file. Treat `index.html` as a launcher/overview when the manifest marks it that way, not as a combined final UI.
- If `landing.html`, app screens, platform screens, or OS widget files exist, preserve those boundaries in the target app instead of merging them into one page.
- A single self-contained `CodeOutfitters Homepage v2.dc.html` is acceptable only when the export truly contains one user-facing screen and its CSS/JS are structured enough to extract tokens, components, states, and behavior.
- If separate `css/` or `js/` files exist, treat them as source of truth for token/component/interactions before porting to React, Vue, SwiftUI, Compose, or another target stack.
- In-app modules/components are product UI blocks inside the app. OS widgets are home-screen/lock-screen/quick-access surfaces outside the app. Do not merge those concepts.

## Color and brand contract
- Use the exported design tokens and product/domain context as the color source of truth.
- Do not introduce warm beige / cream / peach / pink / orange-brown background washes unless they are already explicit brand/reference colors in the export.
- A stylesheet or design/token file was detected; inspect it for canonical color variables before choosing framework theme tokens.

## Implementation sequence for AI coding tools
1. Open `CodeOutfitters Homepage v2.dc.html` and `DESIGN-MANIFEST.json`; identify every screen file, launcher/overview file, app module, and interaction before coding.
2. If multiple HTML screens exist, map them to separate routes/surfaces first; do not merge `landing.html`, product app screens, platform screens, or OS widgets into one route.
3. Extract a token table from CSS/root styles and inline styles before building framework components.
4. Build product screens and domain-specific in-app modules from largest layout regions down to controls; avoid starting with isolated atoms that lose spatial intent.
5. Port responsive behavior across the modern viewport matrix and test each semantic breakpoint before cleanup.
6. Port interactions and states, then replace static placeholders only with real app data or functional equivalents.
7. Keep optional landing page and OS widget surfaces as separate surfaces if present.
8. Compare final screenshots against the export at 360×800, 390×844, 430×932, 820×1180, 1024×768, 1366×768, 1440×900, and 1920×1080 before declaring done.

## Entry points
- `CodeOutfitters Homepage v2.dc.html`
- `CodeOutfitters Homepage v3.dc.html`
- `CodeOutfitters Homepage.dc.html`

## Styles
- None detected

## Scripts/components
- `support.js`

## Assets and supporting files
- `assets/hermes-shield-check.svg`
- `assets/hero-visual.png`
- `assets/icon-ai-agent-face.svg`
- `assets/icon-arrow-right.svg`
- `assets/icon-automate.svg`
- `assets/icon-chat-square.svg`
- `assets/icon-check-square.svg`
- `assets/icon-chevron-right.svg`
- `assets/icon-confirmed-dot.svg`
- `assets/icon-database-stack.svg`
- `assets/icon-edit-square.svg`
- `assets/icon-lead-user.svg`
- `assets/icon-live-dot.svg`
- `assets/icon-orchestrate.svg`
- `assets/icon-scale.svg`
- `assets/icon-sparkle-badge.svg`
- `assets/icon-sparkle.svg`
- `assets/icon-star-filled.svg`
- `assets/icon-workflow-nodes.svg`
- `assets/logo-mark.svg`
- `design-package-output/QA_REPORT.md`
- `mr6rn2nf-image.png`
- `mr6rn811-image.png`
- `uploads/design-package/ANIMATION_ASSET_MANIFEST.md`
- `uploads/design-package/ASSET_EXPORT_RULES.md`
- `uploads/design-package/ASSET_MANIFEST.md`
- `uploads/design-package/ASSET_PROMPTS.md`
- `uploads/design-package/BANNED_PATTERNS.md`
- `uploads/design-package/CLAUDE_CODE_STATIC_PROMPT.md`
- `uploads/design-package/CODE_MAPPING.md`
- `uploads/design-package/COMPONENT_INVENTORY.md`
- `uploads/design-package/CSS_MOTION_TOKENS.md`
- `uploads/design-package/DESIGN.md`
- `uploads/design-package/DO_NOT_CHANGE.md`
- `uploads/design-package/FINAL_FOLDER_STRUCTURE.md`
- `uploads/design-package/FUNCTIONAL_SPEC.md`
- `uploads/design-package/LAYOUT_SPEC.md`
- `uploads/design-package/MOTION_SPEC.md`
- `uploads/design-package/OPENDESIGN_OR_CLAUDE_DESIGN_PROMPT.md`
- `uploads/design-package/RESPONSIVE_SPEC.md`
- `uploads/design-package/STATE_SPEC.md`
- `uploads/design-package/SVG_ANIMATION_SPEC.md`
- `uploads/design-package/TOKENS.md`
- `uploads/Futuristic tech interface with glowing panels.png`
- `uploads/image-gen-2(63).png`
- `uploads/pasted-1783168205907-0.png`
- `uploads/pasted-1783172153534-0.png`
- `uploads/README.md`
- `uploads/reference/desktop.png`
- `uploads/screencapture-codeoutfitters-pages-dev-2026-07-04-00_12_30.jpg`

## Coding checklist for AI tools
1. Inspect `CodeOutfitters Homepage v2.dc.html` and `DESIGN-MANIFEST.json` first and identify reusable components before coding.
2. Implement each user-facing screen file as its own route/surface; keep launcher, landing, app, platform, and OS widget files separate.
3. Extract design tokens into the target stack: colors, type scale, spacing, radius, shadows, and motion.
4. Implement layout with real 2025–2026 responsive breakpoints, fluid type/spacing, and container-query-aware component behavior; test with no horizontal overflow.
5. Preserve interactive controls, hover/focus/pressed states, form behavior, validation, and copy actions where present.
6. Implement domain-specific in-app modules with real states; do not flatten them into generic cards.
7. Keep landing page, product screens, and OS widget/quick-access surfaces separate when present.
8. Confirm the production result visually matches the exported design before refactoring internals.
9. Reject implementation shortcuts that flatten the design into generic cards, generic gradients, placeholder stats, or framework-default typography.
10. If a detail is ambiguous, keep the exported HTML/CSS/JS behavior rather than inventing a new pattern.
