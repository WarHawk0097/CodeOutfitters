# Full Command Center — Functional Matrix

Every enabled control is wired to the shared demo store. No enabled-looking no-op controls.
Mechanism: MSW browser worker + in-memory typed demo store (`lib/demo/store.ts`). No backend, no external DB.

## Responsive QA (Microsoft Edge / Playwright, 2026-07-23)

| Viewport | Size | Horizontal overflow | Leads render | Nav | Console errors |
|----------|------|--------------------|--------------|-----|----------------|
| Desktop | 1440×900 | none | 10 grid rows (`role="row"`) | full sidebar | 0 |
| Tablet | 768×1024 | none | 10 grid rows | collapsed | 0 |
| Mobile | 375×812 | none | 10 list cards (`role="listitem"`) | hamburger button | 0 |

Leads switches from table (`role="row"`) to card list (`role="listitem"`) below the tablet breakpoint — intentional responsive layout, verified data present in both.

## Control classes (per route)

| Route | Enabled controls | Behaviour |
|-------|-----------------|-----------|
| Dashboard | KPI cards, activity feed, quick links | Navigate / reflect shared store |
| Leads | search, owner/status/service facets, pagination, row actions, assign owner | Filter + mutate store; owner facets recompute |
| Pipeline | stage pager `‹ ›`, search, owner/service/priority filters, Clear, New opportunity | Window stages; create/move opportunities |
| Appointments | schedule, reschedule, status change, filters | Mutate appointment records |
| Meetings | select meeting, view intelligence panel, action items | Read + toggle action items |
| Proposals | create, status transition, filters | Mutate proposal records (see deviation P-D01/P-D02) |
| Follow-ups | complete, snooze, filters | Mutate follow-up queue (F-D01) |
| Email Activity | filter by type/status, open thread | Read email log (E-D01) |
| Team | add member, remove member, role change | Remove reassigns owned leads/opps to Unassigned |
| Settings | profile, workspace, notification toggles | Persist to store for session (S-D01) |

## Cross-route data consistency

Single shared store. Verified: removing a Team member reassigns their owned Leads and Pipeline opportunities to **Unassigned**, and the Leads owner-facet list drops the removed owner. Mutations are in-memory for the session only.

**Enabled controls tested: all. Failed controls: 0.**

## Mock limitations (disclosed)

- Demo mutations are client-side, in-memory, per-session — **not** production persistence. Reload resets to seed.
- No real email is sent; Email Activity and proposal/follow-up sends are simulated log entries.
- No Gmail or other provider is connected. No production credentials. No production backend.
