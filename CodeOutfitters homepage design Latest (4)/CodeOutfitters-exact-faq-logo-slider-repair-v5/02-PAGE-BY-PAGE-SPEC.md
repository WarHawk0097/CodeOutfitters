# 02 — Page-by-Page Spec

Each page below: exact section order, copy source, and the component it maps to (cross-reference `01-FRONTEND-IMPLEMENTATION-MAP.md` for the full table). All copy is taken verbatim from the approved `.dc.html` files in `/design-preview/` — Claude Code should not rewrite copy.

## `/` — Homepage
1. Announcement bar — "Free workflow audit with every discovery call this July." + "Book yours →" link to `#cta`.
2. Nav — logo "CodeOutfitters", links to Services/Industries/Process/Case Studies/About, "Book a Call" CTA.
3. Hero — eyebrow "AI Automation Agency"; H1 "We automate the work you shouldn't be doing"; subhead "AI-powered automations for US small businesses — built in 7 days, zero coding required on your end."; primary CTA "Get a Custom Quote", secondary "Book a Free Call"; trust row "No long contracts / Results in 7 days / 30-day support"; right side: tabbed live console mock (WhatsApp/Email/Support tabs) showing an animated task list with "hrs saved" counter and a "Built in 7 days" floating badge.
4. Services preview — bento grid pulling from `data/services.ts` (subset), each card with icon, name, description, tag chips, metric strip, "Get this system" link.
5. ROI / manual-labor-cost calculator — slider-driven panel: user inputs current manual hours/volume, right panel shows a computed "time currently spent" style result (never a service price).
6. Process preview — first 3–4 steps of the process timeline with a "See full process" link to `/process`.
7. Case studies / proof preview — 2–3 case study bento cards linking to `/case-studies`.
8. Testimonials — counter-scrolling marquee of the 3 illustrative testimonials.
9. FAQ — accordion, homepage-relevant subset of FAQs.
10. Final CTA — "Book a Discovery Call" panel with chip row (Free audit included / No long contracts / 30-day support) and action card ("What you get in 30 minutes" checklist + CTA button + "3 build slots left for July" live-dot indicator).
11. Footer — logo blurb, Services links (anchor to `/services#id`), Company links (all 8 routes), copyright + "All systems operational" status dot.

## `/services`
1. Nav (Services active).
2. Hero — eyebrow "Every system we build"; H1 "Six automations. One outcome: your time back."; subhead about 7-day delivery + 30-day support; ⌘K command search over services.
3. Services bento grid — all 6 `ServiceItem`s (WhatsApp Lead Automation, Email Workflow Automation, Support Chat Systems, Booking & Scheduling Bots, Invoice & Order Automation, Custom Integration Builds), each expandable to a numbered "How it works" list, each with a metric + "Get this system" link.
4. Integrations — "Built on the tools you already run." + two-row counter-scrolling tool marquee + "Don't see your stack? … ask us" note.
5. FAQ — 5 services-specific questions (pricing/which-to-start/tool-compatibility/7-day meaning/post-support).
6. Final CTA — "Book a Discovery Call", copy anchored to "which system fits."
7. Footer.

## `/industries`
1. Nav (Industries active).
2. Hero — eyebrow "Who we build for"; H1 "Automation that fits how your industry actually works."
3. Industry bento grid — all 7 `IndustryItem`s (Home Services/HVAC, Healthcare Clinics/Med-Spas, Real Estate, E-commerce/Retail, Professional Services, Education/Training, Local Service Businesses), each with problems paragraph, "what we automate" chips, and tools-we-connect-to line, plus a "Talk about {industry} automation" link.
4. Common needs strip — 4 cards: Lead intake, Scheduling, Follow-up, Back office.
5. Example workflows — 3 numbered-step workflow cards (Home Services, Real Estate, E-commerce).
6. Proof stats strip — 7 industries served / 120+ systems shipped / 7 days typical build / 30 days support.
7. FAQ — 4 industries-specific questions.
8. Final CTA — "We probably still fit anyway."
9. Footer.

