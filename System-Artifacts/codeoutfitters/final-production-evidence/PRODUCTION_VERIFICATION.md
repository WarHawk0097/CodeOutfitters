# CodeOutfitters production verification

- Result: PASS
- Production URL: `https://codeoutfitters.vercel.app`
- Deployment URL: `https://codeoutfitters-pgrbqpfhz-warhawk0097s-projects.vercel.app`
- Deployment ID: `dpl_17yS3ZiSKH7xwTJtXHhJvVd1tbrf`
- Branch: `main`
- Commit: `fe43d8765edbf03854d6d79527fbccb19ab68b7a`
- Vercel state: `READY / PROMOTED`
- Production alias active: yes
- Deployment commit matches tested commit: yes

Fresh production screenshots cover all eight routes at 1440×1000, 820×1180, and 390×844 (24/24). Every route returned 200 with stable page height, visible reveal content under human-like scrolling, no overflow, no broken images, no console/page/hydration errors, and no stale content. All 24 reduced-motion checks reported zero running animations and zero hidden reveal elements.

Live focused interactions passed for Homepage workflow tabs, calculator and FAQ; Services search, clear and expansion; Industries, Process, Security and Contact FAQ open/close; Case Studies filtering and expansion; Contact required validation, honest no-backend preview and direct email; navigation and footer links.

Live marquee measurements passed using real pointer hover:

- Homepage: T0 `-27.8898`, T+2 `-64.2661`, T+4 `-100.642`; hover `-101.552 / -101.552`; resume `-103.067 / -139.445`.
- Services: T0 `-42.6541`, T+2 `-105.843`, T+4 `-169.036`; hover `-170.613 / -170.613`; resume `-173.773 / -236.963`.
- Security: T0 `-56.1801`, T+2 `-130.264`, T+4 `-204.347`; hover `-205.584 / -205.584`; resume `-209.906 / -283.990`.

Process has exactly one timeline, one spine, one fill, six unique steps, six markers, and six headings in production. `/pricing`, `/book`, and `/portfolio` return 404, and no inspected navigation/footer link targets them.
