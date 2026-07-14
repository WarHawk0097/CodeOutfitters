# CodeOutfitters Final UI Source Map

## Audit baseline

- Repository: `F:\CodeOutfitters`
- Branch: `main`
- Baseline commit: `46a8f2d chore: add truth and fidelity repair evidence files`
- Baseline worktree: approved-source folder untracked; no tracked modifications
- Requested source path: `F:\CodeOutfitters\# CodeOutfitters Project Audit`
- Actual source path on disk: `F:\CodeOutfitters\# CodeOutfitters Project Audit)`
- Exact approved package inside that folder: `CodeOutfitters-complete-motion-enhancement-v1`
- Authority: root `OPUS-ACTIVE-SOURCE-MANIFEST.md` and `SONNET-PROJECT-MAP.md` both identify the v1 package as the active source. Sibling v2/Opus/Claude packages are derivative motion audits, not the visual source of truth.

## Exact eight approved page files and active routes

| Route | Approved source page | Active native route |
|---|---|---|
| `/` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Homepage v8.dc.html` | `app/(public)/page.tsx` |
| `/services` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Services.dc.html` | `app/(public)/services/page.tsx` |
| `/industries` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Industries.dc.html` | `app/(public)/industries/page.tsx` |
| `/process` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Process.dc.html` | `app/(public)/process/page.tsx` |
| `/about` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters About.dc.html` | `app/(public)/about/page.tsx` + `about-page-client.tsx` |
| `/security` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Security Reliability.dc.html` | `app/(public)/security/page.tsx` + `security-page-client.tsx` |
| `/case-studies` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Case Studies.dc.html` | `app/(public)/case-studies/page.tsx` + `case-studies-page-client.tsx` |
| `/contact` | `CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Contact.dc.html` | `app/(public)/contact/page.tsx` + `contact-page-client.tsx` |

## Shared approved source

- `motion.js`: shared reference for page entrance, explicit reveal/stagger hooks, scroll-aware header, marquee pause, CTA press/shine, footer reveal, and reduced-motion behavior. It is reference material only; its generic DOM scanning, retries, and permanent observer must not be ported.
- `support.js`: generated DesignCode compiler/runtime. It is reference-only and must not ship as the production renderer.
- Shared CSS: no separate source stylesheet. Each approved page carries its CSS inline. Repeated tokens/classes include navigation, cream spotlight cards, CTA sweep, pills, timeline, calculator, FAQ, and responsive rules.
- Assets: `assets/` contains the logo mark, hero image, UI icons, shield art, and `assets/integrations/` official integration logos. Native copies live in `public/assets/`.

## Source-to-native component mapping

| Approved area | Native implementation |
|---|---|
| Shared header/mobile navigation | `components/navbar.tsx`, `lib/animations/useNavScroll.ts` |
| Shared footer | `components/footer.tsx` |
| Shared tokens, focus styles, keyframes, reduced-motion CSS | `app/globals.css` |
| Shared FAQ/accordion | `components/faq.tsx`, `components/ui/accordion.tsx`, `data/faqs.ts` |
| Shared CTA | `components/cta-banner.tsx` |
| Shared reveal/stagger behavior | `hooks/useScrollReveal.ts`, Framer Motion page integrations |
| Homepage hero + workflow demo | `components/hero.tsx`, `components/hero-workflow-visual.tsx` |
| Homepage representative metrics | `components/stats-strip.tsx` |
| Homepage official-logo marquee | `components/tools-marquee.tsx` |
| Homepage service bento/live demos | `components/services-bento.tsx` |
| Homepage process preview | `components/process-preview.tsx` |
| Homepage calculator | `components/roi-calculator.tsx`, `hooks/useCounter.ts` |
| Homepage sample work | `components/case-studies-preview.tsx` |
| Homepage featured/scrolling testimonials | `components/testimonials.tsx` |
| Services search/results/cards/expanders | `app/(public)/services/page.tsx` |
| Services integration marquee | `app/(public)/services/page.tsx` |
| Industries cards/problems/workflows | `app/(public)/industries/page.tsx`, `components/industries-grid.tsx` |
| Process six-stage scroll timeline | `app/(public)/process/page.tsx` |
| About mission/principles/trust/progression | `app/(public)/about/about-page-client.tsx` |
| Security controls/scoped access/logging/rollback/marquee | `app/(public)/security/security-page-client.tsx` |
| Case-study filters/expanders/testimonials | `app/(public)/case-studies/case-studies-page-client.tsx` |
| Contact form/direct email/next steps/FAQ | `app/(public)/contact/contact-page-client.tsx` |

## Behaviors that must be preserved

- Staged hero entrances; explicit section reveals and card staggers; card lift/spotlight; button press/shine; icon and link micro-motion; scroll-aware header; atmospheric hero/background motion; footer reveal.
- Homepage workflow tabs and status/message transitions, calculator slider math/output transitions, testimonial rotation, FAQ, and seamless official-logo marquee with genuine pointer hover pause.
- Services repeatable search/filter/count behavior, expandable details with chevron rotation, integration marquee, and FAQ.
- Industries touch-safe cards with all important content available without hover.
- Process: one spine, one fill, exactly six unique accessible steps, scroll-linked progress, ordered marker activation, readable reduced mode.
- Case Studies repeatable filters, layout transitions, expandable stories, chevrons, and illustrative/sample labels.
- Contact validation and direct-email behavior with a visible no-backend disclosure and no false success state.
- Motion modes: OS preference by default, `?motion=full` override, and `?motion=reduced` immediate/static presentation while leaving controls functional.

## Native components retained

Retain the current native route structure, shared shell, design tokens, approved assets, hero/workflow implementation, bento sections, calculator math, process timeline, FAQs, filters, expanders, testimonials, contact disclosure, and official-logo marquee implementations where browser comparison confirms fidelity. They are explicit React/TypeScript integrations and do not depend on the standalone runtime.

## Native components requiring replacement or repair

- Replace the JSON-LD `dangerouslySetInnerHTML` use in `app/(public)/layout.tsx` with a React-rendered script text node to satisfy the absolute architecture constraint.
- Add a single native motion-mode resolver and wire explicit reveal/header/loop/timeline behavior to it; current code only checks the OS media query and therefore does not implement the two QA query overrides.
- Repair any marquee that uses emoji/text placeholders instead of the approved official SVG logos, or does not expose one original plus one aria-hidden duplicate sequence.
- Repair reduced-mode marquee markup so duplicate sequences are hidden and only one readable static set remains.
- Remove or quarantine unused legacy frontend components only if they affect required routes; unrelated admin, privacy, and terms functionality is outside this eight-route replacement scope.

## Implementation risks and missing inputs

- The actual audit-folder name has an extra trailing `)` and is untracked. Deployment must not accidentally include the large reference package.
- The approved pages are generated `.dc.html` files with inline CSS/template logic. They are reference material and cannot be copied into production because iframe, HTML parsing, `support.js`, and standalone route dependencies are forbidden.
- Approved source has no mobile menu, while the brief explicitly requires preserving the currently approved mobile structure. The existing native accessible drawer is retained as the least-invasive production behavior unless visual QA proves a conflicting approved reference.
- Approved Contact source implements a client-only success state, but the brief supersedes it: no success claim may appear without a verified backend.
- Source manifests identify no shared stylesheet. Exact values must be compared per page rather than inferred from one global CSS file.
- No source page is missing. The exact eight pages, `motion.js`, `support.js`, assets, and integration logos are present.
- The graph index is stale and contains only a few unrelated files, so route/component inspection uses the active source manifests plus targeted native-file reads.

## Obsolete public routes

No App Router folders exist for `/pricing`, `/book`, or `/portfolio`. They must remain absent and return 404 in local and production verification.