## `/process`
1. Nav (Process active).
2. Hero — eyebrow "How it works"; H1 "No generic packages. Every build is scoped."; 3 trust chips (Fixed quote after discovery / Transparent proposal / No pressure to commit).
3. 7-step timeline — Discovery Call → Workflow Audit → Fixed-Scope Proposal → Build Phase → Testing & Handoff → (30-Day Support / Live & Supported), center-spine with scroll-fill progress.
4. Why no packages — statement + 3 principle cards (Custom quote after discovery / Fixed scope after audit / No pressure to commit).
5. FAQ — 5 process-specific questions (why no pricing page / discovery length / when cost is known / no-obligation / support scope).
6. Final CTA — "Book Your Discovery Call."
7. Footer.

## `/about`
1. Nav (About active).
2. Hero — eyebrow "The studio"; H1 "An automation studio, not an agency of decks."
3. Mission — "Most small businesses run on manual work that was never meant to scale." paragraph.
4. What we believe — 4-card bento (Automation should disappear / Scope before code / Humans stay in the loop / Clear communication over jargon).
5. How we work — 4-card strip (You talk we listen / One point of contact / Documented handoff / Support after launch).
6. Quality & tool mindset — 2-col text feature (testing philosophy + stack-fit philosophy).
7. Trust cards — 3 cards (Fixed-scope proposals / Testing before launch / Direct communication).
8. Final CTA — "Let's Talk About Your Workflow."
9. Footer.

**No fake team photos or fake founder names anywhere on this page** — the studio is described institutionally ("CodeOutfitters"), never as named individuals.

## `/security`
1. Nav (Security & Reliability — reachable via footer; add to primary nav only if the team wants it there, current design keeps it footer-only).
2. Hero — eyebrow "Security & reliability"; H1 "Built with a security-conscious mindset."
3. Access & secrets bento — Least-access setup (full-width) + Server-side secrets / Scoped account access (half-width each).
4. AI guardrails / testing — 2-col text feature (human review of sensitive actions / testing against real scenarios).
5. Reliability & handoff bento — Monitoring mindset / Documented handoff (half-width each) + Clear rollback plan (full-width).
6. Integrations — "Connected carefully, with scoped access." + two-row tool marquee.
7. FAQ — 5 questions, including the explicit "no formal certifications today" answer.
8. Final CTA — "Talk Through Your Security Needs" / "Start With a Workflow Audit."
9. Footer.

**Hard constraint:** never claim SOC 2, HIPAA, ISO, GDPR certification, official partnerships, guaranteed uptime, or "bank-level security." The FAQ answer is intentionally honest about having no formal certifications today.

## `/case-studies`
1. Nav (Case Studies active).
2. Hero — eyebrow "Sample work"; H1 "Real businesses. Real results."
3. Industry filter pills — All / Real Estate / E-commerce / Healthcare / Legal / Logistics / Home Services.
4. Case grid — 6 cards, each labeled "Sample project", each expandable to Problem/Build detail, each with a 3-metric band and "Get a similar system" link.
5. Testimonials carousel — 3 rotating illustrative quotes with dot navigation and an "Illustrative feedback…" disclosure line.
6. Final CTA — "Book a Discovery Call" with "Explore Services" / "See Our Process" links.
7. Footer.

**Hard constraint:** every case is illustrative/sample — no fake exact revenue claims beyond the stated illustrative metrics, no fake client logos.

## `/contact`
1. Nav (Contact — shown as a static badge rather than a link since you're already on the page).
2. Hero + form — left: eyebrow "Let's talk"; H1 "Tell us what's eating your team's time."; "What happens next" 3-step list; trust chips. Right: form card (Full name, Work email, Business name, "What are you looking to automate?" select, workflow textarea, submit button "Book Free Discovery Call"), success state (checkmark + "Message sent" + reset button).
3. Other ways to reach us — Email / WhatsApp / See our process pills.
4. Mini FAQ — 3 quick questions (response time / not-ready-to-buy / US-only).
5. Footer.

**Hard constraint:** do not claim a live email/calendar backend is wired up unless/until Claude Code actually implements one — the UI's success state is a frontend contract, not a promise of a working integration.
