# Claude Code Implementation Notes — CodeOutfitters Website

These are design-intent notes for a future Next.js/Tailwind implementation. **This package contains no React/Next code** — it is a standalone HTML design reference.

## Source of truth
The 8 `.dc.html` files in this folder. All styling is inline or in each file's `<style>` block; read them for exact values.

## Design tokens
- Colors: ink `#0A120E`, deep emerald `#0E2A1D` / `#10301F`, brand green `#17A063`, bright green `#2BD483`, link green `#128A54`, gold `#D9B36A` (hover `#E7C57E`), paper `#F7F2EA`, card cream `#FBF7EE→#F6F1E4` gradient, dark band `#0E241A`, footer `#070D0A`
- Type: Space Grotesk 500–700 (headings/numbers), Instrument Sans 400–700 (body/UI)
- Easing: `cubic-bezier(.16,1,.3,1)` (premium), `(.34,1.56,.64,1)` (spring)
- Radii: cards 20–22px, buttons 10–13px, pills 999px

## Component inventory (map to /components/ui when implementing)
- **BentoGrid**: 12-col grid, card spans 7/5 alternating; collapse to 1 col ≤820px
- **SpotCard**: cream gradient card with cursor-tracking radial glow (`--sx/--sy` CSS vars set on mousemove) + hover lift
- **ProcessTimeline**: center 4px spine, gradient progress fill animated on mount, alternating left/right cards; left-rail layout ≤760px
- **FaqAccordion**: state-driven open item, max-height transition, rotating chevron badge
- **IntegrationsMarquee**: two counter-scrolling rows of tool chips (`translate3d` 0→-50%, duplicated list), edge fade overlays
- **AnimatedTestimonials**: absolute-stacked slides, opacity+translateY crossfade, 5.2s auto-advance, clickable dots (reset timer on pick)
- **BackgroundGradientAnimation**: oversized absolutely-positioned radial-gradient layer, 16s ease-in-out drift; heroes only
- **BookACallButton**: gold gradient CTA with skewed shine sweep on hover (`.cta-sweep`); nav variant dark emerald → green hover
- **CommandPalette** (Services): ⌘K-focusable search filtering services, dropdown results
- **CaseFilter** (Case Studies): pill filter by industry, client-side filtering
- **ContactForm**: controlled fields + success state; wire to real backend on implementation

## Hard constraints (do not violate when implementing)
- No pricing page/table/tiers/"per month" anywhere — pricing copy is always "custom quote after discovery / fixed scope after audit"
- No SOC 2 / HIPAA / ISO / uptime-guarantee claims — Security page copy is intentionally honest
- Case studies + testimonials are samples; keep the "Sample project" / "Illustrative feedback" labels unless real data replaces them
- All 8 pages cross-link; no dead anchors, no Privacy/Terms/Blog/Careers placeholders

## Suggested npm deps when porting
framer-motion (reveals, testimonials), @radix-ui/react-accordion (FAQ), lucide-react (icons — currently local SVGs in assets/)
