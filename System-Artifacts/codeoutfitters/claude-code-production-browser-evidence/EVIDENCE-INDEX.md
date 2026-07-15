# Production Evidence Index

Production URL: `https://codeoutfitters.vercel.app`
Final commit: `51bcd9c0dc2131c81cd3910ca3e42b3eb2faed35` (short `51bcd9c`)
Vercel deployment ID: `dpl_EuvatyVGCMrgC4dJKJqjcjADMHXm`
Capture date: 2026-07-15
Browser: Chromium 149.0.7827.55 via Playwright 1.61.1 (real browser, headless)
Cache-busting: all URLs carry `?verify=51bcd9c` (or `&verify=51bcd9c`) to force non-CDN-cached response.
Raw structured data backing every row below: `raw-results.json`.

| File | Route | Viewport | Motion | Proves | Does NOT prove |
|---|---|---|---|---|---|
| prod_home_desktop.png | / | 1440x1000 | normal | Homepage renders on production at exact pushed commit, no overflow | Interaction states |
| prod_home_tablet.png | / | 820x1180 | normal | Same, tablet | same |
| prod_home_mobile.png | / | 390x844 | normal | Same, mobile | same |
| prod_services_desktop/tablet/mobile.png | /services | all 3 | normal | Renders, no overflow, all widths | Marquee motion (static frame) |
| prod_industries_desktop/tablet/mobile.png | /industries | all 3 | normal | Renders, no overflow | n/a |
| prod_process_desktop/tablet/mobile.png | /process | all 3 | normal | Renders, no overflow | Scroll-driven fill progress (static frame) |
| prod_process_start.png | /process | 1440x1200 | normal, scrollY=0 | atTop sample: transform scaleY≈0.1697, 1/6 markers active — start state genuinely low | n/a |
| prod_process_top.png | /process | 1440x1200 | normal, scrollY=1798 | atEnd sample: transform scaleY≈0.9934, 6/6 markers active | n/a |
| prod_about_desktop/tablet/mobile.png | /about | all 3 | normal | Renders, no overflow | n/a |
| prod_security_desktop/tablet/mobile.png | /security | all 3 | normal | Renders, no overflow | Marquee motion (static frame) |
| prod_case-studies_desktop/tablet/mobile.png | /case-studies | all 3 | normal | Renders, no overflow | n/a |
| prod_contact_desktop/tablet/mobile.png | /contact | all 3 | normal | Renders, no overflow | Form submission/validation states |
| prod_home_acceptance_desktop/tablet/mobile.png | / | all 3 | normal | Full Homepage acceptance content capture per viewport, backs 16/17 required-string table + 7/7 forbidden-string absence | n/a |
| prod_home_motion_full.png | / | default | ?motion=full | `data-motion="full"` forced under emulated reduced-motion | n/a |
| prod_home_motion_reduced.png | / | default | ?motion=reduced | `data-motion="reduced"`, 0 permanently-hidden elements | n/a |
| prod_home_motion_normal.png | / | default | no query | Default resolves per OS/no-preference | n/a |
| prod_obsolete_pricing.png | /pricing | default | normal | HTTP 404, genuine Next.js not-found render | n/a |
| prod_obsolete_book.png | /book | default | normal | HTTP 404, genuine Next.js not-found render | n/a |
| prod_obsolete_portfolio.png | /portfolio | default | normal | HTTP 404, genuine Next.js not-found render | n/a |
| raw-results.json | all | all | all | Full structured measurement data backing every report file in parent directory (27 checks, homepage acceptance, 3 marquees, process gate, 3 obsolete routes) | n/a — raw data, not narrative |

## Interaction evidence (2026-07-15, follow-up production interaction QA)

Captured against `51bcd9c` (initial sweep) unless noted; repair-verification shots captured against `2508a99` (post-fix deployment).

| File | Proves | Commit |
|---|---|---|
| interaction-results.json | Full structured interaction test data (101 checks) backing CLAUDE-CODE-PRODUCTION-INTERACTION-QA.md | 51bcd9c |
| prod_interact_home_tab_whatsapp/email/support.png | Hero tab switching renders correct active state per tab | 51bcd9c |
| prod_interact_home_calc_result.png | ROI calculator output updates on valid input | 51bcd9c |
| prod_interact_home_faq_expanded.png | Homepage FAQ accordion expands | 51bcd9c |
| prod_interact_home_announcement_dismissed.png | Announcement bar dismiss works, non-blocking | 51bcd9c |
| prod_interact_services_search_active.png | Services search filters results | 51bcd9c |
| prod_interact_services_filter_active.png | Services filter pill applies | 51bcd9c |
| prod_interact_services_card_expanded.png | Services "how it works" card expands | 51bcd9c |
| prod_interact_process_faq_expanded.png | Process FAQ expands | 51bcd9c |
| prod_interact_case_studies_all.png / _filtered.png | Case Studies filter pills change visible card set | 51bcd9c |
| prod_interact_case_study_expanded.png | Case study "read full story" expands | 51bcd9c |
| prod_interact_contact_validation_errors.png | Contact form shows native validation errors on invalid submit | 51bcd9c |
| prod_interact_contact_backend_unavailable.png | Contact form shows honest no-backend notice, no fake success | 51bcd9c |
| prod_interact_mobile_nav_open.png | (Historical — captured before mobile-menu defect was found/fixed; superseded by prod_repair_mobile_nav_open.png) | 51bcd9c |
| prod_interact_mobile_nav_tablet_820.png | Tablet-width nav state before repair | 51bcd9c |
| prod_interact_reduced_motion_home/services/mobile.png | Interactions remain functional under `?motion=reduced` | 51bcd9c |
| prod_repair_home_tabs.png | Post-repair: hero tabs carry `role="tablist"`/`role="tab"`/`aria-selected`/`aria-controls`, confirmed functional on `2508a99` | 2508a99 |
| prod_repair_mobile_nav_open.png | Post-repair: mobile hamburger menu opens, shows all 6 route links, no obsolete routes, confirmed on `2508a99` | 2508a99 |

## Coverage gaps (honest disclosure)

- No separate "process middle" screenshot captured under new file naming (atMiddle sample exists only in `raw-results.json`, scrollY=778, scaleY≈0.5247, 3/6 markers — not screenshotted).
- Marquee moving/paused/resumed states recorded numerically in `raw-results.json` (transform matrices at t0/t2/t4/hoverStart/hover+2/resumed) for all 3 marquees, not as screenshots.
- Reduced-motion marquee state (static, duplicate hidden) recorded numerically per marquee in `raw-results.json`, not screenshotted.
- Reduced-motion mode not separately re-tested for the 3 repaired components (mobile menu, hero tabs, FAQ aria-controls) post-fix — these are instant-toggle interactions with no identified motion dependency, but this was not explicitly re-verified under `?motion=reduced` after the repair.
- Full keyboard-only traversal of every route not executed; only representative controls tested (tabs, FAQ, mobile menu, contact form).
