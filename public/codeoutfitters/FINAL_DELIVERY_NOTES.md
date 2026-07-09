# CodeOutfitters Multi-Page Site — Final Delivery Notes

- Delivery type: standalone .dc.html multipage export
- Real React/Tailwind/shadcn app: no
- Real /components/ui installation: no
- 21st.dev-inspired standalone implementation: yes

## Pages included
- Homepage — CodeOutfitters Homepage v7.dc.html
- Services — CodeOutfitters Services.dc.html
- Case Studies — CodeOutfitters Case Studies.dc.html
- Contact — CodeOutfitters Contact.dc.html

## Runtime dependency
- support.js uses unpkg: yes (React 18.3.1, ReactDOM, Babel standalone)
- offline-ready: no — requires an internet connection on first load

## Known limitations
- Contact form is local UI only (shows a confirmation state on submit) — not connected to a backend or email service. Wire it to a form endpoint or email service before relying on it to actually receive leads.
- Runtime is online-dependent while support.js loads its dependencies from unpkg.

## How to open
Keep all four .dc.html files, support.js, and assets/ together in one folder. Open any .dc.html directly in a browser — all nav/footer links between pages use relative filenames and work offline-of-server (just not offline-of-internet, per above).
