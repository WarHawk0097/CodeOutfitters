# CodeOutfitters — 8-Page Website — Final Delivery Notes

**Final UI/UX and motion polish pass by Fable**
Delivery type: standalone `.dc.html` 8-page website
Real React/Tailwind/shadcn app: no
Real 21st.dev components installed: no
21st.dev-inspired standalone implementation: yes
Pricing page included: no
Pricing tables/plans included: no
Dead nav/footer links: no
Motion system included: yes (`motion.js` — shared scroll-reveal with stagger)
Reduced-motion support included: yes (`prefers-reduced-motion` disables all animation/transition durations site-wide)

## Pages included
- Homepage (`CodeOutfitters Homepage v8.dc.html`)
- Services (`CodeOutfitters Services.dc.html`)
- Industries (`CodeOutfitters Industries.dc.html`)
- Process / How It Works (`CodeOutfitters Process.dc.html`)
- About / Studio (`CodeOutfitters About.dc.html`)
- Security & Reliability (`CodeOutfitters Security Reliability.dc.html`)
- Case Studies (`CodeOutfitters Case Studies.dc.html`)
- Contact (`CodeOutfitters Contact.dc.html`)

## Runtime files (keep together with the pages)
- `support.js` — page runtime, required by every page
- `motion.js` — shared motion system (scroll reveals + reduced-motion safety). If it fails to load, all content remains fully visible — reveals simply don't run.
- `assets/` — icons, logo, hero image

## Motion system
- Section/heading/card fade-up reveals on scroll with sibling stagger (IntersectionObserver, transform+opacity only)
- Staggered card grids (services, industries, workflows, principles, security cards, trust cards, reach pills)
- Timeline step reveals + animated progress spine (Process)
- Smooth FAQ / expandable open-close (max-height + opacity, premium easing)
- Spotlight hover cards, CTA button lift + sweep, chevron pop
- Contact form success check-pop animation
- All reveals hand style control back after completing, so hover states stay intact
- `prefers-reduced-motion: reduce` collapses every animation/transition site-wide

## Honesty notes
- No pricing page, tables, tiers, or packages anywhere. Pricing-adjacent copy only explains the custom-quote-after-discovery model; the homepage calculator shows the customer's own labor cost.
- Security & Reliability page claims no certifications (no SOC 2 / HIPAA / ISO / GDPR / uptime guarantees). FAQ states plainly there are no formal certifications today.
- Contact form is local UI only — no email is sent, no leads are saved.

## Known limitations
- `support.js` loads React/ReactDOM (and Babel when needed) from unpkg — the runtime is NOT self-contained/offline-ready.
- Contact form remains local UI only unless a real backend is connected later in Next.js.
