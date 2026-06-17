# QA Checklist

Manual QA procedures. Visual regression and automated smoke tests are future work — see `docs/ROADMAP.md` and "Playwright MCP candidate workflow" below.

## Manual QA — full pass

Run through this list before any release. Use a clean browser profile to avoid stale `localStorage` masking bugs.

### Visual QA — public site

- [ ] Home page renders the hero, tools strip, services preview, process, ROI calculator, portfolio, CTA banner.
- [ ] ROI calculator sliders update the three stat cards in real time.
- [ ] Services preview shows 3 services and a "View All Services" link to `/services`.
- [ ] `/services` shows all 6 services.
- [ ] `/pricing` shows the quote form. No published prices anywhere on the page.
- [ ] `/portfolio` shows 3 cards. Each card has a "Sample Project" badge. **Known copy contradiction** with the page metadata description "Real case studies" — see `docs/ROADMAP.md` R-4.3.
- [ ] `/about` shows the 4-step process and the 4 value cards.
- [ ] `/contact` shows the contact form.
- [ ] `/book` shows the 3-step calendar. Step 1: date picker with weekdays clickable. Step 2: time picker with 14 slots. Step 3: details form with honeypot.
- [ ] `/privacy` and `/terms` render without 404.
- [ ] Custom 404 page renders at any unknown URL.
- [ ] Cookie consent banner appears on first visit. Disappears after Accept or Decline.
- [ ] Announcement bar is dismissible. After dismissal, it stays dismissed for the session.
- [ ] Floating "Book Free Call" CTA appears after 400px of scroll on mobile only.
- [ ] Back-to-top button appears after 600px of scroll on desktop only.
- [ ] Smooth scroll works on long pages.
- [ ] All hover states are visible and feel intentional.
- [ ] The brand color palette is consistent: emerald `#2A6B5A`, gold `#C8A96E`, off-white `#FAFAF7`.

### Visual QA — responsive

Test at 375px (mobile), 768px (tablet), 1024px (small laptop), 1440px (desktop):

- [ ] Navbar collapses to a hamburger menu at < 768px.
- [ ] Hero text is readable and not clipped.
- [ ] ROI calculator sliders are usable on touch.
- [ ] Forms are usable on mobile. Inputs are tall enough (≥ 44px tap target).
- [ ] Booking calendar date grid fits without horizontal scroll.
- [ ] Footer columns stack on mobile, side-by-side on desktop.

### Booking QA

- [ ] Pick a date in the current month on a weekday. Step 2 shows 14 time slots.
- [ ] Pick a time. Step 3 shows the date/time summary, the details form, and a "Confirm Booking" button.
- [ ] Submit the form. If the webhook is configured, the success state shows. If not, the user sees a "Email hello@codeoutfitters.com" message.
- [ ] Check the Supabase `bookings` table. The new row should be present with the entered name, email, date, time, and `status = 'pending'`.
- [ ] Check the Supabase `available_slots` table. The matching `(date, time)` should now have `is_booked = true`.
- [ ] **Known bug:** the calendar does not refresh the slot list to mark the just-booked slot as unavailable. Reload to verify the flag was flipped. See `docs/ROADMAP.md` R-2.1.
- [ ] **Known bug:** the calendar does not call `getAvailableSlots`, so it does not block already-booked slots at the UI layer. Two simultaneous submissions can both succeed. Document but do not expect a fix in this release.

### Form webhook QA

For each of the four public forms, fill in valid data, submit, and verify:

- [ ] **Quote** — row appears in n8n with `source: "quote_request"`.
- [ ] **Contact** — row appears in n8n. (Note: the contact form does not currently send a `source` field. See `INTEGRATION_NOTES.md`.)
- [ ] **Booking** — row appears in n8n with `type: "booking"`. **And** a row appears in Supabase `bookings`.
- [ ] **Newsletter** — row appears in n8n with `source: "newsletter"`.

For each, also test:

- [ ] Submitting an empty required field shows an inline error.
- [ ] Submitting an invalid email shows an inline error.
- [ ] Filling the honeypot field silently succeeds (bot protection).

### Admin QA

- [ ] `/admin` shows the password gate on first visit.
- [ ] Wrong password shows "Wrong password" inline.
- [ ] Correct password unlocks the dashboard and writes to `localStorage`.
- [ ] Reloading `/admin` while the gate is unlocked skips the password input.
- [ ] "Logout" clears `localStorage` and returns to the gate.
- [ ] `/admin/onboarding` shows the 5 sections, with the section indicator at the top.
- [ ] Forward navigation validates the current section. Backward navigation is always allowed.
- [ ] "Save Draft" persists the form to `localStorage.co_onboarding_data`.
- [ ] "Save & Build Proposal" persists the form and redirects to `/admin/proposal`.
- [ ] If you visit `/admin/proposal` without an intake, you see "No Intake Data Found" and a link back.
- [ ] With an intake, "Generate Proposal" calls Anthropic. The result renders 11 sections.
- [ ] "Regenerate" calls Anthropic again and replaces the proposal.
- [ ] "Copy All" copies the full text to the clipboard.
- [ ] "Print / PDF" opens the browser print dialog with a print-friendly layout.
- [ ] "Send to Client" opens the user's mail client with a pre-filled subject and body.
- [ ] The "Tayyab's Internal Notes" panel is visible in the admin view and hidden when printing.

