# 07 — Claude Code Build Prompt

Copy everything below this line into Claude Code as the build instruction.

---

You are implementing the CodeOutfitters marketing website as a native Next.js (App Router) + Tailwind CSS + TypeScript + shadcn-style codebase, using the frontend-ready spec package in `CodeOutfitters-frontend-ready-21st-implementation/`.

Read, in this order, before writing any code:
1. `01-FRONTEND-IMPLEMENTATION-MAP.md` — the section-by-section component map for all 8 pages.
2. `02-PAGE-BY-PAGE-SPEC.md` — exact section order and copy per page.
3. `03-COMPONENT-BLUEPRINTS.md` — exact file structure, props, states, and motion per component.
4. `04-DATA-MODELS.md` — exact TypeScript interfaces and real sample data to seed `data/*.ts`.
5. `05-INTERACTION-MOTION-SPEC.md` — exact animation timings/easings.
6. `06-RESPONSIVE-QA-SPEC.md` — breakpoints and the QA checklist you must pass before calling any page done.
7. `design-preview/*.dc.html` — these are **HTML design references**, not code to copy-paste. They show exact layout, spacing, color, and copy. Recreate their look and behavior in real React components using this codebase's conventions — do not literally serialize the HTML into JSX.

## Hard rules

- Implement native Next.js App Router pages and real Tailwind/shadcn-style components. Do not use `.dc.html` injection, iframes, or any non-native rendering of the design files — they are reference only.
- Do not reuse old/mismatched components from any previous implementation attempt in this codebase. If a `components/` directory already exists with components that don't match `03-COMPONENT-BLUEPRINTS.md`, replace them — do not patch around stale ones.
- Do not implement, reference, or leave scaffolding for a pricing page, pricing table, plan cards, or any `/pricing` route. The only allowed pricing language anywhere on the site is: "custom quote after discovery", "fixed scope after audit", "clear proposal", "timeline after discovery", and the homepage manual-labor-cost calculator (which computes the customer's own time cost, never a service price).
- The final site has exactly 8 public pages: `/`, `/services`, `/industries`, `/process`, `/about`, `/security`, `/case-studies`, `/contact`. No `/blog`, no `/careers`, no `/privacy`, no `/terms`, no `href="#"` placeholders.
- Never claim SOC 2, HIPAA, ISO, or GDPR certification, an official partnership, guaranteed uptime, or "bank-level security" anywhere in copy or metadata.
- All case studies and testimonials are illustrative/sample data — keep the "Sample project" and "Illustrative feedback" labels in the UI exactly as specified.

## Required workflow — one page first

Because a previous implementation attempt reused old components and produced a bad result, you must follow this sequence exactly and **stop for approval after step 1**:

1. Convert `/services` only, using `03-COMPONENT-BLUEPRINTS.md` and the Services rows of `01-FRONTEND-IMPLEMENTATION-MAP.md` exactly.
2. Compare your `/services` build against `design-preview/02-Services.dc.html` and this spec — check every acceptance criterion listed for Services in `01-FRONTEND-IMPLEMENTATION-MAP.md` and every relevant row of `06-RESPONSIVE-QA-SPEC.md`.
3. Run the build (`next build` or equivalent) and confirm it's clean.
4. Provide screenshots (desktop + mobile widths) and a short proof-notes summary: which acceptance criteria pass, and any deviations with justification.
5. **Stop.** Do not continue to any other page until the team explicitly approves the `/services` implementation.
6. Only after approval, continue with the remaining 7 pages in this order: `/`, `/industries`, `/process`, `/about`, `/security`, `/case-studies`, `/contact` — applying the same build → compare → screenshot → proof-notes discipline per page.

The approval gate for step 1 is: **`CODEOUTFITTERS_SERVICES_NATIVE_REACT_PARITY0`**

Do not proceed past this gate without explicit sign-off, even if the rest of the spec is fully read and understood.
