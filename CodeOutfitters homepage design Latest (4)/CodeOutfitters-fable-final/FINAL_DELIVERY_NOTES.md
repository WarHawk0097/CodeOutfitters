# CodeOutfitters Multi-Page Site — Final Delivery Notes

- Final polish pass by Fable
- Delivery type: standalone .dc.html multipage export
- Real React/Tailwind/shadcn app: no
- Real /components/ui installation: no
- 21st.dev-inspired standalone implementation: yes
- support.js uses unpkg: yes (React 18.3.1, ReactDOM, Babel standalone)
- offline-ready: no — requires an internet connection on first load
- contact form: local UI confirmation only

## Pages included
- Homepage — CodeOutfitters Homepage v7.dc.html
- Services — CodeOutfitters Services.dc.html
- Case Studies — CodeOutfitters Case Studies.dc.html
- Contact — CodeOutfitters Contact.dc.html

## Polish pass changes (this delivery)
- FIXED: FAQ accordions on Homepage and Contact did not respond to clicks (template-structure issue in the expandable items). Both now open/close/switch correctly — verified by rendered interaction tests.
- Expandable panels (Services "how it works", Case Studies full stories, homepage + contact FAQs) given larger animated max-heights so wrapped text no longer clips at mobile widths.
- Services search palette: picking a result now closes the dropdown; Escape clears/dismisses the search.
- Case Studies: opening a full story no longer carries over to the wrong card when switching industry filters.
- Case Studies filter pills: added hover state for inactive pills.
- No layout, brand, or content changes; all existing interactions preserved.

## Known limitations
- Contact form is local UI only (shows a confirmation state on submit) — not connected to a backend or email service. Wire it to a form endpoint or email service before relying on it to actually receive leads.
- Runtime is online-dependent while support.js loads its dependencies from unpkg.

## How to open
Keep all four .dc.html files, support.js, and assets/ together in one folder. Open any .dc.html directly in a browser — all nav/footer links between pages use relative filenames and work without a server (an internet connection is still required, per above).