### Security smoke

- [ ] View page source on `/admin` and confirm `NEXT_PUBLIC_ADMIN_PASSWORD` value is visible. (Expected. This is the documented R-001.)
- [ ] Same for `NEXT_PUBLIC_ANTHROPIC_API_KEY`. (Expected. This is the documented R-002.)
- [ ] Confirm the production CSP in `public/_headers` is in effect on the deployed site (check the response headers).
- [ ] Confirm `robots.txt` disallows `/admin`.

## Visual regression — Playwright MCP candidate workflow (NOT APPROVED)

If and only if TS0 / RDG0 approval is granted for Playwright MCP and Chrome DevTools MCP, the proposed workflow is:

1. Capture baseline screenshots at 375 / 768 / 1024 / 1440 for: home, services, pricing, portfolio, about, contact, book (each step), admin gate, admin onboarding (each section), admin proposal.
2. On every PR, run the same capture diff. Block on visual change > 1% pixel delta for any viewport.
3. On every PR, run a smoke flow: load home → click "Get a Custom Quote" → fill quote form → submit → expect success state.
4. On every PR, run an admin flow: load `/admin` → fill password → complete intake form → click Generate → expect 11 sections.
5. Diff screenshots get reviewed by a human before merge.

This workflow is **not installed**, **not approved**, and **not part of DOC-MEMORY-REPAIR**. It is documented here so the future tooling-approval phase has a concrete proposal to evaluate.

## Motion and design-taste QA — UIX0 / MOTION0 (NOT APPROVED)

The owner has stated a premium motion direction (D-011) and a design-taste standard (D-012), both targeting a non-AI-slop, agency-grade feel inspired by `befluence.pro` (reference only, no copy). The full visual review loop is **not approved and not installed**. When it is eventually approved, the proposed manual checklist is:

### Motion QA (public site)

- [ ] Hero entrance plays on first load, not on every navigation.
- [ ] Headline reveal completes within ~600-1000ms and does not block scroll.
- [ ] Scroll-triggered reveals fire on `top 80%`-ish thresholds, not on every pixel.
- [ ] Parallax layers are GPU-accelerated (transform-only) and do not cause layout shift (CLS = 0).
- [ ] Service cards animate on scroll, not on hover only.
- [ ] Marquee strips are smooth at 60fps on mobile, do not jank on scroll.
- [ ] Statistics counters animate from 0 to value on view, ease-out.
- [ ] Magnetic / hover buttons have a small radius, do not feel "wobbly."
- [ ] Page transitions complete within ~300ms; do not delay LCP.
- [ ] Portfolio cards have motion depth (subtle 3D or layered translate), not just shadow changes.
- [ ] Process timeline animates step by step as the user scrolls.
- [ ] ROI calculator sliders feel tactile (no jitter, no lag).
- [ ] Form transitions are minimal: focus, error, success. No decorative motion.

### Motion QA (admin)

- [ ] Admin motion is lighter than the public site. No parallax, no floating cards, no marquees.
- [ ] Page transitions are ≤ 200ms.
- [ ] Form sections do not have entrance animations that delay the user.

### Performance rules (must hold)

- [ ] LCP unchanged or improved after motion is added.
- [ ] CLS = 0 (no layout-shifting animations).
- [ ] INP stays in the "good" range on mid-tier mobile (Moto G Power class).
- [ ] Total JS bundle does not grow by more than the agreed budget per phase.
- [ ] `prefers-reduced-motion: reduce` disables non-essential motion. AOS scroll reveals, GSAP scroll triggers, framer-motion enter/exit, and the gradient canvas must all opt out.
- [ ] Animations do not run while the tab is in the background.

### Taste QA (Impeccable + Emil Kowalski rules)

- [ ] No generic purple/blue SaaS gradient. Brand palette is emerald + gold + warm off-white.
- [ ] Cards are not visually identical. Hierarchy and surface vary.
- [ ] Typography hierarchy is strong. Display, H1, H2, body, micro are distinguishable at a glance.
- [ ] No random icon-above-every-heading pattern. Icons appear only where they earn it.
- [ ] Every animation has a purpose. No decorative-only motion.
- [ ] Motion is fast. No "showy" easing curves that delay the user.
- [ ] The site feels operational, not decorative. A US small-business owner can use it without distraction.

This motion + taste checklist is the **target** for the UIX0 / MOTION0 phase. It is **not** used in DOC-MEMORY-REPAIR, PM1, D0, or A0. It is gated behind ChatGPT Control Room approval and any required tooling approval (R-3.1).

## What this checklist does not cover

- Performance / Lighthouse scores. See future benchmarking work.
- Accessibility audit (WCAG 2.1 AA). See future work.
- Cross-browser matrix beyond the latest two versions of Chrome, Firefox, Safari, and Edge.
- Mobile device testing on real hardware. BrowserStack or similar is a future tooling decision.
- Browser-based visual review loop (Playwright MCP / Chrome DevTools MCP) — not approved, not installed.
