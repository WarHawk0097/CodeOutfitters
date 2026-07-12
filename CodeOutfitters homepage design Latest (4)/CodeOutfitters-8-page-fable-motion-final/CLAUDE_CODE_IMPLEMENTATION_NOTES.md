# Notes for Claude Code — Next.js Integration

This is a standalone `.dc.html` handoff package produced in Claude Design. Claude Code must integrate these files into the real Next.js repo (`F:\CodeOutfitters`) — nothing here has been deployed or pushed.

## Future route mapping
- `CodeOutfitters Homepage v8.dc.html` -> `/`
- `CodeOutfitters Services.dc.html` -> `/services`
- `CodeOutfitters Industries.dc.html` -> `/industries`
- `CodeOutfitters Process.dc.html` -> `/process`
- `CodeOutfitters About.dc.html` -> `/about`
- `CodeOutfitters Security Reliability.dc.html` -> `/security`
- `CodeOutfitters Case Studies.dc.html` -> `/case-studies`
- `CodeOutfitters Contact.dc.html` -> `/contact`

## Required follow-up work in the real repo
- Replace the standalone `.dc.html` cross-links (`CodeOutfitters%20Services.dc.html`, etc.) with the clean routes above.
- `motion.js` is a new shared runtime file (scroll-reveal motion system + reduced-motion safety) loaded by every page — deploy it next to the pages. It degrades gracefully if missing (content stays visible).
- `support.js` is a runtime dependency every page's `<script>` relies on — verify it loads correctly once served from `public/codeoutfitters/` (or wherever it lands), and check it doesn't pull in `unpkg`/any other external CDN before calling this offline-ready.
- Contact form is local UI only — it does not send email or save leads. Do not claim a real backend until `/api/contact` (or equivalent) exists and is wired up.
- Do not add Google Calendar integration as part of this gate.
- Do not claim production deployment from this package — deployment must happen from the real repo via git/Vercel.
- Do not add a Pricing page, Blog, Careers, or Privacy/Terms pages unless real pages are created for them.
