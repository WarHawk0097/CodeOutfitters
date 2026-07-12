# CodeOutfitters — Complete Website Delivery Notes

**Delivery type:** standalone `.dc.html` multipage website (opens directly in a browser)
**Real React/Tailwind/shadcn app:** no
**Real 21st.dev components installed:** no
**21st.dev-inspired standalone implementation:** yes (bento grids, spotlight cards, accordion FAQs, command-palette search, timeline/process cards, filter pills, expandable stories)

**Pricing page included:** no
**Pricing tables/plans included:** no
**Dead nav/footer links:** no (Privacy Policy / Terms of Service removed — no pages exist for them)

## Pages included
- Homepage (`CodeOutfitters Homepage v7.dc.html`)
- Services (`CodeOutfitters Services.dc.html`)
- Industries (`CodeOutfitters Industries.dc.html`)
- Process / How It Works (`CodeOutfitters Process.dc.html`)
- Security & Reliability (`CodeOutfitters Security Reliability.dc.html`)
- Case Studies (`CodeOutfitters Case Studies.dc.html`)
- About / Studio (`CodeOutfitters About.dc.html`)
- Contact / Book a Discovery Call (`CodeOutfitters Contact.dc.html`)

## Navigation
Main nav on every page: Services · Industries · Process · Case Studies · About, plus a "Book a Call" button to Contact. Security & Reliability is linked from the footer on every page (and from Process/About/Contact context) rather than crowding the main nav, per the approved plan. No nav or footer link points to a homepage-only section anchor — every item opens a real, dedicated page.

## Runtime honesty
- `support.js` uses unpkg: **yes** — it loads React, ReactDOM, and Babel Standalone from `unpkg.com` at runtime (with SRI hashes), plus each page loads Google Fonts from `fonts.googleapis.com`.
- Runtime self-contained / offline-ready: **no**. These pages require an internet connection on first load to fetch React/ReactDOM/Babel and fonts; nothing is bundled locally. This matches how the rest of this project was already built — not something this expansion introduced.

## Known limitations
- The Contact page form is local UI only (no real email/calendar integration is wired up).
- The ROI/savings calculator on the Homepage estimates the customer's own cost of manual work — it is not a price for CodeOutfitters services.
