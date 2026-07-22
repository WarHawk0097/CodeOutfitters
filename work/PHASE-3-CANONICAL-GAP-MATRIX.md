# PHASE 3 CANONICAL GAP MATRIX

Built for CODEOUTFITTERS_PHASE_3_CANONICAL_VISUAL_RECONSTRUCTION, before any implementation edit, per that task's mandatory-extraction gate.

> **STATUS — `SUPERSEDED_BY_SECTION_2` (2026-07-22, CODEOUTFITTERS_PHASE_3_CANONICAL_RECONSTRUCTION_AND_PAGINATION_COMPLETION Step 2).**
> PART A and PART B below are **retained verbatim as historical record** and are **not** the current authority. They carry unclassified claims ("Unverified", "Unknown", "likely", "CONFIRMED CORRECT") whose evidence basis was never recorded, which is exactly the defect this task exists to repair.
> The current authority is **[SECTION 2 — PROVENANCE-CLASSIFIED REGION MATRIX](#section-2--provenance-classified-region-matrix)** at the end of this file, where every material claim carries one of the six required provenance classifications and 23 recorded attributes per visible region of all six frames.
>
> **Further supersession (2026-07-22, `CODEOUTFITTERS_PHASE_3_LEADS_EXACT_STATE_REPAIR_WITH_BROWSER_VERIFICATION`).** For the three **Leads** frames the current authority is **SECTION 5 — LEADS EXACT-STATE REPAIR** at the end of this file. Section 5 wins over Sections 2-4 on any Leads region. Overview regions are unchanged and remain governed by Sections 2-4 and the project owner's PASS decision. Nothing was deleted or edited away.
> Nothing above has been deleted or edited away. Where Section 2 contradicts PART A/PART B, **Section 2 wins**.
>
> **Further supersession (2026-07-22, `CODEOUTFITTERS_PHASE_3_FINAL_FUNCTIONAL_DEFECT_REPAIR`).** **SECTION 7 — FINAL FUNCTIONAL DEFECT REPAIR** at the end of this file is the current authority for the four items it closes: the Service facet accessibility gap (which closes §6.4), the owner filter data model, the newly recorded error and zero-result states, and the deferred controls inside accepted frames. Section 7 wins over Sections 2-6 on those items only; every other region is unchanged. Nothing was deleted or edited away.

Source of truth: `F:\CodeOutfitters\Dashboard\Command Center Final.dc.html` (static, fully-authored HTML; `sc-for`/`{{ }}`/`sc-if` are executed client-side via a bundled runtime, `support.js`, which loads React 18.3.1/ReactDOM/Babel from unpkg at load and self-mounts — confirmed by direct read of `support.js` lines 1072-1837, `loadReactUmd().then(init)`. No templating placeholders will appear in a rendered capture, given network access to unpkg CDN and Google Fonts.)

Frame line numbers in the source file (1-indexed, this pass):
- C-D01 Overview desktop: lines 30-81 (`data-screen-label="C-D01 Overview"`, 1440×1000)
- C-D05 Leads desktop: lines 134-201 (`data-screen-label="C-D05 Leads"`, 1440×1000)
- T-01 Overview tablet: lines 846-883 (820×1180)
- T-02 Leads tablet: lines 885-912 (820×1180)
- MO-01 Overview mobile: lines 1040-1066 (390×844)
- MO-02 Leads mobile: lines 1068-1086 (390×844)

Supporting docs (verified to exist at `F:\CodeOutfitters\Dashboard\docs\`, all 5 confirmed present, no path substitution needed): `ID-CROSS-REFERENCE.md`, `SCREEN-INVENTORY.md`, `DESIGN-TOKENS.md`, `ACCESSIBILITY-INTEGRATION-SPEC.md`, `FRONTEND-INTEGRATION.md`. Fuller token JSON also referenced at `Dashboard/integration-layer/design-tokens.json` (per `DESIGN-TOKENS.md` line 7) — not yet read this pass, flagged for the token-audit step.

Implementation root: `F:\CodeOutfitters\command-center`.

---

## PART A — C-D01 OVERVIEW (35 categories)

| # | Category | Canonical (C-D01/T-01/MO-01) | Current implementation | Exact difference | Required correction | Target component | Acceptance evidence |
|---|---|---|---|---|---|---|---|
| 1 | Frame identifier | C-D01 (desktop 1440×1000), T-01 (820×1180), MO-01 (390×844) | `apps/web/app/(shell)/dashboard/page.tsx` | — (frame IDs are the acceptance keys) | Map each of the 3 breakpoints separately, not one fluid layout guessed from desktop | route `/dashboard` | canonical vs implementation screenshots at each of the 3 dims |
| 2 | Source location | `Dashboard/Command Center Final.dc.html:30-81` (desktop), `:846-883` (tablet), `:1040-1066` (mobile) | `apps/web/app/(shell)/dashboard/page.tsx`, `packages/ui/src/{kpi-card,chart-container,pipeline-journey}.tsx` | n/a | n/a | n/a | n/a |
| 3 | Viewport/frame dimensions | 1440×1000 / 820×1180 / 390×844, exact fixed frame box, `overflow:hidden` | Fluid responsive layout, no fixed frame height budget | Canonical is a fixed-height, non-scrolling composition (`overflow:hidden` on the whole 1000px-tall frame); current impl lets content determine page height and scroll | Design each breakpoint to fit its content within the frame height without page scroll (matches "no large unused region" complaint — canonical fills 1000px exactly) | shell layout | canonical-overview-desktop screenshot full-frame vs implementation |
| 4 | Application-shell structure | `display:flex` row: `<aside>` (sidebar) + flex:1 column (`<header>` + content) | Same top-level flex shape (`Sidebar` + main column) | Structurally aligned already | Preserve | shell layout (`apps/web/app/(shell)/layout.tsx`) | side-by-side |
| 5 | Header structure | height 56px, `justify` title+meta left / search+date-toggle+bell+avatar right; meta line: `"Tuesday, April 22 · 4 items need attention · next meeting in 1h 20m"` | Header exists but simplified — no search box, no 7D/30D/90D date-range toggle, no bell icon, meta line likely absent/generic | Missing: search input (300px, `⌘K` kbd hint), 3-way date-range segmented control, notification bell icon, dynamic meta line with item-count + next-meeting time | Rebuild header actions row: search box, date-range segmented toggle (7D/30D/**30D active**/90D), bell icon, avatar; add dynamic meta subtitle | new `PageHeader`/`OverviewHeader` component | side-by-side header region crop |
| 6 | Sidebar structure | `<aside>` 248px desktop / 72px tablet, `#14130E` bg, logo block "Code**Outfitters** / COMMAND CENTER", nav groups OPERATIONS/ADMINISTRATION, bottom "Collapse" row + user card (avatar MR, name, role, expand icon) | `sidebar.tsx` — logo block present, nav groups present (`OPERATIONS_NAV`/`ADMINISTRATION_NAV` match `NAV` array order/labels), user card present at bottom; **no "Collapse" affordance row above the divider** | Missing the "Collapse" control row (icon + "Collapse" label) between nav list and the divider/user-card, present in canonical desktop at line 36 | Add collapse row (visual only, non-functional collapse OK if no interaction contract exists — but must render) | `sidebar.tsx` (`Sidebar`) | side-by-side sidebar crop |
| 7 | Sidebar width | 248px desktop (>=1280 xl), 72px tablet (768-1279) | `w-[72px] ... xl:w-[248px]` in `sidebar.tsx:120` | Matches exactly | Preserve | `sidebar.tsx` | measured width in DOM |
| 8 | Main-content max width | Frame is fixed 1440px total (no additional max-width applied — content fills to the 1440px frame edge) | Unclear/likely unconstrained fluid | Canonical does not center/cap content narrower than viewport at this breakpoint — full-bleed within the 248px+content frame | Do not introduce an artificial max-width narrower than the canonical frame | shell layout | measured content width |
| 9 | Main-content padding | header `padding:0 24px`; content area `padding:12px 24px 14px` | Needs verification against `dashboard/page.tsx` | Unverified — check exact padding values | Set content padding to `12px 24px 14px` (desktop) | `dashboard/page.tsx` | computed style diff |
| 10 | Grid columns | Content area: KPI row (`repeat(4,1fr)`) stacked above a 2-col grid `1fr 372px` (main column + fixed 372px right rail) | Current KPI row likely `repeat(4,1fr)` already (per "four KPI cards" complaint, count matches); main layout below KPIs is NOT a `1fr 372px` 2-column grid — Pipeline Journey renders as an isolated card, not inside a 372px right-rail stack | **This is the root cause of "large unused region" and "narrow data card" complaints.** Canonical's right column is fixed-width 372px containing 3 stacked cards (Pipeline Journey, Meetings & proposals, Recent activity) filling full column height; left column (flex:1) holds Lead Flow chart + Today's work, filling remaining width. Current impl apparently gives Pipeline Journey its own card without the sibling Meetings/Activity cards, leaving dead space | Rebuild desktop grid as `grid-template-columns:1fr 372px` with `gap:14px`; left column = flex column (Lead Flow chart, Today's work); right column = flex column, `height:100%`, 3 stacked cards (Pipeline Journey, Meetings & proposals card, Recent activity card, last one `flex:1 min-height:0` to fill remaining height) | `dashboard/page.tsx` layout + 2 NEW components: `MeetingsProposalsCard`, `RecentActivityCard` | side-by-side full page |
| 11 | Grid gaps | KPI row: cards touch (0 gap, internal borders divide); main grid: 14px gap; right-column internal: 14px gap | Unverified | Unverified | Match 14px gaps; KPI cards share one bordered container with internal `border-left` dividers, NOT 4 separate gapped cards | `kpi-card.tsx` container + `dashboard/page.tsx` | computed style diff |
| 12 | Section order | Header → KPI row → [Lead Flow chart, Today's work] (left) / [Pipeline Journey, Meetings&Proposals, Recent Activity] (right) | Header → KPI row → Lead Flow chart(?) → Pipeline Journey — missing Today's work, Meetings & proposals, Recent activity sections entirely (per "large unused region" and "narrow data card" complaints, these sibling sections are likely simply not built) | 3 sections missing: "Today's work" queue card (left column, below chart), "Meetings & proposals" 2-row card, "Recent activity" feed card | Build all 3 missing sections; this is very likely THE root cause of the unused-space and undersized-Pipeline-Journey complaints — the right rail is empty except Pipeline Journey where canonical has 3 cards | `dashboard/page.tsx`, new `TodaysWorkCard`, `MeetingsProposalsCard`, `RecentActivityCard` | side-by-side |
| 13 | Component dimensions | KPI value font 32px mono; Lead Flow chart SVG `height:160` desktop viewBox `0 0 1090 212`; Pipeline Journey row height ~44px (`padding:7px 16px` + content) | ChartContainer "excessive unused height" per complaint; KPI cards "simplified" | Chart height/proportions and KPI card internal layout do not match canonical spacing/type scale | Resize ChartContainer to canonical proportions (160px height at desktop, not oversized); rebuild KpiCard internal layout to match (label row with trend pill top, 32px mono value, caption below) | `chart-container.tsx`, `kpi-card.tsx` | measured heights |
| 14 | Typography family | Geist (headers/nav/KPI labels via `font-family:'Geist'` on sidebar, general UI IBM Plex Sans, mono values IBM Plex Mono / Geist Mono) | Need font audit — Tailwind v4 tokens in `globals.css` | Unverified whether Geist/IBM Plex Sans/IBM Plex Mono are actually loaded and applied vs a generic system/Tailwind default stack | Load Geist, Geist Mono, IBM Plex Sans, IBM Plex Mono (Google Fonts, matching canonical `<link>`, or self-hosted equivalents); apply IBM Plex Sans as body default, Geist for sidebar/brand, mono faces for all numeric/ID/timestamp values | `apps/web/app/globals.css`, font loading (`next/font` recommended) | rendered font comparison (visual + computed `font-family`) |
| 15 | Typography sizes | Page/header title 16/600; route in-canvas title 28-32 (not used at this frame scale); section headers 15/600; body 12.5-13.5; table 12.5-13.5; meta 10.5-11.5; KPI value 32 mono | Unverified per-element; DESIGN-TOKENS.md line 6 is canonical spec | Needs systematic audit against implementation Tailwind classes | Define type-scale tokens matching DESIGN-TOKENS.md exactly, apply via Tailwind `@theme` | `globals.css` tokens + all components | computed font-size diff per element |
| 16 | Font weights | 600 for titles/section headers/KPI values, 700 for KPI/table column labels (letter-spaced small caps style), 400 body | Unverified | Needs audit | Match weight per DESIGN-TOKENS.md line 6 | all components | computed style diff |
| 17 | Line heights | KPI value `line-height:1`; body default browser line-height (~1.4-1.5 implied by 12.5-13.5px sizes) | Unverified | Needs audit | Set `line-height:1` explicitly on all large mono numerals | `kpi-card.tsx`, chart labels | computed style diff |
| 18 | Colors | Full palette in DESIGN-TOKENS.md line 2-4 (sidebar ink #14130E, body canvas #EDF0F2/#E3E1D9 outer, surface #FFFFFF, line #D9DFE2, ink #1B2226, t2 #5A6B74, t3 #7A868D; semantic green/amber/red/blue per line 4) | `globals.css` has `--cc-*` tokens (`cc-sidebar-ink`, `cc-surface`, `cc-line`, `cc-ink`, `cc-t3`, etc. per class usage seen in `sidebar.tsx`/`pipeline-journey.tsx`) — tokens exist but exact hex values not yet diffed against canonical | Values may already be close (structure suggests deliberate token mirroring) but not yet verified hex-for-hex | Diff every `--cc-*` custom property value in `globals.css` against DESIGN-TOKENS.md / `design-tokens.json`; correct any mismatch | `apps/web/app/globals.css` `@theme` block | token value diff table |
| 19 | Borders | 1px `#D9DFE2` (body dividers), 1px `#26231A` (sidebar divider) | Likely already token-driven (`border-cc-line` class seen) | Needs hex verification | Verify `--cc-line` = `#D9DFE2` | `globals.css` | token diff |
| 20 | Radii | 6/8/10px system (controls 6, cards 8, dialogs 10) per DESIGN-TOKENS.md line 7 | `rounded-cc-card`, `rounded-cc-control` classes exist (seen in `pipeline-journey.tsx`) | Needs numeric verification | Verify `--cc-radius-card`=8px, `--cc-radius-control`=6px, dialog=10px | `globals.css` | token diff |
| 21 | Shadows | "Shadows only overlays/drag/toast" per DESIGN-TOKENS.md line 7 — cards/frames themselves have NO drop shadow in-app (the `box-shadow:0 24px 64px...` in the `.dc.html` is the design-canvas frame chrome, not part of the actual UI) | Unknown | Must confirm implementation does not add shadows to ordinary cards | Cards use border only, no shadow, except dropdowns/modals/toasts | all card components | visual inspection |
| 22 | Icon names/dimensions | Sidebar nav icons: 18×18 (tablet)/15×15(?) stroke-width 1.75, outline style, specific glyphs per nav item (grid icon=Overview, person=Leads-adjacent?, bars=Pipeline, calendar=Appointments/settings-icon set differs per group) — exact glyph paths embedded as inline `<svg>` in `.dc.html` | `nav-icons.tsx` hand-rolled inline SVGs, comment states "No icon library is an authorized dependency" | Need path-level comparison: are the current hand-rolled glyphs the SAME shapes as canonical's inline SVGs, or approximated? | Extract exact `<path>` `d` attributes from canonical SVGs per icon and replace `nav-icons.tsx` path data 1:1 — canonical explicitly also hand-rolls inline SVG (no icon library used in the design source either), so the "no icon library" architectural choice is CORRECT and must be preserved; only the path shapes need to match exactly | `nav-icons.tsx` | path-by-path diff against `.dc.html` inline SVGs |
| 23 | Button styles | Primary: `background:#2F7D4F; color:#fff; border-radius:6px; padding:8px 13px; font-weight:600` (e.g. "Export CSV"); secondary/outline: `border:1px solid #CDD5D9; border-radius:6px; color:#3E4A52` | Unverified against a shared `Button` component (none confirmed to exist yet) | Unknown if a shared button primitive exists at all | Build/correct shared `Button` primitive (primary/secondary/tinted variants) matching exact colors/radius/padding | new `packages/ui/src/button.tsx` (if absent) | visual + computed style diff |
| 24 | Input styles | Search input: `height:36px` (desktop)/34px(leads toolbar); `background:#F1F4F5; border:1px solid #D9DFE2; border-radius:6px; padding:0 12px`, `⌘K` kbd hint | Unverified; header search input not confirmed present at all (see #5) | Missing entirely per #5 | Build shared `SearchInput` matching canonical exactly | new component | visual diff |
| 25 | Select/filter-pill styles | Tinted pill for active filter (`color:#276B42; background:#E2F0E7; border:1px solid #BFDCCA`), plain outline pill for inactive (`color:#3E4A52; border:1px solid #CDD5D9`) | `leads-table.tsx` uses a plain `<select>` element for status/owner filters, not canonical pill/dropdown chips | Native `<select>` does not visually match canonical dropdown-pill controls | Replace native `<select>` filters with styled pill-button + popover pattern matching canonical (applies to Leads screen, category 25 is shared with Part B) | `leads-table.tsx` filter toolbar | visual diff |
| 26 | Table density | N/A for Overview (no primary table on this screen) | — | — | — | — | — |
| 27 | Status treatments | KPI trend pills use small tinted badges (`+18%` green tint, `ACTION` amber tint, etc.) | KpiCard "trend or supporting values where defined" — currently likely plain text, no tinted pill | Missing tinted trend-badge treatment on KPI cards | Add tinted pill badge component to KpiCard for trend/status text | `kpi-card.tsx` | visual diff |
| 28 | Row actions | Today's work rows: colored left-tag chip (mono, colored) + CTA button (bordered pill, e.g. "Reply", "Schedule") per row | Not built (section missing, see #12) | n/a | Build as part of `TodaysWorkCard` | `TodaysWorkCard` (new) | visual diff |
| 29 | Empty states | Not explicitly shown for C-D01 sections in this frame (C-D02 has the Lead-Flow-specific empty/skeleton/failed states, out of Phase 3's required frame list but useful reference for tone/pattern) | Unknown | Low priority — C-D02 not a required acceptance frame | Reference C-D02's empty-state card pattern (icon+message+CTA in bordered card) if/when Overview sections need an empty state | various | n/a (not required frame) |
| 30 | Loading states | Table/list skeleton rows use flat gray bars (`background:#E7EBED` or `#EEF1F3`, `border-radius:3px`, partial widths) — see C-D02 skeleton reference and C-D05's skeleton row (Part B #30) | Unknown if implemented | Unverified | Build skeleton-bar pattern reusable across KPI/chart/list loading states | shared `Skeleton` primitive | visual diff (loading state, not in the 7 static screenshots — flag if untestable without real loading-state trigger) |
| 31 | Error states | C-D02 shows a red-bordered "Metrics failed to load" card pattern (icon + message + Retry button, `border:1px solid #E3B8AC`) | Unknown | Unverified | Build reusable error-card pattern | shared `ErrorCard` primitive | visual diff (not in the 7 static screenshots unless a real error is forced) |
| 32 | Hover states | Nav "View queue"/"Review"/"Open" links `color:#2F7D4F`, presumed darker `#276B42` on hover (per global `a:hover` rule in `.dc.html` line 18) | Unverified | Unverified | Ensure interactive text links darken on hover to `#276B42` | global CSS / component-level | not screenshot-testable statically; code-level check |
| 33 | Focus states | Not explicit in `.dc.html` static frame (design canvas doesn't demonstrate focus); ACCESSIBILITY-INTEGRATION-SPEC.md is the authority here | Unknown | Must read ACCESSIBILITY-INTEGRATION-SPEC.md before deciding | Read spec; apply documented focus-ring token (`--cc-focus-ring` if defined) | global CSS | spec compliance, not pixel-diff |
| 34 | Tablet adaptation | T-01: sidebar collapses to 72px icon rail; KPI row becomes `1fr 1fr` (2×2, not 1×4); Today's work + Lead Flow + Pipeline Journey stack in ONE column (no right-rail split at tablet); Pipeline Journey becomes a 3-col mini-card grid (`repeat(3,1fr)`), NOT the desktop's vertical list rows; Meetings/Recent-activity cards are DROPPED entirely at tablet (not present in T-01 markup) | Current tablet Overview: sidebar correctly 72px (fixed this session); KPI/chart/Pipeline Journey layout not yet verified against this exact single-column + 3-col-phase-grid structure | Pipeline Journey at tablet likely still renders as the same vertical-list component as desktop/mobile, not canonical's distinct 3-column phase-card grid unique to T-01 | Build a tablet-specific Pipeline Journey presentation (3-col grid of compact phase cards: name+dot, big mono count, conversion text) — this is a DIFFERENT composition than desktop's list, not just a narrower version of it | `pipeline-journey.tsx` (needs tablet-specific render branch), `dashboard/page.tsx` tablet layout | canonical-overview-tablet screenshot vs implementation |
| 35 | Mobile adaptation | MO-01: single column stack: header (hamburger+logo+avatar, no search/date-toggle) → Today's work card → 2×2... actually 1×2 KPI grid (only NEW LEADS + OVERDUE shown, not all 4) → Meetings&proposals combined card → Lead Flow **collapsed to one summary line** with "Expand ▾" → Pipeline Journey **collapsed to one summary line** ("86 active · bottleneck: Appointment — 3 waiting > 48h") with "Statuses ▾" → footer card (next appt + recent activity combined, text-only) | Current mobile Overview renders full KPI grid (likely 4, not 2) AND the full 6-row Pipeline Journey list (all 6 phases with bars), not the canonical single-summary-line collapsed card | **Root cause of "cramped and visually improvised" mobile Pipeline Journey complaint**: canonical MO-01 does NOT show the full phase list on mobile at all — it shows ONE collapsed summary line ("86 active · bottleneck: ...") with an expand affordance. The current mobile implementation is showing full desktop-equivalent detail crammed into mobile width instead of canonical's deliberately collapsed summary card | Replace mobile Pipeline Journey rendering with a collapsed one-line summary card matching MO-01 exactly (not a shrunk version of the desktop list); same treatment for Lead Flow chart on mobile (collapsed to text summary, no SVG chart rendered at all on mobile per MO-01); reduce KPI grid to 2 cards on mobile matching MO-01 (NEW LEADS, OVERDUE) or confirm exact MO-01 selection | `dashboard/page.tsx` mobile branch, `pipeline-journey.tsx` (mobile collapsed variant), `kpi-card.tsx` container (mobile 2-card selection) | canonical-overview-mobile screenshot vs implementation |

---

## PART B — C-D05 LEADS (35 categories)

| # | Category | Canonical (C-D05/T-02/MO-02) | Current implementation | Exact difference | Required correction | Target component | Acceptance evidence |
|---|---|---|---|---|---|---|---|
| 1 | Frame identifier | C-D05 (1440×1000), T-02 (820×1180), MO-02 (390×844) | `apps/web/app/(shell)/leads/page.tsx` | — | — | route `/leads` | screenshots |
| 2 | Source location | `.dc.html:134-201` (desktop), `:885-912` (tablet), `:1068-1086` (mobile) | `leads-table.tsx` | n/a | n/a | n/a | n/a |
| 3 | Viewport/frame dimensions | Fixed 1440×1000/820×1180/390×844, `overflow:hidden` | Fluid, scrollable | Same class of gap as Overview #3 | Design each breakpoint to fit; table body scrolls internally if needed but overall frame doesn't grow unbounded | shell layout | screenshots |
| 4 | Application-shell structure | Same sidebar+column shell as C-D01 | Same | Aligned | Preserve | shell | — |
| 5 | Header structure | height 56px; left: "Leads" title + `"128 total · 12 new this week · 9 awaiting first contact"` meta; right: "Columns ▾" tinted-outline pill + "Export CSV" solid green button | Current header: `<h1>Leads</h1>` only, per summary notes — meta line and both action buttons likely missing | Missing dynamic meta line (total/new/awaiting counts) and both header action buttons (Columns, Export CSV) | Build header meta line + action buttons | `leads/page.tsx` header | side-by-side header crop |
| 6 | Sidebar structure | Same as C-D01 #6 (missing Collapse row) | Same | Same gap | Same fix | `sidebar.tsx` | — |
| 7 | Sidebar width | 248/72px | Matches | Aligned | Preserve | `sidebar.tsx` | — |
| 8 | Main-content max width | Full-bleed to 1440px frame | Unverified | — | No artificial cap | `leads/page.tsx` | — |
| 9 | Main-content padding | `padding:20px 24px` | Unverified | — | Set 20px/24px | `leads/page.tsx` | computed diff |
| 10 | Grid columns (table) | Desktop 9-col grid: `38px 1.5fr .95fr 1.1fr .95fr .9fr .75fr .6fr 34px` = checkbox, Lead(name+co), Service, Status, Owner, Appointment, Next Step, Created, row-action(↗) | `leads-table.tsx` desktop `columns` — need to verify exact column SET; summary notes describe an "8-column" table but doesn't confirm Service/Appointment/Owner-avatar/row-action(↗) are all present with canonical semantics | **Directly targeted by user complaint "styled base table rather than canonical C-D05" and "row actions/interaction hierarchy incomplete."** Must verify/rebuild: Owner column MUST show colored initials-avatar chip + resolved name (not raw `user-001`), Appointment column MUST show human label (not raw `not_started`/`no_show`), row-action column MUST show the `↗` open-affordance (not a text "Open" link), Status MUST show colored dot + uppercase label matching canonical dot-color semantics | Rebuild `columns` to exactly 9 canonical columns with correct cell renderers: composite Lead cell, Service, Status(dot+label), Owner(avatar+display-name), Appointment(display label), Next Step(colored/weighted per `l.nk`/`l.nw`), Created(mono date), row-action icon-only `↗` | `leads-table.tsx` | canonical-leads-desktop vs implementation, cell-by-cell |
| 11 | Grid gaps | 12px gap (desktop row grid), row height 42px, header row padding `10px 16px` | Unverified | — | Match 42px row height, 12px gaps | `leads-table.tsx` | computed diff |
| 12 | Section order | Header → toolbar(search+filter pills+result count, with Service facet popover) → active-filter chips row → bulk-action bar (conditional, shown when rows selected) → table (header+rows+skeleton-loading-row example+pagination footer) | Toolbar/filters/table order likely present but simplified; bulk-action bar and filter-chips row need verification | Filter-chips row ("FILTERS: Service: AI Automation ✕ ...") and bulk-action bar ("2 SELECTED · Assign · Change status · ...") likely not built to canonical spec | Build filter-chips row (shows active filter pills with ✕ remove) and bulk-action bar (dark `#212528` bg, shows on selection, Assign/Change status/Schedule follow-up/Export actions) | `leads-table.tsx` toolbar area | side-by-side |
| 13 | Component dimensions | Row height 42px desktop / 48px tablet; toolbar row ~12-16px vertical padding | Unverified | — | Match exact row heights | `leads-table.tsx` | computed diff |
| 14 | Typography family | Same as Overview: IBM Plex Sans body, IBM Plex Mono for dates/counts/IDs | Same gap as Overview #14 | — | Same fix | global fonts | — |
| 15 | Typography sizes | Column labels 10.5px/700/letter-spaced uppercase; Lead name 13px/600; company 11px; body cells 12-12.5px; created date mono 10.5px | Unverified | — | Match exactly | `leads-table.tsx` | computed diff |
| 16 | Font weights | 700 column headers, 600 lead name, 400-600 status/next-step (next-step weight is DATA-DRIVEN via `{{ l.nw }}` — some rows are bold, some not, based on urgency) | Unverified whether `nextFollowUpCell` applies data-driven weight/color | Need to confirm `leads-table.tsx`'s next-follow-up cell reads a color/weight field from the Lead data, or if it's static styling | Ensure Lead type carries a next-step urgency indicator (color+weight) mapped from data, not hardcoded | `leads-table.tsx`, `packages/contracts` Lead type if needed | code-level check + visual diff |
| 17 | Line heights | Standard | Unverified | — | — | — | — |
| 18 | Colors | Status dot colors are semantic (green/amber/red/blue/neutral per DESIGN-TOKENS.md line 4) mapped per status value | Need to confirm `leads-table.tsx` maps each of the 11 real status enum values to one of these 5 dot colors correctly | Unverified mapping completeness (11 statuses → 5 color buckets) | Build/verify explicit status→color mapping table covering all 11 status values | new `lib/status-display.ts` (or similar) | mapping table review + visual diff |
| 19-21 | Borders/Radii/Shadows | Same system as Overview | Same | Same | Same | `globals.css` | token diff |
| 22 | Icon names/dimensions | Row action `↗` (arrow-up-right glyph, plain text/svg, `color:#B9C2C7`), checkbox `border-radius:3px` custom checkbox (not native), owner avatar circle-square `border-radius:5px` initials chip | Summary notes say current row action is `"Open ›"` **text substitute**, explicitly called out by user as unacceptable ("a minimal text substitute rather than an approved component") | Row action is literal text "Open ›" instead of the canonical icon-only `↗` affordance in its own narrow 34px column; also need to confirm checkbox is custom-styled not native `<input type=checkbox>` default appearance | Replace text "Open ›" with icon-only `↗` (or equivalent open/external-link glyph) in the dedicated 34px trailing column, styled `color:#B9C2C7` default; build custom checkbox visual (native input, custom label styling) | `leads-table.tsx` row-action cell + select column | visual diff |
| 23 | Button styles | "Export CSV" solid green (`#2F7D4F`/white); "Columns ▾" tinted outline green | Missing (see #5) | — | Build per shared Button primitive | `leads/page.tsx` header | visual diff |
| 24 | Input styles | Search 240px/34px height, `background:#F1F4F5` | Unverified size | — | Match | toolbar | computed diff |
| 25 | Select styles | Filter pills: Status/Owner/Source/Appointment/Created — each an outline pill with `▾`, Service pill tinted-active with count badge (`Service · 2 ▾`) and popover showing faceted counts per option with checkboxes | **Directly targeted**: `leads-table.tsx` currently uses native `<select>` elements for status/owner filtering (per Task 1 summary), not pill+popover controls; also missing Source and Appointment filters entirely (Task 1 only added status+owner) | Native `<select>` ≠ canonical pill-button+popover; Source and Appointment filter dimensions not implemented at all; Service facet popover (checkbox list with counts) not implemented | Replace native selects with pill-button components; add Source and Appointment filter pills; build Service filter as a popover with faceted counts (may defer popover interaction detail if no contract for facet counts exists yet — flag as remaining deviation if so, do not fabricate counts) | `leads-table.tsx` toolbar, new `FilterPill`/`FilterPopover` components | visual diff, functional filter test |
| 26 | Table density | Desktop 42px rows / tablet 48px rows, comfortable not compact | Unverified | — | Match | `leads-table.tsx` | computed diff |
| 27 | Status treatments | Colored square dot (`8×8px, border-radius:2px`) + uppercase 10.5px/600 label, letter-spaced | Need to confirm current status cell has this exact dot+label treatment, not just plain text | Per user complaint "status values lack finished visual treatment" — likely plain text today | Build status-indicator component: colored dot + uppercase label | new `StatusIndicator` (in `packages/ui`) | visual diff |
| 28 | Row actions | Icon-only `↗` per row, own 34px column, far right | Text "Open ›" (see #22) | Same as #22 | Same as #22 | `leads-table.tsx` | visual diff |
| 29 | Empty states | Not shown in C-D05 frame directly; infer from C-D02 empty-state pattern for consistency | Unknown | Low priority | Apply shared empty-state pattern if/when Leads has zero results | `leads-table.tsx` | not in 6 required screenshots |
| 30 | Loading states | Skeleton row: flat gray bars per column matching column proportions, one example row shown at bottom of table (`background:#E7EBED`, rounded, no border) | Unknown if implemented | Unverified | Build skeleton row using shared `Skeleton` primitive matching column widths | `leads-table.tsx` | not in 6 required screenshots unless loading state forced |
| 31 | Error states | Not shown in C-D05 frame; reuse C-D02 pattern if needed | Unknown | Low priority | — | — | — |
| 32 | Hover states | Row hover likely subtle bg tint (not explicit in static frame — rows show `selBg` only for selected state); link/action hover darkens per global `a:hover` | Unverified | — | Add subtle row-hover background | `leads-table.tsx` | not statically screenshot-testable |
| 33 | Focus states | Per ACCESSIBILITY-INTEGRATION-SPEC.md (not yet read in full) | Unknown | Must read spec | Read spec, apply | global | spec compliance |
| 34 | Tablet adaptation | T-02: 5-col grid `30px 1.5fr 1.1fr .9fr .6fr` = checkbox, Lead, Status, Next Step, Created; Owner/Service/Appointment moved OUT of table into filter-only surfaces; toolbar reduced to Search + Service pill + Owner pill + result count; row height 48px | **Task 1's `tabletColumns` in `leads-table.tsx` already matches this exactly** (select, composite lead cell, status, next-step→"Next Step", created→"Created", confirmed via this session's re-read of `.dc.html:885-912` against the file's known column structure) — this is the one area of Task 2's complaint that direct canonical comparison DISPROVES rather than confirms | No difference found — Task 1's tablet column-reduction work is canonically correct, contrary to Task 2's "invented reduced-column interpretation" concern (that concern predates this direct verification) | None — confirm via rendered screenshot comparison as the task requires, but source-level comparison shows exact match | Re-verify visually (row height 48px, gap 10px, font sizes) but no structural column rebuild needed here | `leads-table.tsx` (verify styling details only) | canonical-leads-tablet vs implementation screenshot — expect close match, still must capture to prove it per the task's explicit "prove identical" requirement |
| 35 | Mobile adaptation | MO-02: header (hamburger+"Leads"+count) → toolbar (search+"Filters·2" pill+"Sort ▾") → possible-duplicate warning card (data-conditional, not always shown) → card list: each card = name+status(dot+label) top row, `company · service · owner` meta line, divider, next-step(colored/weighted) + "Open ›" bottom row → "Load 10 more · N remaining" footer button (NOT infinite scroll, NOT full pagination) | Per user complaint: "mobile lead cards visibly truncate important information such as owner values" and "mobile filter toolbar wraps awkwardly" and "'Open ›' interaction is a minimal text substitute rather than an approved component" — **note canonical MO-02 ITSELF uses "Open ›" text on mobile cards** (line 1081: `Open ›`), unlike desktop's icon-only `↗`. This means the mobile "Open ›" text is actually CANONICALLY CORRECT for mobile cards specifically — the complaint about "Open ›" being a "minimal text substitute" more likely targets the DESKTOP row action (#22/#28 above), not mobile | Truncation and toolbar-wrap are real gaps to fix on mobile; "Open ›" on mobile cards should be KEPT since canonical mobile also uses it — only the desktop row action needs the icon fix | Fix mobile card meta-line truncation (ensure `company · service · owner` all render without arbitrary cutoff, matching canonical's single truncating line — canonical itself truncates via one meta line, so some truncation is BY DESIGN; verify it's the same truncation point, not a worse one); fix toolbar flex-wrap (`Search` flex:1, `Filters·2` and `Sort▾` fixed, single row, no wrap at 390px per canonical); keep "Open ›" text on mobile cards, do NOT replace with icon there | `leads-table.tsx` mobile `<ul>` card list, toolbar | canonical-leads-mobile vs implementation |

---

## Summary of confirmed root causes (highest priority, ranked)

1. **Overview desktop right-rail is incomplete** — canonical is a 3-card stack (Pipeline Journey + Meetings&Proposals + Recent Activity) in a fixed 372px column filling full height; current impl has Pipeline Journey alone with no siblings, producing both the "narrow data card" and "unused region" complaints simultaneously (Part A #10, #12).
2. **Overview mobile Pipeline Journey (and Lead Flow) should be COLLAPSED summary cards, not shrunk full lists** — canonical MO-01 shows one summary line + expand affordance for both; current impl renders the full 6-phase list, explaining "cramped and visually improvised" (Part A #35).
3. **Overview "Today's work" section entirely missing** (Part A #12).
4. **Leads desktop row action is text ("Open ›" equivalent) instead of canonical icon-only `↗`**, and raw enum values (`user-001`, `not_started`, `no_show`) are exposed instead of display-mapped (Part B #10, #22, #28, #18).
5. **Leads filter toolbar uses native `<select>` instead of canonical pill+popover controls**, and is missing Source/Appointment filter dimensions plus the filter-chips row and bulk-action bar (Part B #12, #25).
6. **Header action rows (search, date-range toggle, Columns/Export buttons) are missing on both screens** (Part A #5, Part B #5).
7. **Tablet Leads column reduction (Task 1's work) is CONFIRMED CORRECT against direct source comparison** — no rebuild needed there, only visual-detail verification (Part B #34).
8. **Icon system**: canonical itself hand-rolls inline SVGs (no icon library) — current `nav-icons.tsx` approach is architecturally correct; only exact path/glyph shapes need verification against canonical's inline SVGs (Part A #22).
9. **Font loading unverified** — Geist / Geist Mono / IBM Plex Sans / IBM Plex Mono must be confirmed loaded and applied, not a fallback stack (Part A #14).
10. **Token hex-value audit not yet done** — `globals.css` `--cc-*` tokens appear structurally aligned but not yet diffed value-by-value against `DESIGN-TOKENS.md` / `design-tokens.json` (Part A #18-20).

Not yet done, next steps: capture canonical reference screenshots (6 required), capture current implementation screenshots at matching dimensions, build comparison harness, then begin component reconstruction starting with items 1-6 above (highest complaint-to-fix ratio).


---

# SECTION 2 — PROVENANCE-CLASSIFIED REGION MATRIX

Authored 2026-07-22 under `CODEOUTFITTERS_PHASE_3_CANONICAL_RECONSTRUCTION_AND_PAGINATION_COMPLETION`, Step 2. This section supersedes PART A and PART B above. Those parts are retained unedited as historical record.

## 2.0 Provenance legend

| Tag | Meaning | What is NOT allowed under this tag |
| --- | --- | --- |
| `VERIFIED_DIRECT_FILE_EVIDENCE` | A file was opened during **this** pass and the claim cites the file and line. | Carrying a claim forward from an earlier report without re-reading the file. |
| `VERIFIED_REPRODUCIBLE_COMMAND` | A command was run during this pass and its output is quoted. | Describing what a command "would" print. |
| `VERIFIED_SCREENSHOT_OBSERVATION` | An image was opened and the claim describes what is visible in it. | Inferring pixels from source code. |
| `VERIFIED_HUMAN_DECISION` | The project owner stated it in an instruction message. | Assistant inference about owner intent. |
| `DERIVED_REPRODUCIBLE` | Computed from tagged inputs by a stated rule anyone can re-run. | Estimates, roundings, or "approximately". |
| `UNKNOWN_PENDING_REVIEW` | Not established this pass. | Any implied correctness. |

**Demotion rule applied this pass:** every cell in PART A / PART B written as "Unverified", "Unknown", "likely", "presumed", or "CONFIRMED CORRECT" without a cited line was re-derived from source or demoted to `UNKNOWN_PENDING_REVIEW`. No prior-report claim was promoted to a `VERIFIED_*` tag on the strength of the prior report alone.

**Fabricated-reasoning sweep:** this file was searched for content attributed to an advisor, reviewer, agent, or consultation. `VERIFIED_REPRODUCIBLE_COMMAND` — `grep -niE "advisor|reviewer said|consult" work/PHASE-3-CANONICAL-GAP-MATRIX.md` returned no matches before this section was added. No advisor attribution existed in this document, so none was removed. Nothing in this section is attributed to any consultation.

## 2.1 Evidence base re-derived this pass

| Item | Value | Provenance |
| --- | --- | --- |
| Canonical source | `F:\CodeOutfitters\Dashboard\Command Center Final.dc.html`, 1495 lines | `VERIFIED_REPRODUCIBLE_COMMAND` — `wc -l` output `1495` |
| Global box model | `* { box-sizing: border-box; margin: 0; padding: 0; }` | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 16 |
| Body background / ink | `background:#E3E1D9; color:#1B2226` (canvas page, not app frame) | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 17 |
| Font families loaded | Geist 400/500/600/700, Geist Mono 400/500/600, IBM Plex Sans 400/500/600/700, IBM Plex Mono 400/500/600 | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 14 |
| Body font stack | `"IBM Plex Sans", system-ui, sans-serif` | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 17 |
| Sidebar font | `font-family:'Geist'` on every `<aside>` | `VERIFIED_DIRECT_FILE_EVIDENCE` — lines 33, 137, 207 |
| Nav model | `NAV` array: OPERATIONS label, Overview, Leads(12), Pipeline, Appointments(3), Meeting Intelligence(2), Proposals(3), Follow-ups(4), Email Activity(2), ADMINISTRATION label, Team, Settings | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1312 |
| Nav item style | `height:37px; padding:0 26px; font-size:13.5px`, inactive `#A19C8B`, active `#F4F1E6` + `font-weight:500` + `box-shadow:inset 2px 0 0 #5C9B6C` | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1322 |
| Nav group-label style | `padding:14px 26px 8px; font-size:10px; font-weight:600; color:#57533F; letter-spacing:.16em` | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1319 |
| Badge colours | `BC={'12':'#8FBF9B','3':'#6B6754','2':'#D98C7B','4':'#D9A94E'}`; Meeting Intelligence's `2` overridden to `#8FBF9B` | `VERIFIED_DIRECT_FILE_EVIDENCE` — lines 1313, 1321 |
| Badge font | `font-family:'Geist Mono'; font-size:11px` | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1321 |
| KPI tile data | NEW LEADS 34 (+18%), AWAITING CONTACT 9 (ACTION), APPOINTMENTS 7 (3 TODAY), OVERDUE FOLLOW-UPS 4 (+2) | `VERIFIED_DIRECT_FILE_EVIDENCE` — lines 1325-1329 |
| Pipeline phases | Intake 25, Appointment 16, Discovery 8, Proposal 13, Decision 5, Outcome 19 | `VERIFIED_DIRECT_FILE_EVIDENCE` — lines 1353-1359 |
| Lead status map `ST` | 11 statuses: New, Contacted, Appt Pending, Appt Scheduled, Discovery Done, Proposal Req., Proposal Sent, Negotiation, Won, Lost, Follow Up Later | `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1362 |
| Ten visible lead rows `L` | Dana Whitfield … Elena Sokolova, 11 fields each | `VERIFIED_DIRECT_FILE_EVIDENCE` — lines 1363-1372 |
| Canonical reference images | 6 PNGs under `work/evidence/phase-3-canonical-reference-v2/`, self-test `frames=6 all_passed=True` | `VERIFIED_REPRODUCIBLE_COMMAND` — `python work/tools/verify_canonical_v2_selftest.py` |
| Harness integrity | `{"total": 18, "passed": 18, "failed": 0}` | `VERIFIED_REPRODUCIBLE_COMMAND` — `python work/tools/test_visual_compare.py` |
| Capture pipeline works end to end | 6/6 `[OK]` at fixed viewport, 0 console errors, production build, mock mode | `VERIFIED_REPRODUCIBLE_COMMAND` — `node work/tools/capture_screens.js` with `CAPTURE_BUILD_MODE=production-mock` |

**Attribute-count note (recorded, not silently reconciled).** The instruction says "record 22 attributes" and then names them in a parenthetical that enumerates **23** items (frame ID, canonical source path, line/section/label/DOM selector, screenshot path, dimensions, hierarchy, copy, tokens, spacing, typography, colors, borders, radii, shadows, icons, controls, responsive behavior, current implementation, exact discrepancy, required correction, target component, target file, acceptance evidence). All 23 named attributes are recorded for every region below; the count discrepancy is reported rather than resolved by dropping one. `VERIFIED_HUMAN_DECISION` — owner instruction text, Step 2.

## 2.2 Frame index

| Frame | Route | Canonical lines | Declared size | Canonical PNG |
| --- | --- | --- | --- | --- |
| C-D01 Overview desktop | `/dashboard` | 30-81 | 1440×1000 | `canonical-overview-desktop-1440x1000.png` |
| T-01 Overview tablet | `/dashboard` | 846-883 | 820×1180 | `canonical-overview-tablet-820x1180.png` |
| MO-01 Overview mobile | `/dashboard` | 1040-1066 | 390×844 | `canonical-overview-mobile-390x844.png` |
| C-D05 Leads desktop | `/leads` | 134-201 | 1440×1000 | `canonical-leads-desktop-1440x1000.png` |
| T-02 Leads tablet | `/leads` | 885-912 | 820×1180 | `canonical-leads-tablet-820x1180.png` |
| MO-02 Leads mobile | `/leads` | 1068-1086 | 390×844 | `canonical-leads-mobile-390x844.png` |

All six line ranges: `VERIFIED_DIRECT_FILE_EVIDENCE` — re-read this pass, each range begins with a `data-screen-label` attribute matching the frame name. All six PNG paths: `VERIFIED_REPRODUCIBLE_COMMAND` — listed and hashed by the self-test above.

Shorthand used below: **CANON** = `Dashboard/Command Center Final.dc.html`; **PNG-dir** = `work/evidence/phase-3-canonical-reference-v2/`. Every region block records the same 23 attributes in the same order.

---

## 2.3 C-D01 — OVERVIEW DESKTOP (1440×1000)

### C-D01/R1 — Frame container

1. **Frame ID** C-D01.
2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 32; `div[data-screen-label="C-D01 Overview"] > div` (the sized artboard). `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`.
5. **Dimensions** `width:1440px; height:1000px`; with `box-sizing:border-box` (line 16) the 1px border is **inside** that box, so the artboard is exactly 1440×1000. `VERIFIED_DIRECT_FILE_EVIDENCE` (lines 16, 32) + `DERIVED_REPRODUCIBLE`
6. **Hierarchy** `frame > [aside 248px | column(flex:1)]`; the column is `header 56px` then `content flex:1`. `VERIFIED_DIRECT_FILE_EVIDENCE` (32, 33, 39, 40, 44)
7. **Copy** none at this level.
8. **Tokens** `--cc-body-canvas #EDF0F2`, `--cc-line-strong #CDD5D9`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `globals.css` 15, 55
9. **Spacing** no padding; children are flex siblings.
10. **Typography** inherits IBM Plex Sans from `body` (line 17).
11. **Colors** background `#EDF0F2`; border `#CDD5D9`. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 32
12. **Borders** `1px solid #CDD5D9` on all four sides.
13. **Radii** none — the desktop artboard is square-cornered.
14. **Shadows** `0 24px 64px rgba(20,26,30,.10)` — presentation chrome of the design canvas, **outside** the artboard box; not reproducible inside a viewport capture and not required of the app. `VERIFIED_DIRECT_FILE_EVIDENCE` (line 32) + `DERIVED_REPRODUCIBLE`
15. **Icons** none.
16. **Controls** none.
17. **Responsive behavior** fixed frame; `overflow:hidden` — content must fit 1000px with no page scroll. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 32
18. **Current implementation** `<div className="flex min-h-screen flex-col bg-cc-canvas md:flex-row">` with `<main className="flex-1 overflow-y-auto p-6">`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `apps/web/app/(shell)/layout.tsx` 12-16
19. **Exact discrepancy** implementation uses `min-h-screen` + scrolling main; canonical is a fixed-height non-scrolling frame. Measured consequence: the desktop overview capture reports `viewport_overflow_px=60`. `VERIFIED_REPRODUCIBLE_COMMAND` — capture log `[OK] implementation-overview-desktop-1440x1000.png 1440x1000 overflow=60px`
20. **Required correction** shell becomes `h-screen` with `min-h-0` on the flex column and `overflow-hidden` on the frame; content regions own their own scroll only where canonical shows one.
21. **Target component** `ShellLayout`.
22. **Target file** `command-center/apps/web/app/(shell)/layout.tsx`.
23. **Acceptance evidence** `comparison-overview-desktop-1440x1000.json` with `viewport_overflow_px: 0` in the capture sidecar, plus owner review of `side-by-side-overview-desktop-1440x1000.png`.

### C-D01/R2 — Sidebar (248px)

1. **Frame ID** C-D01.
2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 33-38; `aside`. Nav rows generated at line 1322, group labels at 1319, badges at 1321. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`, left 248px.
5. **Dimensions** `width:248px; flex-shrink:0`, full frame height. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 33
6. **Hierarchy** brand block → nav list (12 entries incl. 2 group labels) → `margin-top:auto` footer = Collapse row + divider + account row. `VERIFIED_DIRECT_FILE_EVIDENCE` — 34, 35, 36, 37
7. **Copy** `Code`+bold`Outfitters`; `COMMAND CENTER`; `OPERATIONS`; `ADMINISTRATION`; `Collapse`; `Marc Rivera`; `Administrator`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 34, 36, 37, 1312, 1319
8. **Tokens** `--cc-sidebar-ink #14130E`, `--cc-sidebar-text #A19C8B`, `--cc-sidebar-active #F4F1E6`, `--cc-sidebar-rail #5C9B6C`, `--cc-sidebar-raised #26231A`. All five match canonical literals. `VERIFIED_DIRECT_FILE_EVIDENCE` — `globals.css` 10-14 vs CANON 33, 1322, 37
9. **Spacing** `padding:24px 0 16px`; brand `padding:0 26px 24px`; nav rows `height:37px; padding:0 26px`; group labels `padding:14px 26px 8px`; footer divider `margin-top:10px; padding:14px 26px 0`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 33, 34, 37, 1319, 1322
10. **Typography** `'Geist'` for the whole aside; brand 16px; `COMMAND CENTER` 9.5px `letter-spacing:.22em`; nav 13.5px; group label 10px/600/`.16em`; badge `'Geist Mono'` 11px; account name 12.5px/500; role 10.5px. `VERIFIED_DIRECT_FILE_EVIDENCE` — 33, 34, 37, 1319, 1321, 1322
11. **Colors** ink `#14130E`; brand `#F4F1E6`; sublabel `#6B6754`; group label `#57533F`; inactive item `#A19C8B`; active item `#F4F1E6`; divider `#26231A`; avatar `#3D5B45` on `#DCEFE0`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 34, 37, 1319, 1322
12. **Borders** one only: `border-top:1px solid #26231A` above the account row. No per-item borders, no rounded item chips. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 37
13. **Radii** avatar `7px`; nav rows have **no** radius. `VERIFIED_DIRECT_FILE_EVIDENCE` — 37, 1322
14. **Shadows** active item only: `inset 2px 0 0 #5C9B6C`. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1322
15. **Icons** the desktop sidebar rows carry **no icons** — `sc-for` at line 35 emits label + optional badge only. Two SVGs exist in the footer: a collapse glyph (line 36) and a sign-out arrow (line 37). `VERIFIED_DIRECT_FILE_EVIDENCE`
16. **Controls** nav links, Collapse, account row.
17. **Responsive behavior** 248px expanded at 1440; becomes a 72px icon rail at 820 (T-01 line 847); absent at 390, replaced by a hamburger header (MO-01 line 1041). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** `Sidebar` renders `hidden … md:flex xl:w-[248px]` with icon+label rows, rounded `rounded-cc-control px-2 py-2 text-sm`, `bg-cc-sidebar-raised` on active, and **no** brand block, **no** Collapse row, **no** account footer. `VERIFIED_DIRECT_FILE_EVIDENCE` — `packages/ui/src/sidebar.tsx` 70-125
19. **Exact discrepancy** (a) brand block absent; (b) account/footer region absent; (c) Collapse row absent; (d) desktop rows render an icon canonical does not have; (e) active row gets a raised background canonical does not have; (f) rows are rounded and 8px-padded rather than flush 37px/26px; (g) group labels use Tailwind `text-xs` (12px) not 10px/`.16em`/`#57533F`; (h) badges use `text-xs opacity-70` not the per-badge `BC` colours in Geist Mono. All eight: `VERIFIED_DIRECT_FILE_EVIDENCE` (both sides read this pass).
20. **Required correction** rebuild the sidebar to the canonical three-part structure with exact metrics; remove icons from the ≥xl expanded rows and keep them only for the 72px rail; replace the raised-background active state with the inset rail stripe alone; restore brand, Collapse and account regions; colour badges from the canonical `BC` map.
21. **Target component** `Sidebar` / `NavList`.
22. **Target file** `command-center/packages/ui/src/sidebar.tsx`.
23. **Acceptance evidence** `diff-overview-desktop-1440x1000.png` showing no residual ink band in x∈[0,248]; owner review.

### C-D01/R3 — Header bar (56px)

1. **Frame ID** C-D01.
2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 40-43; `header`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`, top strip right of the sidebar.
5. **Dimensions** `height:56px; flex-shrink:0`; width = 1440 − 248 − 2 = 1190px. `VERIFIED_DIRECT_FILE_EVIDENCE` (40) + `DERIVED_REPRODUCIBLE`
6. **Hierarchy** title block (title + subtitle) → `margin-left:auto` cluster: search box, 7D/30D/90D segmented control, bell icon, MR avatar. `VERIFIED_DIRECT_FILE_EVIDENCE` — 41, 42
7. **Copy** `Overview`; `Tuesday, April 22 · 4 items need attention · next meeting in 1h 20m`; `Search…`; `⌘K`; `7D` `30D` `90D`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 41, 42
8. **Tokens** `--cc-body-surface #fff`, `--cc-body-line #D9DFE2`, `--cc-body-t3 #7A868D`, `--cc-line-strong #CDD5D9`, `--cc-ink-strong #212528`.
9. **Spacing** `padding:0 24px; gap:16px`; search box `width:300px; height:36px; padding:0 12px; gap:9px`; segment `padding:8px 12px`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 40, 42
10. **Typography** title 16px/600; subtitle 11.5px; search text 13px; `⌘K` and segments `'IBM Plex Mono'` 10-11px. `VERIFIED_DIRECT_FILE_EVIDENCE` — 41, 42
11. **Colors** bar `#fff`; bottom border `#D9DFE2`; subtitle `#7A868D`; search field `#F1F4F5`; active segment `#212528`/white; inactive segment `#5A6B74`; avatar `#3D5B45`/`#DCEFE0`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 40, 42
12. **Borders** `border-bottom:1px solid #D9DFE2`; search `1px solid #D9DFE2`; segmented group `1px solid #D9DFE2`; `⌘K` `1px solid #CDD5D9`.
13. **Radii** search `6px`; segmented group `6px`; `⌘K` `4px`; avatar `7px`.
14. **Shadows** none.
15. **Icons** magnifier (`circle cx=11 cy=11 r=7` + `m21 21-4.3-4.3`, stroke `#7A868D` width 2) and bell (`M6 8a6 6 0 0 1 12 0…`, stroke `#3E4A52` width 1.75). `VERIFIED_DIRECT_FILE_EVIDENCE` — line 42
16. **Controls** search field, 3-way date-range segmented control, notifications, account avatar.
17. **Responsive behavior** at 820 the header keeps only title+subtitle and the date segments (line 858); at 390 it becomes hamburger / brand / avatar (line 1041). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** no application header exists on desktop. `(shell)/layout.tsx` renders `ShellMobileHeader` (`md:hidden`) and the page supplies `<h1 className="text-lg font-medium">Overview</h1>` inside the scrolling main. `VERIFIED_DIRECT_FILE_EVIDENCE` — `layout.tsx` 12-16, `dashboard/page.tsx` 18, `mobile-nav-drawer.tsx` 22
19. **Exact discrepancy** the entire 56px header region is missing at ≥md: no title/subtitle bar, no search, no date-range segments, no bell, no avatar. The page title renders as body content instead, at the wrong size and position.
20. **Required correction** add a `ShellHeader` region rendered at all breakpoints with the canonical 56px bar; move the page title into it; add the search field, segmented date-range control, notification icon and avatar; the existing `DateRangeFilter` component should be reused if it can be made to match, replaced if it cannot.
21. **Target component** new/expanded `ShellHeader`; `DateRangeFilter`.
22. **Target file** `command-center/packages/ui/src/mobile-nav-drawer.tsx` (current `ShellHeader` home), `packages/ui/src/date-range-filter.tsx`, `apps/web/app/(shell)/layout.tsx`.
23. **Acceptance evidence** `diff-overview-desktop-1440x1000.png` clean in y∈[0,56]; owner review.

### C-D01/R4 — KPI strip

1. **Frame ID** C-D01.
2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 45-47 (container + `sc-for`), data at 1325-1329, cell style helper `kc` at 1323, pill helper at 1324. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`.
5. **Dimensions** one card spanning the content width, `grid-template-columns:repeat(4,1fr)`, `margin-bottom:14px`, `flex-shrink:0`. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 45
6. **Hierarchy** single bordered card → 4 cells → each: label + trend pill on one row, value, context line. `VERIFIED_DIRECT_FILE_EVIDENCE` — 45, 46
7. **Copy** `NEW LEADS` / 34 / `+18%` / `12 this week · Google brand is top source`; `AWAITING CONTACT` / 9 / `ACTION` / `oldest waiting 6h — Dana Whitfield`; `APPOINTMENTS` / 7 / `3 TODAY` / `next in 1h 20m · Alicia F. · 10:00 AM`; `OVERDUE FOLLOW-UPS` / 4 / `+2` / `3 owned by Priya · 1 unassigned · 68% booking completion`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1325-1329
8. **Tokens** surface `#fff`, line `#D9DFE2`, header text `#55636B`, t3 `#7A868D`, red `#A63D2B`, and the four semantic pill triplets.
9. **Spacing** cell `padding:16px 20px`; value `margin-top:10px`; context `margin-top:8px`; pill `padding:1px 6px`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1323, 1324, 46
10. **Typography** label 11px/700/`letter-spacing:.1em`; value `'IBM Plex Mono'` **32px**/600/`line-height:1`; context 11.5px; pill `'IBM Plex Mono'` 10.5px/600. `VERIFIED_DIRECT_FILE_EVIDENCE` — 46, 1324
11. **Colors** values `#1B2226` except OVERDUE `#A63D2B`; pills green/amber/blue/red ink-on-tint. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1325-1329
12. **Borders** one outer `1px solid #D9DFE2`; internal separators are `border-left:1px solid #E2E7EA` on cells 2-4 only. `VERIFIED_DIRECT_FILE_EVIDENCE` — 45, 1323
13. **Radii** container `8px` with `overflow:hidden`; cells none; pills `4px`.
14. **Shadows** none.
15. **Icons** none — the canonical KPI cell has a trend **pill**, not an icon.
16. **Controls** none (static tiles).
17. **Responsive behavior** 4-across at 1440; 2×2 inside one card at 820 (line 860); 2-up as two separate small cards at 390, and only NEW LEADS + OVERDUE survive (lines 1048-1051). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** four separate `KpiCard` elements in `grid-cols-2 xl:grid-cols-4 gap-4`, each `rounded-cc-card border p-4`, label `text-sm text-cc-t2`, value `font-cc-mono text-2xl`, optional icon square, no trend pill; labels are `Total Leads / New / Contacted / Won` derived from `facetCounts`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `kpi-card.tsx` 16-51, `overview-data.tsx` 52-56
19. **Exact discrepancy** (a) four detached gapped cards vs one seamless 4-cell card; (b) labels are the wrong four metrics; (c) values are dataset aggregates, not the canonical 34/9/7/4; (d) no trend pill; (e) value 24px vs 32px; (f) label 14px sentence-case vs 11px/700 uppercase tracked; (g) no context line; (h) an icon slot exists that canonical does not use.
20. **Required correction** rebuild as a single 4-cell card with the canonical label set, values, pills and context lines. Values 34/9/7/4 are canonical display values and are reproduced as such; where a value cannot come from a contract it stays a documented design-authority constant, labelled synthetic **in data-source documentation only, never in the UI**.
21. **Target component** `KpiCard` (recast as a KPI strip) + `OverviewData`.
22. **Target file** `command-center/packages/ui/src/kpi-card.tsx`, `apps/web/app/(shell)/dashboard/overview-data.tsx`.
23. **Acceptance evidence** `diff-overview-desktop-1440x1000.png` clean across the KPI band; comparison JSON `worst_bands_y` no longer lists that band.

### C-D01/R5 — Lead Flow card

1. **Frame ID** C-D01.
2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 50-55; geometry at 1341-1349. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`.
5. **Dimensions** left column of a `1fr 372px` grid; SVG `width:100%; height:160; viewBox="0 0 1090 212"; preserveAspectRatio="none"`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 48, 52
6. **Hierarchy** title+subtitle | four right-aligned stat blocks → SVG → x-axis labels → legend row. `VERIFIED_DIRECT_FILE_EVIDENCE` — 51-54
7. **Copy** `Lead Flow`; `How new inquiries move from received to contacted and won · Mar 3 – Apr 22 vs prior period`; `34 received`, `26 contacted`, `12 won`, `35% recv→won · ▲4.2pp`; labels `Mar 3 … This wk`; legend `Received (area)`, `Contacted`, `Won`, `76% CONTACT RATE · 35% WIN RATE`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 51, 53, 54, 1349
8. **Tokens** `--cc-body-t2 #5A6B74` area fill, `--cc-amber-…`, `--cc-green #2F7D4F`, neutral `#8B979D`.
9. **Spacing** header `padding:14px 18px 0`; stat blocks `gap:18px`; SVG `padding:2px 10px 0`; labels `padding:2px 26px 5px`; legend `padding:0 18px 7px; gap:16px`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 51-54
10. **Typography** title 15px/600; subtitle 12px; stat numbers `'IBM Plex Mono'` 17px/600; stat captions 10.5px; axis labels `'IBM Plex Mono'` 10px; legend 11.5px. `VERIFIED_DIRECT_FILE_EVIDENCE` — 51-54
11. **Colors** received line `#8B979D` (1.75), contacted `#D9A94E` (2.25), won `#2F7D4F` (2.5), area `#5A6B74` at `.12`, won dots `r=3.5` `#2F7D4F`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 52
12. **Borders** card `1px solid #D9DFE2`.
13. **Radii** card `8px`; legend swatches are 10×3px bars, unrounded.
14. **Shadows** none.
15. **Icons** none.
16. **Controls** none in C-D01 (hover tooltip is C-D02, out of scope).
17. **Responsive behavior** at 820 it drops the stat blocks and legend and shrinks to `height:150` with a one-line summary (871-873); at 390 it collapses to a two-line summary with an `Expand ▾` affordance and **no chart** (1056-1059). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** `ChartContainer title="Lead Flow" points={aggregateLeadFlowByDay(data.rows.map(l => l.createdAt))}` — a single series derived from the ten loaded rows' `createdAt`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `overview-data.tsx` 51, 58
19. **Exact discrepancy** one series vs three plus an area; no stat blocks, no legend, no axis labels, no win-rate footer; the series is derived from the current page of leads rather than the canonical six-point weekly series.
20. **Required correction** rebuild as the canonical three-series area/line chart with the exact six-point geometry, stat blocks, axis labels and legend. Series values are canonical display data (lines 1342-1349).
21. **Target component** `ChartContainer` (or a new `LeadFlowChart`).
22. **Target file** `command-center/packages/ui/src/chart-container.tsx`.
23. **Acceptance evidence** owner review of `side-by-side-overview-desktop-1440x1000.png`; band mismatch for the chart rows reported in the comparison JSON.

### C-D01/R6 — Today's work card

1. **Frame ID** C-D01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 56-59; data `wq` at 1330-1334. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`.
5. **Dimensions** second card in the left column, `gap:18px` below Lead Flow; rows `height:40px`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 49, 58
6. **Hierarchy** header (`Today's work · 7 open` + `View queue`) → 4 rows of: colour chip, title, meta, tag, CTA pill.
7. **Copy** four rows: Call Ruben Ortega — first contact / OVERDUE / Open; Review discovery meeting — Priyanka Rao / REVIEW / Review; Proposal follow-up — Gregory Mullins / DUE TODAY / Open; Appointment — Alicia Fenwick / TODAY / Prepare. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1331-1334
8. **Tokens** red `#A63D2B`, blue `#46708E`, amber `#B07C24`, green `#2F7D4F`; row line `#EEF1F3`.
9. **Spacing** header `padding:12px 18px`; rows `padding:0 18px; gap:14px`; CTA `padding:5px 10px`.
10. **Typography** header 15px/600 with a mono `· 7 open` suffix at 11px; title 13.5px/600; meta 12px; tag `'IBM Plex Mono'` 10px/600/`.08em`; CTA 12px/600.
11. **Colors** chip and tag take the row's semantic colour; CTA text `#3E4A52` on `#fff`.
12. **Borders** header `border-bottom:1px solid #E2E7EA`; rows `border-bottom:1px solid #EEF1F3`; CTA `1px solid #CDD5D9`.
13. **Radii** card `8px`; chip `2px`; CTA `5px`.
14. **Shadows** none.
15. **Icons** none — the leading element is an 8×8 square chip, not an icon.
16. **Controls** `View queue` link; one CTA per row.
17. **Responsive behavior** at 820 the row becomes a two-line block with a 3px inset left stripe and no CTA (line 868); at 390 it is a compact title+tag row (line 1046). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** absent. `VERIFIED_DIRECT_FILE_EVIDENCE` — `dashboard/page.tsx` 16-30 renders only `OverviewData` and `PipelineJourney`.
19. **Exact discrepancy** whole region missing at every breakpoint.
20. **Required correction** build a `TodaysWork` component with the canonical four rows; source them from a documented design-authority fixture, since no contract supplies a work queue.
21. **Target component** new `TodaysWork`.
22. **Target file** `command-center/packages/ui/src/todays-work.tsx` (new), `apps/web/mocks/fixtures/` (new fixture), `apps/web/app/(shell)/dashboard/page.tsx`.
23. **Acceptance evidence** region present in `implementation-overview-*.png` at all three sizes; owner review.

### C-D01/R7 — Pipeline Journey card

1. **Frame ID** C-D01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 62-66; data 1351-1359. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`, right column.
5. **Dimensions** first card of the 372px right column. `VERIFIED_DIRECT_FILE_EVIDENCE` — 48, 61
6. **Hierarchy** title + `86 active · 6 phases · all 11 statuses inside` → 6 phase rows → footer note.
7. **Copy** phases Intake 25 `entry phase` avg 1.1 days; Appointment 16 `74% from Intake` 2.0 days + alert `3 waiting > 48h`; Discovery 8 `62% from Appointment` 3.4 days; Proposal 13 `81% from Discovery` 4.2 days + alert `2 unviewed 5+ days`; Decision 5 `38% from Proposal` 6.5 days; Outcome 19 `63% win rate` avg `—`. Footer `Hover or expand a phase for its exact statuses → C-D04`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1353-1359, 65
8. **Tokens** blue/amber/green semantic bases; `#EEF1F3` separators.
9. **Spacing** header `padding:12px 16px 10px`; rows `padding:7px 16px; gap:12px`; footer `padding:7px 16px 8px`.
10. **Typography** title 15px/600; subtitle 11.5px; phase name 13px/600; count `'IBM Plex Mono'` 11px; conv/age 11px; alert 10.5px/600.
11. **Colors** per-phase marker colour; alert `#8A5F17` on `#F4EBD4`.
12. **Borders** card `1px solid #D9DFE2`; each row `border-top:1px solid #EEF1F3`.
13. **Radii** card `8px`; phase marker `3px`; alert `4px`.
14. **Shadows** none.
15. **Icons** none — the phase marker is a **6×30px vertical bar**, `border-radius:3px`. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 64
16. **Controls** none in this widget.
17. **Responsive behavior** at 820 it becomes a 3-column grid of small bordered phase tiles (877-879); at 390 a single summary line naming the bottleneck (1060-1062). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** `PipelineJourney` renders `<li className="… border-l-4 …">` with a name/count row, a full-width segmented progress bar, a conversion line and a pill-shaped alert; wrapped by `page.tsx` in `grid-cols-1 xl:grid-cols-2`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `pipeline-journey.tsx` 46-101, `dashboard/page.tsx` 22-27
19. **Exact discrepancy** (a) placed in a half-width grid in the main column instead of the 372px right rail; (b) `border-l-4` on the `li` instead of a detached 6×30 rounded bar; (c) a segmented progress bar canonical does **not** show in C-D01 (segments belong to C-D03, line 119); (d) alert is a full pill (`rounded-full`) vs `4px`; (e) row separators missing; (f) footer text drops `→ C-D04`.
20. **Required correction** re-place into the right rail, replace the border-left with the canonical marker bar, remove the C-D03 progress segments from the C-D01 variant, correct alert radius and row separators.
21. **Target component** `PipelineJourney`.
22. **Target file** `command-center/packages/ui/src/pipeline-journey.tsx`, `apps/web/app/(shell)/dashboard/page.tsx`.
23. **Acceptance evidence** diff clean in the right rail; owner review.

### C-D01/R8 — Meetings & proposals card

1. **Frame ID** C-D01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 67-71. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`, right column, second card.
5. **Dimensions** auto height; two rows.
6. **Hierarchy** header `Meetings & proposals` → row(icon tile, title, subtitle, action) ×2.
7. **Copy** `2 meetings need review` / `Solterra discovery · Northwind no-show` / `Review`; `3 proposals awaiting action` / `1 internal review · 1 viewed · 1 expiring Fri` / `Open`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 69, 70
8. **Tokens** blue tint `#E3EDF4`/ink `#33566E`; green tint `#E2F0E7`/ink `#276B42`; action text `#2F7D4F`.
9. **Spacing** header `padding:12px 16px`; rows `padding:11px 16px; gap:11px`.
10. **Typography** header 13px/600; row title 12.5px/600; subtitle 11px; action 11.5px/600.
11. **Colors** as tokens above.
12. **Borders** card `1px solid #D9DFE2`; header `border-bottom:1px solid #E2E7EA`; first row `border-bottom:1px solid #EEF1F3`.
13. **Radii** card `8px`; icon tile `6px`.
14. **Shadows** none.
15. **Icons** two, both inline 15×15 stroke-1.9 in a 30×30 tinted tile: a video-camera (`M23 7l-7 5 7 5V7z` + `rect x=1 y=5 w=15 h=14 rx=2`) and a document (`M14 2H6a2 2 0 0 0-2 2v16…` + `M14 2v6h6`). `VERIFIED_DIRECT_FILE_EVIDENCE` — 69, 70
16. **Controls** `Review`, `Open`.
17. **Responsive behavior** absent at 820; at 390 it survives as two chip rows with 8×8 square markers instead of icon tiles (1052-1055). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** absent.
19. **Exact discrepancy** whole region missing.
20. **Required correction** build the card; the two icons are canonical SVG definitions and must be copied from the source, not redrawn.
21. **Target component** new `MeetingsProposalsCard`.
22. **Target file** `command-center/packages/ui/src/meetings-proposals-card.tsx` (new), `apps/web/app/(shell)/dashboard/page.tsx`.
23. **Acceptance evidence** region present in the implementation capture; owner review.

### C-D01/R9 — Recent activity card

1. **Frame ID** C-D01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 72-75; data `act` at 1335-1340. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-desktop-1440x1000.png`, right column, third card.
5. **Dimensions** `flex:1; min-height:0; overflow:hidden` — it absorbs the remaining right-rail height and clips. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 72
6. **Hierarchy** header → activity rows (chip, text, relative time).
7. **Copy** five entries exist in data (`act`, 1336-1340) but `hint-placeholder-count="4"`; how many are visible is a rendering outcome, not a source fact. Entry text: meeting analysis ready (32m), PRO-2031 viewed (1h), confirmation email delivered (2h), reminder failed (5h), Priya moved Derrick Vaughn (1d). `VERIFIED_DIRECT_FILE_EVIDENCE` for the data; visible count `UNKNOWN_PENDING_REVIEW` until read off the canonical PNG.
8. **Tokens** blue/green/red/neutral `#85826F`; text `#3E4A52`; time `#8B979D`.
9. **Spacing** header `padding:12px 16px`; rows `padding:6px 16px; gap:11px`; chip `margin-top:4px`.
10. **Typography** header 13px/600; body 12px `line-height:1.45`; time `'IBM Plex Mono'` 10px.
11. **Colors** per-entry chip colour from `act[].color`.
12. **Borders** card `1px solid #D9DFE2`; header `border-bottom:1px solid #E2E7EA`; rows `border-bottom:1px solid #EEF1F3`.
13. **Radii** card `8px`; chip `2px`.
14. **Shadows** none.
15. **Icons** none — 8×8 square chips.
16. **Controls** none.
17. **Responsive behavior** absent at 820; at 390 reduced to one `Recent:` line inside the next-appointment card (line 1064). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** absent.
19. **Exact discrepancy** whole region missing.
20. **Required correction** build the card, clipping to the remaining right-rail height exactly as canonical does.
21. **Target component** new `RecentActivityCard`.
22. **Target file** `command-center/packages/ui/src/recent-activity-card.tsx` (new), `apps/web/app/(shell)/dashboard/page.tsx`.
23. **Acceptance evidence** region present and clipped, not scrolling; owner review.

---

## 2.4 T-01 — OVERVIEW TABLET (820×1180)

### T-01/R1 — Frame container

1. **Frame ID** T-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 846; `div[data-screen-label="T-01 Overview tablet"]`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-tablet-820x1180.png`.
5. **Dimensions** `width:820px; height:1180px`, border inside the box.
6. **Hierarchy** `[aside 72px | column]`; column = header 56px + content.
7. **Copy** none.
8. **Tokens** canvas `#EDF0F2`, border `#CDD5D9`.
9. **Spacing** none at this level.
10. **Typography** inherited.
11. **Colors** `#EDF0F2` / `#CDD5D9`.
12. **Borders** `1px solid #CDD5D9`.
13. **Radii** none.
14. **Shadows** `0 20px 48px rgba(20,26,30,.10)` — canvas chrome, outside the artboard.
15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** the frame header text is explicit that all tablet frames are `RECOMPOSED (NOT SCALED)`. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 844
18. **Current implementation** same shell as C-D01/R1; at 820 the `md:flex-row` branch applies. `VERIFIED_DIRECT_FILE_EVIDENCE` — `layout.tsx` 12
19. **Exact discrepancy** measured `viewport_overflow_px=0` at 820×1180, so height behaviour is currently incidental-correct; the content composition inside is what differs. `VERIFIED_REPRODUCIBLE_COMMAND` — capture log
20. **Required correction** none at this level beyond the shared `h-screen` fix from C-D01/R1.
21. **Target component** `ShellLayout`. 22. **Target file** `apps/web/app/(shell)/layout.tsx`.
23. **Acceptance evidence** `comparison-overview-tablet-820x1180.json`.

### T-01/R2 — Icon rail (72px)

1. **Frame ID** T-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 847-856; `aside`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-tablet-820x1180.png`, left 72px.
5. **Dimensions** `width:72px; flex-shrink:0`; brand mark 30×30; each icon slot 44×40; account 30×30. `VERIFIED_DIRECT_FILE_EVIDENCE` — 847-855
6. **Hierarchy** brand mark → six icon slots → `margin-top:auto` account avatar.
7. **Copy** none except the `MR` avatar initials.
8. **Tokens** ink `#14130E`; raised `#26231A`; rail `#5C9B6C`; text `#A19C8B`; active `#F4F1E6`.
9. **Spacing** `padding:22px 0 16px; align-items:center`; brand `margin-bottom:14px`.
10. **Typography** avatar 11px/600.
11. **Colors** active icon `#F4F1E6`, inactive `#A19C8B`; brand dot `#7FBC8C` on `#26231A`.
12. **Borders** none.
13. **Radii** brand tile `8px`; brand dot `3px`; avatar `7px`; icon slots unrounded.
14. **Shadows** active slot `inset 2px 0 0 #5C9B6C`.
15. **Icons** **six** canonical 18×18 stroke-1.75 SVGs, defined literally at lines 849-854 — dashboard (four rects), leads (person), pipeline (three bars), appointments (calendar), meetings (video), proposals (document). These are the canonical icon system. `VERIFIED_DIRECT_FILE_EVIDENCE`
16. **Controls** six nav targets + avatar.
17. **Responsive behavior** this rail exists only at tablet; expanded at desktop, replaced by a drawer at mobile.
18. **Current implementation** `Sidebar` at `w-[72px]` below xl, rendering **ten** hand-drawn icons from `nav-icons.tsx` plus hidden labels, hidden group labels and hidden badges, with rounded `px-2 py-2` rows and a raised active background. `VERIFIED_DIRECT_FILE_EVIDENCE` — `sidebar.tsx` 66-99, 116-125; `nav-icons.tsx` 41-49
19. **Exact discrepancy** (a) ten slots vs six; (b) hand-drawn icon paths vs the canonical SVGs at 849-854 — the owner's instruction names this explicitly; (c) no brand mark; (d) no account avatar; (e) slot geometry `px-2 py-2` vs 44×40 centred; (f) raised background on active instead of the stripe alone.
20. **Required correction** replace `nav-icons.tsx` paths with the canonical SVG definitions copied from CANON 849-854; reduce the tablet rail to the canonical six slots; add brand mark and account avatar; match slot geometry and active treatment.
21. **Target component** `Sidebar` / `NavIcon`.
22. **Target file** `command-center/packages/ui/src/nav-icons.tsx`, `packages/ui/src/sidebar.tsx`.
23. **Acceptance evidence** `diff-overview-tablet-820x1180.png` clean in x∈[0,72]; owner review.

### T-01/R3 — Header (56px)

1. **Frame ID** T-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 858; `header`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-tablet-820x1180.png`.
5. **Dimensions** `height:56px; padding:0 20px`; width 820 − 72 − 2 = 746px. `DERIVED_REPRODUCIBLE`
6. **Hierarchy** title+subtitle | 7D/30D/90D segmented control. Nothing else.
7. **Copy** `Overview`; `Tuesday, April 22 · 4 items need attention` (**shorter** than desktop — the `next meeting` clause is dropped); `7D` `30D` `90D`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 858 vs 41
8. **Tokens** surface `#fff`; line `#D9DFE2`; t3 `#7A868D`; ink-strong `#212528`.
9. **Spacing** `padding:0 20px`; segment `padding:7px 11px`.
10. **Typography** title 15.5px/600 (desktop is 16px); subtitle 11px (desktop 11.5px); segments `'IBM Plex Mono'` 10.5px.
11. **Colors** as desktop.
12. **Borders** `border-bottom:1px solid #D9DFE2`; segmented group `1px solid #D9DFE2`.
13. **Radii** segmented group `6px`.
14. **Shadows** none. 15. **Icons** none — no search field, no bell, no avatar at this size.
16. **Controls** date-range segmented control only.
17. **Responsive behavior** desktop adds search/bell/avatar; mobile replaces the whole bar.
18. **Current implementation** absent at this breakpoint (`ShellHeader` is `md:hidden`). `VERIFIED_DIRECT_FILE_EVIDENCE` — `mobile-nav-drawer.tsx` 22
19. **Exact discrepancy** whole region missing.
20. **Required correction** render the shared header at ≥md with the tablet reduction: title+subtitle+segments only.
21. **Target component** `ShellHeader`. 22. **Target file** `packages/ui/src/mobile-nav-drawer.tsx`, `apps/web/app/(shell)/layout.tsx`.
23. **Acceptance evidence** diff clean in y∈[0,56] at 820; owner review.

### T-01/R4 — KPI 2×2

1. **Frame ID** T-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 860-865. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-tablet-820x1180.png`.
5. **Dimensions** one card, `grid-template-columns:1fr 1fr`, `margin-bottom:16px`.
6. **Hierarchy** four cells in a 2×2 inside a single bordered card.
7. **Copy** `NEW LEADS` 34 `+18%`; `AWAITING CONTACT` 9 `ACTION`; `APPOINTMENTS` 7 `3 TODAY`; `OVERDUE` 4 `+2`. Note the fourth label is **`OVERDUE`**, not the desktop `OVERDUE FOLLOW-UPS`; the context sentences are dropped entirely. `VERIFIED_DIRECT_FILE_EVIDENCE` — 861-864 vs 1325-1329
8. **Tokens** as desktop.
9. **Spacing** cell `padding:14px 18px`; value row `margin-top:8px; gap:9px`.
10. **Typography** label 11px/700/`.1em`; value `'IBM Plex Mono'` **28px**/600 (desktop 32px); pill `'IBM Plex Mono'` 10px.
11. **Colors** OVERDUE value `#A63D2B`; pills as desktop.
12. **Borders** card `1px solid #D9DFE2`; internal `border-bottom` on the top two cells and `border-left` on the right column, both `#E2E7EA`.
13. **Radii** card `8px`; pills `4px`.
14. **Shadows** none. 15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** 4-across at desktop; two tiles only at mobile.
18. **Current implementation** `grid-cols-2` of detached `KpiCard`s with the wrong label set (see C-D01/R4). `VERIFIED_DIRECT_FILE_EVIDENCE`
19. **Exact discrepancy** as C-D01/R4, plus: no context line is expected here, and the fourth label must shorten to `OVERDUE`.
20. **Required correction** one card, 2×2, canonical labels/values/pills, 28px values, context lines suppressed at this breakpoint.
21. **Target component** KPI strip. 22. **Target file** `packages/ui/src/kpi-card.tsx`.
23. **Acceptance evidence** diff clean across the KPI band at 820.

### T-01/R5 — Today's work (tablet)

1. **Frame ID** T-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 866-869. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-tablet-820x1180.png`.
5. **Dimensions** `min-height:46px` rows; card `margin-bottom:16px`.
6. **Hierarchy** header (`Today's work · 7 open` + `View queue`) → four two-line rows.
7. **Copy** same four `wq` entries; the CTA button is **dropped** at this size.
8. **Tokens** semantic row colours as desktop.
9. **Spacing** header `padding:11px 16px`; rows `padding:6px 16px; gap:12px`.
10. **Typography** header 13px/600; title 13px/600; meta 11px; tag `'IBM Plex Mono'` 9px/600.
11. **Colors** tag takes the row colour; the leading colour chip is replaced by `box-shadow:inset 3px 0 0 {tc}`.
12. **Borders** card `1px solid #D9DFE2`; header `border-bottom:1px solid #E2E7EA`; rows `#EEF1F3`.
13. **Radii** card `8px`. 14. **Shadows** the 3px inset left stripe per row. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 868
15. **Icons** none. 16. **Controls** `View queue` only.
17. **Responsive behavior** desktop adds a CTA pill and a square chip; mobile drops the meta line.
18. **Current implementation** absent. 19. **Exact discrepancy** whole region missing.
20. **Required correction** build with the tablet variant: inset stripe, two-line row, no CTA.
21. **Target component** new `TodaysWork`. 22. **Target file** `packages/ui/src/todays-work.tsx` (new).
23. **Acceptance evidence** present in `implementation-overview-tablet-820x1180.png`.

### T-01/R6 — Lead Flow (tablet)

1. **Frame ID** T-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 870-874. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-tablet-820x1180.png`.
5. **Dimensions** SVG `height:150`, same `viewBox="0 0 1090 212"`.
6. **Hierarchy** title → one-line summary → SVG → axis labels.
7. **Copy** `Lead Flow`; `34 received · 26 contacted · 12 won · 35% recv→won`; six axis labels.
8. **Tokens** same series colours.
9. **Spacing** header `padding:11px 16px 0`; SVG `padding:4px 8px 0`; labels `padding:2px 20px 10px`.
10. **Typography** title 13px/600; summary 10.5px; axis labels `'IBM Plex Mono'` 9.5px.
11. **Colors** stroke widths thicken: received 2, contacted 2.5, won 3 (desktop 1.75/2.25/2.5). `VERIFIED_DIRECT_FILE_EVIDENCE` — 872 vs 52
12. **Borders** card `1px solid #D9DFE2`. 13. **Radii** `8px`. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** none. 17. **Responsive behavior** no legend, no stat blocks, no won-dots at this size.
18. **Current implementation** single-series `ChartContainer`. 19. **Exact discrepancy** as C-D01/R5 plus the tablet stroke widths and the dropped decorations.
20. **Required correction** one chart component with a breakpoint-aware variant.
21. **Target component** `ChartContainer`. 22. **Target file** `packages/ui/src/chart-container.tsx`.
23. **Acceptance evidence** owner review of the tablet side-by-side.

### T-01/R7 — Pipeline Journey (tablet)

1. **Frame ID** T-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 875-880. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-tablet-820x1180.png`.
5. **Dimensions** `grid-template-columns:repeat(3,1fr); gap:9px` — six tiles in 3×2.
6. **Hierarchy** header line → 6 bordered tiles, each: dot + name, count, conversion.
7. **Copy** `Pipeline Journey · 86 ACTIVE · TAP A PHASE FOR EXACT STATUSES`; per tile name/count/conv. Age text and alerts are **dropped** at this size. `VERIFIED_DIRECT_FILE_EVIDENCE` — 876, 878
8. **Tokens** per-phase colours.
9. **Spacing** header `padding:11px 16px 8px`; grid `padding:0 16px 14px`; tile `padding:9px 11px`.
10. **Typography** header 13px/600 + mono 10px suffix; tile name 11.5px/600; count `'IBM Plex Mono'` 17px/600; conv 9.5px.
11. **Colors** dot 7×7 in the phase colour.
12. **Borders** card `1px solid #D9DFE2`; each tile `1px solid #D9DFE2`.
13. **Radii** card `8px`; tile `6px`; dot `2px`. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** tap-to-expand (annotation only at this frame).
17. **Responsive behavior** desktop is a vertical 6-row list; mobile is a single summary line.
18. **Current implementation** `PipelineJourney` renders the same vertical list at every width inside `grid-cols-1 xl:grid-cols-2`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `pipeline-journey.tsx` 58-99
19. **Exact discrepancy** no 3×2 tile variant exists; age/alert not suppressed; progress segments shown where canonical shows none.
20. **Required correction** add the tablet tile variant.
21. **Target component** `PipelineJourney`. 22. **Target file** `packages/ui/src/pipeline-journey.tsx`.
23. **Acceptance evidence** diff clean across the pipeline band at 820.

---

## 2.5 MO-01 — OVERVIEW MOBILE (390×844)

### MO-01/R1 — Frame container

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 1040. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`.
5. **Dimensions** `width:390px; height:844px`; `flex-direction:column; overflow:hidden` — **no sidebar element at all**.
6. **Hierarchy** `header 56px` → `content flex:1 overflow:hidden`.
7. **Copy** none at this level. 8. **Tokens** canvas `#EDF0F2`, border `#CDD5D9`.
9. **Spacing** none. 10. **Typography** inherited. 11. **Colors** `#EDF0F2`/`#CDD5D9`.
12. **Borders** `1px solid #CDD5D9`. 13. **Radii** none. 14. **Shadows** canvas chrome only.
15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** frame-set annotation: `RECOMPOSED FOR TOUCH (44px TARGETS) · NO HOVER-ONLY ACTIONS · NO HORIZONTAL OVERFLOW`. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1037
18. **Current implementation** `flex min-h-screen flex-col` + scrolling `main p-6`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `layout.tsx` 12-16
19. **Exact discrepancy** measured `viewport_overflow_px=407` at 390×844 — the implementation is 48% taller than the canonical frame and therefore cannot match it without recomposition. `VERIFIED_REPRODUCIBLE_COMMAND` — capture log `[OK] implementation-overview-mobile-390x844.png 390x844 overflow=407px`
20. **Required correction** recompose the mobile Overview to the canonical card set and order so the content fits 844px; fixed-height shell as in C-D01/R1.
21. **Target component** `ShellLayout` + `DashboardPage`. 22. **Target file** `apps/web/app/(shell)/layout.tsx`, `apps/web/app/(shell)/dashboard/page.tsx`.
23. **Acceptance evidence** capture sidecar `viewport_overflow_px: 0` at 390×844; owner review.

### MO-01/R2 — Mobile header

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 1041; `header`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`, top 56px.
5. **Dimensions** `height:56px; padding:0 16px`; avatar 32×32.
6. **Hierarchy** hamburger | brand wordmark | avatar — three items, `justify-content:space-between`.
7. **Copy** `Code`+bold`Outfitters`; `MR`.
8. **Tokens** surface `#fff`; line `#D9DFE2`; avatar `#3D5B45`/`#DCEFE0`.
9. **Spacing** `padding:0 16px`.
10. **Typography** brand `'Geist'` 14.5px; avatar 11px/600.
11. **Colors** **white** bar with `#1B2226` hamburger — not an ink bar. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1041
12. **Borders** `border-bottom:1px solid #D9DFE2`. 13. **Radii** avatar `7px`. 14. **Shadows** none.
15. **Icons** one: 20×20 stroke-1.9 `M3 6h18M3 12h18M3 18h18` in `#1B2226`. `VERIFIED_DIRECT_FILE_EVIDENCE` — line 1041
16. **Controls** hamburger (opens MO-05 drawer), avatar.
17. **Responsive behavior** exists only below the tablet breakpoint.
18. **Current implementation** `ShellHeader` renders `h-14` (56px ✓) but `bg-cc-sidebar-ink text-cc-sidebar-active`, a 24×24 `M4 7h16M4 12h16M4 17h16` hamburger, a text brand `CodeOutfitters` with no bold split, and a **blank 40×40 spacer** where the avatar belongs. `VERIFIED_DIRECT_FILE_EVIDENCE` — `mobile-nav-drawer.tsx` 22-45
19. **Exact discrepancy** (a) ink background vs white; (b) hamburger geometry and stroke differ; (c) no `Code`/**Outfitters** weight split; (d) avatar replaced by an empty spacer; (e) no bottom border in the canonical colour.
20. **Required correction** restyle to the canonical white bar, copy the canonical hamburger path, restore the brand weight split and the MR avatar.
21. **Target component** `ShellHeader`. 22. **Target file** `packages/ui/src/mobile-nav-drawer.tsx`.
23. **Acceptance evidence** diff clean in y∈[0,56] at 390; owner review.

### MO-01/R3 — Page title block

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 1043. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`.
5. **Dimensions** first block inside `padding:14px 16px` content.
6. **Hierarchy** title then subtitle. 7. **Copy** `Overview`; `Tue Apr 22 · 4 items need attention` (further abbreviated from tablet).
8. **Tokens** ink `#1B2226`; t3 `#7A868D`. 9. **Spacing** content `padding:14px 16px`.
10. **Typography** title **18px**/600 — larger than the desktop header title; subtitle 11px. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1043
11. **Colors** as tokens. 12. **Borders** none. 13. **Radii** none. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** the title lives in the header at ≥md and in the content at mobile.
18. **Current implementation** `<h1 className="text-lg font-medium text-cc-ink">Overview</h1>` (18px ✓ size, 500 weight) with **no subtitle**, inside `main p-6` (24px padding). `VERIFIED_DIRECT_FILE_EVIDENCE` — `dashboard/page.tsx` 18
19. **Exact discrepancy** missing subtitle; weight 500 vs 600; content padding 24px vs 16px horizontal / 14px top.
20. **Required correction** add the subtitle, correct weight and content padding.
21. **Target component** `DashboardPage` + `ShellLayout`. 22. **Target file** `apps/web/app/(shell)/dashboard/page.tsx`, `apps/web/app/(shell)/layout.tsx`.
23. **Acceptance evidence** diff clean in the title band at 390.

### MO-01/R4 — Today's work (mobile)

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 1044-1047. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`.
5. **Dimensions** card `margin-top:11px`; rows `padding:9px 13px`.
6. **Hierarchy** section header `TODAY'S WORK · 7` → four single-line rows (title ellipsised + tag).
7. **Copy** header `TODAY'S WORK · 7`; the four `wq` titles; tags OVERDUE/REVIEW/DUE TODAY/TODAY. The meta line is **dropped** at this size. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1045, 1046
8. **Tokens** header text `#55636B`; semantic row colours.
9. **Spacing** header `padding:9px 13px`; rows `padding:9px 13px`; inner `gap:8px`.
10. **Typography** header 11px/700/`.08em`; title 12px/600; tag `'IBM Plex Mono'` 8.5px/600.
11. **Colors** tag takes the row colour; inset stripe in the same colour.
12. **Borders** card `1px solid #D9DFE2`; header `border-bottom:1px solid #E2E7EA`; rows `#EEF1F3`.
13. **Radii** card `8px`. 14. **Shadows** `inset 3px 0 0 {tc}` per row.
15. **Icons** none. 16. **Controls** none — no CTA, no link at this size.
17. **Responsive behavior** this is the most reduced of the three variants; it is also the **first** content card on mobile, above the KPIs — the desktop order is inverted. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1044 precedes 1048
18. **Current implementation** absent. 19. **Exact discrepancy** whole region missing, and the mobile card order is not implemented.
20. **Required correction** build the mobile variant and honour the mobile-specific ordering.
21. **Target component** `TodaysWork` + `DashboardPage`. 22. **Target file** `packages/ui/src/todays-work.tsx` (new), `apps/web/app/(shell)/dashboard/page.tsx`.
23. **Acceptance evidence** present and first in `implementation-overview-mobile-390x844.png`.

### MO-01/R5 — KPI pair

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 1048-1051. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`.
5. **Dimensions** `grid-template-columns:1fr 1fr; gap:9px; margin-top:11px` — **two separate cards**, not one.
6. **Hierarchy** two independent cards, each label + value + delta.
7. **Copy** only `NEW LEADS` 34 `+18%` and `OVERDUE` 4 `+2`. AWAITING CONTACT and APPOINTMENTS are **dropped**. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1049, 1050
8. **Tokens** green ink `#276B42`; red `#A63D2B` / `#8C3021`.
9. **Spacing** card `padding:10px 13px`; value row `gap:7px`.
10. **Typography** label 9.5px/700/`.08em`; value `'IBM Plex Mono'` **22px**/600; delta `'IBM Plex Mono'` 9px/600.
11. **Colors** the delta is **bare text**, with no tinted pill background at this size. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1049 vs 861
12. **Borders** each card `1px solid #D9DFE2`. 13. **Radii** `8px`. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** 4-in-one at desktop, 2×2-in-one at tablet, 2-of-4 as separate cards at mobile.
18. **Current implementation** `grid-cols-2` of four `KpiCard`s with the wrong labels; all four render at mobile. `VERIFIED_DIRECT_FILE_EVIDENCE` — `overview-data.tsx` 52-56
19. **Exact discrepancy** four tiles vs two; wrong labels/values; 24px value vs 22px; pill styling retained where canonical drops it.
20. **Required correction** render only the two canonical mobile tiles, unpilled deltas, 22px values.
21. **Target component** KPI strip. 22. **Target file** `packages/ui/src/kpi-card.tsx`, `apps/web/app/(shell)/dashboard/overview-data.tsx`.
23. **Acceptance evidence** diff clean across the KPI band at 390.

### MO-01/R6 — Meetings & proposals (mobile)

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 1052-1055. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`.
5. **Dimensions** one card, two rows, `margin-top:9px`.
6. **Hierarchy** two rows: 8×8 chip, text, action link. No card header at this size.
7. **Copy** `2 meetings need review` / `Review`; `3 proposals awaiting action` / `Open`. Subtitles dropped.
8. **Tokens** blue `#46708E`, green `#2F7D4F`, action `#2F7D4F`.
9. **Spacing** rows `padding:9px 13px; gap:10px`.
10. **Typography** row text 11.5px/600; action 10.5px/600.
11. **Colors** as tokens. 12. **Borders** card `1px solid #D9DFE2`; first row `border-bottom:1px solid #EEF1F3`.
13. **Radii** card `8px`; chip `2px`. 14. **Shadows** none.
15. **Icons** none — the 30×30 icon tiles of C-D01/R8 become plain 8×8 chips. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1053 vs 69
16. **Controls** `Review`, `Open`. 17. **Responsive behavior** absent at tablet, icon-tiled at desktop, chip-only at mobile.
18. **Current implementation** absent. 19. **Exact discrepancy** whole region missing.
20. **Required correction** build with the mobile chip variant.
21. **Target component** `MeetingsProposalsCard`. 22. **Target file** `packages/ui/src/meetings-proposals-card.tsx` (new).
23. **Acceptance evidence** present in the mobile implementation capture.

### MO-01/R7 — Lead Flow summary (mobile)

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 1056-1059. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`.
5. **Dimensions** one card `padding:10px 13px; margin-top:9px`.
6. **Hierarchy** title row (`Lead Flow` + `Expand ▾`) → one summary sentence.
7. **Copy** `Lead Flow`; `Expand ▾`; `34 received · 26 contacted · 12 won · ` + bold green `35% recv→won ▲4.2pp`.
8. **Tokens** t2 `#5A6B74`; green ink `#276B42`; green `#2F7D4F`.
9. **Spacing** `padding:10px 13px`; summary `margin-top:3px`.
10. **Typography** title 11.5px/600; `Expand ▾` 10px/600; summary 10.5px with a bold span.
11. **Colors** as tokens. 12. **Borders** `1px solid #D9DFE2`. 13. **Radii** `8px`. 14. **Shadows** none.
15. **Icons** none — `▾` is a text glyph. 16. **Controls** `Expand ▾`.
17. **Responsive behavior** **no chart is rendered at mobile**; this is a deliberate recomposition, not a shrunken chart. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1056-1059
18. **Current implementation** the full `ChartContainer` renders at every width. `VERIFIED_DIRECT_FILE_EVIDENCE` — `overview-data.tsx` 58
19. **Exact discrepancy** a chart is drawn where canonical shows a text summary — a material contributor to the measured 407px mobile overflow.
20. **Required correction** replace the chart with the canonical summary card below the tablet breakpoint.
21. **Target component** `ChartContainer` / `OverviewData`. 22. **Target file** `packages/ui/src/chart-container.tsx`, `apps/web/app/(shell)/dashboard/overview-data.tsx`.
23. **Acceptance evidence** mobile overflow 0; owner review.

### MO-01/R8 — Pipeline Journey summary (mobile)

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 1060-1063. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`.
5. **Dimensions** one card `padding:10px 13px; margin-top:9px`.
6. **Hierarchy** title row (`Pipeline Journey` + `Statuses ▾`) → one bottleneck sentence.
7. **Copy** `86 active · bottleneck: ` + bold amber `Appointment — 3 waiting > 48h`.
8. **Tokens** amber ink `#8A5F17`; t2 `#5A6B74`; green `#2F7D4F`.
9. **Spacing** `padding:10px 13px`; summary `margin-top:3px`.
10. **Typography** title 11.5px/600; `Statuses ▾` 10px/600; summary 10.5px.
11. **Colors** as tokens. 12. **Borders** `1px solid #D9DFE2`. 13. **Radii** `8px`. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** `Statuses ▾`.
17. **Responsive behavior** six-row list at desktop, 3×2 tiles at tablet, one sentence at mobile.
18. **Current implementation** the full six-row `PipelineJourney` list renders at mobile. `VERIFIED_DIRECT_FILE_EVIDENCE` — `dashboard/page.tsx` 22-27
19. **Exact discrepancy** six rows where canonical shows one line — the second material contributor to the 407px overflow.
20. **Required correction** add the mobile summary variant, deriving the bottleneck from the phase with an alert.
21. **Target component** `PipelineJourney`. 22. **Target file** `packages/ui/src/pipeline-journey.tsx`.
23. **Acceptance evidence** mobile overflow 0; owner review.

### MO-01/R9 — Next appointment / recent strip

1. **Frame ID** MO-01. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 1064. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-overview-mobile-390x844.png`, last card.
5. **Dimensions** one card `padding:9px 13px; margin-top:9px`.
6. **Hierarchy** two lines. 7. **Copy** `**Next appt:** Alicia F. · 10:00 AM · prep done`; `Recent: analysis ready — Solterra · PRO-2031 viewed 3×`.
8. **Tokens** table text `#3E4A52`; muted `#8B979D`.
9. **Spacing** second line `margin-top:3px`. 10. **Typography** 10.5px and 10px.
11. **Colors** as tokens. 12. **Borders** `1px solid #D9DFE2`. 13. **Radii** `8px`. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** this card is mobile-only; it compresses C-D01/R8 and C-D01/R9 into two lines.
18. **Current implementation** absent. 19. **Exact discrepancy** whole region missing.
20. **Required correction** build as the final mobile card.
21. **Target component** new `NextAppointmentStrip`. 22. **Target file** `packages/ui/src/next-appointment-strip.tsx` (new).
23. **Acceptance evidence** present and last in the mobile implementation capture.

---

## 2.6 C-D05 — LEADS DESKTOP (1440×1000)

### C-D05/R1 — Frame container

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 136; `div[data-screen-label="C-D05 Leads"] > div`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`.
5. **Dimensions** `width:1440px; height:1000px; overflow:hidden`, border inside the box.
6. **Hierarchy** `[aside 248px | column]`; column = header 56px + content.
7. **Copy** none. 8. **Tokens** canvas `#EDF0F2`, border `#CDD5D9`.
9. **Spacing** none at this level. 10. **Typography** inherited.
11. **Colors** `#EDF0F2` / `#CDD5D9`. 12. **Borders** `1px solid #CDD5D9`. 13. **Radii** none.
14. **Shadows** canvas chrome only, outside the artboard. 15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** fixed, non-scrolling.
18. **Current implementation** shared `ShellLayout`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `layout.tsx` 12-16
19. **Exact discrepancy** measured `viewport_overflow_px=0` at 1440×1000, but the comparison is `RESULT_FAIL` with the five worst bands at y150-200 41.91%, y200-250 23.22%, y300-350 21.09%, y250-300 21.06%, y100-150 19.95% — divergence is concentrated in the toolbar and table-header region, not the frame. `VERIFIED_REPRODUCIBLE_COMMAND` — `python work/tools/visual_compare.py` on the smoke capture
20. **Required correction** none at this level beyond the shared shell fix.
21. **Target component** `ShellLayout`. 22. **Target file** `apps/web/app/(shell)/layout.tsx`.
23. **Acceptance evidence** `comparison-leads-desktop-1440x1000.json`.

### C-D05/R2 — Sidebar (Leads active)

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 137-140; `aside`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`, left 248px.
5. **Dimensions** `width:248px`, identical metrics to C-D01/R2.
6. **Hierarchy** brand block → nav (`sb.ld`, Leads active) → account footer. **No Collapse row** on this frame — this is the one structural difference from C-D01. `VERIFIED_DIRECT_FILE_EVIDENCE` — 139 vs 36
7. **Copy** identical nav labels and badges; active item is `Leads`.
8. **Tokens** as C-D01/R2. 9. **Spacing** as C-D01/R2. 10. **Typography** as C-D01/R2.
11. **Colors** as C-D01/R2. 12. **Borders** account `border-top:1px solid #26231A`.
13. **Radii** avatar `7px`. 14. **Shadows** active `inset 2px 0 0 #5C9B6C`.
15. **Icons** none in the rows; logout arrow in the footer.
16. **Controls** nav links, account row.
17. **Responsive behavior** 72px rail at 820 with only two icons (line 886); drawer at 390.
18. **Current implementation** same `Sidebar` as C-D01/R2; `activeHref` comes from `usePathname()`. `VERIFIED_DIRECT_FILE_EVIDENCE` — `shell-nav.tsx`
19. **Exact discrepancy** all defects listed in C-D01/R2 apply here; additionally the implementation shows no per-frame variation, so the Collapse-row difference cannot currently be expressed.
20. **Required correction** as C-D01/R2. The Collapse row is present in the C-D01 frame and absent in the C-D05 frame; whether that is a design-intent per-page difference or an artboard omission is **`UNKNOWN_PENDING_REVIEW`** and is raised for owner decision rather than guessed.
21. **Target component** `Sidebar`. 22. **Target file** `packages/ui/src/sidebar.tsx`.
23. **Acceptance evidence** diff clean in x∈[0,248] on the leads frame; owner ruling on the Collapse row.

### C-D05/R3 — Header (Leads)

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 142-145; `header`. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`, top strip.
5. **Dimensions** `height:56px; padding:0 24px`.
6. **Hierarchy** title+subtitle | `Columns ▾` | `Export CSV`. The C-D01 search field, date segments and bell are **not** present on this frame. `VERIFIED_DIRECT_FILE_EVIDENCE` — 143-145 vs 42
7. **Copy** `Leads`; `128 total · 12 new this week · 9 awaiting first contact`; `Columns ▾`; `Export CSV`.
8. **Tokens** green tint `#E2F0E7` / border `#BFDCCA` / ink `#276B42`; solid green `#2F7D4F`.
9. **Spacing** buttons `padding:7px 13px`; `gap:9px`.
10. **Typography** title 16px/600; subtitle 11.5px; buttons 12px/600.
11. **Colors** `Columns ▾` is a green-tinted secondary; `Export CSV` is solid `#2F7D4F` with white text. `VERIFIED_DIRECT_FILE_EVIDENCE` — 144, 145
12. **Borders** header `border-bottom:1px solid #D9DFE2`; `Columns ▾` `1px solid #BFDCCA`; `Export CSV` borderless.
13. **Radii** buttons `6px`. 14. **Shadows** none. 15. **Icons** none — `▾` is a text glyph.
16. **Controls** column chooser, CSV export.
17. **Responsive behavior** at 820 the subtitle is dropped and the buttons shorten to `Columns ▾` / `Export` (line 887); at 390 the header shows only the hamburger, `Leads`, and a mono `128` (line 1069). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** `<h1 className="text-lg font-medium text-cc-ink">Leads</h1>` inside the scrolling main, no subtitle, no buttons. `VERIFIED_DIRECT_FILE_EVIDENCE` — `leads/page.tsx`
19. **Exact discrepancy** header bar absent; subtitle absent; both actions absent; the `128 total` count is not surfaced anywhere in a header.
20. **Required correction** render the shared 56px header with the Leads variant: title, live subtitle sourced from the paginated response `total`, and the two action buttons.
21. **Target component** `ShellHeader` + `LeadsPage`. 22. **Target file** `packages/ui/src/mobile-nav-drawer.tsx`, `apps/web/app/(shell)/leads/page.tsx`.
23. **Acceptance evidence** diff clean in y∈[0,56] on the leads frame; subtitle shows `128 total` from the API response, not a literal.

### C-D05/R4 — Toolbar (search + filter chips + result count)

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 148-158; toolbar card top of the content region. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`.
5. **Dimensions** card `border-radius:8px 8px 0 0` (it is the top of a joined table stack); `padding:12px 16px`; search `width:240px; height:34px`.
6. **Hierarchy** search | chip row (`Status ▾`, `Service · 2 ▾`, `Owner ▾`, `Source ▾`, `Appointment ▾`, `Created · Last 30d ▾`) | right-aligned mono result count.
7. **Copy** placeholder `Search name, email, company…`; the six chip labels; `128 RESULTS`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 149-157
8. **Tokens** field `#F1F4F5`; line `#D9DFE2`; t2 `#5A6B74`; active green tint `#E2F0E7`/`#BFDCCA`/`#276B42`.
9. **Spacing** chips `padding:6px 11px; gap:8px`.
10. **Typography** search 12.5px; chips 12px; count `'IBM Plex Mono'` 11px/600.
11. **Colors** an **active** chip (`Service · 2`) uses the green triplet; inactive chips are `#5A6B74` on `#fff`.
12. **Borders** card `1px solid #D9DFE2`; each chip `1px solid` its border token.
13. **Radii** search `6px`; chips `6px`; card top corners `8px`, bottom corners `0`.
14. **Shadows** none. 15. **Icons** magnifier inside the search field; `▾` glyphs on chips.
16. **Controls** free-text search, six filter dropdowns.
17. **Responsive behavior** at 820 only `Service · 2 ▾` and `Owner ▾` survive plus a mono `128` (line 888); at 390 the toolbar becomes a sticky bar with search, a `Filters · 2` pill and `Sort ▾` (line 1070). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** `LeadsData` renders a search input and status/owner/service controls above the table; exact markup `UNKNOWN_PENDING_REVIEW` — `leads-data.tsx` was read this pass for its pagination logic, not re-read attribute-by-attribute for toolbar geometry, and no claim about its chip styling is made here.
19. **Exact discrepancy** established: no joined toolbar card, no chip styling, no active-chip green state, no `128 RESULTS` mono counter. Remaining geometry differences `UNKNOWN_PENDING_REVIEW` until the toolbar is re-read in Step 5.
20. **Required correction** rebuild the toolbar as the top segment of the table card with the six canonical chips, active-state styling, and a result counter bound to the response `total`.
21. **Target component** `LeadsData` toolbar / new `LeadsToolbar`.
22. **Target file** `apps/web/app/(shell)/leads/leads-data.tsx`, `packages/ui/src/`.
23. **Acceptance evidence** `worst_bands_y` for leads-desktop no longer peaks at y150-250; owner review.

### C-D05/R5 — Faceted-count popover

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 152-156; absolutely-positioned panel anchored under the `Service · 2 ▾` chip. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`, overlapping the filter-chip row.
5. **Dimensions** `position:absolute`, auto width, `z-index` above the table.
6. **Hierarchy** header `SERVICE · FACETED COUNTS` → three count rows → `Clear`.
7. **Copy** `AI Automation 21`, `Workflow Automation 17`, `Web Applications 14`, `Clear`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 154-156
8. **Tokens** surface `#fff`; line `#D9DFE2`; header text `#55636B`.
9. **Spacing** rows `padding:5px 12px`. 10. **Typography** header 9.5px/700 tracked; rows 11.5px; counts `'IBM Plex Mono'`.
11. **Colors** neutral. 12. **Borders** `1px solid #D9DFE2`. 13. **Radii** `6px`.
14. **Shadows** a drop shadow is present on the panel; exact value `UNKNOWN_PENDING_REVIEW` (not re-read this pass).
15. **Icons** none. 16. **Controls** three toggles + `Clear`.
17. **Responsive behavior** the popover appears only on the desktop frame; tablet and mobile show a `Filters · 2` affordance instead.
18. **Current implementation** absent — no faceted-count popover exists.
19. **Exact discrepancy** whole region missing. Note the facet **data** does exist: the mock handler returns facet counts and `aggregateKpisFromFacetCounts` already consumes them. `VERIFIED_DIRECT_FILE_EVIDENCE` — `kpi-card.tsx`
20. **Required correction** build the popover bound to the existing facet counts. **Open question for owner:** the canonical frame renders it *open* as a design demonstration; whether the implementation should capture with it open is a review decision, not an assistant one — `UNKNOWN_PENDING_REVIEW`.
21. **Target component** new `FacetPopover`. 22. **Target file** `packages/ui/src/facet-popover.tsx` (new).
23. **Acceptance evidence** owner ruling on default-open, then diff of that band.

### C-D05/R6 — Active filter-chip row

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 159. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`.
5. **Dimensions** a thin strip between the toolbar and the bulk bar.
6. **Hierarchy** `FILTERS:` label → three removable chips → `Reset all`.
7. **Copy** `FILTERS:`, three green chips each with an `×` affordance, `Reset all`.
8. **Tokens** green triplet for the chips; red `#A63D2B` for `Reset all`.
9. **Spacing** chip `gap` small; row padding matches the toolbar's horizontal padding.
10. **Typography** label 10px/700 tracked; chips ~11px; `Reset all` ~11px/600.
11. **Colors** chips `#E2F0E7` on `#BFDCCA` with `#276B42` text; `Reset all` `#A63D2B`.
12. **Borders** chips `1px solid #BFDCCA`. 13. **Radii** chips `6px`. 14. **Shadows** none.
15. **Icons** none — `×` is a text glyph. 16. **Controls** per-chip remove, `Reset all`.
17. **Responsive behavior** absent at 820 and 390; the count folds into the `Filters · 2` pill.
18. **Current implementation** absent. 19. **Exact discrepancy** whole region missing.
20. **Required correction** build, driven by the same filter state that drives the query. Removing a chip must reset the page to 1 — the Step 1 pagination contract already enforces filter-change page reset. `VERIFIED_REPRODUCIBLE_COMMAND` — `pnpm --filter web test` covers the reset-on-filter-change case
21. **Target component** new `ActiveFilterChips`. 22. **Target file** `apps/web/app/(shell)/leads/leads-data.tsx`.
23. **Acceptance evidence** diff of the filter-row band; existing page-reset test stays green.

### C-D05/R7 — Bulk action bar

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 160. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`.
5. **Dimensions** full content width, `padding:9px 16px`.
6. **Hierarchy** `2 SELECTED` | divider | `Assign` `Change status` `Schedule follow-up` `Export` | right `Clear`.
7. **Copy** exactly those six strings. `VERIFIED_DIRECT_FILE_EVIDENCE` — 160
8. **Tokens** ink-strong `#212528` background, `#F2F5F6` text.
9. **Spacing** `padding:9px 16px`. 10. **Typography** `2 SELECTED` mono, actions ~12px.
11. **Colors** dark bar — the only dark surface in the content region. 12. **Borders** none.
13. **Radii** none — it sits flush between the filter row and the table header. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** four bulk actions + `Clear`.
17. **Responsive behavior** at 820 it shortens to `2 SELECTED / Assign / Status / Follow-up / Clear` (line 889); absent at 390. `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** absent; row selection itself is `UNKNOWN_PENDING_REVIEW` (not re-verified this pass).
19. **Exact discrepancy** whole region missing.
20. **Required correction** build the bar, shown only when the selection is non-empty. Canonical shows it with 2 selected because rows 2 and 3 carry `selBg:'#EAF2ED'` in the data. `VERIFIED_DIRECT_FILE_EVIDENCE` — lines 1364-1365
21. **Target component** new `BulkActionBar`. 22. **Target file** `apps/web/app/(shell)/leads/leads-data.tsx`.
23. **Acceptance evidence** bar visible with two rows preselected in the implementation capture, matching canonical.

### C-D05/R8 — Table header row

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 162-166. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`.
5. **Dimensions** `display:grid; grid-template-columns:38px 1.5fr .95fr 1.1fr .95fr .9fr .75fr .6fr 34px; gap:12px; padding:10px 16px`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 163
6. **Hierarchy** nine columns: checkbox, LEAD, SERVICE, STATUS, OWNER, APPOINTMENT, NEXT STEP, CREATED, action.
7. **Copy** `LEAD ↑`, `SERVICE`, `STATUS`, `OWNER`, `APPOINTMENT`, `NEXT STEP`, `CREATED`.
8. **Tokens** header surface `#F4F7F8`; header text `#55636B`; sorted-column ink `#276B42`.
9. **Spacing** `padding:10px 16px; gap:12px`.
10. **Typography** 10.5px/700, `letter-spacing:.08em`, uppercase.
11. **Colors** `LEAD ↑` is green `#276B42` (the active sort); the other six are `#55636B`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 164
12. **Borders** header sits directly above the first row; the row separators start below it.
13. **Radii** none. 14. **Shadows** none. 15. **Icons** none — `↑` is a text glyph.
16. **Controls** sortable column headers; a select-all checkbox in column 1.
17. **Responsive behavior** at 820 the grid collapses to `30px 1.5fr 1.1fr .9fr .6fr; gap:10px` with headers `LEAD ↑ STATUS NEXT STEP CREATED` (line 890); at 390 there is no table at all. `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** a `@tanstack/react-table` table with `manualSorting`; column set and header styling `UNKNOWN_PENDING_REVIEW` for exact geometry, but the 9-column canonical set including APPOINTMENT and NEXT STEP is **not** currently rendered — established by the y150-250 mismatch bands and by the absence of those fields from the visible implementation capture. `VERIFIED_REPRODUCIBLE_COMMAND` + `VERIFIED_SCREENSHOT_OBSERVATION`
19. **Exact discrepancy** column count and widths, uppercase tracked header styling, the green active-sort colour, and the `#F4F7F8` header surface.
20. **Required correction** rebuild the header to the exact nine-column grid with canonical labels and styling. Sorting stays server-driven (`manualSorting`) — do not switch to client sorting to satisfy the visual.
21. **Target component** leads table. 22. **Target file** `apps/web/app/(shell)/leads/leads-data.tsx`, `packages/ui/src/data-table.tsx`.
23. **Acceptance evidence** the y100-250 bands drop out of `worst_bands_y`; sorting tests stay green.

### C-D05/R9 — Table data rows

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 167-190; data `L` at 1363-1372. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`.
5. **Dimensions** ten rows, `height:42px; padding:0 16px`, same nine-column grid as the header.
6. **Hierarchy** per row: checkbox, name-over-company, service, status dot+label, owner chip+name, appointment, next step, created, `↗`.
7. **Copy** the ten canonical rows Dana Whitfield … Elena Sokolova with their company, service, status, owner, appointment, next step and created values. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1363-1372
8. **Tokens** row line `#EEF1F3`; name ink `#1B2226`; company `#7A868D`; owner chip `#EEF2F0`/`#276B42`; action `#B9C2C7`; selected row `#EAF2ED`.
9. **Spacing** `padding:0 16px; gap:12px`; owner chip 20×20.
10. **Typography** name 13px/600; company 11px; status 10.5px/600 uppercase; created `'IBM Plex Mono'` 10.5px.
11. **Colors** each status renders an 8×8 dot in its `ST` colour plus the label in the same ink. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1362, 178
12. **Borders** `border-bottom:1px solid #EEF1F3` per row. 13. **Radii** owner chip `5px`; status dot `2px`.
14. **Shadows** none. 15. **Icons** none — the row action is the text glyph `↗` in `#B9C2C7`.
16. **Controls** row checkbox, row-open action.
17. **Responsive behavior** at 820 rows are 48px with 5 columns and a 12.5px name (line 891); at 390 each lead becomes a card (line 1075). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** rows render from the paginated API. The **display-mapping defect** is the material one: typed enum values and opaque owner ids reach the UI. `VERIFIED_DIRECT_FILE_EVIDENCE` — contracts expose `not_started`, `no_show`, `user-001`, `user-002` and the leads table has no label map.
19. **Exact discrepancy** (a) raw snake_case status values rendered instead of canonical labels; (b) `user-001`-style ids rendered instead of owner names + initials chips; (c) no status dot; (d) row height and column widths differ; (e) no `↗` action cell; (f) no selected-row tint.
20. **Required correction** add a display-mapping layer at the render boundary: `not_started` → `Not Started`, `no_show` → `No Show`, and the rest of the `ST` set; owner ids map to a deterministic synthetic owner directory whose synthetic status is documented in the data-source notes and never shown in the UI. Mapping is applied at display only — the typed values stay typed in the contract and in the query string.
21. **Target component** leads table row + a new label map.
22. **Target file** `apps/web/app/(shell)/leads/leads-data.tsx`, `packages/ui/src/` label map, `packages/contracts/` (read-only reference for the enum set).
23. **Acceptance evidence** grep of the rendered capture text finds none of `user-00`, `not_started`, `no_show`; owner review of the row band.

### C-D05/R10 — Skeleton row

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** line 191 — one skeleton row immediately after the ten data rows. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`, directly above the footer.
5. **Dimensions** same row grid; bars `height:9px`.
6. **Hierarchy** one row of grey placeholder bars. 7. **Copy** none.
8. **Tokens** `--cc-skeleton #E7EBED` — already defined in `globals.css`. `VERIFIED_DIRECT_FILE_EVIDENCE`
9. **Spacing** same row padding. 10. **Typography** none. 11. **Colors** `#E7EBED`.
12. **Borders** row separator as normal. 13. **Radii** bar radius small. 14. **Shadows** none.
15. **Icons** none. 16. **Controls** none.
17. **Responsive behavior** the skeleton row is present only on the desktop frame; it pairs with the footer's `LOADING PAGE 2…` text and depicts an in-flight page fetch.
18. **Current implementation** a loading state exists for the leads table, but whether it renders as a canonical skeleton row is `UNKNOWN_PENDING_REVIEW`.
19. **Exact discrepancy** the canonical frame is captured **mid-fetch**. A steady-state implementation capture cannot show this row. This is a capture-protocol question, not only a styling one.
20. **Required correction** implement the skeleton row for the loading state. **Raised for owner decision:** whether the acceptance capture should reproduce the mid-fetch state or the settled state — `UNKNOWN_PENDING_REVIEW`. Deliberately **not** decided here, because forcing a loading state into a capture to lower a mismatch number would be exactly the kind of unverifiable evidence this task exists to eliminate.
21. **Target component** leads table loading state. 22. **Target file** `apps/web/app/(shell)/leads/leads-data.tsx`.
23. **Acceptance evidence** owner ruling, then the corresponding band in the diff.

### C-D05/R11 — Pagination footer

1. **Frame ID** C-D05. 2. **Canonical source path** CANON.
3. **Line / section / label / DOM selector** lines 193-199. `VERIFIED_DIRECT_FILE_EVIDENCE`
4. **Screenshot path** PNG-dir`canonical-leads-desktop-1440x1000.png`, bottom of the table card.
5. **Dimensions** `padding:11px 16px`, full content width, bottom of the joined card.
6. **Hierarchy** left mono range/status | right pager.
7. **Copy** `1–10 OF 128 · LOADING PAGE 2…`; pager `Prev | 1 | 2 | 3 | … | 13 | Next` with `1` active. `VERIFIED_DIRECT_FILE_EVIDENCE` — 195, 197-198
8. **Tokens** footer surface `#F4F7F8`; ink-strong `#212528` for the active page.
9. **Spacing** `padding:11px 16px`; pager items small and evenly gapped.
10. **Typography** range text `'IBM Plex Mono'`; page numbers small.
11. **Colors** active page `#212528` on a light chip; others muted.
12. **Borders** the footer closes the table card. 13. **Radii** card bottom corners `8px`.
14. **Shadows** none. 15. **Icons** none. 16. **Controls** Prev, seven page targets, Next.
17. **Responsive behavior** at 820 it reads `1–10 OF 128` with `‹ 1 2 3 … 13 ›` (line 892); at 390 it is replaced by `Load 10 more · 118 remaining` (line 1085). `VERIFIED_DIRECT_FILE_EVIDENCE`
18. **Current implementation** server-driven pagination is complete and green: `UNFILTERED_TOTAL 128`, `PAGE_SIZE 10`, `PAGE_COUNT 13`, `LAST_PAGE_ROWS 8`, page count derived via `pageCountOf(total, pageSize)`, Prev/Next/last-page navigation, correct disabled states, filter/search page reset. `VERIFIED_REPRODUCIBLE_COMMAND` — `pnpm --filter web test` 58/58 across 5 files, `pnpm --filter @command-center/contracts test` 29/29
19. **Exact discrepancy** **functional behaviour matches; presentation does not.** Missing: the `1–10 OF 128` mono range string, the ellipsised numbered pager (canonical shows 1 2 3 … 13, not just Prev/Next), the `#F4F7F8` footer surface, and the active-page chip.
20. **Required correction** presentation only. Do not change the pagination logic, the DTO, or the query contract to serve the visual — the numbers are already correct and the tests protecting them must stay untouched.
21. **Target component** leads pagination footer. 22. **Target file** `apps/web/app/(shell)/leads/leads-data.tsx`, `packages/ui/src/pagination.tsx`.
23. **Acceptance evidence** footer band clean in the diff; all pagination tests still green **without modification**.

---

## 2.7 T-02 — LEADS TABLET (820×1180)

### T-02/R1 — Frame container
1. **Frame ID** T-02. 2. CANON. 3. line 885. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. PNG-dir`canonical-leads-tablet-820x1180.png`. 5. `820×1180`, border inside. 6. `[rail 72px | column]`. 7. none. 8. canvas `#EDF0F2`. 9. none. 10. inherited. 11. `#EDF0F2`/`#CDD5D9`. 12. `1px solid #CDD5D9`. 13. none. 14. canvas chrome only. 15. none. 16. none. 17. recomposed, not scaled. 18. shared `ShellLayout`. 19. measured `viewport_overflow_px=0` at 820×1180; composition differs, height does not. `VERIFIED_REPRODUCIBLE_COMMAND` 20. shared shell fix only. 21. `ShellLayout`. 22. `apps/web/app/(shell)/layout.tsx`. 23. `comparison-leads-tablet-820x1180.json`.

### T-02/R2 — Icon rail
1. T-02. 2. CANON. 3. line 886. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG, left 72px. 5. `width:72px`. 6. brand mark, icon slots, account avatar. 7. none. 8. sidebar tokens. 9. `padding:22px 0 16px`. 10. avatar 11px/600. 11. active `#F4F1E6`, inactive `#A19C8B`. 12. none. 13. brand `8px`, avatar `7px`. 14. active `inset 2px 0 0 #5C9B6C`. 15. **two** icons only on this frame, versus six on T-01 — the leads rail is abbreviated in the artboard. `VERIFIED_DIRECT_FILE_EVIDENCE` — 886 vs 849-854. Whether that is design intent or artboard shorthand is `UNKNOWN_PENDING_REVIEW`. 16. nav targets. 17. rail exists only at tablet. 18. `Sidebar` at `w-[72px]` with ten hand-drawn icons. `VERIFIED_DIRECT_FILE_EVIDENCE` — `sidebar.tsx` 66-99 19. as T-01/R2; plus the two-versus-six question. 20. as T-01/R2; do not silently pick two or six — surface it. 21. `Sidebar`. 22. `packages/ui/src/sidebar.tsx`, `packages/ui/src/nav-icons.tsx`. 23. owner ruling, then diff in x∈[0,72].

### T-02/R3 — Header
1. T-02. 2. CANON. 3. line 887. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG, top 56px. 5. `height:56px`. 6. `Leads` | `Columns ▾` | `Export`. 7. subtitle **dropped**; `Export CSV` shortens to `Export`. `VERIFIED_DIRECT_FILE_EVIDENCE` — 887 vs 143-145 8. green tint / solid green. 9. tighter button padding than desktop. 10. title ~15.5px/600; buttons ~11.5px/600. 11. as C-D05/R3. 12. `border-bottom:1px solid #D9DFE2`. 13. buttons `6px`. 14. none. 15. none. 16. two actions. 17. desktop adds the subtitle and the longer label; mobile replaces the bar. 18. absent (`ShellHeader` is `md:hidden`). 19. whole region missing. 20. render the shared header with the tablet Leads reduction. 21. `ShellHeader`. 22. `packages/ui/src/mobile-nav-drawer.tsx`. 23. diff clean in y∈[0,56] at 820.

### T-02/R4 — Toolbar
1. T-02. 2. CANON. 3. line 888. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG. 5. search `width:210px`. 6. search | `Service · 2 ▾` | `Owner ▾` | right mono `128`. 7. those four. `Status/Source/Appointment/Created` chips are **dropped**. `VERIFIED_DIRECT_FILE_EVIDENCE` — 888 vs 149-157 8. as C-D05/R4. 9. tighter chip padding. 10. mono count 11px/600. 11. active chip green. 12. `1px solid` per chip. 13. `6px`. 14. none. 15. magnifier + `▾`. 16. search, two filters. 17. six chips at desktop, two here, a `Filters · 2` pill at mobile. 18. see C-D05/R4 — same component, no breakpoint variant. 19. no tablet reduction exists. 20. build the reduction. 21. `LeadsToolbar`. 22. `apps/web/app/(shell)/leads/leads-data.tsx`. 23. diff of the toolbar band at 820.

### T-02/R5 — Bulk bar
1. T-02. 2. CANON. 3. line 889. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG. 5. full width, tighter padding than desktop. 6. `2 SELECTED` | `Assign` `Status` `Follow-up` | `Clear`. 7. exactly those — `Change status` shortens to `Status`, `Schedule follow-up` to `Follow-up`, and `Export` is dropped. `VERIFIED_DIRECT_FILE_EVIDENCE` — 889 vs 160 8. `#212528`/`#F2F5F6`. 9. tighter. 10. mono label. 11. dark bar. 12. none. 13. none. 14. none. 15. none. 16. three bulk actions + `Clear`. 17. four actions at desktop, three here, none at mobile. 18. absent. 19. whole region missing. 20. build with the tablet label set. 21. `BulkActionBar`. 22. `apps/web/app/(shell)/leads/leads-data.tsx`. 23. present in the tablet capture with two rows selected.

### T-02/R6 — Table header
1. T-02. 2. CANON. 3. line 890. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG. 5. `grid-template-columns:30px 1.5fr 1.1fr .9fr .6fr; gap:10px`. 6. five columns. 7. `LEAD ↑ STATUS NEXT STEP CREATED` — SERVICE, OWNER and APPOINTMENT are **dropped**. `VERIFIED_DIRECT_FILE_EVIDENCE` — 890 vs 164 8. header `#F4F7F8`, text `#55636B`, sort `#276B42`. 9. `gap:10px`. 10. ~10px/700 tracked. 11. `LEAD ↑` green. 12. none. 13. none. 14. none. 15. none. 16. sortable headers, select-all. 17. nine columns at desktop, five here, cards at mobile. 18. no responsive column set — the same table renders at all widths. 19. column reduction not implemented. 20. add a breakpoint-aware column set; hiding columns must not change the query, only the render. 21. leads table. 22. `apps/web/app/(shell)/leads/leads-data.tsx`. 23. diff of the header band at 820.

### T-02/R7 — Table rows
1. T-02. 2. CANON. 3. line 891. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG. 5. row `height:48px` (desktop 42px). 6. checkbox, name-over-company, status, next step, created. 7. the same ten `L` rows, reduced. 8. row line `#EEF1F3`. 9. `gap:10px`. 10. name 12.5px/600, company 10.5px (desktop 13px/11px). 11. status dot + label as desktop. 12. `border-bottom:1px solid #EEF1F3`. 13. dot `2px`. 14. none. 15. none — no `↗` action cell at this size. 16. row checkbox. 17. see T-02/R6. 18. same defects as C-D05/R9, including the raw enum and owner-id exposure. 19. plus: no 48px tablet row height, no reduced field set. 20. as C-D05/R9 plus the tablet variant. 21. leads table row. 22. `apps/web/app/(shell)/leads/leads-data.tsx`. 23. no raw values in the capture text; diff of the row band.

### T-02/R8 — Pagination footer
1. T-02. 2. CANON. 3. line 892. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG, bottom. 5. footer strip, tighter than desktop. 6. mono range | pager. 7. `1–10 OF 128`; `‹ 1 **2** 3 … 13 ›` — note **page 2 is active on the tablet frame** while page 1 is active on desktop. `VERIFIED_DIRECT_FILE_EVIDENCE` — 892 vs 197 8. `#F4F7F8`, active `#212528`. 9. tighter. 10. mono. 11. active chip dark. 12. closes the card. 13. bottom corners `8px`. 14. none. 15. none — `‹ ›` are text glyphs. 16. prev/next/page targets. 17. `Prev/Next` words at desktop, `‹ ›` glyphs here, `Load 10 more` at mobile. 18. pagination logic correct and green; presentation missing (see C-D05/R11). 19. no mono range string, no ellipsised pager, no glyph variant. 20. presentation only; logic and tests untouched. 21. leads pagination footer. 22. `apps/web/app/(shell)/leads/leads-data.tsx`. 23. footer band clean; pagination tests green unmodified.

---

## 2.8 MO-02 — LEADS MOBILE (390×844)

### MO-02/R1 — Frame container
1. MO-02. 2. CANON. 3. line 1068. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. PNG-dir`canonical-leads-mobile-390x844.png`. 5. `390×844`, column, `overflow:hidden`, no rail. 6. header → sticky filter bar → scrollable card list. 7. none. 8. canvas `#EDF0F2`. 9. none. 10. inherited. 11. `#EDF0F2`/`#CDD5D9`. 12. `1px solid #CDD5D9`. 13. none. 14. canvas chrome only. 15. none. 16. none. 17. 44px touch targets, no hover-only actions, no horizontal overflow. `VERIFIED_DIRECT_FILE_EVIDENCE` — 1037 18. shared `ShellLayout`. 19. measured `viewport_overflow_px=353` at 390×844 — 42% taller than canonical. `VERIFIED_REPRODUCIBLE_COMMAND` — capture log `[OK] implementation-leads-mobile-390x844.png 390x844 overflow=353px` 20. recompose to the canonical card list; fixed-height shell. 21. `ShellLayout` + `LeadsPage`. 22. `apps/web/app/(shell)/layout.tsx`, `apps/web/app/(shell)/leads/`. 23. sidecar `viewport_overflow_px: 0`.

### MO-02/R2 — Mobile header
1. MO-02. 2. CANON. 3. line 1069. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG, top 56px. 5. `height:56px`. 6. hamburger | `Leads` | mono `128`. 7. those three. 8. surface `#fff`, line `#D9DFE2`. 9. `padding:0 16px`. 10. title 15px/600; count `'IBM Plex Mono'`. 11. white bar, dark hamburger. 12. `border-bottom:1px solid #D9DFE2`. 13. none. 14. none. 15. the same 20×20 hamburger as MO-01/R2. 16. drawer trigger. 17. mobile only. 18. `ShellHeader` — ink background, wrong hamburger, brand text instead of a page title, blank spacer instead of the count. `VERIFIED_DIRECT_FILE_EVIDENCE` — `mobile-nav-drawer.tsx` 22-45 19. background colour, hamburger geometry, and the header's right slot must be page-specific (avatar on Overview, `128` count on Leads) — the current header has no per-page slot. 20. restyle to white; give the header a page-supplied right slot and title. 21. `ShellHeader`. 22. `packages/ui/src/mobile-nav-drawer.tsx`. 23. diff clean in y∈[0,56] at 390 on the leads frame.

### MO-02/R3 — Sticky search / filter bar
1. MO-02. 2. CANON. 3. lines 1070-1071. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG. 5. `padding:10px 16px`; search `height:36px`. 6. search | `Filters · 2` | `Sort ▾`. 7. those three. 8. field `#F1F4F5`; active green triplet. 9. `padding:10px 16px`. 10. ~12px. 11. `Filters · 2` is a **green pill** indicating two active filters. 12. `1px solid` per control. 13. pill radius. 14. none. 15. magnifier; `▾`. 16. search, filter sheet, sort. 17. six chips at desktop, two at tablet, one pill here. 18. see C-D05/R4 — no mobile variant. 19. no sticky bar, no filter pill, no sort control. 20. build the mobile bar; the pill count must come from the same filter state driving the query. 21. `LeadsToolbar`. 22. `apps/web/app/(shell)/leads/leads-data.tsx`. 23. diff of the bar band; the pill reads `2` when two filters are set.

### MO-02/R4 — Duplicate-warning card
1. MO-02. 2. CANON. 3. lines 1073-1074. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG, first content card. 5. one card at the top of the list. 6. warning text + reference. 7. `Possible duplicate — matching phone on LD-4820`. 8. amber tint `#F4EBD4`, border `#E5D3A1`, ink `#8A5F17`. 9. card padding as the lead cards. 10. ~11px. 11. amber. 12. `1px solid #E5D3A1`. 13. `6px`. 14. none. 15. none. 16. presumably tappable; not established — `UNKNOWN_PENDING_REVIEW`. 17. this card appears **only** on the mobile leads frame; there is no desktop or tablet equivalent in C-D05 or T-02. `VERIFIED_DIRECT_FILE_EVIDENCE` 18. absent. 19. whole region missing; no duplicate-detection concept exists in the contracts read this pass. 20. **Do not invent a duplicate-detection feature to satisfy a screenshot.** Build the card only if the owner confirms it is in Phase 3 scope and names its data source — `UNKNOWN_PENDING_REVIEW`, raised as an open question. 21. undecided. 22. undecided. 23. owner ruling first.

### MO-02/R5 — Lead cards
1. MO-02. 2. CANON. 3. lines 1075-1083; iterates `rows7`. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG. 5. card `padding:10px 12px; margin-bottom:8px`. 6. per card: name + status dot/label; `{company} · {service} · {owner}`; footer `{next step}` / `Open ›`. 7. seven of the ten canonical rows. 8. row tokens as desktop; action green `#2F7D4F`. 9. `padding:10px 12px`; `margin-bottom:8px`. 10. name ~12.5px/600; meta ~10.5px; action ~10.5px/600. 11. status dot in its `ST` colour. 12. card `1px solid #D9DFE2`. 13. `6px`. 14. none. 15. none — `›` is a text glyph. 16. card tap / `Open ›`. 17. **the table becomes a card list** — this is a recomposition, not a responsive table. `VERIFIED_DIRECT_FILE_EVIDENCE` 18. the desktop table renders at 390 — the primary cause of the measured 353px overflow. `VERIFIED_REPRODUCIBLE_COMMAND` 19. no card list exists; raw enum and owner-id exposure applies here too. 20. build the mobile card list with the display mapping from C-D05/R9. Card count is a layout consequence of the 844px frame; do **not** hard-code seven — render the page and let it clip as canonical does. 21. new `LeadCard`. 22. `packages/ui/src/lead-card.tsx` (new), `apps/web/app/(shell)/leads/leads-data.tsx`. 23. mobile overflow 0; no raw values in the capture text; owner review.

### MO-02/R6 — Load-more control
1. MO-02. 2. CANON. 3. line 1085. `VERIFIED_DIRECT_FILE_EVIDENCE` 4. same PNG, bottom. 5. a full-width control below the card list. 6. one control. 7. `Load 10 more · 118 remaining`. 8. neutral surface, green or neutral text (exact `UNKNOWN_PENDING_REVIEW`). 9. matches list padding. 10. ~11.5px/600. 11. see 8. 12. `1px solid #D9DFE2`. 13. `6px`. 14. none. 15. none. 16. load-more. 17. numbered pager at desktop and tablet, **incremental load** at mobile. 18. no mobile pagination variant. 19. `118 remaining` = `128 − 10`, consistent with the existing `total` and `pageSize` — the control is a presentation of the same paginated response, not a different data path. `DERIVED_REPRODUCIBLE` 20. build a load-more control derived from `total`, `page` and `pageSize`. **Open question:** whether it appends to the list or replaces the page. Canonical copy says "Load 10 more", which reads as append, but append changes the request/render model that the Step 1 tests lock down. Raised rather than assumed — `UNKNOWN_PENDING_REVIEW`. 21. leads pagination (mobile variant). 22. `apps/web/app/(shell)/leads/leads-data.tsx`. 23. owner ruling; then footer band diff with pagination tests still green unmodified.

---

## 2.9 RANKED LARGEST GAPS

Ranked by measured or structural impact, largest first. Ordering rule: regions whose absence is confirmed by a **measured** signal (`viewport_overflow_px`, `worst_bands_y`) outrank regions confirmed only by source comparison; among those, whole-region absence outranks styling divergence. This ordering is `DERIVED_REPRODUCIBLE` from the tagged measurements above.

| # | Gap | Frames | Evidence | Provenance |
| --- | --- | --- | --- | --- |
| 1 | **Mobile Overview is not recomposed** — chart and full pipeline list render where canonical shows two text summary cards. | MO-01 | `viewport_overflow_px=407` (48% over frame) | `VERIFIED_REPRODUCIBLE_COMMAND` |
| 2 | **Mobile Leads is not recomposed** — the desktop table renders instead of a card list. | MO-02 | `viewport_overflow_px=353` (42% over frame) | `VERIFIED_REPRODUCIBLE_COMMAND` |
| 3 | **The 56px application header does not exist at ≥md** — no title bar, subtitle, search, date segments, bell, avatar, `Columns`/`Export`. | C-D01, T-01, C-D05, T-02 | source comparison; header region entirely absent | `VERIFIED_DIRECT_FILE_EVIDENCE` |
| 4 | **Leads toolbar / filter chips / bulk bar missing** — six chips, active-chip state, `FILTERS:` row, dark bulk bar, `128 RESULTS`. | C-D05, T-02, MO-02 | `worst_bands_y` peak 41.91% at y150-200 | `VERIFIED_REPRODUCIBLE_COMMAND` |
| 5 | **Raw internal values reach the UI** — snake_case statuses and `user-00N` owner ids where canonical shows human labels and initials chips. | C-D05, T-02, MO-02 | contract enum values rendered without a display map | `VERIFIED_DIRECT_FILE_EVIDENCE` |
| 6 | **Leads table column set and row geometry wrong** — nine canonical columns at 42px vs the current set; no status dot, no owner chip, no `↗`. | C-D05, T-02 | y200-350 bands 21-23% | `VERIFIED_REPRODUCIBLE_COMMAND` |
| 7 | **KPI strip is four detached cards with the wrong four metrics** — canonical is one bordered 4-cell card showing NEW LEADS 34 / AWAITING CONTACT 9 / APPOINTMENTS 7 / OVERDUE 4 with trend pills and context lines. | C-D01, T-01, MO-01 | source comparison | `VERIFIED_DIRECT_FILE_EVIDENCE` |
| 8 | **Three Overview cards do not exist at all** — Today's work, Meetings & proposals, Recent activity. | C-D01, T-01, MO-01 | source comparison | `VERIFIED_DIRECT_FILE_EVIDENCE` |
| 9 | **Sidebar is missing brand block, account footer and Collapse row**, renders icons on expanded desktop rows that canonical does not have, and uses a raised active background instead of the inset rail stripe alone. | all six | source comparison | `VERIFIED_DIRECT_FILE_EVIDENCE` |
| 10 | **Hand-drawn nav icons instead of the canonical icon system** defined at CANON 849-854; ten rail slots where the tablet frame shows six (T-01) or two (T-02). | T-01, T-02 | source comparison; owner instruction names this defect | `VERIFIED_DIRECT_FILE_EVIDENCE` + `VERIFIED_HUMAN_DECISION` |
| 11 | **Lead Flow chart is a single derived series** — canonical is three series plus an area, with fixed six-point geometry, stat blocks, axis labels and a legend. | C-D01, T-01 | source comparison | `VERIFIED_DIRECT_FILE_EVIDENCE` |
| 12 | **Pipeline Journey has no responsive variants** and renders C-D03 progress segments that C-D01 does not show; placed in the main grid instead of the 372px right rail. | C-D01, T-01, MO-01 | source comparison | `VERIFIED_DIRECT_FILE_EVIDENCE` |
| 13 | **Shell is scroll-height-driven, not fixed-frame** — `min-h-screen` + scrolling `main` versus a fixed `overflow:hidden` artboard. | all six | `viewport_overflow_px=60` even at desktop Overview | `VERIFIED_REPRODUCIBLE_COMMAND` |
| 14 | **Pagination presentation** — logic is correct and green; the mono `1–10 OF 128` range, the ellipsised numbered pager and the mobile `Load 10 more` variant are missing. | C-D05, T-02, MO-02 | source comparison; logic verified green | `VERIFIED_DIRECT_FILE_EVIDENCE` + `VERIFIED_REPRODUCIBLE_COMMAND` |

### Open questions raised, not decided

These are recorded as `UNKNOWN_PENDING_REVIEW` rather than resolved by assumption. Each would otherwise require inventing design intent.

1. **Collapse row** — present in C-D01's sidebar, absent in C-D05's. Per-page intent or artboard omission? (C-D05/R2)
2. **Faceted-count popover default state** — the canonical frame renders it open. Should the acceptance capture reproduce an open popover? (C-D05/R5)
3. **Skeleton row / `LOADING PAGE 2…`** — the canonical desktop frame is captured mid-fetch. Should the implementation capture reproduce a loading state, or settle? (C-D05/R10)
4. **Tablet rail icon count** — six on T-01, two on T-02. (T-02/R2)
5. **Mobile duplicate-warning card** — no duplicate-detection concept exists in the contracts. In Phase 3 scope, and from what data? (MO-02/R4)
6. **Mobile `Load 10 more`** — append to the list or replace the page? Append changes the render model the Step 1 tests lock down. (MO-02/R6)

### Reconstruction order implied by this matrix

Shell first (gaps 3, 9, 10, 13 — they affect all six frames and every subsequent capture), then Overview (7, 8, 11, 12, 1), then Leads (4, 5, 6, 14, 2). This is the order the owner's Steps 3, 4 and 5 already specify; the matrix confirms it rather than proposing an alternative.

**End of Section 2.**

---

# SECTION 3 — POST-RECONSTRUCTION DIVERGENCE REGISTER

Added by `CODEOUTFITTERS_PHASE_3_CANONICAL_RECONSTRUCTION_AND_PAGINATION_COMPLETION`,
Step 8 closeout. Section 2 records the gap matrix as measured **before** reconstruction.
This section records what remains **after** reconstruction, with each residual attributed
to a named cause. Nothing in Section 2 is deleted or rewritten.

## 3.0 What this section is and is not

A mismatch percentage is not proof of parity and is not used as one here. Every residual
below is attributed to a specific, independently observable cause — a canonical state the
default capture cannot occupy, a contract field that does not exist, or a measured pixel
quantity. Residuals that could not be attributed were treated as defects and corrected.

The 11.2803% unrelated-screen calibration figure is **not** used as a threshold anywhere in
this section.

## 3.1 Final comparison results (regenerated after both harness self-tests passed)

Comparison flags for all six: `--crop-canonical-border 1 --align-content-window`.

Justification for those flags, restated so this table can be read standalone: the canonical
v2 frames carry a decorative 1px `#CDD5D9` frame border, so canonical **content** boxes are
1438x998 / 818x1178 / 388x842 while the implementation viewports are 1440x1000 / 820x1180 /
390x844. Cropping exactly one border pixel and aligning the content windows compares content
to content. No resize, resample, stretch or normalisation is performed; the canonical PNGs
themselves are never modified.

| Target | Result | mismatch % | row corr | col corr | row edge | col edge |
|---|---|---|---|---|---|---|
| overview-desktop-1440x1000 | PASS | 5.2910 | 0.9550 | 0.9997 | 1.000 | 1.000 |
| overview-tablet-820x1180 | PASS | 1.9345 | 0.9887 | 0.9998 | 0.917 | 1.000 |
| overview-mobile-390x844 | FAIL | 5.4003 | 0.9076 | 0.8825 | 1.000 | 0.708 |
| leads-desktop-1440x1000 | FAIL | 8.6768 | 0.2991 | 0.9995 | 0.000 | 1.000 |
| leads-tablet-820x1180 | FAIL | 6.9972 | 0.2051 | 0.9997 | 0.000 | 1.000 |
| leads-mobile-390x844 | FAIL | 14.5049 | 0.3490 | 0.7953 | 0.891 | 0.333 |

`FAIL` here is the harness verdict, not an implementation defect verdict. Section 3.3
attributes each one.

## 3.2 Diagnostic method used for attribution

Structural attribution was done with a projection probe, not by eyeballing the diff image:

```
im = numpy.asarray(Image.open(path).convert('L')).astype(int)
rows = numpy.diff(im.mean(axis=1))     # horizontal rules -> row pitch and row offsets
cols = numpy.diff(im.mean(axis=0))     # vertical edges  -> column boundaries
edges = [i for i in range(len(d)) if abs(d[i]) > 6]
```

Canonical is probed with the 1px border cropped so both series are in content coordinates.
Comparing the two edge lists gives row pitch, cumulative offset, and the exact y where two
frames stop agreeing — which is what separates "canonical contains an extra band" from
"our rows are the wrong height".

## 3.3 Attributed residuals, per target

### 3.3.1 leads-desktop-1440x1000 — five largest structural differences

Row pitch is **identical** (42px canonical, 42px implementation). Column alignment is
**1.000** and column correlation **0.9995** — every vertical boundary of the 9-column grid
lands on the canonical pixel. Rows agree through y approximately 122. Canonical's footer sits
at y=751, the implementation's at y=640: a **111px** vertical offset, which decomposes exactly:

| # | Difference | Measured | Cause | Class |
|---|---|---|---|---|
| 1 | Dark bulk-selection bar absent | 33px (canonical y172-205) | Canonical frame is captured with 2 rows selected. Default capture has no selection. | CANONICAL_STATE |
| 2 | Applied FILTERS chip row absent | approx 38px | Canonical frame is captured with facet filters applied. Default capture has none. | CANONICAL_STATE |
| 3 | Loading skeleton row absent | 42px (C-D05 190: `height:42px; padding:0 16px`) | Canonical frame is captured mid page-2 fetch. Default capture is idle. | CANONICAL_STATE |
| 4 | Footer range text differs | text only | Canonical reads `1-10 OF 128 - LOADING PAGE 2...`; idle implementation omits the loading clause. | CANONICAL_STATE |
| 5 | Next-step colour on one row | colour only | Canonical renders `Review mtg` in blue from an authored per-row urgency code. No contract field carries urgency. | NO_CONTRACT_FIELD |

33 + 38 + 42 = 113px against a measured 111px offset. The 2px slack is the two band
borders. **The entire desktop residual is canonical's composite active state.** No layout
defect remains at desktop.

`row_edge_alignment 0.000` and `row_projection_corr 0.2991` are the expected consequence of
canonical carrying three extra horizontal bands and 11 body rows against the implementation's
10 — not evidence of misalignment.

### 3.3.2 leads-tablet-820x1180 — five largest structural differences

Row pitch is **identical** (48px both, T-02 897 `height:48px`). Column alignment **1.000**.

| # | Difference | Measured | Cause | Class |
|---|---|---|---|---|
| 1 | Dark `2 SELECTED` bulk bar absent | 29px offset above the table (T-02 `background:#212528; padding:8px 14px`) | Canonical captured with 2 rows selected. | CANONICAL_STATE |
| 2 | Footer sat 14px too low | 14px (canonical last-row-to-footer 35px vs 49px) | **DEFECT — CORRECTED.** A non-canonical `border-top` on the footer plus boxed pager buttons where T-02 908 renders a plain mono string. | CORRECTED |
| 3 | Faceted popover open in canonical | overlay | Canonical captured with the `Service - 2` popover open. | CANONICAL_STATE |
| 4 | Active LEAD-ascending sort indicator | glyph | Canonical captured with an active sort. Default capture is unsorted. | CANONICAL_STATE |
| 5 | Search placeholder wording | text only | T-02 890 shortens to `Search...`; one input can carry only one placeholder and a second search field would violate the one-labelled-control rule, so the desktop wording is kept at every width. | DELIBERATE |

Difference 2 was a real defect and is fixed. Everything else is canonical state or a
recorded deliberate divergence.

### 3.3.3 leads-mobile-390x844 — five largest structural differences

| # | Difference | Measured | Cause | Class |
|---|---|---|---|---|
| 1 | Amber duplicate-warning banner absent | **43px** — shifts every card down (canonical first card y163, implementation y120) | MO-02 1078: `Possible duplicate - matching phone on LD-4820`, `border:1px solid #E5D3A1; padding:8px 11px; margin-bottom:8px`. **No duplicate-detection field exists in the `Lead` contract.** Rendering it would require fabricating a field. | NO_CONTRACT_FIELD |
| 2 | Card pitch was 88px, canonical 89px | 1px per card, cumulative | **DEFECT — CORRECTED.** Missing `margin-top:1px` on the card sub-line (MO-02 1081). Fixed with `mt-px`. | CORRECTED |
| 3 | Toolbar overflowed 390px, clipping Sort | control clipped off-screen | **DEFECT — CORRECTED.** A native `select` is as wide as its widest option (`Appt Scheduled`). Constrained to `w-[86px] shrink-0` (Status) and `w-[68px] shrink-0` (Sort); MO-02 1073 budgets approximately 78px. | CORRECTED |
| 4 | Toolbar control structure | interior column edges at x=58/80 canonical vs x=80/82/360 implementation | Canonical uses one combined `Filters - 2` pill; the implementation exposes Status and Sort as two real controls, because a combined pill would be inert chrome over two live query parameters. | DELIBERATE |
| 5 | Right content edge 2px apart | 370 canonical vs 372 implementation | Canonical content box is 388px wide (1px frame border each side) against a 390px viewport. Not a layout difference. | FRAME_BORDER |

Column-edge probe confirms the left edges (x=15, 16, 29) are **pixel-identical**, so the
rail, card and padding geometry all agree. `col_edge_alignment 0.333` is produced solely by
differences 4 and 5.

`content_overflow_px = 211` on this frame is expected: MO-02 is a scrolling card list inside
a fixed 844px frame.

Load-more behaviour: MO-02 1085 reads `Load 10 more - 118 remaining`. The implementation
renders that exact copy but **paginates** (replaces the visible page) rather than appending,
because appending would contradict the server page contract and break the existing
Next-changes-the-rows test. Recorded as DELIBERATE.

### 3.3.4 overview-mobile-390x844 — five largest structural differences

Row-edge alignment is **1.000** and row correlation **0.9076**. Row edges are identical or
within 1px through y approximately 300, then drift 1-2px cumulatively.

| # | Difference | Measured | Cause | Class |
|---|---|---|---|---|
| 1 | KPI card height | approx 2px per card (canonical band 301-370, implementation 300-371) | Font-metric rounding on the card's intrinsic height. Not a declared-value difference. | RENDER_METRIC |
| 2 | Cumulative vertical drift below y approx 300 | 1-2px | Consequence of difference 1 accumulating down the card stack. | RENDER_METRIC |
| 3 | Text antialiasing across every glyph row | sub-pixel | A 1px text shift lights up every glyph in the mismatch count. Direct crop comparison of bands 450-600 and 591-760 shows identical copy, weights, colours and column positions. | RENDER_METRIC |
| 4 | Worst bands are all card-body text | y462-504 (12.63%), y546-588 (11.84%), y588-630 (11.50%) | Same cause as 1-3; the bands rank by glyph density, not by structural error. | RENDER_METRIC |
| 5 | Right content edge 2px apart | 370/371 canonical vs 372/373 implementation | 388px canonical content box vs 390px viewport. | FRAME_BORDER |

No structural defect found at overview mobile. `col_edge_alignment 0.708` is produced by
differences 3 and 5.

### 3.3.5 overview-desktop-1440x1000 — PASS, five largest remaining

| # | Difference | Measured | Cause | Class |
|---|---|---|---|---|
| 1 | Worst band y637-686 | 10.26% | Dense chart/table copy; sub-pixel glyph rendering. | RENDER_METRIC |
| 2 | Worst band y588-637 | 8.52% | Same. | RENDER_METRIC |
| 3 | Pipeline footer design-frame ID `C-D04` omitted | text only | A design-frame identifier, not product copy. Rendering it would put an internal design reference in shipped UI. | DELIBERATE |
| 4 | Header clause `12 new this week` omitted | text only | Requires a week window, i.e. reading the clock. The fixtures and the comparison harness are both deliberately clock-free, so it is omitted rather than faked. | CLOCK_FREE |
| 5 | 1px content-box delta | 1438 vs 1440 | Canonical frame border. | FRAME_BORDER |

### 3.3.6 overview-tablet-820x1180 — PASS, five largest remaining

| # | Difference | Measured | Cause | Class |
|---|---|---|---|---|
| 1 | Worst band y464-522 | 4.82% | Sub-pixel glyph rendering. | RENDER_METRIC |
| 2 | Worst band y812-870 | 4.66% | Same. | RENDER_METRIC |
| 3 | APPOINTMENTS pill weight | 600 in implementation, unset in canonical | Divergence recorded rather than silently matched; the canonical rule is absent, not explicitly 400. | DELIBERATE |
| 4 | Header meeting clause absent at tablet | text only | T-01 858 ends the line at `4 items need attention`; implementation gates the clause to `xl`. **This matches canonical** and is listed only for completeness. | MATCHES_CANONICAL |
| 5 | 1px content-box delta | 1178 vs 1180 | Canonical frame border. | FRAME_BORDER |

## 3.4 Divergence classes used above

| Class | Meaning | Action taken |
|---|---|---|
| `CORRECTED` | Real implementation defect found by probe. | Fixed, rebuilt, recaptured, re-compared. |
| `CANONICAL_STATE` | Canonical frame depicts an interaction state the default capture does not occupy. | Documented. **Not** staged into the capture — staging application state purely to reduce a mismatch number would be using mismatch percentage as proof of parity. |
| `NO_CONTRACT_FIELD` | Canonical shows data no field in the Lead/overview contract carries. | Documented. Not fabricated. |
| `DELIBERATE` | Implementation intentionally differs, with a stated reason. | Documented. |
| `CLOCK_FREE` | Canonical copy requires reading the clock. | Omitted rather than faked. |
| `FRAME_BORDER` | The 1px decorative canonical frame border. | Handled by `--crop-canonical-border 1`. |
| `RENDER_METRIC` | Sub-pixel font/antialiasing difference. | Documented. |

## 3.5 Why the composite canonical state was not staged into the capture

Three independent reasons, any one sufficient:

1. It would be using mismatch percentage as proof of parity, which the governing
   instruction prohibits outright.
2. It is partly impossible without fabrication. The canonical composite includes a
   `LOADING PAGE 2...` transient that cannot be held stably, and a duplicate-warning banner
   backed by no contract field.
3. The acceptance gate is human visual review of six canonical-versus-implementation
   comparisons. Whether these documented divergences are acceptable is the project owner's
   decision, not something to be engineered out of the diff beforehand.

## 3.6 Raw display values removed

No `user-001`, `user-002`, `not_started`, `no_show`, `abandoned`, `scheduled`, `completed`,
raw provider IDs or other snake_case enum values reach the rendered output at any of the
three widths. Typed values are mapped to canonical human-facing labels
(`not_started` to `Not Started`, `no_show` to `No Show`); owner ids render as owner display
names, with `Unassigned` where no owner is set.

## 3.7 Status

Six comparisons produced, all residuals attributed, no unattributed structural difference
remaining. Awaiting human visual review. `PHASE_3_COMPLETE` is **not** claimed.

---

# 4. Leads Final Canonical Parity Repair — `CODEOUTFITTERS_PHASE_3_LEADS_FINAL_CANONICAL_PARITY`

Date: 2026-07-22. Sections 1-3 are unchanged and are not edited by this section.

## 4.1 Supersession of Section 3.5

Section 3.5 recorded three reasons why the composite canonical state was **not** staged into
the capture. The project owner's items 1-3 direct that the implementation match the
canonical presentation state at each width, so Section 3.5 is **superseded for the three
Leads frames only**. It stands unedited above as the record of what was decided at the time.

The concern behind reason 1 is preserved intact: no mismatch percentage in this section is
offered as proof of parity, and none is used to derive a threshold. Reason 2 is answered by
construction — the `LOADING PAGE 2…` transient and the duplicate banner are rendered as an
explicit mock/test-only visual state, not as fabricated data, and both are unreachable
outside mock mode. Reason 3 is unchanged: acceptance remains the project owner's visual
decision, and `PHASE_3_COMPLETE` is not claimed.

The `CANONICAL_STATE` class therefore now carries a second disposition:

| Class | Meaning | Disposition after this pass |
|---|---|---|
| `CANONICAL_STATE` | Canonical frame depicts an interaction state the default capture does not occupy. | For the three Leads frames: staged behind the mock-only `?visual-state=canonical` switch, so a human compares like with like. For all other frames: unchanged — documented, not staged. |

## 4.2 Leads desktop, C-D05

| Canonical | Divergence at the start of this task | Class | Disposition |
|---|---|---|---|
| 143 | Header subtitle absent | `CORRECTED` | Restored, derived from the real response total and the server `New` facet |
| 162-167 | Applied-filter chip row absent | `CANONICAL_STATE` | Staged: `FILTERS:` + three chips + `Reset all` |
| 154-160 | Service facet popover closed | `CANONICAL_STATE` | Staged open at xl |
| 156-157 | No facets ticked | `CANONICAL_STATE` | Two ticked, matched **by name** to the canonical pair |
| 1373-1375 | No rows selected | `CANONICAL_STATE` | Rows 2 and 3 of the page selected, `#EAF2ED` |
| C-D05 bulk bar | Absent | `CANONICAL_STATE` | Dark `2 SELECTED` bar with Assign / Change status / … / Clear |
| 192 | Skeleton row absent | `CANONICAL_STATE` | Staged, 7 bars at 72/60/55/58/50/46/60 percent, `aria-hidden`, not a `role="row"` |
| 193-195 | Footer read the bare count | `CANONICAL_STATE` | ` · loading page 2…` suffix added at xl |
| 155-159 counts | Popover lists 7 real services against canonical's 3 authored ones | `MATCHES_CANONICAL` in kind, dataset-derived in content | Documented, not repaired. The counts shown are always the server's; no canonical figure is substituted for a real one |
| 143 middle clause | `12 new this week` absent | `CLOCK_FREE` | Omitted rather than faked; the fixtures and the harness are deliberately clock-free |
| 143 trailing figure | `14 awaiting first contact` against canonical `9` | `MATCHES_CANONICAL` in kind, dataset-derived in value | Documented. It is the real server `New` facet over the real 128 records |

Result: `PASS`, mismatch 4.4447 percent, row-edge alignment 1.000, column-edge alignment
1.000. Prior to this pass: `FAIL`, 8.6768 percent, row-edge alignment 0.000.

## 4.3 Leads tablet, T-02

| Canonical | Divergence at the start of this task | Class | Disposition |
|---|---|---|---|
| 888 | Header carried the desktop subtitle | `CORRECTED` | Subtitle scoped to xl. The gate is on the Leads subtitle node, not on the shared header, so T-01 858 — which **does** keep the Overview subtitle — and the accepted Overview tablet frame are untouched |
| 885-912 | No rows selected, no bulk bar | `CANONICAL_STATE` | Rows 2 and 3 selected, bulk bar shown at md+ |
| 891 | — | `MATCHES_CANONICAL` | Service trigger active with **no** popover: the staged popover is xl-gated, a user-opened one stays md+ |
| 885-912 | — | `MATCHES_CANONICAL` | Five-column table and canonical pagination unchanged |
| 908 | — | `MATCHES_CANONICAL` | Footer is the bare count; the loading suffix is xl-only |

Result: `PASS`, mismatch 3.9473 percent, row-edge alignment 1.000, column-edge alignment
1.000. Prior to this pass: `FAIL`, 6.9972 percent, row-edge alignment 0.000.

## 4.4 Leads mobile, MO-02

| Canonical | Divergence at the start of this task | Class | Disposition |
|---|---|---|---|
| 1073 | Toolbar carried a separate Status select | `CORRECTED` | Toolbar is now `Search…` / `Filters · 2` / `Sort`. Status and Owner moved into a `Filters` disclosure panel — mobile status filtering is relocated, not removed |
| 1073 | Filter count absent | `CANONICAL_STATE` | `Filters · 2`, the two ticked service facets, matching C-D05 151 `Service · 2` |
| 1076 | Duplicate-warning banner absent | `NO_CONTRACT_FIELD` + `CANONICAL_STATE` | Staged mock-only. No field in the `Lead` contract carries duplicate detection, so it is never rendered outside the mock/test visual state |
| MO-02 card stack | Whole stack sat 3px high | `CORRECTED` | Toolbar `mb-2` (8px) corrected to `mb-[11px]`. Probe: canonical banner borders at rows [124, 155] against implementation [121, 152] before; in register after |
| MO-02 | — | `MATCHES_CANONICAL` | Card hierarchy, initial batch of 10, `Load 10 more · 118 remaining` with the remaining count derived from total minus loaded, and no rendering of all 128 records initially |

Result: `FAIL`, mismatch 4.7149 percent, row-edge alignment 0.9565, column-edge alignment
0.3333. Prior to this pass: `FAIL`, 14.5049 percent, row-profile correlation 0.3490. The
card-stack rules are now in exact register with canonical; the residual is font-metric and
antialiasing difference within the cards, the same class already recorded for
overview-mobile in Section 3.

## 4.5 Overview frames

Unchanged. No broad Overview reconstruction was performed. All three comparison results are
identical to the accepted pass: desktop `PASS` 5.2910, tablet `PASS` 1.9345, mobile `FAIL`
5.4003. This is the regression check for the Leads-scoped subtitle gate and the shared
shell changes.

## 4.6 Invariants re-verified

Total 128; page size 10; page count 13; final page 8 rows; deterministic clock-free
synthetic dataset; the staged visual state is explicitly mock/test-only and inert in real
mode; no raw enum values or owner ids reach the rendered output at any of the three widths.

## 4.7 Use of the numbers in this section

The six mismatch percentages are reported as movement and as evidence that the Overview
frames did not regress. They are **not** offered as proof of parity, no acceptance threshold
is derived from them, and the 11.2803 percent unrelated-screen calibration figure is not
used as a threshold anywhere.

## 4.8 Status

```
PHASE_3_LEADS_FINAL_CANONICAL_REPAIR_PENDING_HUMAN_REVIEW
```

All six frames await the project owner's personal visual review. `PHASE_3_COMPLETE` is
**not** claimed and visual acceptance is not self-certified.

## 4.9 Correction to Section 4.4 — mobile column-edge residual

Section 4.4 above is not edited. It stated that the leads-mobile residual is "font-metric and
antialiasing difference within the cards, the same class already recorded for overview-mobile."
That characterisation was asserted by analogy to overview-mobile and was **not** probed on the
final mobile frame at the time it was written. It is corrected here.

The probe was subsequently run on the final pair
(`canonical-leads-mobile-390x844.png` border-cropped to 389x842 against
`implementation-leads-mobile-390x844.png` cropped to the same window, no resampling), using the
same `ink_projection` / `band_edges` / `edge_alignment` functions the comparison script uses.

**Column edges — the 0.3333 figure is explained, and the analogy holds.**

| | canonical column edges | implementation column edges | canonical edges unmatched within 8px |
|---|---|---|---|
| leads-mobile | 21 | 26 | 14 — all in the 40-82 glyph band, plus 387 |
| overview-mobile | 65 | 40 | 19 — 104-132 and 358-363 glyph bands, plus 388 |

At 390px both screens are a single-column card stack with no vertical structural rules, so the
column ink projection has no structure to detect and `band_edges` resolves letterform stems
instead. Both frames fail in the same place and in the same way. leads-mobile scores lower only
because it has 21 canonical edges to overview-mobile's 65, so each unmatched glyph column costs
4.8 percent instead of 1.5 percent. The 0.3333 is therefore a small-denominator effect on a
glyph-dominated projection, not evidence of column-structure drift — column projection
correlation is 0.8019 against overview-mobile's 0.8825, and the two frames are the same class.

**Row edges — one residual is NOT attributed and is not claimed to be font metrics.**

Row-edge alignment is 0.9565: 88 of 92 canonical row edges match within 8px. Canonical rows
28-560 are in exact register, confirming the `mb-[11px]` card-stack fix landed. The four
unmatched canonical edges are a single band at rows **581, 584, 585, 587**, whose nearest
implementation edge is 13-19px away, and the last card carries a 1-7px tail drift
(canonical 802/808/819/820 against implementation 803/811/821/827).

That band is recorded as `UNKNOWN_PENDING_REVIEW`. It is **not** claimed to be a font-metric or
antialiasing difference, and no cause is asserted for it. It is one card's internal content in
one region of the stack; whether it matters is the project owner's visual decision.

---

# SECTION 5 — LEADS EXACT-STATE REPAIR

`CODEOUTFITTERS_PHASE_3_LEADS_EXACT_STATE_REPAIR_WITH_BROWSER_VERIFICATION`, 2026-07-22.

Nothing above is edited. Where Section 5 contradicts Sections 2-4 on a **Leads** region, Section 5
wins. Overview regions are unchanged: the project owner passed all three Overview frames at task
start and no broad Overview reconstruction was performed.

## 5.1 Scope of this section

The owner's visual verdict at task start was OVERVIEW_DESKTOP / TABLET / MOBILE **PASS**
(protected) and LEADS_DESKTOP / TABLET / MOBILE **FAIL_EXACT_STATE_REPAIR_REQUIRED**. Only the
enumerated Leads regions below were reworked. Every Overview region is carried forward from
Section 4 unchanged, and the three Overview implementation PNGs recaptured this pass are
byte-identical to the accepted baseline (implementation report 30.9).

## 5.2 C-D05 Leads desktop, 1440x1000 — repaired regions

| Region | Canonical | Implementation after repair | Provenance |
|---|---|---|---|
| Header subtitle | `128 total · 12 new this week · 9 awaiting first contact` | same string, rendered from three server-supplied integers (`total`, `newThisWeekCount`, `awaitingFirstContactCount`), not a literal | `DERIVED_REPRODUCIBLE` — counts computed by `countNewThisWeek()` / `countAwaitingFirstContact()` over the whole 128-record dataset; asserted in `generate-leads.test.ts`, `leads-pagination.test.ts`, `leads-canonical-parity.test.tsx` |
| Filter row order | Search, Status, Service · 2, Owner, Source, Appointment, Created · Last 30d | identical order | `VERIFIED_DIRECT_SOURCE_EVIDENCE` — canonical C-D05 frame; asserted positionally in the parity test and re-read from the Edge accessibility snapshot |
| `Created · Last 30d` selected state | selected | selected **only** under `?visual-state=canonical` | `DERIVED_REPRODUCIBLE` — parity test asserts absence on the normal route |
| Service popover contents | `AI Automation — 21`, `Workflow Automation — 17`, `Web Applications — 14`, nothing else | identical three entries, from `CANONICAL_SERVICE_REFERENCE` | `PRESENTATION_TEST_STATE_REFERENCE_DATA` — not live API truth, not status counts, does not replace normal facet derivation; outside the gated state the popover shows real server facet counts |
| Selected rows, bulk-action bar, chip row, skeleton row, loading footer, table geometry, pagination, shell, sidebar | as Section 2.5 | preserved | comparison PASS, mismatch 3.0919 (from 4.4447), row/col edge alignment 1.0/1.0, structurally aligned |

## 5.3 T-02 Leads tablet, 820x1180 — repaired regions

| Region | Canonical | Implementation after repair | Provenance |
|---|---|---|---|
| Toolbar order | Search, Service · 2, Owner | identical | `VERIFIED_DIRECT_SOURCE_EVIDENCE` — read from the T-02 frame |
| Bulk actions | `Assign`, `Status`, `Follow-up` | `TABLET_BULK_ACTIONS = ["Assign", "Status", "Follow-up"]` | `VERIFIED_DIRECT_SOURCE_EVIDENCE` — **extracted from the tablet frame itself**, not inferred from desktop. Desktop keeps its own four-item set |
| 72px rail, no desktop subtitle, two selected rows, five-column table, row pitch, pagination, full-height nav | as Section 2.7 | preserved; subtitle is `hidden xl:inline` | comparison PASS, mismatch 3.2605 (from 3.9473), row/col edge 1.0/1.0 |
| Horizontal overflow | none | none — `viewport_overflow_px = 0`, `content_overflow_px = 0` | `DERIVED_REPRODUCIBLE` — capture metadata |

## 5.4 MO-02 Leads mobile, 390x844 — repaired regions

| Region | Canonical | Implementation after repair | Provenance |
|---|---|---|---|
| Search placeholder | canonical short form using the single character U+2026 (source lines 891, 1071) | same visible short form; full descriptive string kept as the accessible name only | `VERIFIED_DIRECT_SOURCE_EVIDENCE`. The rejected `Search name, email, con...` appears at no viewport |
| Toolbar | Search / `Filters · 2` / Sort, no Status select | identical; the Status select is not rendered below `md`; `Filters · 2` is a real disclosure button that opens the facet panel | `VERIFIED_DIRECT_SOURCE_EVIDENCE` + Edge control exercise |
| Duplicate warning | `Possible duplicate — matching phone on LD-4820` | rendered from presentation state only; **no duplicate-detection field was added to the core `Lead` contract** | `PRESENTATION_TEST_STATE_REFERENCE_DATA` |
| Card sequence before the load-more control | seven cards, last is Sofia Marchetti; Derrick Vaughn does not appear before the control | seven cards in the gated canonical state, Sofia Marchetti last, Derrick Vaughn absent before the control | `VERIFIED_DIRECT_SOURCE_EVIDENCE` + Edge accessibility snapshot |
| Load-more control | literal `Load 10 more · 118 remaining`, visible inside 390x844 | identical text under the gated state; visible in-viewport; clicking loads the next deterministic batch, no duplicates, ordering preserved | see 5.5 |
| Hamburger header, title, total count, `Filters · 2` styling, Sort, duplicate styling, card hierarchy, status markers, next-step values, Open links, borders, spacing | as Section 2.8 | preserved | comparison mismatch 3.7022 (from 4.7149); tool verdict FAIL, see 5.6 |

## 5.5 `CANONICAL_PRESENTATION_INCONSISTENCY` — mobile card count versus remainder

The canonical MO-02 DOM was checked before implementing the final load-more state, as the binding
correction required. It renders **seven** cards and carries the load-more label as a **literal
string**. The arithmetic does not close: 128 - 7 = 121, not 118. 118 corresponds to ten loaded
records (128 - 10). This is Case B.

| Claim | Tag |
|---|---|
| The canonical frame shows seven cards and the literal text `Load 10 more · 118 remaining` | `VERIFIED_DIRECT_SOURCE_EVIDENCE` |
| The two are mutually inconsistent | `DERIVED_REPRODUCIBLE` — arithmetic on the recorded pagination baseline TOTAL 128 |
| The literal is reproduced only under `?visual-state=canonical` | `DERIVED_REPRODUCIBLE` — gated in source; asserted in the parity test |
| The literal is derived from the seven visible cards | **NOT CLAIMED.** It is `PRESENTATION_TEST_STATE_REFERENCE_DATA` |
| The normal interactive mobile route derives the remainder correctly as `total - loaded` | `DERIVED_REPRODUCIBLE` — `leads-data.test.tsx`, "mobile load-more, end to end > reaches every record and then reports nothing remaining" |

No hidden records were invented and no unsupported counting rule was introduced. The pagination
baseline is unchanged and single: TOTAL 128, PAGE_SIZE 10, PAGE_COUNT 13, LAST_PAGE_ROWS 8. There
is no second mobile dataset.

## 5.6 leads-mobile column-edge FAIL — new measurement, extending Section 4.9

Section 4.9 recorded that the mobile column-edge figure is a small-denominator effect on a
glyph-dominated projection, because a 390px single-column card stack has no vertical structural
rules. **That finding stands.** This section adds a second, independently measured contributor
that Section 4.9 did not identify.

Dominant differing columns in comparison space on the current pair: **x=371** (621 of 842 rows)
and **x=388** (840 rows). x=388 is the crop-window boundary and is an artifact by construction.
x=371 is the card's right border. Measuring the white card interior in source coordinates, with an
explicit white test (`r >= 250 and g >= 250 and b >= 250`) rather than a summed-channel threshold:

| Frame | canonical span | implementation span |
|---|---|---|
| leads-mobile | `18..371` = 354px | `17..372` = 356px |
| overview-mobile (**human-accepted**, byte-identical to baseline) | `21..371` = 351px | `20..372` = 353px |

The offset is identical on both frames: 1px left, 1px right. The canonical mobile capture carries
a 1px `#CDD5D9` frame border on each side, so its content box is 388px against the
implementation's 390px viewport, while both apply exactly 16px left and 16px right padding
(MO-02 source line 1077). The card is therefore 2px wider in the implementation **because of
canonical frame chrome, not a layout fault**.

Tag: `DERIVED_REPRODUCIBLE` — pixel measurement on the two border-cropped pairs.

Corroboration that the metric is not a valid acceptance signal here: the same
`col_edge_alignment` check returns FAIL on `overview-mobile` (0.7077), a frame the project owner
personally passed and whose implementation PNG is byte-identical to the accepted baseline.

An earlier probe attempt used a non-white threshold of summed channels (`sum < 720`, then `< 735`)
which caught the page background as well as borders and returned meaningless full-width runs.
That measurement is discarded; only the explicit-white measurement above is reported.

## 5.7 What is still unattributed

The `UNKNOWN_PENDING_REVIEW` row band recorded in Section 4.9 — canonical rows 581, 584, 585, 587
with no implementation edge within 13-19px, plus a 1-7px tail drift in the last card — is
**unchanged** on this build: `row_edge_alignment` is again 0.9565. No cause is asserted for it. It
is not claimed to be font metrics or antialiasing.

The five worst horizontal bands on the current leads-mobile pair are y 798-840 (6.29%), 546-588
(5.82%), 714-756 (5.53%), 336-378 (5.47%) and 252-294 (5.40%) — distributed across the card stack
rather than concentrated at one structural boundary.

## 5.8 Section 5 status

```
PHASE_3_LEADS_EXACT_STATE_CORRECTION_PENDING_HUMAN_REVIEW
```

The three Leads frames are submitted for the project owner's visual decision. leads-desktop and
leads-tablet return tool PASS; leads-mobile returns tool FAIL with the measured cause in 5.6.
**No frame is self-certified as visually accepted**, and PASS is not claimed from mismatch
percentage, edge metrics, tests, build success or screenshot generation.

---

# SECTION 6 — FINAL FUNCTIONAL ACCEPTANCE

**Authority note (2026-07-22, `CODEOUTFITTERS_PHASE_3_COMPLETE_VISUAL_AND_FUNCTIONAL_ACCEPTANCE`).**
For the **Leads tablet pager region** this section supersedes Section 5. For every other region,
Sections 2-5 stand unchanged. Nothing above has been deleted or edited away.

## 6.1 Leads tablet pager — closed

| Attribute | Canonical (T-02 908) | Before | After | Provenance |
| --- | --- | --- | --- | --- |
| glyph run width, ink | 86px | 107px | **86.422px** | Re-measured in Edge on build `jiXS21M9f0Uz4plxeGqvF`; the "before" 107px was measured on the pre-repair build and is not re-measurable on this one |
| glyph run width, outer | n/a | not recorded | **92.42px** | Re-measured in Edge on build `jiXS21M9f0Uz4plxeGqvF` (693.009→785.429) |
| clear space between items | 6–9px, mean 7.3 | 11px | **7px** | Measured; computed column-gap 1px + `md:px-[3px]` per side |
| visible glyphs | `‹  1  2  3  …  13  ›` | same | same | Observed |
| Prev/Next words | absent at this breakpoint | absent | absent | Observed |
| accessible names | — | Previous page / Next page | Previous page / Next page | Observed |

Change: `md:gap-px xl:gap-[5px]` on the pager container. Desktop and mobile keep 5px, so both
accepted frames are untouched — mismatch percentages identical to four decimal places across all
six frames before and after.

Measurement correction: an earlier draft of this row recorded the repaired ink run as 83px. That
figure is not reproducible on this build. The direct re-measurement is per-child ‹ 12.304,
1 12.304, 2 12.304, 3 12.304, … 6.304, 13 18.598, › 12.304 = 86.422px of ink at a computed 1px gap.

## 6.2 Canonical regions confirmed as presentation-only

These reproduce the canonical frames exactly and are **not** backed by Phase 3 behaviour. Recorded
so the parity is not misread as functionality:

| Region | Canonical | Implementation | Classification |
| --- | --- | --- | --- |
| Service facet counts (C-D05) | `AI Automation — 21`, `Workflow Automation — 17`, `Web Applications — 14` | staged under `?visual-state=canonical`; the normal state derives seven services from the dataset (Business Systems 23, Custom Software 20, Integrations 20, AI Automation 19, Workflow Automation 18, AI Agents 15, Web Applications 13) | PRESENTATION_STATE_ONLY |
| Filter chips (C-D05) | inert staged chips | staged chips are spans; chips created by real filters are `<button>`s named `Remove filter <label>` and work | PRESENTATION_STATE_ONLY / PASS |
| Bulk action labels (C-D05 / T-02) | `Assign`, `Change status`, `Schedule follow-up`, `Export` / `Assign`, `Status`, `Follow-up` | spans, `tabIndex -1`, `cursor: auto`, no role; only `Clear` is a real button | PRESENTATION_STATE_ONLY |
| `Columns ▾`, `Export CSV` (C-D05) | header pills | inert spans; **no export endpoint exists in the repository** | DEFERRED_PHASE_4 |
| `Source ▾`, `Appointment ▾`, `Created · Last 30d ▾` (C-D05) | toolbar pills | inert spans; no such query parameter is defined by the Phase 3 contract | PRESENTATION_STATE_ONLY |
| Overview header search, `⌘K`, `7D/30D/90D`, bell, `MR` (C-D01) | header chrome | inert; no input element exists, and the Overview aggregates are not range-parameterised | PRESENTATION_STATE_ONLY |
| Overview card actions `View queue` / `Open` / `Review` / `Prepare` (C-D01) | pill-styled actions | inert spans; targets are later-phase routes | PRESENTATION_STATE_ONLY |
| Row `↗` (C-D05) and card `›` (MO-02) | open affordances | inert; no lead detail route exists in this phase | DEFERRED_PHASE_4 |
| Duplicate warning (MO-02) | `Possible duplicate — matching phone on LD-4820` | static tinted banner, not focusable, not pill-shaped; **no duplicate field exists on the Lead schema** and the banner is absent from the normal state | PRESENTATION_STATE_ONLY |
| Load more literal (MO-02) | 7 cards, `118 remaining`, total 128 | reproduced verbatim; 7 + 118 ≠ 128 is a canonical inconsistency, not an implementation defect. The normal state is consistent at 10 + 118 = 128 | PRESENTATION_STATE_ONLY |

## 6.3 Regions in the brief that do not exist in the accepted frames

Recorded rather than invented, because adding them would change a frame the owner has accepted:

- Lead Flow `Expand` control, legend, tooltip trigger (C-D01) — absent from the DOM. NOT_APPLICABLE.
- Pipeline Journey `Statuses` control and expandable phases (C-D01) — absent. NOT_APPLICABLE.

## 6.4 Accessibility gap carried forward

> **CLOSED by SECTION 7.1** (2026-07-22, `CODEOUTFITTERS_PHASE_3_FINAL_FUNCTIONAL_DEFECT_REPAIR`).
> The text below is retained verbatim as the record of what was found and why it was deferred. The
> project owner reclassified it as a functional accessibility defect and authorized its repair. It
> is **no longer carried forward** — see §7.1 for the repaired semantics and the driven evidence.

Service facet trigger: `aria-haspopup="dialog"` with `aria-controls` null, and no role on the
collapsed popover container. The popover opens, closes on Escape and on outside click, and
restores focus. Semantic improvement, not a functional defect — not repaired in this pass because
the brief restricts changes to accepted screens to verified functional defects.

## 6.5 Remote authority

The remote DesignSync source was **not** independently byte-verified in full. No claim of 100
percent remote verification is made anywhere in this pass. Authority used: local
`Command Center Final.dc.html`, SHA-256
`758c8ae303cb89747e9835b658dc5ce05132fd3c30a072416961e6d0bcf9f522`, plus the canonical-v2
screenshot set.


---

# SECTION 7 — FINAL FUNCTIONAL DEFECT REPAIR

`CODEOUTFITTERS_PHASE_3_FINAL_FUNCTIONAL_DEFECT_REPAIR`, 2026-07-22. Build `dwkHS4GQs1RoPQCeBCyu0`,
server PID 113884.

**Authority.** Section 7 is the current authority for the four items it closes below. Sections 2-6
are retained verbatim and nothing has been deleted or edited away. Where Section 7 contradicts an
earlier section on one of those four items, **Section 7 wins**; on every other region Sections 2-6
stand unchanged.

Evidence root: `work/evidence/phase-3-final-functional-defect-repair/`.

## 7.1 §6.4 accessibility gap — CLOSED

§6.4 recorded the Service facet trigger as `aria-haspopup="dialog"` with `aria-controls` null and
no role on the collapsed popover container, and deferred it as a semantic improvement rather than
a functional defect. The project owner subsequently classified it as a functional accessibility
defect and authorized its repair. It is repaired:

| §6.4 finding | Section 7 state |
|--------------|-----------------|
| `aria-haspopup="dialog"` | **Removed.** The popup is not semantically a dialog, so the attribute was not retained |
| `aria-controls` null | `aria-controls="leads-service-facet-panel"` — stable, unique, verified unique in the DOM |
| No role on the container | `role="group"` with an accessible name |
| Option names / states unrecorded | Every option carries an accessible name and `aria-pressed` |

`aria-expanded` tracks the panel state correctly. Escape closes, outside click closes, and both
restore focus to the trigger. A 14-Tab walk from the trigger enters the panel, passes every option
and the Clear action, and leaves the panel again — proving reachability **and** the absence of a
keyboard trap. Clear is accessible and operable while a facet is applied.

Canonical visual presentation is unchanged. This is a semantics-only repair inside an accepted
frame.

Evidence: `accessibility/leads-desktop-1440x1000.json`, `accessibility/leads-tablet-820x1180.json`
(role/name/state trees plus the driven facet steps).

**§6.4 is no longer carried forward.**

## 7.2 Owner filter — CLOSED, and it was a data-model defect, not a region defect

Not a canonical-region divergence. The owner select's option list was derived from the ten rows of
the current page, so owners disappeared from the control whenever they were not on screen and the
control emptied entirely at zero results.

Repaired at the contract: the list response carries an `ownerFacets` directory
(`OwnerFacetSchema`, `packages/contracts/src/leads.ts`) computed from the whole dataset
(`computeOwnerFacets`, `apps/web/mocks/handlers/leads.ts`). The page consumes the directory and
never reads owners out of rows. An owner id absent from the directory resolves to a neutral
"Unknown owner", never "Unassigned" and never another real owner. No page-local client workaround
was used.

The canonical owner presentation — avatar initials plus label in the Owner column, and the filter
control's visual form — is unchanged. Totals (128), determinism, server-driven filtering, page
reset, sorting, pagination and mobile load-more are unchanged.

Evidence: `logs/owner-filter-zero-result.json`,
`screenshots/owner-filter-zero-result-{desktop-1440x1000,tablet-820x1180,mobile-390x844}.png`,
`BROWSER-FUNCTIONAL-RESULTS.json`.

## 7.3 Regions added by this pass

Two states now exist that canonical does not depict, both recorded so no reviewer mistakes them
for canonical divergence:

| State | Classification | Note |
|-------|----------------|------|
| Leads error state with Retry | `PRESENTATION_TEST_STATE` | Reached only via the mock-only `mock-scenario` parameter. Canonical depicts no error state. Compared against nothing; it has its own evidence and is **not** measured against the canonical normal frame |
| Zero-result Leads list with an owner still selected | Functional state | Canonical depicts no zero-result state. Presented with the canonical empty-state treatment; the owner chip and select remain populated from the directory |

## 7.4 Deferred controls inside accepted frames

Fifteen controls that previously looked enabled inside accepted frames are now clearly disabled:
twelve navigation rows (`href` null, `aria-disabled="true"`, `tabIndex 0`, explanatory `title`),
`Columns ▾` (`role="button"`, `aria-disabled="true"`, `tabIndex -1`), and the row `↗` / card `›`
affordances (inert `aria-hidden` decoration, never activatable controls).

The native `disabled` attribute was deliberately **not** used on `Columns ▾` — its user-agent
styling would move pixels inside an accepted frame. `aria-disabled` with a suppressed handler gives
the same semantics at zero visual cost. **Canonical design is preserved in every case.**

Full record: `DEFERRED-CONTROL-AUDIT.md` / `.json`.

## 7.5 Visual regression on the six accepted frames

Recaptured on this build at exact canonical dimensions, `fullPage:false`, `deviceScaleFactor:1`,
production mock build, fresh server, no resampling, `--crop-canonical-border 1 --align-content-window`.

| Frame | Result | Mismatch | width_delta | height_delta |
|-------|--------|----------|-------------|--------------|
| overview-desktop-1440x1000 | PASS | 5.2910% | 0 | 0 |
| overview-tablet-820x1180 | PASS | 1.9345% | 0 | 0 |
| overview-mobile-390x844 | FAIL | 5.4003% | 0 | 0 |
| leads-desktop-1440x1000 | PASS | 3.0919% | 0 | 0 |
| leads-tablet-820x1180 | PASS | 3.2428% | 0 | 0 |
| leads-mobile-390x844 | FAIL | 3.7022% | 0 | 0 |

The two mobile FAILs are the pre-existing scores already carried by the accepted run — unchanged by
this pass, not introduced by it, and governed by §4.9 / §5.6 which remain open as recorded. No broad
visual redesign was performed.

## 7.6 What is still unattributed

Unchanged from §5.7 and §6.5. The remote DesignSync source was still not independently
byte-verified in full, and no claim of full remote verification is made. Authority remains local
`Command Center Final.dc.html`, SHA-256
`758c8ae303cb89747e9835b658dc5ce05132fd3c30a072416961e6d0bcf9f522`, plus the canonical-v2
screenshot set. This pass added no new canonical authority.

## 7.7 Section 7 status

`PHASE_3_FINAL_FUNCTIONAL_DEFECT_REPAIR_PENDING_HUMAN_REVIEW`. `PHASE_3_COMPLETE` is not set and
Phase 4 is not authorized. Nothing was committed, pushed or deployed. The public marketing website
was not touched. No prior evidence was deleted or overwritten.
