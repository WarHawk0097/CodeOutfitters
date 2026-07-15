# Evidence Index

All captured 2026-07-14 against genuine production server `http://127.0.0.1:3999` (post content-fix rebuild), Chromium 149.0.7827.55 via Playwright 1.61.1. Full-page screenshots (`fullPage: true`).

| File | Environment | Route | Viewport | Mode | Proves | Does NOT prove |
|---|---|---|---|---|---|---|
| prod_home_desktop.png | production | / | 1440x1000 | normal | Homepage renders correctly, no overflow, at desktop width, post content-fix | Interaction states, scroll-triggered animation mid-state |
| prod_home_tablet.png | production | / | 820x1180 | normal | Same, tablet width | same |
| prod_home_mobile.png | production | / | 390x844 | normal | Same, mobile width | same |
| prod_services_desktop.png / _tablet.png / _mobile.png | production | /services | all 3 | normal | Services page renders at all widths, no overflow | Marquee motion (static frame only) |
| prod_industries_desktop.png / _tablet.png / _mobile.png | production | /industries | all 3 | normal | Renders at all widths | n/a |
| prod_process_desktop.png / _tablet.png / _mobile.png | production | /process | all 3 | normal | Renders at all widths | Scroll-driven fill progress (static frame) |
| prod_process_end.png | production | /process | 1440x1200 | normal, scrolled to bottom | Fill reaches scaleY=1 at bottom of scroll | n/a |
| prod_about_desktop.png / _tablet.png / _mobile.png | production | /about | all 3 | normal | Renders at all widths | n/a |
| prod_security_desktop.png / _tablet.png / _mobile.png | production | /security | all 3 | normal | Renders at all widths | n/a |
| prod_case-studies_desktop.png / _tablet.png / _mobile.png | production | /case-studies | all 3 | normal | Renders at all widths | n/a |
| prod_contact_desktop.png / _tablet.png / _mobile.png | production | /contact | all 3 | normal | Renders at all widths | n/a |
| prod_home_motion_full.png | production | / | default | ?motion=full | Full motion mode sets data-motion="full" | n/a |
| prod_home_motion_reduced.png | production | / | default | ?motion=reduced | Reduced motion mode sets data-motion="reduced", no content hidden | n/a |
| prod_home_motion_normal.png | production | / | default | no query (OS preference "no-preference") | Default mode resolves to data-motion="full" under no OS preference | Behavior under actual OS-level prefers-reduced-motion:reduce (context created with reducedMotion:'no-preference' for this capture) |
| raw-results.json | production | all | all | all | Full structured measurement data backing every report file in this directory's parent | n/a — this is raw data, not narrative |

## Coverage gaps (honest disclosure)

- Dev server (port 3005) was used only for tooling/regression confirmation (title match), not screenshotted per-route.
- Marquee screenshots not separately captured (transform values recorded numerically in CLAUDE-CODE-MARQUEE-MEASUREMENTS.json instead).
- `?motion=reduced` not captured for /services or /security specifically (only Homepage).
